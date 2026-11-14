# Anti-patterns: forms and authentication

Labels, errors, required fields, autocomplete, login, CAPTCHA, time limits. Severity levels, the way to read "Detect" lines and the machine-readable patterns are in [anti-patterns.md](anti-patterns.md). The examples are illustrations: recognise the pattern, do not copy the wording.

### AP-FRM-01 · Field without a label

The screen reader announces "edit text" with no subject. Voice control cannot target the field. Clicking the nearby text does not put focus in the field.

- Severity: blocking. Criterion: WCAG 3.3.2, 4.1.2; RGAA 11.1.
- Detect: a form control with no `id` (so no `<label for>` can point to it) and no `aria-label`, `aria-labelledby` or `title`, unless it is wrapped in a `<label>`. A DOM checker computes the accessible name instead.

Bad:
```html
<input type="text" name="lastname">
```

Good:
```html
<label for="lastname">Last name</label>
<input id="lastname" name="lastname" type="text" autocomplete="family-name">
```

### AP-FRM-02 · Placeholder used as the label

The instruction disappears at the first character typed. People who are interrupted, or who have memory or attention difficulties, no longer know what the field expects; default placeholder contrast is low; the field cannot be checked once filled.

- Severity: major. Criterion: WCAG 3.3.2; RGAA 11.1, 11.4.
- Detect: a field that has a `placeholder` and an `aria-label` but no `id` for a visible `<label>`: its only visible text is the placeholder.

Bad:
```html
<input type="email" name="email" placeholder="Your email" aria-label="Your email">
```

Good:
```html
<label for="email">Email address</label>
<p id="email-hint">For example: name@example.org</p>
<input id="email" name="email" type="email" autocomplete="email" aria-describedby="email-hint">
```

### AP-FRM-03 · `<label>` not tied to its field

The label is on screen but nothing links it to the field in code, so the field has no name for assistive technology. Frequent when `for` and `id` do not match, or in JSX when `for` is written instead of `htmlFor`.

- Severity: blocking. Criterion: WCAG 3.3.2, 4.1.2; RGAA 11.1.
- Detect: a `<label>` with no `for` (or `htmlFor`) that does not contain a form control; and, in a DOM checker, a `for` value that matches no `id`.

Bad:
```html
<label>Phone number</label>
<input type="tel" name="phone">
```

Good:
```html
<label for="phone">Phone number</label>
<input id="phone" name="phone" type="tel" autocomplete="tel">
```

### AP-FRM-04 · Error shown by style only, or not tied to its field

A red border is invisible to people who do not see that colour and silent for a screen reader. A message placed nearby but not linked in code is not read when the person returns to the field.

- Severity: major. Criterion: WCAG 3.3.1; RGAA 11.10.
- Detect: a field with an "error" or "invalid" class and no `aria-invalid`. Then check that the message is text, names the field and is referenced by `aria-describedby`.

Bad:
```html
<label for="zip">Postal code</label>
<input id="zip" name="zip" class="input is-invalid">
<span class="red">!</span>
```

Good:
```html
<label for="zip">Postal code</label>
<input id="zip" name="zip" autocomplete="postal-code" aria-invalid="true" aria-describedby="zip-error">
<p id="zip-error">Error: enter the 5 digits of the postal code, for example 75011</p>
```

### AP-FRM-05 · Required field marked by an asterisk or a colour only

An unexplained asterisk means nothing to someone who does not know the convention, and a colour is not announced. Without `required` or `aria-required`, a screen reader does not say that the field is mandatory.

- Severity: major. Criterion: WCAG 3.3.2; RGAA 11.10.
- Detect: a label containing `*` followed by a field with neither `required` nor `aria-required`.

Bad:
```html
<label for="name">Name <span class="red">*</span></label>
<input id="name" name="name" type="text">
```

Good:
```html
<label for="name">Name (required)</label>
<input id="name" name="name" type="text" autocomplete="name" required>
```

### AP-FRM-06 · Personal data field without `autocomplete`

The browser cannot fill the field. People for whom typing is slow or error-prone (switch, voice, tremor, dyslexia) must enter each value by hand, on every site.

- Severity: minor. Criterion: WCAG 1.3.5; RGAA 11.13.
- Detect: an `<input>` whose `name`, `id` or `type` denotes a piece of information about the user and that has no `autocomplete` attribute.

Bad:
```html
<label for="email">Email address</label>
<input id="email" name="email" type="email">
```

Good:
```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email">
```

### AP-FRM-07 · Paste or password manager blocked

Blocking paste or autofill forces the person to memorise and type a password or a code. People who cannot do that reliably cannot sign in at all.

- Severity: blocking. Criterion: WCAG 3.3.8.
- Detect: a `paste` handler that cancels the event, or `autocomplete="off"` on a password field.

Bad:
```html
<label for="pwd">Password</label>
<input id="pwd" name="password" type="password" autocomplete="off" onpaste="return false">
```

Good:
```html
<label for="pwd">Password</label>
<input id="pwd" name="password" type="password" autocomplete="current-password">
```

### AP-FRM-08 · One input box per character

A code split over four or six boxes cannot be pasted or autofilled in one go. Each box is announced without a meaningful label, and focus that jumps by itself disorients screen reader and magnifier users.

- Severity: major. Criterion: WCAG 3.3.8.
- Detect: three or more consecutive inputs with `maxlength="1"`.

Bad:
```html
<input maxlength="1" name="c1"> <input maxlength="1" name="c2">
<input maxlength="1" name="c3"> <input maxlength="1" name="c4">
```

Good:
```html
<label for="otp">Code received by text message (6 digits)</label>
<input id="otp" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code">
```

### AP-FRM-09 · Radio buttons or checkboxes without a group label

