#!/usr/bin/env node
// Contrôle automatique des traceurs avant consentement, page par page, dans Chromium piloté
// par Playwright.
//
//   1. Avant toute interaction, dans un contexte neuf : relève les cookies, le localStorage,
//      le sessionStorage, les bases IndexedDB, et chaque requête vers un hôte tiers (type et,
//      si possible, élément à l'origine). Les requêtes tierces sont relevées puis interrompues.
//   2. Classe chaque élément : exempt-candidate (déclaré dans compliance/trackers.json),
//      non-exempt, to-review (voir scripts/lib/privacy-classify.mjs et tracker-hints.json).
//      Les commandes du bandeau sont trouvées par data-consent-action="accept|refuse|customise|manage",
//      par data-consent="accept|refuse|customise" et data-consent-open (bandeau de référence du
//      skill), ou par leur nom accessible en anglais ou en français.
//   3. Si un bandeau est trouvé : contrôle « Tout refuser » au premier niveau et au clavier,
//      recharge après refus, relève l'inventaire après acceptation, puis retire le
//      consentement par « Gérer les cookies » et recharge.
//
// Usage :
//   node scripts/check-privacy.mjs <dossier|fichier.html|URL> [options]
//     --out <fichier.json>       rapport JSON
//     --md <fichier.md>          rapport Markdown
//     --expected <fichier.json>  défauts attendus { id, page, rule, detail? } : taux de détection
//     --trackers <fichier.json>  déclaration des traceurs (défaut : <dossier>/compliance/trackers.json)
//     --wait <ms>                attente après chargement pour les traceurs différés (défaut 1000)
//     --allow-network            laisse passer les requêtes tierces (site réel ; jamais en test)
//     --no-fail                  code de sortie 0 même en cas de non-conformité
//
// Codes de sortie : 0 aucune non-conformité, 1 non-conformité trouvée, 2 erreur d'usage.

import path from 'node:path';
import { launchBrowser, freshContext, routeThirdParty } from './lib/browser.mjs';
import {
  UsageError, parseArgs, resolvePages, loadExpected, scoreExpected, summarise, expectedMarkdown, mdCell, writeOutputs, run,
} from './lib/cli.mjs';
import { loadHints, loadDeclaration, classifyStorage, classifyRequest, DECLARATION_PATH } from './lib/privacy-classify.mjs';

const CITE = {
  storage: { source: '[ePrivacy art. 5(3)] [LIL art. 82] [CNIL guidelines: exempt purposes]', refs: ['eprivacy', 'fr-loi-78-17', 'cnil-cookies-guidelines'] },
  refuse: { source: '[CNIL guidelines: refusing as simple as accepting] [CNIL recommendation: "refuse all" on the same screen and in the same format as "accept all"]', refs: ['cnil-cookies-guidelines', 'cnil-cookies-recommendation'] },
  withdraw: { source: '[GDPR art. 7(3)] [CNIL recommendation: withdrawal at any time, e.g. a "manage my cookies" link on every page]', refs: ['gdpr', 'cnil-cookies-guidelines', 'cnil-cookies-recommendation'] },
  choice: { source: '[CNIL recommendation: keeping the user\'s choice, consent or refusal]', refs: ['cnil-cookies-recommendation'] },
};

const LIMITS = [
  'The checker sees what happens in one fresh browser session per scenario, on the pages given only; it does not crawl the site.',
  'It does not see server-side processing: server logs, server-to-server tracking, data the back end sends to third parties.',
  'It does not see logged-in areas unless those pages are provided, and it does not log in.',
  'It does not see trackers triggered by later interactions (scrolling, clicks other than the consent controls, forms, timers longer than the wait).',
  'By default every third-party request is recorded and aborted: what a blocked script would have loaded or written is not seen. The blocked request itself is reported.',
  `A purpose cannot be known from a name. Items declared exempt in ${DECLARATION_PATH} are trusted; a person must check each declaration.`,
  'Browser fingerprinting, storage inside third-party iframes, Cache Storage and service workers are not inspected; IndexedDB is listed by database name only.',
  'Consent controls are found by accessible name in English and French, or by data-consent-action attributes; other wording is not recognised.',
  'The content of the consent interface (purposes, list of third parties, proof of consent, duration of the choice) is not checked.',
  'First party means same host name, ignoring the first labels (example.org and www.example.org); without the public suffix list, two sites under a shared suffix such as co.uk look like one.',
];

