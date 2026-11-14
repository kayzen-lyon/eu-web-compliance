#!/usr/bin/env node
// Vérification automatique d'accessibilité d'un site statique ou d'une URL.
//
// Ce que le script vérifie, page par page, dans Chromium piloté par Playwright :
//   1. les règles axe-core marquées WCAG 2.0, 2.1 et 2.2, niveaux A et AA ;
//   2. le parcours au clavier : piège au clavier (WCAG 2.1.2), focus sans
//      indicateur visible (WCAG 2.4.7, heuristique), focus entièrement masqué
//      par un élément fixe ou collant (WCAG 2.4.11) ;
//   3. la redistribution à 320 px de large (WCAG 1.4.10) ;
//   4. les motifs du catalogue d'anti-patterns (references/accessibility/anti-patterns.md),
//      appliqués au HTML, aux CSS et JS locaux, et aux sélecteurs dans la page.
//
// Ce que le script ne vérifie pas est listé dans le rapport (« not tested »).
// Un résultat vide ne vaut pas conformité : une partie des critères exige un
// test humain (voir references/accessibility/testing-by-hand.md).
//
// Usage :
//   node scripts/check-a11y.mjs <dossier|fichier.html|URL> [options]
//     --out <fichier.json>       rapport JSON (défaut : sortie standard résumée)
//     --md <fichier.md>          rapport Markdown
//     --expected <fichier.json>  défauts attendus (sites de test) : calcule le taux de détection
//     --catalogue <fichier.md>   catalogue d'anti-patterns (défaut : celui du skill ; « none » pour l'ignorer)
//     --max-tabs <n>             nombre maximal d'appuis sur Tab par page (défaut 80)
//     --no-fail                  code de sortie 0 même en cas de non-conformité
//
// Codes de sortie : 0 aucune non-conformité, 1 non-conformité trouvée, 2 erreur d'usage.

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const AXE_SOURCE_PATH = require.resolve('axe-core/axe.min.js');
const DEFAULT_CATALOGUE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'references', 'accessibility', 'anti-patterns.md');
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const SEVERITY_BY_IMPACT = { critical: 'blocking', serious: 'major', moderate: 'major', minor: 'minor' };
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.vtt': 'text/vtt; charset=utf-8',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};
const NOT_TESTED = [
  ['1.1.1', 'Relevance of text alternatives (human judgement)'],
  ['1.2.2', 'Accuracy and synchronisation of captions'],
  ['1.3.2', 'Meaningful reading order'],
  ['1.4.12', 'Text spacing override'],
  ['1.4.13', 'Content on hover or focus'],
  ['2.4.3', 'Logical focus order'],
  ['2.4.6', 'Descriptive headings and labels'],
  ['2.5.7', 'Single-pointer alternative to dragging'],
  ['3.2.6', 'Consistent help across pages'],
  ['3.3.7', 'Redundant entry'],
  ['3.3.8', 'Accessible authentication'],
  ['4.1.2', 'Behaviour of custom widgets with a screen reader'],
];

function parseArgs(argv) {
  const args = { targets: [], maxTabs: 80, fail: true };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`option ${value} : valeur manquante`);
      i += 1;
      return argv[i];
    };
    if (value === '--out') args.out = next();
    else if (value === '--md') args.md = next();
    else if (value === '--expected') args.expected = next();
    else if (value === '--catalogue') args.catalogue = next();
    else if (value === '--max-tabs') args.maxTabs = Number.parseInt(next(), 10);
    else if (value === '--no-fail') args.fail = false;
    else if (value.startsWith('--')) throw new Error(`option inconnue : ${value}`);
    else args.targets.push(value);
  }
  if (args.targets.length !== 1) throw new Error('indiquer un dossier, un fichier HTML ou une URL');
  if (!Number.isInteger(args.maxTabs) || args.maxTabs < 1) throw new Error('--max-tabs : entier positif attendu');
  return args;
}

