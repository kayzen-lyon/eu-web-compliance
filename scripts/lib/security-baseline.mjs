// Chargement de la base d'en-têtes de sécurité et évaluation des en-têtes d'une réponse.
//
// Deux formes de base sont acceptées et ramenées au même modèle interne :
//
// 1. Forme détaillée (references/security/headers-baseline.json) :
//    headers[]  { id, name, required, checks: [ { type, values, pattern, flags, parameter, min,
//                 when: "present", applies: "when-html", case_sensitive, severity } ], severity,
//                 rationale, source: [...] }
//               types : present, absent, equals, matches, not-matches, not-contains, min-number,
//               contains-directive, csp
//    csp        { directive_fallback, required_directives: [ { directive, severity, allowed_values,
//                 forbidden_values, source } ], forbidden_sources: [ { id, source_token |
//                 source_token_pattern, in_effective_directives, severity,
//                 severity_if_nonce_or_hash_present, source } ] }
//    cookies    { session_cookie_name_pattern, session_cookie_name_flags, checks: [ { id, applies_to,
//                 attribute, check, values, required, severity, severity_non_session, source } ] }
//    absent_or_minimal [ { name, checks: [ { type: absent | not-matches, pattern, when } ] } ]
//    cors       [ { id, severity, source } ] (seuls les contrôles faisables sur une réponse sont faits)
//
// 2. Forme simple : headers[] { name, required, check, value | values | pattern | directive + min,
//    csp: { required_directives: [...], forbidden_sources: { "<directive>": [...] } } },
//    cookies { required_attributes, session_cookie_patterns, session_required_attributes,
//    samesite_allowed, session_prefix_recommended }, absent [ "Nom" | { name, pattern } ].
//
// Champs inconnus ignorés ; champs facultatifs absents remplacés par une valeur par défaut ;
// fichier mal formé : erreur qui dit quoi corriger. Les contrôles CSP demandés par le skill
// (unsafe-inline sans nonce ni hash, unsafe-eval, joker, data: ou schéma seul dans script-src,
// object-src, frame-ancestors) s'appliquent toujours ; la base peut les durcir ou en ajouter.

import { UsageError, readJson } from './cli.mjs';

const REQUIRED = ['always', 'https-only', 'when-html', 'recommended'];
const CHECK_TYPES = ['present', 'absent', 'equals', 'matches', 'not-matches', 'not-contains', 'min-number', 'contains-directive', 'csp'];
const SIMPLE_CHECKS = ['present', 'equals', 'contains-directive', 'matches', 'not-contains'];
const SEVERITY = { blocking: 'blocking', critical: 'blocking', major: 'major', high: 'major', medium: 'major', moderate: 'major', minor: 'minor', low: 'minor', info: 'minor' };

export const BUILTIN = {
  headers: { source: '[ANSSI-PA-009] [OWASP Top 10:2025 A02 Security Misconfiguration]', refs: ['anssi-web', 'owasp-top10-2025'] },
  transport: { source: '[ANSSI-PA-009] [ANSSI TLS guide] [OWASP Top 10:2025 A04 Cryptographic Failures]', refs: ['anssi-web', 'anssi-tls', 'owasp-top10-2025'] },
  integrity: { source: '[ANSSI-PA-009] [OWASP Top 10:2025 A08 Software or Data Integrity Failures]', refs: ['anssi-web', 'owasp-top10-2025'] },
  injection: { source: '[ANSSI-PA-009] [OWASP Top 10:2025 A05 Injection]', refs: ['anssi-web', 'owasp-top10-2025'] },
  auth: { source: '[ANSSI-PG-078] [OWASP Top 10:2025 A07 Authentication Failures]', refs: ['anssi-mfa', 'owasp-top10-2025'] },
  secrets: { source: '[OWASP Top 10:2025 A04 Cryptographic Failures]', refs: ['owasp-top10-2025'] },
};

