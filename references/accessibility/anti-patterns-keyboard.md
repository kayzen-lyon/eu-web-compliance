# Anti-patterns: keyboard, focus and pointer

Keyboard access, focus visibility and order, traps, shortcuts, target size, dragging. Severity levels, the way to read "Detect" lines and the machine-readable patterns are in [anti-patterns.md](anti-patterns.md). The examples are illustrations: recognise the pattern, do not copy the wording.

### AP-KBD-01 · Positive `tabindex`

A positive value pulls the element to the front of the Tab sequence, ahead of everything else on the page. Focus jumps around instead of following the reading order, and the effect compounds with each new value.

- Severity: major. Criterion: WCAG 2.4.3; RGAA 12.8.
- Detect: `tabindex` greater than 0 (HTML or JSX).

Bad:
```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email" tabindex="1">
<button type="submit" tabindex="2">Subscribe</button>
```

Good:
```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email">
<button type="submit">Subscribe</button>
```

### AP-KBD-02 · Focus indicator removed

A sighted keyboard user who cannot see where focus is cannot use the page at all: every key press is a guess. `outline: none` in a reset style sheet is the most common single cause.

- Severity: blocking. Criterion: WCAG 2.4.7; RGAA 10.7.
- Detect: `outline: none` or `outline: 0` in a style sheet that defines no `:focus-visible` or `:focus` rule with a visible replacement. Confirm by tabbing through the page.

Bad:
```css
button:focus { outline: none; }
```

Good:
```css
button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}
```

### AP-KBD-03 · Content revealed on hover only

A sub-menu, a card action or a help bubble that appears on `:hover` never appears for keyboard and touch users. The links inside it may even receive focus while invisible.

- Severity: blocking. Criterion: WCAG 2.1.1; RGAA 10.14, 12.11.
- Detect: a CSS rule that shows a descendant or sibling on `:hover`, or a `mouseenter`/`mouseover` handler, with no focus or activation equivalent. The same content must also be dismissible and hoverable (see `components/tooltip.md`).

Bad:
```css
.menu li > ul { display: none; }
.menu li:hover > ul { display: block; }
```

Good:
```css
/* Opened by a button, for every input method. */
.menu button[aria-expanded="true"] + ul { display: block; }
.menu button[aria-expanded="false"] + ul { display: none; }
```

### AP-KBD-04 · Custom modal with no focus management

A `<div>` displayed above the page takes neither focus nor the dialog role. Keyboard focus stays in the page behind the overlay, and a screen reader user is not told that anything opened. If the overlay cannot be closed with the keyboard, the page is lost.

- Severity: blocking. Criterion: WCAG 2.4.3, 4.1.2; RGAA 7.1, 12.8.
- Detect: a `<div>` whose class or id suggests a modal and that has no `role="dialog"`. Then check by hand: focus moves in, stays in, Escape closes, focus returns.

Bad:
```html
<div class="modal is-open">
  <span class="close" onclick="closeModal()">×</span>
  <p>Subscribe to our newsletter</p>
</div>
```

Good:
```html
<dialog id="newsletter" aria-labelledby="newsletter-title">
  <h2 id="newsletter-title">Subscribe to our newsletter</h2>
  <form method="dialog"><button>Close</button></form>
</dialog>
<!-- opened on request with dialog.showModal(); see components/modal-dialog.md -->
```

### AP-KBD-05 · Keyboard trap

A component that captures Tab (a code editor, an embedded player, a badly written focus loop) keeps keyboard focus for good. Everything after it on the page is out of reach, and the only exit is to reload.

- Severity: blocking. Criterion: WCAG 2.1.2; RGAA 12.9.
- Detect: a key handler that cancels the default action of Tab. Legitimate inside a modal dialog that can be closed with Escape; a defect anywhere the person has no documented keyboard exit.

Bad:
```js
editor.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    insertText('\t');
  }
});
```

Good:
```js
// Tab keeps moving focus; indentation has its own button and shortcut.
indentButton.addEventListener('click', () => insertText('\t'));
```

### AP-KBD-06 · Focus lost when the focused element disappears

Deleting a row, closing a panel or re-rendering a list removes the element that had focus. Focus falls back to the top of the document: a keyboard user must travel back, and a screen reader user is silently moved elsewhere.

- Severity: major. Criterion: WCAG 2.4.3; RGAA 7.3.
- Detect: code that removes or hides a container without first checking whether it contains `document.activeElement`. Confirm by performing the action with the keyboard and pressing Tab once.

Bad:
```js
deleteButton.addEventListener('click', () => {
  row.remove();
});
```

