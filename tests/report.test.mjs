// Tests du rapport unifié (scripts/check-all.mjs et scripts/lib/report-*.mjs), sans navigateur :
// le rapport est construit à partir des rapports de vérificateurs de tests/fixtures/report/.
// La matrice et le classement AI Act sont calculés par les scripts Python du skill.
// Lancement : node --test tests/report.test.mjs

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContext, normaliseReport, limitsOf } from '../scripts/lib/report-normalise.mjs';
import { indexPage, parseTestingByHand } from '../scripts/lib/report-matrix.mjs';
import { buildReport, groupFixes, GENERATOR, DISCLAIMER } from '../scripts/lib/report-build.mjs';
import { toMarkdown, FOOTER } from '../scripts/lib/report-markdown.mjs';
import { validate, loadSchemas, validateReport } from '../scripts/lib/report-validate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(ROOT, 'tests', 'fixtures', 'report');
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

function python(args) {
  for (const cmd of process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python']) {
    const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
    if (!r.error) return r;
  }
  throw new Error('Python not found');
}

function pythonJson(script, args) {
  const r = python([path.join(ROOT, 'scripts', script), ...args]);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

let ctx;
let matrix;
let aiAct;
let siteIndex;
let testingByHand;
let raws;

async function build(overrides = {}) {
  const runs = ['a11y', 'privacy', 'security', 'content'].map((name) => ({ name, status: 'ran', exit_code: 1, raw: raws[name], raw_report: `raw/check-${name}.json` }));
  return buildReport({
    target: 'tests/fixtures/report/site', language: 'en', generated: '2026-11-14T10:00:00.000Z',
    profile: { path: 'tests/fixtures/report/profile.json', found: true, declares_ai: true },
    matrix, matrixError: null, aiAct, checkerRuns: runs, siteIndex, testingByHandText: testingByHand,
    previous: null, ctx, ...overrides,
  });
}

before(async () => {
  ctx = await loadContext(ROOT);
  matrix = pythonJson('applicability.py', [path.join(FIX, 'profile.json'), '--format', 'json']);
  aiAct = pythonJson('ai_act_classify.py', [path.join(FIX, 'profile.json'), '--format', 'json']);
  const pages = ['index.html', 'legal.html', 'privacy.html'];
  siteIndex = await Promise.all(pages.map(async (p) => indexPage(p, await fs.readFile(path.join(FIX, 'site', p), 'utf8'))));
  testingByHand = await fs.readFile(path.join(ROOT, 'references', 'accessibility', 'testing-by-hand.md'), 'utf8');
  raws = {};
  for (const name of ['a11y', 'privacy', 'security', 'content']) raws[name] = await readJson(path.join(FIX, `${name}.json`));
});

describe('normalisation', () => {
  test('a11y findings get domain, sources and fix reference', () => {
    const list = normaliseReport('a11y', raws.a11y, ctx);
    const field = list.find((f) => f.rule === 'AP-FRM-01');
    assert.equal(field.domain, 'accessibility');
    assert.deepEqual(field.sources, ['WCAG 2.2 SC 3.3.2', 'WCAG 2.2 SC 4.1.2', 'RGAA criterion 11.1']);
    assert.equal(field.fix_ref, 'references/accessibility/anti-patterns-forms.md');
    assert.equal(field.fix_entry, 'AP-FRM-01');
    const fileOnly = list.find((f) => f.rule === 'AP-ALT-10');
    assert.equal(fileOnly.element, 'index.html:12');
    assert.deepEqual(fileOnly.sources, ['best practice']);
  });

  test('privacy, security and content findings are normalised', () => {
    const privacy = normaliseReport('privacy', raws.privacy, ctx);
    const cookie = privacy.find((f) => f.rule === 'storage-before-consent');
    assert.equal(cookie.cookie, 'visitor_id');
    assert.equal(cookie.element, 'cookie visitor_id');
    assert.deepEqual(cookie.sources.slice(0, 2), ['ePrivacy art. 5(3)', 'LIL art. 82']);
    assert.equal(cookie.fix_ref, 'references/privacy/trackers.md');
    const security = normaliseReport('security', raws.security, ctx);
    const header = security.find((f) => f.rule === 'missing-header');
    assert.equal(header.severity, 'major');
    assert.equal(header.impact, 'Defence in depth against clickjacking.');
    assert.equal(header.fix_ref, 'references/security/headers-configs.md');
    assert.equal(security.find((f) => f.request).request.host, 'analytics.example');
    const content = normaliseReport('content', raws.content, ctx);
    assert.equal(content.find((f) => f.rule === 'ai-chat-no-disclosure').domain, 'ai');
    assert.equal(content.find((f) => f.rule === 'order-button-label').domain, 'consumer');
    assert.equal(content.find((f) => f.rule === 'order-button-label').fix_ref, 'references/consumer/online-sales.md');
  });

  test('limits of every checker are read', () => {
    assert.equal(limitsOf('a11y', raws.a11y)[0].wcag, '1.1.1');
    assert.equal(limitsOf('privacy', raws.privacy).length, 2);
  });
});

describe('unified report', () => {
  test('summary counts by domain and exit code', async () => {
    const r = await build();
    assert.equal(r.summary.non_conformities, 8);
    assert.equal(r.summary.to_review, 2);
    assert.deepEqual(r.summary.by_domain.ai, { non_conformities: 1, to_review: 0 });
    assert.deepEqual(r.summary.by_domain.consumer, { non_conformities: 1, to_review: 0 });
    assert.equal(r.summary.exit_code, 1);
    const failed = await build({ checkerRuns: [{ name: 'a11y', status: 'failed', error: 'boom' }] });
    assert.equal(failed.summary.exit_code, 2);
    assert.match(failed.next_actions.join('\n'), /a11y checker run/);
  });

  test('findings on the same element are grouped, across domains', async () => {
    const r = await build();
    const buy = r.grouped_fixes.find((g) => g.element === '#buy');
    assert.deepEqual(buy.rules, ['button-name', 'color-contrast', 'order-button-label']);
    assert.deepEqual(buy.domains, ['accessibility', 'consumer']);
    const script = r.grouped_fixes.find((g) => g.element === 'html > head > script:nth-child(4)');
    assert.deepEqual(script.domains, ['privacy', 'security']);
    assert.ok(r.grouped_fixes.every((g) => g.finding_ids.length >= 2));
    // Un sélecteur positionnel identique sur deux pages ne désigne pas le même élément.
    const f = (id, page, element) => ({ id, page, element, rule: id, domain: 'privacy', fix_ref: null });
    const groups = groupFixes([f('a', 'p1.html', 'body > script:nth-child(2)'), f('b', 'p2.html', 'body > script:nth-child(2)'),
      f('c', 'p1.html', '#chat'), f('d', 'p2.html', '#chat')]);
    assert.deepEqual(groups.map((g) => g.element), ['#chat']);
  });

  test('"to check by a person" is the union of limits, manual checks and uncovered obligations', async () => {
    const r = await build();
    const texts = r.not_tested.map((l) => l.text);
    assert.equal(texts.filter((t) => t.startsWith('It does not see logged-in areas')).length, 1, 'duplicate limits merged');
    assert.ok(texts.some((t) => t.startsWith('TLS is not checked')));
    assert.ok(texts.includes('Logical focus order'));
    const manual = r.manual_checks.filter((m) => m.origin === 'testing-by-hand');
    assert.equal(manual.length, parseTestingByHand(testingByHand).length);
    assert.ok(manual.length >= 13);
    assert.ok(manual.every((m) => m.procedure.length > 10));
    const fromMatrix = r.manual_checks.filter((m) => m.origin === 'matrix').map((m) => m.id);
    assert.ok(fromMatrix.includes('gdpr-data-subject-rights'));
    assert.ok(fromMatrix.includes('eaa-information-duty'));
    assert.ok(!fromMatrix.includes('sec-baseline-https-headers'), 'covered by check-security');
    assert.ok(!fromMatrix.includes('gdpr-special-categories'), 'does not apply');
    const partial = await build({ checkerRuns: [{ name: 'a11y', status: 'ran', raw: raws.a11y }] });
    const ids = partial.manual_checks.map((m) => m.id);
    assert.ok(ids.includes('run-security') && ids.includes('sec-baseline-https-headers'));
  });

  test('documents to publish, with pages found on the site', async () => {
    const r = await build();
    const byId = Object.fromEntries(r.documents.map((d) => [d.id, d]));
    assert.equal(byId['legal-notice'].status, 'found');
    assert.equal(byId['legal-notice'].template, 'templates/consumer/legal-notice-fr.md');
    assert.deepEqual(byId['privacy-policy'].pages, ['privacy.html']);
    assert.equal(byId['accessibility-information-eaa'].status, 'not-found');
    assert.equal(byId['cookie-policy'].status, 'not-found', 'an external link does not count');
    assert.equal(byId['accessibility-statement-fr'], undefined, 'does not apply to this profile');
    const remote = await build({ siteIndex: null });
    assert.ok(remote.documents.every((d) => d.status === 'not-checked'));
  });

  test('changes since the previous report', async () => {
    const previous = { ...(await readJson(path.join(FIX, 'previous-report.json'))), file_name: 'compliance-report-2026-11-01.json' };
    const r = await build({ previous });
    assert.equal(r.changes.previous, 'compliance-report-2026-11-01.json');
    assert.deepEqual(r.changes.fixed, ['accessibility|image-alt|index.html|img.hero'], 'content did not run last time: not counted as fixed');
    assert.deepEqual(r.changes.unchanged, ['accessibility|color-contrast|index.html|#buy']);
    assert.equal(r.changes.new.length, r.findings.length - 1);
    assert.equal((await build()).changes, null);
  });

  test('no profile: the first action is to create it', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-report-test-'));
    const empty = path.join(dir, 'profile.json');
    await fs.writeFile(empty, '{"schema_version": 1}\n');
    const emptyMatrix = pythonJson('applicability.py', [empty, '--format', 'json']);
    await fs.rm(dir, { recursive: true, force: true });
    const r = await build({ matrix: emptyMatrix, aiAct: null, profile: { path: 'compliance/profile.json', found: false, declares_ai: false } });
    assert.match(r.next_actions[0], /Create the project profile compliance\/profile\.json/);
    assert.ok(r.applicability.to_confirm.length > 40);
    assert.match(toMarkdown(r), /\*\*Profile: not found/);
    assert.deepEqual(await validateReport(r), []);
  });
});

