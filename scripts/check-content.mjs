#!/usr/bin/env node
// Contrôle automatique des obligations de contenu d'un site : transparence de l'IA (AI Act,
// article 50) et droit de la consommation (vente à distance, prix, interfaces trompeuses,
// identification de l'exploitant), page par page, dans Chromium piloté par Playwright.
//
// Règles (identifiant de règle dans le rapport ; NC = non-conformité, NT = à revoir) :
//   ai-chat-no-disclosure             NC  fenêtre de discussion sans texte visible disant que l'on parle à une IA
//   ai-chat-ambiguous-label           NT  seul un libellé ambigu (« assistant », « bot ») sans le mot IA
//   ai-chat-disclosure-outside-widget NT  l'IA n'est mentionnée qu'ailleurs (pied de page, page liée)
//   ai-chat-messages-not-identified   NT  messages de l'assistant sans « IA » pour les technologies d'assistance
//   ai-chat-not-opened                NT  fenêtre masquée que le vérificateur n'a pas pu ouvrir
//   ai-chat-not-found                 NT  fenêtre déclarée dans compliance/site.json trouvée sur aucune page
//   ai-content-label-missing          NC  contenu déclaré généré par IA sans étiquette visible
//   ai-content-label-not-accessible   NT  étiquette visible mais absente pour les technologies d'assistance
//   ai-content-label-late             NT  étiquette d'un texte placée après le début du texte
//   ai-content-review                 NT  traduction ou retouche par IA d'un texte d'intérêt public sans relecture déclarée
//   ai-content-not-found              NT  contenu déclaré introuvable
//   ai-editorial-responsibility       NT  exception éditoriale invoquée sans responsable publié (nom et contact)
//   order-button-label                NC/NT bouton de commande vague (NC) ou autre formulation (NT)
//   order-button-not-found            NT  aucun bouton de commande sur la dernière étape déclarée
//   order-start-information           NT  moyens de paiement ou restrictions de livraison non trouvés au début de la commande
//   withdrawal-function-missing       NC  aucune commande de rétractation sur une page
//   withdrawal-function-label         NT  commande de rétractation avec un autre libellé que celui de la loi
//   withdrawal-function-not-visible   NT  commande présente mais invisible sans action
//   withdrawal-statement-missing      NC  la commande ne mène à aucun formulaire de déclaration
//   withdrawal-statement-fields       NC  nom, identification du contrat ou adresse électronique manquant
//   withdrawal-statement-extra-fields NT  champ obligatoire en plus des trois prévus (motif...)
//   withdrawal-confirm-button         NC/NT bouton de confirmation absent ou vague (NC), autre libellé (NT)
//   price-reduction-prior-price       NT  réduction annoncée sans prix antérieur indiqué
//   pre-ticked-option                 NC  option payante ou consentement marketing coché d'avance
//   countdown-resets                  NC  compte à rebours qui repart au rechargement
//   scarcity-claim                    NT  message de rareté (« plus que 2 en stock »)
//   confirmshaming                    NT  refus formulé pour culpabiliser
//   legal-notice-link-missing         NC  pas de lien vers la page d'identification (NT sans compliance/site.json)
//   legal-notice-unreachable          NC  la page d'identification liée n'existe pas
//   legal-notice-content              NT  catégorie d'information absente de la page d'identification
//   legal-notice-placeholder          NT  texte entre crochets laissé sur la page d'identification
//   odr-platform-link                 NT  lien vers l'ancienne plateforme européenne de règlement en ligne des litiges
//   site-declaration-missing          NT  compliance/site.json absent : règles qui en dépendent non évaluées
//   site-declaration-page-missing     NT  page déclarée absente des pages contrôlées
//
// Déclaration du site : compliance/site.json à la racine du dossier servi (ou --site). Tous les
// champs sont facultatifs ; les champs inconnus sont ignorés.
//   {
//     "language": "fr",                                   langue du site (sinon lang de chaque page)
//     "operator": { "country": "FR", "registered": true, "vat": true },
//     "distance_selling_to_consumers": true,              vente à distance à des consommateurs
//     "online_platform": false,                           plateforme en ligne au sens du DSA
//     "pages": { "legal_notice": "mentions-legales.html", "order_start": "panier.html",
//                "order_final": "commande.html", "withdrawal": "retractation.html" },
//     "withdrawal_link_pages": ["..."],                   pages qui doivent porter la fonction (défaut : toutes)
//     "order_button": "#place-order",                     sélecteur du bouton de commande (sinon deviné)
//     "ai": {
//       "chat_widgets": ["#ai-chat"],                     fenêtres de discussion (d'autres sont repérées)
//       "content": [ { "page": "a.html", "selector": "#photo", "kind": "image|video|audio|text",
//                      "ai_use": "generated|modified|translated|edited", "public_interest": true,
//                      "editorial_review": false, "deep_fake": true } ],
//       "editorial_responsibility_page": "about.html"     page qui nomme le responsable éditorial
//     }
//   }
//
// Usage :
//   node scripts/check-content.mjs <dossier|fichier.html|URL> [options]
//     --out <fichier.json>       rapport JSON
//     --md <fichier.md>          rapport Markdown
//     --expected <fichier.json>  défauts attendus { id, page, rule, detail? } : taux de détection
//     --site <fichier.json>      déclaration du site (défaut : <dossier>/compliance/site.json)
//     --wait <ms>                attente après chargement (défaut 500)
//     --no-fail                  code de sortie 0 même en cas de non-conformité
//
// Toute requête vers un hôte tiers est interrompue. Le vérificateur ouvre les fenêtres de
// discussion et la déclaration de rétractation, mais n'envoie ni message, ni formulaire, ni commande.
//
// Codes de sortie : 0 aucune non-conformité, 1 non-conformité trouvée, 2 erreur d'usage.