// Exécuté dans la page avant tout script : note quel script écrit chaque cookie ou clé de stockage.
function instrumentWrites() {
  const log = [];
  Object.defineProperty(window, '__euWebComplianceWrites', { value: log, enumerable: false });
  const scriptOf = () => {
    for (const line of String(new Error().stack || '').split('\n').slice(3)) {
      const match = line.match(/(https?:\/\/[^\s)]+?):\d+:\d+/);
      if (match) return match[1];
    }
    return null;
  };
  const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  if (cookie && cookie.set) {
    Object.defineProperty(Document.prototype, 'cookie', {
      configurable: true, enumerable: cookie.enumerable,
      get() { return cookie.get.call(this); },
      set(value) {
        log.push({ kind: 'cookie', name: String(value).split(';')[0].split('=')[0].trim(), script: scriptOf() });
        cookie.set.call(this, value);
      },
    });
  }
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function setItemRecorded(key, value) {
    let kind = 'sessionStorage';
    try {
      if (this === window.localStorage) kind = 'localStorage';
    } catch { /* stockage indisponible */ }
    log.push({ kind, name: String(key), script: scriptOf() });
    return setItem.call(this, key, value);
  };
}

// Exécuté dans la page : clés de stockage et bases IndexedDB.
async function readStorage() {
  const keys = (getStore) => {
    try {
      const store = getStore();
      return Array.from({ length: store.length }, (_, i) => store.key(i));
    } catch {
      return [];
    }
  };
  let idb = [];
  try {
    idb = (await indexedDB.databases()).map((d) => d.name).filter(Boolean);
  } catch { /* API absente */ }
  return { local: keys(() => localStorage), session: keys(() => sessionStorage), idb, writes: window.__euWebComplianceWrites || [] };
}

