# Consent banner shell

The structure and focus behaviour of a banner that asks for a choice on arrival (cookies and other trackers, or any similar notice), and of the settings panel it opens.

This file covers accessibility only. What the banner must say, which choices it must offer, how they are worded and weighted, and what happens to scripts before and after the choice belong to the privacy part of this skill. Do not treat the texts below as legally sufficient: they are placeholders.

## When to use it

- Use this shell whenever a page shows a notice on load that expects an answer.
- Two forms are possible. A **non-modal banner** lets the person use the page while it is displayed; this is the default here. A **modal** banner blocks the page until a choice is made; build it with `<dialog>` ([modal-dialog.md](modal-dialog.md)) and make sure every choice, including refusal, is available inside it.
- A third-party consent tool must meet the same checklist. Test it before adopting it; see [../fallbacks.md](../fallbacks.md) if it fails.

There is no ARIA Authoring Practices pattern for consent banners. This component applies the general rules for regions, buttons, focus and reflow. The code is original to this project.

## Reference implementation

The banner is the first thing after the skip link in `<body>`, in the normal page flow.

```html
<body>
  <a class="skip-link" href="#main">Skip to main content</a>

  <section id="consent-banner" class="consent-banner" aria-labelledby="consent-title" hidden>
    <h2 id="consent-title">Cookies and other trackers</h2>
    <p>Placeholder for the information text. <a href="/cookies">Cookie policy</a></p>
    <div class="consent-actions">
      <button type="button" data-consent="accept">Accept all</button>
      <button type="button" data-consent="refuse">Refuse all</button>
      <button type="button" data-consent="customise">Choose by purpose</button>
    </div>
  </section>

  <header><!-- site header --></header>
  <main id="main" tabindex="-1"><!-- page content --></main>
  <footer>
    <button type="button" data-consent-open>Manage cookies</button>
  </footer>

  <dialog id="consent-settings" aria-labelledby="consent-settings-title">
    <h2 id="consent-settings-title" tabindex="-1" autofocus>Choose by purpose</h2>
    <form method="dialog">
      <fieldset>
        <legend>Audience measurement</legend>
        <p id="purpose-audience-text">Placeholder for the description of this purpose.</p>
        <label><input type="radio" name="audience" value="accept" aria-describedby="purpose-audience-text"> Accept</label>
        <label><input type="radio" name="audience" value="refuse" aria-describedby="purpose-audience-text" checked> Refuse</label>
      </fieldset>
      <!-- one fieldset per purpose -->
      <button value="save">Save my choices</button>
      <button value="cancel">Cancel</button>
    </form>
  </dialog>

  <div id="consent-status" role="status" class="visually-hidden"></div>
</body>
```

```css
.consent-banner {
  padding: 1rem;
  border-block-end: 2px solid currentColor;
  background: Canvas;
  color: CanvasText;
}
.consent-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
/* The three choices share one style: same size, same weight, same contrast. */
.consent-actions button,
[data-consent-open] {
  min-height: 2.75rem;
  padding: 0.5rem 1.25rem;
  border: 2px solid currentColor;
  background: Canvas;
  color: CanvasText;
  font: inherit;
}
.consent-banner :focus-visible,
[data-consent-open]:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
```

```js
const banner = document.getElementById('consent-banner');
const settings = document.getElementById('consent-settings');
const statusRegion = document.getElementById('consent-status');

const closeBanner = (message) => {
  const focusWasInside = banner.contains(document.activeElement);
  banner.hidden = true;
  statusRegion.textContent = message;
  if (focusWasInside) document.getElementById('main').focus();   // never leave focus on a removed element
};

// Recording the choice and loading or blocking scripts is handled by the privacy part of this skill.
// hasStoredChoice() and storeChoice() stand for that logic.
if (!hasStoredChoice()) banner.hidden = false;

banner.addEventListener('click', (event) => {
  const button = event.target.closest('[data-consent]');
  if (!button) return;
  const choice = button.dataset.consent;
  if (choice === 'customise') {
    settings.showModal();
    return;
  }
  storeChoice(choice);
  closeBanner(choice === 'accept' ? 'All trackers accepted.' : 'All trackers refused.');
});

document.querySelector('[data-consent-open]').addEventListener('click', () => settings.showModal());

settings.addEventListener('close', () => {
  if (settings.returnValue !== 'save') return;       // Cancel and Escape change nothing
  storeChoice(new FormData(settings.querySelector('form')));
  if (!banner.hidden) closeBanner('Your choices are saved.');
  else statusRegion.textContent = 'Your choices are saved.';
});
```

Notes on the choices:

