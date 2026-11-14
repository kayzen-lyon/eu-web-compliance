# Skip link

A link at the very start of the page that jumps to the main content.

## When to use it

On every page that has repeated blocks (header, menu, search) before its main content, which is nearly every page. Without it, a keyboard user presses Tab through the whole menu on each page before reaching anything new.

There is no native element for this; it is an ordinary anchor link. Landmarks (`<main>`, `<nav>`) help screen reader users but give nothing to sighted keyboard users, so they do not replace it.

## Reference implementation

```html
<body>
  <a class="skip-link" href="#main">Skip to main content</a>

  <header>
    <!-- logo, navigation, search -->
  </header>

  <main id="main" tabindex="-1">
    <h1>Page title</h1>
  </main>
</body>
```

```css
.skip-link {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 1000;
  padding: 0.75rem 1rem;
  background: #ffffff;
  color: #1a1a1a;
  border: 2px solid currentColor;
  transform: translateY(-200%);   /* off screen, but still focusable */
}
.skip-link:focus { transform: translateY(0); }

main { scroll-margin-top: 5rem; } /* height of a sticky header, if there is one */
```

No script is needed.

Notes on the choices:

- The link is hidden by moving it off screen, never with `display: none` or `hidden`, which would remove it from the Tab sequence.
- `tabindex="-1"` on the target makes the jump move keyboard focus, not only the scroll position, in every browser. Without it, the next Tab press may start again from the top.
- The link text is in the language of the page.
- A page with several useful targets can offer a short list (illustration: "Skip to content", "Skip to search", "Skip to footer") inside `<nav aria-label="Quick access">`. Keep it to two or three links: a long list defeats its purpose.
- The link is at the same place, in the same order, on every page.

### Single-page applications

After a client-side route change there is no page load, so focus stays where it was, usually in the menu. Move focus to the `<main>` element or to its `<h1>` (both with `tabindex="-1"`) and update `document.title`. The skip link still serves people who tab from the top.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab, from the top of the page | The skip link receives focus first and becomes visible |
| Enter | The view scrolls to the main content and focus moves there; the next Tab goes to the first focusable element of the main content |

## Common mistakes

- Target `id` missing or renamed: the link does nothing. Test it after each layout change.
- Link hidden with `display: none` until hover: never reachable.
- Link that stays invisible when focused: sighted keyboard users cannot know it exists.
- Target hidden under a sticky header after the jump.
- Link placed after the header in the DOM.
- A consent banner or chat widget inserted before it by a script: check the DOM order in the rendered page, not only in the template.

## Checklist

- [ ] A link to the main content is present at the start of the page, before the repeated blocks; make it the first focusable element [WCAG 2.4.1; RGAA 12.7]
- [ ] The link is visible at least while it has focus [WCAG 2.4.7; RGAA 10.7]
- [ ] Activating it moves keyboard focus to the main content, which is not covered by a sticky header [WCAG 2.4.3; RGAA 12.7]
- [ ] It sits at the same place and in the same order on every page [WCAG 3.2.3; RGAA 12.7]
- [ ] Its text has a contrast ratio of at least 4.5:1 with its background when visible [WCAG 1.4.3; RGAA 3.2]
