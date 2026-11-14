#!/usr/bin/env node
// Contrôle automatique des en-têtes de sécurité et de l'hygiène côté navigateur, page par page.
//
//   1. En-têtes de la réponse HTML, comparés à la base (references/security/headers-baseline.json) :
//      présence et valeur, CSP analysée directive par directive, HSTS seulement en HTTPS,
//      protection contre l'encadrement, divulgation de version, attributs des cookies (Set-Cookie).
//   2. Contrôles dans la page, sans en-têtes : contenu mixte, target="_blank" sans noopener,
//      scripts tiers sans integrity, gestionnaires d'événements et scripts en ligne qu'une CSP
//      stricte bloquerait, formulaires envoyés en HTTP, mots de passe en autocomplete="off",
//      données sensibles dans localStorage (indice), secrets dans le code client (motifs).
//
// Un dossier local est servi par scripts/lib/static-server.mjs, qui applique son fichier
// `_headers` (ou `.headers`) : c'est ainsi qu'un site de test déclare ses en-têtes. Les
// requêtes vers des hôtes tiers sont relevées puis interrompues.
//
// Usage :
//   node scripts/check-security.mjs <dossier|fichier.html|URL> [options]
//     --baseline <fichier.json>  base d'en-têtes (défaut : references/security/headers-baseline.json)
//     --out <fichier.json>       rapport JSON
//     --md <fichier.md>          rapport Markdown
//     --expected <fichier.json>  défauts attendus { id, page, rule, detail? } : taux de détection
//     --no-fail                  code de sortie 0 même en cas de non-conformité
//
// Codes de sortie : 0 aucune non-conformité, 1 non-conformité trouvée, 2 erreur d'usage.

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, freshContext, routeThirdParty, hostOf, loadProblem } from './lib/browser.mjs';
import {
  UsageError, parseArgs, resolvePages, loadExpected, scoreExpected, summarise, expectedMarkdown, mdCell, writeOutputs, run,
  prepareOutputs, DATA_NOTICE, notAnalysedMessage,
} from './lib/cli.mjs';
import { BUILTIN, loadBaseline, evaluateHeaders, parseCsp } from './lib/security-baseline.mjs';

const DEFAULT_BASELINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'references', 'security', 'headers-baseline.json');

const LIMITS = [
  'Only the response headers of the HTML pages given are checked, not those of scripts, styles, APIs, redirects or error pages.',
  'TLS is not checked (protocol versions, cipher suites, certificate); use a dedicated TLS test against the ANSSI TLS guide.',
  'A local folder is served over plain HTTP: HTTPS-only headers such as HSTS and the Secure cookie attribute are checked as declared, not as applied by a browser, and http:// sub-resources are reported for review rather than as mixed content. On a remote site served over plain HTTP, HTTPS-only headers are not evaluated.',
  'CORS is only checked on the response to the page request: origin reflection needs a request with a forged Origin header, which is not sent.',
  'Headers declared in a local `_headers` file reproduce the host configuration; check the deployed site by its URL as well.',
  'Cookies written by JavaScript are not seen here (scripts/check-privacy.mjs lists them); only Set-Cookie headers are checked.',
  'Server-side controls are out of reach: CSRF protection, input validation, output escaping, access control, rate limiting, vulnerable dependencies.',
  'Secret detection uses patterns on the page and the first-party scripts it loads: other formats and other files are not seen.',
  'Inline scripts and event handlers are reported for review: whether a strict CSP is feasible depends on the code.',
  'Third-party scripts without integrity are reported for review: integrity cannot be used for a script its provider updates, and the risk depends on the trust placed in that provider.',
  'Requests that could send data (methods other than GET, HEAD and OPTIONS) are always aborted; forms are never submitted.',
];

const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|.+\.localhost|.+\.test)$/i;
const EXECUTABLE_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module', 'text/ecmascript', 'application/ecmascript']);

