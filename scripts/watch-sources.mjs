#!/usr/bin/env node
// Veille réglementaire : dit si les pages officielles du registre references/sources.json ont
// changé depuis la dernière empreinte enregistrée (references/sources-fingerprints.json).
//
// Usage :
//   node scripts/watch-sources.mjs                 compare et affiche le rapport (Markdown)
//     --out <fichier>      écrit aussi le rapport Markdown dans ce fichier
//     --json <fichier>     écrit le résultat détaillé en JSON
//     --only <id,id>       limite la vérification à ces sources
//     --update             enregistre les empreintes du jour (après relecture des pages changées)
//     --registry <fichier> registre des sources (défaut : references/sources.json)
//     --baseline <fichier> empreintes (défaut : references/sources-fingerprints.json)
//
// Ce que le script dit, et ce qu'il ne dit pas : une empreinte différente signifie que le texte
// de la page a changé, pas que le droit a changé (une mise en page, une actualité en marge
// suffisent). À l'inverse, une page inchangée ne prouve pas que le texte est toujours en vigueur.
// Dans les deux cas, la règle du dépôt reste : relire la source officielle, mettre à jour
// `consulted` dans sources.json et les faits de regulatory-status.md, puis lancer --update.
//
// Statut d'une source : ok (empreinte stable), unstable (deux lectures de suite diffèrent : page
// dynamique, non comparée tant que --update ne la relit pas deux fois à l'identique), unreachable
// (erreur réseau ou HTTP 4xx/5xx : beaucoup de sites officiels refusent les robots, ces sources
// restent sous la règle manuelle des 90 jours). Une page lue jusque-là qui répond 404 ou 410 est
// signalée comme disparue (gone) : elle a été retirée ou déplacée.
//
// Requêtes : GET seulement, vers les adresses du registre, sans cookie ni donnée personnelle.
// Codes de sortie : 0 rien n'a changé, 1 au moins une page a changé ou disparu, ou une source est
// nouvelle, 2 erreur d'usage (dont un identifiant inconnu après --only).

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const USER_AGENT = 'eu-web-compliance-source-watch/1 (weekly check of official pages)';
const TIMEOUT_MS = 30000;
const CONCURRENCY = 6;
const GONE = new Set([404, 410]);
// Les textes officiels suivis pèsent quelques Mio au plus (PDF compris) ; au-delà, la page n'est pas lue.
export const MAX_BYTES = 25 * 1024 * 1024;

// Texte lisible d'une page HTML : sans scripts, styles, commentaires ni balises, espaces réduits.
// Les jetons de session et les identifiants techniques vivent dans les attributs et les scripts,
// pas dans le texte.
export function normalise(body, contentType = '') {
  if (!/html|xml/i.test(contentType)) return body;
  const text = Buffer.from(body).toString('utf8')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Buffer.from(text, 'utf8');
}

export function fingerprint(body, contentType) {
  return createHash('sha256').update(normalise(body, contentType)).digest('hex');
}

