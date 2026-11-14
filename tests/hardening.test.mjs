// Tests de sûreté communs aux quatre vérificateurs : navigateur introuvable, page en erreur,
// requêtes qui modifieraient des données, dossiers de sortie, serveur statique, check-examples.
// Lancement : node --test tests/
//
// Les tests de bout en bout lancent un navigateur (Chromium de Playwright, sinon Edge ou Chrome)
// sur des serveurs locaux : rien ne sort sur le réseau.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { parseHeadersFile, startStaticServer } from '../scripts/lib/static-server.mjs';
import { ROOT, runScript, runReport } from './helpers.mjs';

const CHECKERS = ['check-a11y.mjs', 'check-privacy.mjs', 'check-security.mjs', 'check-content.mjs'];
const SECURITY_GOOD = path.join(ROOT, 'tests', 'fixtures', 'security', 'good');

// Petit site servi sur 127.0.0.1 : `routes` associe un chemin à [statut, type, corps] ; les
// requêtes qui ne sont ni GET ni HEAD sont relevées dans `writes`.
function siteServer(routes) {
  const writes = [];
  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') writes.push(`${req.method} ${req.url}`);
    const [status, type, body] = routes[new URL(req.url, 'http://x').pathname] || [404, 'text/plain', 'not found'];
    res.writeHead(status, { 'content-type': type }).end(body);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    writes, origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => { server.close(r); server.closeAllConnections(); }),
  })));
}

const html = (body, lang = 'en') => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>Test</title></head><body>${body}</body></html>`;

describe('navigateur introuvable', () => {
  for (const script of CHECKERS) {
    test(`${script} s'arrête avec le code 2, sans rester bloqué`, { timeout: 60000 }, async () => {
      const result = await runScript(script, [SECURITY_GOOD], { EWC_BROWSER_PATH: path.join(os.tmpdir(), 'no-such-browser.exe') });
      assert.equal(result.code, 2, result.stderr);
      assert.match(result.stderr, /aucun navigateur utilisable/);
    });
  }
});

describe('page en erreur HTTP', () => {
  let site;
  before(async () => { site = await siteServer({}); });
  after(async () => { await site.close(); });

  for (const script of CHECKERS) {
    test(`${script} : une page 404 n'est pas analysée et ne donne jamais un résultat vide`, { timeout: 120000 }, async () => {
      const run = await runReport(script, [`${site.origin}/missing.html`, '--no-fail']);
      const findings = run.report.pages.flatMap((p) => p.findings);
      const notAnalysed = findings.filter((f) => f.rule === 'page-not-analysed');
      assert.equal(notAnalysed.length, 1, JSON.stringify(findings.map((f) => f.rule)));
      assert.equal(notAnalysed[0].verdict, 'NT');
      assert.match(notAnalysed[0].message, /HTTP 404/);
      assert.ok(run.report.summary.to_review >= 1);
    });
  }
});

describe('aucune donnée envoyée à la place d\'un visiteur', () => {
  let site;
  before(async () => {
    site = await siteServer({
      '/index.html': [200, 'text/html', html(`<main><h1>Shop</h1>
<script>fetch('/collect', { method: 'POST', body: 'x' }).catch(() => {}); navigator.sendBeacon && navigator.sendBeacon('/beacon', 'x');</script>
<section aria-label="Cookies" data-consent-banner><p>We use cookies.</p>
<form method="post" action="/consent"><button type="submit">Accept all</button><button type="submit">Refuse all</button></form></section>
<form method="post" action="/chat"><button>Chat with our assistant</button></form>
<form method="post" action="/order"><button type="submit">Withdraw from contract here</button></form>
<p><a href="/legal.html">Legal notice</a></p></main>`)],
      '/legal.html': [200, 'text/html', html('<main><h1>Legal notice</h1></main>')],
    });
  });
  after(async () => { await site.close(); });

  for (const script of CHECKERS) {
    test(`${script} n'envoie aucune requête POST`, { timeout: 120000 }, async () => {
      await runReport(script, [`${site.origin}/index.html`, '--no-fail']);
      assert.deepEqual(site.writes, []);
    });
  }
});

