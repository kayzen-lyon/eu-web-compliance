// Tests des composants livrés dans templates/ (ai-chat.js, consent.js).
// Lancement : node --test tests/
//
// Les motifs de ai-chat.js sont testés sans navigateur (vm) ; le comportement des composants,
// dans un navigateur (Chromium de Playwright, sinon Edge ou Chrome), sur une page locale.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { ROOT } from './helpers.mjs';

const AI_CHAT = path.join(ROOT, 'templates', 'ai', 'ai-chat.js');
const CONSENT = path.join(ROOT, 'templates', 'consent', 'consent.js');

describe('ai-chat.js : questions sur la nature de l\'interlocuteur (sans navigateur)', () => {
  let isIdentityQuestion;
  before(async () => {
    const window = {};
    const document = { readyState: 'complete', querySelectorAll: () => [] };
    vm.runInNewContext(await fs.readFile(AI_CHAT, 'utf8'), { window, document });
    isIdentityQuestion = window.aiChatIsIdentityQuestion;
  });

  test('anglais et français, avec ou sans accent, apostrophe droite ou typographique', () => {
    for (const q of ['Are you a human?', 'am I talking to a real person', 'I’m talking to a bot?', 'Êtes-vous un humain ?',
      'Etes-vous un robot ?', 'étes vous une IA', 'Es-tu un humain ?', 'vous êtes un robot ?', 't\'es un humain ?', 't’es un bot ?',
      'T’es une IA ?', 'c’est un robot ?', 'c\'est une vraie personne ?', 'Je parle à un humain ?']) {
      assert.ok(isIdentityQuestion(q), q);
    }
    for (const q of ['Where is my order?', 'Les tests sont-ils prêts ?', 'Vous êtes ouverts le dimanche ?']) {
      assert.ok(!isIdentityQuestion(q), q);
    }
  });
});

// Panneau minimal de templates/ai/ai-chat-disclosure.html, sans le lanceur.
function chatPage({ lang = 'en', attributes = '' } = {}) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>Chat</title></head><body>
<section id="ai-chat" class="ai-chat" data-ai-chat data-greeting="Hello, I am an AI." data-error-message="Error." ${attributes}>
  <div class="ai-chat__log" role="log"><ol class="ai-chat__messages"></ol></div>
  <form class="ai-chat__form"><textarea></textarea><button type="submit">Send</button></form>
  <div class="ai-chat__status" role="status"></div>
</section></body></html>`;
}

describe('composants dans un navigateur', () => {
  let browser;
  before(async () => { ({ browser } = await launchBrowser()); });
  after(async () => { if (browser) await browser.close(); });

  async function openChat(html, respond) {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setContent(html);
    if (respond) await page.evaluate(respond);
    await page.addScriptTag({ path: AI_CHAT });
    const send = async (text) => {
      await page.fill('textarea', text);
      await page.click('button[type="submit"]');
    };
    const messages = () => page.$$eval('.ai-msg', (items) => items.map((i) => i.textContent.replace(/\s+/g, ' ').trim()));
    return { page, errors, send, messages, status: () => page.textContent('.ai-chat__status') };
  }

  test('ai-chat.js : réponse honnête par défaut si data-identity-answer manque, et erreur signalée', async () => {
    for (const [lang, word] of [['en', /\bAI\b/], ['fr', /\bIA\b/]]) {
      const chat = await openChat(chatPage({ lang }));
      await chat.send(lang === 'fr' ? 'Êtes-vous un humain ?' : 'Are you a human?');
      const last = (await chat.messages()).pop();
      assert.match(last, word, last);
      assert.ok(chat.errors.some((e) => /data-identity-answer/.test(e)), chat.errors.join('\n'));
      await chat.page.close();
    }
  });

  test('ai-chat.js : « est en train d\'écrire » n\'est plus annoncé après une réponse rapide', async () => {
    const chat = await openChat(chatPage(), () => { window.aiChatRespond = () => Promise.resolve('Quick answer.'); });
    await chat.send('Where is my order?');
    await chat.page.waitForTimeout(400);
    assert.equal((await chat.status()).trim(), '');
    await chat.page.close();
  });

  test('ai-chat.js : séparateur du libellé et message d\'attente configurables (typographie française)', async () => {
    const chat = await openChat(chatPage({ lang: 'fr', attributes: 'data-assistant-label="Assistant IA" data-user-label="Vous" data-label-suffix=" :" data-writing-message="{name} est en train d’écrire une réponse."' }),
      () => { window.aiChatRespond = () => new Promise(() => {}); });
    await chat.send('Où est ma commande ?');
    await chat.page.waitForTimeout(400);
    const labels = await chat.page.$$eval('.ai-msg__who', (items) => items.map((i) => i.textContent));
    assert.deepEqual(labels, ['Assistant IA :', 'Vous :']);
    assert.equal((await chat.status()).trim(), 'Assistant IA est en train d’écrire une réponse.');
    await chat.page.close();
  });

  test('ai-chat.js : sans réglage, libellés et message d\'attente inchangés', async () => {
    const chat = await openChat(chatPage({ attributes: 'data-writing-message="is writing an answer."' }),
      () => { window.aiChatRespond = () => new Promise(() => {}); });
    await chat.send('Where is my order?');
    await chat.page.waitForTimeout(400);
    const labels = await chat.page.$$eval('.ai-msg__who', (items) => items.map((i) => i.textContent));
    assert.deepEqual(labels, ['AI assistant:', 'You:']);
    assert.equal((await chat.status()).trim(), 'AI assistant is writing an answer.');
    await chat.page.close();
  });

  test('consent.js : une cible de focus invalide ne bloque pas l\'annonce du choix enregistré', async () => {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setContent(`<!doctype html><html lang="en"><head><title>Consent</title>
<script type="application/json" id="eu-consent-config">{"storage": "localStorage", "focusTarget": "main["}</script></head>
<body><main><h1>Home</h1></main>
<div id="consent-banner" hidden><p>Cookies</p><button type="button" data-consent="refuse">Refuse all</button></div>
<div id="consent-status" role="status"></div></body></html>`);
    await page.addScriptTag({ path: CONSENT });
    await page.click('[data-consent="refuse"]');
    await page.waitForTimeout(300);
    assert.deepEqual(errors, []);
    assert.equal(await page.isHidden('#consent-banner'), true);
    assert.equal((await page.textContent('#consent-status')).trim(), 'All trackers refused.');
    await page.close();
  });
});
