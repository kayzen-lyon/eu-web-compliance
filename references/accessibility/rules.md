# Accessibility rules for generated pages

Some rules are inspired by the golden rules and checklists of the skill `rgaa-dev` by Isabelle Lafont ([Isalafont/claude-skill-rgaa-dev](https://github.com/Isalafont/claude-skill-rgaa-dev), Licence Ouverte 2.0, version 1.2.2 of 2026-06-17) and by `a11y.instructions.md` of [github/awesome-copilot](https://github.com/github/awesome-copilot) (MIT, Copyright GitHub, Inc.); text rewritten. See [../../NOTICE.md](../../NOTICE.md).

The rules to apply while writing HTML, CSS and JavaScript for any page. They are framework-neutral: translate them into the component syntax of the stack in use.

## How to use this file

1. Before writing a page or a component, read the sections that match what you are about to write. Each section is short on purpose.
2. A line starting with `- [ ]` is a rule. Its source is in square brackets at the end: `WCAG` numbers are success criteria of WCAG 2.2 (target level: AA), `RGAA` numbers are criteria of the French RGAA 4.1.2. A rule tagged `[best practice]` has no official source: apply it when it costs nothing, and do not report its absence as a non-conformity.
3. Where a rule is not obvious, the sentence under it says who is affected and how. Use that reason to decide cases the rule does not name.
4. Which standard is legally required for a given website is not decided here: see [../regulatory-status.md](../regulatory-status.md).
5. Following these rules prevents most defects that come from code. It does not make a page conformant: content quality (is this `alt` text right? are the captions accurate?) needs a person. See [testing-by-hand.md](testing-by-hand.md).

Numeric values below (contrast ratios, pixel sizes, durations) are the technical values written in the cited success criterion, not legal thresholds.

| Task | Read |
|------|------|
| Any page | This file, sections 1 to 6 and 10 to 13 |
| A form, a login or a checkout | Sections 5 and 12, [wcag-2.2-additions.md](wcag-2.2-additions.md), [components/multi-step-form.md](components/multi-step-form.md) |
| A modal, a drawer, a confirmation prompt | [components/modal-dialog.md](components/modal-dialog.md) |
| Tabs, accordion, show/hide | [components/tabs.md](components/tabs.md), [components/accordion.md](components/accordion.md) |
| Header, menu, skip link | [components/navigation-menu.md](components/navigation-menu.md), [components/skip-link.md](components/skip-link.md) |
| Search with suggestions | [components/combobox-autocomplete.md](components/combobox-autocomplete.md) |
| Tooltip, help bubble | [components/tooltip.md](components/tooltip.md) |
| Carousel, slider, auto-rotating content | [components/carousel.md](components/carousel.md) |
| Data table, sortable table | Section 7, [components/sortable-table.md](components/sortable-table.md) |
| File upload | [components/file-upload.md](components/file-upload.md) |
| Toast, loading state, result count, form errors | Section 13, [components/status-messages.md](components/status-messages.md) |
| Cookie or consent banner | [components/consent-banner-shell.md](components/consent-banner-shell.md) |
| Reviewing existing code for defects | [anti-patterns.md](anti-patterns.md) |
| Third-party widget, PDF, video without captions, CAPTCHA | [fallbacks.md](fallbacks.md) |
| Explaining in a report why a defect matters | [impacts.md](impacts.md) |
| Listing what a person must still check | [testing-by-hand.md](testing-by-hand.md) |
| Criteria that WCAG 2.2 adds and RGAA 4.1.2 lacks | [wcag-2.2-additions.md](wcag-2.2-additions.md) |
| Official text and tests of an RGAA criterion | [rgaa/4.1.2/index.md](rgaa/4.1.2/index.md) (version in force: [rgaa/ACTIVE](rgaa/ACTIVE)) |
| How an RGAA criterion can be judged from code, and what remains for a person | [rgaa/4.1.2/evaluation-modes.json](rgaa/4.1.2/evaluation-modes.json) |
| Correspondence between RGAA, WCAG and EN 301 549 | [mapping.json](mapping.json) |
| Requirements of EN 301 549 beyond WCAG | [en-301-549.md](en-301-549.md) |
| Running the automated check | `node <skill>/scripts/check-a11y.mjs <folder or URL>` from the root of the website project (see `SKILL.md`, "Paths"); it combines axe-core, a keyboard walk, a 320 px reflow test and the patterns of [anti-patterns.md](anti-patterns.md) |

The same rules apply to everything the other parts of this skill make you add to a page: a consent banner, an "AI-generated" label, a withdrawal button or a legal notice are page content like any other.

## 1. Structure and landmarks

A screen reader user does not see the layout. They move through the page by landmarks and headings, the way a sighted person scans it. Markup is the only layout they get.

- [ ] The document starts with `<!DOCTYPE html>`, tags are closed and nested correctly, and no `id` value or attribute is duplicated [RGAA 8.1, 8.2]
- [ ] Each page has a `<title>` that names the page and differs from the other pages of the site [WCAG 2.4.2; RGAA 8.5, 8.6]
- [ ] The page has one visible `<main>` for its main content, a `<header>` for the banner, `<nav>` for navigation areas and a `<footer>` [WCAG 1.3.1; RGAA 9.2, 12.6]
- [ ] `<nav>` is kept for main and secondary navigation areas, not for any group of links [RGAA 9.2]
- [ ] When a page has several `<nav>` elements, each has a distinct `aria-label` (illustration: "Main", "Breadcrumb", "Footer") [best practice]
- [ ] Every piece of text that acts as a heading is an `<h1>` to `<h6>` element, and heading levels follow the outline of the content, not the desired font size [WCAG 1.3.1; RGAA 9.1]
- [ ] Prefer one `<h1>` that names the page, and do not skip levels going down (an `<h2>` is followed by `<h3>`, not `<h4>`) [best practice]
- [ ] Lists are `<ul>`, `<ol>` or `<dl>`; quotations are `<blockquote>` or `<q>` [WCAG 1.3.1; RGAA 9.3, 9.4]
- [ ] Elements are chosen for their meaning and styled with CSS; presentational elements and attributes (`<center>`, `<font>`, `<marquee>`, `align`, `bgcolor`) are not used [WCAG 1.3.1; RGAA 8.9, 10.1]
- [ ] The order of the DOM is the reading order. CSS that moves things visually (`order`, `flex-direction: row-reverse`, grid placement, absolute positioning) does not change the meaning of the sequence [WCAG 1.3.2; RGAA 10.3]
- [ ] Information is in the HTML, not only in CSS: no meaningful text in `::before`/`::after` or in a background image without a text equivalent [WCAG 1.3.1; RGAA 10.2]
- [ ] Each `<iframe>` has a `title` that describes its content [WCAG 4.1.2; RGAA 2.1, 2.2]
- [ ] Content hidden from everyone uses the `hidden` attribute or `display: none`; text meant only for assistive technology uses a visually-hidden class; `aria-hidden="true"` is only put on decorative or duplicated content and never on, or around, a focusable element [WCAG 4.1.2; RGAA 10.8]

A focusable element inside `aria-hidden="true"` still receives keyboard focus, but the screen reader says nothing: the person is on a control they cannot identify.

Visually-hidden class used by the components of this skill (illustration; any equivalent works):

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

## 2. Text alternatives

The question to answer for each image: if it were removed, what would a reader lose? That is the alternative. If nothing is lost, the image is decorative.

- [ ] Every `<img>` has an `alt` attribute. For an image that carries information, `alt` gives that information briefly [WCAG 1.1.1; RGAA 1.1, 1.3]
- [ ] A decorative image has `alt=""` and no `title`; a decorative inline `<svg>` has `aria-hidden="true"` and no `<title>` or `<desc>` [WCAG 1.1.1; RGAA 1.2]
- [ ] An image that is the only content of a link or a button has an alternative that says where the link goes or what the button does, not what the picture looks like [WCAG 1.1.1; RGAA 1.3, 6.1]
- [ ] An informative inline `<svg>` has `role="img"` and an accessible name (`aria-label`, or `aria-labelledby` pointing to its `<title>`) [WCAG 1.1.1; RGAA 1.1]
- [ ] An icon-only button has an accessible name (visually-hidden text or `aria-label`), and the icon itself is hidden with `aria-hidden="true"` [WCAG 4.1.2; RGAA 11.9]
- [ ] A complex image (chart, diagram, map, infographic) has a short alternative that names it and a detailed description next to it or one link away (a data table suits most charts) [WCAG 1.1.1; RGAA 1.6]
- [ ] Text is written as text, not embedded in an image; logos are the exception [WCAG 1.4.5; RGAA 1.8]
- [ ] An image with a visible caption is wrapped in `<figure>` with `<figcaption>` [WCAG 1.1.1; RGAA 1.9]
- [ ] ASCII art, text emoticons and cryptic notations have a text explanation [WCAG 1.1.1; RGAA 13.5]
- [ ] Emoji and pictographs used as bullets or ornaments are wrapped in a `<span aria-hidden="true">`; when one carries meaning (a status, for instance), the meaning is also written in text [best practice]

RGAA 1.9 also asks for an explicit role and an `aria-label` on the `<figure>`; read the criterion text when the project targets RGAA.

Never write an `alt` you cannot justify from what you know of the image. When you generate a page with placeholder images, write a placeholder `alt` that says so plainly (illustration: `alt="TODO: describe the product photo"`) and list it for human review: a wrong description is worse than a visible gap.

## 3. Colour and contrast

- [ ] Text has a contrast ratio of at least 4.5:1 with its background; large text (24 px and above, or about 18.5 px and above in bold) at least 3:1. This includes placeholder text, text on images or gradients, and hover, focus and visited states [WCAG 1.4.3; RGAA 3.2]
- [ ] The visual boundary and the states of interface components (field borders, checkbox outlines, toggle positions, focus indicators) and the parts of a graphic needed to understand it have at least 3:1 with adjacent colours [WCAG 1.4.11; RGAA 3.3]
- [ ] Colour is never the only carrier of a piece of information: an error, a required field, a status or a chart series also has text, an icon, a pattern or a shape [WCAG 1.4.1; RGAA 3.1]
- [ ] Links inside a block of text are underlined or carry another cue that is not colour [WCAG 1.4.1; RGAA 10.6]
- [ ] Instructions do not rely on shape, size, position or colour alone (not "click the round button on the right" but "select Send") [WCAG 1.3.3; RGAA 10.9]
- [ ] Whenever CSS sets a text colour it also sets a background colour on the element or an ancestor, and the reverse; a background image behind text has a fallback background colour [WCAG 1.4.3; RGAA 10.5]
- [ ] Each colour theme (light, dark, high-contrast variant) is checked separately [WCAG 1.4.3; RGAA 3.2]
- [ ] Meaningful borders and icons survive the forced-colours mode of the operating system: use real borders and `currentColor` instead of background colours and box shadows alone [best practice]

Compute contrast; do not estimate it. Light grey on white (`#999` on `#fff` is about 2.8:1) is the most common failure in generated designs.

## 4. Keyboard and focus

Many people never use a pointer: keyboard users, switch users, screen reader users, voice control users (voice commands are turned into keyboard and click events). Everything below follows from one fact: they can only reach what is focusable and only operate what answers to keys.

- [ ] Every action available with a pointer is available with the keyboard alone [WCAG 2.1.1; RGAA 7.3]
- [ ] Native elements are used for what they are: `<button>` for an action, `<a href>` for navigation, `<input>`, `<select>`, `<textarea>`, `<details>`, `<dialog>` for their purpose. A `<div>` or `<span>` is not made clickable [WCAG 4.1.2; RGAA 7.1]
- [ ] A custom widget, when no native element fits, exposes its role, its accessible name and its current state, and implements the keyboard model of the matching ARIA Authoring Practices pattern [WCAG 4.1.2; RGAA 7.1]
- [ ] **Keyboard focus can always leave a component with the keyboard alone.** If leaving needs a key other than Tab or the arrows, the page says which one [WCAG 2.1.2; RGAA 12.9]
- [ ] The element that has keyboard focus is visibly marked. `outline: none` is only written together with a replacement style that is at least as visible [WCAG 2.4.7; RGAA 10.7]
- [ ] The focused element is not hidden behind a sticky header, a sticky footer, a banner or a chat bubble [WCAG 2.4.11]
- [ ] Focus moves in an order that matches the visual and logical order; `tabindex` takes only the values `0` and `-1` [WCAG 2.4.3; RGAA 12.8]
- [ ] A script does not take focus away from an element (`blur()` on focus). When the focused element is removed or hidden, focus is moved to a logical place: the control that opened it, the next item, or the heading of the region [WCAG 2.4.3; RGAA 7.3]
- [ ] When a dialog or panel opens on request, focus moves into it; when it closes, focus returns to the control that opened it [WCAG 2.4.3; RGAA 12.8]
- [ ] Receiving focus never triggers a change of context (no navigation, no new window, no form submission on focus) [WCAG 3.2.1; RGAA 7.4]
- [ ] Content that appears on hover also appears on keyboard focus or on activation, can be reached with the keyboard if it contains controls, can be dismissed with Escape without moving, stays while the pointer is over it, and does not vanish on a timer [WCAG 1.4.13; RGAA 10.13, 12.11]
- [ ] A shortcut made of a single letter, digit or symbol can be turned off or remapped, or only works while its component has focus [WCAG 2.1.4; RGAA 12.10]
- [ ] A link placed at the very start of the page leads to the main content, so that repeated blocks can be skipped [WCAG 2.4.1; RGAA 12.7]

Why "at least as visible": a keyboard user who loses sight of the focus is in the position of a mouse user whose cursor is invisible.

Sticky header illustration, one way to keep focus in view:

```css
html { scroll-padding-top: 5rem; }   /* height of the sticky header */
:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
```

## 5. Forms and errors

- [ ] Every field has a visible label tied to it in code: `<label for>` matching the field `id`, or a `<label>` wrapping the field. `aria-label` and `aria-labelledby` are for cases where a visible `<label>` is impossible [WCAG 3.3.2; RGAA 11.1]
- [ ] The label sits next to its field and stays visible while the person types; a placeholder is never the label [WCAG 3.3.2; RGAA 11.4]
- [ ] When a field has both visible label text and an `aria-label` or `aria-labelledby`, the accessible name contains the visible text, preferably at the start [WCAG 2.5.3; RGAA 11.2]
- [ ] Radio buttons, checkboxes and fields that belong together are grouped in a `<fieldset>` whose `<legend>` asks the question [WCAG 1.3.1; RGAA 11.5, 11.6]
- [ ] A required field says so in its label, in words or with a symbol explained before the form, and carries `required` or `aria-required="true"` [WCAG 3.3.2; RGAA 11.10]
- [ ] An expected format is given before input, in the label or in a hint tied to the field with `aria-describedby` (illustration: "Date of birth, for example 27 03 1990") [WCAG 3.3.2; RGAA 11.10]
- [ ] Fields that collect information about the user carry the matching `autocomplete` token (`name`, `given-name`, `family-name`, `email`, `tel`, `street-address`, `postal-code`, `bday`, `cc-number`, `current-password`, `new-password`, `one-time-code`...) [WCAG 1.3.5; RGAA 11.13]
- [ ] Each button has a name that says what it does ("Send the request", not "OK") [WCAG 4.1.2; RGAA 11.9]
- [ ] An input error is described in text, names the field concerned, is tied to the field (`aria-describedby`) and the field carries `aria-invalid="true"` [WCAG 3.3.1; RGAA 11.10]
- [ ] The error message says how to fix the error: expected type, format, or an example of a valid value [WCAG 3.3.3; RGAA 11.11]
- [ ] Errors that appear without a page reload are perceivable without sight: focus is moved to an error summary or to the first invalid field, or the message is inserted in a live region [WCAG 4.1.3; RGAA 7.5]
- [ ] Before a submission that creates a legal or financial commitment, or that changes or deletes the user's data, the person can review and correct the data, or cancel afterwards [WCAG 3.3.4; RGAA 11.12]
- [ ] Changing the value of a field does not submit the form, navigate or open a window; a button does that [WCAG 3.2.2; RGAA 7.4]
- [ ] The same function has the same label everywhere on the site [WCAG 3.2.4; RGAA 11.3]
- [ ] Information already given in the same process is not asked again, and logging in does not depend on a memory or puzzle test: see [wcag-2.2-additions.md](wcag-2.2-additions.md) [WCAG 3.3.7, 3.3.8]
- [ ] Use the matching input `type` (`email`, `tel`, `url`, `number` only for quantities) so that mobile keyboards and assistive technology adapt [best practice]
- [ ] Validate when the person leaves the field or submits, not at each keystroke: an error announced before typing is finished interrupts screen reader users repeatedly [best practice]
- [ ] Keep the submit button enabled and explain errors on submit; a disabled button gives no reason and cannot be focused [best practice]

Why the placeholder is not a label: it disappears at the first character (people with memory or attention difficulties lose the instruction), its default contrast is low, and voice control users cannot name the field.

## 6. Links and navigation

- [ ] The text of a link tells where it goes, on its own or together with its sentence, list item, heading or table cell. "Click here", "Read more" and bare URLs do not [WCAG 2.4.4; RGAA 6.1]
- [ ] Every link has an accessible name; a link whose only content is an image or an icon gets it from the `alt` or from visually-hidden text [WCAG 2.4.4; RGAA 6.2]
- [ ] The accessible name of a link or button contains its visible text (an `aria-label` that replaces "Send" with "Submit form" breaks voice commands) [WCAG 2.5.3; RGAA 6.1, 11.9]
- [ ] Links navigate and buttons act: `<a href>` leads to a URL or an anchor, `<button type="button">` runs a script [WCAG 4.1.2; RGAA 7.1]
- [ ] Navigation blocks repeated across pages stay in the same place and the same order [WCAG 3.2.3; RGAA 12.2]
- [ ] A set of pages can be explored in at least two ways among: navigation menu, search, site map [WCAG 2.4.5; RGAA 12.1]
- [ ] Components with the same function have the same name and the same icon across pages [WCAG 3.2.4]
- [ ] When the current page is highlighted in a menu, the same information is in the code with `aria-current="page"` on its link [WCAG 1.3.1; RGAA 10.9]
- [ ] No window or tab opens without the user asking for it [WCAG 3.2.1; RGAA 13.2]
- [ ] A link that opens a new window or downloads a file says so in its text, with the format and size for a file (illustration: "Annual report (PDF, 2.1 MB)") [best practice]
- [ ] Help and contact mechanisms keep the same relative position on every page: see [wcag-2.2-additions.md](wcag-2.2-additions.md) [WCAG 3.2.6]

## 7. Tables

- [ ] A data table uses `<th>` for row and column headers, with `scope="col"` or `scope="row"`; a table with headers on several levels links cells with `id` and `headers` [WCAG 1.3.1; RGAA 5.6, 5.7]
- [ ] A data table has a `<caption>` that names it [WCAG 1.3.1; RGAA 5.4, 5.5]
- [ ] A complex table (merged cells, several header levels) has a short summary of how it is organised, in the `<caption>` or tied with `aria-describedby` [WCAG 1.3.1; RGAA 5.1]
- [ ] Tables are not used for layout. If one cannot be avoided it has `role="presentation"`, no `<th>`, no `<caption>`, and still reads in a sensible order [WCAG 1.3.1; RGAA 5.3, 5.8]
- [ ] A wide table scrolls inside its own container instead of forcing the whole page to scroll sideways; the container is focusable and named so that keyboard users can scroll it (illustration: `<div role="region" aria-labelledby="caption-id" tabindex="0">`) [WCAG 2.1.1; RGAA 7.3]

Without header cells a screen reader reads a table as a flat list of values: "42, 17, 8" with nothing to say what each number is.

## 8. Media

- [ ] Prerecorded video with speech or meaningful sound has synchronised captions [WCAG 1.2.2; RGAA 4.3]
- [ ] Prerecorded audio-only content has a text transcript; video-only content has a text or audio alternative [WCAG 1.2.1; RGAA 4.1]
- [ ] Prerecorded video whose images carry information that the soundtrack does not give has an audio description [WCAG 1.2.5; RGAA 4.5]
- [ ] Live video with sound has live captions [WCAG 1.2.4]
- [ ] Each media element is identified by adjacent text (a heading or a sentence that names it) [WCAG 1.1.1; RGAA 4.7]
- [ ] The player can be operated with the keyboard, and its controls have accessible names and expose their state; the native `controls` attribute gives this [WCAG 2.1.1; RGAA 4.11, 4.13]
- [ ] No sound starts by itself. If one does and lasts more than 3 seconds, a control to stop it or lower it comes first in the page [WCAG 1.4.2; RGAA 4.10]
- [ ] Non-time-based embedded content (interactive map, canvas chart, 3D viewer) has an accessible alternative next to it or one link away [WCAG 1.1.1; RGAA 4.8]

Autoplaying sound covers the voice of a screen reader: the person cannot hear the page well enough to find the stop button.

You cannot produce captions, transcripts or audio description from code. Write the markup that receives them (`<track kind="captions">`, a transcript section), and list the missing files for the person in charge of content. See [fallbacks.md](fallbacks.md).

## 9. Motion and timing

- [ ] **Nothing flashes more than three times in one second.** [WCAG 2.3.1; RGAA 13.7]
- [ ] Anything that moves, blinks or scrolls by itself for more than 5 seconds next to other content can be paused, stopped or hidden; content that updates by itself can be paused or its frequency controlled [WCAG 2.2.2; RGAA 13.8]
- [ ] A time limit can be turned off, adjusted or extended; before a session expires the person is warned and can extend it with a simple action [WCAG 2.2.1; RGAA 13.1]
- [ ] Pages do not refresh or redirect by themselves after a delay [WCAG 2.2.1; RGAA 13.1]
- [ ] A message the person needs to read or act on does not disappear on a timer [WCAG 2.2.1; RGAA 13.1]
- [ ] Non-essential animation (parallax, large transitions, auto-scrolling) is reduced or removed under `@media (prefers-reduced-motion: reduce)` [best practice]

Flashing content can trigger seizures; this is the one rule in this file where a defect can physically harm someone. Moving content next to text makes reading impossible for people with attention disorders, and large motion causes nausea for people with vestibular disorders.

## 10. Language

- [ ] `<html>` has a `lang` attribute with the valid code of the main language of the page [WCAG 3.1.1; RGAA 8.3, 8.4]
- [ ] A passage in another language carries its own `lang` attribute; proper nouns and words adopted by the main language are exempt [WCAG 3.1.2; RGAA 8.7, 8.8]
- [ ] Hidden text written by the developer (`alt`, `aria-label`, visually-hidden text, `title`) is in the language of the page [WCAG 3.1.2; RGAA 8.7]
- [ ] A change of text direction is marked with `dir` [WCAG 1.3.2; RGAA 8.10]

A screen reader picks its voice from `lang`. French text read with English pronunciation rules is unintelligible. English `aria-label` values left in a page of another language are a frequent defect of generated code.

## 11. Zoom and reflow

- [ ] The viewport meta tag does not block zooming: no `user-scalable=no`, no `maximum-scale` below 2 [WCAG 1.4.4; RGAA 10.4]
- [ ] At 200 % zoom all text is still present and readable: nothing is clipped, overlapped or pushed off screen [WCAG 1.4.4; RGAA 10.4]
- [ ] At a width of 320 CSS pixels, content reads with vertical scrolling only. Content that needs two dimensions (data tables, maps, diagrams, video, toolbars) may scroll sideways inside its own area [WCAG 1.4.10; RGAA 10.11]
- [ ] Nothing is lost when the user sets line height to 1.5, paragraph spacing to 2, letter spacing to 0.12 and word spacing to 0.16 times the font size [WCAG 1.4.12; RGAA 10.12]
- [ ] Content works in portrait and in landscape [WCAG 1.3.4; RGAA 13.9]
- [ ] Containers of text use `min-height`, not `height`, and font sizes, paddings and media queries use relative units (`rem`, `em`, `%`) [best practice]

320 CSS pixels is what a 1280-pixel-wide window shows at 400 % zoom: this rule is about people who enlarge the page, not only about small phones.

## 12. Pointer targets and gestures

- [ ] A pointer target is at least 24 by 24 CSS pixels, or has enough empty space around it that a 24-pixel circle centred on it touches no other target. Links inside sentences are exempt [WCAG 2.5.8]
- [ ] Anything done by dragging can also be done with single clicks or taps [WCAG 2.5.7]
- [ ] Anything done with a multi-finger or path gesture (pinch, swipe) can also be done with a single tap or click [WCAG 2.5.1; RGAA 13.10]
- [ ] Actions fire on `click` (pointer release), not on `mousedown`, `pointerdown` or `touchstart`, so that a mistaken press can be cancelled by sliding away [WCAG 2.5.2; RGAA 13.11]
- [ ] A function triggered by moving or shaking the device also has a control in the interface, and the motion trigger can be disabled [WCAG 2.5.4; RGAA 13.12]
- [ ] On touch layouts, aim for targets of 44 by 44 CSS pixels (the value of WCAG 2.5.5, level AAA) for primary actions [best practice]

Details and exceptions of 2.5.7 and 2.5.8: [wcag-2.2-additions.md](wcag-2.2-additions.md).

## 13. Dynamic updates

A sighted person notices that a message appeared. A screen reader only speaks what has focus or what the page declares as a live update.

- [ ] A status message (success, error, number of results, progress, item added) is announced without moving focus: `role="status"` for results and confirmations, `role="alert"` for errors and urgent warnings, `role="log"` or `role="progressbar"` for progress [WCAG 4.1.3; RGAA 7.5]
- [ ] When a script changes the visual state of a component (open, selected, pressed, checked, invalid, busy), the same handler updates the matching attribute (`aria-expanded`, `aria-selected`, `aria-pressed`, `aria-checked`, `aria-invalid`, `aria-busy`) [WCAG 4.1.2; RGAA 7.1]
- [ ] After a client-side route change, `document.title` is updated to the new page [WCAG 2.4.2; RGAA 8.6]
- [ ] Content that the person asked for (expanded panel, loaded results, new step) comes right after its trigger in the DOM, or receives focus [WCAG 1.3.2; RGAA 10.3]
- [ ] A live region is present in the DOM, empty, before the message is written into it; a region inserted together with its text is often not announced [best practice]
- [ ] After a client-side route change, focus moves to the `<h1>` or the `<main>` of the new view (with `tabindex="-1"`), so that keyboard and screen reader users start at the new content and not in the old menu [best practice]
- [ ] `role="alert"` is kept for what must interrupt; routine confirmations use `role="status"` [best practice]

Reference implementation: [components/status-messages.md](components/status-messages.md).
