# Consent to trackers: the interface and its behaviour

How to ask for, record, renew and withdraw consent to trackers, and the specific cases of multi-device consent, session replay and tracking pixels in emails.

## How to use this file

1. Read [trackers.md](trackers.md) first: this file only applies to trackers that need consent. A site without such trackers needs no banner.
2. Sections 1 to 6 are the core of any consent interface. Section 7 (multi-device) only matters for sites with user accounts that want one choice for all devices. Sections 8 and 9 only matter if the site uses session replay or sends emails with tracking pixels.
3. Start from the reference implementation in [../../templates/consent/](../../templates/consent/README.md): it applies every rule below and the accessibility shell of [../accessibility/components/consent-banner-shell.md](../accessibility/components/consent-banner-shell.md). If the project uses a third-party consent tool instead, check it against the rules below and against the accessibility checklist of the shell; many tools fail one of them in their default configuration.
4. Tags: `GDPR` and `ePrivacy` are EU law, valid in every Member State. `LIL` is French law. `CNIL guidelines` state what the CNIL considers the law requires; `CNIL recommendation`, `CNIL pixels` and `CNIL session replay` are recommendations: the CNIL says they are neither prescriptive nor exhaustive. Following them is the safest way to meet the guidelines in France, and the reference banner does. They are French; for another Member State, check that country's authority. `[best practice]` has no official source.
5. Durations (how long a choice is kept, when to ask again) are in [../regulatory-status.md](../regulatory-status.md) section 3.3. They are recommended values, not legal limits.

Why the details matter: consent is only valid if it is free, specific, informed and unambiguous. An interface that nudges, hides refusal or bundles purposes produces consents that are not valid, so every tracker that relied on them was set unlawfully. The visitors affected are those who wanted to refuse and did not manage to; the site owner carries the risk.

## 1. Valid consent: the EU baseline

- [ ] Consent is a freely given, specific, informed and unambiguous indication of the visitor's wishes, by a statement or a clear affirmative action [GDPR art. 4(11); ePrivacy art. 5(3)]
- [ ] Ask before the tracker runs, and give clear and comprehensive information first, including the purposes [ePrivacy art. 5(3)]
- [ ] No pre-ticked box, no pre-activated switch, and no "consent" inferred from scrolling, continuing to browse or closing the page: these are not affirmative actions [GDPR art. 4(11); CNIL guidelines § 27]
- [ ] Without a positive action, treat the visitor as having refused, and run nothing that needs consent [CNIL guidelines § 27; CNIL recommendation § 2]
- [ ] Do not make access to the service conditional on consent to trackers that the service does not need, unless the case-by-case conditions for a cookie wall in section 4 are met [GDPR art. 7(4); CNIL guidelines § 17]
- [ ] The visitor can withdraw consent at any time, is told so before consenting, and withdrawing is as easy as consenting [GDPR art. 7(3)]
- [ ] The site owner can demonstrate that consent was given [GDPR art. 7(1)]
- [ ] Consent to trackers is never collected through acceptance of terms and conditions or a privacy policy [CNIL guidelines § 20; GDPR art. 7(2)]
- [ ] Browser settings alone do not count as consent, and a "do not track" or similar browser signal does not replace the banner (the proposal that would change this is not law, see [../regulatory-status.md](../regulatory-status.md) section 3.2) [CNIL guidelines § 44]

## 2. First level of information

The first level is what the visitor sees without clicking anything: the banner itself.

