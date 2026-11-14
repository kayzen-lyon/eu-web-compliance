# Anti-patterns: structure

Page skeleton, headings, landmarks, tables, lists, frames, document-level settings. Severity levels, the way to read "Detect" lines and the machine-readable patterns are in [anti-patterns.md](anti-patterns.md). The examples are illustrations: recognise the pattern, do not copy the wording.

### AP-STR-01 · Page without a language

The `<html>` element has no `lang` attribute, or an empty one. A screen reader then reads the page with the pronunciation rules of its default language, which can make the text unintelligible.

- Severity: major. Criterion: WCAG 3.1.1; RGAA 8.3.
- Detect: `<html>` without a non-empty `lang`.

Bad:
```html
<html>
```

Good:
```html
<html lang="fr">
```

### AP-STR-02 · Missing, empty or generic page title

The title is the first thing a screen reader announces and the label of the browser tab. A scaffold default such as "Document" or "Vite App" says nothing about the page.

- Severity: major. Criterion: WCAG 2.4.2; RGAA 8.5, 8.6.
- Detect: no `<title>` in `<head>`, or a title that is empty or a known scaffold default. Whether a title is relevant needs a person.

Bad:
```html
<title>Document</title>
```

Good:
```html
<title>Opening hours - Colibri bookshop</title>
```

### AP-STR-03 · Text styled as a heading without heading markup

A `<div>`, `<p>` or `<span>` made big and bold looks like a heading but is not one. Screen reader users, who move from heading to heading, cannot find or skip the section.

- Severity: major. Criterion: WCAG 1.3.1; RGAA 9.1.
- Detect: a non-heading element whose class name suggests a title. Confirm by looking at the rendering.

Bad:
```html
<div class="section-title">Our services</div>
```

Good:
```html
<h2 class="section-title">Our services</h2>
```

### AP-STR-04 · Heading levels chosen for their size

Levels are skipped, or the page starts below `<h1>`, because a level was picked for its default font size. The outline heard by a screen reader user no longer matches the content.

- Severity: minor. Criterion: WCAG 1.3.1; RGAA 9.1.
- Detect: in document order, a heading whose level is more than one above the previous heading, or a first heading that is not `<h1>`.

Bad:
```html
<h1>Colibri bookshop</h1>
<h4>Opening hours</h4>
```

Good:
```html
<h1>Colibri bookshop</h1>
<h2 class="small-heading">Opening hours</h2>
```

### AP-STR-05 · Page regions built from anonymous `<div>` elements

With no `<main>`, `<nav>`, `<header>` or `<footer>`, the screen reader commands that jump to the main content or to the navigation find nothing.

- Severity: major. Criterion: WCAG 1.3.1; RGAA 9.2, 12.6.
- Detect: the page does not contain exactly one visible `<main>`; or a `<div>` whose `id` or `class` is the name of a landmark.

Bad:
```html
<div id="header">...</div>
<div id="main">...</div>
<div id="footer">...</div>
```

Good:
```html
<header>...</header>
<main id="main">...</main>
<footer>...</footer>
```

### AP-STR-06 · Several navigation regions with no name

Two `<nav>` elements are both announced as "navigation". The person cannot tell the main menu from the footer links without entering each.

- Severity: minor. Criterion: best practice (no official criterion).
- Detect: more than one `<nav>` or `role="navigation"`, at least one of which has no `aria-label` or `aria-labelledby`.

Bad:
```html
<nav>...</nav>
<main>...</main>
<nav>...</nav>
```

Good:
```html
<nav aria-label="Main">...</nav>
<main>...</main>
<nav aria-label="Footer">...</nav>
```

### AP-STR-07 · Table used for layout

A table that only positions things is announced with rows, columns and cell coordinates, and its reading order follows the grid rather than the meaning.

- Severity: minor. Criterion: WCAG 1.3.1, 1.3.2; RGAA 5.3, 5.8.
- Detect: a table with no header cells that contains form controls, a navigation or another table. Decide by looking: layout, or data (then see AP-STR-08).

Bad:
```html
<table>
  <tr><td><label for="q">Search</label></td><td><input id="q" name="q"></td></tr>
</table>
```

Good:
```html
<div class="search-row">
  <label for="q">Search</label>
  <input id="q" name="q">
</div>
```

### AP-STR-08 · Data table without header cells

Without `<th>`, a screen reader reads the cells as a flat series of values: "42, 17, 8", with nothing to say what each number is.

