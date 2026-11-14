/*
 * Reference consent loader (eu-web-compliance, MIT licence).
 *
 * What it does, with no dependency and no network request of its own:
 *   - shows the banner when no valid choice is stored (none, expired, or an older configuration version);
 *   - keeps scripts declared as <script type="text/plain" data-consent-purpose="..."> inert until their purpose
 *     is accepted, then activates them;
 *   - keeps embeds inside <template data-consent-content> until their purpose is accepted, then inserts them;
 *   - stores the choice (per purpose true/false, date, version) in a first-party cookie or in localStorage, nothing else;
 *   - on withdrawal, deletes the site's own cookies and storage entries declared for the purpose and reloads the page
 *     if code of that purpose already ran;
 *   - calls the optional proof hook with a minimal record. Sending it to a server is the project's decision.
 *
 * Public API (window.euConsent): get(), has(purpose), open(), onChange(fn), onRecord(fn), reset().
 * Read templates/consent/README.md for installation and verification.
 */
(function () {
  'use strict';

  var DEFAULTS = {
    version: '1',
    maxAgeMonths: 6,
    storage: 'cookie',
    storageKey: 'eu-consent',
    reloadOnWithdraw: true,
    focusTarget: 'main'
  };
  var PURPOSE_ID = /^[a-z0-9][a-z0-9-]*$/;
  var MESSAGES = {
    accept: 'All trackers accepted.',
    refuse: 'All trackers refused.',
    custom: 'Your choices are saved.',
    contextual: 'Your choice is saved. The content is loaded.'
  };

  var config = DEFAULTS;
  var banner = null;
  var settings = null;
  var statusRegion = null;
  var purposes = [];
  var current = null;
  var activated = new Set();
  var restoredPlaceholders = new Map();
  var changeListeners = [];
  var recordListeners = [];

  function readConfig() {
    var node = document.getElementById('eu-consent-config');
    var parsed = {};
    if (node) {
      try {
        parsed = JSON.parse(node.textContent || '{}');
      } catch (error) {
        reportError('eu-consent: the configuration is not valid JSON; defaults are used.', error);
      }
    }
    var merged = Object.assign({}, DEFAULTS, parsed);
    var months = Number(merged.maxAgeMonths);
    merged.maxAgeMonths = months > 0 ? months : DEFAULTS.maxAgeMonths;
    merged.storage = merged.storage === 'localStorage' ? 'localStorage' : 'cookie';
    merged.version = String(merged.version);
    return merged;
  }

  function reportError(message, error) {
    if (window.console && typeof window.console.error === 'function') {
      window.console.error(message, error || '');
    }
  }

  function splitList(value) {
    return (value || '').split(/\s+/).filter(Boolean);
  }

  function readPurposes() {
    if (!settings) return [];
    return Array.prototype.map.call(settings.querySelectorAll('fieldset[data-purpose]'), function (fieldset) {
      return {
        id: fieldset.getAttribute('data-purpose'),
        cookies: splitList(fieldset.getAttribute('data-cookies')),
        storage: splitList(fieldset.getAttribute('data-storage'))
      };
    }).filter(function (purpose) {
      if (PURPOSE_ID.test(purpose.id)) return true;
      reportError('eu-consent: ignored purpose with an invalid id: ' + purpose.id);
      return false;
    });
  }

  function purposeIds() {
    return purposes.map(function (purpose) { return purpose.id; });
  }

  /* ---------- Storage of the choice: only the choice, its date and the configuration version ---------- */

  function addMonths(date, months) {
    var result = new Date(date.getTime());
    result.setMonth(result.getMonth() + months);
    return result;
  }

  function readRaw() {
    try {
      if (config.storage === 'localStorage') return window.localStorage.getItem(config.storageKey);
      var prefix = config.storageKey + '=';
      var found = document.cookie.split('; ').filter(function (part) { return part.indexOf(prefix) === 0; })[0];
      return found ? decodeURIComponent(found.slice(prefix.length)) : null;
    } catch (error) {
      reportError('eu-consent: the stored choice could not be read.', error);
      return null;
    }
  }

  function isValidChoice(data) {
    if (!data || typeof data !== 'object' || data.v !== config.version || typeof data.d !== 'string') return false;
    var date = new Date(data.d);
    if (isNaN(date.getTime()) || addMonths(date, config.maxAgeMonths) <= new Date()) return false;
    if (!data.p || typeof data.p !== 'object') return false;
    return purposeIds().every(function (id) { return typeof data.p[id] === 'boolean'; });
  }

  function readChoice() {
    var raw = readRaw();
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      return isValidChoice(data) ? data : null;
    } catch (error) {
      return null;
    }
  }

  function writeChoice(choices) {
    var now = new Date();
    var data = { v: config.version, d: now.toISOString(), p: choices };
    var value = JSON.stringify(data);
    try {
      if (config.storage === 'localStorage') {
        window.localStorage.setItem(config.storageKey, value);
      } else {
        var maxAge = Math.round((addMonths(now, config.maxAgeMonths).getTime() - now.getTime()) / 1000);
        var secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = config.storageKey + '=' + encodeURIComponent(value) +
          '; Max-Age=' + maxAge + '; Path=/; SameSite=Lax' + secure;
      }
    } catch (error) {
      reportError('eu-consent: the choice could not be stored; it applies to this page only.', error);
    }
    return data;
  }

  /* ---------- Removal of the site's own trackers on withdrawal ---------- */

  function matches(name, pattern) {
    return pattern.slice(-1) === '*' ? name.indexOf(pattern.slice(0, -1)) === 0 : name === pattern;
  }

  function domainVariants() {
    var parts = window.location.hostname.split('.');
    var variants = [''];
    for (var i = 0; i < parts.length - 1; i += 1) {
      variants.push('; Domain=' + parts.slice(i).join('.'));
    }
    return variants;
  }

  function deleteCookies(patterns) {
    if (!patterns.length) return;
    var names = document.cookie.split('; ').map(function (part) { return part.split('=')[0]; }).filter(Boolean);
    var paths = ['/', window.location.pathname];
    names.forEach(function (name) {
      if (name === config.storageKey || !patterns.some(function (pattern) { return matches(name, pattern); })) return;
      domainVariants().forEach(function (domain) {
        paths.forEach(function (path) {
          document.cookie = name + '=; Max-Age=0; Path=' + path + domain;
        });
      });
    });
  }

  function deleteStorage(patterns) {
    if (!patterns.length) return;
    [window.localStorage, window.sessionStorage].forEach(function (store) {
      try {
        var keys = [];
        for (var i = 0; i < store.length; i += 1) keys.push(store.key(i));
        keys.forEach(function (key) {
          if (key !== config.storageKey && patterns.some(function (pattern) { return matches(key, pattern); })) {
            store.removeItem(key);
          }
        });
      } catch (error) {
        reportError('eu-consent: a storage area could not be cleaned.', error);
      }
    });
  }

  /* ---------- Activation of scripts and embeds ---------- */

  function allAccepted(attribute, choices) {
    var needed = splitList(attribute);
    return needed.length > 0 && needed.every(function (id) { return choices[id] === true; });
  }

  function activateScript(original) {
    var script = document.createElement('script');
    Array.prototype.forEach.call(original.attributes, function (attribute) {
      if (attribute.name === 'type' || attribute.name === 'data-consent-purpose') return;
      script.setAttribute(attribute.name, attribute.value);
    });
    var type = original.getAttribute('data-consent-type');
    if (type) script.type = type;
    if (original.nonce) script.nonce = original.nonce;
    if (original.src) {
      script.async = original.hasAttribute('async');
    } else {
      script.textContent = original.textContent;
    }
    script.setAttribute('data-consent-activated', original.getAttribute('data-consent-purpose'));
    original.parentNode.replaceChild(script, original);
  }

  function activatePlaceholder(placeholder) {
    var template = placeholder.querySelector('template[data-consent-content]');
    if (!template) return;
    var wrapper = document.createElement('div');
    wrapper.setAttribute('data-consent-activated', placeholder.getAttribute('data-consent-purpose'));
    wrapper.appendChild(template.content.cloneNode(true));
    restoredPlaceholders.set(wrapper, placeholder);
    var focusWasInside = placeholder.contains(document.activeElement);
    placeholder.parentNode.replaceChild(wrapper, placeholder);
    if (focusWasInside) {
      var focusable = wrapper.querySelector('iframe, a[href], button, video, audio, [tabindex]');
      if (focusable) focusable.focus();
    }
  }

  function applyChoice(choices) {
    document.querySelectorAll('script[type="text/plain"][data-consent-purpose]').forEach(function (script) {
      if (allAccepted(script.getAttribute('data-consent-purpose'), choices)) {
        splitList(script.getAttribute('data-consent-purpose')).forEach(function (id) { activated.add(id); });
        activateScript(script);
      }
    });
    document.querySelectorAll('[data-consent-placeholder][data-consent-purpose]').forEach(function (placeholder) {
      if (allAccepted(placeholder.getAttribute('data-consent-purpose'), choices)) {
        splitList(placeholder.getAttribute('data-consent-purpose')).forEach(function (id) { activated.add(id); });
        activatePlaceholder(placeholder);
      }
    });
  }

  function restorePlaceholders(withdrawn) {
    restoredPlaceholders.forEach(function (placeholder, wrapper) {
      var ids = splitList(wrapper.getAttribute('data-consent-activated'));
      if (ids.some(function (id) { return withdrawn.indexOf(id) !== -1; }) && wrapper.parentNode) {
        wrapper.parentNode.replaceChild(placeholder, wrapper);
        restoredPlaceholders.delete(wrapper);
      }
    });
  }

  /* ---------- Recording a choice ---------- */

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function notify(listeners, value) {
    listeners.forEach(function (listener) {
      try {
        listener(value);
      } catch (error) {
        reportError('eu-consent: a listener failed.', error);
      }
    });
  }

  function record(choices, method) {
    var previous = current ? current.p : null;
    var stored = writeChoice(choices);
    current = stored;
    var withdrawn = previous ? purposeIds().filter(function (id) {
      return previous[id] === true && choices[id] !== true;
    }) : [];

    withdrawn.forEach(function (id) {
      var purpose = purposes.filter(function (item) { return item.id === id; })[0];
      deleteCookies(purpose.cookies);
      deleteStorage(purpose.storage);
    });

    var proof = {
      id: randomId(),
      timestamp: stored.d,
      version: stored.v,
      choices: Object.assign({}, choices),
      method: withdrawn.length ? 'withdrawal' : method
    };
    notify(recordListeners, proof);
    notify(changeListeners, Object.assign({}, choices));
    document.dispatchEvent(new CustomEvent('eu-consent:change', { detail: Object.assign({}, choices) }));

    var mustReload = withdrawn.some(function (id) { return activated.has(id); });
    if (mustReload && config.reloadOnWithdraw) {
      window.location.reload();
      return false;
    }
    restorePlaceholders(withdrawn);
    applyChoice(choices);
    return true;
  }

  function uniform(value) {
    var choices = {};
    purposeIds().forEach(function (id) { choices[id] = value; });
    return choices;
  }

  function choicesFromForm() {
    var choices = {};
    purposeIds().forEach(function (id) {
      var checked = settings.querySelector('input[name="' + id + '"]:checked');
      choices[id] = Boolean(checked && checked.value === 'accept');
    });
    return choices;
  }

  /* ---------- Interface ---------- */

  function announce(message) {
    if (!statusRegion) return;
    statusRegion.textContent = '';
    window.setTimeout(function () { statusRegion.textContent = message; }, 50);
  }

  function focusMain() {
    var target = document.querySelector(config.focusTarget);
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  }

  function closeBanner() {
    if (!banner || banner.hidden) return;
    var focusWasInside = banner.contains(document.activeElement);
    banner.hidden = true;
    if (focusWasInside) focusMain();
  }

  function decide(choices, method) {
    if (record(choices, method)) {
      closeBanner();
      announce(MESSAGES[method] || MESSAGES.custom);
    }
  }

  function fillForm() {
    purposeIds().forEach(function (id) {
      var accepted = Boolean(current && current.p[id] === true);
      var input = settings.querySelector('input[name="' + id + '"][value="' + (accepted ? 'accept' : 'refuse') + '"]');
      if (input) input.checked = true;
    });
  }

  function openSettings() {
    if (!settings || typeof settings.showModal !== 'function') return;
    fillForm();
    settings.showModal();
  }

  function onSettingsClose() {
    var value = settings.returnValue;
    settings.returnValue = '';
    if (value === 'accept') decide(uniform(true), 'accept');
    else if (value === 'refuse') decide(uniform(false), 'refuse');
    else if (value === 'save') decide(choicesFromForm(), 'custom');
    /* "cancel", Escape or an empty value change nothing. Focus returns to the opener natively;
       if the opener was in the banner, closeBanner() has moved focus to the main content. */
  }

  function onBannerClick(event) {
    var button = event.target.closest('[data-consent]');
    if (!button) return;
    var action = button.getAttribute('data-consent');
    if (action === 'accept') decide(uniform(true), 'accept');
    else if (action === 'refuse') decide(uniform(false), 'refuse');
    else if (action === 'customise') openSettings();
  }

  function onDocumentClick(event) {
    if (event.target.closest('[data-consent-open]')) {
      openSettings();
      return;
    }
    var allow = event.target.closest('[data-consent-allow]');
    if (!allow) return;
    var id = allow.getAttribute('data-consent-allow');
    if (purposeIds().indexOf(id) === -1) return;
    var choices = Object.assign(uniform(false), current ? current.p : {});
    choices[id] = true;
    if (record(choices, 'contextual')) announce(MESSAGES.contextual);
  }

  function init() {
    config = readConfig();
    banner = document.getElementById('consent-banner');
    settings = document.getElementById('consent-settings');
    statusRegion = document.getElementById('consent-status');
    purposes = readPurposes();
    current = readChoice();
    if (banner) banner.addEventListener('click', onBannerClick);
    if (settings) settings.addEventListener('close', onSettingsClose);
    document.addEventListener('click', onDocumentClick);
    if (current) {
      applyChoice(current.p);
    } else if (banner) {
      banner.hidden = false;
    }
  }

  window.euConsent = {
    get: function () { return current ? Object.assign({}, current.p) : null; },
    has: function (purpose) { return Boolean(current && current.p[purpose] === true); },
    open: function () { openSettings(); },
    onChange: function (listener) { if (typeof listener === 'function') changeListeners.push(listener); },
    onRecord: function (listener) { if (typeof listener === 'function') recordListeners.push(listener); },
    reset: function () {
      try {
        if (config.storage === 'localStorage') window.localStorage.removeItem(config.storageKey);
        else document.cookie = config.storageKey + '=; Max-Age=0; Path=/';
      } catch (error) {
        reportError('eu-consent: the stored choice could not be removed.', error);
      }
      window.location.reload();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
