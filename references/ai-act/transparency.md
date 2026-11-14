# Article 50 transparency on a website: decision trees

What to show visitors when a website uses AI, as decision trees an agent can follow branch by branch. Each branch ends with the UI or markup to produce and its source.

## How to use this file

1. Settle the role first ([roles-and-scope.md](roles-and-scope.md)). Then run [prohibited-practices.md](prohibited-practices.md): transparency never makes a prohibited feature lawful [AI Act Guidelines point 25].
2. Run each tree that matches a feature: A for a chatbot, voice assistant or agent; B for published AI-generated or AI-modified content; C for emotion recognition or biometric categorisation. The paragraphs apply cumulatively: one feature can trigger several [AI Act Guidelines point 15].
3. Every notice and label then follows section D (how, when, accessibly) and avoids section E (what does not count).
4. A tree ends in one of three results: **applies** (build it), **does not apply** (say why in one line, build nothing), **to confirm** (build the protective version and tell the user which fact a person must decide). Write the result and its source in the report.
5. The Guidelines are non-binding and the Code of Practice is voluntary. Where a rule below rests on them, it is the Commission's reading or the recognised way to demonstrate compliance, not the text of the Regulation. Dates: [../regulatory-status.md](../regulatory-status.md) section 2. The reference components are in [../../templates/ai/](../../templates/ai/README.md).

## A. Chatbot, voice assistant or AI agent on the site (Article 50(1))

```
A1  Does the visitor exchange messages, speech or actions with it, and does it answer
    with output it generates (not a fixed menu or a rule table)?
      no  -> 50(1) does not apply (not interactive, or not AI: roles-and-scope.md section 1)
      yes -> A2
A2  Who is the provider? (roles-and-scope.md section 2)
      operator (or both)  -> 50(1) is the operator's own duty -> A3
      vendor only         -> 50(1) is the vendor's duty; the site still shows the notice -> A3
      unknown             -> to confirm; build the notice -> A3
A3  Is the audience only trained professionals who cannot mistake it for a person
    (internal tool for developers, for example)?
      no, or the public / consumers can reach it -> notice required: A4
      yes -> the "obvious" exception may be arguable: to confirm with a lawyer; build the notice anyway
A4  Build: notice before or at the first message, persistent indicator, AI identified in
    every message for screen readers, honest answer to "are you human?", route to a human
    where one exists -> templates/ai/ai-chat-disclosure.html
```

Why A3 almost always ends in "notice required": the Guidelines read the "obvious" exception narrowly and say it cannot be relied on when the general public or consumers, including children, older people, persons with disabilities or low AI literacy, can reach the system [AI Act Guidelines point 45]. A website chatbot is reachable by anyone.

- [ ] Persons interacting with an AI system intended to interact directly with natural persons are informed that they are interacting with an AI system, unless it is obvious in the context [AI Act art. 50(1)]
- [ ] The notice is given at the latest at the first interaction: show it in the chat panel before the visitor can send a first message, or as the first assistant turn [AI Act art. 50(5); AI Act Guidelines point 33]
- [ ] The wording says plainly that the counterpart is an AI system, not a person, in the language of the page; illustrations: "You are chatting with an AI assistant, not a person." / « Vous échangez avec un assistant d'intelligence artificielle, pas avec une personne. » [AI Act Guidelines points 35, 37]
- [ ] Place the notice close to the input field or the conversation, not in the page footer [AI Act Guidelines point 37]
- [ ] Keep a persistent indicator (badge or label with the letters "AI" and text) visible for the whole conversation, in addition to the first notice [AI Act Guidelines point 37]
- [ ] Repeat or reinforce the notice when the visitor may be vulnerable or misled: health, financial, insurance or legal advice, complaints handling, emotional or long conversations, children in the audience, agents acting for the visitor [AI Act Guidelines point 40]
- [ ] The assistant always discloses that it is an AI when asked about its nature ("are you a real person?", "am I talking to a bot?") and when the visitor seems confused about it; instruct the model accordingly and test it [AI Act Guidelines point 40]
- [ ] Do not represent the assistant as a person: no human photo or avatar, no human-sounding persona that may mislead visitors [AI Act Guidelines points 38, 45]
- [ ] If the assistant has a product name, show "AI" next to it every time it appears ("Lumen, AI assistant"), so the name never reads as a colleague's [best practice]
- [ ] A voice assistant says that it is an AI at the start of the call or session, in words; a tone or earcon alone is not enough [AI Act Guidelines point 37]
- [ ] An AI agent that acts for someone (books, buys, writes to people) discloses both that it is an AI and on whose behalf it acts, at each new interaction [AI Act Guidelines point 31]
- [ ] Notices for children, where children are in the foreseeable audience, are short, simple, age-appropriate and in the official language of the country served [AI Act Guidelines points 34, 143]
- [ ] When the operator offers a human channel (support team, phone, form), show how to reach it from the chat panel; when it does not, do not suggest one exists [best practice]
- [ ] If the service sold is itself AI-driven (subscription chatbot, AI coaching), say so in the pre-contractual information too; consumer law applies whether or not the AI is "obvious" [AI Act Guidelines point 50]
- [ ] Chat logs are personal data: the privacy notice covers them, and the AI notice does not replace the GDPR information [AI Act Guidelines point 52]