describe('check-content : page d\'identification liée inaccessible', () => {
  test('un refus d\'accès (403, pare-feu) est à revoir, pas une non-conformité', { timeout: 120000 }, async () => {
    const site = await siteServer({
      '/index.html': [200, 'text/html', html('<main><h1>Accueil</h1></main><footer><a href="/mentions-legales.html">Mentions légales</a></footer>', 'fr')],
      '/mentions-legales.html': [403, 'text/html', 'forbidden'],
    });
    try {
      const run = await runReport('check-content.mjs', [`${site.origin}/index.html`]);
      const f = run.report.pages.flatMap((p) => p.findings).find((x) => x.rule === 'legal-notice-unreachable');
      assert.ok(f, 'constat legal-notice-unreachable attendu');
      assert.equal(f.verdict, 'NT');
      assert.match(f.message, /HTTP 403/);
    } finally {
      await site.close();
    }
  });
});

describe('check-privacy : bandeau dont aucune commande de refus n\'est reconnue', () => {
  test('à revoir (NT) : le libellé peut simplement ne pas être reconnu', { timeout: 120000 }, async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-privacy-'));
    try {
      await fs.writeFile(path.join(dir, 'index.html'), html(`<main><h1>Home</h1></main>
<div data-consent-banner role="region" aria-label="Cookies"><p>We use cookies.</p>
<button type="button">Accept all</button> <button type="button">Not now</button></div>`));
      const run = await runReport('check-privacy.mjs', [dir, '--wait', '0']);
      const f = run.report.pages[0].findings.find((x) => x.rule === 'no-first-level-refuse');
      assert.ok(f);
      assert.equal(f.verdict, 'NT');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe('dossiers de sortie', () => {
  test('--out et --md dans un dossier qui n\'existe pas encore', { timeout: 120000 }, async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-out-'));
    try {
      const out = path.join(dir, 'a', 'b', 'report.json');
      const md = path.join(dir, 'c', 'report.md');
      const result = await runScript('check-security.mjs', [SECURITY_GOOD, '--out', out, '--md', md]);
      assert.ok(result.code === 0 || result.code === 1, result.stderr);
      assert.ok(JSON.parse(await fs.readFile(out, 'utf8')).summary);
      assert.match(await fs.readFile(md, 'utf8'), /^# /);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe('static-server', () => {
  test('ne sert pas les fichiers cachés (.env, .git), sauf .well-known', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-static-'));
    await fs.mkdir(path.join(dir, '.git'));
    await fs.mkdir(path.join(dir, '.well-known'));
    await fs.writeFile(path.join(dir, '.env'), 'SECRET=1');
    await fs.writeFile(path.join(dir, '.git', 'config'), '[core]');
    await fs.writeFile(path.join(dir, '.well-known', 'security.txt'), 'Contact: mailto:x@example.org');
    await fs.writeFile(path.join(dir, 'index.html'), 'ok');
    const server = await startStaticServer(dir);
    try {
      for (const p of ['/.env', '/.git/config', '/sub/../.env', '/%2Eenv']) assert.equal((await fetch(`${server.origin}${p}`)).status, 404, p);
      assert.equal((await fetch(`${server.origin}/.well-known/security.txt`)).status, 200);
      assert.equal((await fetch(`${server.origin}/`)).status, 200);
    } finally {
      await server.close();
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('valeur d\'en-tête invalide : erreur claire à la lecture du fichier, pas un 404 silencieux', () => {
    assert.throws(() => parseHeadersFile('/*\n  X-Note: café € 1\n'), /ligne 2/);
    assert.doesNotThrow(() => parseHeadersFile('/*\n  X-Note: plain ascii; ok=1\n'));
  });
});

describe('check-examples', () => {
  test('--site inconnu : erreur d\'usage (code 2)', async () => {
    const result = await runScript('check-examples.mjs', ['--site', 'no-such-site']);
    assert.equal(result.code, 2);
    assert.match(result.stderr, /no-such-site/);
  });
});
