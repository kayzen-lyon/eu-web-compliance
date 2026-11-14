/* Larkspur Reading Circle: example site of the eu-web-compliance project (faulty version: defects planted on purpose, see expected-privacy.json and expected-security.json).
   There is no server: forms are handled here and nothing is sent or stored.
   Personal data are never written to localStorage or sessionStorage. */
(function () {
  'use strict';

  function onSubmit(id, handler) {
    var form = document.getElementById(id);
    if (!form) {
      return;
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      handler(form);
    });
  }

  function say(id, message) {
    var status = document.getElementById(id);
    if (status) {
      status.textContent = message;
    }
  }

  /* Faulty version (AA-S-10): the answer says whether the address has an account. */
  var MEMBERS = ['jordan.sample@example.com'];

  function resetMessage(email) {
    return MEMBERS.indexOf(email.toLowerCase()) === -1
      ? 'No account is registered with this address.'
      : 'We have sent a link to choose a new password to this address. (Demo: nothing was sent.)';
  }

  function exportData() {
    var data = {};
    document.querySelectorAll('#member-data [data-field]').forEach(function (dd) {
      data[dd.getAttribute('data-field')] = dd.textContent.trim();
    });
    var blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), account: data }, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'larkspur-account-data.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    say('export-status', 'Your data file larkspur-account-data.json has been downloaded.');
  }

  function init() {
    onSubmit('sign-up-form', function () {
      say('sign-up-status', 'Your account is created. (Demo: nothing was sent.) You can now go to your account.');
    });
    onSubmit('sign-in-form', function () {
      window.location.assign('account.html');
    });
    onSubmit('reset-form', function () {
      say('reset-status', resetMessage(document.getElementById('email').value.trim()));
    });
    onSubmit('newsletter-form', function (form) {
      say('newsletter-status', form.elements.newsletter.checked
        ? 'You are subscribed to the newsletter. (Demo: nothing was sent.)'
        : 'You are not subscribed to the newsletter. (Demo: nothing was sent.)');
    });
    onSubmit('delete-form', function () {
      say('delete-status', 'Your request is recorded: we delete your account within one month and confirm by email. (Demo: nothing was sent.)');
    });
    var exportButton = document.getElementById('export-data');
    if (exportButton) {
      exportButton.addEventListener('click', exportData);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
