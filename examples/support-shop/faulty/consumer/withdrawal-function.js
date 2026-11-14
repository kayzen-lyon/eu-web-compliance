/*
  Reference online withdrawal function (eu-web-compliance, MIT licence).
  Read templates/consumer/README.md before using it.

  Flow: "Withdraw from contract here" -> online withdrawal statement (name, contract, email)
        -> "Confirm withdrawal" -> on-screen acknowledgement with the content and the date and time.
  Sources: Directive 2011/83/EU, Article 11a; France: code de la consommation, L. 221-21 and D. 221-5.

  No backend and no network request of its own. The site provides the sending function:

    window.euWithdrawal.setHandler(async (statement) => {
      // statement = { name, contractId, email, locale, text }
      // Send it to your server. The server records the date and time of receipt, sends the
      // acknowledgement on a durable medium (an email with this content) and answers:
      return { receivedAt: '2026-11-14T10:00:00Z', reference: 'W-123' }; // reference is optional
    });

  If the handler throws, or returns no receivedAt, the person is told the statement was NOT sent,
  and keeps what they typed.
*/
(function () {
  'use strict';

  var TEXTS = {
    en: {
      title: 'Withdraw from a contract',
      intro: 'You can withdraw from a contract concluded on this site during the withdrawal period, without giving any reason.',
      openLabel: 'Withdraw from contract here',
      statementTitle: 'Your withdrawal statement',
      statementIntro: 'Fill in or check the three fields below, then select "Confirm withdrawal". You do not need to give a reason. All fields are required.',
      nameLabel: 'Your name',
      contractLabel: 'Order number',
      contractHint: 'It is in your order confirmation email, for example 2026-001234.',
      emailLabel: 'Email address for the confirmation',
      emailHint: 'We send the acknowledgement of your withdrawal to this address.',
      confirmLabel: 'Confirm withdrawal',
      statementText: 'I withdraw from the contract identified below.',
      errorName: 'Your name: enter your name, for example Alex Martin',
      errorContract: 'Order number: enter the number from your order confirmation, for example 2026-001234',
      errorEmail: 'Email address: enter an address in the format name@example.com',
      errorsOne: 'There is 1 error in the statement',
      errorsMany: 'There are {n} errors in the statement',
      sending: 'Sending your withdrawal statement.',
      sendError: 'Your withdrawal statement could not be sent. Nothing was lost: check your connection and select "Confirm withdrawal" again, or contact us by email.',
      ackTitle: 'Your withdrawal has been sent',
      ackTime: 'We received it on {date}.',
      ackReference: 'Reference: {ref}',
      ackEmail: 'An acknowledgement with this content and this date and time is sent to {email}. Keep it.',
      ackContentTitle: 'Content of your statement',
      ackStatus: 'Withdrawal sent.',
      dtStatement: 'Statement',
      dtName: 'Name',
      dtContract: 'Order number',
      dtEmail: 'Email for the confirmation'
    },
    fr: {
      title: 'Se rétracter d\'un contrat',
      intro: 'Vous pouvez vous rétracter d\'un contrat conclu sur ce site pendant le délai de rétractation, sans avoir à donner de motif.',
      openLabel: 'Renoncer au contrat ici',
      statementTitle: 'Votre déclaration de rétractation',
      statementIntro: 'Remplissez ou vérifiez les trois champs ci-dessous, puis choisissez « Confirmer la rétractation ». Vous n\'avez pas à donner de motif. Tous les champs sont obligatoires.',
      nameLabel: 'Votre nom',
      contractLabel: 'Numéro de commande',
      contractHint: 'Il figure dans le courriel de confirmation de commande, par exemple 2026-001234.',
      emailLabel: 'Adresse électronique pour la confirmation',
      emailHint: 'Nous envoyons l\'accusé de réception de votre rétractation à cette adresse.',
      confirmLabel: 'Confirmer la rétractation',
      statementText: 'Je me rétracte du contrat identifié ci-dessous.',
      errorName: 'Votre nom : saisissez votre nom, par exemple Alex Martin',
      errorContract: 'Numéro de commande : saisissez le numéro de votre confirmation de commande, par exemple 2026-001234',
      errorEmail: 'Adresse électronique : saisissez une adresse au format nom@exemple.fr',
      errorsOne: 'La déclaration contient 1 erreur',
      errorsMany: 'La déclaration contient {n} erreurs',
      sending: 'Envoi de votre déclaration de rétractation.',
      sendError: 'Votre déclaration de rétractation n\'a pas pu être envoyée. Rien n\'est perdu : vérifiez votre connexion et choisissez de nouveau « Confirmer la rétractation », ou écrivez-nous.',
      ackTitle: 'Votre rétractation a été envoyée',
      ackTime: 'Nous l\'avons reçue le {date}.',
      ackReference: 'Référence : {ref}',
      ackEmail: 'Un accusé de réception reprenant ce contenu, cette date et cette heure est envoyé à {email}. Conservez-le.',
      ackContentTitle: 'Contenu de votre déclaration',
      ackStatus: 'Rétractation envoyée.',
      dtStatement: 'Déclaration',
      dtName: 'Nom',
      dtContract: 'Numéro de commande',
      dtEmail: 'Adresse pour la confirmation'
    }
  };

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var handler = null;

  function fill(template, values) {
    return Object.keys(values).reduce(function (text, key) {
      return text.split('{' + key + '}').join(values[key]);
    }, template);
  }

  function readConfig(root) {
    var node = root.querySelector('script[type="application/json"][data-wd-config]');
    if (!node) return {};
    try {
      return JSON.parse(node.textContent) || {};
    } catch (error) {
      return {};
    }
  }

  function pickLocale(root, config) {
    var declared = config.locale || (root.closest('[lang]') || document.documentElement).lang || 'en';
    return declared.toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en';
  }

  function applyTexts(root, texts) {
    root.querySelectorAll('[data-text]').forEach(function (node) {
      var value = texts[node.getAttribute('data-text')];
      if (typeof value === 'string') node.textContent = value;
    });
  }

  function formatDate(iso, locale) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    try {
      return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeStyle: 'long' }).format(date);
    } catch (error) {
      return date.toString();
    }
  }

  function setup(root) {
    var config = readConfig(root);
    var locale = pickLocale(root, config);
    var texts = Object.assign({}, TEXTS[locale], config.texts || {});
    var openButton = root.querySelector('[data-wd-open]');
    var statement = root.querySelector('[data-wd-statement]');
    var statementTitle = statement.querySelector('[data-wd-statement-title]');
    var form = root.querySelector('[data-wd-form]');
    var summary = root.querySelector('[data-wd-errors]');
    var sendError = root.querySelector('[data-wd-send-error]');
    var ack = root.querySelector('[data-wd-ack]');
    var status = root.querySelector('[data-wd-status]');
    var submitButton = form.querySelector('button[type="submit"]');
    var fields = {
      name: { input: form.elements.name, message: texts.errorName, valid: function (v) { return v.length > 0; } },
      contractId: { input: form.elements.contractId, message: texts.errorContract, valid: function (v) { return v.length > 0; } },
      email: { input: form.elements.email, message: texts.errorEmail, valid: function (v) { return EMAIL.test(v); } }
    };
    var sending = false;

    applyTexts(root, texts);
    var prefill = config.prefill || {};
    Object.keys(fields).forEach(function (key) {
      if (typeof prefill[key] === 'string' && !fields[key].input.value) fields[key].input.value = prefill[key];
    });

    openButton.addEventListener('click', function () {
      ack.hidden = true;
      statement.hidden = false;
      openButton.setAttribute('aria-expanded', 'true');
      statementTitle.focus();
    });

    function showErrors(errors) {
      var heading = summary.querySelector('[data-wd-errors-title]');
      heading.textContent = errors.length === 1 ? texts.errorsOne : fill(texts.errorsMany, { n: String(errors.length) });
      summary.querySelector('ul').replaceChildren.apply(summary.querySelector('ul'), errors.map(function (error) {
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + error.input.id;
        link.textContent = error.message;
        link.addEventListener('click', function (event) {
          event.preventDefault();
          error.input.focus();
        });
        item.append(link);
        return item;
      }));
      summary.hidden = false;
      summary.focus();
    }

    function validate() {
      return Object.keys(fields).reduce(function (errors, key) {
        var field = fields[key];
        var ok = field.valid(field.input.value.trim());
        var slot = document.getElementById(field.input.id + '-error');
        slot.textContent = ok ? '' : field.message;
        if (ok) {
          field.input.removeAttribute('aria-invalid');
          return errors;
        }
        field.input.setAttribute('aria-invalid', 'true');
        return errors.concat([{ input: field.input, message: field.message }]);
      }, []);
    }

    function renderAck(sent, result) {
      var list = ack.querySelector('[data-wd-ack-content]');
      var rows = [
        [texts.dtStatement, sent.text],
        [texts.dtName, sent.name],
        [texts.dtContract, sent.contractId],
        [texts.dtEmail, sent.email]
      ];
      list.replaceChildren.apply(list, rows.reduce(function (nodes, row) {
        var term = document.createElement('dt');
        var value = document.createElement('dd');
        term.textContent = row[0];
        value.textContent = row[1];
        return nodes.concat([term, value]);
      }, []));
      var time = document.createElement('time');
      time.dateTime = result.receivedAt;
      time.textContent = formatDate(result.receivedAt, locale);
      var parts = fill(texts.ackTime, { date: '\u0000' }).split('\u0000');
      var timeLine = ack.querySelector('[data-wd-ack-time]');
      timeLine.replaceChildren(parts[0], time, parts[1] || '');
      var refLine = ack.querySelector('[data-wd-ack-reference]');
      refLine.textContent = result.reference ? fill(texts.ackReference, { ref: String(result.reference) }) : '';
      refLine.hidden = !result.reference;
      ack.querySelector('[data-wd-ack-email]').textContent = fill(texts.ackEmail, { email: sent.email });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (sending) return;
      sendError.textContent = '';
      var errors = validate();
      if (errors.length > 0) {
        showErrors(errors);
        return;
      }
      summary.hidden = true;
      var sent = Object.freeze({
        name: fields.name.input.value.trim(),
        contractId: fields.contractId.input.value.trim(),
        email: fields.email.input.value.trim(),
        locale: locale,
        text: texts.statementText
      });
      sending = true;
      submitButton.setAttribute('aria-disabled', 'true');
      status.textContent = texts.sending;

      var send = handler
        ? Promise.resolve().then(function () { return handler(sent); })
        : Promise.reject(new Error('No withdrawal handler: call euWithdrawal.setHandler()'));

      send.then(function (result) {
        if (!result || typeof result.receivedAt !== 'string' || isNaN(new Date(result.receivedAt).getTime())) {
          throw new Error('The handler must return { receivedAt } recorded by the server');
        }
        renderAck(sent, result);
        statement.hidden = true;
        openButton.setAttribute('aria-expanded', 'false');
        ack.hidden = false;
        status.textContent = texts.ackStatus;
        ack.querySelector('[data-wd-ack-title]').focus();
      }).catch(function () {
        status.textContent = '';
        sendError.textContent = texts.sendError;
        submitButton.focus();
      }).then(function () {
        sending = false;
        submitButton.removeAttribute('aria-disabled');
      });
    });
  }

  window.euWithdrawal = Object.freeze({
    setHandler: function (fn) {
      if (typeof fn !== 'function') throw new TypeError('euWithdrawal.setHandler expects a function');
      handler = fn;
    },
    texts: TEXTS
  });

  function start() {
    document.querySelectorAll('[data-withdrawal]').forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