- [ ] Before the choice, tell the visitor at least: who is responsible for the trackers (identity of each controller, including joint controllers), the purposes, how to accept or refuse, the consequences of accepting or refusing, and that consent can be withdrawn [CNIL guidelines § 24]
- [ ] Present all purposes before the choice, each as a short, highlighted title with a brief description, in plain words the visitor understands [CNIL recommendation § 2.1; CNIL guidelines § 22]
- [ ] Offer a more detailed description of the purposes, reachable from the first level (a disclosure button or a link) [CNIL recommendation § 2.1]
- [ ] Make the complete, up-to-date list of companies that use trackers on the site reachable from the first level, with a descriptive name such as "list of companies using trackers on this site", and keep it permanently available elsewhere on the site [CNIL guidelines § 25; CNIL recommendation § 2.2]
- [ ] A link to the terms of use is not enough: the information is complete, visible and highlighted [CNIL guidelines § 23]
- [ ] Write the information in the language of the page, in simple terms, without legal or technical jargon [CNIL guidelines § 22]
- [ ] When a third party's trackers follow the visitor beyond this site, say so: the CNIL strongly recommends that consent be collected on each site concerned [CNIL recommendation § 2.2]

Illustration of first-level text (adapt to the real purposes and controllers; do not copy as is):

> We and the companies listed in [our partners list] would like to use trackers to: **measure our audience** (count visits and see which pages are read); **show videos** from an external platform, which sets its own trackers. You can accept or refuse all of them, or choose purpose by purpose. Refusing does not prevent you from using the site; videos will then show a link instead of the player. You can change your mind at any time with "Manage cookies" at the bottom of every page.

## 3. Accepting and refusing

### 3.1 EU baseline

- [ ] Refusing is possible for every purpose that needs consent [ePrivacy art. 5(3); GDPR art. 4(11)]
- [ ] Refusing requires no more effort than accepting: no extra screen, no extra click, no hidden link [CNIL guidelines § 30]

### 3.2 France: what the CNIL recommends

- [ ] Offer "Accept all" and "Refuse all" (or equivalent clear wording) on the same screen, at the same level and in the same format; the CNIL strongly recommends it [CNIL recommendation § 2.3]
- [ ] Give both buttons the same size, the same font size, the same legibility and the same emphasis; do not colour one as a call to action and the other as secondary [CNIL recommendation § 2.3]
- [ ] Offer, at the same level as these two buttons, a third control to choose purpose by purpose, with a descriptive label such as "Customise" or "Choose by purpose" [CNIL recommendation § 2.3]
- [ ] If closing the banner (a cross, "Continue without accepting") counts as a refusal, say so clearly in the banner [CNIL recommendation § 2.3]
- [ ] Do not use a refusal only reachable on a second layer while acceptance is one click away [CNIL FAQ refusal]

Wording: avoid labels that a quick reading could take for the opposite ("Continue" for "Accept", "Settings" as the only way to refuse). Use verbs that say what happens ("Accept all", "Refuse all", "Customise").

## 4. Per-purpose choice, deceptive design and cookie walls

- [ ] Ask consent separately for each distinct purpose; a global "Accept all" is allowed only if every purpose was presented first and a per-purpose choice remains available [CNIL recommendation § 2.3; CNIL guidelines § 19]
- [ ] Per-purpose controls are checkboxes unticked by default, switches off by default, or "Accept"/"Refuse" pairs with neither or "Refuse" selected; the state of each control is obvious at a glance [CNIL recommendation § 2.3]
- [ ] Do not group purposes that a visitor could reasonably want to accept separately (audience measurement and advertising, for example) under one switch [CNIL guidelines § 19]
- [ ] No design that suggests consent is mandatory or that visually favours one choice: no pre-selected "Accept", no colour or size difference, no guilt-tripping text, no countdown, no repeated prompts after a refusal within the retention period [CNIL recommendation § 2.3]
- [ ] Do not show the banner again on every page: once a choice is made (consent or refusal), keep it and apply it [CNIL recommendation § 2.3]
- [ ] A cookie wall (access refused without consent) is not banned in general but is lawful only case by case; if you build one, the information states clearly that refusing means no access to the content, and the decision belongs to the owner and their legal adviser, not to the agent [CNIL guidelines § 17-18]
- [ ] A paid alternative to consent (a "consent or pay" wall) is a cookie wall: flag it to the owner for legal review instead of building it by default [CNIL guidelines § 17]

