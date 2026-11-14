// Fonctions exécutées dans la page par scripts/check-a11y.mjs (page.evaluate) : elles sont
// sérialisées et ne doivent dépendre d'aucune variable extérieure à leur corps.

// Exécuté dans la page : relève l'état de l'élément actif après un appui sur Tab.
export function inspectActiveElement(baseline) {
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
export function recordBaseline() {
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

// Exécuté dans la page : conditions de page des motifs du catalogue, par nom.
// « link-in-text-without-underline » : la page a au moins un lien dans un texte courant qui n'est
// pas souligné (WCAG 1.4.1 vise les liens dans un bloc de texte). Ne comptent pas : les liens de
// nav, header et footer (ou des rôles équivalents), les liens à l'allure de bouton (rôle button,
// classe btn ou button, fond ou bordure), et les liens qui sont le seul contenu de leur bloc,
// dont les éléments d'une liste de liens.
export function runPageConditions(names) {
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
export function runSelectorDetectors(selectors) {
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
export function runStructuralChecks() {
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

// Exécuté dans la page : pour chaque défaut attendu, cherche un constat qui vise le même élément.
export function matchInPage({ expected, findings }) {
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
