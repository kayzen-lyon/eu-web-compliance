# Status and error messages (live regions)

Messages that appear without a page reload and without moving focus: confirmations, result counts, loading states, errors, toasts.

## When to use it

- A sighted person notices new text on the screen. A screen reader speaks only what has focus, unless the page marks a zone as "live": text written into a live region is announced wherever the person is.
- Use a live region when something changes and focus should stay where it is (illustrations: "Item added to basket", "12 results", "Saved", "Connection lost").
- Do not use one when the change deserves focus. After a failed form submission, move focus to the error summary ([multi-step-form.md](multi-step-form.md)). After opening a dialog, focus goes into the dialog. A message announced and focus moved at the same time is heard twice, or the second cuts the first.
- The native `<output>` element has the status role and suits a value computed from form fields. `role="status"` and `role="alert"` on a `<div>` cover the other cases.

The [Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) of the ARIA Authoring Practices Guide states that an alert must not move focus, should not disappear automatically, and that screen readers do not announce alerts already present when the page loads. The code below is original to this project.

## Which role for which message

| Message | Markup | How it is announced |
|---------|--------|---------------------|
| Success, result of an action, number of results, state of the application | `role="status"` | When the screen reader finishes what it is saying |
| Error, warning that needs attention now, suggestion after an error | `role="alert"` | Immediately, interrupting speech |
| Progress of an operation | `<progress>` with a label, `role="progressbar"`, or `role="status"` for text steps | As a value, or politely |
| Running history (chat, activity log) | `role="log"` | New entries, politely |

Keep `role="alert"` for what truly cannot wait. An interface that interrupts for routine confirmations trains people to ignore it, and makes it hard to use for those who rely on speech.

## Reference implementation

Two regions, present and empty in the HTML sent by the server, placed at the end of `<body>`:

```html
<div id="status-region" role="status" class="visually-hidden"></div>
<div id="alert-region" role="alert" class="visually-hidden"></div>
```

```js
function announce(message, { urgent = false } = {}) {
  const region = document.getElementById(urgent ? 'alert-region' : 'status-region');
  region.textContent = '';                                         // so that the same message can be announced twice
  window.setTimeout(() => { region.textContent = message; }, 100);
}

// Illustrations
announce('Blue jacket added to your basket. 3 items in the basket.');
announce('24 results for "rain jacket"');
announce('Your session expires in 2 minutes.', { urgent: true });
```

The visually-hidden class is in [../rules.md](../rules.md), section 1. The regions are hidden visually because, in this setup, sighted users get the information elsewhere on screen (the basket counter changes, the results appear). If nothing visible changes, show the message.

### Visible messages (toasts, banners)

The visible container is not a live region: `role="status"` implies `aria-atomic="true"`, so every new toast would make the screen reader read all the toasts again, and the close button name would repeat the message. The message is announced once through the status region above (`announce()`); the toast is the visual copy.

```html
<div id="toasts" class="toasts"></div>
```

```css
.toasts { position: fixed; inset-block-end: 1rem; inset-inline: 1rem; display: grid; gap: 0.5rem; z-index: 50; }
.toast {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.75rem 1rem;
  background: Canvas; color: CanvasText;
  border: 2px solid currentColor;
}
.toast button { min-height: 2.75rem; padding: 0.5rem 0.75rem; font: inherit; }
```

```js
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const text = document.createElement('p');
  text.textContent = message;
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close';
  close.setAttribute('aria-label', `Close: ${message}`);
  close.addEventListener('click', () => {
    const toasts = document.getElementById('toasts');
    toast.remove();
    (toasts.querySelector('button') ?? document.querySelector('main')).focus();
  });
  toast.append(text, close);
  document.getElementById('toasts').append(toast);
  announce(message);   // the one announcement, through the status region
}
```

Notes on the choices:

- The toast stays until it is closed. A message that disappears after a few seconds is missed by people who read slowly, who use magnification and are looking elsewhere, or whose screen reader was busy speaking. If the design insists on automatic dismissal, limit it to messages that repeat information visible elsewhere, keep them long enough to be read at a slow pace, and pause the timer while the toast is hovered or focused.
- A toast must not be the only place where an action lives ("Undo", "View basket"). Reaching a toast by keyboard is slow, since it sits at the end of the page; offer the same action in the page as well.
- Closing a toast moves focus to another toast or to the main content (`<main tabindex="-1">`), because the button that had focus is removed.
- Fixed toasts can hide the focused element at the bottom of the page: keep them small, and see [../wcag-2.2-additions.md](../wcag-2.2-additions.md), 2.4.11.
- The type of message (success, error) is written in words or shown with an icon that has a text alternative, not carried by colour alone.

### Loading states

```html
<section aria-labelledby="results-title" aria-busy="false">
  <h2 id="results-title">Results</h2>
  <ul id="results"></ul>
</section>
```

Set `aria-busy="true"` on the section while it is being updated, call `announce('Loading results')` if the wait is noticeable, then set `aria-busy="false"` and announce the outcome ("24 results", or "No result for this search"). A spinner image alone is silent; if one is shown, give it a text alternative or hide it and rely on the announcement.

### Messages present when the page loads

A message rendered by the server (illustration: "Your changes were saved" after a redirect) is not announced just because it has `role="alert"`: live regions report changes, and at load nothing changes. Put such a message at the start of `<main>`, and for errors move focus to it on load. Including it in the `<title>` of the page ("Saved: Profile, Site name") makes it the first thing a screen reader says.

## Expected keyboard behaviour

Live regions do not receive focus and need no key. Controls inside a visible message (close button, action link) are ordinary buttons and links, reached with Tab and activated with Enter or Space.

## Common mistakes

- A message inserted with no role: sighted users see "Saved", screen reader users hear nothing.
- A live region created and filled in the same script step: often not announced. Create the region first, empty.
- `aria-live` on a large container (the whole results list, the whole form): every change inside is read out, at length.
- `role="alert"` for every message, or on an element that is re-rendered on each keystroke.
- Both `role="alert"` and focus moved to the message.
- Validation errors announced while the person is still typing in the field.
- Toasts that vanish on a timer and contain the only "Undo".
- A loading spinner with no text, and no announcement when loading ends.
- Messages written in English in a page in another language.

## Checklist

- [ ] Each message that appears without a reload and without receiving focus is in an element with `role="status"`, `role="alert"`, `role="log"` or `role="progressbar"` suited to its nature [WCAG 4.1.3; RGAA 7.5]
- [ ] The live region exists in the DOM before the message is written into it [best practice]
- [ ] `role="alert"` is used only for errors and urgent warnings [best practice]
- [ ] A message that the person needs to read or act on does not disappear on a timer [WCAG 2.2.1; RGAA 13.1]
- [ ] The nature of a visible message (error, success) is given in text or by an icon with a text alternative, not by colour alone [WCAG 1.4.1; RGAA 3.1]
- [ ] Controls inside a visible message are reachable and operable with the keyboard, and closing the message leaves focus on a logical element [WCAG 2.1.1; RGAA 7.3]
- [ ] A fixed message does not completely cover the element that has keyboard focus [WCAG 2.4.11]
- [ ] A message present at page load is placed at the start of the main content, and receives focus if it reports errors [best practice]
