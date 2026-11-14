# Anti-patterns: ARIA and dynamic updates

Roles, states and misuse of ARIA; messages and changes that happen without a page load. Severity levels, the way to read "Detect" lines and the machine-readable patterns are in [anti-patterns.md](anti-patterns.md). The examples are illustrations: recognise the pattern, do not copy the wording.

## ARIA

### AP-ARIA-01 · Clickable `<div>` or `<span>`

A click handler on a non-interactive element creates a control that Tab never reaches, that does not answer to Enter or Space, and that a screen reader does not present as a control. The function does not exist for people who do not use a pointer.

- Severity: blocking. Criterion: WCAG 2.1.1, 4.1.2; RGAA 7.3, 7.1.
- Detect: a click handler attribute on a non-interactive element (HTML, JSX, Vue or Angular syntax). In a DOM checker: click listeners on elements that are neither natively interactive nor given a role, `tabindex="0"` and key handlers.

Bad:
```html
<div class="btn" onclick="addToBasket(42)">Add to basket</div>
```

Good:
```html
<button type="button" class="btn" data-add-to-basket="42">Add to basket</button>
```

### AP-ARIA-02 · Link used as a button

An `<a>` without `href` is not focusable. With `href="#"` or `javascript:`, it is announced as a link, does not answer to Space, scrolls to the top or pollutes the history, and "open in a new tab" leads nowhere.

- Severity: major. Criterion: WCAG 4.1.2; RGAA 7.1.
- Detect: `<a>` without `href`, or with `href="#"` or a `javascript:` URL.

Bad:
```html
<a href="#" class="btn" id="open-filters">Filters</a>
```

Good:
```html
<button type="button" class="btn" id="open-filters" aria-expanded="false" aria-controls="filters">Filters</button>
```

### AP-ARIA-03 · `aria-hidden="true"` on or around a focusable element

The element still receives keyboard focus, but the screen reader says nothing: the person is on a control they cannot identify.

- Severity: major. Criterion: WCAG 4.1.2; RGAA 10.8.
- Detect: a focusable element that has `aria-hidden="true"` or sits inside an element that has it.

Bad:
```html
<a href="/basket" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 4h2l3 12h10l2-8H7"/></svg></a>
```

Good:
```html
<a href="/basket"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 4h2l3 12h10l2-8H7"/></svg><span class="visually-hidden">Basket</span></a>
```

### AP-ARIA-04 · ARIA role without its required state, or role that does not exist

A role is a promise to the screen reader. `role="tab"` without `aria-selected`, or `role="checkbox"` without `aria-checked`, announces a control whose state is unknown. A role that does not exist (`role="input"`, a misspelling) is ignored.

- Severity: major. Criterion: WCAG 4.1.2; RGAA 7.1.
- Detect: `tab` without `aria-selected`; `checkbox`, `switch` or `radio` without `aria-checked`; `combobox` without `aria-expanded`; `slider` without `aria-valuenow`. For unknown role values, rely on a tool that knows the WAI-ARIA role list.

Bad:
```html
<div role="checkbox" tabindex="0">Send me the newsletter</div>
```

Good:
```html
<label><input type="checkbox" name="newsletter"> Send me the newsletter</label>
```

### AP-ARIA-05 · Role that repeats the native role

`<button role="button">` adds nothing. It is harmless by itself, but it signals ARIA applied by reflex, and the same reflex produces the harmful cases.

- Severity: minor. Criterion: best practice (no official criterion).
- Detect: a native element carrying its own implicit role.

Bad:
```html
<nav role="navigation" aria-label="Main">...</nav>
```

Good:
```html
<nav aria-label="Main">...</nav>
```

### AP-ARIA-06 · `role="menu"` for site navigation

The menu roles describe application menus. A screen reader switches to a mode where arrow keys are expected and links are announced as "menu item"; when the full keyboard model is not implemented, the navigation is harder to use than a plain list of links.

- Severity: major. Criterion: best practice (no official criterion).
- Detect: `menu`, `menubar` or `menuitem` roles inside a `<nav>`.

Bad:
```html
<nav>
  <ul role="menu">
    <li role="menuitem"><a href="/products">Products</a></li>
  </ul>
</nav>
```

Good:
```html
<nav aria-label="Main">
  <ul>
    <li><a href="/products">Products</a></li>
  </ul>
</nav>
```

### AP-ARIA-07 · Show/hide control that does not expose its state

The button toggles a class and the panel appears, but nothing in the code says "expanded" or "collapsed". A screen reader user activates the button and hears nothing change.

- Severity: major. Criterion: WCAG 4.1.2; RGAA 7.1.
- Detect: a `<button>` whose class or id suggests a toggle and that has no `aria-expanded` or `aria-pressed`; in scripts, a class toggled for an open or active state in a file that never sets an ARIA attribute.

Bad:
```html
<button type="button" class="menu-toggle">Menu</button>
<ul id="menu" class="menu">...</ul>
```

