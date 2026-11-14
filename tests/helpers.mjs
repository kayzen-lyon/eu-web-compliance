// Outils communs aux tests des vérificateurs : lancement d'un script et lecture de son rapport.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runScript(script, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', script), ...args], { cwd: ROOT, env: { ...process.env, ...env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

export async function runReport(script, args, env = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-report-'));
  const out = path.join(dir, 'report.json');
  const md = path.join(dir, 'report.md');
  const result = await runScript(script, [...args, '--out', out, '--md', md], env);
  assert.ok(result.code === 0 || result.code === 1, `${script} a échoué (code ${result.code}) : ${result.stderr}`);
  const report = JSON.parse(await fs.readFile(out, 'utf8'));
  const markdown = await fs.readFile(md, 'utf8');
  await fs.rm(dir, { recursive: true, force: true });
  return { ...result, report, markdown };
}
