// AI chat disclosure behaviour (eu-web-compliance, MIT licence).
// Read templates/ai/README.md before using it. No dependency, no network request of its own.
//
// What this script guarantees, whatever the model answers:
//   - the panel shows the AI notice before the first message can be sent (it is in the HTML);
//   - the first assistant turn repeats that the visitor is talking to an AI;
//   - every message is labelled with its speaker in text, so screen readers hear "AI assistant" each time;
//   - a question such as "are you a human?" gets a fixed, honest answer from the page itself,
//     before and independently of the model, so a model that role-plays cannot deny being an AI.
//
// Wiring the real assistant: define window.aiChatRespond = async (message, history) => 'answer text'
// before this script runs, or later. It must return plain text; the script inserts it with
// textContent, never as HTML. Without it, the demo answer in data-demo-answer is used.

(function () {
  'use strict';

  // Questions about the nature of the counterpart, in English and French (illustrations; extend
  // for the languages of the site). Kept broad on purpose: a false positive costs one honest sentence.
  var IDENTITY_PATTERNS = [
    /\b(are|r)\s+(you|u)\s+(a\s+|an\s+)?(real\s+)?(human|person|people|robot|bot|machine|ai|computer)\b/i,
    /\b(am\s+i|i\s+am|i'm)\s+(talking|speaking|chatting|writing)\s+(to|with)\s+(a\s+|an\s+)?(real\s+)?(human|person|robot|bot|machine|ai|computer)\b/i,
    /\bis\s+this\s+(a\s+|an\s+)?(real\s+)?(human|person|robot|bot|ai)\b/i,
    /(?:^|\s)(êtes|es)[\s-]*(vous|tu)\s+(un|une)?\s*(vrai(e)?\s+)?(humain|personne|robot|ia|machine|intelligence artificielle)\b/i,
    /\b(vous|tu)\s+(êtes|es)\s+(un|une)\s+(vrai(e)?\s+)?(humain|personne|robot|ia|machine|intelligence artificielle)\b/i,
    /\bje\s+(parle|discute|écris)\s+(à|a|avec)\s+(un|une)\s+(vrai(e)?\s+)?(humain|personne|robot|ia|machine)\b/i,
    /\bc'est\s+(un|une)\s+(vrai(e)?\s+)?(humain|personne|robot|ia)\b/i
  ];

  function isIdentityQuestion(text) {
    return IDENTITY_PATTERNS.some(function (re) { return re.test(text); });
  }

  function appendMessage(log, who, text, modifier) {
    var item = document.createElement('li');
    item.className = 'ai-msg ai-msg--' + modifier;
    var label = document.createElement('span');
    label.className = 'ai-msg__who';
    label.textContent = who + ':';
    var body = document.createElement('p');
    body.className = 'ai-msg__text';
    body.textContent = text;
    item.append(label, body);
    log.querySelector('.ai-chat__messages').append(item);
    log.scrollTop = log.scrollHeight;
    return item;
  }

  function setStatus(region, message) {
    region.textContent = '';
    window.setTimeout(function () { region.textContent = message; }, 100);
  }

  function initChat(panel) {
    var launcher = document.querySelector('[aria-controls="' + panel.id + '"]');
    var log = panel.querySelector('.ai-chat__log');
    var form = panel.querySelector('.ai-chat__form');
    var field = form.querySelector('textarea');
    var status = panel.querySelector('.ai-chat__status');
    var close = panel.querySelector('.ai-chat__close');
    var assistantName = panel.dataset.assistantLabel || 'AI assistant';
    var userName = panel.dataset.userLabel || 'You';
    var history = [];
    var greeted = false;

    function greet() {
      if (greeted) { return; }
      greeted = true;
      appendMessage(log, assistantName, panel.dataset.greeting, 'assistant');
    }

    function open() {
      panel.hidden = false;
      if (launcher) { launcher.setAttribute('aria-expanded', 'true'); }
      greet();
      field.focus();
    }

    function hide() {
      panel.hidden = true;
      if (launcher) {
        launcher.setAttribute('aria-expanded', 'false');
        launcher.focus();
      }
    }

    if (launcher) {
      launcher.addEventListener('click', function () {
        if (panel.hidden) { open(); } else { hide(); }
      });
    } else {
      greet();
    }
    if (close) { close.addEventListener('click', hide); }
    panel.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && launcher) { hide(); }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = field.value.trim();
      if (!text) {
        setStatus(status, panel.dataset.emptyMessage || 'Type a message first.');
        field.focus();
        return;
      }
      field.value = '';
      appendMessage(log, userName, text, 'user');
      history.push({ role: 'user', content: text });

      if (isIdentityQuestion(text)) {
        var honest = panel.dataset.identityAnswer;
        appendMessage(log, assistantName, honest, 'assistant');
        history.push({ role: 'assistant', content: honest });
        return;
      }

      setStatus(status, assistantName + ' ' + (panel.dataset.writingMessage || 'is writing an answer.'));
      var respond = typeof window.aiChatRespond === 'function'
        ? window.aiChatRespond
        : function () { return Promise.resolve(panel.dataset.demoAnswer); };

      Promise.resolve()
        .then(function () { return respond(text, history.slice()); })
        .then(function (answer) {
          var reply = String(answer || '').trim() || panel.dataset.errorMessage;
          appendMessage(log, assistantName, reply, 'assistant');
          history.push({ role: 'assistant', content: reply });
          status.textContent = '';
        })
        .catch(function () {
          appendMessage(log, assistantName, panel.dataset.errorMessage, 'assistant');
          status.textContent = '';
        });
    });
  }

  function start() {
    document.querySelectorAll('.ai-chat[data-ai-chat]').forEach(initChat);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Exposed for tests of the identity check; not needed by the page.
  window.aiChatIsIdentityQuestion = isIdentityQuestion;
}());
