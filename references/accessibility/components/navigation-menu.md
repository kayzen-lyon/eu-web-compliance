# Navigation menu

The main navigation of a site: a list of links, some of which open a sub-list, and a button that shows the whole menu on narrow screens.

## When to use it

- A plain `<nav>` containing a list of links is a complete navigation menu and needs no script. Start there.
- Add the disclosure behaviour below only when there are sub-menus or a collapsed mobile menu.
- Do not use `role="menu"`, `role="menubar"` or `role="menuitem"` for site navigation. Those roles describe application menus (like the menus of a desktop program): a screen reader switches to a mode where only arrow keys are expected, and a menu that does not implement that whole keyboard model becomes harder to use than a simple list of links.

Behaviour follows the [Disclosure navigation menu example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) of the ARIA Authoring Practices Guide. The code below is original to this project.

## Reference implementation

```html
<header class="site-header">
  <a href="/" class="site-logo"><img src="/logo.svg" alt="Northwind, home"></a>

  <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="main-nav" hidden>Menu</button>

  <nav id="main-nav" aria-label="Main">
    <ul>
      <li><a href="/" aria-current="page">Home</a></li>
      <li>
        <button type="button" aria-expanded="false" aria-controls="submenu-products">Products</button>
        <ul id="submenu-products" hidden>
          <li><a href="/products/bikes">Bikes</a></li>
          <li><a href="/products/helmets">Helmets</a></li>
          <li><a href="/products">All products</a></li>
        </ul>
      </li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
</header>
```

```css
#main-nav ul { list-style: none; margin: 0; padding: 0; }
#main-nav > ul { display: flex; flex-wrap: wrap; gap: 0.5rem; }
#main-nav li { position: relative; }
#main-nav a,
#main-nav button,
.nav-toggle {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
}
#main-nav a[aria-current="page"] { font-weight: 700; text-decoration: underline; text-decoration-thickness: 3px; }
#main-nav :focus-visible,
.nav-toggle:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }

/* Chevron drawn with borders: nothing for a screen reader to read. */
#main-nav button[aria-expanded]::after {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  margin-inline-start: 0.5rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
}
#main-nav button[aria-expanded="true"]::after { transform: rotate(-135deg); }

#main-nav li > ul {
  position: absolute;
  z-index: 10;
  min-width: 12rem;
  background: Canvas;
  color: CanvasText;
  border: 1px solid currentColor;
}

.nav-toggle { display: none; }
@media (max-width: 48em) {
  .nav-toggle:not([hidden]) { display: inline-flex; border: 1px solid currentColor; }
  #main-nav > ul { flex-direction: column; }
  #main-nav li > ul { position: static; border: 0; padding-inline-start: 1rem; }
}
```

```js
const nav = document.getElementById('main-nav');
const toggle = document.querySelector('.nav-toggle');
const narrow = window.matchMedia('(max-width: 48em)');

const setMenuOpen = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  nav.hidden = narrow.matches && !open;
};

const closeSubmenus = (except) => {
  for (const button of nav.querySelectorAll('button[aria-expanded="true"]')) {
    if (button === except) continue;
    button.setAttribute('aria-expanded', 'false');
    document.getElementById(button.getAttribute('aria-controls')).hidden = true;
  }
};

toggle.hidden = false;            // the button only exists when the script runs
setMenuOpen(false);
narrow.addEventListener('change', () => setMenuOpen(false));
toggle.addEventListener('click', () => setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true'));

nav.addEventListener('click', (event) => {
  const button = event.target.closest('button[aria-controls]');
  if (!button) return;
  const open = button.getAttribute('aria-expanded') === 'true';
  closeSubmenus(button);
  button.setAttribute('aria-expanded', String(!open));
  document.getElementById(button.getAttribute('aria-controls')).hidden = open;
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openSubmenu = nav.querySelector('button[aria-expanded="true"]');
  if (openSubmenu) {
    const focusWasInside = nav.contains(document.activeElement);
    closeSubmenus();
    if (focusWasInside) openSubmenu.focus();
  } else if (narrow.matches && toggle.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    toggle.focus();
  }
});

nav.addEventListener('focusout', (event) => {
  if (!nav.contains(event.relatedTarget)) closeSubmenus();
});
```

Notes on the choices:

- Without script the page shows the full navigation and no "Menu" button: nothing is locked behind JavaScript. Sub-menus marked `hidden` do need the script; if that matters, render them open and let the script collapse them.
- A top-level entry is either a link or a button that opens a sub-menu, not both at once. The first item of the sub-menu can link to the section page ("All products").
- Sub-menus open on click or on Enter and Space, not on hover. A menu that opens on hover must also open on activation and must stay open while the pointer moves onto it; a click-only menu avoids those failure modes and works the same on touch screens.
- The mobile button has a visible text name. If the design imposes a three-line icon, keep an accessible name (`aria-label="Menu"`) and hide the icon from assistive technology.
- `aria-expanded` on the button says whether the menu is open; the name stays "Menu" in both states. Changing the name to "Close" as well would announce the state twice.
- `aria-current="page"` marks the current page for screen readers; the bold and underline mark it for sighted users without relying on colour.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab / Shift+Tab | Move through the top-level items and, when a sub-menu is open, through its links |
| Enter or Space on a button | Opens or closes its sub-menu (or the whole menu for the "Menu" button) |
| Enter on a link | Follows the link |
| Escape | Closes the open sub-menu and returns focus to its button; on narrow screens, with no sub-menu open, closes the menu and returns focus to "Menu" |
| Tab out of the navigation | Closes any open sub-menu |

Arrow keys, Home and End are optional additions in the APG example; if added, they complement Tab and never replace it.

## Common mistakes

- `role="menu"` on a list of links, with Tab as the only navigation key.
- Sub-menus that open on hover only: unreachable by keyboard and on touch screens.
- A "hamburger" `<div>` or `<span>` with a click handler: not focusable, no name, no state.
- The collapsed mobile menu moved off screen with `transform` or `left: -9999px`: its links stay in the Tab sequence, and focus disappears for a dozen key presses. Use `hidden`.
- A full-screen mobile menu that leaves the page behind it reachable: either make it a modal ([modal-dialog.md](modal-dialog.md)) or keep it in the page flow.
- A sticky header that covers focused content further down the page: see [../wcag-2.2-additions.md](../wcag-2.2-additions.md), 2.4.11.
- The current page shown by colour only.

## Checklist

- [ ] The menu is a `<nav>` with a name, containing a list of links [WCAG 1.3.1; RGAA 9.2, 12.6]
- [ ] Controls that open a sub-menu or the mobile menu are `<button>` elements with `aria-expanded` kept up to date [WCAG 4.1.2; RGAA 7.1]
- [ ] Every sub-menu opens with the keyboard, not only on hover [WCAG 2.1.1; RGAA 12.11]
- [ ] Closed sub-menus and a collapsed mobile menu are out of the Tab sequence and hidden from assistive technology [WCAG 2.4.3; RGAA 10.8]
- [ ] Escape closes an open sub-menu and focus returns to its button [WCAG 1.4.13; RGAA 10.13]
- [ ] The current page is marked with `aria-current="page"` and with a visual cue other than colour [WCAG 1.4.1; RGAA 3.1]
- [ ] The menu is in the same place and order on every page [WCAG 3.2.3; RGAA 12.2]
- [ ] At 320 CSS pixels wide the whole menu is reachable without horizontal scrolling [WCAG 1.4.10; RGAA 10.11]
