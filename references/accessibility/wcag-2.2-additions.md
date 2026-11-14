# The six success criteria added by WCAG 2.2 at levels A and AA

Read this file when you write a sticky header or banner, anything draggable, small controls, a help link, a multi-step process or a login.

WCAG 2.2 adds six success criteria at levels A and AA to those of WCAG 2.1. The French RGAA 4.1.2 is built on WCAG 2.1 and has no criterion for them, so an RGAA check will not catch these defects. Which version is legally required for a given site is stated in [../regulatory-status.md](../regulatory-status.md); the generation rules of this skill apply all six in every case, because they cost little when applied from the start.

Each section describes the requirement in this project's own words. The normative text is at the linked address and prevails. The "how to check" steps that need a person are repeated in [testing-by-hand.md](testing-by-hand.md).

| Criterion | Level | In one line |
|-----------|-------|-------------|
| [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum) | AA | The focused element is never completely covered by something the page put there |
| [2.5.7 Dragging Movements](https://www.w3.org/TR/WCAG22/#dragging-movements) | AA | Whatever dragging does, clicks or taps can do too |
| [2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum) | AA | Targets are 24 by 24 CSS pixels, or spaced out |
| [3.2.6 Consistent Help](https://www.w3.org/TR/WCAG22/#consistent-help) | A | Help sits at the same place in the page order on every page |
| [3.3.7 Redundant Entry](https://www.w3.org/TR/WCAG22/#redundant-entry) | A | A process does not ask twice for the same information |
| [3.3.8 Accessible Authentication (Minimum)](https://www.w3.org/TR/WCAG22/#accessible-authentication-minimum) | AA | Logging in does not depend on memory, transcription or a puzzle |

## 2.4.11 Focus Not Obscured (Minimum)

**Who it is for.** A sighted keyboard user follows the focus indicator. When the focused control slides under a sticky bar, they are typing blind.

**What it requires.** When a component receives keyboard focus, content created by the page does not hide it entirely. Partly covered is tolerated at this level. Content that the user opened themselves and that closes when focus moves away (a menu, a date picker, a tooltip) is not a failure; persistent content they opened (a chat window) is tolerated if they can uncover the focused element without moving focus, for instance with Escape.

- [ ] No sticky header, sticky footer, cookie banner or floating widget completely covers an element that has keyboard focus [WCAG 2.4.11]
- [ ] A banner or panel that overlaps the page is either modal (focus is kept inside until it is closed) or laid out so that it pushes content instead of covering it [WCAG 2.4.11]

**How to satisfy it in code.**

```css
/* Reserve the space taken by sticky bars when the browser scrolls a focused element into view. */
html {
  scroll-padding-top: 5rem;     /* height of the sticky header */
  scroll-padding-bottom: 4rem;  /* height of the sticky footer or banner */
}
```

- Keep the reserved space in sync with the real height of the bars, including at narrow widths and high zoom where a header wraps onto several lines. A CSS custom property set by a `ResizeObserver` does this reliably.
- At small viewport heights, stop making bars sticky (`@media (max-height: 30rem) { .site-header { position: static; } }`): at 400 % zoom a sticky header can fill half the screen.
- A non-modal consent banner fixed at the bottom is the typical failure. See [components/consent-banner-shell.md](components/consent-banner-shell.md).

**How to check.** Tab forward through the whole page, then Shift+Tab backward, at normal size and again at 320 CSS pixels wide. At each stop, some part of the focused element must be visible. Forward tabbing reveals problems with bottom bars, backward tabbing with top bars. A script can compare the bounding box of `document.activeElement` with those of fixed and sticky elements, but a person must confirm.

## 2.5.7 Dragging Movements

**Who it is for.** People who cannot hold a button down while moving: tremor, use of a head pointer, an eye tracker, a mouth stick or voice control.

**What it requires.** Every function operated by dragging can also be operated with a single pointer without dragging, unless dragging is essential or the behaviour belongs to the browser and has not been altered (native scrolling, for instance). A keyboard alternative is required by 2.1.1 but does not satisfy this criterion by itself: the alternative must be something a pointer can click or tap.

- [ ] Each drag interaction (reordering, moving cards between columns, custom slider, resizable panel, map panning, drawing a selection) has an equivalent made of clicks or taps [WCAG 2.5.7]

**How to satisfy it in code.** Illustrations; choose what fits the interface.

| Drag interaction | Alternative without dragging |
|------------------|------------------------------|
| Reordering a list | "Move up" and "Move down" buttons on each item |
| Moving a card between columns | A "Move to..." menu on the card |
| Custom slider | Click on the track, plus and minus buttons, or a number field next to it |
| Map panning | Arrow buttons and zoom buttons |
| Resizing a panel | Buttons or a field that set the size |
| Carousel swipe | Previous and next buttons |

```html
<li>
  <span>Quarterly report</span>
  <button type="button" data-move="up">Move up<span class="visually-hidden">: Quarterly report</span></button>
  <button type="button" data-move="down">Move down<span class="visually-hidden">: Quarterly report</span></button>
</li>
```

Buttons also give the keyboard access required by 2.1.1. After a move, keep focus on the button that was used and announce the new position in a `role="status"` region.

**How to check.** List every interaction that uses `dragstart`, `pointermove` after `pointerdown`, `touchmove`, or a drag-and-drop library. For each, complete the same task with single clicks only.

## 2.5.8 Target Size (Minimum)

**Who it is for.** People with tremor or limited dexterity, people using a finger on a small screen, and anyone whose pointer is not precise.

**What it requires.** The area that accepts the pointer action is at least 24 by 24 CSS pixels. Exceptions: a smaller target whose 24-pixel circle, centred on it, overlaps neither another target nor the circle of another small target; a target inside a sentence or constrained by the line height of surrounding text; a control whose size the browser decides and the author has not changed; a function available through another, compliant control on the same page; a presentation that is essential or legally required.

What counts is the clickable area, not the visible glyph: a 16-pixel icon inside a button with enough padding passes. Zooming does not help, because CSS pixel sizes do not change with zoom.

- [ ] Each control that is not a link in a sentence accepts pointer input over at least 24 by 24 CSS pixels, or is spaced so that a 24-pixel circle centred on it meets no other target [WCAG 2.5.8]

**How to satisfy it in code.**

```css
/* Icon buttons, close buttons, pagination links, tags, chips */
.icon-button {
  min-width: 24px;
  min-height: 24px;
  display: inline-grid;
  place-items: center;
}

/* Native checkboxes and radios: let the label carry the target */
.choice { display: flex; align-items: center; gap: 0.5rem; min-height: 24px; }
```

- Usual offenders: close "×" buttons, carousel dots, pagination numbers, icon links in footers, "show password" toggles, table row actions, stacked links in a compact list.
- 24 pixels is the floor of level AA. Larger targets are easier for everyone; see section 12 of [rules.md](rules.md).

**How to check.** A script can measure `getBoundingClientRect()` of every focusable or clickable element and report those under 24 pixels in either dimension, then test the spacing rule on the reported ones. Results on inline links and unstyled native controls are exceptions, not failures.

## 3.2.6 Consistent Help

**Who it is for.** People with cognitive or learning disabilities who need help more often and should not have to hunt for it on each page.

**What it requires.** If a set of pages offers one of these help mechanisms on several pages, it appears in the same order relative to the other repeated content on each of them: contact details of a person (phone, email, opening hours); a way to contact a person (contact form, chat with staff); self-help (FAQ, help page); a fully automated contact mechanism (chatbot). The order is the order in the code, for a given layout variation. The criterion does not oblige a site to offer help.

- [ ] A help or contact mechanism repeated across pages is placed at the same position in the source order of each page, relative to the other repeated blocks [WCAG 3.2.6]

**How to satisfy it in code.**

- Put help links in a shared layout component (header or footer template), not in individual page templates.
- If the help is a link to a contact page, the link is the mechanism: its position is what must stay constant.
- A floating chat launcher is injected at the same place in the DOM on every page (illustration: always the last child of `<body>`), not wherever a script happens to run.
- A checkout or login flow with a reduced header keeps the help link, in the same relative order.

**How to check.** On several pages of the set, list the repeated blocks in source order (logo, navigation, search, help, footer links...). The help item must have the same neighbours before and after it. A script can compare this sequence across pages when repeated blocks have stable selectors.

## 3.3.7 Redundant Entry

**Who it is for.** People with memory or attention difficulties for whom recalling and retyping is the point of failure, and people for whom every keystroke is costly (switch, voice, mouth stick).

**What it requires.** Within one process (a checkout, a registration, a multi-step request), information that the person already entered, or that the site already gave them, and that is needed again is filled in by the site or offered for selection. Exceptions: re-entry is essential to the activity; the information is needed again for security (confirming a new password that is not displayed); the earlier information is no longer valid. The scope is the process, not later visits. Browser autofill does not count: the site itself supplies the value.

- [ ] In a multi-step process, a value entered in an earlier step is pre-filled or selectable wherever it is needed again [WCAG 3.3.7]

**How to satisfy it in code.**

```html
<fieldset>
  <legend>Billing address</legend>
  <label>
    <input type="checkbox" name="billing_same" checked>
    Same as delivery address
  </label>
  <!-- Billing fields are shown, pre-filled, when the box is unticked -->
</fieldset>
```

- Keep the data of earlier steps in the server session or in page state, and pre-fill later steps from it.
- After a failed submission, return the form with every value the person typed. An emptied form after an error is the most common breach.
- Do not ask to type an email address twice "to confirm"; show it for review instead.
- Reference implementation: [components/multi-step-form.md](components/multi-step-form.md).

**How to check.** Go through each process once and note every piece of information requested. Any item requested twice must be pre-filled or selectable the second time, or fall under an exception. Submit one step with an error and confirm that nothing typed was lost.

## 3.3.8 Accessible Authentication (Minimum)

**Who it is for.** People who cannot reliably memorise a password, copy a code from one place to another or solve a puzzle: memory impairment, dyslexia, dyscalculia, some cognitive disabilities.

**What it requires.** No step of an authentication process depends on a cognitive function test (remembering, transcribing, calculating, solving a puzzle), unless that step also offers one of: another method without such a test; a mechanism that helps complete it (a password manager filling the field, pasting); a test that consists of recognising objects; a test that consists of identifying non-text content the user themselves provided. A password field passes when password managers and pasting work. Typing a one-time code passes when the code can be pasted and the browser can fill it. Every step counts, including the second factor and any CAPTCHA shown during login.

- [ ] **Login, second-factor and password-reset fields accept pasting and filling by a password manager.** No script blocks `paste`, and `autocomplete="off"` is not set on them [WCAG 3.3.8]
- [ ] Identifier and password fields are real `<input>` elements with a label and with `autocomplete="username"`, `autocomplete="current-password"` or `autocomplete="new-password"` [WCAG 3.3.8]
- [ ] A one-time code is entered in a single field with `autocomplete="one-time-code"`, not in one box per digit [WCAG 3.3.8]
- [ ] Login does not ask for selected characters of a secret (the 2nd, 5th and 7th), which defeats pasting and password managers [WCAG 3.3.8]
- [ ] A CAPTCHA in an authentication step is not a text-transcription, arithmetic or puzzle challenge unless another route exists that has no cognitive test [WCAG 3.3.8]

**How to satisfy it in code.**

```html
<form method="post" action="/login">
  <label for="login-email">Email address</label>
  <input id="login-email" name="email" type="email" autocomplete="username" required>

  <label for="login-password">Password</label>
  <input id="login-password" name="password" type="password" autocomplete="current-password" required>
  <button type="button" aria-pressed="false" aria-controls="login-password" data-toggle-password>Show password</button>

  <button type="submit">Sign in</button>
</form>

<label for="otp">Code received by text message</label>
<input id="otp" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code">
```

- Methods with no cognitive test at all: a sign-in link sent by email, passkeys (WebAuthn), sign-in through a third-party identity provider. Offering one of them next to the password is the sturdiest way to meet the criterion.
- A "show password" button reduces typing errors; it does not replace paste and autofill.
- CAPTCHA alternatives and their limits: [fallbacks.md](fallbacks.md).

**How to check.** A script can detect `onpaste` handlers that call `preventDefault`, `autocomplete="off"` on credential fields and one-box-per-digit code inputs. A person confirms with a real password manager that the fields are offered for filling, pastes a password and a code, and walks through every route (first login, second factor, forgotten password) looking for a step that requires memory, transcription or a puzzle with no alternative.
