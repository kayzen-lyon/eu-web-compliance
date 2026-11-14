/* Cirelune: demonstration handler of the withdrawal function (templates/consumer/withdrawal-function.js).
   It only simulates a server: a real site POSTs the statement to its own endpoint, which records the date
   and time of receipt, sends the acknowledgement email with the content of the statement, and answers
   { receivedAt, reference }. Nothing leaves the browser here. */
(function () {
  'use strict';
  window.euWithdrawal.setHandler(function () {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve({ receivedAt: new Date().toISOString(), reference: 'DEMO-' + Date.now().toString(36).toUpperCase() });
      }, 300);
    });
  });
}());