What 50(1) does not ask: it does not require naming the model or vendor, and a statement such as "powered by a large language model" does not replace the plain notice [AI Act Guidelines point 38]. Chatbot replies shown only to the person who asked are not "published" text under 50(4) [AI Act Guidelines point 131].

## B. AI-generated or AI-modified content on the site (Article 50(2) and 50(4))

Two different duties. **50(2)** (provider): the system that generated the content marks it in a machine-readable, detectable way. **50(4)** (deployer): whoever uses the system to make deep fakes or public-interest text labels them visibly. 50(4) applies on top of 50(2); the provider's invisible mark never discharges the deployer's visible label [AI Act Guidelines points 111, 117].

### B0. Content that is never labelled under Article 50

```
B0  Is the "content" one of these?
      source code, HTML, CSS, configuration, schemas, scripts, and comments that are part of them
      single words, captions, alt text, UI labels, icon-scale graphics, data labels
      machine-to-machine output nobody sees
    yes -> 50(2) does not apply (Guidelines point 68). Short text cannot "inform the public" either
           (Guidelines point 131): 50(4) does not apply. Label nothing.
    no  -> B1
```

- [ ] Do not add "AI-generated" comments, headers or labels to code, markup or configuration written with an AI tool: source code and its integral comments are outside Article 50(2) [AI Act Guidelines point 68]
- [ ] Alt text, image captions and UI labels drafted with AI need no AI label under Article 50; they still have to be accurate and are checked by a person ([../accessibility/rules.md](../accessibility/rules.md)) [AI Act Guidelines point 68]

### B1. Who generated it, and with what?

```
B1  Did the operator's own system generate it (operator = provider, roles-and-scope.md)?
      yes -> 50(2) applies to the operator: B2, then B3
      no (third-party tool) -> 50(2) is the tool provider's duty; keep its marks: B3
```

### B2. Machine-readable marking (provider only)

```
B2  Is the AI step only standard editing that leaves meaning, style and intent unchanged?
    (grammar and spelling, minor polishing, translation, transcription, format conversion,
     compression, noise removal, minor crop or colour correction, face blurring)
      yes -> exception: 50(2) does not apply to that output (Guidelines point 92)
      no  (generation, summary, paraphrase or rewrite that changes style, structure or meaning,
           object or person inserted or removed, face swap, cloned voice) -> mark it
```

- [ ] A provider of a system that generates synthetic audio, image, video or text marks the outputs in a machine-readable format and makes them detectable as artificially generated or manipulated, as far as technically feasible [AI Act art. 50(2)]
- [ ] Summaries, paraphrases and rewrites that change style, structure or meaning are not standard editing and are marked [AI Act Guidelines point 92]
- [ ] The Code of Practice asks signatory providers for at least two marking layers (signed metadata and an imperceptible watermark) and a free detection tool; for a website that builds on a model API, first check what the model provider already marks and detects, and record it [AI CoP section 1, measures 1.1 and 2.1]
- [ ] Marking alone is not enough under the Code: the provider also offers a way to check the mark [AI CoP section 1, measure 2.1]
- [ ] Do not strip provenance metadata from generated files in the image pipeline (resizing, CDN optimisation, re-encoding); configure the tools to keep it, and test that it survives [AI CoP section 1, measure 1.2]

