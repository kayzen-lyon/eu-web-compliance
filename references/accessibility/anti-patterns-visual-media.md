# Anti-patterns: visual presentation, media and motion

Contrast, colour, zoom and reflow, images of text; video, audio, animation. Severity levels, the way to read "Detect" lines and the machine-readable patterns are in [anti-patterns.md](anti-patterns.md). The examples are illustrations: recognise the pattern, do not copy the wording.

## Visual presentation

### AP-VIS-01 · Low-contrast text

Light grey on white, white on a pastel button, text on a photo: the words fade for people with low vision, on a cheap screen or in daylight. Placeholders, captions, footers and disabled-looking links are the usual cases.

- Severity: major. Criterion: WCAG 1.4.3; RGAA 3.2.
- Detect: computed contrast between text and background under 4.5:1 (3:1 for large text). The regular expression only flags light greys used as a text colour; a checker must compute the ratio on the rendered page, and a person must check text on images and gradients.

Bad:
```css
.hint { color: #aaa; background: #fff; }   /* about 2.3:1 */
```

Good:
```css
.hint { color: #595959; background: #fff; }   /* 7.0:1 */
```

### AP-VIS-02 · Links in text marked by colour only

With the underline removed, a link inside a paragraph differs from the words around it by its hue alone. People who do not perceive that hue cannot find the links.

- Severity: major. Criterion: WCAG 1.4.1; RGAA 10.6.
- Detect: a rule that removes the underline of all links, or of links in a content area. Selectors scoped to `nav`, `header`, `footer`, menus, breadcrumbs, lists (`li`, `ul`, `ol`) or buttons are not matched, and a match is kept only when the rendered page has a link inside running text that is not underlined: links in `nav`, `header` or `footer`, links styled as buttons (background, border, `btn` or `button` class, `role="button"`) and links that are the only content of their block, such as the items of a list of links, are not counted. WCAG 1.4.1 concerns links inside a block of text, not navigation lists. A defect for links inside running text unless another non-colour cue exists.

Bad:
```css
a { color: #0b5fff; text-decoration: none; }
```

Good:
```css
main a { text-decoration: underline; text-underline-offset: 0.15em; }
```

### AP-VIS-03 · Status conveyed by colour only

A green or red dot, a coloured row, a coloured chart series: the information does not exist for a screen reader and is ambiguous for people who do not distinguish the colours.

- Severity: major. Criterion: WCAG 1.4.1; RGAA 3.1.
- Detect: an empty element whose class combines a status word and a colour or state name. Other cases (rows, charts, required fields) need a person.

Bad:
```html
<td><span class="status-dot status-green"></span></td>
```

Good:
```html
<td><span class="status-dot status-green" aria-hidden="true"></span> In stock</td>
```

### AP-VIS-04 · Low-contrast boundary of a form control

A field drawn with a very light border on a white page cannot be located by people with low vision: they do not see where to click or type. The same goes for checkbox outlines, toggles and custom focus rings.

- Severity: major. Criterion: WCAG 1.4.11; RGAA 3.3.
- Detect: computed contrast under 3:1 between the visual boundary of a control and what surrounds it. The regular expression only flags common very light greys used as border colours.

Bad:
```css
input { border: 1px solid #ddd; background: #fff; }
```

Good:
```css
input { border: 2px solid #6b6b6b; background: #fff; }   /* about 5.3:1 */
```

### AP-VIS-05 · Text container that clips its content

A fixed height with `overflow: hidden`, a line clamp or an ellipsis works for the designer's text at the designer's size. With larger text or wider spacing, the end of the text is cut off with no way to read it.

- Severity: major. Criterion: WCAG 1.4.4, 1.4.12; RGAA 10.4, 10.12.
- Detect: a rule that combines a fixed `height` with `overflow: hidden`, or uses `-webkit-line-clamp` or `text-overflow: ellipsis`. A defect when the hidden text is not available otherwise. Rules of the visually-hidden technique (1px size with `clip` or `clip-path`) are excluded.

Bad:
```css
.card-title { height: 48px; overflow: hidden; }
```

Good:
```css
.card-title { min-height: 3rem; }
```

### AP-VIS-06 · Fixed widths that prevent reflow

A container with a width in pixels forces horizontal scrolling on a narrow screen and at high zoom. People who enlarge the page must scroll sideways for every line.

- Severity: major. Criterion: WCAG 1.4.10; RGAA 10.11.
- Detect: a `width` or `min-width` declaration of 400 pixels or more. Confirm at 320 CSS pixels wide; data tables, maps and diagrams may scroll inside their own container.

Bad:
```css
.container { width: 1200px; }
```

Good:
```css
.container { width: 100%; max-width: 75rem; margin-inline: auto; }
```

### AP-VIS-07 · Text delivered as an image

A slogan, a promotional banner or a heading saved as a picture blurs when enlarged, does not reflow, ignores the colours and fonts the person has set, and often has an alternative that omits part of the text.

- Severity: major. Criterion: WCAG 1.4.5; RGAA 1.8.
- Detect: an image whose file name suggests text. Only a person can tell whether an image contains text that could have been real text. Logos are exempt.

Bad:
```html
<img src="/img/promo-banner.png" alt="Summer sale">
```

Good:
```html
<div class="promo">
  <p class="promo-title">Summer sale</p>
  <p>20 % off all bikes until 31 July, with the code SUMMER.</p>
</div>
```

### AP-VIS-08 · Font sizes set in pixels

Browser zoom still enlarges pixel sizes, so this is not a failure of the zoom criteria. It does ignore the default font size that some people set in their browser so as not to zoom every site by hand.

