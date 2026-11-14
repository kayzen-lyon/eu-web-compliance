// Tests des vérificateurs scripts/check-privacy.mjs et scripts/check-security.mjs, et des
// modules partagés de scripts/lib/. Lancement : node --test tests/
//
// Les tests d'intégration lancent un navigateur (Chromium de Playwright, sinon Edge ou Chrome).
// Toute requête vers un hôte tiers est interrompue par les vérificateurs : rien ne sort sur le réseau.

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHeadersFile, headersForPath, startStaticServer } from '../scripts/lib/static-server.mjs';
import { normaliseBaseline, loadBaseline, evaluateHeaders, parseCsp, parseSetCookie } from '../scripts/lib/security-baseline.mjs';
import { loadHints, loadDeclaration, classifyStorage, classifyRequest } from '../scripts/lib/privacy-classify.mjs';
import { firstPartyPredicate, siteOf } from '../scripts/lib/browser.mjs';
import { scoreExpected } from '../scripts/lib/cli.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures');
const BASELINE = path.join(FIXTURES, 'security', 'headers-baseline.json');

function runChecker(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', script), ...args], { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function runReport(script, args) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-checkers-'));
  const out = path.join(dir, 'report.json');
  const md = path.join(dir, 'report.md');
  const result = await runChecker(script, [...args, '--out', out, '--md', md]);
  assert.ok(result.code === 0 || result.code === 1, `${script} a échoué (code ${result.code}) : ${result.stderr}`);
  const report = JSON.parse(await fs.readFile(out, 'utf8'));
  const markdown = await fs.readFile(md, 'utf8');
  await fs.rm(dir, { recursive: true, force: true });
  return { ...result, report, markdown };
}

const nc = (page) => page.findings.filter((f) => f.verdict === 'NC');
const pageOf = (report, name) => {
  const page = report.pages.find((p) => p.page === name);
  assert.ok(page, `page ${name} absente du rapport`);
  return page;
};

// ---- Modules partagés ------------------------------------------------------------------

describe('static-server: fichier _headers', () => {
  test('applique /* et les chemins exacts, garde Set-Cookie en liste', () => {
    const rules = parseHeadersFile('# commentaire\n/*\n  X-A: 1\n  X-A: 2\n/page.html\n  Set-Cookie: a=1\n  Set-Cookie: b=2\n/dossier/*\n  X-B: oui\n');
    assert.deepEqual(headersForPath(rules, '/page.html'), { 'x-a': '1, 2', 'set-cookie': ['a=1', 'b=2'] });
    assert.deepEqual(headersForPath(rules, '/dossier/x.html'), { 'x-a': '1, 2', 'x-b': 'oui' });
    assert.deepEqual(headersForPath(rules, '/autre.html'), { 'x-a': '1, 2' });
  });

  test('index.html correspond aussi au chemin du dossier', () => {
    const rules = parseHeadersFile('/\n  X-Root: 1\n');
    assert.equal(headersForPath(rules, '/index.html')['x-root'], '1');
  });

  test('erreur claire sur une ligne mal formée', () => {
    assert.throws(() => parseHeadersFile('  X-Orphelin: 1\n'), /ligne 1/);
    assert.throws(() => parseHeadersFile('/*\n  pas un en-tête\n'), /ligne 2/);
  });

  test('le serveur applique les en-têtes et ne sert pas le fichier .headers', async () => {
    const server = await startStaticServer(path.join(FIXTURES, 'security', 'good'));
    try {
      assert.equal(server.headersFile, '.headers');
      const page = await fetch(`${server.origin}/index.html`);
      assert.equal(page.status, 200);
      assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
      assert.match(page.headers.getSetCookie()[0], /HttpOnly/);
      const hidden = await fetch(`${server.origin}/.headers`);
      assert.equal(hidden.status, 404);
      const escape = await fetch(`${server.origin}/..%2F..%2Fheaders-baseline.json`);
      assert.equal(escape.status, 404);
    } finally {
      await server.close();
    }
  });
});

describe('browser: premier et tiers', () => {
  test('même site pour les sous-domaines, tiers sinon', () => {
    const isFirst = firstPartyPredicate('https://www.example.org/page');
    assert.equal(isFirst('https://cdn.example.org/a.js'), true);
    assert.equal(isFirst('.example.org'), true);
    assert.equal(isFirst('https://www.googletagmanager.com/gtag/js'), false);
    assert.equal(siteOf('127.0.0.1'), '127.0.0.1');
  });
});

