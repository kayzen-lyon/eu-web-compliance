#!/usr/bin/env node
// Mesure le vérificateur d'accessibilité sur les sites de test de examples/.
//
// Pour chaque site :
//   - la version fixed/ doit produire zéro non-conformité (aucun faux « non conforme ») ;
//   - sur la version faulty/, au moins 90 % des défauts de type « code » doivent être
//     retrouvés, comme non-conformité ou comme point à revoir (critère de sortie de M1).
//
// Usage : node scripts/check-examples.mjs [--out <dossier>]
// Code de sortie : 0 si les deux conditions tiennent pour tous les sites, 1 sinon, 2 en cas d'erreur.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = path.join(ROOT, 'scripts', 'check-a11y.mjs');
const MIN_CODE_RATE = 90;

function run(site, version, outDir) {
  const out = path.join(outDir, `${site}-${version}.json`);
  const md = path.join(outDir, `${site}-${version}.md`);
  const args = [CHECK, path.join(ROOT, 'examples', site, version), '--out', out, '--md', md, '--no-fail',
    '--expected', path.join(ROOT, 'examples', site, 'expected-defects.json')];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${site}/${version}: ${result.stderr || result.stdout}`);
  return out;
}

async function main() {
  const outIndex = process.argv.indexOf('--out');
  const outDir = outIndex > 0 ? process.argv[outIndex + 1] : await fs.mkdtemp(path.join(os.tmpdir(), 'a11y-examples-'));
  await fs.mkdir(outDir, { recursive: true });
  const sites = (await fs.readdir(path.join(ROOT, 'examples'), { withFileTypes: true }))
    .filter((d) => d.isDirectory()).map((d) => d.name).sort();
  let ok = true;
  const lines = ['| Site | fixed: non-conformities | faulty: code defects found | of which as non-conformity |', '|---|---|---|---|'];
  for (const site of sites) {
    const fixed = JSON.parse(await fs.readFile(run(site, 'fixed', outDir), 'utf8'));
    const faulty = JSON.parse(await fs.readFile(run(site, 'faulty', outDir), 'utf8'));
    const fixedNc = fixed.summary.non_conformities;
    const rate = faulty.expected.code_detection_or_review_rate;
    const firm = faulty.expected.code_detection_rate;
    const pass = fixedNc === 0 && rate !== null && rate >= MIN_CODE_RATE;
    ok = ok && pass;
    lines.push(`| ${site} | ${fixedNc} | ${rate} % | ${firm} % |${pass ? '' : ' FAIL'}`);
    if (fixedNc) {
      for (const page of fixed.pages) {
        for (const f of page.findings.filter((x) => x.verdict === 'NC')) lines.push(`  fixed/${page.page}: ${f.rule} ${f.selector || `${f.file}:${f.line}`}`);
      }
    }
  }
  process.stdout.write(`${lines.join('\n')}\n\nReports: ${outDir}\n`);
  return ok ? 0 : 1;
}

main().then((code) => { process.exitCode = code; }).catch((error) => {
  process.stderr.write(`erreur : ${error.stack || error}\n`);
  process.exitCode = 2;
});