const DEFAULT_FALLBACK = {
  'script-src': 'default-src', 'script-src-elem': 'script-src', 'script-src-attr': 'script-src', 'style-src': 'default-src',
  'style-src-elem': 'style-src', 'style-src-attr': 'style-src', 'img-src': 'default-src', 'font-src': 'default-src',
  'connect-src': 'default-src', 'media-src': 'default-src', 'object-src': 'default-src', 'frame-src': 'child-src',
  'child-src': 'default-src', 'worker-src': 'child-src', 'manifest-src': 'default-src',
};
const SCRIPT_DIRECTIVES = ['script-src', 'script-src-elem', 'script-src-attr'];
const DEFAULT_REQUIRED = [
  { directive: 'script-src', severity: 'high', allowed: null, forbiddenValues: [], cite: BUILTIN.headers },
  { directive: 'object-src', severity: 'high', allowed: ["'none'"], forbiddenValues: [], cite: BUILTIN.headers },
  { directive: 'frame-ancestors', severity: 'high', allowed: null, forbiddenValues: [], cite: BUILTIN.headers },
];
const DEFAULT_FORBIDDEN = [
  { id: 'unsafe-inline-script', token: "'unsafe-inline'", directives: SCRIPT_DIRECTIVES, severity: 'high', severityIfNonce: null },
  { id: 'unsafe-eval', token: "'unsafe-eval'", directives: ['*'], severity: 'high', severityIfNonce: undefined },
  { id: 'data-script', token: 'data:', directives: ['script-src', 'script-src-elem', 'object-src'], severity: 'high' },
  { id: 'wildcard-script', token: '*', directives: ['script-src', 'script-src-elem', 'object-src'], severity: 'high' },
  { id: 'scheme-only-script', tokenRegex: /^(https?:|wss?:|blob:)$/i, directives: ['script-src', 'script-src-elem', 'object-src'], severity: 'high' },
].map((f) => ({ ...f, cite: BUILTIN.headers }));
const RULE_BY_FORBIDDEN_ID = {
  'unsafe-inline-script': 'csp-unsafe-inline', 'unsafe-eval': 'csp-unsafe-eval', 'data-script': 'csp-permissive-script-source',
  'wildcard-script': 'csp-permissive-script-source', 'scheme-only-script': 'csp-permissive-script-source',
};
const VERSION_HEADERS = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'x-generator'];

export const normaliseSeverity = (value, fallback = 'major') => SEVERITY[String(value || '').toLowerCase()] || fallback;
const verdictFor = (rawSeverity, recommended) => (recommended || String(rawSeverity).toLowerCase() === 'info' ? 'NT' : 'NC');
const lower = (s) => String(s).toLowerCase();

function citeOf(source, fallback = BUILTIN.headers) {
  if (!source) return fallback;
  const list = [source].flat().map((s) => String(s).trim()).filter(Boolean);
  if (!list.length) return fallback;
  return { source: list.map((s) => (s.startsWith('[') ? s : `[${s}]`)).join(' '), refs: fallback.refs };
}

function compileRegex(pattern, flags, where) {
  try {
    return new RegExp(pattern, flags || 'i');
  } catch (error) {
    throw new UsageError(`${where} : expression régulière invalide (${error.message})`);
  }
}

// ---- Normalisation ----------------------------------------------------------------------

function normaliseCheck(check, entry, where) {
  if (!check || typeof check !== 'object') throw new UsageError(`${where} : objet attendu`);
  const type = check.type;
  if (!CHECK_TYPES.includes(type)) throw new UsageError(`${where} : type « ${type} » inconnu (${CHECK_TYPES.join(', ')})`);
  const values = [check.values, check.value].flat().filter((v) => typeof v === 'string');
  if (type === 'equals' && !values.length) throw new UsageError(`${where} : type « equals » sans values`);
  if (type === 'not-contains' && !values.length) throw new UsageError(`${where} : type « not-contains » sans values`);
  if ((type === 'matches' || type === 'not-matches') && !check.pattern) throw new UsageError(`${where} : type « ${type} » sans pattern`);
  if (type === 'min-number' && (!check.parameter || !Number.isFinite(check.min))) throw new UsageError(`${where} : type « min-number » sans parameter ou min`);
  return {
    type, values, caseSensitive: check.case_sensitive === true,
    regex: check.pattern ? compileRegex(check.pattern, check.flags, where) : null,
    parameter: check.parameter || check.directive || null, min: Number.isFinite(check.min) ? check.min : null,
    allowed: Array.isArray(check.allowed_values) ? check.allowed_values : null,
    when: check.when || null, applies: check.applies || null,
    severity: check.severity || entry.severity || 'medium', description: check.description || null,
  };
}

// Forme simple : un seul « check » par en-tête, plus une présence implicite.
function simpleChecks(entry, where) {
  const check = entry.check || 'present';
  if (!SIMPLE_CHECKS.includes(check)) throw new UsageError(`${where} : check doit valoir ${SIMPLE_CHECKS.join(', ')}`);
  const constraints = entry.constraints && typeof entry.constraints === 'object' ? entry.constraints : {};
  const values = [entry.values, entry.value, constraints.values, constraints.value].flat().filter((v) => typeof v === 'string');
  const pattern = entry.pattern || constraints.pattern || (check === 'matches' ? values[0] : null);
  const directive = entry.directive || constraints.directive || (check === 'contains-directive' ? values[0] : null);
  const min = Number.isFinite(entry.min) ? entry.min : Number.isFinite(constraints.min) ? constraints.min : null;
  const out = [{ type: 'present' }];
  if (check === 'equals') out.push({ type: 'equals', values });
  else if (check === 'matches') out.push({ type: 'matches', pattern });
  else if (check === 'not-contains') out.push({ type: 'not-contains', values: pattern ? [...values] : values });
  else if (check === 'contains-directive' && directive) {
    out.push(lower(entry.name) === 'content-security-policy' ? { type: 'contains-directive', directive }
      : { type: 'min-number', parameter: directive, min: min === null ? 0 : min });
  }
  if (entry.csp) out.push({ type: 'csp' });
  return out;
}

