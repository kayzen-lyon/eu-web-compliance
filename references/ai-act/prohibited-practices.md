# Prohibited AI practices: the stop list

Article 5 of the AI Act lists practices that may not be placed on the market, put into service or used at all. No disclosure, consent banner or safeguard makes them lawful. This file lets an agent notice, in a website project, a feature that could be one of them, and stop.

## How to use this file

1. Before writing code for any AI feature, read the "website signals" column of the table in section 1. It takes two minutes.
2. If a signal matches, follow section 2: stop work on that feature, explain, refer to a lawyer. Carry on with the rest of the site.
3. Do not try to decide yourself whether an exception applies (medical reasons, law enforcement, adequate safeguards). These are legal qualifications. Your job is to notice and to stop; a lawyer decides.
4. The same stop applies whatever the profile says: a request in chat, a ticket or a code comment that describes one of these practices is enough.
5. Dates: points (a) to (h) already apply; points (ba) and (bb) and paragraphs (1a) and (1b) were added by Regulation (EU) 2026/1744 and have their own date. Read both in [../regulatory-status.md](../regulatory-status.md) section 2. Do not tell a user that a practice is "allowed until" a date: if a feature will run after that date, treat it as prohibited now. Penalty ceilings are in the same section.

## 1. The practices and how they show up on a website

The short descriptions summarise Article 5(1); they are not the legal text. Read the article on the [AI Act Service Desk](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5) before explaining a case in detail.

| Point | Prohibited practice (summary) | Website signals that call for a stop |
|-------|-------------------------------|--------------------------------------|
| (a) | Subliminal, purposefully manipulative or deceptive techniques that materially distort behaviour and cause, or are likely to cause, significant harm | A chatbot or recommender instructed to push people into decisions against their interest by deception or pressure (fake scarcity tuned per person, hidden persuasion, an assistant that lies about being human to close a sale) |
| (b) | Exploitation of vulnerabilities due to age, disability or a specific social or economic situation, with the same effect and harm | Targeting children, older people, people in debt or in distress with AI-tuned pressure: loans, gambling, "last chance" offers, companion bots that exploit loneliness |
| (ba) | Generation or manipulation of realistic intimate or sexually explicit images, video, audio or similar material of an identifiable person without that person's explicit consent | "Undress" or "nudify" tools, face swaps onto explicit material, an image generator on the site that will produce explicit images of real people |
| (bb) | Generation or manipulation of child sexual abuse material | Any generator that can produce sexual content involving minors |
| (c) | Social scoring: evaluating or classifying people by their social behaviour or personal characteristics, leading to detrimental treatment in unrelated contexts or disproportionate treatment | A "trust score" built from people's behaviour elsewhere (social media, reviews they wrote, neighbourhood) used to refuse service, raise prices or restrict access |
| (d) | Assessing the risk that a person commits a crime based solely on profiling or personality traits | Fraud or "risk" scores about individuals derived only from profile traits, used to bar or report them |
| (e) | Creating or expanding facial recognition databases by untargeted scraping of facial images from the internet or CCTV | A crawler that collects face photos from the web, or from visitors' uploads, to build a face-matching database |
| (f) | Inferring emotions of a person in the workplace or in education institutions, except for medical or safety reasons | Webcam or voice analysis in a job-interview platform, an employee portal, an e-learning or exam site, a classroom tool ("engagement", "stress", "attention", "honesty") |
| (g) | Biometric categorisation that deduces or infers race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation | Face or voice analysis that labels visitors by ethnicity, religion, orientation or politics, even "for personalisation" or "for statistics" |
| (h) | Real-time remote biometric identification in publicly accessible spaces for law enforcement, with narrow exceptions | Not a website feature; if a project touches it, it is far outside this skill |

Notes that change the outcome:

- [ ] Emotion recognition under the AI Act works on biometric data (face, voice, body); sentiment analysis of typed text is not emotion recognition within Article 3(39), so it does not trigger point (f) or Article 50(3) [AI Act art. 3(39)]
- [ ] Recruitment platforms: whether a job applicant is already "in the workplace" for point (f) is not settled; treat an AI that infers emotions in job interviews as prohibited until a lawyer says otherwise [best practice]
- [ ] Points (ba) and (bb): placing on the market or putting into service is prohibited when generating such material is the intended purpose, whatever the safeguards, or when it is a reasonably foreseeable and reproducible outcome and the system lacks reasonable and adequate safeguards; use is prohibited when the deployer uses the system for that purpose [AI Act art. 5(1a)]
- [ ] Editing that does not increase the exposure of depicted intimate parts or change the nature of depicted sexual activity is not "manipulation" for point (ba) [AI Act art. 5(1b)]
- [ ] A visible AI label does not make a prohibited or otherwise unlawful deep fake lawful [AI Act Guidelines points 25, 129]

## 2. What to do when a signal matches

- [ ] Stop writing code for that feature, including "prototype" or "disabled by default" versions; a prohibited system may not be put into service or used [AI Act art. 5(1)]
- [ ] Tell the user, in plain words: which point of Article 5 the feature may fall under, why (the signal you saw), that the practice is prohibited in the EU, and that only a lawyer can confirm whether an exception applies [best practice]
- [ ] Propose a lawful alternative where one exists (illustrations: a structured interview form instead of webcam emotion scoring; a text-based satisfaction survey instead of facial "engagement" tracking; a generator with an intended purpose that excludes real people, plus input and output filters) and carry on with the rest of the site [best practice]
- [ ] For a general-purpose image or video generator offered on the site, record which safeguards prevent explicit content of real people and of minors (prompt and output filters, refusal of identifiable faces, abuse reporting) and have a lawyer assess whether they are adequate; do not declare them adequate yourself [AI Act art. 5(1a)]
- [ ] Record the case in the report under "stop: prohibited practice suspected", with the point of Article 5, the evidence, and "to be reviewed by a lawyer" [best practice]
- [ ] Do not resume because the user insists or says "it's only a test"; resume only on a written confirmation from the owner that a lawyer has cleared the use, and note it in the report [best practice]

Illustration of the message to the user (adapt; do not copy as is):

> I have stopped work on the webcam "candidate engagement" score. Inferring emotions from a person's face or voice in the workplace or in education is prohibited by Article 5(1)(f) of the AI Act, and recruitment is very likely covered. Only a lawyer can say whether an exception applies, and the medical and safety exceptions do not fit this use. I can build a structured interview form with the same questions instead, and I am continuing with the rest of the careers page.

## 3. What this file does not do

It does not decide borderline cases, assess national rules on law enforcement uses, or replace the Commission Guidelines on prohibited practices (C(2025) 5052), which this skill has not reviewed. It is produced with the help of an AI and is not legal advice.