- Severity: major. Criterion: WCAG 1.3.1; RGAA 5.6, 5.7.
- Detect: a `<table>` that is not marked as presentation and contains neither `<th>` nor `<caption>`.

Bad:
```html
<table>
  <tr><td>Plan</td><td>Price</td></tr>
  <tr><td>Basic</td><td>9 EUR</td></tr>
</table>
```

Good:
```html
<table>
  <caption>Monthly prices</caption>
  <tr><th scope="col">Plan</th><th scope="col">Price</th></tr>
  <tr><th scope="row">Basic</th><td>9 EUR</td></tr>
</table>
```

### AP-STR-09 · List written with line breaks and dashes

A screen reader does not announce "list, 3 items", so the person cannot know how many items follow nor jump past them.

- Severity: minor. Criterion: WCAG 1.3.1; RGAA 9.3.
- Detect: two or more consecutive `<br>` each followed by a dash, bullet or number.

Bad:
```html
<p>- Free delivery<br>- 30-day returns<br>- Secure payment</p>
```

Good:
```html
<ul>
  <li>Free delivery</li>
  <li>30-day returns</li>
  <li>Secure payment</li>
</ul>
```

### AP-STR-10 · Frame without a title

The screen reader announces "frame" and nothing else: the person must enter it to learn whether it is a video, a map or an advertisement.

- Severity: major. Criterion: WCAG 4.1.2; RGAA 2.1, 2.2.
- Detect: `<iframe>` without a non-empty `title`. Whether the title is relevant needs a person.

Bad:
```html
<iframe src="https://maps.example/embed?id=42"></iframe>
```

Good:
```html
<iframe src="https://maps.example/embed?id=42" title="Map of our three shops"></iframe>
```

### AP-STR-11 · Presentational elements and attributes

Obsolete markup such as `<center>`, `<font>` or `bgcolor` fixes the presentation in the HTML, where user style sheets and themes cannot adapt it. `<marquee>` and `<blink>` also move without control.

- Severity: minor. Criterion: WCAG 1.3.1; RGAA 10.1.
- Detect: obsolete presentational elements, or presentational attributes on any element.

Bad:
```html
<center><font color="red">Sale this week</font></center>
```

Good:
```html
<p class="notice">Sale this week</p>
```

### AP-STR-12 · Zoom disabled in the viewport meta tag

On a phone, a person who needs to enlarge the page cannot pinch to zoom.

- Severity: major. Criterion: WCAG 1.4.4; RGAA 10.4.
- Detect: viewport meta tag with `user-scalable=no` (or `0`) or `maximum-scale` below 2.

Bad:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

Good:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### AP-STR-13 · Automatic refresh or delayed redirect

The page reloads or leaves while the person is still reading. A screen reader starts again from the top at each refresh.

- Severity: major. Criterion: WCAG 2.2.1; RGAA 13.1.
- Detect: `<meta http-equiv="refresh">` with a delay other than 0.

Bad:
```html
<meta http-equiv="refresh" content="30">
```

Good:
```html
<button type="button" id="reload-results">Refresh the results</button>
```

### AP-STR-14 · Duplicate `id` values

`<label for>`, `aria-labelledby`, `aria-describedby` and `aria-controls` point to the first element with a given `id`. A duplicate gives the wrong name or description to a field, typically in repeated cards or rows.

- Severity: major. Criterion: WCAG 4.1.2; RGAA 8.2.
- Detect: the same `id` value on more than one element; it is a defect for certain when a label or an ARIA attribute references it.

Bad:
```html
<label for="qty">Quantity</label> <input id="qty" name="qty_a">
<label for="qty">Quantity</label> <input id="qty" name="qty_b">
```

Good:
```html
<label for="qty-a">Quantity of bikes</label> <input id="qty-a" name="qty_a">
<label for="qty-b">Quantity of helmets</label> <input id="qty-b" name="qty_b">
```

### AP-STR-15 · Visual order that differs from the DOM order

CSS moves elements on screen but not in the DOM. The screen reader reads, and Tab moves, in the source order: focus jumps around the screen and the content is heard out of sequence.

- Severity: major. Criterion: WCAG 1.3.2, 2.4.3; RGAA 10.3, 12.8.
- Detect: `order` with a non-zero value, or a reversed flex direction. Confirm that the visual and DOM sequences differ in a way that matters.

Bad:
```css
.card-actions { order: -1; }
.steps { display: flex; flex-direction: row-reverse; }
```

Good:
```css
/* Put the elements in the intended order in the HTML; no reordering in CSS. */
.steps { display: flex; }
```
