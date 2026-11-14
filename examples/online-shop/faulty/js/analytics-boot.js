/* Faulty version (OS-P-03): loads the analytics library at start-up, without asking for consent. */
(function () {
  'use strict';
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.google-analytics.com/analytics.js';
  document.head.appendChild(script);
}());
