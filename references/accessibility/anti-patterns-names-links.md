# Anti-patterns: text alternatives, names and links

Images, icons, charts, and the accessible names of links and buttons. Severity levels, the way to read "Detect" lines and the machine-readable patterns are in [anti-patterns.md](anti-patterns.md). The examples are illustrations: recognise the pattern, do not copy the wording.

### AP-ALT-01 · Image without an `alt` attribute

With no `alt`, a screen reader skips the image or reads its file name. Information carried by the image is lost; if the image is a link, so is the link.

- Severity: blocking. Criterion: WCAG 1.1.1; RGAA 1.1.
- Detect: `<img>`, `<input type="image">` or `<area>` with no `alt` attribute at all.

Bad:
```html
<img src="/img/opening-hours.png">
```

Good:
```html
<img src="/img/opening-hours.png" alt="Open Monday to Saturday, 9:00 to 19:00">
```

### AP-ALT-02 · Alternative that is a file name or a generic word

"image", "photo" or "banner_final2.png" tells the person that an image exists and nothing about what it shows. Generated code often fills `alt` this way to silence a linter.

- Severity: major. Criterion: WCAG 1.1.1; RGAA 1.3.
- Detect: `alt` that ends with an image extension or is a single generic word. Relevance of any other `alt` needs a person.

Bad:
```html
<img src="/img/team.jpg" alt="team.jpg">
```

Good:
```html
<img src="/img/team.jpg" alt="The five members of the support team in the Lyon office">
```

### AP-ALT-03 · Decorative graphic exposed to assistive technology

An ornament that is neither hidden nor named is announced as "image" or "graphic", sometimes with the text of its inner `<title>`. Repeated on every card, it buries the content.

- Severity: minor. Criterion: WCAG 1.1.1; RGAA 1.2.
- Detect: inline `<svg>` that has neither `aria-hidden="true"` nor a name with `role="img"`. Decide whether it is decorative (hide it) or informative (name it).

Bad:
```html
<h2><svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/></svg> Our favourites</h2>
```

Good:
```html
<h2><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/></svg> Our favourites</h2>
```

### AP-ALT-04 · Icon-only button or link without a name

The screen reader says "button" and nothing else, and voice control has no name to call. Close, menu, search, basket and social icons are the usual cases.

- Severity: blocking. Criterion: WCAG 4.1.2; RGAA 11.9, 6.2.
- Detect: a `<button>` or `<a>` whose only content is an `<svg>` or `<i>` and that has no `aria-label` or `aria-labelledby`; or a button whose only content is a cross character. A DOM checker computes the accessible name instead.

Bad:
```html
<button type="button"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
```

Good:
```html
<button type="button" aria-label="Close"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
```

### AP-ALT-05 · Icon font carrying meaning with no text

An empty `<i>` drawn by a font or by CSS has no text: the meaning it carries (phone, warning, "new") does not exist for a screen reader, and disappears when fonts or styles are overridden.

- Severity: major. Criterion: WCAG 1.1.1; RGAA 1.1, 10.2.
- Detect: an empty `<i>` or `<span>` with an icon class and no `aria-hidden`. Decorative: hide it. Meaningful: add text.

Bad:
```html
<p><i class="fa fa-phone"></i> 01 23 45 67 89</p>
```

Good:
```html
<p><i class="fa fa-phone" aria-hidden="true"></i> <span class="visually-hidden">Phone:</span> 01 23 45 67 89</p>
```

### AP-ALT-06 · Canvas or chart with no text alternative

A chart drawn in a `<canvas>` is a blank rectangle for a screen reader. The figures and the trend are out of reach.

- Severity: major. Criterion: WCAG 1.1.1; RGAA 1.1, 1.6.
- Detect: `<canvas>` with no `role="img"` and name, and no fallback content. Whether an equivalent (data table, description) exists nearby needs a person.

Bad:
```html
<canvas id="sales-chart"></canvas>
```

