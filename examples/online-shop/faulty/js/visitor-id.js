/* Faulty version (OS-P-06): gives every browser a persistent identifier, before any consent. */
(function () {
  'use strict';
  if (document.cookie.indexOf('visitor_id=') === -1) {
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    document.cookie = 'visitor_id=' + id + '; Max-Age=31536000; Path=/; SameSite=Lax';
  }
}());
