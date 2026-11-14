// Parties du rapport unifié tirées de la matrice d'applicabilité (scripts/applicability.py
// --format json) : résumé de la matrice, documents à publier, obligations qu'aucun vérificateur
// ne couvre, et vérifications manuelles d'accessibilité (references/accessibility/testing-by-hand.md).

// Obligations dont une partie vérifiable par le code est contrôlée par un vérificateur. Une
// obligation absente de cette table, ou dont le vérificateur n'a pas tourné, va dans la liste
// « à vérifier par une personne ».
export const COVERAGE = {
  a11y: ['a11y-baseline-wcag22-aa', 'eaa-service-accessibility', 'eaa-ecommerce-functions', 'fr-rgaa-conformity'],
  privacy: ['privacy-baseline-no-tracker-before-consent', 'fr-trackers-consent', 'fr-trackers-cnil-recommendation',
    'fr-audience-measurement-exemption', 'fr-session-replay'],
  security: ['sec-baseline-https-headers'],
  content: ['ai-disclose-interaction', 'ai-disclose-generated-content', 'ai-content-label-icon', 'con-operator-identification',
    'fr-legal-notice', 'fr-ecommerce-identification', 'con-order-button', 'fr-order-process-information', 'con-withdrawal-function',
    'fr-withdrawal-function', 'con-price-reduction', 'con-no-deceptive-design', 'con-no-odr-link'],
};

// Documents à publier. Un document est demandé dès qu'une de ses obligations est retenue.
// `keywords` sert à deviner si une page du site est ce document (nom de fichier, titre, h1,
// texte d'un lien vers une page existante).
export const DOCUMENTS = [
  { id: 'accessibility-statement-fr', title: 'Accessibility statement (France, RGAA)', template: 'templates/accessibility-statement-fr.md',
    obligations: ['fr-accessibility-statement'], keywords: /accessibilit/i },
  { id: 'accessibility-information-eaa', title: 'Accessibility information of the service (EAA)', template: 'templates/accessibility-information-eaa.md',
    obligations: ['eaa-information-duty', 'fr-eaa-service-provider-duties'], keywords: /accessibilit/i },
  { id: 'legal-notice', title: 'Legal notice (identification of the operator)', template: 'templates/consumer/legal-notice-eu.md',
    templateIf: [['fr-legal-notice', 'templates/consumer/legal-notice-fr.md']],
    obligations: ['con-operator-identification', 'fr-legal-notice'],
    keywords: /legal notice|legal information|mentions[ -]l[ée]gales|informations l[ée]gales|imprint|impressum|\blegal\b/i },
  { id: 'privacy-policy', title: 'Privacy policy', template: 'templates/privacy-policy.md', obligations: ['gdpr-information-notice'],
    keywords: /privacy|confidentialit|donn[ée]es personnelles|data protection|protection des donn/i },
  { id: 'cookie-policy', title: 'Cookie policy', template: 'templates/cookie-policy.md',
    obligations: ['fr-trackers-consent', 'fr-trackers-cnil-recommendation'], keywords: /cookie|traceurs/i },
  { id: 'ai-usage-page', title: 'Use of AI on this site', template: 'templates/ai/ai-usage-page.md',
    obligations: ['ai-disclose-interaction', 'ai-disclose-generated-content', 'ai-content-label-icon', 'ai-disclosure-form'],
    keywords: /\bAI\b|artificial intelligence|intelligence artificielle|\bIA\b/ },
  { id: 'withdrawal-function', title: 'Withdrawal function and withdrawal statement form', template: 'templates/consumer/withdrawal-function.html',
    obligations: ['con-withdrawal-function', 'fr-withdrawal-function'], keywords: /withdraw|r[ée]tractation/i },
];

const LEVEL_RANK = { mandatory: 3, 'to-confirm': 2, recommended: 1 };

// Une obligation est retenue si elle s'applique, si elle est à confirmer (traitée comme
// applicable), ou si le skill l'applique de toute façon à titre de recommandation.
export function retainedLevel(o) {
  if (o.status === 'applies') return o.level === 'recommended' ? 'recommended' : 'mandatory';
  if (o.status === 'to-confirm') return 'to-confirm';
  if (o.applied_by_skill_regardless && o.level === 'recommended') return 'recommended';
  return null;
}

const short = (o, extra = {}) => ({ id: o.id, domain: o.domain, title: o.title, level: o.level, rules_file: o.rules_file_exists === false ? null : o.rules_file || null, ...extra });

export function matrixSummary(matrix) {
  if (!matrix || !Array.isArray(matrix.obligations)) return null;
  const by = (status) => matrix.obligations.filter((o) => o.status === status);
  return {
    counts: matrix.counts || {},
    applies: by('applies').map((o) => short(o)),
    to_confirm: by('to-confirm').map((o) => short(o, { reasons: (o.to_confirm || []).map(String) })),
    does_not_apply: by('does-not-apply').map((o) => short(o, o.applied_by_skill_regardless && o.level === 'recommended' ? { reasons: ['applied by the skill as a recommendation'] } : {})),
    assumptions: matrix.assumptions || { assumed_answers: [], missing_answers: [] },
    country_coverage: matrix.country_coverage || [],
    beyond_the_skill: matrix.beyond_the_skill || [],
  };
}

