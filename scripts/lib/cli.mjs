// Fonctions communes aux vérificateurs : arguments, pages à contrôler, taux de détection, sorties.
// Le format des rapports suit celui de scripts/check-a11y.mjs : `summary`, `pages[].findings[]`
// avec `verdict` NC (non-conformité) ou NT (à revoir), et un bloc `expected` quand un fichier
// de défauts attendus est fourni.

import fs from 'node:fs/promises';
import path from 'node:path';
import { startStaticServer } from './static-server.mjs';

export class UsageError extends Error {}

// spec : { values: ['--out', ...], flags: ['--no-fail', ...] }. Renvoie un objet dont les
// clés sont les noms d'option en camelCase sans tirets, plus `targets` et `fail`.
export function parseArgs(argv, spec) {
  const camel = (option) => option.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const args = { targets: [], fail: true };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (spec.values.includes(value)) {
      if (i + 1 >= argv.length) throw new UsageError(`option ${value} : valeur manquante`);
      i += 1;
      args[camel(value)] = argv[i];
    } else if (value === '--no-fail') args.fail = false;
    else if (spec.flags.includes(value)) args[camel(value)] = true;
    else if (value.startsWith('--')) throw new UsageError(`option inconnue : ${value}`);
    else args.targets.push(value);
  }
  if (args.targets.length !== 1) throw new UsageError('indiquer un dossier, un fichier HTML ou une URL');
  return args;
}

export async function listHtmlFiles(root) {
  const found = [];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.toLowerCase().endsWith('.html')) found.push(path.relative(root, full).split(path.sep).join('/'));
    }
  }
  await walk(root);
  return found.sort();
}

// Pages à contrôler. Une URL est prise telle quelle ; un dossier ou un fichier est servi en local
// (avec ses en-têtes `_headers`). Renvoie { pages: [{ page, url }], root, server }.
export async function resolvePages(target) {
  if (/^https?:\/\//i.test(target)) return { pages: [{ page: target, url: target }], root: null, server: null };
  const stat = await fs.stat(target).catch(() => null);
  if (!stat) throw new UsageError(`introuvable : ${target}`);
  const root = stat.isDirectory() ? target : path.dirname(target);
  const files = stat.isDirectory() ? await listHtmlFiles(root) : [path.basename(target)];
  if (!files.length) throw new UsageError(`aucune page HTML dans ${target}`);
  const server = await startStaticServer(root);
  const pages = files.map((file) => ({ page: file, url: `${server.origin}/${file.split('/').map(encodeURIComponent).join('/')}` }));
  return { pages, root, server };
}

export async function readJson(file, label) {
  const text = await fs.readFile(file, 'utf8').catch((error) => {
    throw new UsageError(`${label} : lecture impossible de ${file} (${error.code || error.message})`);
  });
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new UsageError(`${label} : JSON invalide dans ${file} (${error.message})`);
  }
}

// Défauts attendus : tableau, ou objet { defects: [...] }. Chaque entrée :
// { id, page, rule, kind?, severity?, detail? }. `detail`, s'il est donné, doit apparaître
// dans le texte du constat (nom du cookie, hôte de la requête, nom de l'en-tête...).
export async function loadExpected(file) {
  if (!file) return null;
  const data = await readJson(file, '--expected');
  const list = Array.isArray(data) ? data : data.defects;
  if (!Array.isArray(list)) throw new UsageError('--expected : tableau ou objet { "defects": [...] } attendu');
  list.forEach((d, i) => {
    // rule peut valoir null : défaut qu'aucun vérificateur ne sait trouver (kind « human » ou « runtime »).
    if (!d || typeof d.id !== 'string' || typeof d.page !== 'string' || (typeof d.rule !== 'string' && d.rule !== null)) {
      throw new UsageError(`--expected : entrée ${i} sans id ni page (chaînes), ou rule ni chaîne ni null`);
    }
  });
  return list;
}

function findingText(f) {
  return JSON.stringify([f.message, f.selector, f.request, f.cookie, f.storage, f.header, f.detail]);
}

export function scoreExpected(expectedList, pages) {
  const results = expectedList.map((defect) => {
    const page = pages.find((p) => p.page === defect.page);
    const related = (page && defect.rule ? page.findings : []).filter((f) => f.rule === defect.rule
      && (!defect.detail || findingText(f).toLowerCase().includes(String(defect.detail).toLowerCase())));
    const detected = related.some((f) => f.verdict === 'NC');
    return { id: defect.id, page: defect.page, rule: defect.rule, kind: defect.kind || 'code', severity: defect.severity || null,
      page_checked: Boolean(page), detected, flagged_for_review: !detected && related.some((f) => f.verdict === 'NT') };
  });
  const byKind = {};
  for (const r of results) {
    const k = (byKind[r.kind] = byKind[r.kind] || { total: 0, detected: 0, flagged_for_review: 0 });
    k.total += 1;
    if (r.detected) k.detected += 1;
    if (r.flagged_for_review) k.flagged_for_review += 1;
  }
  const rate = (n) => (results.length ? Math.round((n / results.length) * 1000) / 10 : null);
  const detected = results.filter((r) => r.detected).length;
  const flagged = results.filter((r) => r.flagged_for_review).length;
  return { total: results.length, detected, flagged_for_review: flagged, detection_rate: rate(detected),
    detection_or_review_rate: rate(detected + flagged), by_kind: byKind, defects: results };
}

export function summarise(findings) {
  const count = (verdict) => findings.filter((f) => f.verdict === verdict).length;
  return { non_conformities: count('NC'), to_review: count('NT') };
}

export function mdCell(value) {
  return String(value === undefined || value === null ? '' : value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function expectedMarkdown(e) {
  if (!e) return [];
  const lines = ['## Detection of planted defects', '', `- Detected as non-conformity: ${e.detected} of ${e.total}`,
    `- Only flagged for review: ${e.flagged_for_review}`,
    `- Detection rate: ${e.detection_rate === null ? 'n/a' : `${e.detection_rate} %`}`, ''];
  const missed = e.defects.filter((d) => !d.detected);
  if (missed.length) lines.push(`Not detected as non-conformity: ${missed.map((d) => d.id).join(', ')}`, '');
  return lines;
}

export async function writeOutputs(args, report, markdown) {
  if (args.out) await fs.writeFile(args.out, `${JSON.stringify(report, null, 2)}\n`);
  if (args.md) await fs.writeFile(args.md, markdown);
}

// Exécute main() et traduit le résultat en code de sortie : 0, 1 (non-conformité), 2 (usage ou erreur).
export function run(main) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    if (error instanceof UsageError) process.stderr.write(`usage : ${error.message}\n`);
    else process.stderr.write(`erreur : ${error.stack || error}\n`);
    process.exitCode = 2;
  });
}
