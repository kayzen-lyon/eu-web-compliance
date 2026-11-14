# Carousel

A set of slides shown one at a time, with controls to move between them and sometimes automatic rotation.

## When to use it

- Consider not using one. Content in the second slide and beyond is seen by few people, and a carousel adds controls, motion and timing that each need care. A grid of cards, or a stacked list, shows the same content with none of these problems.
- If the design requires a carousel, start without automatic rotation. Automatic rotation is the source of most defects: text that leaves before it is read, focus that jumps, announcements that interrupt.
- There is no native carousel element. A horizontally scrollable list (`overflow-x: auto` with `scroll-snap-type`) inside a focusable, named region is a simpler alternative when all slides can stay in the page.

Behaviour follows the [Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) of the ARIA Authoring Practices Guide (basic carousel with previous and next buttons). The code below is original to this project.

## Reference implementation

```html
<section class="carousel" aria-roledescription="carousel" aria-label="Customer stories">
  <div class="carousel-controls">
    <button type="button" data-carousel-rotation hidden>Pause slide rotation</button>
    <button type="button" data-carousel-prev>Previous slide</button>
    <button type="button" data-carousel-next>Next slide</button>
  </div>

  <div class="carousel-slides" aria-live="polite" aria-atomic="false">
    <div role="group" aria-roledescription="slide" aria-label="1 of 3">
      <h3>A bakery doubles its online orders</h3>
      <p>Read how <a href="/stories/bakery">the Martin bakery</a> rebuilt its order form.</p>
    </div>
    <div role="group" aria-roledescription="slide" aria-label="2 of 3" hidden>
      <h3>A town hall opens its services online</h3>
      <p><a href="/stories/town-hall">The story of the town hall of Vire</a>.</p>
    </div>
    <div role="group" aria-roledescription="slide" aria-label="3 of 3" hidden>
      <h3>A bookshop reaches new readers</h3>
      <p><a href="/stories/bookshop">The story of the Colibri bookshop</a>.</p>
    </div>
  </div>
</section>
```

```css
.carousel-controls { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.carousel-controls button { min-height: 2.75rem; padding: 0.5rem 1rem; font: inherit; }
.carousel-controls button:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
.carousel-slides { min-height: 10rem; }   /* min-height, so that enlarged text is not clipped */
```

```js
function setupCarousel(root, { autoRotateMs = 0 } = {}) {
  const slides = Array.from(root.querySelectorAll('[aria-roledescription="slide"]'));
  const region = root.querySelector('.carousel-slides');
  const rotation = root.querySelector('[data-carousel-rotation]');
  let current = 0;
  let rotating = false;   // what the person asked for
  let timer = null;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
  };

  root.querySelector('[data-carousel-prev]').addEventListener('click', () => show(current - 1));
  root.querySelector('[data-carousel-next]').addEventListener('click', () => show(current + 1));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!rotation || autoRotateMs <= 0 || reducedMotion) return;

  const run = () => { timer = window.setInterval(() => show(current + 1), autoRotateMs); };
  const halt = () => { window.clearInterval(timer); timer = null; };

  const setRotating = (value) => {
    rotating = value;
    halt();
    if (rotating) run();
    region.setAttribute('aria-live', rotating ? 'off' : 'polite');
    rotation.textContent = rotating ? 'Pause slide rotation' : 'Start slide rotation';
  };

  rotation.hidden = false;
  rotation.addEventListener('click', () => setRotating(!rotating));
  root.addEventListener('focusin', (event) => {
    if (event.target !== rotation) setRotating(false);   // stays stopped until asked to restart
  });
  root.addEventListener('mouseenter', halt);
  root.addEventListener('mouseleave', () => { if (rotating && timer === null) run(); });
  setRotating(true);
}

setupCarousel(document.querySelector('.carousel'));                           // manual, recommended
// setupCarousel(document.querySelector('.carousel'), { autoRotateMs: 7000 }); // with rotation
```

Notes on the choices:

- `<section>` with `aria-label` is a region landmark; `aria-roledescription` makes a screen reader say "carousel" and "slide" instead of "region" and "group". Its values are read aloud, so write them in the language of the page, and keep the words "carousel" and "slide" out of the labels to avoid hearing them twice.
- Hidden slides use `hidden`, which removes their links from the Tab sequence. Slides moved off screen with a transform keep their links focusable while invisible.
- The controls come before the slides in the DOM, and the rotation button comes first, so a keyboard or screen reader user can stop the motion before meeting moving content.
- `aria-live="polite"` announces the new slide when the person changes it with the buttons. During automatic rotation it is switched to `off`: a page that talks every few seconds is unusable with a screen reader.
- Rotation pauses while the pointer is over the carousel, and stops for good when focus enters it (except onto the rotation button itself, which is the control for that). It never restarts by itself after the person stopped it.
- With `prefers-reduced-motion: reduce`, rotation never starts. Apply the same media query to any sliding transition.
- The buttons keep focus after activation, so "Next slide" can be pressed repeatedly.
- The name of the rotation button changes with its action; no `aria-pressed` is added, because the changing name already carries the state.

If you add slide picker dots: make them `<button>` elements in a `role="group"` with an `aria-label`, give each a name ("Slide 2"), mark the current one with `aria-disabled="true"`, and make each at least 24 by 24 CSS pixels with a visible focus indicator. Swiping can be added for touch, as a complement to the buttons, never instead of them.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab / Shift+Tab | Move through the rotation button (if present), the previous and next buttons, then the links of the visible slide |
| Enter or Space on "Previous slide" / "Next slide" | Shows the previous / next slide; focus stays on the button |
| Enter or Space on the rotation button | Stops or restarts automatic rotation |

Moving focus into the carousel stops automatic rotation.

## Common mistakes

- Automatic rotation with no pause control, or a pause control placed after the slides.
- Rotation that continues while a keyboard user is reading or following a link in a slide: the link disappears under their focus.
- Previous and next controls that are arrows with no accessible name, or `<div>` elements.
- Hidden slides still focusable, so Tab seems to get lost for several presses.
- Dots that are 8 pixels wide with no spacing, and whose current state is a colour change only.
- Slides that are images of text (a promotional banner as a single picture): no text to enlarge, no alternative, or an alternative that omits the offer and its conditions.
- Swipe as the only way to change slide.
- `aria-live` left on `polite` during rotation.

## Checklist

- [ ] Automatic rotation, if any, can be paused by a button that comes before the slides, and stops when focus enters the carousel [WCAG 2.2.2; RGAA 13.8]
- [ ] Previous, next and rotation controls are `<button>` elements with explicit names [WCAG 4.1.2; RGAA 11.9]
- [ ] Slides that are not shown are removed from the Tab sequence and from the accessibility tree [WCAG 2.4.3; RGAA 10.8]
- [ ] The container has a name, and each slide is a named group [WCAG 1.3.1; RGAA 7.1]
- [ ] Changing slide is possible with single clicks or taps, not only by swiping or dragging [WCAG 2.5.7]
- [ ] Controls and dots are at least 24 by 24 CSS pixels or spaced accordingly [WCAG 2.5.8]
- [ ] The current dot, if any, is distinguished by something other than colour [WCAG 1.4.1; RGAA 3.1]
- [ ] Text in slides is real text and stays fully visible at 200 % zoom [WCAG 1.4.4; RGAA 10.4]
- [ ] Rotation does not start when the person asked for reduced motion [best practice]