import path from 'node:path';
import { launchBrowser, freshContext, routeThirdParty } from './lib/browser.mjs';
import {
  UsageError, parseArgs, resolvePages, loadExpected, scoreExpected, summarise, expectedMarkdown, mdCell, writeOutputs, run,
} from './lib/cli.mjs';
import {
  SITE_PATH, AI_TERM, LEGAL_NOTICE_LINK, loadSite, classifyActionLabel, classifyWithdrawalEntry, classifyPreTicked, isConfirmshaming,
  parseCountdown, missingNoticeCategories, labelRequirement, cite,
} from './lib/content-rules.mjs';
import { probe, PATTERNS } from './lib/content-page.mjs';

const LIMITS = [
  'The checker loads each page given in one fresh browser session; it does not crawl the site. It opens chat panels and the withdrawal statement, but never sends a chat message, a form or an order.',
  'Server-side behaviour is not seen: whether the order or the withdrawal statement is recorded, the time stamp, the order confirmation and the acknowledgement of withdrawal on a durable medium (emails), or whether the withdrawal function stays available for the whole withdrawal period.',
  'Prices over time are not known: the checker cannot tell whether the prior price shown is the lowest price of the last 30 days, or whether a deadline is real. It only reports a reduction without any prior price, and a countdown that starts again when the page is reloaded.',
  'Stock and demand are not known: scarcity messages are reported for review, never as true or false.',
  'AI-generated content is only checked where compliance/site.json declares it: the checker cannot tell from a file whether it was generated, and it cannot read watermarks, provenance metadata or other machine-readable marks (Article 50(2) is the provider\'s duty and is not checked).',
  'Whether a text informs the public on a matter of public interest, whether it was really reviewed by an editor, and whether an image is a deep fake are facts declared by the operator; the checker trusts the declaration.',
  'Short texts, alt text, captions, UI labels and source code are outside Article 50 marking (AI Act Guidelines point 68) and are not checked.',
  'The chatbot\'s answers are not tested: whether it says it is an AI when asked, whether the "obvious" exception could apply, and vendor widgets inside iframes are not inspected.',
  'Only the wordings written in the law, as given in the skill references, are accepted as order, withdrawal and confirmation labels (English and French). Any other wording is reported for review: whether it is equally unambiguous is for a professional to decide.',
  'Text patterns (countdown, scarcity, confirmshaming, payment and delivery information, legal notice categories) are in English and French only; other wordings are not recognised.',
  'The legal notice is checked for the presence of categories of information, not for their accuracy. Terms of sale, mediator details and pre-contractual information are not checked.',
  'Whether the site is an online platform under the DSA, sells at a distance to consumers, or which country\'s law applies is taken from compliance/site.json; the checker does not decide it.',
];

const NOT_WITHOUT_DECLARATION = 'order button, information at the start of the order, withdrawal function, AI content labels';
const PAYMENT_INFO = /(carte bancaire|cartes? de paiement|card|visa|mastercard|paypal|virement|bank transfer|moyens? de paiement|payment methods?|means of payment|modes? de paiement|paiement accepté|we accept|nous acceptons)/i;
const DELIVERY_INFO = /(livr\w*\s+(uniquement|seulement|en|vers|dans|à)|zones? de livraison|pays de livraison|restrictions? de livraison|ne livrons pas|deliver\w*\s+(only|to)|delivery (area|restrictions?|countries)|we do not deliver|we deliver)/i;
const EDITORIAL = /(editor|editorial|rédaction|rédacteur|rédactrice|directeur de la publication|directrice de la publication|responsab)/i;
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;
const PLACEHOLDER = /\[[^\]\n]{2,80}\]/;

function finding(rule, verdict, citeKey, site, extra) {
  return { detector: 'content', rule, verdict, severity: verdict === 'NC' ? 'major' : 'minor', ...cite(citeKey, site), ...extra };
}

async function settle(page, wait) {
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(wait);
}

async function openPage(browser, url, wait) {
  const context = await freshContext(browser);
  const errors = [];
  let page = null;
  await routeThirdParty(context, { pageUrl: url, getPage: () => page, onThirdParty: () => {} });
  page = await context.newPage();
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(url, { waitUntil: 'load' });
  await settle(page, wait);
  return { context, page, errors };
}