Marking techniques for free text are immature, and the Code names no specific standard. When the operator is a provider of a text generator, record "50(2): marking approach to confirm" rather than inventing a technique.

### B3. Visible label (deployer): images, video, audio

```
B3  Image, video or audio that the operator publishes, made or changed with AI.
B3a Only insignificant edits (background details, lighting, colour, noise, compression,
    cosmetic touches, a real product placed on an AI background without misleading)?
      yes -> not a deep fake (Guidelines point 116): 50(4) does not apply
      no  -> B3b
B3b Does it resemble realistic persons, objects, places, animals or events
    (things that exist or could plausibly exist)?
      no (fantasy, cartoon, physically impossible scene) -> not a deep fake (point 113): no label required
      yes -> B3c
B3c Could it falsely appear authentic or truthful to someone in the foreseeable audience,
    including children or people with low digital literacy? No intent to deceive is needed.
      yes -> deep fake: label it (B3d)
      unsure -> to confirm; label it (B3d) meanwhile
B3d Is it part of an evidently artistic, creative, satirical or fictional work?
      evidently yes -> attenuated: disclose in a way that does not spoil the work
      no, or mixed with informative content -> full label at first exposure
```

E-commerce note: an AI-generated product photo that makes the product look different, better or more appealing than the real one is given by the Guidelines as an example of a deep fake [AI Act Guidelines point 116]; the same picture would also raise misleading-advertising questions under consumer law. A real photo of the product on a generated background, for aesthetic purposes, is given as a minor change [AI Act Guidelines point 116].

- [ ] Deployers of a system that generates or manipulates image, audio or video content constituting a deep fake disclose that the content has been artificially generated or manipulated [AI Act art. 50(4)]
- [ ] Judge "falsely appear authentic" against the whole foreseeable audience, not an average viewer: if children or people with low AI literacy could be fooled, it is a deep fake [AI Act Guidelines point 115]
- [ ] The label is visible or audible without tools or extra action; the provider's machine-readable mark does not count [AI Act Guidelines point 117]
- [ ] For an evidently artistic, creative, satirical or fictional work, disclose in a manner that does not hamper the work (credits, description next to it); when informative and creative content mix, the full label applies [AI Act art. 50(4); AI Act Guidelines points 122, 123]
- [ ] On images and video, place the label where no other overlay covers it (the Code gives the top right corner as an example), or adjacent to the frame as part of the page when the work is shown on a website [AI CoP section 2, measure 1.2]
- [ ] For video, show the label at the start and, where possible, at intervals and after breaks, because viewers join at different moments [AI CoP section 2, measure 1.2; AI Act Guidelines point 143]
- [ ] For audio, say it at the start in plain words, and add a visual label where the page shows a player [AI CoP section 2, measures 1.1 and 1.2]
- [ ] Labelling a deep fake does not make it lawful: depicting real people may also need their consent under data protection and personality rights [AI Act Guidelines points 127, 129]

### B4. Visible label (deployer): text

```
B4a Is the text published, i.e. open to an indeterminate, fairly large number of readers
    (paywalled or not)? Closed groups, private messages, intranets are not.
      no -> 50(4) does not apply
B4b Does it aim to inform the public on a matter of public interest (politics, public
    administration, justice, fundamental rights, security, public health, environment,
    consumer safety, economic, financial, scientific or cultural developments open to debate)?
      no (fiction, ordinary advertising copy, product descriptions without health, safety
          or sustainability claims) -> 50(4) does not apply
      unsure -> to confirm; label meanwhile
B4c Did a competent person review the substance before publication, fact-checking at
    least, AND does a named person or company hold editorial responsibility?
      both yes, and no substantive AI change after sign-off -> exception: no label;
           publish who holds editorial responsibility, with contact details
      otherwise -> label the text (B4d)
B4d Label above or at the top of the text, near the headline, or at the start of the
    AI-written part -> templates/ai/ai-content-label.html
```

