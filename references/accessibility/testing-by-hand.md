# Checks that need a person

Automated tools only find the defects that can be read from the code or measured on the rendered page. This file lists the checks that need a person's judgement, each as a short procedure with its pass condition.

How to use it:

- As an agent, run the automated checks first, then hand this list to the person in charge with the pages and components concerned. If you can drive a real browser you can perform some steps yourself (keyboard walk, zoom, reflow, text spacing); say in the report which steps you performed and how, and which remain for a person.
- A check that nobody performed is reported as "not tested", never as passed.
- Run each check on every distinct template (home, listing, detail, form, checkout, account), not on every page.
- These procedures are a working method of this project. They do not replace the test methodology of a framework such as the RGAA, nor an audit by a qualified person.

| Check | Time per template | Tools |
|-------|-------------------|-------|
| 1. Keyboard walk | 5 to 10 min | Keyboard |
| 2. Zoom to 200 % | 3 min | Browser |
| 3. Reflow at 320 CSS pixels | 3 min | Browser |
| 4. Text spacing | 3 min | Browser, a snippet |
| 5. Screen reader smoke test | 10 to 15 min | A screen reader |
| 6. Page without CSS | 3 min | Browser |
| 7. Relevance of text alternatives | Depends on the number of images | Reading |
| 8. Relevance of headings, links, labels, titles | 5 min | Reading |
| 9. Colour and contrast beyond the tool | 5 min | Eyes, a contrast picker |
| 10. Captions, transcripts, audio description | Length of the media | Watching and listening |
| 11. Motion, sound and time limits | 5 min | Watching, waiting |
| 12. Pointer: targets, dragging, gestures | 5 min | Mouse or touch screen |
| 13. Processes: login, forms, errors | 10 min per process | Keyboard, a password manager |

## 1. Keyboard walk

Why a person: a script can list focusable elements; it cannot judge whether the order makes sense, whether every function is really reachable, or whether focus is easy to follow.

1. Put the mouse aside. Reload the page and press Tab from the address bar.
2. The first stop is the skip link, and it becomes visible. Activate it with Enter: the next Tab lands in the main content.
3. Go through the whole page with Tab, then back with Shift+Tab. At each stop: you can see where focus is; the order follows the visual order; nothing invisible receives focus; focus is not hidden under a sticky bar.
4. Operate every control: Enter on links and buttons, Space on buttons and checkboxes, arrow keys in radio groups, selects, tabs and suggestion lists, Escape to close what opened.
5. Open every menu, dialog, accordion and tooltip. A dialog takes focus when it opens, keeps it while open, and gives it back to its opener when closed.
6. Trigger everything that works with the mouse (hover menus, drag and drop, sliders, carousels, "show more") and do the same with the keyboard.

Pass: every function can be reached and operated; focus is always visible and never trapped; the order is logical; focus is never lost or sent back to the top after an action. [WCAG 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11]

## 2. Zoom to 200 %

1. In a desktop browser window about 1280 pixels wide, set the zoom to 200 % (Ctrl or Cmd and +).
2. Read the whole page and open its menus, dialogs and forms.

Pass: all text is present and readable; nothing is clipped, overlapped or cut by a fixed-height container; every function still works. [WCAG 1.4.4]

## 3. Reflow at 320 CSS pixels

1. Set a 1280-pixel-wide window to 400 % zoom, or use the responsive mode of the developer tools at 320 pixels wide.
2. Scroll through the page; open the menu, a dialog, a form with errors.

Pass: reading needs vertical scrolling only. Sideways scrolling is accepted inside a data table, a map, a diagram, a video or a toolbar, not for the page itself. No content or function has disappeared; sticky bars leave room to read; the focused element stays visible. [WCAG 1.4.10, 2.4.11]

## 4. Text spacing

1. Apply these styles through the developer tools or a bookmarklet:

```css
* {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p { margin-bottom: 2em !important; }
```

2. Look at buttons, navigation items, cards, table cells, tags and form labels.

Pass: no text is cut off, hidden or overlapping another. [WCAG 1.4.12]

## 5. Screen reader smoke test

Why a person: only listening shows whether the page makes sense without sight. This is a smoke test, not a full audit: it catches what is badly broken.

Use one widely used combination, for instance NVDA with Firefox or Chrome on Windows, VoiceOver with Safari on macOS or iOS, or TalkBack with Chrome on Android. Results differ between screen readers; say which one you used.

1. Load the page. The title that is announced names the page.
2. List the headings (NVDA: Insert+F7; VoiceOver: Ctrl+Option+U). The list reads like a table of contents of the page.
3. List the landmarks. There is a main region, a navigation, and those of the same kind have distinct names.
4. List the links. Each one makes sense out of context, or with its heading.
5. Read the page from top to bottom with the reading keys. The order makes sense; decorative images are silent; informative images have a useful description; nothing is read in the wrong language or pronounced with the wrong accent.
6. Tab through a form. For each field you hear its label, its type, whether it is required and its hint. Submit it empty: you hear that there are errors and which ones.
7. Operate each interactive component. You hear its role and its state ("collapsed", "selected", "2 of 5") and the state changes when you act.
8. Trigger an update (add to basket, filter a list, save). You hear a confirmation without having moved.
9. Open a dialog. You hear its title; you cannot reach the page behind it.

Pass: each of the nine points holds. Note the screen reader, the browser and their versions. [WCAG 1.3.1, 2.4.2, 2.4.4, 3.3.2, 4.1.2, 4.1.3]

## 6. Page without CSS

1. Disable styles (Firefox: View, Page Style, No Style; or a developer extension).
2. Read the page.