The question is displayed above the options but is not part of any of them. A screen reader reads "Yes, radio button, 1 of 2" without the question.

- Severity: major. Criterion: WCAG 1.3.1; RGAA 11.5, 11.6.
- Detect: radio buttons that are not inside a `<fieldset>` with a `<legend>`, nor inside a named `role="group"` or `role="radiogroup"`.

Bad:
```html
<p>Do you have a customer account?</p>
<label><input type="radio" name="account" value="yes"> Yes</label>
<label><input type="radio" name="account" value="no"> No</label>
```

Good:
```html
<fieldset>
  <legend>Do you have a customer account?</legend>
  <label><input type="radio" name="account" value="yes"> Yes</label>
  <label><input type="radio" name="account" value="no"> No</label>
</fieldset>
```

### AP-FRM-10 · Field that navigates or submits when its value changes

A keyboard user browsing a `<select>` with the arrow keys changes its value at each press: the page leaves on the first option. A screen reader user gets a new page without having asked for one.

- Severity: major. Criterion: WCAG 3.2.2; RGAA 7.4.
- Detect: a `change` handler that sets the location, submits a form or opens a window.

Bad:
```html
<label for="lang">Language</label>
<select id="lang" onchange="location = this.value">
  <option value="/fr">Français</option>
  <option value="/en">English</option>
</select>
```

Good:
```html
<form action="/language" method="get">
  <label for="lang">Language</label>
  <select id="lang" name="lang">
    <option value="fr" lang="fr">Français</option>
    <option value="en" lang="en">English</option>
  </select>
  <button type="submit">Change language</button>
</form>
```

### AP-FRM-11 · Submit button disabled until the form is valid

A disabled button cannot be focused and gives no reason. The person does not learn which field is missing or wrong, and low-contrast disabled styling makes the button hard to see at all.

- Severity: minor. Criterion: best practice (no official criterion).
- Detect: a submit button rendered with `disabled`. Prefer an enabled button and errors explained on submission.

Bad:
```html
<button type="submit" disabled>Create my account</button>
```

Good:
```html
<button type="submit">Create my account</button>
<!-- on submit: list the errors and move focus to the summary (components/multi-step-form.md) -->
```

### AP-FRM-12 · Error message that does not say how to fix the error

"Invalid input" names neither the field nor the expected value. The person tries again at random; each attempt costs more to someone who types slowly or with a switch.

- Severity: major. Criterion: WCAG 3.3.3; RGAA 11.11.
- Detect: a text node that is only a generic error phrase. Whether any other message is helpful needs a person.

Bad:
```html
<p class="error">Invalid input</p>
```

Good:
```html
<p id="phone-error">Error: enter a phone number with 10 digits, for example 06 12 34 56 78</p>
```

### AP-FRM-13 · Native control hidden with `display: none` behind a custom one

A checkbox, radio button or file input hidden with `display: none` or `visibility: hidden` leaves the Tab sequence and the accessibility tree. The styled replacement is a picture of a control: it cannot be focused or operated with the keyboard.

- Severity: blocking. Criterion: WCAG 2.1.1, 4.1.2; RGAA 7.3, 7.1.
- Detect: a CSS rule that hides a checkbox, radio or file input with `display: none` or `visibility: hidden`.

Bad:
```css
input[type="checkbox"] { display: none; }
input[type="checkbox"] + label::before { content: ""; /* drawn box */ }
```

Good:
```css
/* The real checkbox stays focusable; it is only made invisible. */
input[type="checkbox"].custom {
  position: absolute;
  opacity: 0;
  width: 1.5rem;
  height: 1.5rem;
}
input[type="checkbox"].custom:focus-visible + label::before { outline: 3px solid currentColor; outline-offset: 2px; }
```

### AP-FRM-14 · CAPTCHA with no alternative

Distorted text, image grids, sliders and audio challenges each lock out people who cannot see, hear, solve or perform them. With no other route, the function behind the CAPTCHA is closed to them.

- Severity: blocking. Criterion: WCAG 1.1.1, 3.3.8; RGAA 1.5.
- Detect: presence of a CAPTCHA component. Then check by hand which challenges it can show and whether a route with no challenge exists (see `fallbacks.md`).

Bad:
```html
<img src="/captcha.png" alt="CAPTCHA">
<input name="captcha">
```

Good:
```html
<!-- No challenge shown: rate limiting and a hidden trap field on the server side, -->
<!-- and confirmation of the request by a link sent by email. -->
<button type="submit">Send the request</button>
```

### AP-FRM-15 · Session that expires without warning

People who read, type or navigate slowly are signed out in the middle of a form and lose what they entered.

- Severity: major. Criterion: WCAG 2.2.1; RGAA 13.1.
- Detect: a timer that signs out or redirects. Then check that a warning with a way to extend comes first.

Bad:
```js
setTimeout(() => { window.location.href = '/logout'; }, 15 * 60 * 1000);
```

Good:
```js
// Two minutes before the limit, a dialog offers to stay signed in.
setTimeout(() => document.getElementById('session-warning').showModal(), 13 * 60 * 1000);
stayButton.addEventListener('click', () => fetch('/session/extend', { method: 'POST' }));
```

### AP-FRM-16 · Asking again for information already given

Typing an email address twice, or a billing address identical to the delivery address, is one more occasion for error and fatigue for people with memory or motor difficulties.

- Severity: major. Criterion: WCAG 3.3.7.
- Detect: a "confirm" field for a value that is displayed in clear, or the same field names repeated across the steps of one process with no pre-filling. A new password that is not displayed may be asked twice.

Bad:
```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email">
<label for="email2">Confirm your email address</label>
<input id="email2" name="email_confirmation" type="email">
```

Good:
```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email">
<!-- The address is shown again for checking at the review step, with a "Change" link. -->
```
