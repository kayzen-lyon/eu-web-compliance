# Accordion and disclosure

A heading or button that shows and hides the content under it. One alone is a disclosure; a stack of them is an accordion.

## When to use it

- Use it to shorten a page whose sections are read selectively (FAQ, filters, optional details).
- Do not hide content that everyone needs: collapsed content is one more action away for each person, and is easy to miss with magnification.
- The native `<details>` and `<summary>` elements are enough for most cases and work without script. Use the button version below when each title must be reachable through screen reader heading navigation, or when the project needs to control the open state from script.

Behaviour follows the [Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) and [Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) patterns of the ARIA Authoring Practices Guide. The code below is original to this project.

## Reference implementation A: native elements

```html
<details>
  <summary>How do I return an item?</summary>
  <p>Print the return label from your account and hand the parcel in at a pickup point within 30 days.</p>
</details>

<details>
  <summary>When will I be refunded?</summary>
  <p>Within 14 days after we receive the parcel.</p>
</details>
```

```css
summary {
  min-height: 2.75rem;
  padding: 0.5rem 0;
  cursor: pointer;
}
summary:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
```

The browser provides the button role, the expanded or collapsed state, the keyboard and the marker. Keep the default marker or replace it with one that is as visible. Giving the same `name` attribute to several `<details>` makes them exclusive (opening one closes the others); check that the browsers you target support it, and prefer letting several stay open: closing a section the person was reading is disorienting.

## Reference implementation B: button inside a heading

```html
<div data-accordion>
  <h3>
    <button type="button" id="faq-returns-button" aria-expanded="false" aria-controls="faq-returns">
      How do I return an item?
    </button>
  </h3>
  <div id="faq-returns" role="region" aria-labelledby="faq-returns-button" hidden>
    <p>Print the return label from your account and hand the parcel in at a pickup point within 30 days.</p>
  </div>

  <h3>
    <button type="button" id="faq-refund-button" aria-expanded="false" aria-controls="faq-refund">
      When will I be refunded?
    </button>
  </h3>
  <div id="faq-refund" role="region" aria-labelledby="faq-refund-button" hidden>
    <p>Within 14 days after we receive the parcel.</p>
  </div>
</div>
```

```css
[data-accordion] > :is(h2, h3, h4, h5, h6) > button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: none;
  font: inherit;
  color: inherit;
  text-align: start;
}
/* Chevron drawn with borders and driven by the attribute, so it cannot drift from the real state. */
[data-accordion] > :is(h2, h3, h4, h5, h6) > button::after {
  content: "";
  flex: none;
  width: 0.6rem;
  height: 0.6rem;
  margin-inline: 1rem 0.25rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
}
[data-accordion] > :is(h2, h3, h4, h5, h6) > button[aria-expanded="true"]::after { transform: rotate(-135deg); }
[data-accordion] > :is(h2, h3, h4, h5, h6) > button:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
```

```js
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-accordion] > :is(h2, h3, h4, h5, h6) > button[aria-controls]');
  if (!button) return;
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  document.getElementById(button.getAttribute('aria-controls')).hidden = expanded;
});
```

Notes on the choices:

- The heading level (`<h3>` here) follows the outline of the page. The button is the only content of the heading.
- The CSS and the script target the buttons that are direct children of the headings of `data-accordion`, so a button placed inside a panel (a form, a "Return" action) is not styled or toggled as a title.
- The chevron is drawn with borders, with empty generated content, so screen readers have nothing to read aloud; the state itself is carried by `aria-expanded`. A "+" or "−" character written in CSS `content` would be spoken by some screen readers after each title.
- `role="region"` on the panel lets screen reader users jump to it. With more than about six panels that can be open together, drop the role: too many landmarks become noise.
- Focus stays on the button after activation. The panel comes right after its button in the DOM, so the next Tab or the next reading command enters it.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab / Shift+Tab | Move through the titles and through the focusable content of open panels, in page order |
| Enter or Space on a title | Opens or closes its panel |

No arrow-key navigation is required.

## Common mistakes

- A clickable `<div>` or heading with no button: not focusable, no role, no state.
- `aria-expanded` set once in the HTML and never updated by the script.
- `aria-expanded` placed on the panel instead of the button.
- The panel hidden with `height: 0` or `opacity: 0` only: its links still receive focus while invisible. Use `hidden` (or `display: none`), and add `visibility: hidden` at the end of a closing animation.
- An icon as the only title, or a chevron that conveys the state with nothing in the code.
- The panel placed far from its button in the DOM.
- Moving focus into the panel on opening: unexpected, and it skips the start of the content for magnifier users.

## Checklist

- [ ] Each title is a `<summary>` or a `<button>`, operable with Enter and Space [WCAG 2.1.1; RGAA 7.3]
- [ ] The open or closed state is exposed: native `<details>`, or `aria-expanded` on the button, updated at each change [WCAG 4.1.2; RGAA 7.1]
- [ ] A closed panel is removed from the Tab sequence and from the accessibility tree (`hidden`) [WCAG 2.4.3; RGAA 10.8]
- [ ] The panel follows its title in the DOM [WCAG 1.3.2; RGAA 10.3]
- [ ] The focused title shows a visible focus indicator [WCAG 2.4.7; RGAA 10.7]
- [ ] When titles structure the page, each button sits inside a heading of the right level [WCAG 1.3.1; RGAA 9.1]
