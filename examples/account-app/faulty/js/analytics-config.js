/* Audience measurement configuration. Declared in the pages as <script type="text/plain"
   data-consent-purpose="analytics">: the consent loader runs it only after consent. */
window.dataLayer = window.dataLayer || [];
window.gtag = function gtag() {
  'use strict';
  window.dataLayer.push(arguments);
};
window.gtag('js', new Date());
window.gtag('config', 'G-LRK0EXAMPLE');
