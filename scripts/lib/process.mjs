// Lancement des sous-processus de scripts/check-all.mjs : vérificateurs (Node) et scripts Python.

import { spawn } from 'node:child_process';

// Délai par défaut d'un vérificateur : un site de quelques dizaines de pages tient largement dedans ;
// au-delà, le processus est arrêté plutôt que de bloquer check-all indéfiniment.
export const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

// Taille maximale des sorties gardées en mémoire : un vérificateur rend son rapport sur la sortie
// standard, quelques Mio pour un grand site ; au-delà, le processus est arrêté.
export const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

// Lance une commande et rend { code, stdout, stderr, spawnError?, timedOut?, truncated? }. Ne rejette jamais.
export function exec(command, args, { cwd = process.cwd(), timeoutMs = DEFAULT_TIMEOUT_MS, maxOutputBytes = MAX_OUTPUT_BYTES } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let size = 0;
    let truncated = false;
    const keep = (chunk) => {
      size += chunk.length;
      if (size <= maxOutputBytes) return true;
      if (!truncated) {
        truncated = true;
        child.kill();
      }
      return false;
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.stdout.on('data', (d) => { if (keep(d)) stdout += d; });
    child.stderr.on('data', (d) => { if (keep(d)) stderr += d; });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ code: null, stdout, stderr: String(error.message), spawnError: error.code });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      let note = stderr;
      if (timedOut) note = `${stderr}\nstopped after ${Math.round(timeoutMs / 1000)} s`;
      else if (truncated) note = `${stderr}\nstopped: more than ${Math.round(maxOutputBytes / 1048576)} MiB of output`;
      resolve({ code, stdout, stderr: note, timedOut, truncated });
    });
  });
}

function isJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// Interpréteurs essayés, chacun sous la forme [commande, ...arguments placés avant le script] :
// variable PYTHON, sinon python, py puis python3 sous Windows, python3 puis python ailleurs.
function defaultCandidates() {
  if (process.env.PYTHON) return [[process.env.PYTHON]];
  return process.platform === 'win32' ? [['python'], ['py', '-3'], ['python3']] : [['python3'], ['python']];
}

// Lance un script Python. On passe à l'interpréteur suivant quand la commande n'existe pas, ou
// quand elle échoue sans rendre de JSON : c'est le cas de l'alias « python » du Microsoft Store,
// qui existe mais n'est pas Python. Une erreur rendue par le script lui-même (sortie JSON, ou
// dernier interpréteur) est renvoyée telle quelle.
export async function python(args, { candidates = defaultCandidates(), timeoutMs } = {}) {
  let last = null;
  let failure = null;
  for (const [cmd, ...prefix] of candidates) {
    last = await exec(cmd, [...prefix, ...args], { timeoutMs });
    if (last.spawnError === 'ENOENT') continue;
    if (last.code !== 0 && !isJson(last.stdout)) {
      failure = last; // le plus récent : un vrai Python vient après l'alias du Store
      continue;
    }
    return last;
  }
  return failure || last;
}