// Exécuté dans la page : trouve le bandeau et ses commandes, les marque par data-ewc-control.
function detectControls() {
  const cssPath = (node) => {
    const parts = [];
    for (let c = node; c && c.nodeType === 1; c = c.parentElement) {
      if (c === document.documentElement) { parts.unshift('html'); break; }
      if (c.id && document.querySelectorAll(`#${CSS.escape(c.id)}`).length === 1) { parts.unshift(`#${CSS.escape(c.id)}`); break; }
      parts.unshift(`${c.tagName.toLowerCase()}:nth-child(${Array.from(c.parentElement.children).indexOf(c) + 1})`);
    }
    return parts.join(' > ');
  };
  const nameOf = (el) => {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const byRef = ids.map((id) => (document.getElementById(id) || {}).textContent || '').join(' ').trim();
    if (byRef) return byRef;
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    if (el.tagName === 'INPUT') return (el.value || '').trim();
    return (el.innerText || el.textContent || el.title || '').replace(/\s+/g, ' ').trim();
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    return typeof el.checkVisibility === 'function' ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true;
  };
  const PATTERNS = [
    ['refuse', /(tout refuser|refuser|continuer sans accepter|non merci|\brefuse\b|\breject\b|\bdecline\b|\bdeny\b)/i],
    ['manage', /(manage (my )?cookies|cookie (settings|preferences)|g[ée]rer (les |mes )?(cookies|traceurs|pr[ée]f[ée]rences|choix)|param[eè]tres (des |de )?cookies)/i],
    ['accept', /(tout accepter|accepter|j'accepte|\baccept\b|\ballow all\b|\bagree\b)/i],
    ['customise', /(personnaliser|param[ée]trer|customi[sz]e|more options|plus d'options|pr[ée]f[ée]rences|preferences|\bsettings\b|choisir|\bchoose\b)/i],
  ];
  const ATTRIBUTE = { accept: 'accept', refuse: 'refuse', reject: 'refuse', customise: 'customise', customize: 'customise', manage: 'manage' };
  document.querySelectorAll('[data-ewc-control]').forEach((el) => el.removeAttribute('data-ewc-control'));
  const candidates = { accept: [], refuse: [], customise: [], manage: [] };
  const selector = 'button, a[href], [role="button"], [role="link"], input[type="button"], input[type="submit"], [data-consent-action], [data-consent], [data-consent-open]';
  for (const el of document.querySelectorAll(selector)) {
    // data-consent-action (convention des vérificateurs), data-consent et data-consent-open
    // (bandeau de référence templates/consent/), puis le nom accessible.
    let action = ATTRIBUTE[(el.getAttribute('data-consent-action') || el.getAttribute('data-consent') || '').toLowerCase()]
      || (el.hasAttribute('data-consent-open') ? 'manage' : null);
    if (!action) {
      const name = nameOf(el);
      if (!name || name.length > 80) continue;
      const hit = PATTERNS.find(([, regex]) => regex.test(name));
      action = hit ? hit[0] : null;
    }
    if (action) candidates[action].push(el);
  }
  const explicit = document.querySelector('[data-consent-banner], [data-consent="banner"], #consent-banner');
  let banner = explicit;
  const anchor = candidates.accept.find(visible) || candidates.refuse.find(visible) || candidates.accept[0];
  if (!banner && anchor) {
    for (let p = anchor.parentElement; p && p !== document.body; p = p.parentElement) {
      if (/cookie|traceur|tracker|consent/i.test(p.textContent || '')) { banner = p; break; }
    }
  }
  const out = { banner: banner ? { selector: cssPath(banner), visible: visible(banner), explicit: Boolean(explicit) } : null };
  for (const [action, list] of Object.entries(candidates)) {
    const inBanner = (el) => Boolean(banner && banner.contains(el));
    // Une fenêtre de réglages ouverte passe devant le bandeau : ses commandes sont les seules cliquables.
    const inOpenDialog = (el) => Boolean(el.closest('dialog[open], [role="dialog"][aria-modal="true"]:not([hidden])'));
    const chosen = list.find((el) => visible(el) && inOpenDialog(el))
      || list.find((el) => visible(el) && inBanner(el)) || list.find(visible) || list[0];
    if (!chosen) { out[action] = null; continue; }
    chosen.setAttribute('data-ewc-control', action);
    const r = chosen.getBoundingClientRect();
    out[action] = { selector: cssPath(chosen), name: nameOf(chosen), visible: visible(chosen), in_banner: inBanner(chosen),
      tag: chosen.tagName.toLowerCase(), role: chosen.getAttribute('role'), area: Math.round(r.width * r.height),
      font_size: parseFloat(getComputedStyle(chosen).fontSize) || 0 };
  }
  return out;
}

// Exécuté dans la page : élément qui a déclenché chaque requête, quand il est dans le DOM.
function findInitiators(urls) {
  const cssPath = (node) => {
    const parts = [];
    for (let c = node; c && c.nodeType === 1; c = c.parentElement) {
      if (c === document.documentElement) { parts.unshift('html'); break; }
      if (c.id) { parts.unshift(`#${CSS.escape(c.id)}`); break; }
      parts.unshift(`${c.tagName.toLowerCase()}:nth-child(${Array.from(c.parentElement.children).indexOf(c) + 1})`);
    }
    return parts.join(' > ');
  };
  const elements = Array.from(document.querySelectorAll('script[src], img[src], iframe[src], link[href], embed[src], object[data], source[src], video[src], audio[src]'));
  return urls.map((url) => {
    const el = elements.find((e) => e.src === url || e.href === url || e.data === url);
    return el ? cssPath(el) : null;
  });
}

async function settle(page, waitMs) {
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(waitMs);
}

async function openScenario(browser, url, opts) {
  const requests = [];
  const errors = [];
  const context = await freshContext(browser);
  let page = null;
  const isFirstParty = await routeThirdParty(context, {
    pageUrl: url, allowNetwork: opts.allowNetwork, getPage: () => page, onThirdParty: (entry) => requests.push(entry),
  });
  await context.addInitScript(instrumentWrites);
  page = await context.newPage();
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(url, { waitUntil: 'load' });
  await settle(page, opts.wait);
  return { context, page, requests, errors, isFirstParty };
}

async function readInventory(scenario, sinceRequest = 0) {
  const { context, page, isFirstParty } = scenario;
  const raw = await page.evaluate(readStorage);
  const writerOf = (kind, name) => {
    const writes = raw.writes.filter((w) => w.kind === kind && w.name === name);
    return writes.length ? writes[writes.length - 1].script : null;
  };
  const cookies = (await context.cookies()).map((c) => ({
    kind: 'cookie', name: c.name, party: isFirstParty(c.domain) ? 'first-party' : 'third-party', writer: writerOf('cookie', c.name),
    cookie: { name: c.name, domain: c.domain, path: c.path, expires: c.expires > 0 ? new Date(c.expires * 1000).toISOString() : 'session',
      httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite },
  }));
  const storage = [
    ...cookies,
    ...raw.local.map((name) => ({ kind: 'localStorage', name, party: 'first-party', writer: writerOf('localStorage', name) })),
    ...raw.session.map((name) => ({ kind: 'sessionStorage', name, party: 'first-party', writer: writerOf('sessionStorage', name) })),
    ...raw.idb.map((name) => ({ kind: 'indexedDB', name, party: 'first-party', writer: null })),
  ];
  const byUrl = new Map();
  for (const r of scenario.requests.slice(sinceRequest)) {
    const seen = byUrl.get(r.url);
    if (seen) seen.count += 1;
    else byUrl.set(r.url, { ...r, count: 1 });
  }
  const requests = Array.from(byUrl.values());
  const initiators = await page.evaluate(findInitiators, requests.map((r) => r.url)).catch(() => requests.map(() => null));
  requests.forEach((r, i) => { r.initiator = initiators[i]; });
  return { requests, storage };
}

const storageKey = (s) => `${s.kind}:${s.name}:${s.cookie ? s.cookie.domain : ''}`;

function classifyInventory(inventory, env) {
  return {
    requests: inventory.requests.map((r) => ({ ...r, ...classifyRequest(r, env) })),
    storage: inventory.storage.map((s) => ({ ...s, ...classifyStorage(s, env) })),
  };
}

const PHASE_TEXT = {
  'before-consent': 'before any consent choice',
  'after-refusal': 'after "refuse all" and a reload',
  'after-withdrawal': 'after consent was withdrawn and the page reloaded',
};

// Constats pour un inventaire classé. `phase` : before-consent, after-refusal, after-withdrawal.
function inventoryFindings(classified, phase) {
  const findings = [];
  for (const r of classified.requests) {
    if (r.classification === 'exempt-candidate') continue;
    const nc = r.classification === 'non-exempt';
    findings.push({ detector: 'runtime', rule: `third-party-request-${phase}`, verdict: nc ? 'NC' : 'NT', severity: nc ? 'major' : 'minor',
      ...CITE.storage, selector: r.initiator || null, request: { url: r.url, host: r.host, kind: r.kind, count: r.count },
      classification: r.classification, category: r.category || null,
      message: `${r.kind} request to ${r.host} ${PHASE_TEXT[phase]}. ${r.reason}` });
  }
  for (const s of classified.storage) {
    if (s.classification === 'exempt-candidate') continue;
    const nc = s.classification === 'non-exempt';
    findings.push({ detector: 'runtime', rule: `storage-${phase}`, verdict: nc ? 'NC' : 'NT', severity: nc ? 'major' : 'minor',
      ...CITE.storage, selector: null, storage: { kind: s.kind, name: s.name, writer: s.writer || null }, cookie: s.cookie || undefined,
      classification: s.classification, category: s.category || null,
      message: `${s.kind} "${s.name}" present ${PHASE_TEXT[phase]}. ${s.reason}` });
  }
  return findings;
}

async function clickControl(page, action) {
  // Faire défiler jusqu'à la commande avant le clic : sans cela, un clic sur une commande du pied
  // de page peut être perdu quand une iframe bloquée a modifié la mise en page.
  const control = page.locator(`[data-ewc-control="${action}"]`).first();
  await control.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  await control.click({ timeout: 3000 });
}

// Tab depuis le début du document jusqu'à atteindre la commande, au plus maxTabs appuis.
async function keyboardReaches(page, action, maxTabs = 150) {
  await page.evaluate(() => {
    const start = document.createElement('span');
    start.tabIndex = -1;
    start.id = '__ewc-focus-start';
    document.body.prepend(start);
    start.focus();
  });
  let reached = false;
  for (let i = 0; i < maxTabs && !reached; i += 1) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate((a) => Boolean(document.activeElement && document.activeElement.closest(`[data-ewc-control="${a}"]`)), action);
  }
  await page.evaluate(() => document.getElementById('__ewc-focus-start')?.remove());
  return reached;
}

function firstLevelFindings(controls) {
  const findings = [];
  const where = (controls.banner && controls.banner.selector) || (controls.accept && controls.accept.selector) || 'body';
  const refuse = controls.refuse;
  const firstLevel = refuse && refuse.visible && (refuse.in_banner || !controls.banner);
  if (!firstLevel) {
    findings.push({ detector: 'runtime', rule: 'no-first-level-refuse', verdict: 'NC', severity: 'major', ...CITE.refuse, selector: where,
      message: refuse
        ? `The consent banner shows no visible refuse control on its first level; "${refuse.name}" is only reachable after another step.`
        : 'The consent banner has no control to refuse all trackers (looked for "Refuse all", "Tout refuser" and similar names, or data-consent-action="refuse").' });
    return findings;
  }
  const accept = controls.accept;
  if (accept && accept.visible) {
    const smaller = refuse.area < accept.area * 0.5 || refuse.font_size < accept.font_size * 0.85;
    const weaker = (accept.tag === 'button' || accept.role === 'button') && refuse.tag === 'a' && refuse.role !== 'button';
    if (smaller || weaker) {
      findings.push({ detector: 'runtime', rule: 'refuse-less-prominent', verdict: 'NT', severity: 'minor', ...CITE.refuse, selector: refuse.selector,
        message: `"${refuse.name}" looks less prominent than "${accept.name}" (${weaker ? 'link next to a button' : 'smaller size or text'}). Check that refusing is presented in the same format as accepting.` });
    }
  }
  return findings;
}

async function refusalScenario(browser, url, opts, env, report) {
  const scenario = await openScenario(browser, url, opts);
  try {
    let controls = await scenario.page.evaluate(detectControls);
    report.banner = controls.banner;
    report.controls_found = Object.fromEntries(['accept', 'refuse', 'customise', 'manage'].map((a) => [a, controls[a] ? controls[a].name : null]));
    if (!controls.banner && !controls.accept && !controls.refuse) {
      report.steps.push({ step: 'find-banner', status: 'not-found', note: 'No consent banner or consent control found.' });
      return [];
    }
    report.steps.push({ step: 'find-banner', status: 'done', note: controls.banner ? controls.banner.selector : 'controls found without a banner container' });
    const findings = firstLevelFindings(controls);
    if (controls.refuse && controls.refuse.visible) {
      const reached = await keyboardReaches(scenario.page, 'refuse');
      report.steps.push({ step: 'refuse-by-keyboard', status: reached ? 'done' : 'failed', note: reached ? 'Reached with the Tab key.' : 'Not reached after 150 presses of Tab.' });
      if (!reached) {
        findings.push({ detector: 'runtime', rule: 'refuse-not-keyboard-reachable', verdict: 'NC', severity: 'major', ...CITE.refuse,
          selector: controls.refuse.selector, message: `"${controls.refuse.name}" cannot be reached with the Tab key.` });
      }
      controls = await scenario.page.evaluate(detectControls);
    }
    if (!(controls.refuse && controls.refuse.visible) && controls.customise && controls.customise.visible) {
      await clickControl(scenario.page, 'customise');
      await scenario.page.waitForTimeout(300);
      controls = await scenario.page.evaluate(detectControls);
      report.steps.push({ step: 'open-customise', status: 'done', note: `Opened "${report.controls_found.customise}" to look for a refuse control.` });
    }
    if (!(controls.refuse && controls.refuse.visible)) {
      report.steps.push({ step: 'refuse-all', status: 'skipped', note: 'No visible refuse control.' });
      return findings;
    }
    const before = new Set((await readInventory(scenario)).storage.map(storageKey));
    await clickControl(scenario.page, 'refuse');
    await settle(scenario.page, 300);
    const mark = scenario.requests.length;
    await scenario.page.reload({ waitUntil: 'load' });
    await settle(scenario.page, opts.wait);
    const inventory = await readInventory(scenario, mark);
    const fresh = { requests: inventory.requests, storage: inventory.storage.filter((s) => !before.has(storageKey(s))) };
    const classified = classifyInventory(fresh, env);
    report.inventories.after_refusal = classified;
    findings.push(...inventoryFindings(classified, 'after-refusal'));
    report.steps.push({ step: 'refuse-all', status: 'done', note: `Clicked "${controls.refuse.name}", reloaded: ${fresh.requests.length} third-party request(s), ${fresh.storage.length} new storage item(s).` });
    const again = await scenario.page.evaluate(detectControls);
    if (again.accept && again.accept.visible && again.banner && again.banner.visible) {
      findings.push({ detector: 'runtime', rule: 'choice-not-remembered', verdict: 'NT', severity: 'minor', ...CITE.choice, selector: again.banner.selector,
        message: 'The consent banner is shown again after "refuse all" and a reload: the refusal does not seem to be kept.' });
    }
    return findings;
  } finally {
    report.script_errors.push(...scenario.errors);
    await scenario.context.close();
  }
}

async function acceptWithdrawScenario(browser, url, opts, env, report) {
  const scenario = await openScenario(browser, url, opts);
  const findings = [];
  try {
    const controls = await scenario.page.evaluate(detectControls);
    if (!(controls.accept && controls.accept.visible)) {
      report.steps.push({ step: 'accept-all', status: 'skipped', note: 'No visible accept control.' });
      return findings;
    }
    const mark = scenario.requests.length;
    await clickControl(scenario.page, 'accept');
    await settle(scenario.page, 300);
    await scenario.page.reload({ waitUntil: 'load' });
    await settle(scenario.page, opts.wait);
    const accepted = classifyInventory(await readInventory(scenario, mark), env);
    report.inventories.after_accept = accepted;
    report.steps.push({ step: 'accept-all', status: 'done', note: `Clicked "${controls.accept.name}", reloaded: ${accepted.requests.length} third-party request(s), ${accepted.storage.length} storage item(s).` });

    let manage = await scenario.page.evaluate(detectControls);
    if (!(manage.manage && manage.manage.visible)) {
      report.steps.push({ step: 'withdraw', status: 'skipped', note: 'No visible "manage cookies" control after acceptance.' });
      findings.push({ detector: 'runtime', rule: 'no-withdrawal-control', verdict: 'NT', severity: 'minor', ...CITE.withdraw, selector: 'body',
        message: 'After acceptance, no visible control such as "Manage cookies" / "Gérer les cookies" was found on this page to withdraw consent.' });
      return findings;
    }
    const manageName = manage.manage.name;
    await clickControl(scenario.page, 'manage');
    await scenario.page.waitForTimeout(300);
    manage = await scenario.page.evaluate(detectControls);
    if (!(manage.refuse && manage.refuse.visible) && manage.customise && manage.customise.visible) {
      await clickControl(scenario.page, 'customise');
      await scenario.page.waitForTimeout(300);
      manage = await scenario.page.evaluate(detectControls);
    }
    if (!(manage.refuse && manage.refuse.visible)) {
      report.steps.push({ step: 'withdraw', status: 'failed', note: `Opened "${manageName}" but found no visible refuse control.` });
      findings.push({ detector: 'runtime', rule: 'no-withdrawal-control', verdict: 'NT', severity: 'minor', ...CITE.withdraw, selector: manage.manage ? manage.manage.selector : 'body',
        message: `"${manageName}" opens no visible control to refuse or withdraw consent in one step.` });
      return findings;
    }
    await clickControl(scenario.page, 'refuse');
    await settle(scenario.page, 300);
    const markReload = scenario.requests.length;
    await scenario.page.reload({ waitUntil: 'load' });
    await settle(scenario.page, opts.wait);
    const withdrawn = classifyInventory(await readInventory(scenario, markReload), env);
    report.inventories.after_withdrawal = withdrawn;
    findings.push(...inventoryFindings({ requests: withdrawn.requests, storage: [] }, 'after-withdrawal'));
    const acceptedKeys = new Set(accepted.storage.map(storageKey));
    for (const s of withdrawn.storage) {
      if (s.classification !== 'non-exempt') continue;
      const kept = acceptedKeys.has(storageKey(s));
      findings.push({ detector: 'runtime', rule: kept ? 'storage-kept-after-withdrawal' : 'storage-after-withdrawal', verdict: kept ? 'NT' : 'NC',
        severity: kept ? 'minor' : 'major', ...CITE.withdraw, selector: null, storage: { kind: s.kind, name: s.name, writer: s.writer || null },
        cookie: s.cookie || undefined, classification: s.classification,
        message: kept ? `${s.kind} "${s.name}", set after acceptance, is still present after withdrawal. Check that it is no longer read, or delete it on withdrawal.`
          : `${s.kind} "${s.name}" was written after consent was withdrawn. ${s.reason}` });
    }
    report.steps.push({ step: 'withdraw', status: 'done', note: `Opened "${manageName}", clicked "${manage.refuse.name}", reloaded: ${withdrawn.requests.length} third-party request(s).` });
    return findings;
  } finally {
    report.script_errors.push(...scenario.errors);
    await scenario.context.close();
  }
}

async function checkPage(browser, url, opts, env) {
  const report = { steps: [], inventories: {}, banner: null, controls_found: null, script_errors: [] };
  const first = await openScenario(browser, url, opts);
  let findings;
  try {
    const classified = classifyInventory(await readInventory(first), { ...env, isFirstParty: first.isFirstParty });
    report.inventories.before_consent = classified;
    findings = inventoryFindings(classified, 'before-consent');
    report.script_errors.push(...first.errors);
  } finally {
    await first.context.close();
  }
  const envWithParty = { ...env, isFirstParty: first.isFirstParty };
  findings.push(...await refusalScenario(browser, url, opts, envWithParty, report));
  if (report.steps.some((s) => s.step === 'find-banner' && s.status === 'done')) {
    findings.push(...await acceptWithdrawScenario(browser, url, opts, envWithParty, report));
  }
  return {
    findings, inventory: report.inventories,
    consent_flow: { banner: report.banner, controls_found: report.controls_found, steps: report.steps },
    script_errors: report.script_errors,
  };
}

function inventoryMarkdown(title, inv) {
  if (!inv) return [];
  const lines = [`### ${title}`, ''];
  if (!inv.requests.length && !inv.storage.length) return [...lines, 'Nothing set or requested.', ''];
  lines.push('| What | Name or host | Class |', '|------|--------------|-------|');
  for (const r of inv.requests) lines.push(`| ${r.kind} request | ${mdCell(r.url)} | ${r.classification} |`);
  for (const s of inv.storage) lines.push(`| ${s.kind} | ${mdCell(s.name)} | ${s.classification} |`);
  return [...lines, ''];
}

function toMarkdown(report) {
  const lines = ['# Automated tracker check', '',
    '> Produced by an automated tool. It is not an audit and not legal advice. Absence of findings does not establish that consent is valid; see "Limits" below.', '',
    `- Target: \`${report.target}\``, `- Date: ${report.date}`, `- Third-party requests: ${report.network}`,
    `- Tracker declaration: ${report.declaration || 'none'}`,
    `- Non-conformities: ${report.summary.non_conformities}`, `- To review: ${report.summary.to_review}`, '',
    ...expectedMarkdown(report.expected)];
  for (const page of report.pages) {
    lines.push(`## ${page.page}`, '');
    lines.push(...inventoryMarkdown('Before consent', page.inventory.before_consent));
    if (page.consent_flow.steps.length) {
      lines.push('### Consent banner', '', '| Step | Status | Note |', '|------|--------|------|');
      for (const s of page.consent_flow.steps) lines.push(`| ${s.step} | ${s.status} | ${mdCell(s.note)} |`);
      lines.push('');
    }
    lines.push(...inventoryMarkdown('After "accept all" (inventory)', page.inventory.after_accept));
    if (!page.findings.length) {
      lines.push('No finding.', '');
      continue;
    }
    lines.push('### Findings', '', '| Verdict | Severity | Rule | Item | Problem | Source |', '|---------|----------|------|------|---------|--------|');
    for (const f of page.findings) {
      const item = f.request ? f.request.url : f.storage ? `${f.storage.kind} ${f.storage.name}` : f.selector;
      lines.push(`| ${f.verdict} | ${f.severity} | ${f.rule} | ${mdCell(item)} | ${mdCell(f.message)} | ${mdCell(f.source)} |`);
    }
    lines.push('');
  }
  lines.push('## Limits', '', ...report.limits.map((l) => `- ${l}`), '');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { values: ['--out', '--md', '--expected', '--trackers', '--wait'], flags: ['--allow-network'] });
  const wait = args.wait === undefined ? 1000 : Number.parseInt(args.wait, 10);
  if (!Number.isInteger(wait) || wait < 0) throw new UsageError('--wait : entier positif ou nul attendu (millisecondes)');
  const target = args.targets[0];
  const expectedList = await loadExpected(args.expected);
  const hints = await loadHints();
  const { pages, root, server } = await resolvePages(target);
  const results = [];
  let browserName = null;
  let declarationUsed = null;
  try {
    const declarationFile = args.trackers || (root ? path.join(root, DECLARATION_PATH) : null);
    const declaration = await loadDeclaration(declarationFile);
    if (args.trackers && !declaration.file) throw new UsageError(`--trackers : introuvable : ${args.trackers}`);
    declarationUsed = declaration.file;
    const launched = await launchBrowser();
    browserName = launched.browserName;
    try {
      for (const p of pages) {
        const result = await checkPage(launched.browser, p.url, { wait, allowNetwork: Boolean(args.allowNetwork) }, { hints, declaration });
        results.push({ page: p.page, url: p.url, ...result });
      }
    } finally {
      await launched.browser.close();
    }
  } finally {
    if (server) await server.close();
  }
  const allFindings = results.flatMap((r) => r.findings);
  const report = {
    tool: 'eu-web-compliance check-privacy',
    disclaimer: 'Automated check. Not an audit, not legal advice. Absence of findings does not establish that consent is valid.',
    target, date: new Date().toISOString(), browser: browserName,
    network: args.allowNetwork ? 'allowed (live site)' : 'recorded and aborted',
    declaration: declarationUsed ? path.relative(process.cwd(), declarationUsed).split(path.sep).join('/') : null,
    summary: summarise(allFindings), pages: results, limits: LIMITS,
  };
  if (expectedList) report.expected = scoreExpected(expectedList, results);
  await writeOutputs(args, report, toMarkdown(report));
  const s = report.summary;
  process.stdout.write(`${pages.length} page(s), ${s.non_conformities} non-conformité(s), ${s.to_review} point(s) à revoir\n`);
  if (report.expected) process.stdout.write(`défauts attendus détectés : ${report.expected.detected}/${report.expected.total}\n`);
  return args.fail && s.non_conformities > 0 ? 1 : 0;
}

run(main);
