/* Marketing pixel configuration. Declared as <script type="text/plain"
   data-consent-purpose="marketing">: the consent loader runs it only after consent. */
(function () {
  'use strict';
  if (window.fbq) {
    return;
  }
  var queue = [];
  window.fbq = function fbq() {
    queue.push(arguments);
  };
  window.fbq.queue = queue;
  window.fbq('init', '000000000000000');
  window.fbq('track', 'PageView');
}());