describe('JSON schema', () => {
  test('the report conforms to schemas/report.schema.json', async () => {
    const r = await build({ previous: { ...(await readJson(path.join(FIX, 'previous-report.json'))), file_name: 'x.json' } });
    assert.deepEqual(await validateReport(r), []);
    assert.deepEqual(await validateReport(JSON.parse(JSON.stringify(r))), []);
  });

  test('the validator rejects a broken report and a broken finding', async () => {
    const r = await build();
    const { disclaimer, ...withoutDisclaimer } = r;
    assert.ok(disclaimer);
    assert.ok((await validateReport(withoutDisclaimer)).some((e) => e.includes('missing required property disclaimer')));
    const bad = { ...r, findings: [{ ...r.findings[0], verdict: 'C' }] };
    assert.ok((await validateReport(bad)).some((e) => e.includes('$.findings[0].verdict')));
    const { finding, registry } = await loadSchemas();
    assert.ok(validate({ ...r.findings[0], extra: 1 }, finding, registry).some((e) => e.includes('unexpected property extra')));
  });

  test('both schemas are draft 2020-12 with $id and a description on every property', async () => {
    const { finding, report } = await loadSchemas();
    for (const schema of [finding, report]) {
      assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
      assert.ok(schema.$id);
      for (const [key, prop] of Object.entries(schema.properties)) assert.ok(prop.description || prop.$ref, `${key} has no description`);
    }
  });
});

