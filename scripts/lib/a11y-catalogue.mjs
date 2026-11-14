// Motifs textuels du catalogue d'anti-patterns, appliqués par scripts/check-a11y.mjs au HTML
// de la page et aux CSS et JS locaux qu'elle charge. Sans navigateur : testé dans
// tests/a11y.test.mjs.

import fs from 'node:fs/promises';
import path from 'node:path';

// Catalogue des anti-patterns : premier bloc ```json de references/accessibility/anti-patterns.md.
// Un motif de confiance « certain » donne une non-conformité (NC) ; un motif « heuristic »
// donne un point à revoir (NT), pour ne jamais affirmer un défaut sur un simple indice.
export async function loadCatalogue(file) {
  if (!file) return [];
  const text = await fs.readFile(file, 'utf8');
  const block = text.match(/```json\n([\s\S]*?)\n```/);
  if (!block) throw new Error(`${file} : bloc JSON du catalogue introuvable`);
  const entries = JSON.parse(block[1]);
  const detectors = [];
  for (const entry of entries) {
    for (const d of entry.detect || []) {
      const base = { entry, type: d.type, target: d.target, pageCondition: d.page_condition || null };
      if (d.type === 'regex') {
        const flags = (d.flags || '').replace(/g/g, '');
        detectors.push({ ...base, regex: new RegExp(d.value, `${flags}g`), unless: d.unless ? new RegExp(d.unless, flags) : null });
      } else if (d.type === 'selector') {
        detectors.push({ ...base, selector: d.value });
      }
      // Les détecteurs « structural » sont des descriptions en langage naturel : non exécutés ici.
    }
  }
  return detectors;
}

export function catalogueFinding(entry, extra) {
  return {
    source: 'catalogue', rule: entry.id, verdict: entry.confidence === 'certain' ? 'NC' : 'NT',
    wcag: (entry.wcag || []).map(String), rgaa: entry.rgaa || [], severity: entry.severity || 'minor',
    message: entry.title, ...extra,
  };
}

// Applique les motifs textuels au HTML de la page et aux CSS et JS locaux qu'elle charge.
// Un motif qui déclare une condition de page (« page_condition ») n'est retenu que si la page
// la remplit ; une condition inconnue ou non évaluée laisse le motif s'appliquer.
export function runTextDetectors(texts, detectors, pageConditions = {}) {
  const findings = [];
  for (const d of detectors.filter((x) => x.type === 'regex')) {
    if (d.pageCondition && pageConditions[d.pageCondition] === false) continue;
    for (const { kind, file, text } of texts) {
      if (d.target !== kind) continue;
      if (d.unless && d.unless.test(text)) continue;
      for (const match of text.matchAll(d.regex)) {
        const line = text.slice(0, match.index).split('\n').length;
        findings.push(catalogueFinding(d.entry, { selector: null, file, line, snippet: match[0].slice(0, 200) }));
      }
    }
  }
  return findings;
}

// Valeur d'un attribut dans une balise ouvrante, entre guillemets ou non.
function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

// Chemin d'un fichier local dans la racine servie, ou null s'il en sort (« ../ », chemin absolu).
export function insideRoot(root, rel) {
  const base = path.resolve(root);
  const file = path.resolve(base, rel);
  const relative = path.relative(base, file);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? file : null;
}

// Textes de la page (HTML, styles et scripts en ligne) et des CSS et JS locaux qu'elle charge.
// Seuls les fichiers situés dans `root` sont lus.
export async function collectTexts(root, pagePath, html) {
  const texts = [{ kind: 'html', file: pagePath, text: html }];
  if (!root) return texts;
  const dir = path.posix.dirname(pagePath);
  const refs = [
    ...Array.from(html.matchAll(/<link\b[^>]*>/gi), (m) => m[0])
      .filter((tag) => /(^|\s)stylesheet(\s|$)/i.test(attribute(tag, 'rel') || ''))
      .map((tag) => ['css', [null, attribute(tag, 'href')]]),
    ...Array.from(html.matchAll(/<script\b[^>]*>/gi), (m) => ['js', [null, attribute(m[0], 'src')]]),
  ];
  const styleBlocks = Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi), (m) => m[1]).join('\n');
  if (styleBlocks) texts.push({ kind: 'css', file: `${pagePath} (inline style)`, text: styleBlocks });
  const scriptBlocks = Array.from(html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi), (m) => m[1]).join('\n');
  if (scriptBlocks) texts.push({ kind: 'js', file: `${pagePath} (inline script)`, text: scriptBlocks });
  for (const [kind, match] of refs) {
    const href = match && match[1];
    if (!href || /^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('data:')) continue;
    const rel = path.posix.normalize(href.startsWith('/') ? href.replace(/^\/+/, '') : path.posix.join(dir, href)).split(/[?#]/)[0];
    const file = insideRoot(root, rel);
    if (!file) continue;
    const text = await fs.readFile(file, 'utf8').catch(() => null);
    if (text !== null) texts.push({ kind, file: rel, text });
  }
  return texts;
}