describe('security-baseline: chargement et évaluation', () => {
  test('tolère les champs inconnus et donne des valeurs par défaut', () => {
    const baseline = normaliseBaseline({ headers: [{ name: 'X-Content-Type-Options', futur: true }], inconnu: 1 });
    assert.equal(baseline.headers[0].required, 'always');
    assert.deepEqual(baseline.headers[0].checks.map((c) => c.type), ['present']);
    assert.ok(baseline.cookies.checks.some((c) => c.attribute === 'SameSite'));
    assert.ok(baseline.csp.forbidden.some((f) => f.id === 'unsafe-eval'));
    assert.deepEqual(baseline.absent, []);
  });

  test('erreur claire sur une base mal formée', () => {
    assert.throws(() => normaliseBaseline([]), /objet JSON attendu/);
    assert.throws(() => normaliseBaseline({ headers: {} }), /headers/);
    assert.throws(() => normaliseBaseline({ headers: [{}] }), /name/);
    assert.throws(() => normaliseBaseline({ headers: [{ name: 'X', required: 'parfois' }] }), /required/);
    assert.throws(() => normaliseBaseline({ headers: [{ name: 'X', check: 'equals' }] }), /value/);
  });

  test('CSP : nonce neutralise unsafe-inline, unsafe-eval et data: signalés', async () => {
    const baseline = await loadBaseline(BASELINE);
    const withNonce = evaluateHeaders({ headers: [{ name: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'nonce-abc' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" }], https: false, isHtml: true }, baseline);
    assert.ok(!withNonce.findings.some((f) => f.rule === 'csp-unsafe-inline' || f.rule === 'csp-forbidden-source'));
    const weak = evaluateHeaders({ headers: [{ name: 'Content-Security-Policy', value: "script-src * 'unsafe-eval'" }], https: false, isHtml: true }, baseline);
    const rules = weak.findings.map((f) => f.rule);
    assert.ok(rules.includes('csp-unsafe-eval'));
    assert.ok(rules.includes('csp-permissive-script-source'));
    assert.ok(rules.includes('no-framing-protection'));
    assert.equal(parseCsp("a 'x'; b, c").length, 2);
  });

  test('HSTS : évalué en HTTPS et sur le serveur local (tel que déclaré), pas sur un site distant en HTTP', async () => {
    const baseline = await loadBaseline(BASELINE);
    const remoteHttp = evaluateHeaders({ headers: [], https: false, local: false, isHtml: true }, baseline);
    assert.ok(!remoteHttp.findings.some((f) => f.header === 'Strict-Transport-Security'));
    assert.ok(remoteHttp.not_applicable.some((n) => n.startsWith('Strict-Transport-Security')));
    const local = evaluateHeaders({ headers: [], https: false, local: true, isHtml: true }, baseline);
    assert.ok(local.findings.some((f) => f.rule === 'missing-header' && f.header === 'Strict-Transport-Security'));
    const https = evaluateHeaders({ headers: [{ name: 'Strict-Transport-Security', value: 'max-age=300' }], https: true, isHtml: true }, baseline);
    assert.ok(https.findings.some((f) => f.rule === 'weak-header-value' && f.header === 'Strict-Transport-Security'));
  });

  test('forme détaillée : checks multiples, when present, cookies par portée, absent_or_minimal', () => {
    const baseline = normaliseBaseline({
      headers: [{ name: 'X-XSS-Protection', required: 'recommended', checks: [{ type: 'equals', values: ['0'], when: 'present', severity: 'low' }] },
        { name: 'Referrer-Policy', checks: [{ type: 'present', severity: 'medium' }, { type: 'equals', values: ['no-referrer'], severity: 'medium' }] }],
      csp: { required_directives: [{ directive: 'base-uri', allowed_values: ["'self'"], severity: 'medium' }],
        forbidden_sources: [{ id: 'unsafe-inline-script', source_token: "'unsafe-inline'", in_effective_directives: ['script-src'], severity: 'high', severity_if_nonce_or_hash_present: 'medium' }] },
      cookies: { session_cookie_name_pattern: '^sid$', checks: [{ id: 'httponly', applies_to: 'session', attribute: 'HttpOnly', check: 'present', severity: 'high' }] },
      absent_or_minimal: [{ name: 'Server', checks: [{ type: 'not-matches', pattern: '\\d', when: 'present', severity: 'low' }] }],
    });
    const result = evaluateHeaders({ headers: [
      { name: 'Referrer-Policy', value: 'unsafe-url, no-referrer' },
      { name: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'nonce-a' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'" },
      { name: 'Server', value: 'demo/1.0' }, { name: 'Set-Cookie', value: 'sid=1; Secure' }, { name: 'Set-Cookie', value: 'theme=dark' }],
    https: true, isHtml: true }, baseline);
    const rules = result.findings.map((f) => `${f.rule}:${f.verdict}`);
    assert.ok(!rules.some((r) => r.startsWith('weak-header-value')), 'Referrer-Policy : le dernier jeton compte');
    assert.ok(rules.includes('csp-unsafe-inline:NC'), 'nonce présent : signalé à la sévérité réduite de la base');
    assert.ok(rules.includes('csp-missing-directive:NC'), 'base-uri manquant');
    assert.ok(rules.includes('server-version-disclosure:NC'));
    assert.equal(result.findings.filter((f) => f.rule === 'cookie-missing-attribute').length, 1);
  });

  test('attributs de cookie', () => {
    assert.deepEqual(parseSetCookie('sid=1; Path=/; Secure; SameSite=Lax').attributes, { path: '/', secure: true, samesite: 'Lax' });
  });

  test('la base de référence, si elle existe, se charge', async (t) => {
    const reference = path.join(ROOT, 'references', 'security', 'headers-baseline.json');
    const exists = await fs.stat(reference).then(() => true, () => false);
    if (!exists) {
      t.skip('references/security/headers-baseline.json pas encore écrit');
      return;
    }
    const baseline = await loadBaseline(reference);
    assert.ok(baseline.headers.length > 0);
  });
});

describe('privacy-classify', () => {
  let env;
  before(async () => {
    env = { hints: await loadHints(), declaration: await loadDeclaration(path.join(FIXTURES, 'privacy', 'compliance', 'trackers.json')),
      isFirstParty: firstPartyPredicate('http://127.0.0.1:8000/') };
  });

  test('déclaré exempté, motif de traceur, indice d\'exemption, non déclaré', () => {
    const cls = (item) => classifyStorage({ party: 'first-party', writer: null, ...item }, env).classification;
    assert.equal(cls({ kind: 'localStorage', name: 'ewc-consent' }), 'exempt-candidate');
    assert.equal(cls({ kind: 'cookie', name: '_ga' }), 'non-exempt');
    assert.equal(cls({ kind: 'cookie', name: 'PHPSESSID' }), 'to-review');
    assert.equal(cls({ kind: 'cookie', name: 'xyz' }), 'non-exempt');
    assert.equal(cls({ kind: 'cookie', name: 'abc', writer: 'https://tracker.example.net/t.js' }), 'non-exempt');
    assert.equal(cls({ kind: 'cookie', name: 'abc', party: 'third-party' }), 'non-exempt');
  });

  test('requêtes tierces', () => {
    const cls = (host) => classifyRequest({ url: `https://${host}/x`, host, kind: 'script' }, env).classification;
    assert.equal(cls('www.googletagmanager.com'), 'non-exempt');
    assert.equal(cls('fonts.gstatic.com'), 'to-review');
    assert.equal(cls('unknown.example.net'), 'to-review');
  });

  test('erreur claire sur une déclaration mal formée', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-decl-'));
    const file = path.join(dir, 'trackers.json');
    await fs.writeFile(file, '{"exempt":[{"kind":"cookie"}]}');
    await assert.rejects(loadDeclaration(file), /name/);
    await fs.rm(dir, { recursive: true, force: true });
  });
});

describe('cli: score des défauts attendus', () => {
  test('détecté, à revoir, manqué', () => {
    const pages = [{ page: 'a.html', findings: [
      { rule: 'r1', verdict: 'NC', message: 'cookie _ga' }, { rule: 'r2', verdict: 'NT', message: 'x' }] }];
    const score = scoreExpected([
      { id: '1', page: 'a.html', rule: 'r1', detail: '_ga' }, { id: '2', page: 'a.html', rule: 'r2' }, { id: '3', page: 'a.html', rule: 'r3' }], pages);
    assert.deepEqual([score.detected, score.flagged_for_review, score.total], [1, 1, 3]);
  });
});

// ---- Vérificateurs de bout en bout ------------------------------------------------------

describe('check-privacy sur tests/fixtures/privacy', () => {
  let run;
  before(async () => {
    run = await runReport('check-privacy.mjs', [path.join(FIXTURES, 'privacy'), '--wait', '500',
      '--expected', path.join(FIXTURES, 'privacy', 'expected-defects.json')]);
  });

  test('les requêtes tierces sont interrompues, le code de sortie signale les NC', () => {
    assert.equal(run.report.network, 'recorded and aborted');
    assert.equal(run.code, 1);
    assert.ok(run.report.limits.length >= 5);
    assert.match(run.markdown, /## Limits/);
  });

  test('script tiers et identifiant avant consentement : NC', () => {
    const page = pageOf(run.report, 'tracker-before-consent.html');
    const rules = nc(page).map((f) => f.rule);
    assert.ok(rules.includes('third-party-request-before-consent'));
    assert.ok(rules.includes('storage-before-consent'));
    const request = nc(page).find((f) => f.rule === 'third-party-request-before-consent');
    assert.equal(request.request.host, 'www.googletagmanager.com');
    assert.equal(request.selector, '#analytics-loader');
    assert.match(request.source, /ePrivacy art\. 5\(3\)/);
  });

  test('bandeau sans refus au premier niveau : NC', () => {
    const page = pageOf(run.report, 'no-first-level-refuse.html');
    assert.deepEqual(nc(page).map((f) => f.rule), ['no-first-level-refuse']);
    assert.ok(page.inventory.after_accept.requests.some((r) => r.host === 'connect.facebook.net'));
  });

  test('page propre avant consentement, après refus et après retrait : aucune NC', () => {
    const page = pageOf(run.report, 'clean.html');
    assert.deepEqual(nc(page), []);
    const steps = Object.fromEntries(page.consent_flow.steps.map((s) => [s.step, s.status]));
    assert.deepEqual(steps, { 'find-banner': 'done', 'refuse-by-keyboard': 'done', 'refuse-all': 'done', 'accept-all': 'done', withdraw: 'done' });
    assert.equal(page.inventory.before_consent.requests.length, 0);
    assert.equal(page.inventory.after_refusal.requests.length, 0);
    assert.equal(page.inventory.after_withdrawal.requests.length, 0);
    assert.ok(page.inventory.after_accept.requests.some((r) => r.host === 'www.googletagmanager.com'));
  });

  test('tous les défauts attendus sont détectés', () => {
    assert.equal(run.report.expected.detected, run.report.expected.total);
  });
});

describe('check-security sur tests/fixtures/security', () => {
  test('bons en-têtes via .headers : aucune NC', async () => {
    const run = await runReport('check-security.mjs', [path.join(FIXTURES, 'security', 'good'), '--baseline', BASELINE]);
    assert.equal(run.code, 0);
    assert.equal(run.report.headers_file, '.headers');
    assert.deepEqual(nc(run.report.pages[0]), []);
  });

  test('CSP faible, en-têtes manquants, cookie non sécurisé : chaque défaut attendu est une NC', async () => {
    const run = await runReport('check-security.mjs', [path.join(FIXTURES, 'security', 'weak'), '--baseline', BASELINE,
      '--expected', path.join(FIXTURES, 'security', 'weak-expected.json')]);
    assert.equal(run.code, 1);
    const missed = run.report.expected.defects.filter((d) => !d.detected).map((d) => d.id);
    assert.deepEqual(missed, []);
    assert.ok(run.report.pages[0].findings.some((f) => f.rule === 'password-autocomplete-off' && f.verdict === 'NT'));
  });

  test('base de référence du skill (si présente) : le site correct n\'a aucune NC, le site faible en a', async (t) => {
    const reference = path.join(ROOT, 'references', 'security', 'headers-baseline.json');
    if (!await fs.stat(reference).then(() => true, () => false)) {
      t.skip('references/security/headers-baseline.json pas encore écrit');
      return;
    }
    const good = await runReport('check-security.mjs', [path.join(FIXTURES, 'security', 'good')]);
    assert.deepEqual(nc(good.report.pages[0]).map((f) => `${f.rule} ${f.detail}`), []);
    const weak = await runReport('check-security.mjs', [path.join(FIXTURES, 'security', 'weak')]);
    assert.ok(nc(weak.report.pages[0]).length >= 10);
  });

  test('base introuvable : erreur d\'usage (code 2)', async () => {
    const result = await runChecker('check-security.mjs', [path.join(FIXTURES, 'security', 'good'), '--baseline', path.join(FIXTURES, 'absent.json')]);
    assert.equal(result.code, 2);
    assert.match(result.stderr, /introuvable/);
  });
});