// Corps d'une réponse, ou null s'il dépasse MAX_BYTES : la lecture s'arrête dès le dépassement.
async function readBody(response) {
  if (Number(response.headers.get('content-length')) > MAX_BYTES) return null;
  if (!response.body) return Buffer.from(await response.arrayBuffer());
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > MAX_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function read(url, fetcher) {
  try {
    const response = await fetcher(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,application/pdf,*/*;q=0.8' } });
    if (!response.ok) return { status: 'unreachable', detail: `HTTP ${response.status}`, http: response.status };
    const body = await readBody(response);
    if (!body) return { status: 'unreachable', detail: `larger than ${MAX_BYTES / 1048576} MiB` };
    return { status: 'ok', sha256: fingerprint(body, response.headers.get('content-type') || '') };
  } catch (error) {
    return { status: 'unreachable', detail: String((error.cause && error.cause.code) || error.name || error.message) };
  }
}

async function pool(items, worker, size = CONCURRENCY) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

// Compare chaque source à son empreinte. Renvoie [{ id, url, state, detail? , sha256? }] avec
// state : unchanged, changed, new, gone (page suivie qui répond 404 ou 410), unstable (non
// comparée), unreachable.
export async function checkSources(sources, baseline, { fetcher = fetch, twice = false } = {}) {
  return pool(sources, async (source) => {
    const url = source.read_at || source.url;
    const known = baseline[source.id];
    const now = await read(url, fetcher);
    const entry = { id: source.id, title: source.title, url };
    if (now.status !== 'ok') {
      // Un refus (403, 429) ou une panne peut ne viser que le robot ; 404 et 410 sur une page
      // lue jusque-là disent qu'elle a été retirée ou déplacée : c'est un changement à relire.
      const gone = GONE.has(now.http) && known && known.url === url && known.status === 'ok';
      return { ...entry, state: gone ? 'gone' : 'unreachable', detail: now.detail };
    }
    let stableNow = false;
    if (twice) {
      const again = await read(url, fetcher);
      if (again.status === 'ok' && again.sha256 !== now.sha256) return { ...entry, state: 'unstable' };
      stableNow = again.status === 'ok';
    }
    if (!known || known.url !== url) return { ...entry, state: 'new', sha256: now.sha256 };
    // Une page jugée instable redevient comparable dès que deux lectures de suite concordent.
    if (known.status === 'unstable') return stableNow ? { ...entry, state: 'new', sha256: now.sha256 } : { ...entry, state: 'unstable' };
    if (known.status !== 'ok') return { ...entry, state: 'new', sha256: now.sha256 };
    return { ...entry, state: known.sha256 === now.sha256 ? 'unchanged' : 'changed', sha256: now.sha256 };
  });
}

// Empreintes à enregistrer après --update : une source injoignable garde son ancienne empreinte.
export function nextBaseline(results, baseline, today) {
  const fingerprints = {};
  for (const r of results) {
    if (r.state === 'unreachable' || r.state === 'gone') fingerprints[r.id] = baseline[r.id] && baseline[r.id].url === r.url ? baseline[r.id] : { url: r.url, status: 'unreachable', checked: today };
    else if (r.state === 'unstable') fingerprints[r.id] = { url: r.url, status: 'unstable', checked: today };
    else fingerprints[r.id] = { url: r.url, status: 'ok', sha256: r.sha256, checked: today };
  }
  return Object.fromEntries(Object.entries(fingerprints).sort(([a], [b]) => a.localeCompare(b)));
}

export function toMarkdown(results, today) {
  const of = (state) => results.filter((r) => r.state === state);
  const list = (items, more = () => '') => items.map((r) => `- \`${r.id}\`: ${r.title} (<${r.url}>)${more(r)}`);
  const lines = [`# Regulatory watch, ${today}`, '',
    `${results.length} source(s) of \`references/sources.json\` checked: ${of('changed').length} changed, ${of('gone').length} gone, ${of('new').length} without a fingerprint, ${of('unchanged').length} unchanged, ${of('unstable').length} not comparable, ${of('unreachable').length} unreachable.`, '',
    'A different fingerprint means the text of the page changed, not that the law changed. An unchanged page does not prove that the text is still in force. Nothing in the skill is updated automatically.', ''];
  if (of('changed').length) {
    lines.push('## Pages that changed', '', ...list(of('changed')), '',
      'For each one: re-read the official page, correct the facts of `references/regulatory-status.md` and the rules that cite the source if needed, update `consulted` in `references/sources.json`, then run `node scripts/watch-sources.mjs --update` and commit the fingerprints.', '');
  }
  if (of('gone').length) {
    lines.push('## Pages that disappeared', '', ...list(of('gone'), (r) => `: ${r.detail}`), '',
      'These pages were read before and now answer "not found". Find where the official text moved, correct `url` (or `read_at`) and `consulted` in `references/sources.json`, check the facts that cite the source, then run `node scripts/watch-sources.mjs --update`.', '');
  }
  if (of('new').length) lines.push('## Sources without a fingerprint', '', ...list(of('new')), '', 'Run `node scripts/watch-sources.mjs --update` after reading them.', '');
  if (of('unreachable').length) {
    lines.push('## Unreachable by the robot', '', ...list(of('unreachable'), (r) => `: ${r.detail}`), '',
      'These pages are not watched: they stay under the manual rule (`python scripts/validate.py --strict` flags sources consulted more than 90 days ago).', '');
  }
  if (of('unstable').length) lines.push('## Not comparable (the page differs between two readings)', '', ...list(of('unstable')), '');
  // Signature des pages à relire : le workflow s'en sert pour ne pas répéter le même commentaire.
  const ids = (state) => of(state).map((r) => r.id).sort().join(',');
  if (needsAttention(results)) lines.push(`<!-- watch-signature: changed=${ids('changed')}; gone=${ids('gone')}; new=${ids('new')} -->`);
  return `${lines.join('\n').trim()}\n`;
}

// Vrai quand une personne doit relire quelque chose : c'est ce qui fait ouvrir l'issue de veille.
export function needsAttention(results) {
  return results.some((r) => r.state === 'changed' || r.state === 'new' || r.state === 'gone');
}

function parse(argv) {
  const args = { update: false };
  const values = { '--out': 'out', '--json': 'json', '--only': 'only', '--registry': 'registry', '--baseline': 'baseline' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--update') args.update = true;
    else if (values[argv[i]] && i + 1 < argv.length) { args[values[argv[i]]] = argv[i + 1]; i += 1; }
    else throw new Error(`unknown option or missing value: ${argv[i]}`);
  }
  return args;
}

async function main() {
  let args;
  try {
    args = parse(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`usage : ${error.message}\n`);
    return 2;
  }
  const registryFile = path.resolve(args.registry || path.join(ROOT, 'references', 'sources.json'));
  const baselineFile = path.resolve(args.baseline || path.join(ROOT, 'references', 'sources-fingerprints.json'));
  const wanted = args.only ? args.only.split(',').map((s) => s.trim()).filter(Boolean) : null;
  const registry = JSON.parse(await fs.readFile(registryFile, 'utf8'));
  const stored = JSON.parse(await fs.readFile(baselineFile, 'utf8').catch(() => '{"fingerprints":{}}'));
  const unknown = (wanted || []).filter((id) => !registry.sources.some((s) => s.id === id));
  if (unknown.length) {
    process.stderr.write(`usage : --only names source(s) absent from the registry: ${unknown.join(', ')}\n`);
    return 2;
  }
  const sources = registry.sources.filter((s) => !wanted || wanted.includes(s.id));
  const today = new Date().toISOString().slice(0, 10);
  const results = await checkSources(sources, stored.fingerprints, { twice: args.update });
  const markdown = toMarkdown(results, today);
  if (args.out) await fs.writeFile(args.out, markdown);
  if (args.json) await fs.writeFile(args.json, `${JSON.stringify({ date: today, results }, null, 2)}\n`);
  process.stdout.write(markdown);
  if (args.update) {
    const fingerprints = { ...(wanted ? stored.fingerprints : {}), ...nextBaseline(results, stored.fingerprints, today) };
    await fs.writeFile(baselineFile, `${JSON.stringify({ schema_version: 1,
      note: 'Fingerprints of the official pages of sources.json, written by scripts/watch-sources.mjs --update. Never edit by hand.',
      updated: today, fingerprints }, null, 2)}\n`);
    process.stdout.write(`\nfingerprints written: ${baselineFile}\n`);
    return 0;
  }
  return needsAttention(results) ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`watch-sources: ${error.stack || error}\n`);
    process.exitCode = 2;
  });
}
