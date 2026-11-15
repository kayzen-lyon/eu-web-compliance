#!/usr/bin/env node
// Vérification automatique d'accessibilité d'un site statique ou d'une URL.
//
// Ce que le script vérifie, page par page, dans Chromium piloté par Playwright :
//   1. les règles axe-core marquées WCAG 2.0, 2.1 et 2.2, niveaux A et AA ;
//   2. le parcours au clavier : piège au clavier (WCAG 2.1.2), focus sans
//      indicateur visible (WCAG 2.4.7, heuristique : à revoir), focus entièrement masqué
//      par un élément fixe ou collant (WCAG 2.4.11) ;
//   3. la redistribution à 320 px de large (WCAG 1.4.10) ;
//   4. les motifs du catalogue d'anti-patterns (references/accessibility/anti-patterns.md),
//      appliqués au HTML, aux CSS et JS locaux, et aux sélecteurs dans la page.
//
// Ce que le script ne vérifie pas est listé dans le rapport (« not tested »).
// Un résultat vide ne vaut pas conformité : une partie des critères exige un
// test humain (voir references/accessibility/testing-by-hand.md).
//
// Réseau (scripts/lib/browser.mjs) : les requêtes vers un hôte tiers sont relevées puis
// interrompues, sauf --allow-network ; les requêtes autres que GET, HEAD ou OPTIONS sont
// toujours interrompues. Un dossier local est servi par scripts/lib/static-server.mjs.
//
// Usage :
//   node scripts/check-a11y.mjs <dossier|fichier.html|URL> [options]
//     --out <fichier.json>       rapport JSON (défaut : sortie standard résumée)
//     --md <fichier.md>          rapport Markdown
//     --expected <fichier.json>  défauts attendus (sites de test) : calcule le taux de détection
//     --catalogue <fichier.md>   catalogue d'anti-patterns (défaut : celui du skill ; « none » pour l'ignorer)
//     --max-tabs <n>             nombre maximal d'appuis sur Tab par page (défaut 80)
//     --allow-network            laisse passer les requêtes tierces (site réel ; jamais en test)
//     --no-fail                  code de sortie 0 même en cas de non-conformité
//
// Codes de sortie : 0 aucune non-conformité, 1 non-conformité trouvée, 2 erreur d'usage.

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { launchBrowser, freshContext, routeThirdParty, loadProblem } from './lib/browser.mjs';
import {
  UsageError, parseArgs, resolvePages, readJson, summarise, mdCell, mdText, plainText, prepareOutputs, writeOutputs, run,
  DATA_NOTICE, notAnalysedMessage,
} from './lib/cli.mjs';
import { loadCatalogue, catalogueFinding, runTextDetectors, collectTexts } from './lib/a11y-catalogue.mjs';
import {
  inspectActiveElement, recordBaseline, runPageConditions, runSelectorDetectors, runStructuralChecks, matchInPage,
} from './lib/a11y-page.mjs';

const require = createRequire(import.meta.url);
const AXE_SOURCE_PATH = require.resolve('axe-core/axe.min.js');
const DEFAULT_CATALOGUE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'references', 'accessibility', 'anti-patterns.md');
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const SEVERITY_BY_IMPACT = { critical: 'blocking', serious: 'major', moderate: 'major', minor: 'minor' };
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
      // À revoir, jamais NC : la comparaison ne voit pas un indicateur dessiné par ::before ou
      // ::after, une image de fond, une transformation ou un changement sur un autre élément.
      findings.push({ source: 'runtime', rule: 'focus-indicator', verdict: 'NT', wcag: ['2.4.7'], severity: 'major',
        selector, message: 'No change of outline, shadow, border or colour was seen when this element receives keyboard focus (heuristic: an indicator drawn by a pseudo-element, a background image or another element is not seen). Check by hand that the focus is visible.' });
    }
    if (state.fullyObscured) {
      findings.push({ source: 'runtime', rule: 'focus-obscured', verdict: 'NC', wcag: ['2.4.11'], severity: 'major',
        selector, message: 'The focused element is entirely hidden behind a fixed or sticky element.' });
    }
  }
  return { findings, tabStops: distinct.size, tabbable };
}