const SECRET_PATTERNS = [
  { regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g, verdict: 'NC', label: 'private key' },
  { regex: /\bAKIA[0-9A-Z]{16}\b/g, verdict: 'NC', label: 'cloud access key identifier' },
  { regex: /\b(?:sk|rk)_live_[0-9A-Za-z]{16,}\b/g, verdict: 'NC', label: 'live payment secret key' },
  { regex: /\bxox[abprs]-[0-9A-Za-z-]{10,}\b/g, verdict: 'NC', label: 'chat platform token' },
  { regex: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/g, verdict: 'NC', label: 'code hosting token' },
  { regex: /\b(?:api[_-]?key|secret|client[_-]?secret|password|passwd|access[_-]?token|auth[_-]?token)\b["']?\s*[:=]\s*["'][^"'\s]{12,}["']/gi, verdict: 'NT', label: 'credential-like assignment' },
];

// Exécuté dans la page : relevé de tout ce que les contrôles sans en-têtes examinent.
function inspectPage() {
  const cssPath = (node) => {
    const parts = [];
    for (let c = node; c && c.nodeType === 1; c = c.parentElement) {
      if (c === document.documentElement) { parts.unshift('html'); break; }
      if (c.id && document.querySelectorAll(`#${CSS.escape(c.id)}`).length === 1) { parts.unshift(`#${CSS.escape(c.id)}`); break; }
      parts.unshift(`${c.tagName.toLowerCase()}:nth-child(${Array.from(c.parentElement.children).indexOf(c) + 1})`);
    }
    return parts.join(' > ');
  };
  const sub = [];
  const add = (el, url, active) => { if (url) sub.push({ selector: cssPath(el), tag: el.tagName.toLowerCase(), url, active }); };
  document.querySelectorAll('script[src]').forEach((el) => add(el, el.src, true));
  document.querySelectorAll('iframe[src], frame[src]').forEach((el) => add(el, el.src, true));
  document.querySelectorAll('link[href]').forEach((el) => { if (/stylesheet|preload|modulepreload/i.test(el.rel)) add(el, el.href, true); });
  document.querySelectorAll('object[data]').forEach((el) => add(el, el.data, true));
  document.querySelectorAll('img[src], audio[src], video[src], source[src], embed[src], track[src]').forEach((el) => add(el, el.src, false));
  const handlers = [];
  for (const el of document.querySelectorAll('*')) {
    for (const attr of el.attributes) {
      if (/^on[a-z]+$/i.test(attr.name)) handlers.push({ selector: cssPath(el), attribute: attr.name });
    }
    if (handlers.length >= 50) break;
  }
  document.querySelectorAll('a[href^="javascript:" i]').forEach((el) => handlers.push({ selector: cssPath(el), attribute: 'href="javascript:"' }));
  let storage = [];
  try {
    storage = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).map((key) => ({ key, value: String(localStorage.getItem(key) || '').slice(0, 300) }));
  } catch { /* stockage indisponible */ }
  const meta = document.querySelector('meta[http-equiv="Content-Security-Policy" i]');
  return {
    subresources: sub,
    blankLinks: Array.from(document.querySelectorAll('a[target="_blank" i][href]')).map((a) => ({ selector: cssPath(a), href: a.href, rel: (a.rel || '').toLowerCase() })),
    scripts: Array.from(document.querySelectorAll('script[src]')).map((s) => ({ selector: cssPath(s), src: s.src, type: (s.type || '').toLowerCase(), integrity: s.hasAttribute('integrity') })),
    styles: Array.from(document.querySelectorAll('link[rel~="stylesheet" i][href]')).map((l) => ({ selector: cssPath(l), href: l.href, integrity: l.hasAttribute('integrity') })),
    inlineScripts: Array.from(document.querySelectorAll('script:not([src])')).map((s) => ({ selector: cssPath(s), type: (s.type || '').toLowerCase(), nonce: Boolean(s.nonce || s.getAttribute('nonce')), text: s.textContent })),
    handlers,
    forms: Array.from(document.forms).map((f) => ({ selector: cssPath(f), action: f.action, method: (f.method || 'get').toLowerCase() })),
    passwords: Array.from(document.querySelectorAll('input[type="password" i]')).filter((i) => {
      const own = (i.getAttribute('autocomplete') || '').toLowerCase();
      const form = i.form ? (i.form.getAttribute('autocomplete') || '').toLowerCase() : '';
      return own === 'off' || (!own && form === 'off');
    }).map((i) => cssPath(i)),
    storage,
    metaCsp: meta ? meta.getAttribute('content') : null,
  };
}

function finding(rule, verdict, severity, cite, extra) {
  return { detector: 'page', rule, verdict, severity, ...cite, ...extra };
}

const redact = (text) => (text.length <= 8 ? '***' : `${text.slice(0, 6)}…${text.slice(-2)} (${text.length} chars)`);

function secretFindings(texts) {
  const findings = [];
  for (const { file, text } of texts) {
    for (const pattern of SECRET_PATTERNS) {
      for (const match of text.matchAll(pattern.regex)) {
        const line = text.slice(0, match.index).split('\n').length;
        findings.push(finding('secret-in-client-code', pattern.verdict, pattern.verdict === 'NC' ? 'blocking' : 'minor', BUILTIN.secrets, {
          selector: null, file, line, detail: redact(match[0]),
          message: `Possible ${pattern.label} in code sent to the browser (${file}, line ${line}). Anything in client code is public.` }));
        if (findings.length >= 20) return findings;
      }
    }
  }
  return findings;
}

function scriptSourcesForCsp(cspText) {
  const policies = cspText ? parseCsp(cspText) : [];
  return policies.map((p) => (p.get('script-src') || p.get('default-src') || null));
}

function pageFindings(data, { pageUrl, https, isFirstParty, cspText }) {
  const findings = [];
  const pageHost = hostOf(pageUrl);
  const remoteHttp = (url) => url.startsWith('http://') && !LOCAL_HOST.test(hostOf(url));

  for (const s of data.subresources.filter((x) => x.url.startsWith('http://'))) {
    if (https) {
      findings.push(finding('mixed-content', 'NC', s.active ? 'major' : 'minor', BUILTIN.transport, { selector: s.selector, request: s.url,
        message: `<${s.tag}> loads ${s.url} over plain HTTP on an HTTPS page (${s.active ? 'active content, blocked by browsers' : 'passive content'}).` }));
    } else if (remoteHttp(s.url)) {
      findings.push(finding('insecure-subresource', 'NT', 'minor', BUILTIN.transport, { selector: s.selector, request: s.url,
        message: `<${s.tag}> loads ${s.url} over plain HTTP: it becomes mixed content once the site is served over HTTPS.` }));
    }
  }
  if (!https && !LOCAL_HOST.test(pageHost)) {
    findings.push(finding('served-over-http', 'NC', 'major', BUILTIN.transport, { selector: 'html', request: pageUrl, message: 'The page is served over plain HTTP.' }));
  }
  for (const a of data.blankLinks) {
    if (isFirstParty(a.href) || /\bnoopener\b|\bnoreferrer\b/.test(a.rel) || !/^https?:/.test(a.href)) continue;
    findings.push(finding('target-blank-without-noopener', 'NT', 'minor', BUILTIN.headers, { selector: a.selector, request: a.href,
      message: 'Link to another site opens in a new tab without rel="noopener". Current browsers imply it, older ones let the opened page control this one.' }));
  }
  for (const s of data.scripts) {
    if (!EXECUTABLE_TYPES.has(s.type) || isFirstParty(s.src) || s.integrity || !/^https?:/.test(s.src)) continue;
    // À revoir, jamais NC : integrity est impossible pour un script que son fournisseur modifie
    // (outil d'analyse, widget de paiement) et le risque dépend de la confiance faite à l'hôte.
    findings.push(finding('third-party-script-without-integrity', 'NT', 'major', BUILTIN.integrity, { selector: s.selector, request: s.src,
      message: `Script from ${hostOf(s.src)} has no integrity attribute: if that host changes the file, the page runs the new code. For a fixed, versioned file, self-host it or add integrity and crossorigin; for a script its provider updates (analytics, payment widget), integrity cannot be used: check that the provider is trusted and limit it with the CSP.` }));
  }
  for (const l of data.styles) {
    if (isFirstParty(l.href) || l.integrity || !/^https?:/.test(l.href)) continue;
    findings.push(finding('third-party-style-without-integrity', 'NT', 'minor', BUILTIN.integrity, { selector: l.selector, request: l.href,
      message: `Style sheet from ${hostOf(l.href)} has no integrity attribute.` }));
  }
  const scriptLists = scriptSourcesForCsp(cspText);
  const strict = scriptLists.length > 0 && scriptLists.every((list) => list && !list.map((x) => x.toLowerCase()).includes("'unsafe-inline'"));
  for (const s of data.inlineScripts) {
    if (!EXECUTABLE_TYPES.has(s.type) || !s.text.trim()) continue;
    const hash = `'sha256-${crypto.createHash('sha256').update(s.text, 'utf8').digest('base64')}'`;
    const allowed = s.nonce || scriptLists.some((list) => list && list.includes(hash));
    if (allowed) continue;
    findings.push(finding('inline-script', 'NT', 'minor', BUILTIN.injection, { selector: s.selector,
      message: strict ? 'Inline script without nonce or matching hash: the current CSP blocks it.'
        : 'Inline script without nonce or hash: a strict CSP would block it. Move it to a file or give it a nonce or hash.' }));
  }
  for (const h of data.handlers) {
    findings.push(finding('inline-event-handler', 'NT', 'minor', BUILTIN.injection, { selector: h.selector, detail: h.attribute,
      message: `Inline ${h.attribute} handler: a strict CSP blocks it. Attach the handler from a script file.` }));
  }
  for (const f of data.forms) {
    const insecure = f.action.startsWith('http://') && (https || !LOCAL_HOST.test(hostOf(f.action)));
    if (!insecure) continue;
    findings.push(finding('form-posts-over-http', 'NC', 'major', BUILTIN.transport, { selector: f.selector, request: f.action,
      message: `The form sends its data over plain HTTP to ${f.action}.` }));
  }
  for (const selector of data.passwords) {
    findings.push(finding('password-autocomplete-off', 'NT', 'minor', BUILTIN.auth, { selector,
      message: 'Password field with autocomplete="off": it hinders password managers, which help people use long, unique passwords. Use autocomplete="current-password" or "new-password".' }));
  }
  const sensitiveKey = /(token|jwt|passw|secret|api[_-]?key|bearer|session|auth|credential|card|iban)/i;
  for (const { key, value } of data.storage) {
    if (!sensitiveKey.test(key) && !/^eyJ[\w-]+\.[\w-]+\./.test(value)) continue;
    findings.push(finding('sensitive-data-in-localstorage', 'NT', 'minor', BUILTIN.auth, { selector: null, storage: { kind: 'localStorage', name: key },
      message: `localStorage key "${key}" looks like a credential or personal data. Any script on the page can read localStorage; prefer an HttpOnly cookie for session tokens.` }));
  }
  return findings;
}

async function checkPage(browser, p, baseline) {
  const context = await freshContext(browser);
  const thirdParty = [];
  const scripts = [];
  const errors = [];
  try {
    let page = null;
    const isFirstParty = await routeThirdParty(context, { pageUrl: p.url, getPage: () => page, onThirdParty: (e) => thirdParty.push(e) });
    page = await context.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('response', async (response) => {
      const req = response.request();
      if (req.resourceType() === 'script' && isFirstParty(response.url())) {
        scripts.push(response.text().then((text) => ({ file: new URL(response.url()).pathname, text })).catch(() => null));
      }
    });
    const response = await page.goto(p.url, { waitUntil: 'load' });
    const problem = loadProblem(response);
    if (problem) {
      return { url: p.url, final_url: response ? response.url() : p.url, status: response ? response.status() : null, https: p.url.startsWith('https://'),
        headers: {}, set_cookie: [], not_applicable: [], third_party_requests: thirdParty.map((t) => t.url), script_errors: errors, analysed: false,
        findings: [finding('page-not-analysed', 'NT', 'major', { source: '[best practice]', refs: [] }, { selector: null, message: notAnalysedMessage(problem) })] };
    }
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    const finalUrl = response.url();
    const https = finalUrl.startsWith('https://');
    const headers = await response.headersArray();
    const contentType = (headers.find((h) => h.name.toLowerCase() === 'content-type') || {}).value || '';
    const data = await page.evaluate(inspectPage);
    const local = LOCAL_HOST.test(hostOf(finalUrl));
    const evaluation = evaluateHeaders({ headers, https, local, isHtml: /text\/html/i.test(contentType), metaCsp: data.metaCsp }, baseline);
    const cspText = evaluation.headers['content-security-policy'] || data.metaCsp;
    const html = await response.text().catch(() => '');
    const texts = [{ file: p.page, text: html }, ...(await Promise.all(scripts)).filter(Boolean)];
    const findings = [...evaluation.findings, ...pageFindings(data, { pageUrl: finalUrl, https, isFirstParty, cspText }), ...secretFindings(texts)];
    return { url: p.url, final_url: finalUrl, status: response.status(), https, headers: evaluation.headers, set_cookie: evaluation.set_cookie,
      not_applicable: evaluation.not_applicable, third_party_requests: thirdParty.map((t) => t.url), findings, script_errors: errors, analysed: true };
  } finally {
    await context.close();
  }
}

function toMarkdown(report) {
  const lines = ['# Automated security headers check', '',
    '> Produced by an automated tool. It is not a security audit or a penetration test, and ANSSI recommendations are not normative. Absence of findings does not establish that the site is secure; see "Limits" below.', '',
    `> ${DATA_NOTICE}`, '',
    `- Target: \`${report.target}\``, `- Date: ${report.date}`, `- Baseline: \`${report.baseline}\``,
    `- Non-conformities: ${report.summary.non_conformities}`, `- To review: ${report.summary.to_review}`, '',
    ...expectedMarkdown(report.expected)];
  for (const page of report.pages) {
    lines.push(`## ${page.page}`, '', `Served over ${page.https ? 'HTTPS' : 'HTTP'}, status ${page.status}.`, '');
    if (page.not_applicable.length) lines.push(`Not evaluated here: ${page.not_applicable.join(', ')}.`, '');
    if (!page.findings.length) {
      lines.push('No finding.', '');
      continue;
    }
    lines.push('| Verdict | Severity | Rule | Where | Problem | Source |', '|---------|----------|------|-------|---------|--------|');
    for (const f of page.findings) {
      const where = f.header || (f.cookie && `cookie ${f.cookie.name}`) || f.selector || (f.file && `${f.file}:${f.line}`) || '';
      lines.push(`| ${f.verdict} | ${f.severity} | ${f.rule} | ${mdCell(where)} | ${mdCell(f.message)} | ${mdCell(f.source)} |`);
    }
    lines.push('');
  }
  lines.push('## Limits', '', ...report.limits.map((l) => `- ${l}`), '');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { values: ['--out', '--md', '--expected', '--baseline'], flags: [] });
  await prepareOutputs(args);
  const baselineFile = args.baseline || DEFAULT_BASELINE;
  const exists = await fs.stat(baselineFile).then(() => true, () => false);
  if (!exists) throw new UsageError(`base d'en-têtes introuvable : ${baselineFile} (indiquer --baseline <fichier.json>)`);
  const baseline = await loadBaseline(baselineFile);
  const expectedList = await loadExpected(args.expected);
  const target = args.targets[0];
  const { pages, server } = await resolvePages(target);
  const results = [];
  let browserName = null;
  try {
    const launched = await launchBrowser();
    browserName = launched.browserName;
    try {
      for (const p of pages) results.push({ page: p.page, ...await checkPage(launched.browser, p, baseline) });
    } finally {
      await launched.browser.close();
    }
  } finally {
    if (server) await server.close();
  }
  const allFindings = results.flatMap((r) => r.findings);
  const report = {
    tool: 'eu-web-compliance check-security',
    disclaimer: 'Automated check. Not a security audit, not legal advice. Absence of findings does not establish that the site is secure.',
    target, date: new Date().toISOString(), browser: browserName,
    baseline: path.relative(process.cwd(), baselineFile).split(path.sep).join('/'),
    headers_file: server ? server.headersFile : null,
    summary: summarise(allFindings), pages: results, limits: LIMITS,
  };
  if (expectedList) report.expected = scoreExpected(expectedList, results);
  await writeOutputs(args, report, toMarkdown(report));
  const s = report.summary;
  process.stdout.write(`${pages.length} page(s), ${s.non_conformities} non-conformité(s), ${s.to_review} point(s) à revoir\n`);
  if (report.expected) process.stdout.write(`défauts attendus détectés : ${report.expected.detected}/${report.expected.total}\n`);
  return args.fail && s.non_conformities > 0 ? 1 : 0;
}

run(main);
