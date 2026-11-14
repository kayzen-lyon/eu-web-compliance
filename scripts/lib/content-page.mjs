// Relevés faits dans la page par scripts/check-content.mjs. `probe` est sérialisée et exécutée
// dans le navigateur par page.evaluate : elle ne doit dépendre d'aucune variable extérieure.
// Les motifs viennent de scripts/lib/content-rules.mjs et sont passés en argument.
//
// Tâches :
//   page             liens et commandes, boutons d'envoi, cases cochées, réductions de prix,
//                    textes de rareté et de compte à rebours, liens vers l'ancienne plateforme RLL,
//                    texte visible de la page
//   chats            fenêtres de discussion déclarées ou repérées, et leur bouton d'ouverture
//   chat             contenu d'une fenêtre de discussion ouverte (annonce IA, messages)
//   timers           valeurs des comptes à rebours
//   content          étiquettes des contenus générés par IA déclarés pour la page
//   withdrawal-form  formulaire de déclaration de rétractation
//   withdrawal-entry commande qui ouvre la déclaration sur la page de rétractation

import {
  AI_TERM, AI_GENERATED, AMBIGUOUS_CHAT, ODR_HREF, PRIOR_PRICE, PRICE, REDUCTION, SCARCITY, URGENCY, CLOCK,
} from './content-rules.mjs';

const toPattern = (re) => [re.source, re.flags];

export const PATTERNS = {
  ai: toPattern(AI_TERM), generated: toPattern(AI_GENERATED), ambiguous: toPattern(AMBIGUOUS_CHAT), odr: toPattern(ODR_HREF),
  prior: toPattern(PRIOR_PRICE), price: toPattern(PRICE), reduction: toPattern(REDUCTION), scarcity: toPattern(SCARCITY),
  urgency: toPattern(URGENCY), clock: toPattern(CLOCK),
};