The accessibility side (keyboard, contrast, focus, reflow at 320 px, announcements) is in [../accessibility/components/consent-banner-shell.md](../accessibility/components/consent-banner-shell.md). A consent interface that a keyboard or screen reader user cannot operate does not give them a free choice either.

## 5. Storing the choice, proving consent, asking again

### 5.1 Storing the choice

- [ ] Store the choice in a first-party cookie or storage entry that holds only the choice per purpose, its date and the version of the consent configuration; that tracker is exempt as long as it does nothing else [CNIL guidelines § 49]
- [ ] Store refusals as well as consents, so that a visitor who refused is not asked again on every page [CNIL recommendation § 2.3]
- [ ] Name the choice cookie `eu-consent`, with one true/false value per purpose, as the CNIL encourages [CNIL recommendation § 6]
- [ ] Keep the choice for the duration recommended by the CNIL, as a configurable value; the default comes from [../regulatory-status.md](../regulatory-status.md) section 3.3 and is a recommendation, not a legal maximum [CNIL recommendation § 2.3]

### 5.2 Asking again

- [ ] Ask again when the stored choice is older than the configured duration [CNIL recommendation § 2.3]
- [ ] Ask again when a purpose is added or a purpose's scope changes (new partner, new use), because the earlier consent did not cover it; version the configuration and compare the stored version [GDPR art. 4(11)]
- [ ] Do not ask again sooner after a refusal just because the visitor refused [CNIL recommendation § 2.3]

### 5.3 Proof of consent

The controller must be able to show, at any time, that a valid consent was given. Proof has two parts: that this visitor chose, and that the interface they saw was valid.

- [ ] Keep the elements that show the interface was valid when the consent was given: dated versions of the consent code (or a published, timestamped hash of it), dated screenshots of the banner for each version, and the configuration of the consent tool over time [CNIL recommendation § 4]
- [ ] If a record per visitor is kept, it holds the minimum: a random record identifier, timestamp, configuration version, choice per purpose and how it was expressed (accept all, refuse all, custom, contextual, withdrawal) [GDPR art. 5(1)(c); CNIL recommendation § 4]
- [ ] Do not add the IP address, the full user agent, an account identifier or a fingerprint to the consent record unless the owner has a documented reason; minimisation applies to proof too [GDPR art. 5(1)(c)]
- [ ] When another party collects consent for the site's partners, a contract clause alone is not proof: the party collecting consent makes the proof available to the others [CNIL recommendation § 4]

The reference loader exposes an optional hook that receives such a minimal record and sends nothing by itself; the server side, if any, is the project's.

## 6. Withdrawal and "Manage cookies"

- [ ] Withdrawing is as easy as consenting, at any time [GDPR art. 7(3)]
- [ ] Put a control that reopens the choices on every page, with a descriptive name such as "Manage cookies", in a place where visitors expect it (footer or a persistent icon) [CNIL recommendation § 3]
- [ ] The settings panel opened by that control lets the visitor refuse everything in one action, as easily as they accepted [GDPR art. 7(3); CNIL recommendation § 3]
- [ ] Tell the visitor how to withdraw before they consent [GDPR art. 7(3); CNIL recommendation § 3]
- [ ] On withdrawal, stop reading and writing the trackers of the withdrawn purpose: delete the site's own cookies and storage entries for that purpose and stop loading the third-party scripts concerned (reloading the page is the reliable way to stop code already running) [CNIL FAQ withdrawal; CNIL recommendation § 3]
- [ ] Third-party cookies set on the third party's own domain cannot be deleted by the site; tell the visitor in the cookie policy how to delete them in the browser [best practice]

## 7. Multi-device consent for signed-in users (France, optional)

Applying one choice to every device of a signed-in user is optional. Build it only if the owner asks for it.

