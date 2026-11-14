// Normalisation des rapports des quatre vérificateurs (check-a11y, check-privacy, check-security,
// check-content) vers une seule forme de constat, décrite par schemas/findings.schema.json.
//
// Entrée : le rapport JSON d'un vérificateur ({ summary, pages: [{ page, findings: [...] }],
// limits | not_tested }). Sortie : constats { id, domain, checker, rule, verdict, severity,
// sources[], page, element, selector, request, cookie, storage, header, message, impact,
// fix_ref, ... } et limites { checker, text, wcag }.
//
// fix_ref pointe vers le fichier de référence du skill qui dit comment corriger, seulement si ce
// fichier existe dans le skill installé.

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const DOMAINS = ['accessibility', 'privacy', 'ai', 'security', 'consumer'];
export const CHECKERS = ['a11y', 'privacy', 'security', 'content'];

const SEVERITY = {
  blocking: 'blocking', critical: 'blocking', major: 'major', high: 'major', serious: 'major', medium: 'major',
  moderate: 'major', minor: 'minor', low: 'minor', info: 'minor',
};

// Éléments trop généraux pour regrouper des corrections.
const GENERIC_ELEMENTS = new Set(['html', 'body', ':root', 'document', 'head']);

const A11Y_RUNTIME_FIX = {
  'keyboard-trap': 'references/accessibility/anti-patterns-keyboard.md',
  'keyboard-cycle': 'references/accessibility/anti-patterns-keyboard.md',
  'focus-indicator': 'references/accessibility/anti-patterns-keyboard.md',
  'focus-obscured': 'references/accessibility/anti-patterns-keyboard.md',
  'reflow-320': 'references/accessibility/anti-patterns-visual-media.md',
};

// Préfixe de règle de check-content vers le fichier de référence qui décrit la correction.
const CONTENT_FIX = [
  [/^ai-/, 'references/ai-act/transparency.md'],
  [/^order-/, 'references/consumer/online-sales.md'],
  [/^odr-/, 'references/consumer/online-sales.md'],
  [/^withdrawal-/, 'references/consumer/withdrawal-function.md'],
  [/^price-/, 'references/consumer/prices.md'],
  [/^(pre-ticked-option|countdown-resets|scarcity-claim|confirmshaming)$/, 'references/consumer/deceptive-design.md'],
  [/^legal-notice-/, 'references/consumer/operator-identification.md'],
];

