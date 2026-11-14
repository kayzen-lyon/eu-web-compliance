/* Faulty version (OS-P-10): asks again on every page when the visitor refused everything,
   by deleting a refusal before the consent loader reads it. */
(function () {
  'use strict';
  var prefix = 'eu-consent=';
  var stored = document.cookie.split('; ').filter(function (part) { return part.indexOf(prefix) === 0; })[0];
  if (!stored) {
    return;
  }
  try {
    var choice = JSON.parse(decodeURIComponent(stored.slice(prefix.length)));
    var values = Object.keys(choice.p || {}).map(function (key) { return choice.p[key]; });
    if (values.length && values.every(function (value) { return value === false; })) {
      document.cookie = prefix + '; Max-Age=0; Path=/';
    }
  } catch (error) {
    document.cookie = prefix + '; Max-Age=0; Path=/';
  }
}());
