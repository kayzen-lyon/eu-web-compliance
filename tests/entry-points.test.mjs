// Tests des portes d'entrée du skill : socle commun (scripts/lib/skill-api.mjs), outil en ligne de
// commande (bin/), serveur MCP (mcp/), étape de rapport de la GitHub Action et veille des sources.
// Lancement : node --test tests/entry-points.test.mjs

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ROOT } from './helpers.mjs';
import { SkillError, checkAllArgs, findRules, getTemplate, listTemplates, qualifyProject } from '../scripts/lib/skill-api.mjs';
import { buildProfile, loadQuestions, parseAnswer, shouldAsk } from '../scripts/lib/profile-init.mjs';
import { clip, main as actionReport } from '../scripts/action-report.mjs';
import { checkSources, fingerprint, nextBaseline, toMarkdown } from '../scripts/watch-sources.mjs';

const BIN = path.join(ROOT, 'bin', 'eu-web-compliance.mjs');
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const tmpDir = (name) => fs.mkdtemp(path.join(os.tmpdir(), `ewc-${name}-`));

function cli(args, { input = null, env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN, ...args], { cwd: ROOT, env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: '', LC_MESSAGES: '', ...env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(input === null ? '' : input);
  });
}

describe('socle commun : règles et modèles', () => {
  test('une étiquette RGAA rend les règles qui la citent et le texte officiel du critère', async () => {
    const result = await findRules('[RGAA 11.1]');
    assert.ok(result.rules.length > 0);
    for (const rule of result.rules) assert.match(rule.tag, /RGAA [^;]*\b11\.1(?!\d)/);
    assert.match(result.official_text.text, /^## Criterion 11\.1/);
    assert.match(result.official_text.file, /^references\/accessibility\/rgaa\//);
  });

  test('une référence plus courte trouve ses subdivisions, pas ses voisines', async () => {
    const result = await findRules('GDPR art. 7');
    assert.ok(result.rules.some((r) => r.tag.includes('GDPR art. 7(')));
    for (const rule of result.rules) {
      assert.match(rule.tag, /GDPR art\. 7(?!\d)/);
      assert.ok(rule.file.startsWith('references/') && rule.line > 0 && rule.rule.length > 0);
    }
  });

  test('une étiquette inconnue ne rend aucune règle et liste les étiquettes connues', async () => {
    const result = await findRules('NOPE 1.2');
    assert.equal(result.rules.length, 0);
    assert.ok(result.known_tags.includes('WCAG'));
    await assert.rejects(findRules('  '), SkillError);
  });

  test('un modèle se demande par chemin, par nom de fichier ou sans extension', async () => {
    const all = await listTemplates();
    assert.ok(all.some((t) => t.name === 'consumer/legal-notice-fr.md'));
    const byPath = await getTemplate('consumer/legal-notice-fr.md');
    const byStem = await getTemplate('legal-notice-fr');
    assert.equal(byPath.content, byStem.content);
    assert.equal(byPath.content, await fs.readFile(path.join(ROOT, 'templates', 'consumer', 'legal-notice-fr.md'), 'utf8'));
  });

  test('un nom ambigu, inconnu ou hors de templates/ est refusé', async () => {
    await assert.rejects(getTemplate('consent'), /several templates/);
    await assert.rejects(getTemplate('nope'), /unknown template/);
    await assert.rejects(getTemplate('../package.json'), /unknown template/);
    await assert.rejects(getTemplate('../../SKILL.md'), /unknown template/);
  });

  test('les options nommées deviennent les arguments de check-all', () => {
    assert.deepEqual(checkAllArgs({ target: 'dist', only: ['a11y', 'security'], lang: 'fr', noFail: true }),
      ['dist', '--only', 'a11y,security', '--lang', 'fr', '--no-fail']);
    assert.throws(() => checkAllArgs({}), SkillError);
  });

  test('la qualification rend la matrice du script Python, à partir d\'un objet ou d\'un fichier', async () => {
    const example = path.join(ROOT, 'templates', 'profile.example.json');
    const fromFile = await qualifyProject(example);
    const fromObject = await qualifyProject(await readJson(example));
    assert.deepEqual(fromObject.counts, fromFile.counts);
    assert.ok(fromFile.obligations.length > 0);
    await assert.rejects(qualifyProject({ schema_version: 1, nope: true }), SkillError);
  });
});

describe('init : questions de qualification', () => {
  let questions;
  before(async () => { questions = await loadQuestions(); });

  test('chaque champ du schéma a une question en anglais et en français', async () => {
    const schema = await readJson(path.join(ROOT, 'schemas', 'profile.schema.json'));
    const labels = await readJson(path.join(ROOT, 'scripts', 'lib', 'init-questions.json'));
    const fields = Object.entries(schema.properties).filter(([, g]) => g.type === 'object')
      .flatMap(([group, g]) => Object.keys(g.properties).map((name) => `${group}.${name}`));
    for (const field of fields.filter((f) => !labels.not_asked.includes(f))) {
      assert.ok(labels.questions[field] && labels.questions[field].en && labels.questions[field].fr, `question absente : ${field}`);
    }
    for (const field of [...Object.keys(labels.questions), ...labels.not_asked]) assert.ok(fields.includes(field), `champ inconnu du schéma : ${field}`);
    assert.equal(questions.length, fields.length - labels.not_asked.length);
    assert.equal(questions[0].number, 1);
  });

  test('les réponses sont lues selon le type du champ', () => {
    const q = (field) => questions.find((x) => x.field === field);
    assert.deepEqual(parseAnswer(q('market.sells_online'), 'Oui'), { value: true });
    assert.deepEqual(parseAnswer(q('market.sells_online'), 'n'), { value: false });
    assert.deepEqual(parseAnswer(q('market.sells_online'), ''), { unknown: true });
    assert.deepEqual(parseAnswer(q('market.sells_online'), 'peut-être'), { error: 'yes-no' });
    assert.deepEqual(parseAnswer(q('operator.headcount'), '1 200'), { value: 1200 });
    assert.deepEqual(parseAnswer(q('operator.headcount'), '-3'), { error: 'number' });
    assert.deepEqual(parseAnswer(q('operator.headcount'), 'a few'), { error: 'number' });
    assert.deepEqual(parseAnswer(q('operator.type'), '3'), { value: 'company' });
    assert.deepEqual(parseAnswer(q('operator.type'), 'Association'), { value: 'association' });
    assert.deepEqual(parseAnswer(q('operator.type'), '9'), { error: 'choice' });
    assert.deepEqual(parseAnswer(q('operator.country_of_establishment'), 'fr'), { value: 'FR' });
    assert.deepEqual(parseAnswer(q('operator.country_of_establishment'), 'France'), { error: 'pattern' });
    assert.deepEqual(parseAnswer(q('market.target_countries'), 'fr, be'), { value: ['FR', 'BE'] });
    assert.deepEqual(parseAnswer(q('eaa.sectors'), 'aucun'), { value: [] });
    assert.deepEqual(parseAnswer(q('eaa.sectors'), '1, e-books'), { value: ['e-commerce', 'e-books'] });
  });

  test('une question sans objet n\'est pas posée, mais jamais sur une absence de réponse', () => {
    const q = (field) => questions.find((x) => x.field === field);
    assert.equal(shouldAsk(q('market.sells_what'), { 'market.sells_online': { value: false } }), false);
    assert.equal(shouldAsk(q('market.sells_what'), { 'market.sells_online': { unknown: true } }), true);
    assert.equal(shouldAsk(q('operator.fr_turnover_3y_average_eur'), { 'operator.country_of_establishment': { value: 'DE' } }), false);
    assert.equal(shouldAsk(q('operator.fr_turnover_3y_average_eur'), {}), true);
  });

  test('sans réponse : lecture protectrice « assumed » pour un oui/non, rien pour un chiffre ou un pays', async () => {
    const answers = Object.fromEntries(questions.map((x) => [x.field, { unknown: true }]));
    const profile = buildProfile(answers, questions, { today: new Date(2026, 10, 15) });
    assert.equal(profile.updated, '2026-11-15');
    assert.equal(profile.market.sells_to_consumers.value, true);
    assert.equal(profile.market.sells_to_consumers.basis, 'assumed');
    assert.equal(profile.referents.dpo.value, false);
    assert.equal(profile.operator.headcount, undefined);
    assert.equal(profile.operator.country_of_establishment, undefined);
    assert.equal(profile.operator.type, undefined);
    const matrix = await qualifyProject(profile);
    assert.equal(matrix.counts.applies + matrix.counts['to-confirm'] + matrix.counts['does-not-apply'], matrix.obligations.length);
    assert.ok(matrix.counts['to-confirm'] > 0);
    assert.ok(matrix.assumptions.assumed_answers.length > 0);
  });
});

describe('outil en ligne de commande', () => {
  test('sans commande : aide et code 2 ; --help : code 0 ; commande inconnue : code 2', async () => {
    assert.equal((await cli([])).code, 2);
    const help = await cli(['--help']);
    assert.equal(help.code, 0);
    assert.match(help.stdout, /never certifies compliance/);
    const french = await cli(['--help'], { env: { LANG: 'fr_FR.UTF-8' } });
    assert.match(french.stdout, /ne certifie jamais la conformité/);
    const unknown = await cli(['nope']);
    assert.equal(unknown.code, 2);
    assert.match(unknown.stderr, /unknown command/);
  });

  test('--version rend la version de package.json', async () => {
    const result = await cli(['--version']);
    assert.equal(result.stdout.trim(), (await readJson(path.join(ROOT, 'package.json'))).version);
  });

  test('le numéro de version est le même partout où il est écrit', async () => {
    const { version } = await readJson(path.join(ROOT, 'package.json'));
    assert.equal((await readJson(path.join(ROOT, 'package-lock.json'))).version, version);
    assert.equal((await readJson(path.join(ROOT, '.claude-plugin', 'plugin.json'))).version, version);
    assert.match(await fs.readFile(path.join(ROOT, 'SKILL.md'), 'utf8'), new RegExp(`^  version: "${version.replace(/\./g, '\\.')}"$`, 'm'));
    assert.match(await fs.readFile(path.join(ROOT, 'CHANGELOG.md'), 'utf8'), new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm'));
  });

  test('rule : texte ou JSON', async () => {
    const text = await cli(['rule', 'WCAG', '2.4.7']);
    assert.equal(text.code, 0);
    assert.match(text.stdout, /\[[^\]]*WCAG 2\.4\.7[^\]]*\]/);
    const json = JSON.parse((await cli(['rule', 'ANSSI WEB R14', '--json'])).stdout);
    assert.ok(json.rules.length > 0);
  });

  test('template : liste, affichage, copie sans écrasement', async () => {
    const list = await cli(['template']);
    assert.match(list.stdout, /privacy-policy\.md/);
    const shown = await cli(['template', 'privacy-policy']);
    assert.equal(shown.stdout, await fs.readFile(path.join(ROOT, 'templates', 'privacy-policy.md'), 'utf8'));
    const dir = await tmpDir('template');
    const target = path.join(dir, 'pages', 'privacy.md');
    assert.equal((await cli(['template', 'privacy-policy', '--out', target])).code, 0);
    assert.equal(await fs.readFile(target, 'utf8'), shown.stdout);
    const again = await cli(['template', 'privacy-policy', '--out', target]);
    assert.equal(again.code, 2);
    assert.match(again.stderr, /already exists/);
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('qualify : matrice du profil d\'exemple, erreur sur un profil absent', async () => {
    const result = await cli(['qualify', 'templates/profile.example.json', '--format', 'json']);
    assert.equal(result.code, 0);
    assert.ok(JSON.parse(result.stdout).obligations.length > 0);
    assert.equal((await cli(['qualify', 'nope/profile.json'])).code, 2);
  });

  test('init : réponses lues sur l\'entrée, profil conforme au schéma, matrice écrite', async () => {
    const dir = await tmpDir('init');
    // Nom du projet, puis operator.type et activity_kind ; l'entrée s'arrête là : le reste est « je ne sais pas ».
    const result = await cli(['init', '--project', dir, '--lang', 'fr'], { input: 'Boutique test\ncompany\ncommercial\n' });
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Qui exploite le site/);
    const profile = await readJson(path.join(dir, 'compliance', 'profile.json'));
    assert.equal(profile.project_name, 'Boutique test');
    assert.equal(profile.operator.type.value, 'company');
    assert.equal(profile.operator.type.basis, 'stated');
    assert.equal(profile.operator.headcount, undefined);
    assert.equal(profile.data.non_essential_trackers.basis, 'assumed');
    const matrix = await readJson(path.join(dir, 'compliance', 'applicability-matrix.json'));
    assert.ok(matrix.obligations.length > 0);
    const second = await cli(['init', '--project', dir, '--defaults']);
    assert.equal(second.code, 2);
    assert.equal((await cli(['init', '--project', dir, '--defaults', '--force'])).code, 0);
    assert.equal((await readJson(path.join(dir, 'compliance', 'profile.json'))).operator.type, undefined);
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('audit : les options et le code de sortie sont ceux de check-all', async () => {
    const missing = await cli(['audit', 'no-such-folder']);
    assert.equal(missing.code, 2);
    assert.match(missing.stderr, /introuvable/);
    assert.equal((await cli(['audit', 'tests/fixtures/security/good', '--only', 'nope'])).code, 2);
  });
});

describe('GitHub Action', () => {
  test('action.yml déclare les paramètres attendus et passe par le binaire', async () => {
    const text = await fs.readFile(path.join(ROOT, 'action.yml'), 'utf8');
    for (const input of ['target', 'only', 'lang', 'fail-on-violation']) assert.match(text, new RegExp(`^  ${input}:`, 'm'));
    assert.match(text, /bin\/eu-web-compliance\.mjs" audit/);
    assert.match(text, /--no-fail/);
    // Aucune valeur d'entrée n'est écrite dans le texte d'un script : elles passent par env.
    const scriptLines = text.split('\n').filter((line) => /^\s+(run:|node |npm |npx |if \[|args)/.test(line));
    for (const line of scriptLines) assert.ok(!line.includes('${{ inputs.'), `entrée interpolée dans un script : ${line}`);
  });

  test('l\'étape de rapport écrit le résumé et les sorties', async () => {
    const dir = await tmpDir('action');
    const summary = path.join(dir, 'summary.md');
    const output = path.join(dir, 'output.txt');
    await fs.writeFile(path.join(dir, 'compliance-report-2026-11-15.json'), JSON.stringify({ summary: { non_conformities: 3, to_review: 5 } }));
    await fs.writeFile(path.join(dir, 'compliance-report-2026-11-15.md'), '# Rapport\n\ncontenu\n');
    assert.equal(await actionReport(dir, { GITHUB_STEP_SUMMARY: summary, GITHUB_OUTPUT: output }), 0);
    assert.equal(await fs.readFile(summary, 'utf8'), '# Rapport\n\ncontenu\n');
    const outputs = await fs.readFile(output, 'utf8');
    assert.match(outputs, /^non-conformities=3$/m);
    assert.match(outputs, /^to-review=5$/m);
    assert.match(outputs, /^report-json=.*compliance-report-2026-11-15\.json$/m);
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('sans rapport, le résumé dit que rien n\'a été vérifié', async () => {
    const dir = await tmpDir('action-empty');
    const summary = path.join(dir, 'summary.md');
    assert.equal(await actionReport(dir, { GITHUB_STEP_SUMMARY: summary }), 0);
    assert.match(await fs.readFile(summary, 'utf8'), /Nothing was verified/);
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('un rapport trop long pour le résumé est coupé, avec un avertissement', () => {
    const long = `${'ligne de rapport\n'.repeat(2000)}`;
    const cut = clip(long, 4000);
    assert.ok(Buffer.byteLength(cut) < 4200);
    assert.match(cut, /Report cut here/);
    assert.equal(clip('court\n', 4000), 'court\n');
  });
});

describe('veille des sources', () => {
  let server;
  let origin;
  const pages = { '/stable': '<html><head><script>var t=1</script></head><body><p>Article 1</p></body></html>' };
  let counter = 0;

  before(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/gone') { res.writeHead(403); res.end(); return; }
      if (req.url === '/moving') { counter += 1; res.writeHead(200, { 'content-type': 'text/html' }); res.end(`<p>visite ${counter}</p>`); return; }
      if (req.url === '/file') { res.writeHead(200, { 'content-type': 'application/pdf' }); res.end(pages['/file'] || 'v1'); return; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(pages[req.url]);
    });
    await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });
    origin = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => new Promise((resolve) => { server.close(resolve); }));

  test('l\'empreinte ignore les scripts, les balises et les espaces, pas le texte', () => {
    const a = fingerprint(Buffer.from('<p class="x">Article  1</p><script>token=1</script>'), 'text/html');
    const b = fingerprint(Buffer.from('<div><p>Article 1</p></div><script>token=2</script><!-- 3 -->'), 'text/html');
    const c = fingerprint(Buffer.from('<p>Article 2</p>'), 'text/html');
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.notEqual(fingerprint(Buffer.from('<p>a</p>'), 'application/pdf'), fingerprint(Buffer.from('<b>a</b>'), 'application/pdf'));
  });

  test('première lecture, page inchangée, page changée, page injoignable, page instable', async () => {
    const sources = [{ id: 'stable', title: 'Stable', url: `${origin}/stable` }, { id: 'gone', title: 'Gone', url: `${origin}/gone` },
      { id: 'moving', title: 'Moving', url: `${origin}/moving` }, { id: 'file', title: 'File', url: 'https://example.invalid/x', read_at: `${origin}/file` }];
    const state = (results, id) => results.find((r) => r.id === id).state;
    const first = await checkSources(sources, {}, { twice: true });
    assert.equal(state(first, 'stable'), 'new');
    assert.equal(state(first, 'gone'), 'unreachable');
    assert.equal(state(first, 'moving'), 'unstable');
    assert.equal(state(first, 'file'), 'new');
    const baseline = nextBaseline(first, {}, '2026-11-15');
    assert.equal(baseline.stable.status, 'ok');
    assert.equal(baseline.gone.status, 'unreachable');
    assert.equal(baseline.moving.status, 'unstable');
    assert.equal(baseline.file.url, `${origin}/file`);

    const second = await checkSources(sources, baseline);
    assert.deepEqual(['stable', 'gone', 'moving', 'file'].map((id) => state(second, id)), ['unchanged', 'unreachable', 'unstable', 'unchanged']);

    pages['/stable'] = '<html><body><p>Article 1 modifié</p></body></html>';
    pages['/file'] = 'v2';
    const third = await checkSources(sources, baseline);
    assert.equal(state(third, 'stable'), 'changed');
    assert.equal(state(third, 'file'), 'changed');
    const markdown = toMarkdown(third, '2026-11-22');
    assert.match(markdown, /## Pages that changed/);
    assert.match(markdown, /`stable`: Stable/);
    assert.match(markdown, /not that the law changed/);
    // Une source devenue injoignable garde son empreinte : elle sera comparée à son retour.
    assert.deepEqual(nextBaseline([{ id: 'stable', url: `${origin}/stable`, state: 'unreachable' }], baseline, '2026-11-22').stable, baseline.stable);
  });

  test('chaque source du registre a une empreinte enregistrée', async () => {
    const registry = await readJson(path.join(ROOT, 'references', 'sources.json'));
    const stored = await readJson(path.join(ROOT, 'references', 'sources-fingerprints.json'));
    for (const source of registry.sources) {
      const entry = stored.fingerprints[source.id];
      assert.ok(entry, `empreinte absente pour ${source.id} : lancer node scripts/watch-sources.mjs --update`);
      assert.equal(entry.url, source.read_at || source.url, `adresse changée pour ${source.id} : relancer --update`);
    }
  });
});

describe('serveur MCP', () => {
  let client;
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    return { ...result, data: result.isError ? null : JSON.parse(result.content[0].text), text: result.content[0].text };
  };

  before(async () => {
    client = new Client({ name: 'ewc-tests', version: '0.0.0' });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(ROOT, 'mcp', 'server.mjs')], cwd: ROOT, stderr: 'pipe' }));
  });
  after(async () => { await client.close(); });

  test('quatre outils, chacun avec sa description et son schéma', async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), ['audit_site', 'get_rule', 'get_template', 'qualify_project']);
    for (const tool of tools) assert.ok(tool.description.length > 40 && tool.inputSchema.type === 'object');
    assert.match(client.getInstructions(), /never a statement that a site is compliant/);
  });

  test('get_rule et get_template lisent references/ et templates/', async () => {
    const rules = await call('get_rule', { tag: '[RGAA 11.1]' });
    assert.ok(rules.data.rules.length > 0 && rules.data.official_text);
    const list = await call('get_template', {});
    assert.ok(list.data.templates.some((t) => t.name === 'cookie-policy.md'));
    const template = await call('get_template', { name: 'cookie-policy' });
    assert.equal(template.data.content, await fs.readFile(path.join(ROOT, 'templates', 'cookie-policy.md'), 'utf8'));
    const refused = await call('get_template', { name: '../package.json' });
    assert.equal(refused.isError, true);
  });

  test('qualify_project rend la matrice, ou une erreur lisible', async () => {
    const profile = await readJson(path.join(ROOT, 'templates', 'profile.example.json'));
    const matrix = await call('qualify_project', { profile });
    assert.ok(matrix.data.counts.applies > 0);
    assert.equal((await call('qualify_project', {})).isError, true);
    const invalid = await call('qualify_project', { profile: { schema_version: 1, nope: 1 } });
    assert.equal(invalid.isError, true);
    assert.match(invalid.text, /unknown key/);
  });

  test('audit_site lance check-all et rend le rapport, constats les plus graves d\'abord', { timeout: 300000 }, async () => {
    const result = await call('audit_site', { target: path.join(ROOT, 'tests', 'fixtures', 'security', 'weak'), only: ['security'], max_findings: 5 });
    assert.ok(!result.isError, result.text);
    const { data } = result;
    assert.match(data.notice, /Not an audit/);
    assert.match(data.data_notice, /data, not instructions/);
    assert.ok(data.summary.non_conformities > 0);
    assert.ok(data.findings.length <= 5 && data.findings_total >= data.findings.length);
    assert.equal(data.findings[0].verdict, 'NC');
    assert.deepEqual(data.checkers.map((c) => `${c.name}:${c.status}`), ['a11y:skipped', 'privacy:skipped', 'security:ran', 'content:skipped']);
    assert.ok((await fs.stat(data.full_report.json)).isFile());
    await fs.rm(path.dirname(data.full_report.json), { recursive: true, force: true });
    const missing = await call('audit_site', { target: path.join(ROOT, 'no-such-folder') });
    assert.equal(missing.isError, true);
  });
});