describe('Markdown', () => {
  test('disclaimer at the very top, sections in order, never "conformant" for the site', async () => {
    const r = await build({ previous: { ...(await readJson(path.join(FIX, 'previous-report.json'))), file_name: 'x.json' } });
    const md = toMarkdown(r);
    const lines = md.split('\n');
    assert.equal(lines[0], '# Compliance report');
    assert.equal(lines[2], `> ${DISCLAIMER}`);
    assert.match(lines[2], /produced by an AI tool/);
    assert.match(lines[2], /not an accessibility audit/);
    assert.match(lines[2], /not legal advice/);
    // Le mot peut venir du texte d'une obligation (« procedures to stay conformant ») ; le rapport
    // ne l'applique jamais au site.
    const claims = lines.filter((l) => /\b(site|website)\b[^.|]*\bis (fully |partially )?(conformant|compliant)\b/i.test(l));
    assert.deepEqual(claims, []);
    const order = ['## 1. Applicability', '## 2. Findings by domain', '## 3. Grouped fixes', '## 4. Not tested, and to check by a person',
      '## 5. Documents to publish', '## 6. What changed since the previous report', '## Next actions'];
    const positions = order.map((h) => md.indexOf(h));
    assert.ok(positions.every((p) => p > 0), positions.join(','));
    assert.deepEqual([...positions].sort((a, b) => a - b), positions);
    for (const d of ['Accessibility', 'Data protection', 'AI Act', 'Security', 'Consumer and information law']) assert.match(md, new RegExp(`### ${d}: `));
    assert.match(md, /Page `legal.html`\n\n- \*\*blocking\*\* `AP-FRM-01`/);
    assert.match(md, /skill file `references\/accessibility\/anti-patterns-forms.md`, entry AP-FRM-01/);
  });

  test('author credit: footer at the very end and generator object', async () => {
    const r = await build();
    assert.deepEqual(r.generator, {
      name: 'eu-web-compliance', author: 'Tarek BELHADJ - Kayzen', homepage: 'https://www.kayzen-lyon.com', related: 'https://nexus.kayzen-lyon.com',
    });
    assert.deepEqual(r.generator, GENERATOR);
    for (const lang of ['en', 'fr']) {
      const md = toMarkdown(r, lang).trimEnd().split('\n');
      assert.equal(md[md.length - 1], FOOTER);
      assert.equal(md[md.length - 3], '---');
      assert.equal(FOOTER, 'Report produced by eu-web-compliance, an open-source skill by Tarek BELHADJ — Kayzen (https://www.kayzen-lyon.com), author of Nexus (https://nexus.kayzen-lyon.com).');
    }
  });

  test('French labels share the same layout', async () => {
    const r = await build();
    const md = toMarkdown(r, 'fr');
    assert.match(md.split('\n')[2], /^> Ce rapport a été produit par un outil d'IA/);
    assert.match(md, /## 1\. Applicabilité/);
    assert.match(md, /### Protection des données: 2 non-conformités, 0 à revoir/);
    assert.equal(md.split('\n').length, toMarkdown(r, 'en').split('\n').length);
  });
});

describe('check-all command line', () => {
  test('usage errors exit with code 2 without launching a browser', () => {
    const script = path.join(ROOT, 'scripts', 'check-all.mjs');
    for (const args of [[], ['site', 'other'], [path.join(FIX, 'site'), '--only', 'a11y,colour'], [path.join(FIX, 'site'), '--lang', 'de'],
      [path.join(FIX, 'does-not-exist')]]) {
      const r = spawnSync(process.execPath, [script, ...args], { cwd: os.tmpdir(), encoding: 'utf8' });
      assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
      assert.match(r.stderr, /^usage :/);
    }
  });
});