async function runReflow(browser, url, net) {
  const context = await openContext(browser, url, net, { viewport: { width: 320, height: 640 } });
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
// Contexte neuf, sans état, dont les requêtes passent par l'interception de scripts/lib/browser.mjs.
// bypassCSP : la Content-Security-Policy du site (en-tête, ou fichier `_headers` d'un dossier local)
// bloquerait l'injection d'axe-core ; elle relève de check-security, pas de l'accessibilité.
async function openContext(browser, url, net, options = {}) {
  const context = await freshContext(browser, { bypassCSP: true, ...options });
  await routeThirdParty(context, {
    pageUrl: url, allowNetwork: net.allowNetwork, onThirdParty: (e) => net.thirdParty.add(e.url),
    onBlockedWrite: (e) => net.blockedWrites.add(`${e.method} ${e.url}`),
  });
  return context;
}

function notAnalysed(problem) {
  return { source: 'runtime', rule: 'page-not-analysed', verdict: 'NT', wcag: [], severity: 'major', selector: null,
    message: notAnalysedMessage(problem) };
}

async function checkPage(browser, axeSource, url, texts, options) {
  const net = { allowNetwork: options.allowNetwork, thirdParty: new Set(), blockedWrites: new Set() };
  const context = await openContext(browser, url, net);
  const network = () => ({ third_party_requests: [...net.thirdParty], blocked_writes: [...net.blockedWrites] });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    const problem = loadProblem(await page.goto(url, { waitUntil: 'load' }));
    if (problem) {
      return { findings: [notAnalysed(problem)], matches: null, tab_stops: 0, tabbable: 0, script_errors: errors, analysed: false, ...network() };
    }
    const axeFindings = await runAxe(page, axeSource);
    const selectorDetectors = options.detectors.filter((d) => d.type === 'selector');
    const selectorHits = await page.evaluate(runSelectorDetectors, selectorDetectors.map((d) => d.selector));
    const domFindings = selectorDetectors.flatMap((d, i) => (selectorHits[i] || []).map((selector) => catalogueFinding(d.entry, { selector })));
    domFindings.push(...await page.evaluate(runStructuralChecks));
    const conditionNames = [...new Set(options.detectors.map((d) => d.pageCondition).filter(Boolean))];
    const pageConditions = conditionNames.length ? await page.evaluate(runPageConditions, conditionNames) : {};
    await page.reload({ waitUntil: 'load' });
    const keyboard = await runKeyboardWalk(page, options.maxTabs);
    const reflow = await runReflow(browser, url, net);
    const textFindings = runTextDetectors(texts, options.detectors, pageConditions);
    const findings = [...axeFindings, ...domFindings, ...keyboard.findings, ...reflow, ...textFindings];
    let matches = null;
    if (options.expected && options.expected.length) {
      await page.reload({ waitUntil: 'load' });
      matches = await page.evaluate(matchInPage, { expected: options.expected, findings });
    }
    return { findings, matches, tab_stops: keyboard.tabStops, tabbable: keyboard.tabbable, script_errors: errors, analysed: true, ...network() };
  } finally {
    await context.close();
  }
}

