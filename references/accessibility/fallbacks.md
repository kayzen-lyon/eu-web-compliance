# Fallbacks: when the ideal is out of reach

Outline and order of preference adapted from `fallbacks.md` of the skill `rgaa-dev` by Isabelle Lafont ([Isalafont/claude-skill-rgaa-dev](https://github.com/Isalafont/claude-skill-rgaa-dev), Licence Ouverte 2.0, version 1.2.2 of 2026-06-17); text rewritten.

Read this file when something you cannot fix stands in the way: a third-party widget, a document, a video without captions, a CAPTCHA, an inherited component.

## The approach

Three things, in this order, each time:

1. **Give the best available fallback**, so that the person can still do what they came to do.
2. **Document the gap**: what does not work, for whom, since when, what the alternative is, who can fix it. This goes into the report and into the list of points for the accessibility statement.
3. **Offer another route** to the same information or service, one that does not depend on the inaccessible part.

A fallback does not make the original conformant. In a report, the criterion stays failed (or "not tested" when you could not check); the fallback is listed as mitigation. Whether an exemption, an exclusion or a "disproportionate burden" applies is a legal question with its own conditions, set out in [../regulatory-status.md](../regulatory-status.md): never write in a report that content is exempt because fixing it is hard.

A rule tagged `[best practice]` below is advice from this project, not a requirement of a standard.

## Third-party widget that is not accessible

Typical cases: date picker, map, chat, rich text editor, payment form in an iframe, social feed, booking module, consent tool.

Before adopting one, test it: keyboard walk and the screen reader smoke test of [testing-by-hand.md](testing-by-hand.md). Choosing a component that passes costs less than any fallback.

- [ ] A function offered through a third-party component is also available through an accessible component or an accessible alternative on the page [WCAG 4.1.2; RGAA 7.1]
- [ ] An embedded frame has a `title` that says what it contains [WCAG 4.1.2; RGAA 2.1, 2.2]
- [ ] Keyboard focus can leave the embedded component with the keyboard alone [WCAG 2.1.2; RGAA 12.9]

Fallbacks, from most to least desirable:

1. **Replace it with a native control.** A date picker becomes `<input type="date">`, or three labelled fields (day, month, year) for dates the person knows by heart such as a date of birth. A custom select becomes `<select>`.
2. **Offer an equivalent next to it.** A map of shops is accompanied by the list of shops with addresses and opening hours in text. A chart is accompanied by its data table. An address-autocomplete widget is accompanied by ordinary address fields.
3. **Keep it out of the way.** If the widget is optional and unusable, make sure it does not trap focus and does not flood the page with unnamed controls. Hiding it from assistive technology (`aria-hidden="true"` on its container) is only acceptable if nothing inside it can receive focus (add the `inert` attribute to the container) and the equivalent of point 2 exists. Hiding a widget that has no equivalent removes the function for the people concerned.
4. **Offer another channel.** A phone number, an email address or a contact form, named next to the widget, with what the person can obtain through it. The other channel must itself be usable: an email address answers people who cannot phone, and the reverse.

Illustration of points 2 and 4 for a map:

```html
<h2 id="shops-title">Our shops</h2>
<iframe src="https://maps.example/embed?shops" title="Interactive map of our shops" aria-describedby="map-note"></iframe>
<p id="map-note">The same information is in the list below the map.</p>
<ul aria-labelledby="shops-title">
  <li>Lyon: 12 rue de la République, 69002. Open Monday to Saturday, 10:00 to 19:00.</li>
  <li>Nantes: 4 place Royale, 44000. Open Tuesday to Saturday, 10:00 to 18:30.</li>
</ul>
```

What to document: the name and version of the component, the failed criteria, the alternative provided, and whether the vendor was informed. Report the defect to the vendor; it is often the only path to a fix.

## Documents to download (PDF and office files)

- [ ] Content is published as a web page whenever possible, with the document as an optional download [best practice]
- [ ] A document offered for download is accessible itself, or an accessible version with the same information is offered next to it [WCAG 1.1.1; RGAA 13.3, 13.4]
- [ ] A download link gives the format and size of the file, and its language when it differs from the page [best practice]

Order of preference:

1. **An HTML page** with the same content. It reflows, zooms and works with every assistive technology.
2. **A tagged document**: real headings, reading order, alternatives for images, table headers, document language, a title. This is produced in the authoring tool (styles, alternative text, "export as tagged PDF"), not afterwards by a script. You cannot verify it from the page source: list every linked document as "to be checked by a person".
3. **The document plus an accessible version** (HTML or a structured text document) side by side.
4. **The document plus a way to ask** for an accessible version, with a named contact and a realistic delay. This is a last resort, and it has to be honoured.

A scanned document is an image: it contains no text for a screen reader. It needs text recognition and tagging, or an alternative, before it is of any use.

```html
<p>
  <a href="/reports/2025-annual-report.pdf">Annual report 2025 (PDF, 2.1 MB)</a><br>
  <a href="/reports/2025-annual-report">Annual report 2025, web version</a>
</p>
```

Documents generated by the application (invoices, certificates, tickets) come from a template: fix the template once (tags, language, title, reading order) and every document benefits. Offer the same data on a web page of the account as well.

## Video or audio without captions, transcript or audio description

- [ ] Prerecorded video with sound has synchronised captions [WCAG 1.2.2; RGAA 4.3]
- [ ] Prerecorded audio has a text transcript [WCAG 1.2.1; RGAA 4.1]
- [ ] Prerecorded video whose images carry information absent from the soundtrack has an audio description [WCAG 1.2.5; RGAA 4.5]

What you can do in code is prepare the place: a `<track>` element that points to the caption file, and a transcript section next to the player.

```html
<h3 id="demo-title">Product demonstration (2 min 10 s)</h3>
<video controls preload="metadata" aria-labelledby="demo-title">
  <source src="/media/demo.mp4" type="video/mp4">
  <track kind="captions" src="/media/demo.en.vtt" srclang="en" label="English">
</video>
<details>
  <summary>Transcript of the product demonstration</summary>
  <p>TODO: transcript to be supplied by the content owner.</p>
</details>
```

While the files are missing:

1. **Captions are the target.** Automatically generated captions are a draft: names, numbers and technical terms are often wrong, and punctuation and speaker changes are missing. They need review by a person before they count.
2. **A full transcript** (speech, plus relevant sounds and on-screen text) is the interim alternative. It serves people who cannot hear, and also people who cannot watch a video at the pace it imposes. It does not replace synchronised captions for a video.
3. **A text summary of what the video shows** is a minimum when nothing else exists, to be labelled as a summary.
4. **Remove or postpone** a video that adds nothing to the text of the page and has no alternative.

Never write an empty or placeholder caption file to make an automated check pass: a `<track>` that points to nothing useful hides the defect from the next audit and gives the person nothing.

What to document: each media file lacking captions, transcript or audio description, the interim alternative, and who is in charge of producing the missing files. Dates of publication can matter legally; see [../regulatory-status.md](../regulatory-status.md).

Third-party players (video platforms embedded in an iframe): check that the controls are reachable by keyboard and named, that captions can be switched on, and that nothing plays by itself. If the player fails, link to the file or to a page that uses the native `<video>` element.

## CAPTCHA and other human-verification steps

A CAPTCHA asks for exactly what some people cannot do: read distorted characters, hear degraded audio, solve a puzzle, move a slider precisely. Each type excludes a different group, so no single challenge is accessible to everyone.

- [ ] An image used as a CAPTCHA comes with at least one non-graphic form of the challenge, or with another way to reach the protected function [WCAG 1.1.1; RGAA 1.5]
- [ ] A CAPTCHA in a login process is not a transcription, calculation or puzzle challenge unless a route without such a test exists [WCAG 3.3.8]
- [ ] A challenge that needs dragging (slider, puzzle piece) has an alternative without dragging [WCAG 2.5.7]

Order of preference:

1. **No challenge shown to the person.** Server-side measures cover many needs: rate limiting, a hidden field that only scripts fill in (hidden with CSS and `aria-hidden="true"`, with `tabindex="-1"` and `autocomplete="off"` so that neither assistive technology nor autofill touches it), a minimum time before submission, confirmation by a link sent by email. These choices also involve security and data protection; the security and privacy parts of this skill apply.
2. **A check that needs no action**, with a visible, accessible fallback when it fails. Background risk scoring can wrongly flag assistive technology or privacy tools as automated, so the person must never end at a dead end: offer another verification, not a bare refusal.
3. **Several challenge types to choose from** (for instance visual and audio), plus a route that needs neither sight nor hearing nor puzzle solving, such as a code or link sent by email. Offering only "image or audio" still excludes deaf-blind people and people who cannot solve either.
4. **A human route**: a contact that can perform the action or lift the block, stated on the same screen.

Vendors describe their products as accessible; treat that as a claim to test with the keyboard walk and the screen reader smoke test, on the challenge actually shown to a suspicious visitor, not only on the invisible happy path.

What to document: the CAPTCHA type, where it appears (including the conditional cases), the alternatives offered, and the result of the tests.

## Complex graphics, maps and data visualisations

- [ ] A chart, diagram or map that carries information has a text alternative that gives the same information: a short name on the graphic, and a description or data table next to it [WCAG 1.1.1; RGAA 1.6, 4.8]
- [ ] Series are distinguished by something other than colour: labels on the lines or bars, different shapes or patterns [WCAG 1.4.1; RGAA 3.1]

When the charting library cannot produce an accessible graphic, render the graphic as an image or canvas with a short alternative (what it is and the main finding), hide its internals from assistive technology, and put the data table right after it, visible or inside a `<details>`. The table is often the better answer for everyone who wants exact values.

## Legacy pages and content you are not asked to change

When working inside an existing site, you will meet defects outside your task. Do not silently leave them, and do not rewrite the site unasked. Fix what touches your change; list the rest in your report with location, criterion and impact (see [impacts.md](impacts.md)), so that the owner can decide. When a shared layout defect (missing `lang`, no skip link, no visible focus) affects the page you are building, raise it explicitly: it undermines your page however well the new part is written.

## Wording the alternative route

- [ ] A contact or help mechanism offered as an alternative is at the same place on every page where it appears [WCAG 3.2.6]
- [ ] The alternative route is announced next to the inaccessible content, in text, and says what can be obtained and how [best practice]
- [ ] At least two contact channels are offered, so that no single ability (hearing, speech, sight) is required [best practice]

Illustration:

```html
<p>
  This booking calendar cannot yet be used with a keyboard or a screen reader.
  To book, <a href="/contact">write to us</a> or call 01 23 45 67 89 (Monday to Friday, 9:00 to 17:00):
  we will make the booking with you.
</p>
```

Say what does not work in plain words; "for technical reasons" tells the person nothing. And make sure the promise is kept: an alternative route that nobody answers is a second barrier.
