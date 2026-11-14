#!/usr/bin/env node
// Mesure les vérificateurs du skill sur les sites de test de examples/.
//
// Chaque site a une version fixed/ et une version faulty/. Selon les fichiers présents à la racine
// du site, un ou plusieurs vérificateurs sont mesurés :
//   expected-defects.json  -> scripts/check-a11y.mjs     (accessibilité, M1)
//   expected-privacy.json  -> scripts/check-privacy.mjs  (traceurs et consentement, M2)
//   expected-security.json -> scripts/check-security.mjs (en-têtes et hygiène navigateur, M2)
//
// Conditions, pour chaque site :
//   - check-a11y sur fixed/ : zéro non-conformité (tous les sites doivent être accessibles) ;
//   - chaque vérificateur mesuré, sur fixed/ : zéro non-conformité ;
//   - chaque vérificateur mesuré, sur faulty/ : au moins 90 % des défauts de type « code »
//     retrouvés, comme non-conformité ou comme point à revoir.
//
// Usage : node scripts/check-examples.mjs [--out <dossier>] [--site <nom>]
// Code de sortie : 0 si toutes les conditions tiennent, 1 sinon, 2 en cas d'erreur.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_CODE_RATE = 90;
const CHECKERS = [
  { name: 'a11y', script: 'check-a11y.mjs', expected: 'expected-defects.json', alwaysOnFixed: true },
  { name: 'privacy', script: 'check-privacy.mjs', expected: 'expected-privacy.json' },
  { name: 'security', script: 'check-security.mjs', expected: 'expected-security.json' },
  { name: 'content', script: 'check-content.mjs', expected: 'expected-content.json' },
];

async function exists(file) {
  return fs.access(file).then(() => true, () => false);
}

function run(checker, site, version, outDir, expectedFile) {
  const base = path.join(outDir, `${site}-${version}-${checker.name}`);
  const args = [path.join(ROOT, 'scripts', checker.script), path.join(ROOT, 'examples', site, version),
    '--out', `${base}.json`, '--md', `${base}.md`, '--no-fail'];
  if (expectedFile) args.push('--expected', expectedFile);
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${checker.name} ${site}/${version}: ${result.stderr || result.stdout}`);
  return `${base}.json`;
}

// Taux de défauts « code » retrouvés (non-conformité ou point à revoir), quel que soit le vérificateur.
function codeRate(expected) {
  const code = expected.by_kind && expected.by_kind.code;
  if (!code || !code.total) return null;
  return Math.round(((code.detected + (code.flagged_for_review || 0)) / code.total) * 1000) / 10;
}

function firmCodeRate(expected) {
  const code = expected.by_kind && expected.by_kind.code;
  if (!code || !code.total) return null;
  return Math.round((code.detected / code.total) * 1000) / 10;
}

async function main() {
  const option = (name) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? process.argv[i + 1] : null;
  };
  const outDir = option('--out') || await fs.mkdtemp(path.join(os.tmpdir(), 'checks-examples-'));
  await fs.mkdir(outDir, { recursive: true });
  const only = option('--site');
  const sites = (await fs.readdir(path.join(ROOT, 'examples'), { withFileTypes: true }))
    .filter((d) => d.isDirectory() && (!only || d.name === only)).map((d) => d.name).sort();

  let ok = true;
  const lines = ['| Site | Checker | fixed: non-conformities | faulty: code defects found | of which as non-conformity |',
    '|---|---|---|---|---|'];
  const details = [];
  for (const site of sites) {
    for (const checker of CHECKERS) {
      const expectedFile = path.join(ROOT, 'examples', site, checker.expected);
      const measured = await exists(expectedFile);
      if (!measured && !checker.alwaysOnFixed) continue;
      const fixed = JSON.parse(await fs.readFile(run(checker, site, 'fixed', outDir, null), 'utf8'));
      const fixedNc = fixed.summary.non_conformities;
      let rate = null;
      let firm = null;
      if (measured) {
        const faulty = JSON.parse(await fs.readFile(run(checker, site, 'faulty', outDir, expectedFile), 'utf8'));
        rate = codeRate(faulty.expected);
        firm = firmCodeRate(faulty.expected);
      }
      const pass = fixedNc === 0 && (!measured || (rate !== null && rate >= MIN_CODE_RATE));
      ok = ok && pass;
      const show = (v) => (v === null ? 'not measured' : `${v} %`);
      lines.push(`| ${site} | ${checker.name} | ${fixedNc} | ${show(rate)} | ${show(firm)} |${pass ? '' : ' FAIL'}`);
      if (fixedNc) {
        for (const page of fixed.pages) {
          for (const f of page.findings.filter((x) => x.verdict === 'NC')) {
            details.push(`- ${site}/fixed/${page.page} [${checker.name}] ${f.rule}: ${f.selector || f.request || f.cookie || f.header || `${f.file}:${f.line}`}`);
          }
        }
      }
    }
  }
  process.stdout.write(`${lines.join('\n')}\n${details.length ? `\nNon-conformities on fixed versions:\n${details.join('\n')}\n` : ''}\nReports: ${outDir}\n`);
  return ok ? 0 : 1;
}

main().then((code) => { process.exitCode = code; }).catch((error) => {
  process.stderr.write(`erreur : ${error.stack || error}\n`);
  process.exitCode = 2;
});