async function listHtmlFiles(root) {
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

function startStaticServer(root) {
  const base = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(base, `.${urlPath}`);
      if (file !== base && !file.startsWith(base + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const stat = await fs.stat(file).catch(() => null);
      if (stat && stat.isDirectory()) file = path.join(file, 'index.html');
      const body = await fs.readFile(file);
      res.writeHead(200, { 'content-type': CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

function wcagFromTags(tags) {
  return tags
    .filter((tag) => /^wcag\d{3,4}$/.test(tag))
    .map((tag) => {
      const digits = tag.slice(4);
      return digits.length === 3 ? `${digits[0]}.${digits[1]}.${digits[2]}` : `${digits[0]}.${digits[1]}.${digits.slice(2)}`;
    });
}

async function runAxe(page, axeSource) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(
    // target-size (WCAG 2.5.8) est désactivée par défaut dans axe-core 4.x : on l'active.
    (tags) => window.axe.run(document, {
      runOnly: { type: 'tag', values: tags }, rules: { 'target-size': { enabled: true } }, resultTypes: ['violations', 'incomplete'],
    }),
    AXE_TAGS,
  );
  const findings = [];
  for (const [verdict, list] of [['NC', result.violations], ['NT', result.incomplete]]) {
    for (const rule of list) {
      for (const node of rule.nodes) {
        findings.push({
          source: 'axe', rule: rule.id, verdict, wcag: wcagFromTags(rule.tags),
          severity: SEVERITY_BY_IMPACT[node.impact || rule.impact] || 'minor',
          selector: node.target.flat().join(' '), message: rule.help, help_url: rule.helpUrl,
        });
      }
    }
  }
  return findings;
}

// Exécuté dans la page : relève l'état de l'élément actif après un appui sur Tab.
function inspectActiveElement(baseline) {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { atBody: true };
  const snapshot = (node) => {
    if (!node || node.nodeType !== 1) return '';
    const s = getComputedStyle(node);
    return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderTopColor, s.borderBottomColor,
      s.borderTopWidth, s.backgroundColor, s.color, s.textDecorationLine].join('|');
  };
  const cssPath = (node) => {
    if (node.id) return `#${CSS.escape(node.id)}`;
    const parts = [];
    let current = node;
    while (current && current.nodeType === 1 && current !== document.documentElement) {
      if (current.id) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      const parent = current.parentElement;
      const index = parent ? Array.from(parent.children).indexOf(current) + 1 : 1;
      parts.unshift(`${current.tagName.toLowerCase()}:nth-child(${index})`);
      current = parent;
    }
    return parts.join(' > ');
  };
  const key = el.getAttribute('data-a11y-check-key');
  const before = key ? baseline[key] : null;
  const changed = before ? before.self !== snapshot(el) || before.parent !== snapshot(el.parentElement) : true;

  const rect = el.getBoundingClientRect();
  const points = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2], [rect.left + 2, rect.top + 2],
    [rect.right - 2, rect.top + 2], [rect.left + 2, rect.bottom - 2], [rect.right - 2, rect.bottom - 2],
  ].filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
  const isFixedLayer = (node) => {
    for (let n = node; n && n.nodeType === 1; n = n.parentElement) {
      const position = getComputedStyle(n).position;
      if (position === 'fixed' || position === 'sticky') return true;
    }
    return false;
  };
  const covered = points.filter(([x, y]) => {
    const top = document.elementFromPoint(x, y);
    return top && top !== el && !el.contains(top) && !top.contains(el) && isFixedLayer(top);
  }).length;

  return {
    atBody: false, selector: cssPath(el), tag: el.tagName.toLowerCase(),
    focusChanged: changed, hasBaseline: Boolean(before),
    fullyObscured: points.length > 0 && covered === points.length,
    visibleBox: rect.width > 0 && rect.height > 0,
  };
}

// Exécuté dans la page : mémorise le style de chaque élément focusable avant le parcours.
function recordBaseline() {
  const selector = 'a[href], area[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [tabindex], [contenteditable="true"]';
  const snapshot = (node) => {
    if (!node || node.nodeType !== 1) return '';
    const s = getComputedStyle(node);
    return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderTopColor, s.borderBottomColor,
      s.borderTopWidth, s.backgroundColor, s.color, s.textDecorationLine].join('|');
  };
  const baseline = {};
  let tabbable = 0;
  document.querySelectorAll(selector).forEach((el, index) => {
    const key = String(index);
    el.setAttribute('data-a11y-check-key', key);
    baseline[key] = { self: snapshot(el), parent: snapshot(el.parentElement) };
    const rect = el.getBoundingClientRect();
    if (el.tabIndex >= 0 && !el.disabled && rect.width > 0 && rect.height > 0) tabbable += 1;
  });
  return { baseline, tabbable };
}

async function runKeyboardWalk(page, maxTabs) {
  await page.mouse.click(1, 1).catch(() => {});
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  const { baseline, tabbable } = await page.evaluate(recordBaseline);
  const findings = [];
  const visited = new Map();
  const sequence = [];
  let first = null;
  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(inspectActiveElement, baseline);
    if (state.atBody) {
      if (first) break;
      continue;
    }
    if (state.selector === first) break;
    if (!first) first = state.selector;
    sequence.push(state.selector);
    if (!visited.has(state.selector)) visited.set(state.selector, state);
    // Un lecteur <video>/<audio> natif garde le focus pendant que Tab parcourt ses commandes internes.
    const repeatsForTrap = state.tag === 'video' || state.tag === 'audio' ? 15 : 3;
    const lastN = sequence.slice(-repeatsForTrap);
    if (lastN.length === repeatsForTrap && lastN.every((s) => s === state.selector) && tabbable > 1) {
      findings.push({ source: 'runtime', rule: 'keyboard-trap', verdict: 'NC', wcag: ['2.1.2'], severity: 'blocking',
        selector: state.selector, message: 'Focus does not move away from this element with the Tab key.' });
      break;
    }
  }
  const distinct = new Set(sequence);
  if (sequence.length >= maxTabs && distinct.size < sequence.length / 2 && distinct.size < tabbable) {
    findings.push({ source: 'runtime', rule: 'keyboard-cycle', verdict: 'NC', wcag: ['2.1.2'], severity: 'blocking',
      selector: sequence[sequence.length - 1],
      message: `Tab cycles among ${distinct.size} elements and never reaches the other ${tabbable - distinct.size} focusable elements.` });
  }
  for (const [selector, state] of visited) {
    if (state.hasBaseline && !state.focusChanged && state.visibleBox) {
      findings.push({ source: 'runtime', rule: 'focus-indicator', verdict: 'NC', wcag: ['2.4.7'], severity: 'major',
        selector, message: 'No visible change of style when this element receives keyboard focus (heuristic: compares outline, shadow, border and colours).' });
    }
    if (state.fullyObscured) {
      findings.push({ source: 'runtime', rule: 'focus-obscured', verdict: 'NC', wcag: ['2.4.11'], severity: 'major',
        selector, message: 'The focused element is entirely hidden behind a fixed or sticky element.' });
    }
  }
  return { findings, tabStops: distinct.size, tabbable };
}

