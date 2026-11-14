/* Faulty version: a sales countdown that restarts from ten minutes on every page load. */
(function () {
  'use strict';
  var left = 600;
  var output = document.getElementById('soldes-temps');
  function show() {
    output.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
  }
  show();
  window.setInterval(function () {
    left = left > 0 ? left - 1 : 0;
    show();
  }, 1000);
}());