function normaliseHeader(entry, i) {
  const where = `headers[${i}]`;
  if (!entry || typeof entry !== 'object') throw new UsageError(`base d'en-têtes, ${where} : objet attendu`);
  if (typeof entry.name !== 'string' || !entry.name.trim()) throw new UsageError(`base d'en-têtes, ${where} : « name » (chaîne) attendu`);
  const name = entry.name.trim();
  const required = entry.required || 'always';
  if (!REQUIRED.includes(required)) throw new UsageError(`base d'en-têtes, ${where} (${name}) : required doit valoir ${REQUIRED.join(', ')}`);
  const rawChecks = Array.isArray(entry.checks) ? entry.checks : simpleChecks(entry, `base d'en-têtes, ${where} (${name})`);
  const checks = rawChecks.map((c, j) => normaliseCheck(c, entry, `base d'en-têtes, ${where} (${name}), checks[${j}]`));
  return { id: entry.id || lower(name), name, key: lower(name), required, checks, severity: entry.severity || 'medium',
    rationale: entry.rationale || null, cite: citeOf(entry.source) };
}

// Rattache une source interdite de la forme simple à la règle équivalente de la forme détaillée,
// pour qu'un même défaut ne soit pas compté deux fois.
const SIMPLE_FORBIDDEN_ID = (token, directive) => {
  const t = lower(token);
  const script = SCRIPT_DIRECTIVES.includes(directive) || directive === 'default-src' || directive === 'object-src';
  if (t === "'unsafe-inline'" && SCRIPT_DIRECTIVES.includes(directive)) return 'unsafe-inline-script';
  if (t === "'unsafe-inline'" && directive.startsWith('style-src')) return 'unsafe-inline-style';
  if (t === "'unsafe-eval'") return 'unsafe-eval';
  if (t === 'data:' && script) return 'data-script';
  if (t === '*' && script) return 'wildcard-script';
  if (/^(https?:|wss?:)$/.test(t) && script) return 'scheme-only-script';
  return `${directive}:${t}`;
};

function normaliseCsp(data, headerEntries, file) {
  const block = data.csp && typeof data.csp === 'object' ? data.csp : {};
  const fallback = { ...DEFAULT_FALLBACK, ...(block.directive_fallback || {}) };
  const required = new Map(DEFAULT_REQUIRED.map((r) => [r.directive, r]));
  const forbidden = new Map(DEFAULT_FORBIDDEN.map((f) => [f.id, f]));
  const addRequired = (r, severity, cite) => {
    const item = typeof r === 'string' ? { directive: r } : r;
    if (!item || typeof item.directive !== 'string') throw new UsageError(`${file} : csp.required_directives : chaîne ou objet avec « directive » attendu`);
    const key = lower(item.directive);
    const previous = required.get(key) || { allowed: null, forbiddenValues: [] };
    required.set(key, { directive: key, severity: item.severity || severity || 'high',
      allowed: Array.isArray(item.allowed_values) ? item.allowed_values : previous.allowed,
      forbiddenValues: [...new Set([...previous.forbiddenValues, ...(Array.isArray(item.forbidden_values) ? item.forbidden_values : [])])],
      cite: citeOf(item.source, cite) });
  };
  // Forme simple d'abord (bloc « csp » porté par l'entrée Content-Security-Policy), puis le bloc
  // détaillé de premier niveau, qui précise les sévérités et les sources.
  for (const entry of data.headers || []) {
    if (!entry || !entry.csp || typeof entry.csp !== 'object') continue;
    const cite = citeOf(entry.source);
    for (const r of entry.csp.required_directives || []) addRequired(r, entry.severity, cite);
    const fs = entry.csp.forbidden_sources;
    if (fs && typeof fs === 'object' && !Array.isArray(fs)) {
      for (const [directive, tokens] of Object.entries(fs)) {
        for (const token of [tokens].flat().map(String)) {
          const id = SIMPLE_FORBIDDEN_ID(token, lower(directive));
          const base = forbidden.get(id);
          forbidden.set(id, base ? { ...base, severity: entry.severity || base.severity, cite }
            : { id, token, tokenRegex: null, directives: [lower(directive)], severity: entry.severity || 'high', cite });
        }
      }
    }
  }
  for (const r of block.required_directives || []) addRequired(r, 'high', BUILTIN.headers);
  for (const [i, f] of (Array.isArray(block.forbidden_sources) ? block.forbidden_sources : []).entries()) {
    const where = `${file} : csp.forbidden_sources[${i}]`;
    if (!f || (typeof f.source_token !== 'string' && typeof f.source_token_pattern !== 'string')) throw new UsageError(`${where} : source_token ou source_token_pattern attendu`);
    const id = f.id || f.source_token || f.source_token_pattern;
    forbidden.set(id, { id, token: f.source_token || null, tokenRegex: f.source_token_pattern ? compileRegex(f.source_token_pattern, 'i', where) : null,
      directives: Array.isArray(f.in_effective_directives) ? f.in_effective_directives.map(lower) : ['*'], severity: f.severity || 'high',
      severityIfNonce: f.severity_if_nonce_or_hash_present === undefined ? (id === 'unsafe-inline-script' ? null : undefined) : f.severity_if_nonce_or_hash_present,
      cite: citeOf(f.source) });
  }
  const cspEntry = headerEntries.find((h) => h.key === 'content-security-policy');
  return { fallback, required: [...required.values()], forbidden: [...forbidden.values()], cite: cspEntry ? cspEntry.cite : BUILTIN.headers };
}

