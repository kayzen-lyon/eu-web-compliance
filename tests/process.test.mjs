// Tests de scripts/lib/process.mjs (lancement des vérificateurs et de Python par check-all).
// Lancement : node --test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { exec, python } from '../scripts/lib/process.mjs';

describe('process: lancement des sous-processus', () => {
  test('un sous-processus qui ne se termine pas est arrêté après le délai', { timeout: 20000 }, async () => {
    const started = Date.now();
    const result = await exec(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeoutMs: 1500 });
    assert.equal(result.timedOut, true);
    assert.ok(Date.now() - started < 15000);
  });

  test('Python : un interpréteur qui échoue sans JSON (alias du Microsoft Store) laisse essayer le suivant', async () => {
    const result = await python(['ignored'], {
      candidates: [[process.execPath, '-e', 'process.stderr.write("Python was not found"); process.exit(9009)'],
        [process.execPath, '-e', 'process.stdout.write(JSON.stringify({ ok: true }))']],
    });
    assert.equal(result.code, 0);
    assert.deepEqual(JSON.parse(result.stdout), { ok: true });
  });

  test('Python : une erreur du script lui-même est rendue telle quelle', async () => {
    const result = await python(['ignored'], {
      candidates: [[process.execPath, '-e', 'process.stdout.write(JSON.stringify({ error: 1 })); process.exit(2)'],
        [process.execPath, '-e', 'process.exit(0)']],
    });
    assert.equal(result.code, 2);
  });
});