const ask = (page, task, extra = {}) => page.evaluate(probe, { task, patterns: PATTERNS, ...extra });

// ---- Relevé d'une page ---------------------------------------------------------------------

async function collect(browser, p, ctx) {
  const { context, page, errors } = await openPage(browser, p.url, ctx.wait);
  try {
    const site = ctx.site;
    const data = await ask(page, 'page', { orderButton: site && site.pages.order_final === p.page ? site.order_button : null });
    const scan = await ask(page, 'chats', { declared: site ? site.ai.chat_widgets : [] });
    const chats = [];
    for (const chat of scan.chats) {
      let opened = !chat.hidden;
      if (chat.hidden && chat.launcher) {
        opened = await page.locator(chat.launcher).first().click({ timeout: 3000 }).then(() => true, () => false);
        await page.waitForTimeout(400);
      }
      const inspected = await ask(page, 'chat', { selector: chat.selector });
      if (inspected) chats.push({ ...chat, opened, ...inspected });
    }
    const items = site ? site.ai.content.filter((item) => item.page === p.page) : [];
    const content = items.length ? await ask(page, 'content', { items }) : [];
    const timers = [];
    const first = await ask(page, 'timers');
    if (first.length) {
      await page.waitForTimeout(2000);
      const later = await ask(page, 'timers');
      await page.reload({ waitUntil: 'load' });
      await settle(page, ctx.wait);
      const reloaded = await ask(page, 'timers');
      const by = (list, selector) => list.find((t) => t.selector === selector) || null;
      for (const t of first) {
        const s0 = parseCountdown(t.text);
        const t1 = by(later, t.selector);
        const t2 = by(reloaded, t.selector);
        const s1 = t1 ? parseCountdown(t1.text) : null;
        const s2 = t2 ? parseCountdown(t2.text) : null;
        const ticking = s0 !== null && s1 !== null && s1 < s0;
        timers.push({ selector: t.selector, before: t.text, after_2s: t1 && t1.text, after_reload: t2 && t2.text, ticking,
          resets: ticking && s2 !== null && s2 > s1 + 1 });
      }
    }
    return { data, chats, missing_chats: scan.missing, content, items, timers, errors };
  } finally {
    await context.close();
  }
}

// ---- Constats ------------------------------------------------------------------------------

function pagePathOf(url, ctx) {
  try {
    const u = new URL(url);
    if (!ctx.origin || u.origin !== ctx.origin) return null;
    let p = decodeURIComponent(u.pathname).replace(/^\/+/, '');
    if (!p || p.endsWith('/')) p += 'index.html';
    return p;
  } catch {
    return null;
  }
}

function chatFindings(chat, ctx) {
  const site = ctx.site;
  const out = [];
  const where = { selector: chat.selector };
  if (chat.hidden && !chat.opened) {
    return [finding('ai-chat-not-opened', 'NT', 'chat', site, { ...where,
      message: `Chat widget found but hidden, and it could not be opened${chat.launcher ? ` with "${chat.launcher_name}"` : ' (no launcher found)'}: open it by hand and check that it says the visitor is talking to an AI.` })];
  }
  if (!chat.ai_visible) {
    const linkedMention = chat.linked.map((url) => pagePathOf(url, ctx)).find((p) => p && ctx.aiMention.get(p));
    if (chat.ambiguous) {
      out.push(finding('ai-chat-ambiguous-label', 'NT', 'chat', site, { ...where, detail: chat.ambiguous,
        message: `The chat widget presents itself as "${chat.ambiguous}" but no visible text in it says that the visitor is talking to an AI. An ambiguous label such as "assistant" is not enough on its own (AI Act Guidelines point 38); add a notice with the words "AI" / "IA" before the first message.` }));
    }
    if (chat.ai_outside_excerpt || linkedMention) {
      out.push(finding('ai-chat-disclosure-outside-widget', 'NT', 'chat', site, { ...where,
        detail: chat.ai_outside_excerpt || linkedMention,
        message: `AI is mentioned ${chat.ai_outside_excerpt ? `elsewhere on the page ("${chat.ai_outside_excerpt}")` : `on a linked page (${linkedMention})`}, but not in the chat widget itself. A notice only in the footer, the terms or a separate page is not sufficient (AI Act Guidelines point 38): put it in the widget, before or at the first message.` }));
    }
    if (!chat.ambiguous && !chat.ai_outside_excerpt && !linkedMention) {
      out.push(finding('ai-chat-no-disclosure', 'NC', 'chat', site, { ...where,
        message: `No visible text in the chat widget says that the visitor is talking to an AI system${chat.ai_in_attributes_only ? ' (the words appear only in hidden text or attributes, which sighted visitors do not perceive)' : ''}. Show a notice in the widget before or at the first interaction, for example "You are chatting with an AI assistant, not a person."` }));
    }
  }
  const unlabeled = chat.messages.filter((m) => !AI_TERM.test(m));
  if (chat.messages.length && unlabeled.length) {
    out.push(finding('ai-chat-messages-not-identified', 'NT', 'chat-messages', site, { ...where, detail: unlabeled[0].slice(0, 80),
      message: `A message of the assistant does not say that it comes from an AI for assistive technologies ("${unlabeled[0].slice(0, 80)}"). Start each answer with a text speaker label such as "AI assistant:".` }));
  } else if (!chat.messages.length && !(chat.assistant_label_attribute && AI_TERM.test(chat.assistant_label_attribute))) {
    out.push(finding('ai-chat-messages-not-identified', 'NT', 'chat-messages', site, { ...where,
      detail: chat.assistant_label_attribute || '',
      message: chat.assistant_label_attribute
        ? `The speaker label of the assistant's messages is "${chat.assistant_label_attribute}", without the word AI: screen reader users hear it before every answer.`
        : 'No assistant message could be observed without sending one: check that every answer is announced as coming from an AI.' }));
  }
  return out;
}

