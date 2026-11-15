#!/usr/bin/env node
// Étape « rapport » de la GitHub Action (action.yml) : recopie le rapport Markdown de check-all
// dans le résumé de l'exécution et publie quelques valeurs de sortie.
//
// Usage : node scripts/action-report.mjs <dossier des rapports>
//   GITHUB_STEP_SUMMARY  fichier du résumé (le rapport y est ajouté)
//   GITHUB_OUTPUT        fichier des sorties : non-conformities, to-review, report-json, report-markdown
//
// Ne décide jamais de l'échec de l'Action : c'est le code de sortie de check-all qui le fait.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// GitHub refuse un résumé d'étape de plus de 1 Mio : le rapport est coupé avant.
export const SUMMARY_LIMIT = 900 * 1024;

export async function latestReport(dir) {
  const names = (await fs.readdir(dir).catch(() => [])).filter((n) => /^compliance-report-.*\.json$/.test(n));
  if (!names.length) return null;
  const dated = await Promise.all(names.map(async (name) => ({ name, time: (await fs.stat(path.join(dir, name))).mtimeMs })));
  const { name } = dated.sort((a, b) => a.time - b.time).pop();
  return { json: path.join(dir, name), markdown: path.join(dir, name.replace(/\.json$/, '.md')) };
}

export function clip(markdown, limit = SUMMARY_LIMIT) {
  if (Buffer.byteLength(markdown) <= limit) return markdown;
  let text = markdown;
  while (Buffer.byteLength(text) > limit) text = text.slice(0, Math.floor(text.length * 0.9));
  return `${text.slice(0, text.lastIndexOf('\n'))}\n\n> Report cut here: the full text is in the downloadable artifact.\n`;
}

export async function main(dir, env = process.env) {
  if (!dir) {
    process.stderr.write('usage: node scripts/action-report.mjs <reports folder>\n');
    return 2;
  }
  const summary = env.GITHUB_STEP_SUMMARY;
  const output = env.GITHUB_OUTPUT;
  const found = await latestReport(dir);
  if (!found) {
    if (summary) await fs.appendFile(summary, '## eu-web-compliance\n\nNo report was produced: the checks could not run. See the log of the audit step. Nothing was verified.\n');
    return 0;
  }
  const report = JSON.parse(await fs.readFile(found.json, 'utf8'));
  const markdown = await fs.readFile(found.markdown, 'utf8').catch(() => '');
  if (summary) await fs.appendFile(summary, clip(markdown || `## eu-web-compliance\n\nReport: ${found.json}\n`));
  if (output) {
    await fs.appendFile(output, [`non-conformities=${report.summary.non_conformities}`, `to-review=${report.summary.to_review}`,
      `report-json=${found.json}`, `report-markdown=${found.markdown}`, ''].join('\n'));
  }
  process.stdout.write(`${report.summary.non_conformities} non-conformity(ies), ${report.summary.to_review} to review: ${found.markdown}\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2]).then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`action-report: ${error.stack || error}\n`);
    process.exitCode = 2;
  });
}