const DOMAIN_OF_CHECKER = { a11y: 'accessibility', privacy: 'privacy', security: 'security', content: 'consumer' };
const RUN_HINT = {
  a11y: 'node scripts/check-a11y.mjs <site>',
  privacy: 'node scripts/check-privacy.mjs <site>',
  security: 'node scripts/check-security.mjs <site>',
  content: 'node scripts/check-content.mjs <site> (AI transparency and consumer law)',
};

// Vérifications manuelles d'accessibilité : une par section « ## N. Titre » de testing-by-hand.md,
// avec la condition de réussite (« Pass: ... ») comme marche à suivre en une ligne.
export function parseTestingByHand(text, reference = 'references/accessibility/testing-by-hand.md') {
  if (!text) return [];
  const out = [];
  const sections = text.split(/^## /m).slice(1);
  for (const section of sections) {
    const head = section.match(/^(\d+)\.\s+(.+)$/m);
    if (!head) continue;
    const pass = section.match(/^Pass:\s*(.+)$/m);
    const firstStep = section.match(/^1\.\s+(.+)$/m);
    const procedure = pass ? `Pass when: ${pass[1].trim()}` : (firstStep ? firstStep[1].trim() : head[2].trim());
    out.push({ id: `manual-a11y-${head[1]}`, domain: 'accessibility', title: head[2].trim(), procedure, reference, origin: 'testing-by-hand' });
  }
  return out;
}

// Obligations retenues qu'aucun vérificateur lancé ne couvre, et vérificateurs non lancés.
export function uncoveredObligations(matrix, checkerStatus) {
  const covered = new Set();
  for (const [checker, ids] of Object.entries(COVERAGE)) if (checkerStatus[checker] === 'ran') ids.forEach((id) => covered.add(id));
  const out = [];
  for (const [checker, status] of Object.entries(checkerStatus)) {
    if (status === 'ran') continue;
    out.push({ id: `run-${checker}`, domain: DOMAIN_OF_CHECKER[checker], title: `Checker ${checker} did not run (${status})`,
      procedure: `Run ${RUN_HINT[checker]} or check its obligations by hand.`, reference: null, origin: 'checker-not-run' });
  }
  for (const o of (matrix && matrix.obligations) || []) {
    const level = retainedLevel(o);
    if (!level || covered.has(o.id)) continue;
    out.push({ id: o.id, domain: ['accessibility', 'privacy', 'ai', 'security', 'consumer'].includes(o.domain) ? o.domain : 'consumer',
      title: `${o.title}${level === 'mandatory' ? '' : ` (${level})`}`,
      procedure: `Check by hand that: ${String(o.requires || o.title).trim()}`,
      reference: o.rules_file_exists === false ? null : o.rules_file || null, origin: 'matrix' });
  }
  return out;
}

// Index des pages d'un site local : [{ page, title, h1, links: [{ href, text }] }].
export function indexPage(page, html) {
  const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  const links = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: m[1], text: strip(m[2]) }));
  return { page, title: title ? strip(title) : '', h1: h1 ? strip(h1) : '', links };
}

function resolveHref(fromPage, href) {
  if (/^[a-z]+:/i.test(href) || href.startsWith('#')) return null;
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return null;
  const base = fromPage.includes('/') ? fromPage.slice(0, fromPage.lastIndexOf('/') + 1) : '';
  const parts = [];
  for (const part of (clean.startsWith('/') ? clean.slice(1) : base + clean).split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  const joined = parts.join('/');
  return joined === '' || joined.endsWith('/') ? `${joined}index.html` : joined;
}

function pagesMatching(doc, siteIndex) {
  const pages = new Set();
  const names = new Set(siteIndex.map((p) => p.page));
  for (const p of siteIndex) {
    const file = p.page.replace(/\.html?$/i, '').replace(/[-_/]/g, ' ');
    if (doc.keywords.test(file) || doc.keywords.test(p.title) || doc.keywords.test(p.h1)) pages.add(p.page);
  }
  for (const p of siteIndex) {
    for (const link of p.links) {
      if (!doc.keywords.test(link.text)) continue;
      const target = resolveHref(p.page, link.href);
      if (target && (names.has(target) || names.has(`${target}.html`))) pages.add(names.has(target) ? target : `${target}.html`);
    }
  }
  return [...pages].sort();
}

// Documents demandés par la matrice. siteIndex null : cible distante, pages non recherchées.
export function documentsToPublish(matrix, siteIndex) {
  const byId = new Map(((matrix && matrix.obligations) || []).map((o) => [o.id, o]));
  const out = [];
  for (const doc of DOCUMENTS) {
    const levels = doc.obligations.map((id) => byId.get(id)).filter(Boolean).map(retainedLevel).filter(Boolean);
    if (!levels.length) continue;
    const level = levels.sort((a, b) => LEVEL_RANK[b] - LEVEL_RANK[a])[0];
    const obligations = doc.obligations.filter((id) => byId.get(id) && retainedLevel(byId.get(id)));
    const special = (doc.templateIf || []).find(([id]) => obligations.includes(id));
    const pages = siteIndex ? pagesMatching(doc, siteIndex) : [];
    out.push({ id: doc.id, title: doc.title, template: special ? special[1] : doc.template, obligations, level,
      status: siteIndex ? (pages.length ? 'found' : 'not-found') : 'not-checked', pages });
  }
  return out;
}