function normaliseCookies(data, file) {
  const block = data.cookies && typeof data.cookies === 'object' ? data.cookies : {};
  const cite = citeOf(block.source);
  if (Array.isArray(block.checks)) {
    const regex = compileRegex(block.session_cookie_name_pattern || '(^|[-_.])(sess|session|sid|auth|token)([-_.]|$)', block.session_cookie_name_flags || 'i', `${file} : cookies.session_cookie_name_pattern`);
    const checks = block.checks.map((c, i) => {
      if (!c || typeof c.attribute !== 'string' || typeof c.check !== 'string') throw new UsageError(`${file} : cookies.checks[${i}] : « attribute » et « check » attendus`);
      return { id: c.id || `cookie-${lower(c.attribute)}`, appliesTo: c.applies_to || 'all', attribute: c.attribute, check: c.check,
        values: Array.isArray(c.values) ? c.values : [], requiredHttps: c.required === 'https-only', severity: c.severity || 'medium',
        severityNonSession: c.severity_non_session || null, rationale: c.rationale || null, cite: citeOf(c.source, cite) };
    });
    return { sessionTest: (name) => regex.test(name), checks };
  }
  const list = (key, fallback) => {
    const value = block[key] === undefined ? fallback : block[key];
    if (!Array.isArray(value)) throw new UsageError(`${file} : cookies.${key} doit être un tableau`);
    return value;
  };
  const patterns = list('session_cookie_patterns', ['sess', '^sid$', 'auth', 'token', 'login']).map((p) => compileRegex(p, 'i', `${file} : cookies.session_cookie_patterns`));
  const mk = (attribute, appliesTo, check, extra = {}) => ({ id: `cookie-${lower(attribute)}-${appliesTo}`, appliesTo, attribute, check, values: [],
    requiredHttps: false, severity: 'high', severityNonSession: 'low', rationale: null, cite, ...extra });
  const checks = [
    ...list('required_attributes', ['Secure', 'SameSite']).map((a) => mk(a, 'all', 'present')),
    ...list('session_required_attributes', ['HttpOnly']).map((a) => mk(a, 'session', 'present')),
    mk('SameSite', 'all', 'equals-if-present', { id: 'cookie-samesite-value', values: list('samesite_allowed', ['Strict', 'Lax']) }),
    mk('SameSite', 'all', 'if SameSite=None then Secure present', { id: 'cookie-samesite-none-needs-secure', severity: 'medium', severityNonSession: null }),
  ];
  if (block.session_prefix_recommended) checks.push(mk(`name prefix ${block.session_prefix_recommended}`, 'session', 'present', { severity: 'info' }));
  return { sessionTest: (name) => patterns.some((r) => r.test(name)), checks };
}

