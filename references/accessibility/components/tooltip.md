# Tooltip

A short text that appears next to a control when it is hovered or focused.

## When to use it

- First ask whether the text can simply be visible. A hint under a field, or a visible label on a button, serves everyone, including touch users, who have no hover. Tooltips are for supplementary information that the interface works without.
- Never put essential instructions, error messages or interactive content (links, buttons) in a tooltip. Content with controls belongs in a disclosure ([accordion.md](accordion.md)) or a dialog ([modal-dialog.md](modal-dialog.md)).
- The native `title` attribute is not a usable tooltip: it does not appear on keyboard focus or on touch, it cannot be enlarged, and it vanishes by itself. Do not rely on it to carry information.

The ARIA Authoring Practices Guide marks its [Tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) as work in progress without consensus. The implementation below follows what that page states (appears on focus and hover, Escape dismisses, never receives focus) and the three conditions of WCAG 1.4.13: dismissible, hoverable, persistent. The code is original to this project.

## Reference implementation

Illustration: an icon button whose tooltip adds a detail to its name.

```html
<span class="tooltip-host">
  <button type="button" class="icon-button" aria-label="Notifications" aria-describedby="tip-notifications">
    <svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1z"/>
    </svg>
  </button>
  <span role="tooltip" id="tip-notifications" class="tooltip" hidden>3 unread messages</span>
</span>
```

```css
.tooltip-host { position: relative; display: inline-block; }
.icon-button { min-width: 2.75rem; min-height: 2.75rem; }
.tooltip {
  position: absolute;
  top: 100%;            /* touches the button: no gap for the pointer to fall into */
  left: 0;
  z-index: 20;
  width: max-content;
  max-width: min(20rem, 90vw);
  padding: 0.5rem 0.75rem;
  background: CanvasText;
  color: Canvas;
  border: 1px solid Canvas;
}
```

```js
for (const host of document.querySelectorAll('.tooltip-host')) {
  const tooltip = host.querySelector('[role="tooltip"]');
  const show = () => { tooltip.hidden = false; };
  const hide = () => { tooltip.hidden = true; };
  host.addEventListener('mouseenter', show);   // the host contains the tooltip,
  host.addEventListener('mouseleave', hide);   // so hovering the tooltip keeps it open
  host.addEventListener('focusin', show);
  host.addEventListener('focusout', hide);
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  for (const tooltip of document.querySelectorAll('[role="tooltip"]:not([hidden])')) {
    tooltip.hidden = true;
  }
});
```

Notes on the choices:

- `aria-describedby` makes the screen reader read the tooltip text after the name of the button. This works even while the tooltip is hidden, so the information does not depend on the visual bubble.
- The tooltip is a description, not the name. The button keeps its own accessible name (`aria-label="Notifications"`). If the bubble only repeats the name, drop `aria-describedby` and hide the bubble from assistive technology with `aria-hidden="true"`, or it is read twice.
- No timer: the bubble stays until the pointer leaves, focus moves or Escape is pressed. People who read slowly or with magnification need the time.
- Escape hides the bubble without moving focus or pointer. Inside a dialog, the same key press will also close the dialog; if that is a problem, handle Escape on the host and stop its propagation when a tooltip was open.
- The bubble is positioned against the trigger with no gap, and inside the same wrapper, so the pointer can travel onto it. Check that it does not cover the control it describes or the next field.

### When the help must be available on touch screens

Use a toggle button instead of hover: a "Help" button with `aria-expanded` that reveals a paragraph placed right after it, exactly like a disclosure. It works with every input method and is the safer default for form help.

```html
<label for="iban">IBAN</label>
<input id="iban" name="iban" type="text" aria-describedby="iban-help">
<button type="button" aria-expanded="false" aria-controls="iban-help">Help<span class="visually-hidden"> about the IBAN</span></button>
<p id="iban-help" hidden>The IBAN is printed on your bank details. It starts with two letters, for example FR76.</p>
```

The script is the one-line toggle shown in [accordion.md](accordion.md), implementation B.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab to the control | The tooltip appears; focus stays on the control |
| Escape | The tooltip disappears; focus does not move |
| Tab away | The tooltip disappears |

The tooltip itself never receives focus.

## Common mistakes

- Tooltip shown on `mouseenter` only: keyboard users never see it.
- CSS-only tooltip (`:hover` without `:focus-within`) that cannot be dismissed without moving the pointer, and covers neighbouring content for magnifier users.
- Tooltip that disappears after two or three seconds.
- A gap between trigger and bubble: the bubble closes while the pointer crosses the gap.
- The only label of an icon button placed in a tooltip that is not tied to it: the button has no name.
- Links or buttons inside the bubble: unreachable by keyboard.
- Truncated text (`text-overflow: ellipsis`) whose full version exists only in a `title` attribute.

## Checklist

- [ ] The information is supplementary; nothing needed to use the page is only in the tooltip [best practice]
- [ ] The tooltip appears on keyboard focus as well as on hover [WCAG 2.1.1; RGAA 10.14]
- [ ] It can be dismissed with Escape without moving focus or pointer [WCAG 1.4.13; RGAA 10.13]
- [ ] The pointer can move over it without it disappearing, and it does not vanish on a timer [WCAG 1.4.13; RGAA 10.13]
- [ ] It has `role="tooltip"` and is tied to its control with `aria-describedby` [WCAG 4.1.2; RGAA 7.1]
- [ ] The control has its own accessible name, independent of the tooltip [WCAG 4.1.2; RGAA 11.9]
- [ ] It contains no focusable element [WCAG 2.1.1; RGAA 12.11]
- [ ] Its text has a contrast ratio of at least 4.5:1 and stays inside the viewport at 320 CSS pixels wide [WCAG 1.4.3; RGAA 3.2]
