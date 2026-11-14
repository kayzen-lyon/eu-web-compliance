# Multi-step form

A form split into several steps (checkout, registration, application), with a progress indicator, validation at each step and a review before sending.

## When to use it

- Split a form when it is long or when later questions depend on earlier answers. One topic per step lowers the load on memory and attention, and keeps error lists short.
- A short form (up to about seven fields on one topic) is better on one page.
- Prefer one real page per step, rendered by the server: the browser's back button, the page title and focus on load all work without script. The rules below also apply to steps swapped on the client; the extra work for that case is marked.

There is no ARIA Authoring Practices pattern for this. The component applies the form rules of [../rules.md](../rules.md), section 5, and three criteria that multi-step processes often break: 3.3.4 (review before a commitment), 3.3.7 (no redundant entry) and 2.2.1 (time limits). The code is original to this project.

## Reference implementation

One step of four. Illustration: a delivery address.

```html
<title>Delivery, step 2 of 4 - Order - Northwind</title>

<main id="main" tabindex="-1">
  <nav aria-label="Order progress">
    <ol class="steps">
      <li><a href="/order/contact">Contact details <span class="visually-hidden">(completed)</span></a></li>
      <li aria-current="step">Delivery</li>
      <li>Payment</li>
      <li>Review and confirm</li>
    </ol>
  </nav>

  <h1 id="step-title" tabindex="-1">Delivery <span class="step-count">(step 2 of 4)</span></h1>

  <div id="error-summary" class="error-summary" tabindex="-1" hidden>
    <h2 id="error-summary-title"></h2>
    <ul></ul>
  </div>

  <form method="post" action="/order/delivery" novalidate data-step>
    <fieldset>
      <legend>Delivery address</legend>

      <div class="field">
        <label for="address">Street and number (required)</label>
        <input id="address" name="address" type="text" autocomplete="street-address" required
               aria-describedby="address-error">
        <p id="address-error" class="field-error"></p>
      </div>

      <div class="field">
        <label for="postcode">Postal code (required)</label>
        <p id="postcode-hint">5 digits, for example 75011</p>
        <input id="postcode" name="postcode" type="text" inputmode="numeric" autocomplete="postal-code" required
               aria-describedby="postcode-hint postcode-error">
        <p id="postcode-error" class="field-error"></p>
      </div>

      <div class="field">
        <label for="city">City (required)</label>
        <input id="city" name="city" type="text" autocomplete="address-level2" required
               aria-describedby="city-error">
        <p id="city-error" class="field-error"></p>
      </div>
    </fieldset>

    <fieldset>
      <legend>Billing address</legend>
      <label><input type="checkbox" name="billing_same" checked> Same as the delivery address</label>
    </fieldset>

    <div class="step-actions">
      <a href="/order/contact">Back to contact details</a>
      <button type="submit">Continue to payment</button>
    </div>
  </form>
</main>
```

```css
.steps { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; padding: 0; list-style-position: inside; }
.steps [aria-current="step"] { font-weight: 700; text-decoration: underline; text-decoration-thickness: 3px; }
.field { margin-block: 1.25rem; }
.field label { display: block; font-weight: 700; }
.field input { width: 100%; max-width: 30rem; min-height: 2.75rem; font: inherit; border: 2px solid currentColor; }
.field input[aria-invalid="true"] { border-width: 4px; }
.field-error:not(:empty), .error-summary { border-inline-start: 4px solid currentColor; padding-inline-start: 0.75rem; }
.field-error:not(:empty) { font-weight: 700; }
.step-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.step-actions button { min-height: 2.75rem; padding: 0.5rem 1.25rem; font: inherit; }
:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
```