Good:
```html
<canvas id="sales-chart" role="img" aria-label="Sales per quarter in 2025, rising from 1.2 to 1.9 million euros"></canvas>
<details>
  <summary>Data of the sales chart</summary>
  <!-- the same figures in a table -->
</details>
```

### AP-ALT-07 · Link text that says nothing about the destination

Screen reader users often browse the list of links of a page: ten "Read more" entries are indistinguishable. Voice control cannot tell which one to click.

- Severity: major. Criterion: WCAG 2.4.4; RGAA 6.1.
- Detect: a link whose whole text is a generic phrase. It is acceptable only if the sentence, list item, heading or table cell around it makes the destination clear.

Bad:
```html
<p>Our delivery terms changed in March. <a href="/delivery">Read more</a></p>
```

Good:
```html
<p>Our delivery terms changed in March. <a href="/delivery">Read the new delivery terms</a></p>
```

### AP-ALT-08 · Link with no accessible name

An empty link, or a link around an image with an empty `alt`, is announced as "link" or as its raw URL. A logo linking to the home page is the usual case.

- Severity: blocking. Criterion: WCAG 2.4.4; RGAA 6.2.
- Detect: `<a>` that is empty or contains only an `<img>` whose `alt` is missing or empty, with no `aria-label` or `aria-labelledby`.

Bad:
```html
<a href="/"><img src="/logo.svg" alt=""></a>
```

Good:
```html
<a href="/"><img src="/logo.svg" alt="Colibri bookshop, home"></a>
```

### AP-ALT-09 · `aria-label` that does not contain the visible text

A voice control user says the word they see ("click Send"). If the accessible name is different, the command finds nothing. Screen reader users who see the screen hear one thing and read another.

- Severity: major. Criterion: WCAG 2.5.3; RGAA 6.1, 11.9.
- Detect: an element with visible text and an `aria-label` (or `aria-labelledby` text) that does not include that visible text, compared without case or punctuation.

Bad:
```html
<button type="submit" aria-label="Submit the form">Send</button>
```

Good:
```html
<button type="submit" aria-label="Send the contact request">Send</button>
```

### AP-ALT-10 · Link that opens a new window without saying so

A new tab breaks the back button. Someone using a screen reader or strong magnification may not notice the switch and no longer understands where they are.

- Severity: minor. Criterion: best practice (no official criterion).
- Detect: `target="_blank"`; check that the link text or its accessible name announces the new window.

Bad:
```html
<a href="https://example.org/guide" target="_blank">Installation guide</a>
```

Good:
```html
<a href="https://example.org/guide">Installation guide</a>
<!-- or, when a new window is really needed, keep the target attribute and say so in the text: -->
<!-- Installation guide (opens in a new window) -->
```

### AP-ALT-11 · Raw URL as link text

A screen reader spells the address out, slash by slash. A long URL also overflows narrow screens.

- Severity: minor. Criterion: WCAG 2.4.4; RGAA 6.1.
- Detect: a link whose text is a URL.

Bad:
```html
<a href="https://example.org/docs/returns-policy-2025">https://example.org/docs/returns-policy-2025</a>
```

Good:
```html
<a href="https://example.org/docs/returns-policy-2025">Returns policy on example.org</a>
```

### AP-ALT-12 · Emoji used as an icon or as the only carrier of meaning

Screen readers read the full name of each emoji ("white heavy check mark"), in the middle of sentences and headings. When the emoji is the only status indicator, its meaning depends on that wording.

- Severity: minor. Criterion: best practice (no official criterion).
- Detect: characters in the emoji and pictograph Unicode blocks (U+1F300 to U+1FAFF, U+2600 to U+27BF) outside an element with `aria-hidden="true"`.

Bad:
```html
<h2>🚀 Fast delivery</h2>
<td>✅</td>
```

Good:
```html
<h2><span aria-hidden="true">🚀</span> Fast delivery</h2>
<td><span aria-hidden="true">✅</span> Included</td>
```