async function runReflow(browser, url) {
  const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    const result = await page.evaluate(() => {
      const root = document.scrollingElement || document.documentElement;
      const overflow = root.scrollWidth - root.clientWidth;
      if (overflow <= 1) return { overflow, culprits: [] };
      // Éléments qui dépassent à droite alors que leur parent tient dans la largeur : ce sont eux qu'il faut corriger.
      const width = root.clientWidth;
      const scrollsItself = (n) => /(auto|scroll)/.test(getComputedStyle(n).overflowX);
      const inScroller = (n) => {
        for (let p = n.parentElement; p && p !== document.body; p = p.parentElement) if (scrollsItself(p)) return true;
        return false;
      };
      const culprits = [];
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= width + 1 || inScroller(el)) continue;
        const parent = el.parentElement;
        if (parent && parent !== document.body && parent.getBoundingClientRect().right > width + 1) continue;
        culprits.push(el);
        if (culprits.length >= 10) break;
      }
      const path = (node) => {
        const parts = [];
        for (let c = node; c && c.nodeType === 1 && c !== document.documentElement; c = c.parentElement) {
          if (c.id) { parts.unshift(`#${CSS.escape(c.id)}`); break; }
          parts.unshift(`${c.tagName.toLowerCase()}:nth-child(${Array.from(c.parentElement.children).indexOf(c) + 1})`);
        }
        return parts.join(' > ');
      };
      return { overflow, culprits: culprits.map(path) };
    });
    if (result.overflow > 1) {
      const message = `The page scrolls horizontally by ${result.overflow} px at a width of 320 CSS px.`;
      const selectors = result.culprits.length ? result.culprits : ['html'];
      return selectors.map((selector) => ({ source: 'runtime', rule: 'reflow-320', verdict: 'NC', wcag: ['1.4.10'],
        severity: 'major', selector, message: selector === 'html' ? message : `${message} This element extends past the right edge.` }));
    }
    return [];
  } finally {
    await context.close();
  }
}

