// Socle commun des portes d'entrée du skill : outil en ligne de commande (bin/), serveur MCP (mcp/)
// et GitHub Action (action.yml). Chaque porte passe par ces fonctions, qui ne font qu'appeler
// scripts/check-all.mjs et scripts/applicability.py, et lire templates/ et references/ : aucune
// règle, aucun modèle et aucun contrôle n'est recopié ici. Une correction faite dans ces fichiers
// profite donc à toutes les portes d'entrée.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, python } from './process.mjs';

export const SKILL_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CHECK_ALL = path.join(SKILL_ROOT, 'scripts', 'check-all.mjs');
export const CHECKER_NAMES = ['a11y', 'privacy', 'security', 'content'];

export class SkillError extends Error {}

const posix = (p) => p.split(path.sep).join('/');

// Lignes d'un fichier texte, que ses fins de ligne soient LF ou CRLF (copie par archive ZIP,
// dépôt cloné sans .gitattributes).
export const linesOf = (text) => String(text).split(/\r?\n/);

async function walk(dir, keep) {
  const found = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full, keep));
    else if (keep(full)) found.push(full);
  }
  return found.sort();
}

export async function skillVersion() {
  return JSON.parse(await fs.readFile(path.join(SKILL_ROOT, 'package.json'), 'utf8')).version;
}

// --- Modèles (templates/) ---

const TEMPLATES = path.join(SKILL_ROOT, 'templates');

async function templateTitle(file) {
  if (!file.endsWith('.md')) return null;
  const heading = linesOf(await fs.readFile(file, 'utf8')).find((line) => line.startsWith('# '));
  return heading ? heading.slice(2).trim() : null;
}

// Liste des modèles : { name: chemin relatif à templates/, title: premier titre d'un fichier Markdown }.
export async function listTemplates() {
  const files = await walk(TEMPLATES, () => true);
  return Promise.all(files.map(async (file) => ({ name: posix(path.relative(TEMPLATES, file)), title: await templateTitle(file) })));
}

