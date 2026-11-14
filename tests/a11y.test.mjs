// Tests de scripts/check-a11y.mjs et de ses modules (scripts/lib/a11y-catalogue.mjs).
// Lancement : node --test tests/
//
// Les tests de bout en bout lancent un navigateur (Chromium de Playwright, sinon Edge ou Chrome).

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { collectTexts } from '../scripts/lib/a11y-catalogue.mjs';
import { runReport } from './helpers.mjs';

async function tempSite(files) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-a11y-'));
  for (const [name, text] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await fs.writeFile(path.join(dir, name), text);
  }
  return dir;
}

describe('a11y-catalogue: fichiers lus pour les motifs textuels', () => {
  test('un chemin qui sort de la racine servie n\'est jamais lu', async () => {
    const dir = await tempSite({ 'secret.js': 'SECRET', 'site/index.html': '' });
    try {
      const html = '<script src="../secret.js"></script><script src="/../../secret.js"></script><link rel="stylesheet" href="../../secret.js">';
      const texts = await collectTexts(path.join(dir, 'site'), 'index.html', html);
      assert.deepEqual(texts.filter((t) => t.text === 'SECRET'), []);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('feuille de style liée sans guillemets', async () => {
    const dir = await tempSite({ 'style.css': 'a { color: red }', 'Upper.css': 'b { color: blue }' });
    try {
      const html = '<link rel=stylesheet href=style.css><link rel="stylesheet" href=Upper.css>';
      const texts = await collectTexts(dir, 'index.html', html);
      assert.deepEqual(texts.filter((t) => t.kind === 'css').map((t) => t.file), ['style.css', 'Upper.css']);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

// Serveur « tiers » sur localhost : la page est servie par 127.0.0.1, un autre site.
function countingServer() {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(`${req.method} ${req.url}`);
    res.writeHead(200, { 'content-type': 'text/javascript' }).end('');
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, hits, port: server.address().port })));
}

describe('check-a11y: réseau', () => {
  test('aucune requête vers un hôte tiers ne quitte le navigateur (dossier local)', async () => {
    const third = await countingServer();
    const dir = await tempSite({ 'index.html': `<!doctype html><html lang="en"><head><title>T</title>
<script src="http://localhost:${third.port}/tag.js"></script></head>
<body><main><h1>T</h1><img src="http://localhost:${third.port}/pixel.gif" alt=""></main></body></html>` });
    try {
      const run = await runReport('check-a11y.mjs', [dir, '--no-fail', '--catalogue', 'none']);
      assert.deepEqual(third.hits, []);
      assert.equal(run.report.network, 'third-party requests aborted');
      assert.ok(run.report.pages[0].third_party_requests.some((u) => u.includes('/tag.js')));
    } finally {
      third.server.close();
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe('check-a11y: dossier local avec un fichier _headers', () => {
  test('la CSP du site n\'empêche pas l\'analyse', async () => {
    const dir = await tempSite({
      '_headers': "/*\n  Content-Security-Policy: default-src 'self'; script-src 'self'\n",
      'index.html': '<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>T</h1><img src="x.png"></main></body></html>',
    });
    try {
      const run = await runReport('check-a11y.mjs', [dir, '--no-fail', '--catalogue', 'none']);
      assert.ok(run.report.pages[0].findings.some((f) => f.source === 'axe' && f.rule === 'image-alt'));
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe('check-a11y: indicateur de focus', () => {
  test('heuristique : point à revoir (NT), jamais une non-conformité', async () => {
    const dir = await tempSite({ 'index.html': `<!doctype html><html lang="en"><head><title>T</title>
<style>a:focus, button:focus { outline: none; }</style></head>
<body><main><h1>T</h1><p><a href="#x" id="x">Link one</a> <button type="button">Button two</button></p></main></body></html>` });
    try {
      const run = await runReport('check-a11y.mjs', [dir, '--no-fail', '--catalogue', 'none']);
      const focus = run.report.pages[0].findings.filter((f) => f.rule === 'focus-indicator');
      assert.ok(focus.length >= 1);
      assert.deepEqual([...new Set(focus.map((f) => f.verdict))], ['NT']);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
