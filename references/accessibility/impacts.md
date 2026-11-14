# Impacts: who is blocked by which defect, and how

Use this file to write the "impact" line of a finding in a report. Each row says what happens to a person using a given tool, as a mechanism. It names tools and situations, not categories of disability: the same defect affects a blind person with a screen reader, a sighted person with a broken arm using voice control, and someone reading on a phone in sunlight.

The tables are an aid, not a standard: the requirement is in the criterion cited. `WCAG` numbers are WCAG 2.2 success criteria; `RGAA` numbers are RGAA 4.1.2 criteria, and a dash means that RGAA 4.1.2 has no matching criterion. Severity levels (`blocking`, `major`, `minor`) are defined in [anti-patterns.md](anti-patterns.md).

Parts of this file are adapted from `impacts.md` of the skill `rgaa-dev` by Isabelle Lafont ([Isalafont/claude-skill-rgaa-dev](https://github.com/Isalafont/claude-skill-rgaa-dev), Licence Ouverte 2.0, version 1.2.2 of 2026-06-17) and from `references/impacts.md` of the skill `rgaa` ([etalab-ia/skills](https://github.com/etalab-ia/skills), MIT, Copyright (c) 2026 Benoit Vinceneux), translated, reorganised by family of defect and extended.

## The tools behind the mechanisms

| Tool or setting | How the person uses the page | What it depends on |
|-----------------|------------------------------|--------------------|
| Screen reader, with speech or a braille display | Hears or reads the page element by element; jumps between headings, landmarks, links and form fields | Names, roles, states and structure in the code |
| Screen magnifier, browser zoom, large text | Sees a small part of the page at a time, enlarged | Reflow, nothing clipped, related things kept close together |
| Custom colours, forced-colours mode, dark mode | Replaces the colours of the page | Real borders and text, information not carried by colour |
| Keyboard alone, switch, sip-and-puff, head pointer | Moves from one focusable element to the next and activates it | Focusable elements, visible focus, logical order, no trap |
| Voice control | Says the visible name of a control to activate it, or dictates text | Accessible names that match the visible text, real controls |
| Captions, transcripts | Reads what is said | Their presence and accuracy |
| Audio description | Hears what is shown | Its presence |
| Reduced-motion setting, pausing | Avoids or stops movement | Pages that honour the setting and offer a pause |
| Password manager, autofill | Lets software remember and type | Standard fields, `autocomplete`, paste allowed |

## Structure and landmarks

| Defect | What happens | Criteria |
|--------|--------------|----------|
| No headings, or text styled to look like headings | A screen reader user cannot list or jump between sections; the page has to be listened to from start to end | WCAG 1.3.1; RGAA 9.1 |
| Heading levels chosen for their size | The outline read by the screen reader contradicts the content: a sub-point is announced as a main section | WCAG 1.3.1; RGAA 9.1 |
| No `<main>`, `<nav>`, `<header>`, `<footer>` | The screen reader shortcuts that jump to the main content or to the navigation find nothing | WCAG 1.3.1; RGAA 9.2, 12.6 |
| Missing or identical page titles | The first thing a screen reader announces, and the label of the tab, do not say which page this is; with several tabs open they cannot be told apart | WCAG 2.4.2; RGAA 8.5, 8.6 |
| Lists written as lines with dashes or line breaks | The screen reader does not say "list of 5 items": the person cannot tell how many items there are or skip the list | WCAG 1.3.1; RGAA 9.3 |
| Visual order different from DOM order | The screen reader reads, and Tab moves, in an order that makes no sense; a magnifier user sees focus jump across the screen | WCAG 1.3.2, 2.4.3; RGAA 10.3, 12.8 |
| Text generated in CSS or shown as a background image | With custom styles or images disabled, and for some screen readers, the information does not exist | WCAG 1.3.1; RGAA 10.2 |
| Frame without a title | The screen reader announces "frame" with nothing to say whether it is a video, a map or an advertisement | WCAG 4.1.2; RGAA 2.1 |

## Text alternatives

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Informative image without `alt` | The screen reader skips it or reads the file name ("IMG underscore 4032 dot jpg"); the information is lost | WCAG 1.1.1; RGAA 1.1 |
| `alt` that describes the wrong thing ("image", "photo", "logo") | The person learns that an image exists and nothing else | WCAG 1.1.1; RGAA 1.3 |
| Decorative image with an alternative | Each ornament is read aloud; the content is drowned in noise | WCAG 1.1.1; RGAA 1.2 |
| Icon-only button or link without a name | The screen reader says "button" or "link"; voice control has no name to call | WCAG 4.1.2; RGAA 11.9, 6.2 |
| Chart or diagram with no description or data | The screen reader says "graphic"; the figures and the trend are out of reach | WCAG 1.1.1; RGAA 1.6 |
| Text embedded in an image | It blurs when magnified, does not reflow, ignores custom colours and fonts, and is not translated or read unless duplicated in the alternative | WCAG 1.4.5; RGAA 1.8 |

## Colour and contrast

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Low-contrast text | The text fades into the background for people with low vision, on a poor screen or in bright light | WCAG 1.4.3; RGAA 3.2 |
| Field borders, icons or focus rings with low contrast | The person cannot find where to type, or cannot tell a ticked box from an empty one | WCAG 1.4.11; RGAA 3.3 |
| Status shown only in red or green | The two states look the same to people who do not distinguish those colours, and the screen reader conveys neither | WCAG 1.4.1; RGAA 3.1 |
| Links in text marked by colour alone | Links cannot be told from the surrounding words | WCAG 1.4.1; RGAA 10.6 |
| Chart series told apart only by colour | The lines or bars merge into one another | WCAG 1.4.1; RGAA 3.1 |
| Instructions such as "the button on the right" or "the green one" | They are meaningless without sight of the layout, and wrong once the layout reflows on a narrow or zoomed screen | WCAG 1.3.3; RGAA 10.9 |
| Text colour set without a background colour, or the reverse | With a custom or dark theme the result can be dark text on a dark background | WCAG 1.4.3; RGAA 10.5 |

## Keyboard and focus

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Clickable `<div>` or `<span>` | Tab never stops on it; the function does not exist for keyboard, switch and most voice control users, and the screen reader does not present it as a control | WCAG 2.1.1, 4.1.2; RGAA 7.3, 7.1 |
| Focus indicator removed | A sighted keyboard user cannot tell where they are, like using a mouse with an invisible pointer | WCAG 2.4.7; RGAA 10.7 |
| Keyboard trap | Focus enters a component and cannot leave: the rest of the page is out of reach, and the only way out is to reload | WCAG 2.1.2; RGAA 12.9 |
| Focused element hidden under a sticky header or a banner | The person activates controls they cannot see | WCAG 2.4.11; RGAA - |
| Positive `tabindex`, or focus order that jumps | Focus moves unpredictably; a magnifier user is thrown from one corner of the screen to another | WCAG 2.4.3; RGAA 12.8 |
| Modal that does not take or keep focus | The keyboard keeps moving through the page behind the overlay; a screen reader user does not know that anything opened | WCAG 2.4.3; RGAA 7.1 |
| Focus lost when an element is removed or a panel closes | Focus returns to the top of the page; the person has to travel back to where they were | WCAG 2.4.3; RGAA 7.3 |
| Content that appears only on hover | It never appears for keyboard and touch users | WCAG 2.1.1; RGAA 10.14, 12.11 |
| Hover or focus bubble that cannot be dismissed | It covers the content a magnifier user was trying to read, with no way to remove it but to move away | WCAG 1.4.13; RGAA 10.13 |
| No skip link | Each page starts with the same dozens of Tab presses through the menu | WCAG 2.4.1; RGAA 12.7 |
| Single-key shortcuts | Dictated words are interpreted as a burst of shortcuts and trigger actions at random | WCAG 2.1.4; RGAA 12.10 |

## Forms and errors

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Field without a label | The screen reader says "edit text" with no subject; voice control cannot target the field; clicking the visible text does not focus the field | WCAG 3.3.2, 4.1.2; RGAA 11.1 |
| Placeholder used as the label | The instruction disappears at the first character; people who are interrupted or who have memory difficulties no longer know what the field expects | WCAG 3.3.2; RGAA 11.1 |
| Accessible name different from the visible label | The voice command that uses the visible word does not find the control | WCAG 2.5.3; RGAA 11.2, 11.9 |
| Radio buttons or checkboxes without a group label | The screen reader reads "Yes, radio button" without the question | WCAG 1.3.1; RGAA 11.5, 11.6 |
| Error shown as a red border only | Nothing is announced; people who do not see the colour do not know which field is wrong | WCAG 3.3.1; RGAA 11.10 |
| Error message that does not say what to do | The person tries values at random; each attempt costs more to someone who types slowly | WCAG 3.3.3; RGAA 11.11 |
| Errors inserted with no announcement and no focus move | A screen reader user submits, hears nothing, and does not know that the form was refused | WCAG 4.1.3; RGAA 7.5 |
| No `autocomplete` on personal fields | Everything must be typed or dictated again, character by character | WCAG 1.3.5; RGAA 11.13 |
| Paste or password manager blocked on login | People who cannot memorise or transcribe a password or a code cannot sign in | WCAG 3.3.8; RGAA - |
| Same information asked twice in a process | Each repetition is another chance of error and fatigue for people with memory or motor difficulties | WCAG 3.3.7; RGAA - |
| Form emptied after an error | All the typing is lost; for some people that is the end of the attempt | WCAG 3.3.7; RGAA - |
| No review before a binding submission | A slip of the finger or a misheard field becomes an order or a payment | WCAG 3.3.4; RGAA 11.12 |
| Image or puzzle CAPTCHA with no alternative | People who cannot see it, hear it or solve it are locked out of the function it protects | WCAG 1.1.1, 3.3.8; RGAA 1.5 |

## Links and navigation

| Defect | What happens | Criteria |
|--------|--------------|----------|
| "Click here", "Read more" | In the screen reader's list of links, all entries read the same; voice control cannot tell which "Read more" to click | WCAG 2.4.4; RGAA 6.1 |
| Link with no text | Announced as "link" or as the raw URL, spelled out | WCAG 2.4.4; RGAA 6.2 |
| Link used as a button, or the reverse | The announced role and the expected key (Enter for a link, Space for a button) do not match what happens | WCAG 4.1.2; RGAA 7.1 |
| Navigation that changes place from page to page | People who rely on position (magnification, memory of the layout) must search again on each page | WCAG 3.2.3; RGAA 12.2 |
| Current page shown by colour only | The screen reader announces the current link like the others | WCAG 1.3.1; RGAA 10.9 |
| New window opened without warning | The back button stops working; a screen reader or magnifier user may not notice that the context changed | WCAG 3.2.1; RGAA 13.2 |
| Help located at a different place on each page | People who need it most have to hunt for it every time | WCAG 3.2.6; RGAA - |

## Tables

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Data table without header cells | Cells are read as a flat series of values with no row or column name | WCAG 1.3.1; RGAA 5.6, 5.7 |
| Table without a caption | The screen reader announces "table, 12 rows" with nothing to say what it contains | WCAG 1.3.1; RGAA 5.4 |
| Layout table with data markup | Row and column counts and headers are announced for what is only page layout | WCAG 1.3.1; RGAA 5.3, 5.8 |
| Table built from `<div>` elements | Table navigation commands do not work; values lose their relationships | WCAG 1.3.1; RGAA 5.6 |
| Sort state shown by an icon only | The screen reader does not say which column orders the table, nor in which direction | WCAG 1.3.1; RGAA 7.1 |

## Media

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Video without captions | Speech is lost for people who cannot hear it, and for anyone in a place where sound is off | WCAG 1.2.2; RGAA 4.3 |
| Audio without a transcript | The whole content is out of reach without hearing | WCAG 1.2.1; RGAA 4.1 |
| Video that shows information not spoken | What is on screen (a figure, a gesture, a name) is lost without sight | WCAG 1.2.5; RGAA 4.5 |
| Sound that starts by itself | It covers the voice of the screen reader: the person cannot hear the page well enough to find how to stop it | WCAG 1.4.2; RGAA 4.10 |
| Player controls not reachable by keyboard or unnamed | The media cannot be started, paused or captioned without a mouse | WCAG 2.1.1, 4.1.2; RGAA 4.11, 4.13 |

## Motion and timing

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Content that flashes more than three times per second | It can trigger a seizure in people with photosensitive epilepsy | WCAG 2.3.1; RGAA 13.7 |
| Carousel or animation that cannot be paused | People with attention disorders cannot read the text beside it; screen reader users hear content change under them | WCAG 2.2.2; RGAA 13.8 |
| Large motion (parallax, zoom effects) with no way to reduce it | Dizziness and nausea for people with vestibular disorders | best practice |
| Session that expires without warning | People who type, read or navigate slowly lose their work before they can finish | WCAG 2.2.1; RGAA 13.1 |
| Message that disappears after a few seconds | It is gone before a slow reader, a magnifier user or a screen reader gets to it | WCAG 2.2.1; RGAA 13.1 |

## Language

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Missing or wrong `lang` on the page | The screen reader reads with the pronunciation rules of another language, which makes the text unintelligible; braille tables are wrong | WCAG 3.1.1; RGAA 8.3, 8.4 |
| Foreign-language passage not marked | That passage is mispronounced | WCAG 3.1.2; RGAA 8.7 |
| `alt` and `aria-label` left in English on a page in another language | Hidden texts are read with the wrong pronunciation, in a language the person may not understand | WCAG 3.1.2; RGAA 8.7 |

## Zoom and reflow

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Zoom disabled in the viewport meta tag | On a phone the person cannot enlarge anything | WCAG 1.4.4; RGAA 10.4 |
| Text clipped or overlapping at 200 % | Words are cut off or hidden under other blocks | WCAG 1.4.4; RGAA 10.4 |
| Horizontal scrolling at 320 CSS pixels | Each line must be scrolled left and right to be read; people lose their place at every line | WCAG 1.4.10; RGAA 10.11 |
| Fixed heights and `overflow: hidden` on text | With larger text or wider spacing, the end of the text disappears | WCAG 1.4.12; RGAA 10.12 |
| Sticky bars that fill the screen when zoomed | Half of the zoomed viewport is taken by the header; the content shows through a slit | WCAG 1.4.10; RGAA 10.11 |
| Orientation locked | A phone or tablet fixed to a wheelchair cannot be turned | WCAG 1.3.4; RGAA 13.9 |

## Pointer targets and gestures

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Tiny or crowded targets | People with tremor, or using a finger, hit the neighbouring control | WCAG 2.5.8; RGAA - |
| Drag and drop as the only way | People who cannot hold a press while moving (tremor, head pointer, eye tracking, voice control) cannot perform the action | WCAG 2.5.7; RGAA - |
| Pinch or swipe as the only way | People using one finger, a stylus held in the mouth or a pointer device cannot make the gesture | WCAG 2.5.1; RGAA 13.10 |
| Action fired on press instead of release | An accidental touch cannot be cancelled by sliding away | WCAG 2.5.2; RGAA 13.11 |

## Dynamic updates

| Defect | What happens | Criteria |
|--------|--------------|----------|
| Message inserted without a live region | "Saved", "3 results" or "Payment refused" is displayed but never spoken | WCAG 4.1.3; RGAA 7.5 |
| Widget state changed visually only | The screen reader still says "collapsed" for a panel that is open, or says nothing for a selected item | WCAG 4.1.2; RGAA 7.1 |
| Client-side navigation with no title change and no focus move | The screen reader stays silent after a link is activated; the person does not know that the page changed and is still in the menu | WCAG 2.4.2; RGAA 8.6 |
| Everything announced as an alert | Speech is interrupted constantly; real alerts stop standing out | best practice |
| Content loaded far from its trigger in the DOM | The person activates "Show more" and finds nothing new nearby | WCAG 1.3.2; RGAA 10.3 |

## Wording an impact in a report

Write one sentence built as: who (through the tool), cannot do what, because of what. Illustrations:

- "A person using a screen reader hears 'button' three times in the product card and cannot tell 'add to basket' from 'add to favourites', because the icon buttons have no accessible name."
- "A person navigating with the keyboard cannot close the newsletter pop-up: focus stays behind it, so the page is unusable until it is reloaded."
- "A person who enlarges text to 200 % loses the end of each product title, because the cards have a fixed height."

Avoid "users with disabilities may experience difficulties": it tells the reader neither what breaks nor how urgent the fix is.
