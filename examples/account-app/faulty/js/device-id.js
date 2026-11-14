/* Faulty version (AA-P-06): gives every browser a stable identifier for "fraud scoring",
   before any consent and without declaring it. */
(function () {
  'use strict';
  try {
    if (!window.localStorage.getItem('fp_device_id')) {
      window.localStorage.setItem('fp_device_id', 'dev-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    }
  } catch (error) {
    /* storage unavailable */
  }
}());