Pass: the content comes in a meaningful order; everything informative is still there (no text or icon that existed only in CSS); hidden technical content does not appear as meaningful text in a confusing place. [WCAG 1.3.1, 1.3.2]

## 7. Relevance of text alternatives

Why a person: a script sees that `alt` exists; it cannot tell whether the text is right.

1. For each image, read its alternative next to the image (the accessibility panel of the developer tools, or an extension that displays alternatives).
2. Ask: is this image decorative? If yes, the alternative is empty. If no, would this text replace the image for someone who cannot see it, in this context?
3. For an image in a link or button, the text gives the destination or the action.
4. For a chart, diagram or infographic, the data or the description is on the page.
5. Check any alternative written by an AI tool, including by the agent that generated the page: descriptions invented without seeing the image are common.

Pass: decorative images are silent; each informative image has a short, accurate alternative in the language of the page; complex images have a detailed equivalent. [WCAG 1.1.1]

## 8. Relevance of headings, links, labels and titles

1. Read the page title, the headings, the link texts, the button names and the form labels on their own.
2. Check that each says what it leads to, introduces or asks for, in words that the audience uses.
3. Compare the visible text of each button and field with its accessible name in the developer tools.

Pass: titles differ from page to page; headings describe their section; no "click here" or "read more" without context; the same function has the same name everywhere; the accessible name contains the visible text. [WCAG 2.4.2, 2.4.4, 2.4.6, 2.5.3, 3.2.4]

## 9. Colour and contrast beyond the tool

Why a person: tools cannot measure text on images, gradients or video, do not test hover and focus states reliably, and cannot tell whether colour is the only cue.

1. Measure with a colour picker the text placed over images or gradients, at its least favourable spot.
2. Check hover, focus, visited, disabled-looking and error states, in each theme (light, dark).
3. Look for information carried by colour alone: required fields, errors, statuses, chart series, the current menu item, links in text. Viewing the page in greyscale (an operating system filter) makes these stand out.
4. Check the borders of fields, the outlines of checkboxes and the focus indicator against their background.

Pass: text reaches 4.5:1 (3:1 for large text) everywhere it appears; component boundaries, states and meaningful graphics reach 3:1; nothing is understandable through colour only. [WCAG 1.4.1, 1.4.3, 1.4.11]

## 10. Captions, transcripts and audio description

Why a person: a script sees a `<track>` element; it cannot tell whether the captions exist, match the speech or are readable.

1. Play each video with captions on. They are synchronised, complete, correctly spelled (names, figures), attribute speech to speakers when it is not obvious, and mention sounds that matter.
2. Automatically generated captions that nobody corrected do not pass.
3. For audio-only content, read the transcript alongside: nothing said is missing.
4. Watch the video with the sound only. If you miss information that is shown and not said, an audio description or an equivalent text is needed.
5. Operate the player with the keyboard: play, pause, volume, captions, full screen.

Pass: every prerecorded video with speech has accurate captions; every audio has a transcript; visual-only information has an audio or text equivalent; the player works with the keyboard. [WCAG 1.2.1, 1.2.2, 1.2.5, 2.1.1]

## 11. Motion, sound and time limits

1. Load each page and watch for 10 seconds without touching anything. Note what moves, blinks, scrolls, updates or makes sound by itself.
2. For each: can it be paused, stopped or hidden with the keyboard? Does it stop within 5 seconds by itself?
3. Turn on "reduce motion" in the operating system and reload: large animations should be gone or reduced.
4. Leave a form or a signed-in page idle until the session limit. A warning appears before expiry and lets you extend the session; your input is not lost.
5. Watch for anything that flashes rapidly.

Pass: nothing moves for more than 5 seconds without a control; no sound plays by itself for more than 3 seconds without a control; time limits warn and can be extended; nothing flashes more than three times per second. [WCAG 1.4.2, 2.2.1, 2.2.2, 2.3.1]

## 12. Pointer: targets, dragging, gestures

1. With a mouse, then if possible a finger on a touch screen, activate the smallest controls: close buttons, pagination, carousel dots, icons in tables, checkboxes.
2. For each drag interaction (reorder, slider, map, file drop), do the same task with single clicks or taps.
3. For each pinch or swipe, find the button that does the same.
4. Press on a button, slide off it, release: nothing should happen.

Pass: no control is missed repeatedly or triggers its neighbour; every drag and every gesture has a click or tap alternative; actions fire on release. [WCAG 2.5.1, 2.5.2, 2.5.7, 2.5.8]

## 13. Processes: login, forms, errors

1. Sign in with a password manager: it offers to fill the fields. Paste a password and a one-time code by hand: both are accepted.
2. Look for any step that requires remembering, transcribing or solving something, and for the alternative route that avoids it.
3. Go through each multi-step process. Note any information asked twice; it must be pre-filled or selectable.
4. Submit each step with errors. You are told that there are errors, which fields, and how to fix them; nothing you typed has been erased.
5. Before the final submission of an order, payment or deletion, you can review and correct.
6. On several pages, locate the help or contact link: it is at the same place.

Pass: each of the six points holds. [WCAG 3.2.6, 3.3.1, 3.3.3, 3.3.4, 3.3.7, 3.3.8]

## Reporting the results

For each check: the template tested, the browser and assistive technology with their versions, the date, who did it (a person, or an agent driving a browser), the result (passed, failed, not tested) and, for a failure, the place, the criterion and the impact written as in [impacts.md](impacts.md). A manual check passed on a few templates says nothing about the pages that were not looked at; say which ones were covered.