- Severity: minor. Criterion: best practice (no official criterion).
- Detect: `font-size` in `px`.

Bad:
```css
body { font-size: 14px; }
```

Good:
```css
body { font-size: 100%; }
.small-print { font-size: 0.875rem; }
```

### AP-VIS-09 · Orientation locked

Some people use a phone or tablet fixed to a wheelchair or a stand and cannot turn it. A page that insists on portrait or landscape is unusable for them.

- Severity: major. Criterion: WCAG 1.3.4; RGAA 13.9.
- Detect: a call to the orientation lock API, or a media query on orientation that hides or rotates content.

Bad:
```js
screen.orientation.lock('portrait');
```

Good:
```js
// No lock: the layout adapts to both orientations with CSS.
```

## Media and motion

### AP-MED-01 · Video without a captions track

Everything said in the video is lost for people who cannot hear it. Auto-generated captions that nobody corrected do not solve this: names, figures and technical terms come out wrong.

- Severity: blocking. Criterion: WCAG 1.2.2; RGAA 4.3.
- Detect: a `<video>` with no `<track kind="captions">` or `kind="subtitles"`. Not a defect if the video has no speech or meaningful sound, or if captions are burned into the image; the quality of captions needs a person.

Bad:
```html
<video src="/media/tutorial.mp4" controls></video>
```

Good:
```html
<video controls>
  <source src="/media/tutorial.mp4" type="video/mp4">
  <track kind="captions" src="/media/tutorial.en.vtt" srclang="en" label="English">
</video>
```

### AP-MED-02 · Audio or video with no transcript or description

A podcast with no transcript does not exist for people who cannot hear it. A video whose images show what the voice does not say (a figure on screen, a demonstration) loses that part for people who cannot see it.

- Severity: major. Criterion: WCAG 1.2.1, 1.2.5; RGAA 4.1, 4.5.
- Detect: presence of `<audio>` or `<video>`. Then check by hand that a transcript is on the page or one link away, and whether an audio description is needed.

Bad:
```html
<audio src="/media/episode-12.mp3" controls></audio>
```

Good:
```html
<h3 id="ep12">Episode 12: repairing a puncture</h3>
<audio src="/media/episode-12.mp3" controls aria-labelledby="ep12"></audio>
<p><a href="/podcast/episode-12/transcript">Transcript of episode 12</a></p>
```

### AP-MED-03 · Sound that starts by itself

Autoplaying sound covers the voice of the screen reader. The person cannot hear the page well enough to find the control that would stop it.

- Severity: blocking. Criterion: WCAG 1.4.2; RGAA 4.10.
- Detect: `autoplay` on an `<audio>`, or on a `<video>` without `muted`; an embedded player URL with `autoplay=1` and no mute parameter.

Bad:
```html
<video src="/media/promo.mp4" autoplay loop></video>
```

Good:
```html
<video controls preload="metadata">
  <source src="/media/promo.mp4" type="video/mp4">
  <track kind="captions" src="/media/promo.en.vtt" srclang="en" label="English">
</video>
```

### AP-MED-04 · Media without controls

A background video or an audio clip with no controls cannot be paused. Moving images next to text prevent some people from reading, and nothing can be stopped with the keyboard.

- Severity: major. Criterion: WCAG 2.1.1, 2.2.2; RGAA 4.11, 13.8.
- Detect: `<video>` or `<audio>` without the `controls` attribute. Fine when a custom, keyboard-operable control set exists; check it by hand.

Bad:
```html
<video src="/media/background.mp4" autoplay muted loop></video>
```

Good:
```html
<video id="hero-video" src="/media/background.mp4" muted loop controls></video>
```

### AP-MED-05 · Content that moves by itself with no pause

An auto-rotating carousel, a ticker or an endless animation next to text makes reading impossible for people with attention disorders, and moves content away before slow readers or screen reader users reach it.

- Severity: major. Criterion: WCAG 2.2.2; RGAA 13.8.
- Detect: an infinite CSS animation, a carousel configured with autoplay, or a timer that advances slides. A defect when the motion lasts more than 5 seconds and no pause, stop or hide control exists.

Bad:
```js
new Swiper('.hero', { loop: true, autoplay: { delay: 3000 } });
```

Good:
```js
// No automatic rotation: previous and next buttons only (components/carousel.md).
new Swiper('.hero', { loop: true, navigation: { prevEl: '.hero-prev', nextEl: '.hero-next' } });
```

### AP-MED-06 · Animation that ignores the reduced-motion setting

Parallax, zooming transitions and smooth scrolling cause dizziness and nausea for people with vestibular disorders. They ask their system for less motion; a page that does not listen gives them no way out.

- Severity: minor. Criterion: best practice (no official criterion).
- Detect: keyframe animations, transform transitions or smooth scrolling in a style sheet that contains no `prefers-reduced-motion` media query.

Bad:
```css
html { scroll-behavior: smooth; }
.card { transition: transform 0.4s; }
.card:hover { transform: scale(1.08); }
```

Good:
```css
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
  .card { transition: transform 0.4s; }
  .card:hover { transform: scale(1.08); }
}
```

### AP-MED-07 · Flashing content

Content that flashes more than three times per second can trigger a seizure in people with photosensitive epilepsy. This is the one defect in this catalogue that can injure.

- Severity: blocking. Criterion: WCAG 2.3.1; RGAA 13.7.
- Detect: an infinite animation with a period of about a third of a second or less, or a `<blink>` element. Video and animated images need to be watched by a person.

Bad:
```css
.alert { animation: flash 0.2s infinite; }
```

Good:
```css
.alert { border: 3px solid currentColor; font-weight: 700; }   /* draws attention without flashing */
```
