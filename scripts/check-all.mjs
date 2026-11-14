#!/usr/bin/env node
// Vérification complète d'un site (mode « Vérifier » du skill) : matrice d'applicabilité,
// classement AI Act, puis les quatre vérificateurs, fusionnés en un rapport unique Markdown et JSON
// (schemas/report.schema.json).
//
// Usage :
//   node scripts/check-all.mjs <dossier du site | URL> [options]
//     --project <dossier>       racine du projet de l'utilisateur (défaut : dossier courant)
//     --profile <fichier>       profil du projet (défaut : <projet>/compliance/profile.json)
//     --out <dossier>           dossier des rapports (défaut : <projet>/compliance/reports/)
//     --only <liste>            vérificateurs à lancer parmi a11y,privacy,security,content
//     --expected-dir <dossier>  défauts attendus (sites de test) : expected-<vérificateur>.json,
//                               ou expected-defects.json pour l'accessibilité
//     --lang en|fr              langue des libellés du rapport Markdown (défaut : en)
//     --no-fail                 code de sortie 0 même en cas de non-conformité
//
// Sorties dans --out : compliance-report-AAAA-MM-JJ.md et .json (suffixe -2, -3... si le fichier
// existe), et les rapports bruts des vérificateurs dans compliance-report-AAAA-MM-JJ-raw/.
//
// Les scripts et références du skill sont cherchés à côté de ce fichier, jamais dans le dossier
// courant : le skill peut être installé ailleurs que dans le projet vérifié. Les vérificateurs
// interrompent toute requête vers un hôte tiers quand ils servent un dossier local.
//
// Codes de sortie : 0 aucune non-conformité, 1 au moins une, 2 erreur d'usage ou vérificateur
// qui n'a pas pu tourner.

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UsageError, parseArgs, listHtmlFiles, run } from './lib/cli.mjs';
import { CHECKERS, loadContext } from './lib/report-normalise.mjs';
import { indexPage } from './lib/report-matrix.mjs';
import { buildReport } from './lib/report-build.mjs';
import { toMarkdown } from './lib/report-markdown.mjs';
import { validateReport } from './lib/report-validate.mjs';

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(SCRIPTS, '..');
const REPORT_NAME = /^compliance-report-(\d{4}-\d{2}-\d{2})(?:-(\d+))?\.json$/;
const EXPECTED_FILES = {
  a11y: ['expected-a11y.json', 'expected-defects.json'], privacy: ['expected-privacy.json'],
  security: ['expected-security.json'], content: ['expected-content.json'],
};