- **In the flow, at the top.** The banner pushes the page down instead of floating over it, so it can never cover the element that has keyboard focus, and it is the first thing met by a keyboard or screen reader user. A banner fixed to the bottom of the viewport sits last in most DOM orders (dozens of Tab presses away) and covers focused links behind it. If the design imposes a fixed banner, keep it early in the DOM and reserve its height with `scroll-padding-bottom` (see [../wcag-2.2-additions.md](../wcag-2.2-additions.md), 2.4.11).
- **Not a focus trap, and no focus grab.** A non-modal banner does not move focus to itself on load and does not keep focus inside. Trapping focus in something that does not look or behave like a dialog locks keyboard users in.
- **A named region.** `<section>` with `aria-labelledby` is a landmark that screen reader users can jump to. The title is a real heading; it comes before the `<h1>` of the page, which is accepted here because the banner is temporary and outside the page outline.
- **Buttons, all of them.** Every choice is a `<button>` with a text name, in the same style. A choice offered as a pale link, a bare "×", or text with a click handler is harder to see and to reach for some people than for others. Keyboard access and sufficient contrast for every choice are accessibility requirements; equal size and weight are good practice from the accessibility point of view, and the privacy part of this skill says what the law adds on that point.
- **After the choice.** The banner is hidden, a confirmation is announced through the status region, and focus goes to the main content if it was inside the banner.
- **Settings.** The panel is a native modal dialog: focus enters it, Escape and "Cancel" close it without changing anything, and focus returns to the button that opened it. If the dialog was opened from the banner and the banner is then hidden, the browser cannot return focus to it, so `closeBanner` sends focus to the main content. Each purpose is a `<fieldset>` with a `<legend>` and two native radio buttons. If you prefer a switch, use `<input type="checkbox" role="switch">` with a visible label, not a styled `<div>`.
- **Reopening.** A "Manage cookies" button is present on every page, at the same place, and opens the same dialog.
- **Text.** The information text is real text in the language of the page, at normal body size, with the same contrast as the rest of the page.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab, from the top of the page | Skip link, then the link and the three buttons of the banner, then the rest of the page |
| Enter or Space on "Accept all" or "Refuse all" | Records the choice, hides the banner, announces the result, moves focus to the main content |
| Enter or Space on "Choose by purpose" | Opens the settings dialog and moves focus to its title |
| In the dialog: Tab, arrows, Space | Move between groups, change a radio choice |
| In the dialog: Escape or "Cancel" | Closes without saving; focus returns to the button that opened it |

## Common mistakes

- A banner appended at the end of `<body>` and fixed to the bottom: last in the Tab sequence, and covering focused content.
- A full-screen overlay that is not a dialog: the page behind is still reachable by keyboard while invisible.
- Focus trapped in a non-modal banner, or forced into the banner at each page load.
- "Accept" as a large button and the other choice as small grey text, or reachable only after opening another layer.
- Choices built from `<div>`, `<span>` or `<a>` without `href`.
- Toggle switches made of `<div>` elements with no role, name or state.
- A banner that covers the whole screen at 200 % zoom or at 320 CSS pixels wide, with its buttons out of reach.
- The banner removed from the DOM while it holds focus, sending focus back to the top with no announcement.
- Low-contrast text, or text set smaller than the body text.
- A banner that disappears by itself after a delay or on scroll.
- A consent tool loaded from a third party in a language other than that of the page, with no `lang` attribute.

## Checklist

- [ ] The banner is a named region placed at the start of the page in the DOM, or a modal `<dialog>` [WCAG 1.3.1; RGAA 12.6]
- [ ] Every choice is a `<button>` with an explicit text name, reachable and operable with the keyboard [WCAG 2.1.1; RGAA 7.3]
- [ ] The text of every choice has a contrast ratio of at least 4.5:1, and every choice shows a visible focus indicator [WCAG 1.4.3; RGAA 3.2]
- [ ] All choices have the same size and the same visual weight, and need the same number of key presses to reach [best practice]
- [ ] A non-modal banner never completely covers the element that has keyboard focus, and does not trap focus [WCAG 2.4.11]
- [ ] A modal banner contains every choice, keeps focus inside while open, and the page behind is inert [WCAG 2.4.3; RGAA 7.1]
- [ ] After a choice, keyboard focus is on a logical element and the result is announced through a `role="status"` region [WCAG 4.1.3; RGAA 7.5]
- [ ] The settings panel uses native form controls grouped by `<fieldset>` and `<legend>`, or exposes role, name and state for each control [WCAG 4.1.2; RGAA 11.5, 11.6]
- [ ] At 320 CSS pixels wide and at 200 % zoom, the text and all the buttons can be reached without two-dimensional scrolling [WCAG 1.4.10; RGAA 10.11]
- [ ] The banner does not disappear on a timer [WCAG 2.2.1; RGAA 13.1]
- [ ] The control that reopens the settings is on every page, at the same place [WCAG 3.2.3; RGAA 12.2]