```js
const form = document.querySelector('form[data-step]');
const summary = document.getElementById('error-summary');
const pageTitle = document.title;

// One function per field: returns an empty string, or a message that names the field and says how to fix it.
const validators = {
  address: (value) => (value ? '' : 'Street and number: enter your address, for example 12 rue des Lilas'),
  postcode: (value) => (/^\d{5}$/.test(value) ? '' : 'Postal code: enter 5 digits, for example 75011'),
  city: (value) => (value ? '' : 'City: enter the name of your city'),
};

form.addEventListener('submit', (event) => {
  const errors = [];
  for (const [name, validate] of Object.entries(validators)) {
    const field = form.elements[name];
    const message = validate(field.value.trim());
    document.getElementById(`${field.id}-error`).textContent = message ? `Error: ${message}` : '';
    if (message) {
      field.setAttribute('aria-invalid', 'true');
      errors.push({ field, message });
    } else {
      field.removeAttribute('aria-invalid');
    }
  }
  if (errors.length === 0) return;   // the server validates again

  event.preventDefault();
  const heading = errors.length === 1 ? 'There is 1 error in this step' : `There are ${errors.length} errors in this step`;
  document.getElementById('error-summary-title').textContent = heading;
  summary.querySelector('ul').replaceChildren(...errors.map(({ field, message }) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${field.id}`;
    link.textContent = message;
    item.append(link);
    return item;
  }));
  summary.hidden = false;
  document.title = `Error: ${pageTitle}`;
  summary.focus();
});
```

Notes on the choices:

- **Where am I?** The step and the total are in the `<title>`, in the `<h1>` and in the progress list, where the current step carries `aria-current="step"`. Completed steps are links, so the person can go back and correct; future steps are plain text.
- **Errors.** On a failed submission, focus moves to a summary placed before the form. A screen reader reads its heading; each entry is a link to its field. Each field also shows its own message, tied with `aria-describedby`, and carries `aria-invalid="true"`. The summary receives focus instead of having `role="alert"`, so the message is heard once. Server-side validation renders the same summary and the same messages, keeps every value typed, and puts "Error:" at the start of the `<title>`.
- **Messages** name the field and say what a valid value looks like. "Invalid field" tells nothing to someone who cannot see which field turned red.
- **Required fields** say so in their label. Writing "(required)" in words avoids explaining an asterisk; if most fields are required, the reverse convention ("(optional)" on the others, announced before the form) is acceptable provided each required field still carries `required`.
- **No redundant entry.** The billing address is not asked again: one checkbox reuses the delivery address. Values from earlier steps are kept on the server and pre-filled when the person comes back. Nothing typed is lost after an error.
- **`novalidate`** turns off the browser's own validation bubbles, which disappear after a few seconds and are announced unevenly. The `required` attribute stays, because assistive technology announces it.
- **`autocomplete` tokens** let the browser and password managers fill personal data.
- **Back** is a link placed before the submit button in the DOM; the main action is the only submit button, so Enter in a field moves forward.

### The review step

Before a submission that commits the person (an order, a payment, a contract, a deletion), the last step shows everything entered, grouped by step, each group with a "Change" link whose name says what it changes (illustration: "Change the delivery address"). The final button states the action. For an order, its wording is constrained by consumer law, which the consumer part of this skill covers.

### Time limits

If the session can expire, warn before it does and let the person extend it with one action. The warning is a modal dialog ([modal-dialog.md](modal-dialog.md)) that opens at least 20 seconds before expiry, with a "Stay signed in" button. Save progress on the server at each step so that an expired session does not erase the work.

### Steps swapped on the client

When the step changes without a page load: update `document.title`; move focus to the `<h1>` of the new step (it has `tabindex="-1"`); push a history entry so that the browser's back button returns to the previous step; keep the entered values in state.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab / Shift+Tab | Move through progress links, fields and actions in visual order |
| Enter in a text field, or on "Continue" | Submits the step |
| After a failed submission | Focus is on the error summary; Tab reaches its links |
| Enter on a link of the summary | Moves focus to the field concerned |

## Common mistakes

- Steps shown as coloured circles with numbers and no text; the current step marked by colour only.
- The same `<title>` and the same `<h1>` on every step.
- Errors shown only as red borders; the page scrolls to the top with no message; or the form silently refuses to submit.
- A disabled "Continue" button that becomes active when the form is valid: no explanation of what is missing, and nothing to focus.
- The form emptied after a server-side error.
- Asking again for the email address, the name or the address already given.
- No way back without losing data; the browser's back button breaks the process.
- A countdown that ends the session without warning.
- One input per character for codes or dates, with focus that jumps automatically.
- Placeholders as the only labels in a compact layout.

## Checklist

- [ ] The current step and the number of steps are in the page title and in the main heading [WCAG 2.4.2; RGAA 8.6]
- [ ] Every field has a visible associated label, states when it is required, and carries the matching `autocomplete` token when it collects information about the user [WCAG 3.3.2; RGAA 11.1, 11.10, 11.13]
- [ ] After a failed submission, focus moves to an error summary, or to the first invalid field, and every error is described in text next to its field [WCAG 3.3.1; RGAA 11.10]
- [ ] Each error message names the field and gives the expected format or an example [WCAG 3.3.3; RGAA 11.11]
- [ ] Values already entered are kept after an error and when returning to a previous step, and nothing is asked twice within the process [WCAG 3.3.7]
- [ ] Before a legal or financial commitment, a review step lets the person check and correct everything [WCAG 3.3.4; RGAA 11.12]
- [ ] A session time limit is announced before it expires and can be extended [WCAG 2.2.1; RGAA 13.1]
- [ ] When steps change without a page load, the title is updated and focus moves to the heading of the new step [WCAG 2.4.3; RGAA 12.8]
- [ ] The current step in the progress list carries `aria-current="step"` and is distinguished visually by something other than colour [WCAG 1.4.1; RGAA 3.1]
