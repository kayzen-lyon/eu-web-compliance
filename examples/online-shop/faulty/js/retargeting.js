/* Faulty version (OS-P-07): loads the retargeting tag once the visitor has answered the banner,
   whatever the answer. It should test window.euConsent.has('marketing'). */
(function () {
  'use strict';
  if (window.euConsent && window.euConsent.get()) {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://bat.bing.com/bat.js';
    document.head.appendChild(script);
  }
}());