export function probe(arg) {
  const re = {};
  for (const [key, [source, flags]] of Object.entries(arg.patterns)) re[key] = new RegExp(source, flags);
  const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

  const cssPath = (node) => {
    const parts = [];
    for (let c = node; c && c.nodeType === 1; c = c.parentElement) {
      if (c === document.documentElement) { parts.unshift('html'); break; }
      if (c.id && document.querySelectorAll(`#${CSS.escape(c.id)}`).length === 1) { parts.unshift(`#${CSS.escape(c.id)}`); break; }
      parts.unshift(`${c.tagName.toLowerCase()}:nth-child(${Array.from(c.parentElement.children).indexOf(c) + 1})`);
    }
    return parts.join(' > ');
  };
  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false;
    return typeof el.checkVisibility === 'function' ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true;
  };
  // Texte vu à l'écran : nœuds texte dont le parent a une taille et n'est pas masqué
  // (le texte « visually-hidden », 1 px sur 1 px, n'en fait pas partie).
  const visibleText = (root, skip) => {
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.nodeValue.trim() || (skip && skip.some((s) => s.contains(n)))) continue;
      const parent = n.parentElement;
      if (!parent || parent.closest('script, style, template, noscript')) continue;
      if (visible(parent)) out.push(n.nodeValue);
    }
    return clean(out.join(' '));
  };
  // Texte perçu par les technologies d'assistance : sans les sous-arbres aria-hidden ou masqués,
  // avec les alternatives des images et les aria-label.
  const accessibleText = (root) => {
    const out = [];
    const walk = (node) => {
      if (node.nodeType === 3) { out.push(node.nodeValue); return; }
      if (node.nodeType !== 1) return;
      const el = node;
      if (el.matches('script, style, template, noscript') || el.getAttribute('aria-hidden') === 'true') return;
      if (typeof el.checkVisibility === 'function' && !el.checkVisibility({ checkVisibilityCSS: true })) return;
      if (el.hasAttribute('aria-label')) { out.push(el.getAttribute('aria-label')); return; }
      if (el.tagName === 'IMG') { out.push(el.getAttribute('alt') || ''); return; }
      el.childNodes.forEach(walk);
    };
    walk(root);
    return clean(out.join(' '));
  };
  const accName = (el) => {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const byRef = clean(ids.map((id) => (document.getElementById(id) || {}).textContent || '').join(' '));
    if (byRef) return byRef;
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'));
    if (el.tagName === 'INPUT') return clean(el.value || el.getAttribute('alt') || '');
    return accessibleText(el) || clean(el.title);
  };
  // Nom lu dans le DOM, que l'élément soit affiché ou non (étape de commande masquée au
  // chargement, par exemple quand le panier est vide) : aria-labelledby, aria-label, value d'un
  // input, sinon le contenu sans les sous-arbres aria-hidden, sinon title.
  const domText = (root) => {
    const out = [];
    const walk = (node) => {
      if (node.nodeType === 3) { out.push(node.nodeValue); return; }
      if (node.nodeType !== 1) return;
      const el = node;
      if (el.matches('script, style, template, noscript') || el.getAttribute('aria-hidden') === 'true') return;
      if (el.hasAttribute('aria-label')) { out.push(el.getAttribute('aria-label')); return; }
      if (el.tagName === 'IMG') { out.push(el.getAttribute('alt') || ''); return; }
      el.childNodes.forEach(walk);
    };
    walk(root);
    return clean(out.join(' '));
  };
  const domName = (el) => {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const byRef = clean(ids.map((id) => (document.getElementById(id) || {}).textContent || '').join(' '));
    if (byRef) return byRef;
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'));
    if (el.tagName === 'INPUT') return clean(el.value || el.getAttribute('alt') || '');
    return domText(el) || clean(el.title);
  };
  const labelOf = (input) => {
    const parts = [];
    if (input.labels) input.labels.forEach((l) => parts.push(l.textContent));
    if (!parts.length && input.getAttribute('aria-label')) parts.push(input.getAttribute('aria-label'));
    (input.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).forEach((id) => parts.push((document.getElementById(id) || {}).textContent || ''));
    if (!parts.length && input.closest('label')) parts.push(input.closest('label').textContent);
    return clean(parts.join(' '));
  };
  const CHAT_SCOPE = '[data-ai-chat], .ai-chat, [data-chat-widget]';
  // Bouton qui envoie un formulaire (hors method="dialog") : jamais cliqué par le vérificateur.
  const submitsForm = (el) => Boolean(el.form) && (el.type || '').toLowerCase() === 'submit'
    && (el.form.getAttribute('method') || '').toLowerCase() !== 'dialog';

  if (arg.task === 'page') {
    const links = [];
    for (const el of document.querySelectorAll('a[href], button, [role="link"], [role="button"], input[type="submit"], input[type="button"]')) {
      if (links.length >= 600) break;
      links.push({ selector: cssPath(el), tag: el.tagName.toLowerCase(), name: accName(el), href: el.href || null,
        visible: visible(el), in_chat: Boolean(el.closest(CHAT_SCOPE)), in_dialog: Boolean(el.closest('dialog')),
        controls: el.getAttribute('aria-controls'), withdraw_open: el.hasAttribute('data-wd-open') });
    }
    const submits = [];
    for (const el of document.querySelectorAll('button, input[type="submit"], input[type="image"]')) {
      const type = (el.getAttribute('type') || 'submit').toLowerCase();
      if (type !== 'submit' && type !== 'image') continue;
      const form = el.form;
      if (!form || (form.getAttribute('method') || '').toLowerCase() === 'dialog' || el.closest('dialog') || el.closest(CHAT_SCOPE)
        || form.closest('[role="search"]') || form.getAttribute('role') === 'search') continue;
      submits.push({ selector: cssPath(el), name: accName(el), dom_name: domName(el), visible_text: visibleText(el), visible: visible(el),
        form: cssPath(form), in_main: Boolean(el.closest('main')) });
    }
    // Libellé propre de la case, sinon le texte de son parent immédiat (own_label: false) : jamais
    // le texte d'un bloc plus large, qui peut contenir un prix sans rapport avec la case.
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')).filter((el) => !el.closest('dialog'))
      .map((el) => {
        const own = labelOf(el);
        return { selector: cssPath(el), checked: el.checked, label: own || clean(el.parentElement ? el.parentElement.textContent : ''),
          own_label: Boolean(own), visible: visible(el) };
      });

    // Réductions de prix : prix barré (del, s, strike, ou line-through calculé), badge en pourcentage,
    // « au lieu de ». Le groupe est le plus petit ancêtre qui contient les prix concernés.
    const countPrices = (text) => (String(text).match(new RegExp(re.price.source, 'gi')) || []).length;
    const triggers = [];
    for (const el of document.querySelectorAll('body *')) {
      if (triggers.length >= 200 || el.closest('script, style, template, dialog')) continue;
      const own = clean(Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join(' '));
      const struck = el.matches('del, s, strike') || (own && getComputedStyle(el).textDecorationLine.includes('line-through'));
      if (struck && re.price.test(el.textContent)) triggers.push({ el, kind: 'struck-price', need: 2 });
      else if (own && re.reduction.test(own) && el.children.length <= 2) triggers.push({ el, kind: 'reduction-text', need: 1 });
    }
    const groups = new Map();
    for (const t of triggers) {
      let group = t.el.closest('.c-price, [data-price-group]');
      if (!group) {
        group = t.el.parentElement;
        for (let i = 0; i < 5 && group && group !== document.body && !group.matches('main, section, article, ul, ol')
          && countPrices(group.textContent) < t.need; i += 1) group = group.parentElement;
      }
      if (!group || group === document.body) group = t.el.parentElement || t.el;
      if (!visible(group) && !visible(t.el)) continue;
      const selector = cssPath(group);
      if (groups.has(selector)) continue;
      const text = clean(group.textContent);
      groups.set(selector, { selector, kind: t.kind, text: text.slice(0, 200),
        has_prior: Boolean(group.querySelector('.c-price-prior, [data-prior-price]')) || re.prior.test(text) });
    }

    // Textes de rareté et de compte à rebours : élément parent de chaque nœud texte visible.
    const scarcity = [];
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const parent = n.parentElement;
      if (!parent || seen.has(parent) || parent.closest('script, style, template, dialog') || !visible(parent)) continue;
      seen.add(parent);
      const text = clean(parent.textContent);
      if (text.length <= 200 && re.scarcity.test(text)) scarcity.push({ selector: cssPath(parent), text });
    }
    const odr = Array.from(document.querySelectorAll('a[href]')).filter((a) => re.odr.test(a.href))
      .map((a) => ({ selector: cssPath(a), href: a.href, name: accName(a) }));
    const main = document.querySelector('main') || document.body;
    const declaredButton = arg.orderButton ? document.querySelector(arg.orderButton) : null;
    const orderButton = declaredButton ? { selector: cssPath(declaredButton), name: accName(declaredButton),
      dom_name: domName(declaredButton), visible_text: visibleText(declaredButton), visible: visible(declaredButton), in_main: true } : null;
    return { lang: document.documentElement.lang || null, title: document.title, links, submits, checkboxes, order_button: orderButton,
      reductions: Array.from(groups.values()), scarcity, odr, main_text: visibleText(main), body_text: visibleText(document.body) };
  }

  if (arg.task === 'timers') {
    const out = [];
    const candidates = new Set(document.querySelectorAll('[role="timer"], [class*="countdown" i], [id*="countdown" i], [class*="timer" i], [id*="timer" i], [data-countdown]'));
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const parent = n.parentElement;
      if (!parent || parent.closest('script, style, template')) continue;
      if (re.clock.test(n.nodeValue)) {
        const context = clean((parent.parentElement || parent).textContent);
        if (re.urgency.test(context)) candidates.add(parent);
      }
    }
    for (const el of candidates) {
      const text = clean(el.textContent);
      if (!text || text.length > 160 || !visible(el)) continue;
      if ([...candidates].some((other) => other !== el && el.contains(other) && clean(other.textContent))) continue;
      out.push({ selector: cssPath(el), text });
    }
    return out;
  }

  if (arg.task === 'chats') {
    const found = new Map();
    const missing = [];
    for (const selector of arg.declared || []) {
      const el = document.querySelector(selector);
      if (el) found.set(el, true);
      else missing.push(selector);
    }
    const hasInput = (el) => Boolean(el.querySelector('textarea, input[type="text"], input:not([type]), [contenteditable="true"]'));
    const candidates = document.querySelectorAll('[data-ai-chat], [data-chat-widget], [role="log"], [id*="chat" i], [class*="chat" i], [aria-label*="chat" i], [aria-label*="assistant" i], [id*="assistant" i], [class*="assistant" i]');
    for (const c of candidates) {
      if (c.matches('a, button, input, textarea, label, select') || c.closest('a, button, dialog, head')) continue;
      let container = c.closest('[data-ai-chat], [data-chat-widget]');
      if (!container) {
        container = c;
        for (let i = 0; i < 4 && container && container !== document.body && !hasInput(container); i += 1) container = container.parentElement;
        if (!container || container === document.body || !hasInput(container)) continue;
      }
      if (container.matches('main, body, form') && !container.matches('[data-ai-chat], [data-chat-widget]')) continue;
      if (!found.has(container)) found.set(container, false);
    }
    // Une fenêtre déclarée ou balisée (data-ai-chat) l'emporte sur un conteneur repéré par son nom
    // de classe qui l'englobe ou qu'elle englobe ; parmi les autres, on garde le plus extérieur.
    const strong = Array.from(found.keys()).filter((el) => found.get(el) || el.matches('[data-ai-chat], [data-chat-widget]'));
    const weak = Array.from(found.keys()).filter((el) => !strong.includes(el)
      && !strong.some((s) => s.contains(el) || el.contains(s)));
    const outer = [...strong.filter((el) => !strong.some((o) => o !== el && o.contains(el))),
      ...weak.filter((el) => !weak.some((o) => o !== el && o.contains(el)))];
    return { missing, chats: outer.map((el) => {
      let launcher = el.id ? document.querySelector(`[aria-controls~="${CSS.escape(el.id)}"]`) : null;
      if (launcher && submitsForm(launcher)) launcher = null;
      if (!launcher) {
        launcher = Array.from(document.querySelectorAll('button, [role="button"]'))
          .find((b) => !el.contains(b) && !submitsForm(b) && /chat|assistant|tchat|discuter|question/i.test(accName(b)));
      }
      return { selector: cssPath(el), declared: found.get(el) === true, hidden: !visible(el), launcher: launcher ? cssPath(launcher) : null,
        launcher_name: launcher ? accName(launcher) : null };
    }) };
  }

  if (arg.task === 'chat') {
    const el = document.querySelector(arg.selector);
    if (!el) return null;
    const visibleInside = visibleText(el);
    const accessibleInside = accessibleText(el);
    const attributes = [el.getAttribute('aria-label'), el.getAttribute('title'), ...Array.from(el.querySelectorAll('[title], [aria-label]'))
      .map((x) => `${x.getAttribute('title') || ''} ${x.getAttribute('aria-label') || ''}`)].join(' ');
    const log = el.querySelector('[role="log"], [aria-live]');
    const items = log ? Array.from(log.querySelectorAll('li, [class*="msg" i], [class*="message" i]')).filter((x) => !x.parentElement.closest('li, [class*="msg" i], [class*="message" i]') || x.matches('li')) : [];
    const assistantItems = items.filter((x) => /assistant|\bbot\b|\bai\b|\bia\b|agent|from-ai|answer/i.test(`${x.className} ${x.getAttribute('data-role') || ''} ${x.getAttribute('data-from') || ''}`));
    const messages = (assistantItems.length ? assistantItems : items.slice(0, 1)).map((x) => accessibleText(x).slice(0, 200));
    const outside = visibleText(document.body, [el, ...document.querySelectorAll('dialog')]);
    const aiOutside = outside.match(re.ai);
    const linked = Array.from(el.querySelectorAll('a[href]')).map((a) => a.href);
    // Mot entier qui contient le libellé ambigu (« conseillère » plutôt que « conseill »).
    const hit = visibleInside.match(re.ambiguous);
    let ambiguous = null;
    if (hit) {
      let start = hit.index;
      let end = hit.index + hit[0].length;
      while (start > 0 && /[\p{L}\p{N}'’-]/u.test(visibleInside[start - 1])) start -= 1;
      while (end < visibleInside.length && /[\p{L}\p{N}'’-]/u.test(visibleInside[end])) end += 1;
      ambiguous = visibleInside.slice(start, end);
    }
    return {
      visible_text: visibleInside.slice(0, 600),
      ai_visible: re.ai.test(visibleInside),
      ai_accessible: re.ai.test(accessibleInside),
      ai_in_attributes_only: !re.ai.test(visibleInside) && re.ai.test(`${accessibleInside} ${attributes}`),
      ambiguous,
      log: Boolean(log),
      messages,
      assistant_label_attribute: el.getAttribute('data-assistant-label'),
      ai_outside_excerpt: aiOutside
        ? clean(outside.slice(Math.max(0, aiOutside.index - 60), aiOutside.index + 80).replace(aiOutside.index > 60 ? /^\S*\s/ : /^/, '')
          .replace(aiOutside.index + 80 < outside.length ? /\s\S*$/ : /$/, ''))
        : null,
      linked,
    };
  }

  if (arg.task === 'content') {
    return arg.items.map((item) => {
      const el = document.querySelector(item.selector);
      if (!el) return { selector: item.selector, found: false };
      // Portée de l'étiquette : l'élément, plus sa figure pour une image, une vidéo ou un son,
      // plus les éléments qu'il désigne par aria-describedby.
      const scope = [el];
      const holder = item.kind === 'text' ? null : el.closest('figure');
      if (holder && holder !== el) scope.push(holder);
      (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).forEach((id) => {
        const target = document.getElementById(id);
        if (target) scope.push(target);
      });
      const isLabel = (text) => text.length <= 400 && re.ai.test(text) && re.generated.test(text);
      const candidates = [];
      for (const root of scope) candidates.push(root, ...root.querySelectorAll('*'));
      // L'étiquette est le plus petit élément dont le texte dit « IA » et « généré » (ou équivalent).
      const smallest = (matches) => matches.find((m) => !matches.some((o) => o !== m && m.contains(o))) || null;
      const usable = candidates.filter((c) => !c.matches('script, style, template'));
      const visibleLabel = smallest(usable.filter((c) => isLabel(visibleText(c))));
      const accessibleLabel = smallest(usable.filter((c) => isLabel(accessibleText(c))));
      const altOnly = !visibleLabel && candidates.some((c) => c.tagName === 'IMG' && re.ai.test(c.getAttribute('alt') || ''));
      const titleOnly = !visibleLabel && candidates.some((c) => re.ai.test(c.getAttribute('title') || ''));
      let late = false;
      if (visibleLabel && item.kind === 'text') {
        const label = visibleLabel;
        const paragraphs = Array.from(el.querySelectorAll('p')).filter((p) => !label.contains(p) && !p.contains(label) && !p.closest('header') && clean(p.textContent).length > 40);
        late = paragraphs.length >= 2 && Boolean(paragraphs[0].compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING)
          && Boolean(paragraphs[1].compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING);
      }
      return { selector: item.selector, found: true, element: cssPath(el), visible: visible(el),
        visible_label: visibleLabel ? clean(visibleText(visibleLabel)).slice(0, 200) : null,
        accessible_label: accessibleLabel ? clean(accessibleText(accessibleLabel)).slice(0, 200) : null,
        alt_only: altOnly, title_only: titleOnly, late };
    });
  }

  if (arg.task === 'withdrawal-entry') {
    const root = document.querySelector('[data-withdrawal]') || document.querySelector('main') || document.body;
    const entry = root.querySelector('[data-wd-open]') || Array.from(root.querySelectorAll('button, [role="button"]'))
      .find((b) => !submitsForm(b) && /withdraw|rétract|retract|renonc/i.test(accName(b)));
    return entry && visible(entry) && !submitsForm(entry) ? cssPath(entry) : null;
  }

  if (arg.task === 'withdrawal-form') {
    const root = document.querySelector('[data-withdrawal]') || document.querySelector('main') || document.body;
    const forms = Array.from(root.querySelectorAll('form')).filter((f) => visible(f) && (f.getAttribute('method') || '').toLowerCase() !== 'dialog' && !f.closest(CHAT_SCOPE));
    const describe = (form) => {
      const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter((x) => !['hidden', 'submit', 'button', 'image', 'reset'].includes((x.type || '').toLowerCase()))
        .map((x) => ({ selector: cssPath(x), label: labelOf(x), type: (x.type || '').toLowerCase(), autocomplete: (x.getAttribute('autocomplete') || '').toLowerCase(),
          required: x.required || x.getAttribute('aria-required') === 'true', name: x.name || '' }));
      const buttons = Array.from(form.querySelectorAll('button, input[type="submit"]')).filter((b) => ((b.getAttribute('type') || 'submit').toLowerCase() === 'submit'))
        .map((b) => ({ selector: cssPath(b), name: accName(b), dom_name: domName(b), visible: visible(b) }));
      return { selector: cssPath(form), fields, buttons };
    };
    return forms.map(describe);
  }
  return null;
}