// Défauts attendus des sites de test (expected-defects.json) : chaque défaut désigne un élément
// par son sélecteur ; il est détecté quand un constat NC vise le même élément (voir matchInPage).
// Ce n'est pas le score par règle de scripts/lib/cli.mjs, qui sert aux autres vérificateurs.
function scoreExpectedByElement(expectedAll, pages) {
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
    `> ${DATA_NOTICE}`,
    '',
    `- Target: \`${plainText(report.target, 300)}\``,
    `- Date: ${report.date}`,
    `- Third-party requests: ${report.network}`,
    `- Pages: ${report.pages.length}`,
    `- Non-conformities: ${report.summary.non_conformities}`,
    `- To review: ${report.summary.to_review}`,
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
    lines.push(`## ${mdText(page.page, 300)}`, '');
    if (!page.analysed) {
      lines.push(mdCell(page.findings[0].message), '');
      continue;
    }
    lines.push(`Tab stops reached: ${page.tab_stops} of ${page.tabbable} focusable elements.`, '');
    if (page.script_errors.length) lines.push(`Script errors on the page: ${page.script_errors.length}.`, '');
    const nc = page.findings.filter((f) => f.verdict === 'NC');
    if (!nc.length) {
      lines.push('No non-conformity found by the automated checks.', '');
      continue;
    }
    lines.push('| Severity | WCAG | Rule | Element | Problem |', '|----------|------|------|---------|---------|');
    for (const f of nc) {
      const where = f.selector ? `\`${mdCell(f.selector, 200)}\`` : mdCell(`${f.file}, line ${f.line}`, 200);
      lines.push(`| ${f.severity} | ${f.wcag.join(', ')} | ${f.rule} | ${where} | ${mdCell(f.message)} |`);
    }
    lines.push('');
  }
  lines.push('## Not tested by this script', '');
  for (const [sc, label] of NOT_TESTED) lines.push(`- WCAG ${sc}: ${label}`);
  lines.push('');
  return lines.join('\n');
}

async function loadExpectedDefects(file) {
  if (!file) return null;
  const data = await readJson(file, '--expected');
  const list = Array.isArray(data) ? data : data.defects;
  if (!Array.isArray(list) || list.some((d) => !d || typeof d.id !== 'string' || typeof d.page !== 'string')) {
    throw new UsageError('--expected : tableau (ou { "defects": [...] }) d\'objets avec id et page attendu');
  }
  return list;
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { values: ['--out', '--md', '--expected', '--catalogue', '--max-tabs'], flags: ['--allow-network'] });
  const maxTabs = args.maxTabs === undefined ? 80 : Number(args.maxTabs);
  if (!Number.isInteger(maxTabs) || maxTabs < 1) throw new UsageError('--max-tabs : entier positif attendu');
  await prepareOutputs(args);
  const target = args.targets[0];
  const detectors = args.catalogue === 'none' ? [] : await loadCatalogue(args.catalogue || DEFAULT_CATALOGUE);
  const expectedList = await loadExpectedDefects(args.expected);
  const axeSource = await fs.readFile(AXE_SOURCE_PATH, 'utf8');
  const allowNetwork = Boolean(args.allowNetwork);

  const { pages, root, server } = await resolvePages(target);
  const results = [];
  let browserName = null;
  try {
    const launched = await launchBrowser();
    browserName = launched.browserName;
    try {
      for (const p of pages) {
        const expected = expectedList ? expectedList.filter((d) => d.page === p.page) : null;
        const source = root ? await fs.readFile(path.join(root, p.page), 'utf8') : null;
        const texts = source === null ? [] : await collectTexts(root, p.page, source);
        const result = await checkPage(launched.browser, axeSource, p.url, texts, { maxTabs, detectors, expected, allowNetwork });
        results.push({ page: p.page, ...result });
      }
    } finally {
      await launched.browser.close();
    }
  } finally {
    if (server) await server.close();
  }

  const report = {
    tool: 'eu-web-compliance check-a11y',
    disclaimer: 'Automated check. Not an accessibility audit, not legal advice. Absence of findings does not establish conformity.',
    target, date: new Date().toISOString(), browser: browserName, axe_tags: AXE_TAGS,
    network: allowNetwork ? 'allowed (live site)' : 'third-party requests aborted',
    summary: summarise(results.flatMap((r) => r.findings)),
    pages: results.map(({ matches, ...rest }) => rest),
    not_tested: NOT_TESTED.map(([sc, label]) => ({ wcag: sc, label })),
  };
  if (expectedList) report.expected = scoreExpectedByElement(expectedList, results);
  await writeOutputs(args, report, toMarkdown(report));
  const s = report.summary;
  process.stdout.write(`${pages.length} page(s), ${s.non_conformities} non-conformité(s), ${s.to_review} point(s) à revoir\n`);
  if (report.expected) {
    const e = report.expected;
    process.stdout.write(`défauts attendus détectés : ${e.detected}/${e.total}, taux « code » : ${e.code_detection_rate} %\n`);
  }
  return args.fail && s.non_conformities > 0 ? 1 : 0;
}

run(main);