function contentFindings(r, ctx) {
  const site = ctx.site;
  const out = [];
  r.items.forEach((item, i) => {
    const seen = r.content[i];
    const need = labelRequirement(item);
    if (!seen || !seen.found) {
      out.push(finding('ai-content-not-found', 'NT', 'label', site, { selector: item.selector, detail: item.selector,
        message: `Content declared in ${SITE_PATH} (${item.kind}, ${item.selector}) was not found on the page: update the declaration or check the page.` }));
      return;
    }
    if (need.need === 'none') return;
    if (need.need === 'review') {
      if (!seen.visible_label) {
        out.push(finding('ai-content-review', 'NT', 'editorial', site, { selector: item.selector, detail: item.selector,
          message: `${need.reason} (${item.selector}). The Guidelines list unreviewed AI translation of public-interest text among the texts that need human review to escape the label (point 138): have it reviewed under an editorial responsibility, or label it.` }));
      }
      return;
    }
    if (!seen.visible_label) {
      const where = seen.alt_only ? ' The words appear only in the alt text, which sighted visitors do not see.'
        : seen.title_only ? ' The words appear only in a tooltip (title), which needs hovering and is not shown on touch screens.' : '';
      out.push(finding('ai-content-label-missing', 'NC', 'label', site, { selector: item.selector, detail: item.selector,
        message: `Declared ${need.reason} (${item.selector}) has no visible label saying it was generated or modified by AI at first exposure.${where} Use templates/ai/ai-content-label.html.` }));
      return;
    }
    if (!seen.accessible_label) {
      out.push(finding('ai-content-label-not-accessible', 'NT', 'label-accessible', site, { selector: item.selector, detail: item.selector,
        message: `The AI label of ${item.selector} ("${seen.visible_label}") is visible but hidden from assistive technologies (aria-hidden, or only in pixels): add the same words as real text, for example in the caption.` }));
    }
    if (seen.late) {
      out.push(finding('ai-content-label-late', 'NT', 'label-placement', site, { selector: item.selector, detail: item.selector,
        message: `The AI label of ${item.selector} comes after the start of the text: readers meet the text before the disclosure. Place it under the headline or at the start of the AI-written part.` }));
    }
  });
  return out;
}

function orderButtonFindings(r, ctx) {
  const site = ctx.site;
  const { data } = r;
  let button = data.order_button;
  if (!button) {
    const visibleSubmits = data.submits.filter((s) => s.visible && s.in_main);
    button = visibleSubmits[visibleSubmits.length - 1] || null;
  }
  if (!button) {
    return [finding('order-button-not-found', 'NT', 'order-button', site, { selector: 'main',
      message: 'This page is declared as the final order step, but no button that submits a form was found: check the button that places the order by hand.' })];
  }
  const name = button.name;
  const shown = button.visible_text || name;
  const classes = [classifyActionLabel(name, 'order'), classifyActionLabel(shown, 'order')];
  if (classes.every((c) => c === 'legal')) return [];
  const vague = classes.some((c) => c === 'vague' || c === 'missing');
  return [finding('order-button-label', vague ? 'NC' : 'NT', 'order-button', site, { selector: button.selector, detail: name,
    message: vague
      ? `The button that places the order reads "${shown}"${name !== shown ? ` (accessible name "${name}")` : ''}: it does not say that ordering entails an obligation to pay. Label it "Order with obligation to pay" / "Commande avec obligation de paiement"; otherwise the consumer is not bound by the order.`
      : `The button that places the order reads "${shown}"${name !== shown ? ` (accessible name "${name}")` : ''}, not the wording of the law ("Order with obligation to pay" / "Commande avec obligation de paiement"). Whether it is an equally unambiguous formulation is for a professional to confirm.` })];
}