Good:
```js
deleteButton.addEventListener('click', () => {
  const next = row.nextElementSibling ?? row.previousElementSibling;
  row.remove();
  (next?.querySelector('button') ?? listHeading).focus();   // listHeading has tabindex="-1"
  announce('Address deleted');
});
```

### AP-KBD-07 · No skip link

Without it, a keyboard user goes through the whole header and menu on every page before reaching the content.

- Severity: major. Criterion: WCAG 2.4.1; RGAA 12.7.
- Detect: the first focusable element of `<body>` is not a link to an anchor that exists in the page.

Bad:
```html
<body>
  <header>...</header>
  <main>...</main>
</body>
```

Good:
```html
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header>...</header>
  <main id="main" tabindex="-1">...</main>
</body>
```

### AP-KBD-08 · Sticky bar that covers the focused element

When focus moves to a link that the browser scrolls just under a fixed header or footer, the person activates something they cannot see.

- Severity: major. Criterion: WCAG 2.4.11.
- Detect: `position: sticky` or `fixed` in a style sheet that sets no `scroll-padding`. Confirm by tabbing forward and backward at 320 CSS pixels wide.

Bad:
```css
.site-header { position: sticky; top: 0; }
```

Good:
```css
.site-header { position: sticky; top: 0; }
html { scroll-padding-top: 5rem; }   /* height of the header */
```

### AP-KBD-09 · Single-key shortcut

Speech recognition types what it hears. A dictated word is received as a burst of letters, each of which triggers a shortcut. Keyboard users also hit them by accident.

- Severity: major. Criterion: WCAG 2.1.4; RGAA 12.10.
- Detect: a key handler that compares the key with a single printable character without testing a modifier key. Acceptable only if the shortcut can be turned off or remapped, or works only while its component has focus.

Bad:
```js
document.addEventListener('keydown', (event) => {
  if (event.key === 's') openSearch();
});
```

Good:
```js
document.addEventListener('keydown', (event) => {
  if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    openSearch();
  }
});
```

### AP-KBD-10 · Scrollable area that the keyboard cannot scroll

A block with `overflow: auto` and no focusable content cannot receive focus in every browser, so the arrow keys cannot scroll it. The end of a wide table or of a terms-and-conditions box is out of reach.

- Severity: major. Criterion: WCAG 2.1.1; RGAA 7.3.
- Detect: an element whose computed `overflow` is `auto` or `scroll`, whose content overflows, and that is not focusable and contains no focusable element.

Bad:
```html
<div class="table-scroll">
  <table>...</table>
</div>
```

Good:
```html
<div class="table-scroll" role="region" aria-labelledby="prices-caption" tabindex="0">
  <table>
    <caption id="prices-caption">Prices by country</caption>
  </table>
</div>
```

### AP-KBD-11 · Drag and drop as the only way

Reordering, moving a card or setting a slider by dragging is impossible with a keyboard and for people who cannot hold a press while moving the pointer.

- Severity: blocking. Criterion: WCAG 2.5.7, 2.1.1; RGAA 7.3.
- Detect: presence of drag handling. Then check that each dragged item also has controls that do the same with single clicks.

Bad:
```html
<ul id="playlist">
  <li draggable="true">Morning news</li>
  <li draggable="true">Weather report</li>
</ul>
```

Good:
```html
<ul id="playlist">
  <li draggable="true">
    Morning news
    <button type="button" data-move="up">Move Morning news up</button>
    <button type="button" data-move="down">Move Morning news down</button>
  </li>
</ul>
```

### AP-KBD-12 · Pointer target smaller than 24 by 24 CSS pixels

People with tremor, or using a finger on a phone, miss a 16-pixel icon or hit its neighbour. Close buttons, pagination, carousel dots and row actions are the usual cases.

- Severity: major. Criterion: WCAG 2.5.8.
- Detect: a clickable element whose bounding box is under 24 pixels in width or height and whose 24-pixel circle meets another target. Links inside sentences are exempt.

Bad:
```css
.close { width: 16px; height: 16px; padding: 0; }
```

Good:
```css
.close {
  min-width: 24px;
  min-height: 24px;
  display: inline-grid;
  place-items: center;   /* the 16px icon is centred in a 24px target */
}
```

### AP-KBD-13 · Action triggered when the pointer goes down

An action that fires on `mousedown`, `pointerdown` or `touchstart` cannot be cancelled by sliding off the control before releasing. People with tremor trigger things by brushing the screen.

- Severity: minor. Criterion: WCAG 2.5.2; RGAA 13.11.
- Detect: handlers on down-events. Fine when they only prepare something (keeping focus, starting a drag that can be aborted) and the action itself happens on `click`.

Bad:
```js
deleteButton.addEventListener('mousedown', deleteItem);
```

Good:
```js
deleteButton.addEventListener('click', deleteItem);
```