- [ ] Use multi-device consent only for authenticated users, and apply it to the devices, browsers and apps where they are signed in [CNIL recommendation § 1.2, § 7]
- [ ] Give refusal and withdrawal the same multi-device scope as consent [CNIL recommendation § 7.1]
- [ ] State at the first level of the consent interface that the choice will apply to every device where the account is signed in [CNIL recommendation § 7.1, § 7.2]
- [ ] After sign-in on a device not yet linked to the account, show a short notice saying whether the account's choices were applied or changed, and how to change them [CNIL recommendation § 7.2]
- [ ] Decide and document how a conflict is resolved between the choice made before sign-in and the choice stored in the account (the latest choice wins, or the account's choice wins and signed-out tracking is kept separate), and tell the user which one applied [CNIL recommendation § 7.3]
- [ ] Choices tied to an account do not change the choices stored for signed-out browsing on a shared device [CNIL recommendation § 7.4]
- [ ] Do not send the account identifier (often an email address or a name) to the consent tool's provider; use a technical identifier instead [CNIL recommendation § 7.5]
- [ ] Moving to multi-device consent requires a new consent: consents given per device before the switch do not extend to other devices [CNIL recommendation § 7.6]
- [ ] Let the user adjust choices device by device in the preferences page [CNIL recommendation § 7.7]

## 8. Session replay tools (France)

Session replay records what the visitor does and sees on the page. The CNIL recommendation (délibération n° 2026-114) adds the following; section numbers are not quoted because they still have to be rechecked (see `OPEN-QUESTIONS.md` at the repository root).

- [ ] Session replay runs only after consent for that purpose, with its own purpose in the banner [CNIL session replay]
- [ ] Give specific information about session replay at the first level of the consent interface [CNIL session replay]
- [ ] Configure masking of content by default (text fields, forms, dynamically filled content, images, conversational agent content), and unmask only what the purpose needs [CNIL session replay]
- [ ] Never record passwords or bank card data; block their collection in the tool's configuration, not only by masking on display [CNIL session replay]
- [ ] Do not use session replay data for advertising retargeting [CNIL session replay]
- [ ] Prefer sampling or event-triggered recording to recording every session, and set retention per purpose [CNIL session replay]
- [ ] After withdrawal, recording stops, and recordings are deleted if no other lawful basis applies [CNIL session replay]

## 9. Tracking pixels in emails (France)

Applies when the site sends emails (newsletters, notifications, transactional emails) that contain tracking pixels or tracked links.

- [ ] Treat a tracking pixel in an email as a tracker under Article 82 [CNIL pixels § 2.1]
- [ ] Get consent before using pixels to measure opens for campaign performance or personalisation, to build profiles, or to detect fraud [CNIL pixels § 3.1]
- [ ] Pixels used only to secure authentication, or for individual open measurement strictly limited to the deliverability of emails the recipient asked for (adapting frequency, stopping sends to inactive recipients), are exempt; for deliverability, keep only the date (day, not time) of the last known open [CNIL pixels § 3.2]
- [ ] The deliverability exemption covers only emails the recipient asked for or that relate to a service they asked for, such as transactional emails [CNIL pixels § 3.2]
- [ ] Ask for pixel consent when the email address is collected, in the same form, with a short description of the purposes and a link to the detailed policy [CNIL pixels § 4.2]
- [ ] Tell the recipient which email address is concerned and that the pixels work on every device where they read their email [CNIL pixels § 4.2]
- [ ] Offer an explicit refusal as simple as acceptance; an absence of answer is a refusal [CNIL pixels § 4.2]
- [ ] Put a withdrawal link in the footer of every email; the page it leads to withdraws consent without asking the person to type their address [CNIL pixels § 5]
- [ ] After withdrawal, stop pixels in future emails and make sure pixels in emails already sent are no longer exploited [CNIL pixels § 5]
- [ ] Keep individual proof of each consent and of how it was obtained [CNIL pixels § 6]

Consent to pixels is separate from consent to receive marketing emails: a confirmation email that needs no marketing consent may still need pixel consent [CNIL pixels § 4.2].