function withdrawalLinkFindings(r, p, ctx) {
  const site = ctx.site;
  if (!site || site.distance_selling_to_consumers !== true) return [];
  if (site.withdrawal_link_pages && !site.withdrawal_link_pages.includes(p.page)) return [];
  const entries = r.data.links.filter((l) => !l.in_dialog && !l.in_chat).map((l) => ({ ...l, cls: classifyWithdrawalEntry(l.name) })).filter((l) => l.cls);
  const legal = entries.filter((l) => l.cls === 'legal');
  if (legal.length) {
    if (legal.some((l) => l.visible)) return [];
    return [finding('withdrawal-function-not-visible', 'NT', 'withdrawal', site, { selector: legal[0].selector, detail: legal[0].name,
      message: `"${legal[0].name}" is in the page but not visible without an action (menu, hover, hidden block): the function must be prominently displayed and easily accessible.` })];
  }
  if (entries.length) {
    return [finding('withdrawal-function-label', 'NT', 'withdrawal', site, { selector: entries[0].selector, detail: entries[0].name,
      message: `The withdrawal entry reads "${entries[0].name}", not the wording of the law ("Withdraw from contract here" / "Renoncer au contrat ici"). Whether it is equally unambiguous is for a professional to confirm.` })];
  }
  return [finding('withdrawal-function-missing', 'NC', 'withdrawal', site, { selector: 'body',
    message: 'No control labelled "Withdraw from contract here" / "Renoncer au contrat ici" on this page. The site declares distance selling to consumers: the withdrawal function must be continuously available and prominently displayed, typically as a footer link on every page.' })];
}

function legalLinkFindings(r, p, ctx) {
  if (ctx.legalPage && p.page === ctx.legalPage) return [];
  const found = r.data.links.some((l) => l.tag === 'a' && ((ctx.legalPage && pagePathOf(l.href, ctx) === ctx.legalPage) || LEGAL_NOTICE_LINK.test(l.name)));
  if (found) return [];
  return [finding('legal-notice-link-missing', ctx.site ? 'NC' : 'NT', 'legal-notice', ctx.site, { selector: 'body',
    message: `No link to the legal notice / imprint from this page${ctx.site ? '' : ' (without compliance/site.json the checker cannot tell whether the site is a business, so this is for review)'}. Identification must be easily, directly and permanently accessible: put a "Legal notice" / "Mentions légales" link in the footer of every page.` })];
}

function pageFindings(p, r, ctx) {
  const site = ctx.site;
  const { data } = r;
  const out = [];
  out.push(...legalLinkFindings(r, p, ctx));
  out.push(...withdrawalLinkFindings(r, p, ctx));
  for (const chat of r.chats) out.push(...chatFindings(chat, ctx));
  out.push(...contentFindings(r, ctx));
  if (site && site.pages.order_final === p.page) out.push(...orderButtonFindings(r, ctx));
  if (site && site.pages.order_start === p.page) {
    const missing = [!PAYMENT_INFO.test(data.main_text) && 'accepted means of payment', !DELIVERY_INFO.test(data.main_text) && 'delivery restrictions'].filter(Boolean);
    if (missing.length) {
      out.push(finding('order-start-information', 'NT', 'order-start', site, { selector: 'main', detail: missing.join(', '),
        message: `This page is declared as the start of the ordering process, but no text about ${missing.join(' or ')} was recognised. State them clearly at the latest at the beginning of the ordering process (heuristic: check by hand).` }));
    }
  }
  for (const red of data.reductions.filter((x) => !x.has_prior)) {
    out.push(finding('price-reduction-prior-price', 'NT', 'price', site, { selector: red.selector, detail: red.text.slice(0, 80),
      message: `A price reduction is announced ("${red.text.slice(0, 100)}") without a prior price. Any announcement of a reduction indicates the prior price, the lowest price applied during at least the 30 days before; the checker cannot know that price, check it against the price history.` }));
  }
  for (const box of data.checkboxes.filter((b) => b.checked)) {
    const kind = classifyPreTicked(box.label);
    if (!kind) continue;
    out.push(finding('pre-ticked-option', 'NC', kind === 'paid' ? 'pre-ticked-paid' : 'pre-ticked-marketing', site, { selector: box.selector, detail: box.label.slice(0, 80),
      message: kind === 'paid'
        ? `A paid option is ticked by default ("${box.label.slice(0, 100)}"). Extra payments need the consumer's express consent; consent inferred from a default option gives a right to reimbursement.`
        : `A marketing or newsletter consent is ticked by default ("${box.label.slice(0, 100)}"). Consent cannot be inferred from a pre-ticked box; leave it unticked.` }));
  }
  for (const t of r.timers.filter((x) => x.resets)) {
    out.push(finding('countdown-resets', 'NC', 'urgency', site, { selector: t.selector, detail: t.before,
      message: `A countdown starts again when the page is reloaded (${t.before}, then ${t.after_2s} two seconds later, then ${t.after_reload} after a reload): the time limit is not real. A false claim that an offer is available for a very limited time is unfair in all circumstances.` }));
  }
  for (const s of data.scarcity) {
    out.push(finding('scarcity-claim', 'NT', 'urgency', site, { selector: s.selector, detail: s.text.slice(0, 80),
      message: `Scarcity or popularity message "${s.text.slice(0, 100)}": it must come from real stock or demand data at render time. The checker cannot verify it.` }));
  }
  const seenShaming = new Set();
  for (const l of data.links.filter((x) => !x.in_dialog && isConfirmshaming(x.name))) {
    if (seenShaming.has(l.name)) continue;
    seenShaming.add(l.name);
    out.push(finding('confirmshaming', 'NT', 'confirmshaming', site, { selector: l.selector, detail: l.name.slice(0, 80),
      message: `The option to decline reads "${l.name}": wording that makes the visitor feel guilty for declining may be an aggressive practice. Use a neutral wording such as "No thanks".` }));
  }
  for (const o of data.odr) {
    out.push(finding('odr-platform-link', 'NT', 'odr', site, { selector: o.selector, detail: o.href,
      message: `Link to the former European online dispute resolution platform (${o.href}). The platform no longer exists: Regulation (EU) No 524/2013 is repealed with effect from 20 July 2025, so the link is obsolete and is not a required mention. In France the required information is the contact details of the competent consumer mediator, which is something else.` }));
  }
  return out;
}