// Catalogue des anti-patterns : premier bloc ```json de references/accessibility/anti-patterns.md.
// Un motif de confiance « certain » donne une non-conformité (NC) ; un motif « heuristic »
// donne un point à revoir (NT), pour ne jamais affirmer un défaut sur un simple indice.
async function loadCatalogue(file) {
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

function catalogueFinding(entry, extra) {
  return {
    source: 'catalogue', rule: entry.id, verdict: entry.confidence === 'certain' ? 'NC' : 'NT',
    wcag: (entry.wcag || []).map(String), rgaa: entry.rgaa || [], severity: entry.severity || 'minor',
    message: entry.title, ...extra,
  };
}

// Applique les motifs textuels au HTML de la page et aux CSS et JS locaux qu'elle charge.
// Un motif qui déclare une condition de page (« page_condition ») n'est retenu que si la page
// la remplit ; une condition inconnue ou non évaluée laisse le motif s'appliquer.
function runTextDetectors(texts, detectors, pageConditions = {}) {
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

// Exécuté dans la page : conditions de page des motifs du catalogue, par nom.
// « link-in-text-without-underline » : la page a au moins un lien dans un texte courant qui n'est
// pas souligné (WCAG 1.4.1 vise les liens dans un bloc de texte). Ne comptent pas : les liens de
// nav, header et footer (ou des rôles équivalents), les liens à l'allure de bouton (rôle button,
// classe btn ou button, fond ou bordure), et les liens qui sont le seul contenu de leur bloc,
// dont les éléments d'une liste de liens.
function runPageConditions(names) {
  const outside = 'nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"], '
    + '[role="menu"], [role="menubar"], [role="tablist"], [role="toolbar"]';
  const transparent = (colour) => colour === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(colour);
  const buttonLike = (link, style) => link.getAttribute('role') === 'button'
    || /(^|[\s_-])(btn|button)([\s_-]|$)/i.test(link.getAttribute('class') || '')
    || !transparent(style.backgroundColor)
    || (Number.parseFloat(style.borderBottomWidth) > 0 && style.borderBottomStyle !== 'none');
  const blockOf = (node) => {
    let block = node.parentElement;
    while (block && block !== document.body && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement;
    return block;
  };
  const onlyContent = (block) => {
    const copy = block.cloneNode(true);
    copy.querySelectorAll('a[href]').forEach((a) => a.remove());
    return !/[\p{L}\p{N}]/u.test(copy.textContent || '');
  };
  const conditions = {
    'link-in-text-without-underline': () => Array.from(document.querySelectorAll('a[href]')).some((link) => {
      if (link.closest(outside)) return false;
      const style = getComputedStyle(link);
      if (style.textDecorationLine.includes('underline') || buttonLike(link, style)) return false;
      const block = blockOf(link);
      return Boolean(block) && !onlyContent(block);
    }),
  };
  const out = {};
  for (const name of names) {
    if (conditions[name]) out[name] = conditions[name]();
  }
  return out;
}

// Exécuté dans la page : applique les sélecteurs du catalogue.
function runSelectorDetectors(selectors) {
  const cssPath = (node) => {
    const parts = [];
    let current = node;
    while (current && current.nodeType === 1) {
      if (current.id) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      if (current === document.documentElement) {
        parts.unshift('html');
        break;
      }
      const parent = current.parentElement;
      const index = parent ? Array.from(parent.children).indexOf(current) + 1 : 1;
      parts.unshift(`${current.tagName.toLowerCase()}:nth-child(${index})`);
      current = parent;
    }
    return parts.join(' > ');
  };
  return selectors.map((selector) => {
    try {
      return Array.from(document.querySelectorAll(selector)).slice(0, 50).map(cssPath);
    } catch {
      return null;
    }
  });
}

// Exécuté dans la page : contrôles de structure sur tout le document, y compris les parties
// masquées au chargement (étapes suivantes d'un formulaire, onglets inactifs), qu'axe-core ignore.
function runStructuralChecks() {
  const out = [];
  const path = (node) => {
    const parts = [];
    for (let c = node; c && c.nodeType === 1; c = c.parentElement) {
      if (c === document.documentElement) { parts.unshift('html'); break; }
      if (c.id && document.querySelectorAll(`#${CSS.escape(c.id)}`).length === 1) { parts.unshift(`#${CSS.escape(c.id)}`); break; }
      parts.unshift(`${c.tagName.toLowerCase()}:nth-child(${Array.from(c.parentElement.children).indexOf(c) + 1})`);
    }
    return parts.join(' > ');
  };
  const add = (rule, verdict, wcag, rgaa, severity, node, message) =>
    out.push({ source: 'structure', rule, verdict, wcag, rgaa, severity, selector: path(node), message });
  const text = (s) => (s || '').replace(/\s+/g, ' ').trim();

  // 1. Identifiants référencés qui n'existent pas, ou qui existent plusieurs fois.
  const idCount = new Map();
  document.querySelectorAll('[id]').forEach((el) => idCount.set(el.id, (idCount.get(el.id) || 0) + 1));
  const referenced = new Set();
  for (const attr of ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-activedescendant', 'aria-owns', 'headers']) {
    document.querySelectorAll(`[${attr}]`).forEach((el) => {
      for (const id of (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)) {
        referenced.add(id);
        if (!idCount.has(id) && attr !== 'aria-controls' && attr !== 'aria-owns') {
          add('idref-missing', 'NC', ['1.3.1', '4.1.2'], [], 'major', el, `${attr}="${id}" points to an id that does not exist in the page.`);
        }
      }
    });
  }
  const seenDup = new Set();
  document.querySelectorAll('[id]').forEach((el) => {
    if (idCount.get(el.id) < 2) return;
    if (!seenDup.has(el.id)) { seenDup.add(el.id); return; } // le premier est légitime, on signale les suivants
    const isRef = referenced.has(el.id);
    add('duplicate-id', isRef ? 'NC' : 'NT', ['4.1.2'], ['8.2'], isRef ? 'major' : 'minor', el,
      isRef ? `The id "${el.id}" is used more than once and is referenced by a label or ARIA attribute: the reference resolves to the wrong element.`
        : `The id "${el.id}" is used more than once.`);
  });

  // 2. Champs de formulaire sans nom accessible, même dans une étape masquée.
  const fields = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea');
  fields.forEach((el) => {
    const byLabel = Array.from(el.labels || []).some((l) => text(l.textContent));
    const byAria = text(el.getAttribute('aria-label'));
    const byRef = (el.getAttribute('aria-labelledby') || '').split(/\s+/).some((id) => id && text((document.getElementById(id) || {}).textContent));
    const byTitle = text(el.getAttribute('title'));
    if (!byLabel && !byAria && !byRef && !byTitle) {
      add('field-without-name', 'NC', ['1.3.1', '4.1.2'], ['11.1'], 'blocking', el, 'This form field has no programmatic label (label, aria-label, aria-labelledby or title).');
    }
  });

  // 3. Regroupement de champs sans légende.
  document.querySelectorAll('fieldset').forEach((fs) => {
    const legend = fs.querySelector(':scope > legend');
    if (!legend || !text(legend.textContent)) add('fieldset-without-legend', 'NC', ['1.3.1'], ['11.6'], 'major', fs, 'This fieldset has no legend, so the question that groups its fields is not announced.');
  });

  // 4. Gestionnaire de clic sur un élément que le clavier ne peut pas atteindre.
  const interactive = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'label', 'option', 'video', 'audio']);
  document.querySelectorAll('[onclick]').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (interactive.has(tag) || el.hasAttribute('tabindex') || (tag === 'a' && el.hasAttribute('href'))) return;
    add('click-not-keyboard', 'NC', ['2.1.1'], ['7.3'], 'blocking', el, 'An element that is not focusable has a click handler: it cannot be operated with the keyboard.');
  });

  // 5. Tableau à plusieurs niveaux d'en-têtes sans association explicite (scope ou headers).
  document.querySelectorAll('table:not([role="presentation"]):not([role="none"])').forEach((table) => {
    const rows = Array.from(table.rows || []);
    const headerRows = rows.filter((r) => r.cells.length > 0 && Array.from(r.cells).every((c) => c.tagName === 'TH'));
    const rowHeaders = rows.filter((r) => r.cells.length > 1 && r.cells[0].tagName === 'TH' && Array.from(r.cells).slice(1).some((c) => c.tagName === 'TD'));
    const complex = headerRows.length >= 2 || (headerRows.length >= 1 && rowHeaders.length >= 1 && headerRows.some((r) => r.cells.length > 1) && rows.some((r) => Array.from(r.cells).some((c) => c.colSpan > 1 || c.rowSpan > 1)));
    const unscoped = Array.from(table.querySelectorAll('th')).filter((th) => !th.hasAttribute('scope') && !th.id);
    const usesHeaders = table.querySelector('td[headers]');
    if (complex && unscoped.length && !usesHeaders) {
      add('complex-table-without-scope', 'NC', ['1.3.1'], ['5.7'], 'major', unscoped[0],
        'This table has several levels of headers, but its header cells carry no scope and no cell uses the headers attribute: data cells cannot be associated with all their headers.');
    }
  });

  // 6. Indices à faire revoir : pas de titre de niveau 1, pas de lien d'évitement.
  if (!document.querySelector('h1, [role="heading"][aria-level="1"]')) {
    let best = null;
    let bestSize = 0;
    document.querySelectorAll('body p, body div, body span, body strong').forEach((el) => {
      if (!text(el.textContent) || el.closest('h1,h2,h3,h4,h5,h6,[role="heading"]') || el.children.length > 2) return;
      const size = parseFloat(getComputedStyle(el).fontSize) || 0;
      if (size > bestSize) { best = el; bestSize = size; }
    });
    add('no-h1', 'NT', ['1.3.1'], ['9.1'], 'major', best || document.body,
      best ? 'The page has no level-1 heading; this text is styled like one. Check whether it should be marked up as a heading.' : 'The page has no level-1 heading.');
  }
  const focusables = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter((el) => !el.disabled && el.getClientRects().length);
  const first = focusables[0];
  const firstHref = first && first.tagName === 'A' ? first.getAttribute('href') || '' : '';
  const isInPageLink = /^#.+/.test(firstHref);
  const isSkip = isInPageLink && document.getElementById(decodeURIComponent(firstHref.slice(1)));
  if (isInPageLink && !isSkip) {
    add('skip-link-broken', 'NC', ['2.4.1'], ['12.7'], 'major', first, `The first link points to ${firstHref}, but no element has that id: the skip link does nothing.`);
  } else if (first && !isSkip) add('no-skip-link', 'NT', ['2.4.1'], ['12.7'], 'minor', first, 'The first focusable element is not a link to the main content. WCAG 2.4.1 can be met by landmarks alone; RGAA 12.7 asks for a skip or quick-access link.');
  return out;
}