// Lit l'index JSON du catalogue d'anti-patterns (premier bloc ```json de anti-patterns.md).
async function loadAntiPatterns(skillRoot) {
  const file = path.join(skillRoot, 'references', 'accessibility', 'anti-patterns.md');
  const text = await fs.readFile(file, 'utf8').catch(() => null);
  const match = text && text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

// Contexte de normalisation : index du catalogue et test d'existence des fichiers du skill.
export async function loadContext(skillRoot) {
  const entries = await loadAntiPatterns(skillRoot);
  const byId = new Map(entries.map((e) => [e.id, e]));
  const byAxe = new Map();
  for (const e of entries) for (const rule of e.axe || []) if (!byAxe.has(rule)) byAxe.set(rule, e);
  const cache = new Map();
  const exists = (rel) => {
    if (!cache.has(rel)) cache.set(rel, existsSync(path.join(skillRoot, rel)));
    return cache.get(rel);
  };
  return { byId, byAxe, exists };
}

function domainOf(checker, rule) {
  if (checker === 'a11y') return 'accessibility';
  if (checker === 'privacy') return 'privacy';
  if (checker === 'security') return 'security';
  return /^ai-/.test(rule) ? 'ai' : 'consumer';
}

function bracketSources(source) {
  if (!source) return [];
  const found = [...String(source).matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim()).filter(Boolean);
  return found.length ? found : [String(source).trim()];
}

function a11ySources(f) {
  const out = [...(f.wcag || []).map((sc) => `WCAG 2.2 SC ${sc}`), ...(f.rgaa || []).map((c) => `RGAA criterion ${c}`)];
  if (!out.length && f.source === 'catalogue') out.push('best practice');
  return out;
}

function fixFor(checker, f, ctx) {
  const keep = (rel, entry = null) => (rel && ctx.exists(rel) ? { fix_ref: rel, fix_entry: entry } : { fix_ref: null, fix_entry: null });
  if (checker === 'a11y') {
    const entry = ctx.byId.get(f.rule) || ctx.byAxe.get(f.rule);
    if (entry && entry.file) return keep(`references/accessibility/${entry.file}`, entry.id);
    return keep(A11Y_RUNTIME_FIX[f.rule] || 'references/accessibility/rules.md');
  }
  if (checker === 'privacy') {
    return keep(/^(third-party-request|storage)-/.test(f.rule) ? 'references/privacy/trackers.md' : 'references/privacy/consent.md');
  }
  if (checker === 'security') {
    return keep(f.header ? 'references/security/headers-configs.md' : 'references/security/web-baseline.md');
  }
  const hit = CONTENT_FIX.find(([re]) => re.test(f.rule));
  return keep(hit ? hit[1] : null);
}

const str = (v) => (v === undefined || v === null || v === '' ? null : String(v));

function requestOf(r) {
  if (!r) return null;
  if (typeof r === 'string') {
    let host = null;
    try { host = new URL(r).hostname; } catch { /* URL relative ou invalide */ }
    return { url: r, host, kind: null };
  }
  return { url: str(r.url), host: str(r.host), kind: str(r.kind) };
}

function cookieOf(c) {
  if (!c) return null;
  return typeof c === 'string' ? c : str(c.name);
}

function elementOf(n) {
  if (n.selector) return n.selector;
  if (n.header) return `header ${n.header}`;
  if (n.cookie) return `cookie ${n.cookie}`;
  if (n.storage && n.storage.name) return `${n.storage.kind || 'storage'} ${n.storage.name}`;
  if (n.request && (n.request.host || n.request.url)) return `request ${n.request.host || n.request.url}`;
  if (n.file) return n.line ? `${n.file}:${n.line}` : n.file;
  return null;
}

// Un constat brut d'un vérificateur vers la forme commune (sans id ; voir normaliseReport).
export function normaliseFinding(checker, page, f, ctx) {
  const domain = domainOf(checker, f.rule);
  const n = {
    domain, checker, detector: str(checker === 'a11y' ? f.source : f.detector), rule: String(f.rule),
    verdict: f.verdict === 'NC' ? 'NC' : 'NT', severity: SEVERITY[String(f.severity || '').toLowerCase()] || 'minor',
    sources: checker === 'a11y' ? a11ySources(f) : bracketSources(f.source),
    source_ids: Array.isArray(f.refs) ? f.refs.map(String) : [],
    page: String(page), selector: str(f.selector), request: requestOf(f.request), cookie: cookieOf(f.cookie),
    storage: f.storage ? { kind: str(f.storage.kind), name: str(f.storage.name) } : null,
    header: str(f.header), file: str(f.file), line: Number.isInteger(f.line) ? f.line : null, detail: str(f.detail),
    message: String(f.message || f.rule), impact: str(f.impact || f.rationale), help_url: str(f.help_url),
  };
  if (n.storage && !n.cookie && n.storage.kind === 'cookie') n.cookie = n.storage.name;
  n.element = elementOf(n);
  return { ...n, ...fixFor(checker, f, ctx) };
}

// Toutes les pages d'un rapport. Les identifiants sont uniques dans le rapport.
export function normaliseReport(checker, raw, ctx, used = new Set()) {
  const out = [];
  for (const p of (raw && raw.pages) || []) {
    for (const f of p.findings || []) {
      const n = normaliseFinding(checker, p.page || p.url || raw.target, f, ctx);
      let id = [n.domain, n.rule, n.page, n.element || ''].join('|');
      if (used.has(id) && n.detail) id = `${id}|${n.detail}`;
      let k = 2;
      const base = id;
      while (used.has(id)) { id = `${base}#${k}`; k += 1; }
      used.add(id);
      out.push({ id, ...n });
    }
  }
  return out;
}

// Ce que le vérificateur déclare ne pas tester.
export function limitsOf(checker, raw) {
  if (!raw) return [];
  const out = [];
  for (const item of raw.not_tested || []) {
    if (typeof item === 'string') out.push({ checker, text: item, wcag: null });
    else out.push({ checker, text: String(item.label || item.text || ''), wcag: item.wcag ? String(item.wcag) : null });
  }
  for (const item of raw.limits || []) out.push({ checker, text: String(item), wcag: null });
  return out.filter((l) => l.text);
}

export function isGroupable(element) {
  return Boolean(element) && !GENERIC_ELEMENTS.has(String(element).trim().toLowerCase());
}