// ---- Contrôles à l'échelle du site ----------------------------------------------------------

async function withdrawalFlow(browser, ctx, results) {
  const site = ctx.site;
  let targetUrl = null;
  if (site.pages.withdrawal) {
    const page = results.find((r) => r.page === site.pages.withdrawal);
    targetUrl = page ? page.url : (ctx.origin ? `${ctx.origin}/${site.pages.withdrawal}` : null);
  }
  if (!targetUrl) {
    for (const r of results) {
      const link = r.raw.data.links.find((l) => l.href && classifyWithdrawalEntry(l.name) === 'legal');
      if (link) { targetUrl = link.href; break; }
    }
  }
  if (!targetUrl) return { page: null, findings: [] };
  const targetPage = pagePathOf(targetUrl, ctx);
  const { context, page } = await openPage(browser, targetUrl, ctx.wait);
  const out = [];
  try {
    let forms = await ask(page, 'withdrawal-form');
    if (!forms.length) {
      const entry = await ask(page, 'withdrawal-entry');
      if (entry) {
        await page.locator(entry).first().click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(400);
        forms = await ask(page, 'withdrawal-form');
      }
    }
    const scored = forms.map((f) => {
      const fields = { name: null, contract: null, email: null };
      for (const field of f.fields) {
        const text = `${field.label} ${field.name}`;
        if (!fields.email && (field.type === 'email' || field.autocomplete === 'email' || /(e-?mail|courriel|adresse électronique)/i.test(text))) fields.email = field;
        else if (!fields.name && (/^(name|given-name|family-name)$/.test(field.autocomplete) || /\b(nom|name|prénom)\b/i.test(text))) fields.name = field;
        else if (!fields.contract && /(commande|order|contrat|contract|référence|reference|numéro|number)/i.test(text)) fields.contract = field;
      }
      return { ...f, matched: fields, score: Object.values(fields).filter(Boolean).length };
    }).sort((a, b) => b.score - a.score);
    const form = scored[0];
    if (!form || form.score === 0) {
      out.push(finding('withdrawal-statement-missing', 'NC', 'withdrawal', site, { selector: 'main',
        message: `Following the withdrawal function (${targetPage || targetUrl}) leads to no online withdrawal statement form with the consumer's name, the contract identification and the email address for the confirmation.` }));
      return { page: targetPage, findings: out };
    }
    const missing = Object.entries({ name: 'name', contract: 'contract identification (order number)', email: 'email address for the confirmation' })
      .filter(([key]) => !form.matched[key]).map(([, text]) => text);
    if (missing.length) {
      out.push(finding('withdrawal-statement-fields', 'NC', 'withdrawal', site, { selector: form.selector, detail: missing.join(', '),
        message: `The withdrawal statement does not let the consumer provide or confirm: ${missing.join(', ')}.` }));
    }
    const known = new Set(Object.values(form.matched).filter(Boolean).map((f) => f.selector));
    const extra = form.fields.filter((f) => f.required && !known.has(f.selector));
    if (extra.length) {
      out.push(finding('withdrawal-statement-extra-fields', 'NT', 'withdrawal-reason', site, { selector: extra[0].selector, detail: extra.map((f) => f.label || f.name).join(', '),
        message: `The withdrawal statement requires more than name, contract and email (${extra.map((f) => `"${f.label || f.name}"`).join(', ')}). The consumer withdraws without giving any reason: make extra fields optional or remove them.` }));
    }
    const button = form.buttons.filter((b) => b.visible).pop() || form.buttons.pop();
    const cls = button ? classifyActionLabel(button.name, 'confirm') : 'missing';
    if (cls !== 'legal') {
      const nc = cls === 'vague' || cls === 'missing';
      out.push(finding('withdrawal-confirm-button', nc ? 'NC' : 'NT', 'withdrawal', site, { selector: button ? button.selector : form.selector, detail: button ? button.name : '',
        message: !button ? 'The withdrawal statement has no confirmation button.'
          : nc ? `The button that sends the withdrawal statement reads "${button.name}". The confirmation function is labelled "Confirm withdrawal" / "Confirmer la rétractation" or an unambiguous corresponding formulation.`
            : `The button that sends the withdrawal statement reads "${button.name}", not the wording of the law ("Confirm withdrawal" / "Confirmer la rétractation"). Whether it is equally unambiguous is for a professional to confirm.` }));
    }
    return { page: targetPage, findings: out };
  } finally {
    await context.close();
  }
}