async function collectTexts(root, pagePath, html) {
  const texts = [{ kind: 'html', file: pagePath, text: html }];
  if (!root) return texts;
  const dir = path.posix.dirname(pagePath);
  const refs = [
    ...Array.from(html.matchAll(/<link\b[^>]*rel\s*=\s*["']?stylesheet[^>]*>/gi), (m) => ['css', m[0].match(/href\s*=\s*["']([^"']+)["']/i)]),
    ...Array.from(html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi), (m) => ['js', [null, m[1]]]),
  ];
  const styleBlocks = Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi), (m) => m[1]).join('\n');
  if (styleBlocks) texts.push({ kind: 'css', file: `${pagePath} (inline style)`, text: styleBlocks });
  const scriptBlocks = Array.from(html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi), (m) => m[1]).join('\n');
  if (scriptBlocks) texts.push({ kind: 'js', file: `${pagePath} (inline script)`, text: scriptBlocks });
  for (const [kind, match] of refs) {
    const href = match && match[1];
    if (!href || /^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('data:')) continue;
    const rel = path.posix.normalize(href.startsWith('/') ? href.slice(1) : path.posix.join(dir, href)).split(/[?#]/)[0];
    const text = await fs.readFile(path.join(root, rel), 'utf8').catch(() => null);
    if (text !== null) texts.push({ kind, file: rel, text });
  }
  return texts;
}

// Exécuté dans la page : pour chaque défaut attendu, cherche un constat qui vise le même élément.
function matchInPage({ expected, findings }) {
  const resolve = (selector) => {
    try {
      return selector ? document.querySelector(selector) : null;
    } catch {
      return null;
    }
  };
  // Les constats textuels n'ont pas de sélecteur : on compare la balise ouvrante trouvée
  // dans le source avec celle de l'élément attendu, une fois les deux normalisées.
  const norm = (s) => s.toLowerCase().replace(/["'\s/]/g, '');
  const openingTag = (node) => {
    const html = node.outerHTML || '';
    const end = html.indexOf('>');
    return end > 0 ? html.slice(0, end + 1) : html;
  };
  const sameElementBySnippet = (snippet, target) => {
    if (!snippet || !target) return false;
    const tagMatch = snippet.match(/<[a-z][^>]*>?/i);
    if (!tagMatch) return false;
    const a = norm(tagMatch[0]).replace(/>$/, '');
    const b = norm(openingTag(target)).replace(/>$/, '');
    return a.length >= 6 && (b.startsWith(a) || a.startsWith(b));
  };
  return expected.map((defect) => {
    const target = resolve(defect.selector);
    // Même élément, un descendant, ou un ancêtre proche (deux niveaux au plus) : un constat porté
    // sur <html> ou <body> ne doit pas compter comme détection de n'importe quel défaut de la page.
    // Exception : un défaut situé dans <head> (titre, langue, viewport) est légitimement signalé sur <html>.
    const nearAncestor = (node, child) => {
      if (node === document.documentElement) return Boolean(child.closest('head')) || child === node;
      let p = child.parentElement;
      for (let i = 0; i < 3 && p; i += 1, p = p.parentElement) {
        if (p === node) return node !== document.body;
      }
      return false;
    };
    const relates = (f) => {
      if (!target) return false;
      if (f.selector) {
        const node = resolve(f.selector);
        return Boolean(node && (node === target || target.contains(node) || nearAncestor(node, target)));
      }
      return sameElementBySnippet(f.snippet, target);
    };
    const indexes = (verdict) => findings.map((f, i) => [f, i]).filter(([f]) => f.verdict === verdict && relates(f)).map(([, i]) => i);
    return { id: defect.id, resolved: Boolean(target), matched: indexes('NC'), flagged: indexes('NT') };
  });
}

function summarise(findings) {
  const count = (verdict) => findings.filter((f) => f.verdict === verdict).length;
  return { non_conformities: count('NC'), not_tested_items: count('NT') };
}

async function checkPage(browser, axeSource, url, texts, options) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(url, { waitUntil: 'load' });
    const axeFindings = await runAxe(page, axeSource);
    const selectorDetectors = options.detectors.filter((d) => d.type === 'selector');
    const selectorHits = await page.evaluate(runSelectorDetectors, selectorDetectors.map((d) => d.selector));
    const domFindings = selectorDetectors.flatMap((d, i) => (selectorHits[i] || []).map((selector) => catalogueFinding(d.entry, { selector })));
    domFindings.push(...await page.evaluate(runStructuralChecks));
    const conditionNames = [...new Set(options.detectors.map((d) => d.pageCondition).filter(Boolean))];
    const pageConditions = conditionNames.length ? await page.evaluate(runPageConditions, conditionNames) : {};
    await page.reload({ waitUntil: 'load' });
    const keyboard = await runKeyboardWalk(page, options.maxTabs);
    const reflow = await runReflow(browser, url);
    const textFindings = runTextDetectors(texts, options.detectors, pageConditions);
    const findings = [...axeFindings, ...domFindings, ...keyboard.findings, ...reflow, ...textFindings];
    let matches = null;
    if (options.expected && options.expected.length) {
      await page.reload({ waitUntil: 'load' });
      matches = await page.evaluate(matchInPage, { expected: options.expected, findings });
    }
    return { findings, matches, tab_stops: keyboard.tabStops, tabbable: keyboard.tabbable, script_errors: errors };
  } finally {
    await context.close();
  }
}

function scoreExpected(expectedAll, pages) {
  const results = [];
  for (const defect of expectedAll) {
    const pageResult = pages.find((p) => p.page === defect.page);
    const match = pageResult && pageResult.matches ? pageResult.matches.find((m) => m.id === defect.id) : null;
    const byElement = Boolean(match && match.matched.length);
    const flagged = !byElement && Boolean(match && match.flagged.length);
    const byCriterion = !byElement && Boolean(pageResult) && pageResult.findings.some(
      (f) => f.verdict === 'NC' && defect.wcag && f.wcag.some((sc) => String(defect.wcag).startsWith(sc + ' ') || String(defect.wcag) === sc),
    );
    results.push({ id: defect.id, page: defect.page, kind: defect.kind, severity: defect.severity,
      selector_resolved: Boolean(match && match.resolved), detected: byElement, flagged_for_review: flagged,
      detected_same_criterion_only: byCriterion });
  }
  const byKind = {};
  for (const r of results) {
    const k = (byKind[r.kind] = byKind[r.kind] || { total: 0, detected: 0, flagged_for_review: 0 });
    k.total += 1;
    if (r.detected) k.detected += 1;
    if (r.flagged_for_review) k.flagged_for_review += 1;
  }
  const code = byKind.code || { total: 0, detected: 0, flagged_for_review: 0 };
  return {
    total: results.length,
    detected: results.filter((r) => r.detected).length,
    flagged_for_review: results.filter((r) => r.flagged_for_review).length,
    code_detection_or_review_rate: code.total
      ? Math.round(((code.detected + code.flagged_for_review) / code.total) * 1000) / 10 : null,
    unresolved_selectors: results.filter((r) => !r.selector_resolved).map((r) => r.id),
    by_kind: byKind,
    code_detection_rate: code.total ? Math.round((code.detected / code.total) * 1000) / 10 : null,
    defects: results,
  };
}

function toMarkdown(report) {
  const lines = [
    '# Automated accessibility check',
    '',
    '> Produced by an automated tool. It is not an accessibility audit and does not establish conformity. Criteria listed under "Not tested" need a person; see `references/accessibility/testing-by-hand.md`.',
    '',
    `- Target: \`${report.target}\``,
    `- Date: ${report.date}`,
    `- Pages: ${report.pages.length}`,
    `- Non-conformities: ${report.summary.non_conformities}`,
    `- Items axe-core could not decide (to review): ${report.summary.not_tested_items}`,
    '',
  ];
  if (report.expected) {
    const e = report.expected;
    lines.push('## Detection of planted defects', '', `- Detected as non-conformity: ${e.detected} of ${e.total}`,
      `- Only flagged for review: ${e.flagged_for_review}`,
      `- Detection rate for defects of kind "code": ${e.code_detection_rate === null ? 'n/a' : e.code_detection_rate + ' %'}`,
      `- Same, counting items flagged for review: ${e.code_detection_or_review_rate === null ? 'n/a' : e.code_detection_or_review_rate + ' %'}`,
      `- Selectors that do not resolve: ${e.unresolved_selectors.length ? e.unresolved_selectors.join(', ') : 'none'}`, '',
      '| Kind | Detected | Flagged for review | Total |', '|------|----------|--------------------|-------|');
    for (const [kind, v] of Object.entries(e.by_kind)) lines.push(`| ${kind} | ${v.detected} | ${v.flagged_for_review} | ${v.total} |`);
    lines.push('');
  }
  for (const page of report.pages) {
    const nc = page.findings.filter((f) => f.verdict === 'NC');
    lines.push(`## ${page.page}`, '', `Tab stops reached: ${page.tab_stops} of ${page.tabbable} focusable elements.`, '');
    if (page.script_errors.length) lines.push(`Script errors on the page: ${page.script_errors.length}.`, '');
    if (!nc.length) {
      lines.push('No non-conformity found by the automated checks.', '');
      continue;
    }
    lines.push('| Severity | WCAG | Rule | Element | Problem |', '|----------|------|------|---------|---------|');
    for (const f of nc) {
      const where = f.selector ? `\`${f.selector.replace(/\|/g, '\\|')}\`` : `${f.file}, line ${f.line}`;
      lines.push(`| ${f.severity} | ${f.wcag.join(', ')} | ${f.rule} | ${where} | ${f.message.replace(/\|/g, '\\|')} |`);
    }
    lines.push('');
  }
  lines.push('## Not tested by this script', '');
  for (const [sc, label] of NOT_TESTED) lines.push(`- WCAG ${sc}: ${label}`);
  lines.push('');
  return lines.join('\n');
}

// Chromium de Playwright d'abord ; à défaut, un navigateur Chromium déjà installé (Edge, Chrome).
async function launchBrowser() {
  const attempts = [['playwright-chromium', {}], ['msedge', { channel: 'msedge' }], ['chrome', { channel: 'chrome' }]];
  const errors = [];
  for (const [name, options] of attempts) {
    try {
      return { browser: await chromium.launch(options), browserName: name };
    } catch (error) {
      errors.push(`${name}: ${String(error.message || error).split('\n')[0]}`);
    }
  }
  throw new Error(`aucun navigateur utilisable. Installer Chromium avec « npx playwright install chromium ».\n${errors.join('\n')}`);
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`usage : ${error.message}\n`);
    return 2;
  }
  const target = args.targets[0];
  const detectors = args.catalogue === 'none' ? [] : await loadCatalogue(args.catalogue || DEFAULT_CATALOGUE);
  const expectedAll = args.expected ? JSON.parse(await fs.readFile(args.expected, 'utf8')) : null;
  const expectedList = expectedAll ? (Array.isArray(expectedAll) ? expectedAll : expectedAll.defects) : null;

  let pages;
  let server = null;
  if (/^https?:\/\//.test(target)) {
    pages = [{ page: target, url: target, root: null, source: null }];
  } else {
    const stat = await fs.stat(target).catch(() => null);
    if (!stat) {
      process.stderr.write(`usage : introuvable : ${target}\n`);
      return 2;
    }
    const root = stat.isDirectory() ? target : path.dirname(target);
    const files = stat.isDirectory() ? await listHtmlFiles(root) : [path.basename(target)];
    const started = await startStaticServer(root);
    server = started.server;
    pages = await Promise.all(files.map(async (file) => ({
      page: file, url: `${started.origin}/${file.split('/').map(encodeURIComponent).join('/')}`, root,
      source: await fs.readFile(path.join(root, file), 'utf8'),
    })));
  }

  const axeSource = await fs.readFile(AXE_SOURCE_PATH, 'utf8');
  const { browser, browserName } = await launchBrowser();
  const results = [];
  try {
    for (const p of pages) {
      const expected = expectedList ? expectedList.filter((d) => d.page === p.page) : null;
      const texts = p.source === null ? [] : await collectTexts(p.root, p.page, p.source);
      const result = await checkPage(browser, axeSource, p.url, texts, { maxTabs: args.maxTabs, detectors, expected });
      results.push({ page: p.page, ...result });
    }
  } finally {
    await browser.close();
    if (server) server.close();
  }

  const allFindings = results.flatMap((r) => r.findings);
  const report = {
    tool: 'eu-web-compliance check-a11y',
    disclaimer: 'Automated check. Not an accessibility audit, not legal advice. Absence of findings does not establish conformity.',
    target, date: new Date().toISOString(), browser: browserName, axe_tags: AXE_TAGS,
    summary: summarise(allFindings),
    pages: results.map(({ matches, ...rest }) => rest),
    not_tested: NOT_TESTED.map(([sc, label]) => ({ wcag: sc, label })),
  };
  if (expectedList) report.expected = scoreExpected(expectedList, results);

  if (args.out) await fs.writeFile(args.out, JSON.stringify(report, null, 2) + '\n');
  if (args.md) await fs.writeFile(args.md, toMarkdown(report));
  const s = report.summary;
  process.stdout.write(`${pages.length} page(s), ${s.non_conformities} non-conformité(s), ${s.not_tested_items} point(s) à revoir\n`);
  if (report.expected) {
    const e = report.expected;
    process.stdout.write(`défauts attendus détectés : ${e.detected}/${e.total}, taux « code » : ${e.code_detection_rate} %\n`);
  }
  return args.fail && s.non_conformities > 0 ? 1 : 0;
}

main().then((code) => { process.exitCode = code; }).catch((error) => {
  process.stderr.write(`erreur : ${error.stack || error}\n`);
  process.exitCode = 2;
});