function normaliseAbsent(data, file) {
  const out = [];
  for (const [i, entry] of (data.absent || []).entries()) {
    const item = typeof entry === 'string' ? { name: entry } : entry;
    if (!item || typeof item.name !== 'string') throw new UsageError(`${file} : absent[${i}] : chaîne ou objet avec « name » attendu`);
    const check = item.pattern ? { type: 'not-matches', regex: compileRegex(item.pattern, 'i', `${file} : absent[${i}]`), when: 'present' } : { type: 'absent' };
    out.push({ name: item.name, key: lower(item.name), checks: [{ ...check, severity: item.severity || 'low' }], rationale: item.rationale || null, cite: citeOf(item.source) });
  }
  for (const [i, item] of (data.absent_or_minimal || []).entries()) {
    if (!item || typeof item.name !== 'string' || !Array.isArray(item.checks)) throw new UsageError(`${file} : absent_or_minimal[${i}] : « name » et « checks » attendus`);
    const checks = item.checks.map((c, j) => normaliseCheck(c, { severity: 'low' }, `${file} : absent_or_minimal[${i}].checks[${j}]`));
    out.push({ name: item.name, key: lower(item.name), checks, rationale: item.rationale || null, cite: citeOf(item.source) });
  }
  return out;
}

export function normaliseBaseline(data, file = 'base') {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new UsageError(`${file} : objet JSON attendu`);
  if (!Array.isArray(data.headers)) throw new UsageError(`${file} : « headers » (tableau) attendu`);
  const headers = data.headers.map(normaliseHeader);
  return {
    meta: data.meta || {}, headers, csp: normaliseCsp(data, headers, file), cookies: normaliseCookies(data, file),
    absent: normaliseAbsent(data, file), cors: Array.isArray(data.cors) ? data.cors.filter((c) => c && c.id) : [],
  };
}

export async function loadBaseline(file) {
  return normaliseBaseline(await readJson(file, 'base d\'en-têtes'), file);
}

// ---- Analyse des valeurs ----------------------------------------------------------------

// Politique de sécurité de contenu : une ou plusieurs politiques séparées par « , ».
export function parseCsp(text) {
  return String(text || '').split(',').map((policy) => {
    const directives = new Map();
    for (const part of policy.split(';')) {
      const tokens = part.trim().split(/\s+/).filter(Boolean);
      if (tokens.length && !directives.has(lower(tokens[0]))) directives.set(lower(tokens[0]), tokens.slice(1));
    }
    return directives;
  }).filter((d) => d.size);
}

// Paramètres « nom[=valeur] » séparés par ; ou , (HSTS, Permissions-Policy...).
export function parseDirectives(text) {
  const out = new Map();
  for (const part of String(text || '').split(/[;,]/)) {
    const [name, ...rest] = part.trim().split('=');
    if (name) out.set(lower(name.trim()), rest.join('=').trim());
  }
  return out;
}

export function parseSetCookie(line) {
  const [pair, ...attrs] = String(line).split(';');
  const attributes = {};
  for (const attr of attrs) {
    const [k, ...v] = attr.split('=');
    if (k.trim()) attributes[lower(k.trim())] = v.length ? v.join('=').trim() : true;
  }
  return { name: pair.split('=')[0].trim(), attributes };
}

function effective(policy, directive, fallback) {
  const seen = new Set();
  for (let d = directive; d && !seen.has(d); d = fallback[d]) {
    if (policy.has(d)) return { name: d, sources: policy.get(d) };
    seen.add(d);
  }
  return null;
}