async function siteFindings(browser, ctx, results) {
  const site = ctx.site;
  const first = (results.find((r) => r.page === 'index.html') || results[0]).page;
  const add = [];
  const push = (page, f) => add.push({ page: results.some((r) => r.page === page) ? page : first, finding: f });
  if (!site) {
    push(first, { detector: 'content', rule: 'site-declaration-missing', verdict: 'NT', severity: 'minor', source: '[best practice]', refs: [], selector: null,
      message: `${SITE_PATH} not found: cannot tell what the site is. Not evaluated: ${NOT_WITHOUT_DECLARATION}. Legal notice links are reported for review only. Add the declaration (schema in the header of scripts/check-content.mjs).` });
  } else {
    const declared = Object.entries(site.pages).filter(([, page]) => !results.some((r) => r.page === page));
    for (const [key, page] of declared) {
      push(first, { detector: 'content', rule: 'site-declaration-page-missing', verdict: 'NT', severity: 'minor', source: '[best practice]', refs: [], selector: null, detail: page,
        message: `pages.${key} in ${SITE_PATH} names ${page}, which is not among the pages checked: the rules for that page were not evaluated.` });
    }
    const allChats = results.flatMap((r) => r.raw.missing_chats);
    for (const selector of site.ai.chat_widgets.filter((s) => allChats.filter((x) => x === s).length === results.length)) {
      push(first, finding('ai-chat-not-found', 'NT', 'chat', site, { selector, detail: selector, message: `Chat widget ${selector} declared in ${SITE_PATH} was found on no page checked.` }));
    }
    for (const item of site.ai.content.filter((i) => !results.some((r) => r.page === i.page))) {
      push(first, finding('ai-content-not-found', 'NT', 'label', site, { selector: item.selector, detail: item.page,
        message: `Content declared on ${item.page} in ${SITE_PATH} was not checked: that page is not among the pages given.` }));
    }
    if (site.ai.content.some((i) => i.kind === 'text' && i.editorial_review && i.public_interest !== false)) {
      const page = site.ai.editorial_responsibility_page;
      const r = page && results.find((x) => x.page === page);
      const text = r ? r.raw.data.main_text : '';
      if (!r || !EDITORIAL.test(text) || !EMAIL.test(text)) {
        push(page || first, finding('ai-editorial-responsibility', 'NT', 'editorial', site, { selector: r ? 'main' : null, detail: page || 'not declared',
          message: !page ? `Texts rely on the editorial exception, but ${SITE_PATH} names no page that publishes who holds editorial responsibility (ai.editorial_responsibility_page).`
            : !r ? `${page}, declared as publishing the editorial responsibility, was not checked.`
              : `${page} should publish the identity and contact details of whoever holds editorial responsibility for the AI-assisted texts; ${EDITORIAL.test(text) ? 'no email address was found' : 'no mention of an editor or editorial responsibility was found'}.` }));
      }
    }
    if (site.distance_selling_to_consumers === true) {
      const flow = await withdrawalFlow(browser, ctx, results);
      for (const f of flow.findings) push(flow.page || first, f);
    }
  }
  if (ctx.legalPage) {
    const r = results.find((x) => x.page === ctx.legalPage);
    if (r) {
      for (const c of missingNoticeCategories(r.raw.data.main_text, site)) {
        push(r.page, finding('legal-notice-content', 'NT', 'legal-notice-content', site, { selector: 'main', detail: c.key,
          message: `The legal notice does not seem to give the ${c.text}${site && site.operator.country ? ` (required for an operator established in ${site.operator.country})` : ''}. The checker only looks for the category, not for correct values: check the page.` }));
      }
      const placeholder = r.raw.data.main_text.match(PLACEHOLDER);
      if (placeholder) {
        push(r.page, finding('legal-notice-placeholder', 'NT', 'legal-notice-content', site, { selector: 'main', detail: placeholder[0],
          message: `The legal notice still contains a placeholder ("${placeholder[0]}"): the value must come from the operator.` }));
      }
    } else if (ctx.origin) {
      const status = await fetch(`${ctx.origin}/${ctx.legalPage.split('/').map(encodeURIComponent).join('/')}`).then((res) => res.status, () => 0);
      push(first, status >= 200 && status < 400
        ? { detector: 'content', rule: 'site-declaration-page-missing', verdict: 'NT', severity: 'minor', source: '[best practice]', refs: [], selector: null, detail: ctx.legalPage,
          message: `The legal notice (${ctx.legalPage}) exists but was not among the pages checked: its content was not reviewed.` }
        : finding('legal-notice-unreachable', 'NC', 'legal-notice', site, { selector: null, detail: ctx.legalPage,
          message: `The legal notice linked from the pages (${ctx.legalPage}) could not be loaded (HTTP ${status || 'error'}).` }));
    }
  }
  for (const { page, finding: f } of add) results.find((r) => r.page === page).findings.push(f);
}