// Un modèle se demande par son chemin relatif (« consumer/legal-notice-fr.md ») ou par son nom de
// fichier, avec ou sans extension, quand il est unique (« legal-notice-fr »).
export async function getTemplate(name) {
  const wanted = String(name || '').trim().replace(/\\/g, '/').replace(/^templates\//, '').toLowerCase();
  if (!wanted) throw new SkillError('template name missing');
  const all = await listTemplates();
  const base = (n) => n.split('/').pop();
  const stem = (n) => base(n).replace(/\.[^.]+$/, '');
  const matches = all.filter((t) => t.name === wanted);
  if (!matches.length) matches.push(...all.filter((t) => base(t.name) === wanted));
  if (!matches.length) matches.push(...all.filter((t) => stem(t.name) === wanted));
  if (!matches.length) throw new SkillError(`unknown template "${name}". Known templates: ${all.map((t) => t.name).join(', ')}`);
  if (matches.length > 1) throw new SkillError(`"${name}" matches several templates: ${matches.map((t) => t.name).join(', ')}`);
  // Le nom vient de la liste des fichiers de templates/ : aucun chemin fourni par l'appelant n'est ouvert.
  const file = path.join(TEMPLATES, ...matches[0].name.split('/'));
  return { ...matches[0], path: `templates/${matches[0].name}`, content: await fs.readFile(file, 'utf8') };
}

// --- Règles (references/) ---

const REFERENCES = path.join(SKILL_ROOT, 'references');
const RULE_LINE = /^\s*- \[[ xX]\] (.*)$/;
const TRAILING_TAG = /\[([^[\]]+)\]\s*$/;
const GENERATED = /^accessibility\/rgaa\/[^/]+\//;

async function sourceTags() {
  const registry = JSON.parse(await fs.readFile(path.join(REFERENCES, 'sources.json'), 'utf8'));
  return registry.sources.filter((s) => s.tag).map((s) => s.tag).sort((a, b) => b.length - a.length);
}

// « ANSSI MFA R10, R14 » → { prefix: 'ANSSI MFA', refs: ['R10', 'R14'] } ; le préfixe est une
// étiquette déclarée dans references/sources.json (la plus longue qui convient).
function splitTag(part, tags) {
  const text = part.trim();
  const prefix = tags.find((t) => text === t || text.startsWith(`${t} `));
  if (!prefix) return { prefix: text, refs: [] };
  return { prefix, refs: text.slice(prefix.length).split(',').map((r) => r.trim()).filter(Boolean) };
}

// Une référence correspond si elle est égale à la demande ou la prolonge après une frontière :
// « RGAA 11.1 » trouve « 11.1 » mais pas « 11.10 » ; « GDPR art. 7 » trouve « art. 7(3) ».
function refMatches(ref, wanted) {
  const a = ref.toLowerCase();
  const b = wanted.toLowerCase();
  return a === b || (a.startsWith(b) && !/[a-z0-9]/.test(a[b.length]));
}

async function officialRgaaText(ref) {
  if (!/^\d+\.\d+$/.test(ref)) return null;
  const active = (await fs.readFile(path.join(REFERENCES, 'accessibility', 'rgaa', 'ACTIVE'), 'utf8').catch(() => '')).trim();
  if (!active) return null;
  const dir = path.join(REFERENCES, 'accessibility', 'rgaa', active);
  const theme = ref.split('.')[0].padStart(2, '0');
  const file = (await fs.readdir(dir).catch(() => [])).find((f) => f.startsWith(`criteria-${theme}-`));
  if (!file) return null;
  const lines = linesOf(await fs.readFile(path.join(dir, file), 'utf8'));
  const start = lines.findIndex((l) => l.trim() === `## Criterion ${ref}`);
  if (start < 0) return null;
  let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  if (end < 0) end = lines.length;
  return { file: `references/accessibility/rgaa/${active}/${file}`, line: start + 1, text: lines.slice(start, end).join('\n').trim() };
}

// Règles du skill qui citent une source : « RGAA 11.1 », « [GDPR art. 7(3)] », « ANSSI WEB »...
// Renvoie { query, known_tags, rules: [{ file, line, section, rule, tag }], official_text? }.
export async function findRules(query) {
  const tags = await sourceTags();
  const cleaned = String(query || '').trim().replace(/^\[|\]$/g, '').trim();
  if (!cleaned) throw new SkillError('tag missing, for example "RGAA 11.1" or "GDPR art. 7(3)"');
  const lower = cleaned.toLowerCase();
  const prefix = tags.find((t) => lower === t.toLowerCase() || lower.startsWith(`${t.toLowerCase()} `));
  const wantedRef = prefix ? cleaned.slice(prefix.length).trim() : null;
  const files = await walk(REFERENCES, (f) => f.endsWith('.md') && !GENERATED.test(posix(path.relative(REFERENCES, f))));
  const rules = [];
  for (const file of files) {
    let section = '';
    const lines = linesOf(await fs.readFile(file, 'utf8'));
    lines.forEach((line, index) => {
      if (line.startsWith('#')) section = line.replace(/^#+\s*/, '').trim();
      const rule = line.match(RULE_LINE);
      const tag = rule && rule[1].match(TRAILING_TAG);
      if (!tag) return;
      const hit = tag[1].split(';').some((part) => {
        const parsed = splitTag(part, tags);
        if (!prefix) return part.trim().toLowerCase() === lower;
        if (parsed.prefix !== prefix) return false;
        return !wantedRef || parsed.refs.some((ref) => refMatches(ref, wantedRef));
      });
      if (hit) {
        rules.push({ file: `references/${posix(path.relative(REFERENCES, file))}`, line: index + 1, section,
          rule: rule[1].slice(0, tag.index).trim(), tag: tag[1].trim() });
      }
    });
  }
  const result = { query: cleaned, known_tags: prefix ? undefined : [...tags].sort(), rules };
  if (prefix === 'RGAA' && wantedRef) {
    const official = await officialRgaaText(wantedRef);
    if (official) result.official_text = official;
  }
  return result;
}

// --- Qualification (scripts/applicability.py) ---

// profile : chemin d'un profil, ou objet profil. Renvoie la matrice d'applicabilité (JSON du script).
export async function qualifyProject(profile, { outputDir = null } = {}) {
  let tmp = null;
  let file = profile;
  if (typeof profile !== 'string') {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-qualify-'));
    file = path.join(tmp, 'profile.json');
    await fs.writeFile(file, `${JSON.stringify(profile, null, 2)}\n`);
  }
  try {
    const args = [path.join(SKILL_ROOT, 'scripts', 'applicability.py'), file, '--format', 'json'];
    if (outputDir) args.push('--output-dir', outputDir);
    const result = await python(args);
    if (result.spawnError === 'ENOENT') throw new SkillError('Python 3.8+ not found: it is needed to compute the applicability matrix (set the PYTHON variable to its path if it is installed elsewhere)');
    if (result.code !== 0) throw new SkillError((result.stderr || result.stdout || 'applicability.py failed').trim().split('\n').slice(-3).join(' '));
    return JSON.parse(result.stdout);
  } finally {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  }
}

// --- Audit (scripts/check-all.mjs) ---

// Arguments de check-all à partir d'options nommées ; les valeurs sont validées par check-all.
export function checkAllArgs({ target, project, profile, out, only, lang, timeout, expectedDir, noFail } = {}) {
  if (!target) throw new SkillError('target missing: a site folder, an HTML file or a URL');
  // Une cible qui commence par un tiret serait lue par check-all comme une option.
  if (String(target).startsWith('-')) throw new SkillError(`target "${target}" looks like an option: pass a site folder, an HTML file or a URL`);
  const args = [String(target)];
  const add = (option, value) => { if (value !== undefined && value !== null && value !== '') args.push(option, String(value)); };
  add('--project', project);
  add('--profile', profile);
  add('--out', out);
  add('--only', Array.isArray(only) ? only.join(',') : only);
  add('--lang', lang);
  add('--timeout', timeout);
  add('--expected-dir', expectedDir);
  if (noFail) args.push('--no-fail');
  return args;
}

export const isUrl = (value) => /^[a-z][a-z0-9+.-]*:\/\//i.test(String(value || ''));

// Chemins d'un audit rendus absolus par rapport au dossier de l'appelant. check-all est lancé
// depuis le dossier du projet : un chemin relatif laissé tel quel y serait résolu une seconde fois.
export function auditPaths({ target, project, profile, out } = {}, cwd = process.cwd()) {
  const absolute = (value) => (value ? path.resolve(cwd, String(value)) : value);
  const keep = !target || isUrl(target) || String(target).startsWith('-');
  return { target: keep ? target : absolute(target), project: absolute(project), profile: absolute(profile), out: absolute(out) };
}

// Lance check-all et relit son rapport. Renvoie { exit_code, log, out_dir, files, report }.
// Sans `out`, les rapports vont dans un dossier temporaire, laissé en place pour être relu.
export async function auditSite(options) {
  const paths = auditPaths(options);
  const out = paths.out || await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-audit-'));
  const before = new Set(await fs.readdir(out).catch(() => []));
  const minutes = Number(options.timeout) > 0 ? Number(options.timeout) : 30;
  // Quatre vérificateurs au plus, chacun borné par --timeout, plus une marge pour la fusion.
  const result = await exec(process.execPath, [CHECK_ALL, ...checkAllArgs({ ...options, ...paths, out })],
    { cwd: paths.project || process.cwd(), timeoutMs: (minutes * 4 + 5) * 60000 });
  const log = `${result.stdout}${result.stderr}`.trim();
  const json = (await fs.readdir(out).catch(() => [])).filter((f) => /^compliance-report-.*\.json$/.test(f) && !before.has(f)).sort().pop();
  if (!json) return { exit_code: result.code === null ? 2 : result.code, log, out_dir: out, files: null, report: null };
  const report = JSON.parse(await fs.readFile(path.join(out, json), 'utf8'));
  return { exit_code: result.code, log, out_dir: out, report,
    files: { json: path.join(out, json), markdown: path.join(out, json.replace(/\.json$/, '.md')) } };
}
