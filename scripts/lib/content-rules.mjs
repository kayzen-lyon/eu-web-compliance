// Règles du vérificateur de contenu (scripts/check-content.mjs) qui ne demandent pas de navigateur :
// lecture et validation de compliance/site.json, libellés imposés par la loi, motifs de texte,
// sources citées par chaque règle. Testées sans navigateur dans tests/content.test.mjs.
//
// Chaque règle repose sur un fait de references/regulatory-status.md (sections 2 et 5). Les
// libellés acceptés tels quels sont ceux écrits dans les textes et repris par les références du
// skill ; toute autre formulation est « à revoir » : l'équivalence relève d'un professionnel.

import fs from 'node:fs/promises';
import { UsageError, readJson } from './cli.mjs';

export const SITE_PATH = 'compliance/site.json';

// ---- Libellés écrits dans les textes (references/consumer/online-sales.md, withdrawal-function.md) ----

export const LEGAL_LABELS = {
  order: ['order with obligation to pay', 'commande avec obligation de paiement'],
  withdraw: ['withdraw from contract here', 'renoncer au contrat ici'],
  confirm: ['confirm withdrawal', 'confirmer la rétractation'],
};

// Mots qui, seuls, ne disent pas que le clic engage à payer ou qu'il confirme une rétractation
// (references/consumer/online-sales.md section 4, « Labels to avoid »).
const VAGUE_WORDS = new Set([
  'continue', 'continuer', 'confirm', 'confirmer', 'confirmation', 'submit', 'soumettre', 'valider', 'validate',
  'validation', 'next', 'suivant', 'suivante', 'ok', 'send', 'envoyer', 'order', 'commander', 'commande', 'complete',
  'compléter', 'terminer', 'finish', 'finaliser', 'proceed', 'place', 'passer', 'done', 'go', 'checkout', 'register',
  'enregistrer', 'request', 'demande', 'form', 'formulaire', 'step', 'étape', 'save', 'sauvegarder',
  // mots de liaison
  'the', 'my', 'your', 'ma', 'mon', 'mes', 'la', 'le', 'les', 'l', 'votre', 'vos', 'now', 'maintenant', 'à', 'a', 'to',
  'et', 'and', 'de', 'du', 'd', 'this', 'ce', 'cette', 'me', 'moi',
]);

export function normaliseLabel(text) {
  return String(text || '').normalize('NFC').toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim()
    .replace(/[.!:…\s]+$/u, '');
}