// ---- Rapport -------------------------------------------------------------------------------

function toMarkdown(report) {
  const lines = ['# Automated content check: AI transparency and consumer law', '',
    '> Produced by an automated tool with the help of an AI. It is not an audit and not legal advice. Absence of findings does not establish compliance; see "Limits" below.', '',
    `- Target: \`${report.target}\``, `- Date: ${report.date}`, `- Site declaration: ${report.site_declaration || 'none'}`,
    `- Non-conformities: ${report.summary.non_conformities}`, `- To review: ${report.summary.to_review}`, '',
    ...expectedMarkdown(report.expected)];
  for (const page of report.pages) {
    lines.push(`## ${page.page}`, '');
    if (page.chats.length) {
      lines.push(`Chat widgets: ${page.chats.map((c) => `${c.selector} (${c.ai_visible ? 'AI notice visible' : 'no visible AI notice'})`).join('; ')}.`, '');
    }
    if (!page.findings.length) {
      lines.push('No finding.', '');
      continue;
    }
    lines.push('| Verdict | Severity | Rule | Where | Problem | Source |', '|---------|----------|------|-------|---------|--------|');
    for (const f of page.findings) lines.push(`| ${f.verdict} | ${f.severity} | ${f.rule} | ${mdCell(f.selector)} | ${mdCell(f.message)} | ${mdCell(f.source)} |`);
    lines.push('');
  }
  lines.push('## Limits', '', ...report.limits.map((l) => `- ${l}`), '');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { values: ['--out', '--md', '--expected', '--site', '--wait'], flags: [] });
  const wait = args.wait === undefined ? 500 : Number.parseInt(args.wait, 10);
  if (!Number.isInteger(wait) || wait < 0) throw new UsageError('--wait : entier positif ou nul attendu (millisecondes)');
  const target = args.targets[0];
  const expectedList = await loadExpected(args.expected);
  const { pages, root, server } = await resolvePages(target);
  const results = [];
  let browserName = null;
  let declarationFile = null;
  try {
    const siteFile = args.site || (root ? path.join(root, SITE_PATH) : null);
    const declaration = await loadSite(siteFile);
    if (args.site && !declaration.file) throw new UsageError(`--site : introuvable : ${args.site}`);
    declarationFile = declaration.file;
    const ctx = { site: declaration.site, wait, origin: server ? server.origin : new URL(pages[0].url).origin, aiMention: new Map() };
    const launched = await launchBrowser();
    browserName = launched.browserName;
    try {
      for (const p of pages) results.push({ page: p.page, url: p.url, raw: await collect(launched.browser, p, ctx) });
      for (const r of results) ctx.aiMention.set(r.page, AI_TERM.test(r.raw.data.body_text));
      const counts = new Map();
      for (const r of results) {
        for (const l of r.raw.data.links.filter((x) => x.tag === 'a' && LEGAL_NOTICE_LINK.test(x.name))) {
          const target = pagePathOf(l.href, ctx);
          if (target) counts.set(target, (counts.get(target) || 0) + 1);
        }
      }
      ctx.legalPage = (ctx.site && ctx.site.pages.legal_notice) || [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p)[0] || null;
      for (const r of results) r.findings = pageFindings(r, r.raw, ctx);
      await siteFindings(launched.browser, ctx, results);
    } finally {
      await launched.browser.close();
    }
  } finally {
    if (server) await server.close();
  }
  const pagesOut = results.map((r) => ({ page: r.page, url: r.url, lang: r.raw.data.lang, findings: r.findings,
    chats: r.raw.chats.map((c) => ({ selector: c.selector, declared: c.declared, opened: c.opened, ai_visible: c.ai_visible, messages: c.messages })),
    ai_content: r.raw.content, timers: r.raw.timers, script_errors: r.raw.errors }));
  const allFindings = pagesOut.flatMap((r) => r.findings);
  const report = {
    tool: 'eu-web-compliance check-content',
    disclaimer: 'Automated check produced with the help of an AI. Not an audit, not legal advice. Absence of findings does not establish compliance.',
    target, date: new Date().toISOString(), browser: browserName, network: 'third-party requests aborted',
    site_declaration: declarationFile ? path.relative(process.cwd(), declarationFile).split(path.sep).join('/') : null,
    summary: summarise(allFindings), pages: pagesOut, limits: LIMITS,
  };
  if (expectedList) report.expected = scoreExpected(expectedList, pagesOut);
  await writeOutputs(args, report, toMarkdown(report));
  const s = report.summary;
  process.stdout.write(`${pages.length} page(s), ${s.non_conformities} non-conformité(s), ${s.to_review} point(s) à revoir\n`);
  if (report.expected) process.stdout.write(`défauts attendus détectés : ${report.expected.detected}/${report.expected.total}\n`);
  return args.fail && s.non_conformities > 0 ? 1 : 0;
}

run(main);