- [ ] Deployers of a system that generates or manipulates text published to inform the public on matters of public interest disclose that the text was artificially generated or manipulated [AI Act art. 50(4)]
- [ ] The editorial exception needs both conditions: human review or editorial control of the substance, and a natural or legal person holding editorial responsibility [AI Act art. 50(4); AI Act Guidelines point 133]
- [ ] Fact-checking is the minimum of human review; spell-checking, formal checks, an editorial policy that is not applied, automated review or a cursory approval do not count [AI Act Guidelines points 134, 135]
- [ ] Any substantive AI change after the editorial sign-off voids the exception for that text [AI Act Guidelines point 136]
- [ ] When the exception is relied on, publish the identity and contact details of whoever holds editorial responsibility in an easy-to-find place (legal notice, "About", masthead) [AI Act Guidelines point 138]
- [ ] An AI translation of a public-interest article is listed among the texts that rely on human review to escape the label: label an unreviewed machine-translated news article, or have it reviewed [AI Act Guidelines point 138]
- [ ] Product descriptions and advertising copy without health, consumer-safety or sustainability claims are given as outside 50(4) [AI Act Guidelines point 131]
- [ ] Place the text label above the text, near the headline or at the start; when only part is AI-generated, the label may cover only that part [AI CoP section 2, measure 1.2]
- [ ] Text generated before the date Article 50 became applicable but published on or after it is labelled; content already published before needs no retroactive label (dates: [../regulatory-status.md](../regulatory-status.md) section 2) [AI Act Guidelines point 154]

### B5. Generators offered to visitors

When the site lets visitors generate text, images, audio or video:

- [ ] If the operator is the provider of the generator, its outputs are marked under Article 50(2) before they leave the system (download, share link, publication on the site) [AI Act art. 50(2)]
- [ ] Visitors who generate content for themselves are not deployers when acting in a purely personal capacity; the provider's marking duty still applies to their outputs [AI Act Guidelines points 19, 20]
- [ ] The Code encourages providers of generators to offer an option that applies a perceptible label to an output; on the site, this can be a checkbox that adds the label of [../../templates/ai/ai-content-label.html](../../templates/ai/ai-content-label.html) when a visitor publishes generated content [AI CoP section 1, measure 1.4]
- [ ] A generator that can produce images or video of real people runs the Article 5(1)(ba) and (bb) check of [prohibited-practices.md](prohibited-practices.md) before anything else [AI Act art. 5(1a)]

## C. Emotion recognition or biometric categorisation (Article 50(3))

Run [prohibited-practices.md](prohibited-practices.md) first: at work and in education, emotion inference is prohibited, and biometric categorisation inferring sensitive traits is prohibited everywhere. Emotion recognition is also an Annex III area ([high-risk.md](high-risk.md)). This tree only applies to a use that a lawyer has confirmed is allowed.

```
C1  Does the feature use biometric data (face, voice, body, keystroke or gait patterns)?
      no -> not an emotion recognition or biometric categorisation system under Article 3(39)
            and (40): sentiment analysis of typed text is not one. 50(3) does not apply.
      yes -> C2
C2  Does it infer emotions or intentions, or assign people to categories (age, gender...)?
      no -> 50(3) does not apply (identity verification is a different question: ask a lawyer)
      yes -> STOP (prohibited-practices.md, high-risk.md). If a lawyer confirms the use is
             allowed: inform the exposed persons before exposure (C3)
C3  Notice before the camera or microphone starts, saying that an emotion recognition or
    biometric categorisation system is operating; the GDPR information comes with it.
```

- [ ] Deployers of an emotion recognition or biometric categorisation system inform the natural persons exposed to it of the operation of the system, and process the personal data under the GDPR [AI Act art. 50(3)]
- [ ] The notice says that such a system is operating; the AI Act does not require stating its purpose, but the GDPR information does [AI Act Guidelines point 105]
- [ ] Give the notice at the latest at the first exposure; earlier is allowed, for example a dialog before the webcam starts [AI Act Guidelines points 107, 108]
- [ ] Article 50(3) covers biometric categorisation that is not high-risk too, such as age or gender estimation from a face [AI Act Guidelines point 104]
- [ ] Never start the camera or microphone before the notice has been shown and the visitor has acted on it [best practice]

