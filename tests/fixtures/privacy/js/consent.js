// Minimal consent loader for the checker fixtures. Not the reference banner of the skill
// (see templates/consent/): it only does what the tests need.
// Scripts that need consent are declared <script type="text/plain" data-consent-purpose="..." src="...">
// and are re-created as real scripts after acceptance.
(function () {
  var KEY = 'ewc-consent';

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* storage unavailable */ }
  }
  function byAction(action, id) {
    return document.querySelector('[data-consent-action="' + action + '"]') || document.getElementById(id);
  }
  function banner() {
    return document.querySelector('[data-consent-banner]') || document.getElementById('consent-banner');
  }
  function show(visible) {
    var b = banner();
    if (b) b.hidden = !visible;
    var panel = document.getElementById('consent-panel');
    if (panel && !visible) panel.hidden = true;
  }
  function activate() {
    document.querySelectorAll('script[type="text/plain"][data-consent-purpose]').forEach(function (placeholder) {
      var script = document.createElement('script');
      script.src = placeholder.getAttribute('src');
      script.async = true;
      placeholder.replaceWith(script);
    });
  }
  function deleteTrackerCookies() {
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (/^_ga/.test(name)) document.cookie = name + '=; Max-Age=0; path=/';
    });
  }
  function on(element, handler) {
    if (element) element.addEventListener('click', handler);
  }

  on(byAction('accept', 'consent-accept'), function () { save('accepted'); show(false); activate(); });
  on(byAction('refuse', 'consent-refuse'), function () { save('refused'); show(false); deleteTrackerCookies(); });
  on(byAction('customise', 'consent-customise'), function () {
    var panel = document.getElementById('consent-panel');
    if (panel) panel.hidden = false;
  });
  on(byAction('manage', 'consent-manage'), function () { show(true); });

  var choice = read();
  if (choice === 'accepted') activate();
  else if (choice !== 'refused') show(true);
}());
