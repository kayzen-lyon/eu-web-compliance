# Modal dialog

A window that opens above the page and must be dealt with before returning to it: confirmation, short form, detail view.

## When to use it

- Use a modal when the person must answer or finish something before the page makes sense again. For content that can sit in the page, prefer an inline section or a disclosure ([accordion.md](accordion.md)): a modal interrupts, and interruptions cost more to people using a screen reader or magnification.
- The native `<dialog>` element opened with `showModal()` is enough for almost every case. It moves focus inside, makes the rest of the page inert, closes on Escape and gives focus back to the element that had it. Do not rebuild this with `<div role="dialog">` unless the project cannot use `<dialog>`.
- Do not open a modal on page load or on a timer (newsletter pop-ups): nobody asked for it, and it takes focus away from what the person was doing.

Behaviour follows the [Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) of the ARIA Authoring Practices Guide. The code below is original to this project.

## Reference implementation

Illustration: a confirmation before deleting. Adapt names and content.

```html
<button type="button" data-dialog-open="delete-address">Delete this address</button>

<dialog id="delete-address" aria-labelledby="delete-address-title">
  <h2 id="delete-address-title">Delete the address "Home"?</h2>
  <p>Orders already placed keep their delivery address.</p>
  <form method="dialog">
    <button value="cancel" autofocus>Cancel</button>
    <button value="confirm">Delete</button>
  </form>
</dialog>
```

```css
dialog {
  width: min(36rem, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  overflow: auto;                 /* long content scrolls inside the dialog */
  padding: 1.5rem;
  border: 2px solid currentColor; /* a real border survives forced-colours mode */
}
dialog::backdrop { background: rgb(0 0 0 / 0.6); }
html:has(dialog[open]) { overflow: hidden; } /* the page behind does not scroll */
```

```js
document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-dialog-open]');
  if (!opener) return;
  document.getElementById(opener.dataset.dialogOpen).showModal();
});

const dialog = document.getElementById('delete-address');
dialog.addEventListener('close', () => {
  if (dialog.returnValue !== 'confirm') return;
  // Run the confirmed action here. If it removes the button that opened the
  // dialog, move focus yourself to a logical place (see "Focus" below).
});
```

What the native element does here, with no extra script: a button inside `<form method="dialog">` closes the dialog and sets `returnValue`; Escape closes it; Tab stays inside; the page behind is not reachable by keyboard or by a screen reader; focus returns to the opener on close.

### Focus

Where focus lands on opening decides what a screen reader says first.

| Content of the dialog | Initial focus |
|-----------------------|---------------|
| Short message with buttons | The least destructive button (`autofocus` on "Cancel", as above) |
| Form | The first field |
| Long text, list or table | The title, made focusable: `<h2 tabindex="-1" autofocus>`, so that reading starts at the top |

On closing, the browser returns focus to the opener. Handle it yourself in two cases: the opener no longer exists (a deleted row: focus the next row, or the heading of the list), or the workflow continues elsewhere (after "Add a line", focus the new line).

### If `<dialog>` cannot be used

A custom modal must reproduce all of this: `role="dialog"`, `aria-modal="true"`, a name with `aria-labelledby`; focus moved inside on open; the `inert` attribute on every sibling of the dialog so nothing behind is reachable; Tab and Shift+Tab kept inside; Escape closes; focus restored on close. Missing any one of these produces the defects listed below.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Enter or Space on the opener | Opens the dialog and moves focus inside |
| Tab / Shift+Tab | Move between the controls of the dialog and wrap around; focus never reaches the page behind |
| Escape | Closes the dialog without confirming |
| Enter or Space on a button | Activates it |

## Common mistakes

- A `<div>` shown on top of the page with no focus management: keyboard focus stays behind it, and a screen reader user does not know anything opened.
- `dialog.show()` or the `open` attribute for something meant to be modal: the page behind stays reachable.
- No visible close or cancel button: touch and voice users have no Escape key.
- Focus sent back to the top of the page on close: the person loses their place.
- `role="dialog"` or `aria-modal` added to a native `<dialog>` opened with `showModal()`: redundant.
- A close button that is only "×" with no accessible name.
- A dialog taller than the viewport with no internal scrolling: at 200 % zoom the buttons are out of reach.
- Closing when the backdrop is clicked in a dialog that contains a form: a slip of the pointer discards the input. Keep that convenience for dialogs with nothing to lose.

## Checklist

- [ ] The dialog is a `<dialog>` opened with `showModal()`, or exposes `role="dialog"` and `aria-modal="true"` [WCAG 4.1.2; RGAA 7.1]
- [ ] It has an accessible name taken from its visible title with `aria-labelledby` [WCAG 4.1.2; RGAA 7.1]
- [ ] Opening it moves focus inside, to the place chosen from the table above [WCAG 2.4.3; RGAA 12.8]
- [ ] While it is open, nothing behind it can be reached with Tab or with a screen reader [WCAG 2.4.3; RGAA 7.1]
- [ ] It closes with Escape and with a visible, named button [WCAG 2.1.2; RGAA 12.9]
- [ ] Closing it returns focus to the opener, or to a logical place if the opener is gone [WCAG 2.4.3; RGAA 12.8]
- [ ] At 320 CSS pixels wide and at 200 % zoom, all its content and buttons can be reached by scrolling inside it [WCAG 1.4.10; RGAA 10.11]
- [ ] It opens only at the request of the person [best practice]