## D. How to deliver every notice and label (Article 50(5))

- [ ] Give the information in a clear and distinguishable manner, at the latest at the time of the first interaction or exposure, and in conformity with the applicable accessibility requirements [AI Act art. 50(5)]
- [ ] Clear means noticeable, easy to understand and accessible, including to persons with disabilities and to children when they are in the audience [AI Act Guidelines point 142]
- [ ] Distinguishable means visibly separate from the surrounding content: its own element, its own styling, not a sentence lost in a paragraph [AI Act Guidelines point 142]
- [ ] First exposure is per person and, for content, per output: every visitor who meets the chatbot or the content gets the information, at least once per chat session [AI Act Guidelines point 143]
- [ ] When people may join content partway (long video, live stream, long page they land in the middle of), repeat the disclosure later too [AI Act Guidelines point 143]
- [ ] Article 50 adds no accessibility rule of its own: the notice follows the accessibility requirements that already apply to the site, which this skill implements through [../accessibility/rules.md](../accessibility/rules.md) [AI Act Guidelines point 144]
- [ ] The label is readable text, or an icon with an accessible name; it is not carried by colour alone and has enough contrast [AI CoP section 2, measure 1.1]
- [ ] Assistive technologies can detect the label: it is in the DOM near the content, not only in a CSS background or inside the image pixels [AI CoP section 2, measure 1.1]
- [ ] The notice and label are in the language of the page; the Code's icon uses the letters "AI" unless national language law requires otherwise [AI CoP section 2, measure 1.1]
- [ ] New notices added after load (first chat turn, warning in a running conversation) reach screen readers through a polite live region, not by stealing focus: see [../accessibility/components/status-messages.md](../accessibility/components/status-messages.md) [best practice]
- [ ] Publish what the labels mean, for example in the "Use of AI on this site" page of [../../templates/ai/ai-usage-page.md](../../templates/ai/ai-usage-page.md) [AI CoP section 2, measure 2.1]

### The EU icon (optional)

The Commission publishes free EU icons for AI-generated content in three variants: basic, fully generated, partially modified. Their use is optional and free; alternative text or ARIA labelling is recommended ([../regulatory-status.md](../regulatory-status.md) section 2.2). Do not copy the icon files into the project from memory or from this skill: download them from the official page, <https://digital-strategy.ec.europa.eu/en/policies/eu-icons-labelling-ai-generated-content>, and check the version there. A text label containing "AI" is an accepted equivalent [AI CoP section 2, commitment 1].

## E. What is not enough

Each of these, used alone, does not meet Article 50(1) or 50(5); the reason is in the source.

- [ ] A disclosure only in the terms and conditions, a URL or the documentation [AI Act Guidelines point 38]
- [ ] A generic site-wide banner or footer line such as "Services on this website use AI" [AI Act Guidelines point 38]
- [ ] An ambiguous label such as "Assistant", "Virtual agent" or "Sophie, your advisor" without the word AI [AI Act Guidelines point 38]
- [ ] A purely technical statement ("powered by GPT", "this system uses LLMs") that does not say the visitor is dealing with an AI [AI Act Guidelines point 38]
- [ ] A machine-readable mark, metadata or watermark that visitors cannot perceive [AI Act Guidelines points 38, 117]
- [ ] A notice hidden behind a menu, an info icon the visitor has to find, or a tooltip that appears only on hover [AI Act Guidelines point 142]
- [ ] An audio tone with no words [AI Act Guidelines point 37]
- [ ] A label that disappears before it can be read, or is shown only at the start of content people join later [AI Act Guidelines point 143]

## F. What to write in the report

For each AI feature: the paragraph (50(1) to 50(4)), the result (applies, does not apply, to confirm), who owes it (provider or deployer), the fact that decided it, and the component used. `python scripts/ai_act_classify.py <profile>` produces this table from the profile; the agent then checks the facts the script could not know. Every report states that it was produced with the help of an AI and is not legal advice.