Good:
```html
<button type="button" class="menu-button" aria-expanded="false" aria-controls="menu">Menu</button>
<ul id="menu" hidden>...</ul>
```

### AP-ARIA-08 · Control disabled by a CSS class only

Greyed out with a class, the control still receives focus, is announced as available and, for a link, still works with Enter. The person is told nothing about its state.

- Severity: major. Criterion: WCAG 4.1.2; RGAA 7.1.
- Detect: a link or button with a "disabled" class and neither the `disabled` attribute nor `aria-disabled`.

Bad:
```html
<a href="?page=0" class="page-link disabled">Previous page</a>
```

Good:
```html
<button type="button" class="page-link" disabled>Previous page</button>
```

### AP-ARIA-09 · `role="presentation"` on an interactive element

The role asks assistive technology to ignore the semantics of an element that the person can still focus and operate. Browsers discard the role, or the control loses its role, depending on the case.

- Severity: minor. Criterion: WCAG 4.1.2; RGAA 7.1.
- Detect: `role="presentation"` or `role="none"` on a link, button or form control.

Bad:
```html
<button type="button" role="presentation">Validate</button>
```

Good:
```html
<button type="button">Validate</button>
```

### AP-ARIA-10 · Interactive element nested in another

A button inside a link (a "favourite" button inside a clickable card) is invalid HTML. Screen readers announce one of the two and hide the other, and a click or key press may trigger both.

- Severity: major. Criterion: WCAG 4.1.2; RGAA 8.2.
- Detect: a `<button>` inside an `<a>`, or an `<a>` inside a `<button>`.

Bad:
```html
<a href="/products/42" class="card">
  <h3>City bike</h3>
  <button type="button">Add to favourites</button>
</a>
```

Good:
```html
<article class="card">
  <h3><a href="/products/42">City bike</a></h3>
  <button type="button">Add City bike to favourites</button>
</article>
```

## Dynamic updates

### AP-DYN-01 · Status message with no live region

"Saved", "3 results", "Payment refused" appear on screen, and a screen reader says nothing, because focus is elsewhere and nothing marks the message as an update.

- Severity: major. Criterion: WCAG 4.1.3; RGAA 7.5.
- Detect: an element whose class or id suggests a notification and that has no `role="status"`, `role="alert"`, `role="log"` or `aria-live`. Also check loading indicators and result counts.

Bad:
```html
<div class="toast">Your changes are saved</div>
```

Good:
```html
<!-- present and empty at page load; the message is written into it later -->
<div class="toast" role="status"></div>
```

### AP-DYN-02 · Message that disappears on a timer

A toast that leaves after three seconds is gone before a slow reader finishes it, before a magnifier user finds it, or while the screen reader is still speaking something else. If it carried an "Undo" link, the action is lost too.

- Severity: major. Criterion: WCAG 2.2.1; RGAA 13.1.
- Detect: a timer that removes or hides a notification. Acceptable only for messages that repeat information visible elsewhere.

Bad:
```js
showToast('Message archived. Undo');
setTimeout(() => toast.remove(), 3000);
```

Good:
```js
// The message stays until the person closes it (components/status-messages.md).
showToast('Message archived.');
```

### AP-DYN-03 · Client-side navigation that changes neither title nor focus

After a link is activated in a single-page application, nothing is announced: the title is the old one and focus is still on the link in the menu. A screen reader user cannot tell that the page changed.

- Severity: major. Criterion: WCAG 2.4.2; RGAA 8.6.
- Detect: use of the History API in a script that never sets `document.title`. Moving focus to the new content is a good practice to check by hand.

Bad:
```js
history.pushState({}, '', '/orders');
renderOrders();
```

Good:
```js
history.pushState({}, '', '/orders');
renderOrders();
document.title = 'Your orders - Colibri bookshop';
document.querySelector('main h1').focus();   // the h1 has tabindex="-1"
```

### AP-DYN-04 · Everything announced as an alert

`role="alert"` and `aria-live="assertive"` interrupt whatever the screen reader is saying. Used for routine confirmations, they cut speech constantly and teach people to ignore real alerts.

- Severity: minor. Criterion: best practice (no official criterion).
- Detect: `aria-live="assertive"`, or `role="alert"` on messages that are not errors or urgent warnings.

Bad:
```html
<div aria-live="assertive">Item added to your basket</div>
```

Good:
```html
<div role="status">Item added to your basket</div>
```

### AP-DYN-05 · Change of context on focus or without request

A page that navigates, submits or opens a window when a field merely receives focus, or by itself on load, moves people who did nothing. Screen reader and magnifier users may not notice and lose their bearings.

- Severity: major. Criterion: WCAG 3.2.1; RGAA 7.4, 13.2.
- Detect: a `focus` handler that navigates, submits or opens a window; a call to `window.open` outside a click handler.

Bad:
```html
<input name="promo" onfocus="window.open('/offers')">
```

Good:
```html
<label for="promo">Promotional code</label>
<input id="promo" name="promo">
<a href="/offers">See current offers</a>
```
