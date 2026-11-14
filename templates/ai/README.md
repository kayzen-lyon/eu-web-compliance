# AI transparency components

Framework-free reference components for the notices that Article 50 of the AI Act calls for on a website, built to the accessibility rules of this skill. No dependency, no build step, no network request of their own. MIT licence, like the rest of this skill.

This is reference code produced with the help of an AI. Using it does not make a site compliant: whether a notice or a label is required, and what it must say, depends on facts the site owner provides ([../../references/ai-act/transparency.md](../../references/ai-act/transparency.md)). It is not legal advice.

## How to use this file

1. Decide first, with [../../references/ai-act/transparency.md](../../references/ai-act/transparency.md), which notices the feature needs. Run [../../references/ai-act/prohibited-practices.md](../../references/ai-act/prohibited-practices.md) before any of them.
2. Copy the fragment, `ai.css` and (for the chat) `ai-chat.js`; replace every `[placeholder]` with facts from the operator; translate every visible text and every `data-*` text into the language of the page.
3. Re-run the accessibility check (section 4) on the page that uses them, and report what it cannot prove as "not tested".

| File | What it is |
|------|------------|
| `ai-chat-disclosure.html` | Chat launcher and panel: notice before the first message, persistent "AI" badge, speaker named in every message, honest answer to "are you a human?", optional human route |
| `ai-chat.js` | Behaviour of the chat panel; wires to the real assistant through `window.aiChatRespond` |
| `ai-content-label.html` | Labels for AI-generated or AI-modified images, video, audio, articles and parts of articles |
| `ai.css` | Styles for both; colours are custom properties |
| [ai-usage-page.md](ai-usage-page.md) | Template of a "Use of AI on this site" page, with what comes from the operator |

## 1. Chat disclosure

Install: put the launcher and the panel where the design wants them (panel right after the launcher in the DOM), `ai.css` in `<head>`, `<script src="/ai/ai-chat.js" defer></script>`. Connect the assistant:

```js
// Illustration: adapt to the project's API. Return plain text; the component never inserts HTML.
window.aiChatRespond = async (message, history) => {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!response.ok) throw new Error('Assistant unavailable');
  const data = await response.json();
  return data.answer;
};
```

Choices and why:

- The notice is in the HTML of the panel, above the field, so it is perceived before the first message can be sent, and the field points to it with `aria-describedby`, so a screen reader reads it when the field gets focus. Article 50(5) asks for the information at the latest at the first interaction.
- The badge "AI · Not a person" stays in the panel header for the whole conversation. The Guidelines recommend a first-turn notice combined with a persistent label.
- Each message starts with its speaker in text ("AI assistant:", "You:"). Visual layout (bubbles left and right, colours) is lost to a screen reader; the text label is not. The log is a `role="log"` region, so new messages are announced politely without moving focus.
- "Are you a human?" is answered by the page with a fixed sentence (`data-identity-answer`), before and independently of the model. A model can be prompted, jailbroken or simply wrong; the Guidelines say the system must always disclose its nature when asked. The patterns cover English and French; add the languages of the site. Also instruct the model, in its system prompt, never to claim to be a person.
- The panel is a labelled region, not a modal: the visitor can read the page next to it, and focus is not trapped. Escape and "Close the assistant" return focus to the launcher.
- The human route is a link the operator provides. Delete that paragraph if there is none: suggesting a person who does not exist is misleading.
- Messages are inserted with `textContent`. Never switch to `innerHTML` to render Markdown from the model without sanitising it: a model's output is untrusted input.

If the operator uses a vendor widget instead of this panel, check the widget against the same list: notice before the first message, persistent AI indicator, speaker announced, honest answer, keyboard and screen reader use. Many widgets show the vendor's name but never the word "AI", which is not enough ([../../references/ai-act/transparency.md](../../references/ai-act/transparency.md) section E).

## 2. Content labels

- The label is visible text on or next to the content, in the DOM, saying "Generated" or "Modified" with the letters "AI". The Code of Practice asks for a label detectable by assistive technologies, with high contrast, visible at first exposure without any action.
- On images, the badge sits on the image, top right, the placement the Code gives as an example, and the caption repeats it in full words. The `alt` text describes the image as usual; the AI status is in the badge and caption, not hidden in `alt` alone.
- On video and audio, the label is also above the player (`aria-describedby` on the player), because the visual overlay is invisible to people who do not see it and the media file may be shared elsewhere. The disclosure also has to be inside the media itself (spoken or on screen at the start and after breaks) and in the captions or transcript: that part is content, produced by the operator.
- On articles, the label is under the headline; on a part of a text (an AI summary), at the start of that part.
- The EU icons are optional. If the operator wants them, download them from the official page linked in the fragment and give the `<img>` an `alt` such as "AI-generated". They are not bundled here, so that the files used are always the current official ones.

## 3. What these components do not do

- They do not mark files in a machine-readable way (Article 50(2)): that is the generator's job. Keep the provenance metadata the generator adds; image optimisation pipelines often strip it.
- They do not decide whether an image is a deep fake or a text is of public interest. That is the decision tree in [../../references/ai-act/transparency.md](../../references/ai-act/transparency.md) section B, and sometimes a person's call.
- They do not make a prohibited or high-risk feature acceptable.

## 4. Verification

From the skill root, on a page that includes the components:

```sh
node scripts/check-a11y.mjs path/to/page-folder
```

Then check by hand what the script cannot: that the notice wording is right in the page's language, that a screen reader announces "AI assistant" on each answer, and that asking "are you a person?" in each supported language returns the fixed answer.