function words(text) {
  return normaliseLabel(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// kind : 'order' | 'confirm'. Renvoie 'legal' (libellé de la loi), 'vague' (que des mots vagues),
// 'other' (autre formulation, équivalence à confirmer) ou 'missing' (pas de libellé).
export function classifyActionLabel(name, kind) {
  const label = normaliseLabel(name);
  if (!label) return 'missing';
  if (LEGAL_LABELS[kind].includes(label)) return 'legal';
  const list = words(label);
  if (list.length && list.every((w) => VAGUE_WORDS.has(w))) return 'vague';
  return 'other';
}

const WITHDRAW_LIKE = /(withdraw|withdrawal|rétract|retract|renonc|cancel|annul|résili|resili|return an? |retourner|droit de retour)/i;

// Point d'entrée de la fonction de rétractation : 'legal', 'other' (ressemble à une rétractation,
// libellé différent) ou null (sans rapport).
export function classifyWithdrawalEntry(name) {
  const label = normaliseLabel(name);
  if (!label) return null;
  if (LEGAL_LABELS.withdraw.includes(label)) return 'legal';
  if (label.length <= 80 && WITHDRAW_LIKE.test(label)) return 'other';
  return null;
}

// ---- Motifs de texte (anglais et français) --------------------------------------------------

// « AI » et « IA » en capitales seulement : en minuscules, ces lettres apparaissent dans des mots.
export const AI_TERM = /(\b(AI|IA|A\.I\.|I\.A\.)\b|artificial intelligence|intelligence artificielle)/;
export const AI_GENERATED = /(generat|génér|gener|modifi|written|rédig|écrit|created|créé|produced|produit|translat|tradui|made with|fait avec|réalisé avec|retouch)/i;
export const AMBIGUOUS_CHAT = /(assistant|\bbot\b|chatbot|virtual agent|agent virtuel|conseill|advis[eo]r|helper|votre guide|your guide)/i;
export const LEGAL_NOTICE_LINK = /(mentions l[ée]gales|legal notice|imprint|impressum|legal information|informations l[ée]gales)/i;
export const ODR_HREF = /(ec\.europa\.eu\/consumers\/odr|webgate\.ec\.europa\.eu\/odr)/i;
export const PRIOR_PRICE = /(lowest price|prix le plus bas|prior price|price before the reduction|prix (de référence|antérieur|avant (la )?réduction)|30 (derniers )?jours|30 days|previous lowest)/i;
export const PRICE = /(\d+(?:[.,]\d{1,2})?\s?(?:€|EUR\b|\$|£))|((?:€|\$|£)\s?\d+(?:[.,]\d{1,2})?)/i;
export const REDUCTION = /((^|[\s(])[-−–]\s?\d{1,2}(?:[.,]\d+)?\s?%)|((réduction|remise|rabais|discount|reduction|\bsave|économisez|soldes?|\boff)\b\D{0,15}\d{1,2}\s?%)|(\d{1,2}\s?%\s?(off\b|de réduction|de remise))|(\b(was|now|instead of|au lieu de)\b\s*:?\s*[€$£]?\s?\d)/i;
export const SCARCITY = /(\bonly \d+ (left|remaining|in stock)\b|\b\d+ (left|remaining) in stock\b|\blast \d+ (items?|pieces?)\b|\bplus que \d+\b|\bil (ne )?reste( plus)?( que)? \d+\b|\bseulement \d+ (en stock|exemplaires?|articles?|pièces?)|\bderniers? exemplaires?\b|\b\d+ (people|personnes) (are |sont )?(looking|viewing|en train de|consultent|regardent))/i;
export const URGENCY = /(ends? in|offer ends|expires? in|time left|countdown|hurry|se termine dans|fin (de l'offre|des soldes|de la promotion) dans|plus que|il reste|temps restant|compte à rebours|dépêchez|expire dans)/i;
export const CLOCK = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/;
const SHAMING = [
  /^(no|nope|non)\b[ ,]*(thanks?|merci)?[ ,]*\b(i|je|j')\b/i,
  /\bi('d| would)? (rather|prefer to) (pay|miss|stay|not)\b/i,
  /\bi (don't|do not) (like|want|need|care about) (sav|deals|discount|money|good)/i,
  /\bje (ne )?(veux|souhaite|préfère|aime) (pas|payer|rester|rater|plein)/i,
  /\bje préfère payer/i,
  /\btant pis pour moi\b/i,
  /\bje n'aime pas (les )?(économies|économiser|bonnes affaires)/i,
];

export function isConfirmshaming(name) {
  const text = normaliseLabel(name);
  return text.length >= 10 && text.length <= 140 && SHAMING.some((re) => re.test(text));
}

// Option payante ou consentement marketing reconnaissable au libellé d'une case.
// Indices forts d'un supplément payant : un prix, ou un service dont la vente est l'objet.
const PAID_PRICE = /((\+|plus)\s?\d|\d+(?:[.,]\d{1,2})?\s?(€|EUR\b|\$|£)|(€|\$|£)\s?\d)/i;
const PAID_STRONG = /(insurance|assurance|warranty|garantie|gift wrap|emballage cadeau|paquet cadeau|donation)/i;
const PAID_WEAK = /(\bdon\b|express|protection|extension|priority|prioritaire|€|\$|£)/i;
const MARKETING = /(newsletter|lettre d'information|infolettre|offres|offers|marketing|partenaires|partners|promotion|commercial|publicit|advertis|subscribe|s'abonner|abonnez|recevoir nos|receive our|bons plans|deals)/i;

// Case cochée d'avance : { kind: 'paid' | 'marketing', verdict: 'NC' | 'NT' }, ou null.
// NC seulement quand le libellé propre de la case (label, aria-label, aria-labelledby) montre
// un prix ou un supplément payant sans ambiguïté. Un libellé deviné depuis le texte voisin
// (`ownLabel: false`), un indice faible ou un consentement marketing (qui peut être une
// opposition proposée à un client existant) sont à revoir.
export function classifyPreTicked(label, { ownLabel = true } = {}) {
  const text = label || '';
  const strong = PAID_PRICE.test(text) || PAID_STRONG.test(text);
  if (strong || PAID_WEAK.test(text)) return { kind: 'paid', verdict: strong && ownLabel ? 'NC' : 'NT' };
  if (MARKETING.test(text)) return { kind: 'marketing', verdict: 'NT' };
  return null;
}

// Verdict d'une page sans lien vers la page d'identification. Les libellés reconnus sont anglais,
// français (et « Impressum ») : sur un site dans une autre langue, ou sans déclaration du site,
// l'absence n'est qu'un indice.
export function legalNoticeLinkVerdict(site, pageLang) {
  if (!site) return 'NT';
  const lang = String(site.language || pageLang || '').toLowerCase().split(/[-_]/)[0];
  return lang === 'en' || lang === 'fr' ? 'NC' : 'NT';
}

// Durée en secondes d'un texte de compte à rebours (09:59, 1:02:03, 2 h 05 min 10 s), ou null.
export function parseCountdown(text) {
  const clock = String(text || '').match(CLOCK);
  if (clock) {
    const [a, b, c] = [clock[1], clock[2], clock[3]].map((x) => (x === undefined ? null : Number(x)));
    return c === null ? a * 60 + b : a * 3600 + b * 60 + c;
  }
  const parts = String(text || '').match(/(\d+)\s?(h|min|mn|s)\b/gi);
  if (!parts) return null;
  return parts.reduce((total, part) => {
    const [, n, unit] = part.match(/(\d+)\s?(h|min|mn|s)/i);
    const factor = { h: 3600, min: 60, mn: 60, s: 1 }[unit.toLowerCase()];
    return total + Number(n) * factor;
  }, 0);
}

// Catégories d'information de la page d'identification. Une catégorie absente est « à revoir » :
// le vérificateur ne sait pas valider un contenu, seulement remarquer qu'un élément manque.
const NOTICE_CATEGORIES = {
  name: /(édité par|éditeur|published by|publisher|service provider|provider|operated by|exploité par|raison sociale|dénomination|company|société)/i,
  address: /(\b\d{4,5}\s+\p{Lu}[\p{L}-]+|\b(rue|avenue|boulevard|chemin|place|allée|quai|street|road|lane|row|square|straße|strasse)\b|registered office|siège social)/iu,
  email: /([\w.+-]+@[\w-]+(\.[\w-]+)+)/,
  telephone: /(\+\d{2,3}[\s.]?\d|\b0\d([\s.]?\d{2}){4}\b|t[ée]l[ée]phone|\bphone\b)/i,
  registration: /(\bRCS\b|\bRM\b|SIREN|SIRET|registre|register|registration|handelsregister|immatricul)/i,
  vat: /(\bTVA\b|\bVAT\b)/,
  publication_director: /(directeur|directrice|director) de (la )?publication|publication director/i,
  host: /(hébergeur|hébergé par|hosted by|\bhost\b|hosting provider)/i,
};

const CATEGORY_TEXT = {
  name: 'name of the operator', address: 'geographic address', email: 'email address', telephone: 'telephone number',
  registration: 'register and registration number', vat: 'VAT number', publication_director: 'publication director',
  host: 'host (name, address, telephone)',
};

// Catégories attendues selon la déclaration du site. Sans pays déclaré : liste européenne seule.
export function noticeCategories(site) {
  const op = (site && site.operator) || {};
  const list = ['name', 'address', 'email'];
  if (op.registered) list.push('registration');
  if (op.vat) list.push('vat');
  if (op.country === 'FR') list.push('telephone', 'publication_director', 'host');
  return list;
}

export function missingNoticeCategories(text, site) {
  return noticeCategories(site).filter((c) => !NOTICE_CATEGORIES[c].test(text || '')).map((c) => ({ key: c, text: CATEGORY_TEXT[c] }));
}

// ---- compliance/site.json ------------------------------------------------------------------

const CONTENT_KINDS = ['image', 'video', 'audio', 'text'];
const AI_USES = ['generated', 'modified', 'translated', 'edited'];
const PAGE_KEYS = ['legal_notice', 'order_start', 'order_final', 'withdrawal'];

function check(condition, message) {
  if (!condition) throw new UsageError(`${SITE_PATH} : ${message}`);
}

const isBool = (v) => v === undefined || typeof v === 'boolean';
const isString = (v) => v === undefined || (typeof v === 'string' && v.length > 0);
const isStringList = (v) => v === undefined || (Array.isArray(v) && v.every((x) => typeof x === 'string' && x));

// Valide la déclaration et renvoie une copie normalisée. Les champs inconnus sont ignorés.
export function normaliseSite(data) {
  check(data && typeof data === 'object' && !Array.isArray(data), 'objet JSON attendu');
  check(isString(data.language), 'language : chaîne attendue (fr, en...)');
  const operator = data.operator === undefined ? {} : data.operator;
  check(operator && typeof operator === 'object' && !Array.isArray(operator), 'operator : objet attendu');
  check(isString(operator.country) && (!operator.country || /^[A-Z]{2}$/.test(operator.country)), 'operator.country : code pays en deux capitales (FR, DE...)');
  check(isBool(operator.registered) && isBool(operator.vat), 'operator.registered et operator.vat : booléens attendus');
  check(isBool(data.distance_selling_to_consumers) && isBool(data.online_platform), 'distance_selling_to_consumers et online_platform : booléens attendus');
  const pages = data.pages === undefined ? {} : data.pages;
  check(pages && typeof pages === 'object' && !Array.isArray(pages), 'pages : objet attendu');
  for (const key of Object.keys(pages)) {
    check(PAGE_KEYS.includes(key), `pages.${key} : clé inconnue (attendu : ${PAGE_KEYS.join(', ')})`);
    check(isString(pages[key]), `pages.${key} : chemin de page attendu`);
  }
  check(isStringList(data.withdrawal_link_pages), 'withdrawal_link_pages : liste de chemins attendue');
  check(isString(data.order_button), 'order_button : sélecteur CSS attendu');
  const ai = data.ai === undefined ? {} : data.ai;
  check(ai && typeof ai === 'object' && !Array.isArray(ai), 'ai : objet attendu');
  check(isStringList(ai.chat_widgets), 'ai.chat_widgets : liste de sélecteurs CSS attendue');
  check(isString(ai.editorial_responsibility_page), 'ai.editorial_responsibility_page : chemin de page attendu');
  check(ai.content === undefined || Array.isArray(ai.content), 'ai.content : liste attendue');
  const content = (ai.content || []).map((item, i) => {
    check(item && typeof item.page === 'string' && typeof item.selector === 'string', `ai.content[${i}] : page et selector (chaînes) attendus`);
    check(CONTENT_KINDS.includes(item.kind), `ai.content[${i}].kind : ${CONTENT_KINDS.join(', ')}`);
    check(item.ai_use === undefined || AI_USES.includes(item.ai_use), `ai.content[${i}].ai_use : ${AI_USES.join(', ')}`);
    check(isBool(item.public_interest) && isBool(item.editorial_review) && isBool(item.deep_fake), `ai.content[${i}] : public_interest, editorial_review et deep_fake booléens`);
    return { ai_use: 'generated', ...item };
  });
  return {
    language: data.language || null,
    operator: { country: operator.country || null, registered: Boolean(operator.registered), vat: Boolean(operator.vat), declared: data.operator !== undefined },
    distance_selling_to_consumers: data.distance_selling_to_consumers,
    online_platform: Boolean(data.online_platform),
    pages: { ...pages },
    withdrawal_link_pages: data.withdrawal_link_pages || null,
    order_button: data.order_button || null,
    ai: { chat_widgets: ai.chat_widgets || [], content, editorial_responsibility_page: ai.editorial_responsibility_page || null },
  };
}

export async function loadSite(file) {
  if (!file) return { file: null, site: null };
  const exists = await fs.stat(file).then((s) => s.isFile(), () => false);
  if (!exists) return { file: null, site: null };
  return { file, site: normaliseSite(await readJson(file, SITE_PATH)) };
}

// Ce que l'article 50(4) demande pour un contenu déclaré : 'label' (étiquette visible), 'review'
// (à confirmer par une personne) ou 'none' (exception), avec la raison.
export function labelRequirement(item) {
  if (item.kind !== 'text') {
    if (item.deep_fake === false) return { need: 'none', reason: 'declared not a deep fake (insignificant edit, or not realistic)' };
    return { need: 'label', reason: `${item.ai_use} ${item.kind}` };
  }
  if (item.public_interest === false) return { need: 'none', reason: 'declared not published to inform the public on a matter of public interest' };
  if (item.editorial_review) return { need: 'none', reason: 'editorial exception declared (human review and editorial responsibility)' };
  if (item.ai_use === 'translated' || item.ai_use === 'edited') {
    return { need: 'review', reason: `${item.ai_use === 'translated' ? 'AI translation' : 'AI editing'} without declared editorial review` };
  }
  return { need: 'label', reason: 'public-interest text generated or modified with AI, without declared editorial review' };
}

// ---- Sources citées --------------------------------------------------------------------------

const fr = (site) => Boolean(site && site.operator && site.operator.country === 'FR');

export function cite(rule, site) {
  const platform = Boolean(site && site.online_platform);
  const deceptive = (tags, refs) => ({ source: platform ? `${tags} [DSA art. 25]` : tags, refs: platform ? [...refs, 'dsa'] : refs });
  switch (rule) {
    case 'chat':
      return { source: '[AI Act art. 50(1)] [AI Act art. 50(5)] [AI Act Guidelines point 38]', refs: ['ai-act', 'ai-act-art50-guidelines'] };
    case 'chat-messages':
      return { source: '[AI Act art. 50(5)]', refs: ['ai-act'] };
    case 'label':
      return { source: '[AI Act art. 50(4)] [AI Act art. 50(5)] [AI Act Guidelines point 117]', refs: ['ai-act', 'ai-act-art50-guidelines'] };
    case 'label-accessible':
      return { source: '[AI Act art. 50(5)] [AI CoP section 2, measure 1.1]', refs: ['ai-act', 'ai-content-code-of-practice'] };
    case 'label-placement':
      return { source: '[AI Act art. 50(5)] [AI CoP section 2, measure 1.2]', refs: ['ai-act', 'ai-content-code-of-practice'] };
    case 'editorial':
      return { source: '[AI Act art. 50(4)] [AI Act Guidelines point 138]', refs: ['ai-act', 'ai-act-art50-guidelines'] };
    case 'order-button':
      return fr(site) ? { source: '[CRD art. 8(2)] [C. conso L. 221-14]', refs: ['consumer-rights-directive', 'fr-code-consommation'] }
        : { source: '[CRD art. 8(2)]', refs: ['consumer-rights-directive'] };
    case 'order-start':
      return fr(site) ? { source: '[CRD art. 8(3)] [C. conso L. 221-14]', refs: ['consumer-rights-directive', 'fr-code-consommation'] }
        : { source: '[CRD art. 8(3)]', refs: ['consumer-rights-directive'] };
    case 'withdrawal':
      return fr(site) ? { source: '[CRD 11a] [C. conso L. 221-21]', refs: ['withdrawal-function-directive', 'fr-code-consommation'] }
        : { source: '[CRD 11a]', refs: ['withdrawal-function-directive'] };
    case 'withdrawal-reason':
      return { source: '[CRD art. 9(1)] [CRD 11a]', refs: ['consumer-rights-directive', 'withdrawal-function-directive'] };
    case 'price':
      return fr(site) ? { source: '[PID art. 6a] [C. conso L. 112-1-1]', refs: ['price-reduction-directive', 'fr-code-consommation'] }
        : { source: '[PID art. 6a]', refs: ['price-reduction-directive'] };
    case 'pre-ticked-paid':
      return { source: '[CRD art. 22] [UCPD Guidance section 4.2.7]', refs: ['consumer-rights-directive', 'ucpd-guidance-2021'] };
    case 'pre-ticked-marketing':
      return { source: '[GDPR art. 7] [UCPD Guidance section 4.2.7]', refs: ['gdpr', 'ucpd-guidance-2021'] };
    case 'urgency':
      return deceptive('[UCPD Annex I no. 7] [UCPD Guidance section 4.2.7]', ['ucpd', 'ucpd-guidance-2021']);
    case 'confirmshaming':
      return deceptive('[UCPD art. 8] [UCPD Guidance section 4.2.7]', ['ucpd', 'ucpd-guidance-2021']);
    case 'legal-notice':
      return fr(site) ? { source: '[ECD art. 5(1)] [LCEN art. 1-1]', refs: ['ecommerce-directive', 'fr-lcen'] }
        : { source: '[ECD art. 5(1)]', refs: ['ecommerce-directive'] };
    case 'legal-notice-content':
      if (fr(site)) {
        return site.distance_selling_to_consumers ? { source: '[ECD art. 5(1)] [LCEN art. 1-1] [LCEN art. 19]', refs: ['ecommerce-directive', 'fr-lcen'] }
          : { source: '[ECD art. 5(1)] [LCEN art. 1-1]', refs: ['ecommerce-directive', 'fr-lcen'] };
      }
      return { source: '[ECD art. 5(1)]', refs: ['ecommerce-directive'] };
    case 'odr':
      return { source: '[best practice]', refs: ['odr-repeal'] };
    default:
      throw new Error(`source inconnue pour la règle ${rule}`);
  }
}