function exec(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: options.cwd || process.cwd(), windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (error) => resolve({ code: null, stdout, stderr: String(error.message), spawnError: error.code }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

// Python : variable PYTHON, sinon python puis python3 (ou l'inverse hors Windows).
async function python(args) {
  const candidates = process.env.PYTHON ? [process.env.PYTHON] : (process.platform === 'win32' ? ['python', 'python3', 'py'] : ['python3', 'python']);
  let last = null;
  for (const cmd of candidates) {
    last = await exec(cmd, args);
    if (last.spawnError !== 'ENOENT') return last;
  }
  return last;
}

async function runPythonJson(script, args, label) {
  const result = await python([path.join(SCRIPTS, script), ...args]);
  if (result.code !== 0) return { error: `${label}: ${(result.stderr || result.stdout || 'no output').trim().split('\n').slice(-3).join(' ')}` };
  try {
    return { data: JSON.parse(result.stdout) };
  } catch (error) {
    return { error: `${label}: output is not JSON (${error.message})` };
  }
}

function declaresAi(profile) {
  const ai = profile && profile.ai;
  if (!ai || typeof ai !== 'object') return false;
  if (Array.isArray(ai.features) && ai.features.length) return true;
  return Object.entries(ai).some(([key, answer]) => key !== 'role' && answer && typeof answer === 'object' && answer.value === true);
}

function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function freeBaseName(outDir, date) {
  for (let n = 1; ; n += 1) {
    const base = n === 1 ? `compliance-report-${date}` : `compliance-report-${date}-${n}`;
    if (!existsSync(path.join(outDir, `${base}.md`)) && !existsSync(path.join(outDir, `${base}.json`))) return base;
  }
}

async function previousReport(outDir) {
  const names = (await fs.readdir(outDir).catch(() => [])).map((n) => n.match(REPORT_NAME)).filter(Boolean)
    .sort((a, b) => a[1].localeCompare(b[1]) || Number(a[2] || 1) - Number(b[2] || 1));
  for (const m of names.reverse()) {
    try {
      const data = JSON.parse(await fs.readFile(path.join(outDir, m[0]), 'utf8'));
      if (Array.isArray(data.findings)) return { ...data, file_name: m[0] };
    } catch { /* rapport illisible : on essaie le précédent */ }
  }
  return null;
}

async function siteIndexOf(target) {
  if (/^https?:\/\//i.test(target)) return null;
  const stat = await fs.stat(target);
  const root = stat.isDirectory() ? target : path.dirname(target);
  const files = stat.isDirectory() ? await listHtmlFiles(root) : [path.basename(target)];
  return Promise.all(files.map(async (page) => indexPage(page, await fs.readFile(path.join(root, page), 'utf8'))));
}

async function runChecker(name, target, tmp, options) {
  const script = path.join(SCRIPTS, `check-${name}.mjs`);
  if (!existsSync(script)) return { name, status: 'unavailable', error: `scripts/check-${name}.mjs not found` };
  const out = path.join(tmp, `check-${name}.json`);
  const args = [script, target, '--out', out];
  const expected = options.expectedDir && EXPECTED_FILES[name].map((f) => path.join(options.expectedDir, f)).find((f) => existsSync(f));
  if (expected) args.push('--expected', expected);
  // Déclarations du projet utilisées quand le dossier du site n'a pas les siennes.
  const siteRoot = options.siteRoot;
  const fromProject = (file) => (siteRoot && !existsSync(path.join(siteRoot, 'compliance', file))
    && existsSync(path.join(options.project, 'compliance', file)) ? path.join(options.project, 'compliance', file) : null);
  if (name === 'privacy' && fromProject('trackers.json')) args.push('--trackers', fromProject('trackers.json'));
  if (name === 'content' && fromProject('site.json')) args.push('--site', fromProject('site.json'));
  process.stdout.write(`check-${name} ...\n`);
  const result = await exec(process.execPath, args);
  if ((result.code === 0 || result.code === 1) && existsSync(out)) {
    try {
      return { name, status: 'ran', exit_code: result.code, raw: JSON.parse(await fs.readFile(out, 'utf8')), rawFile: out };
    } catch (error) {
      return { name, status: 'failed', exit_code: result.code, error: `invalid JSON report: ${error.message}` };
    }
  }
  return { name, status: 'failed', exit_code: result.code, error: (result.stderr || result.stdout || 'no report written').trim().split('\n').slice(-5).join('\n') };
}

function parseOptions(argv) {
  const args = parseArgs(argv, { values: ['--project', '--profile', '--out', '--only', '--expected-dir', '--lang'], flags: [] });
  const project = path.resolve(args.project || process.cwd());
  const only = args.only ? args.only.split(',').map((s) => s.trim()).filter(Boolean) : CHECKERS;
  const unknown = only.filter((c) => !CHECKERS.includes(c));
  if (unknown.length || !only.length) throw new UsageError(`--only : valeurs possibles ${CHECKERS.join(', ')} (reçu : ${args.only})`);
  const lang = args.lang || 'en';
  if (!['en', 'fr'].includes(lang)) throw new UsageError('--lang : en ou fr');
  if (args.expectedDir && !existsSync(args.expectedDir)) throw new UsageError(`--expected-dir : introuvable : ${args.expectedDir}`);
  return {
    target: args.targets[0], project, only, lang, fail: args.fail, expectedDir: args.expectedDir || null,
    profile: path.resolve(args.profile || path.join(project, 'compliance', 'profile.json')),
    out: path.resolve(args.out || path.join(project, 'compliance', 'reports')),
  };
}

async function main() {
  const opts = parseOptions(process.argv.slice(2));
  const remote = /^https?:\/\//i.test(opts.target);
  if (!remote && !existsSync(opts.target)) throw new UsageError(`introuvable : ${opts.target}`);
  const siteRoot = remote ? null : ((await fs.stat(opts.target)).isDirectory() ? opts.target : path.dirname(opts.target));
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-check-all-'));
  try {
    // 1. Matrice d'applicabilité (profil vide si le projet n'en a pas).
    const profileFound = existsSync(opts.profile);
    let profileData = {};
    let matrixInput = opts.profile;
    if (profileFound) {
      try {
        profileData = JSON.parse(await fs.readFile(opts.profile, 'utf8'));
      } catch (error) {
        throw new UsageError(`--profile : JSON invalide dans ${opts.profile} (${error.message})`);
      }
    } else {
      matrixInput = path.join(tmp, 'empty-profile.json');
      await fs.writeFile(matrixInput, '{"schema_version": 1}\n');
      process.stdout.write(`aucun profil (${opts.profile}) : matrice calculée sur un profil vide, tout est « à confirmer »\n`);
    }
    const matrix = await runPythonJson('applicability.py', [matrixInput, '--format', 'json'], 'applicability.py');
    // 2. Classement AI Act si le profil déclare une fonction d'IA.
    const hasAi = profileFound && declaresAi(profileData);
    const aiAct = hasAi ? await runPythonJson('ai_act_classify.py', [opts.profile, '--format', 'json'], 'ai_act_classify.py') : null;
    // 3. Vérificateurs, l'un après l'autre (chacun lance un navigateur).
    const runs = [];
    for (const name of CHECKERS) {
      if (!opts.only.includes(name)) runs.push({ name, status: 'skipped' });
      else runs.push(await runChecker(name, opts.target, tmp, { ...opts, siteRoot }));
    }
    // 4. Fusion.
    await fs.mkdir(opts.out, { recursive: true });
    const base = await freeBaseName(opts.out, localDate());
    const rawDir = `${base}-raw`;
    for (const r of runs.filter((x) => x.rawFile)) r.raw_report = `${rawDir}/check-${r.name}.json`;
    const testingByHand = await fs.readFile(path.join(SKILL_ROOT, 'references', 'accessibility', 'testing-by-hand.md'), 'utf8').catch(() => '');
    const report = buildReport({
      target: opts.target, language: opts.lang, generated: new Date().toISOString(),
      profile: { path: path.relative(opts.project, opts.profile).split(path.sep).join('/') || opts.profile, found: profileFound, declares_ai: hasAi },
      matrix: matrix.data || null, matrixError: matrix.error || null,
      aiAct: aiAct ? (aiAct.data || { error: aiAct.error }) : null,
      checkerRuns: runs, siteIndex: await siteIndexOf(opts.target), testingByHandText: testingByHand,
      previous: await previousReport(opts.out), ctx: await loadContext(SKILL_ROOT),
    });
    report.outputs = { markdown: `${base}.md`, json: `${base}.json`, raw: rawDir };
    const errors = await validateReport(report);
    if (errors.length) process.stderr.write(`attention : le rapport ne suit pas schemas/report.schema.json :\n${errors.slice(0, 10).join('\n')}\n`);
    // 5. Écriture.
    await fs.mkdir(path.join(opts.out, rawDir), { recursive: true });
    for (const r of runs.filter((x) => x.rawFile)) await fs.copyFile(r.rawFile, path.join(opts.out, r.raw_report));
    await fs.writeFile(path.join(opts.out, `${base}.json`), `${JSON.stringify(report, null, 2)}\n`);
    await fs.writeFile(path.join(opts.out, `${base}.md`), toMarkdown(report, opts.lang));
    const s = report.summary;
    process.stdout.write(`${s.non_conformities} non-conformité(s), ${s.to_review} point(s) à revoir, ${report.manual_checks.length} vérification(s) à faire par une personne\n`);
    for (const c of report.checkers.filter((x) => x.status !== 'ran' && x.status !== 'skipped')) process.stdout.write(`check-${c.name} : ${c.status} ${c.error || ''}\n`);
    process.stdout.write(`rapport : ${path.join(opts.out, `${base}.md`)}\n`);
    if (s.exit_code === 1 && !opts.fail) return 0;
    return s.exit_code;
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

run(main);