const hasNonceOrHash = (sources) => sources.some((s) => /^'(nonce-|sha256-|sha384-|sha512-)/i.test(s));

// Une règle dont la seule source est « best practice » n'est jamais présentée comme un manquement :
// elle devient un point à revoir.
function finding(rule, verdict, rawSeverity, cite, extra) {
  const bestPracticeOnly = cite.source.trim().toLowerCase() === '[best practice]';
  return { detector: 'headers', rule, verdict: bestPracticeOnly ? 'NT' : verdict, severity: normaliseSeverity(rawSeverity), ...cite, ...extra };
}

// Problèmes de CSP retenus seulement si aucune des politiques présentes ne les corrige.
function cspFindings(policies, csp, { fromMeta, framingByXfo }) {
  const findings = [];
  for (const rule of csp.forbidden) {
    const perPolicy = policies.map((policy) => {
      const names = rule.directives.includes('*') ? Array.from(policy.keys()) : rule.directives;
      const hits = [];
      let severity = rule.severity;
      for (const name of names) {
        const eff = rule.directives.includes('*') ? { name, sources: policy.get(name) } : effective(policy, name, csp.fallback);
        if (!eff || !eff.sources) continue;
        const token = eff.sources.find((s) => (rule.token ? lower(s) === lower(rule.token) : rule.tokenRegex.test(s)));
        if (!token) continue;
        if (hasNonceOrHash(eff.sources)) {
          if (rule.severityIfNonce === null) continue;
          if (rule.severityIfNonce) severity = rule.severityIfNonce;
          if (['wildcard-script', 'scheme-only-script'].includes(rule.id) && eff.sources.map(lower).includes("'strict-dynamic'")) severity = 'low';
        }
        if (!hits.some((h) => h.directive === eff.name)) hits.push({ directive: eff.name, token });
      }
      return hits.length ? { hits, severity } : null;
    });
    if (!perPolicy.every(Boolean)) continue;
    const { hits, severity } = perPolicy[0];
    const tokens = [...new Set(hits.map((h) => h.token))].join(' ');
    const where = [...new Set(hits.map((h) => h.directive))].join(', ');
    findings.push(finding(RULE_BY_FORBIDDEN_ID[rule.id] || 'csp-forbidden-source', 'NC', severity, rule.cite, {
      header: 'Content-Security-Policy', detail: `${tokens} in ${where}`, baseline_id: rule.id,
      message: `The policy allows ${tokens} in ${where}.` }));
  }
  for (const req of csp.required) {
    if (fromMeta && req.directive === 'frame-ancestors') continue;
    const results = policies.map((policy) => {
      const eff = effective(policy, req.directive, req.directive === 'frame-ancestors' ? {} : csp.fallback);
      if (!eff) return { missing: true };
      const values = eff.sources.map(lower);
      const notAllowed = req.allowed ? values.filter((v) => !req.allowed.map(lower).includes(v)) : [];
      const forbidden = values.filter((v) => req.forbiddenValues.map(lower).includes(v));
      return notAllowed.length || forbidden.length ? { bad: [...notAllowed, ...forbidden], via: eff.name } : null;
    });
    if (!results.every(Boolean)) continue;
    const first = results[0];
    if (first.missing) {
      if (req.directive === 'frame-ancestors' && !framingByXfo) continue; // couvert par no-framing-protection
      const nt = req.directive === 'frame-ancestors';
      findings.push(finding('csp-missing-directive', nt ? 'NT' : 'NC', nt ? 'low' : req.severity, req.cite, { header: 'Content-Security-Policy', detail: req.directive,
        message: nt ? 'frame-ancestors is missing; X-Frame-Options protects against framing, but frame-ancestors is its standard successor.'
          : `The policy has no ${req.directive} directive${csp.fallback[req.directive] ? ' and no fallback directive' : ''}.` }));
    } else {
      findings.push(finding('csp-directive-value', 'NC', req.severity, req.cite, { header: 'Content-Security-Policy', detail: `${req.directive} ${first.bad.join(' ')}`,
        message: `${req.directive} (${first.via === req.directive ? 'declared' : `inherited from ${first.via}`}) allows ${first.bad.join(' ')}${req.allowed ? `; expected ${req.allowed.join(' or ')}` : ''}.` }));
    }
  }
  // Un même jeton signalé par deux règles (par exemple data: dans script-src) n'est compté qu'une fois.
  const seen = new Set();
  return findings.filter((f) => {
    const key = `${f.rule}|${f.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function runCheck(check, value, ctx) {
  const norm = (s) => (check.caseSensitive ? String(s).trim() : lower(String(s).trim()));
  switch (check.type) {
    case 'present': return value !== undefined ? null : 'missing';
    case 'absent': return value === undefined ? null : 'should be absent';
    case 'equals': {
      const tokens = value.split(',').map((t) => t.trim()).filter(Boolean);
      const actual = ctx.key === 'referrer-policy' && tokens.length ? tokens[tokens.length - 1] : value;
      return check.values.some((v) => norm(v) === norm(actual)) ? null : `expected ${check.values.join(' or ')}`;
    }
    case 'matches': return check.regex.test(value) ? null : `expected to match ${check.regex.source}`;
    case 'not-matches': return check.regex.test(value) ? `must not match ${check.regex.source}` : null;
    case 'not-contains': {
      const bad = check.values.find((v) => lower(value).includes(lower(v)));
      return bad ? `must not contain ${bad}` : null;
    }
    case 'min-number': {
      const found = parseDirectives(value).get(lower(check.parameter));
      if (found === undefined) return `expected the ${check.parameter} parameter`;
      return check.min <= 0 || Number.parseInt(found, 10) >= check.min ? null : `expected ${check.parameter} of at least ${check.min}`;
    }
    case 'contains-directive': {
      const policies = parseCsp(value);
      const ok = policies.some((p) => {
        const eff = effective(p, lower(check.parameter), ctx.fallback);
        return eff && (!check.allowed || eff.sources.every((s) => check.allowed.map(lower).includes(lower(s))));
      });
      return ok ? null : `expected the ${check.parameter} directive${check.allowed ? ` limited to ${check.allowed.join(' ')}` : ''}`;
    }
    default: return null; // « csp » : évalué à part, sur toutes les politiques
  }
}

// response : { headers: [{ name, value }], https, local, isHtml, metaCsp }
// `local` : serveur de test en HTTP simple ; les en-têtes « https-only » y sont contrôlés tels que déclarés.
export function evaluateHeaders(response, baseline) {
  const map = new Map();
  for (const { name, value } of response.headers) {
    const key = lower(name);
    map.set(key, map.has(key) && key !== 'set-cookie' ? `${map.get(key)}, ${value}` : value);
  }
  const setCookies = response.headers.filter((h) => lower(h.name) === 'set-cookie').flatMap((h) => h.value.split('\n'));
  const findings = [];
  const notApplicable = [];
  const xfo = String(map.get('x-frame-options') || '').trim().toUpperCase();
  const framingByXfo = xfo === 'DENY' || xfo === 'SAMEORIGIN';
  const cspHeader = map.get('content-security-policy');
  const declaredOnly = !response.https && response.local;

  for (const entry of baseline.headers) {
    if (entry.required === 'https-only' && !response.https && !response.local) { notApplicable.push(`${entry.name} (HTTPS only)`); continue; }
    if (entry.required === 'when-html' && !response.isHtml) { notApplicable.push(`${entry.name} (HTML only)`); continue; }
    const value = map.get(entry.key);
    const recommended = entry.required === 'recommended';
    const note = entry.required === 'https-only' && declaredOnly ? ' Checked as declared: browsers apply it only over HTTPS.' : '';
    for (const check of entry.checks) {
      if (check.type === 'csp') continue;
      if (check.applies === 'when-html' && !response.isHtml) continue;
      if (value === undefined && check.type !== 'present' && check.type !== 'absent') continue;
      if (check.when === 'present' && value === undefined) continue;
      if (value === undefined && entry.key === 'content-security-policy' && response.metaCsp) continue;
      const problem = runCheck(check, value, { key: entry.key, fallback: baseline.csp.fallback });
      if (!problem) continue;
      const rule = problem === 'missing' ? 'missing-header' : problem === 'should be absent' ? 'header-should-be-absent' : 'weak-header-value';
      findings.push(finding(rule, verdictFor(check.severity, recommended), recommended ? 'low' : check.severity, entry.cite, {
        header: entry.name, detail: value === undefined ? entry.name : `${entry.name}: ${value}`, baseline_id: entry.id,
        message: problem === 'missing' ? `The ${entry.name} header is missing.${note}` : `${entry.name}: "${value}" (${check.description || problem}).${note}`,
        ...(entry.rationale ? { rationale: entry.rationale } : {}) }));
      if (problem === 'missing') break;
    }
  }

  const cspText = cspHeader || response.metaCsp;
  if (cspText) {
    const policies = parseCsp(cspText).map((p) => {
      if (cspHeader) return p;
      const copy = new Map(p);
      copy.delete('frame-ancestors');
      return copy;
    });
    findings.push(...cspFindings(policies, baseline.csp, { fromMeta: !cspHeader, framingByXfo }));
    if (!cspHeader) {
      findings.push(finding('csp-in-meta-only', 'NT', 'low', baseline.csp.cite, { header: 'Content-Security-Policy', detail: 'meta',
        message: 'The policy is only declared in a <meta> element: frame-ancestors, report-uri and sandbox are ignored there. Prefer the HTTP header.' }));
    }
  }
  const cspFrames = cspHeader && parseCsp(cspHeader).some((p) => p.has('frame-ancestors'));
  if (!cspFrames && !framingByXfo) {
    findings.push(finding('no-framing-protection', 'NC', 'high', BUILTIN.headers, { header: 'X-Frame-Options', detail: 'frame-ancestors',
      message: 'Neither CSP frame-ancestors nor X-Frame-Options DENY or SAMEORIGIN: the page can be framed by another site (clickjacking).' }));
  }

  const covered = new Set();
  for (const entry of baseline.absent) {
    const value = map.get(entry.key);
    covered.add(entry.key);
    for (const check of entry.checks) {
      if (check.when === 'present' && value === undefined) continue;
      if (value === undefined && check.type !== 'absent') continue;
      const problem = runCheck(check, value, { key: entry.key, fallback: baseline.csp.fallback });
      if (!problem) continue;
      findings.push(finding(check.type === 'absent' ? 'header-should-be-absent' : 'server-version-disclosure', verdictFor(check.severity), check.severity, entry.cite, {
        header: entry.name, detail: `${entry.name}: ${value}`, message: `${entry.name}: "${value}" ${check.type === 'absent' ? 'should not be sent' : 'discloses a software version'}.`,
        ...(entry.rationale ? { rationale: entry.rationale } : {}) }));
    }
  }
  for (const key of VERSION_HEADERS) {
    const value = map.get(key);
    if (value === undefined || covered.has(key) || !/\d/.test(value)) continue;
    findings.push(finding('server-version-disclosure', 'NC', 'low', BUILTIN.headers, { header: key, detail: `${key}: ${value}`, message: `${key}: "${value}" discloses a software version.` }));
  }

  findings.push(...evaluateCors(map, baseline.cors, response.isHtml, setCookies.length > 0));
  findings.push(...evaluateCookies(setCookies, baseline.cookies, response.https || response.local));
  return { findings, headers: Object.fromEntries(map), set_cookie: setCookies, not_applicable: notApplicable };
}

function evaluateCors(map, rules, isHtml, setsCookie) {
  const origin = map.get('access-control-allow-origin');
  if (origin === undefined || origin.trim() !== '*') return [];
  const out = [];
  for (const rule of rules) {
    const cite = citeOf(rule.source);
    if (rule.id === 'cors-wildcard-credentials' && lower(map.get('access-control-allow-credentials') || '') === 'true') {
      out.push(finding(rule.id, 'NC', rule.severity || 'high', cite, { header: 'Access-Control-Allow-Origin', detail: '*',
        message: 'Access-Control-Allow-Origin is * together with Access-Control-Allow-Credentials: true.' }));
    }
    if (rule.id === 'cors-wildcard-html' && (isHtml || setsCookie)) {
      out.push(finding(rule.id, 'NC', rule.severity || 'medium', cite, { header: 'Access-Control-Allow-Origin', detail: '*',
        message: 'Access-Control-Allow-Origin is * on an HTML response or a response that sets a cookie.' }));
    }
  }
  return out;
}

// `secureContext` : HTTPS, ou serveur local de test (les attributs sont contrôlés tels que déclarés).
export function evaluateCookies(lines, policy, secureContext = true) {
  const findings = [];
  for (const line of lines) {
    const { name, attributes } = parseSetCookie(line);
    if (!name) continue;
    const session = policy.sessionTest(name);
    for (const check of policy.checks) {
      if ((check.appliesTo === 'session' && !session) || (check.appliesTo === 'non-session' && session)) continue;
      if (check.requiredHttps && !secureContext) continue;
      const severity = !session && check.severityNonSession ? check.severityNonSession : check.severity;
      const attr = lower(check.attribute);
      const base = { cookie: { name, set_cookie: line }, baseline_id: check.id, ...(check.rationale ? { rationale: check.rationale } : {}) };
      const add = (rule, detail, message) => findings.push(finding(rule, verdictFor(severity), severity, check.cite, { ...base, detail, message }));
      if (/none.*then.*secure/i.test(check.check) || check.id === 'cookie-samesite-none-needs-secure') {
        if (lower(attributes.samesite || '') === 'none' && attributes.secure === undefined) {
          add('cookie-samesite-none-without-secure', `${name} SameSite=None`, `Cookie "${name}" has SameSite=None without Secure: browsers reject it.`);
        }
      } else if (attr.startsWith('name prefix')) {
        const prefix = check.attribute.split(/\s+/).pop();
        if (!name.startsWith(prefix)) add('cookie-prefix', `${name} ${prefix}`, `Cookie "${name}" does not use the ${prefix} prefix, which makes the browser enforce Secure, Path=/ and no Domain.`);
      } else if (check.check === 'present') {
        if (attributes[attr] === undefined) add('cookie-missing-attribute', `${name} ${check.attribute}`, `Cookie "${name}" is set without the ${check.attribute} attribute.`);
      } else if (check.check === 'absent') {
        if (attributes[attr] !== undefined) add('cookie-unexpected-attribute', `${name} ${check.attribute}`, `Cookie "${name}" sets ${check.attribute}, which the baseline asks to leave out.`);
      } else if (check.check === 'equals' || check.check === 'equals-if-present') {
        const actual = attributes[attr];
        if (actual === undefined) {
          if (check.check === 'equals') add('cookie-missing-attribute', `${name} ${check.attribute}`, `Cookie "${name}" is set without the ${check.attribute} attribute.`);
        } else if (!check.values.map(lower).includes(lower(actual === true ? '' : actual))) {
          add(attr === 'samesite' ? 'cookie-samesite-value' : 'cookie-attribute-value', `${name} ${check.attribute}=${actual}`,
            `Cookie "${name}" has ${check.attribute}=${actual}; the baseline expects ${check.values.join(' or ')}.`);
        }
      }
    }
  }
  return findings;
}
