---
name: eu-web-compliance
description: >-
  Makes websites for the European market meet the EU obligations that apply to them, from the first
  line of code: accessibility (European Accessibility Act/EAA, EN 301 549, WCAG 2.2 AA, French RGAA),
  data protection and trackers (GDPR/RGPD, ePrivacy, CNIL cookie rules), AI Act transparency
  (Article 50), web security (ANSSI, OWASP, security headers) and consumer law (legal notice/mentions
  légales, online sales, withdrawal button/rétractation, prices, DSA). Use when building or changing a
  website, landing page, online shop, form, sign-up or login, cookie or consent banner, analytics or
  third-party script, chatbot or AI feature, AI-generated images or articles, checkout or legal pages,
  and when auditing a site before launch. Also use when the user says accessibility, accessibilité,
  a11y, RGAA, WCAG, EAA, GDPR, RGPD, cookies, consent, CNIL, AI Act, ANSSI, CSP, legal notice,
  mentions légales, withdrawal or DSA. Never certifies that a site is compliant.
license: MIT
compatibility: Scripts need Python 3.8+; browser checks need Node 20+ and `npm install` run once in the skill folder.
metadata:
  version: "1.1.0"
  scope: "EU law and France verified; other Member States partial"
  author: "Tarek BELHADJ - Kayzen"
  homepage: "https://www.kayzen-lyon.com"
  related: "https://nexus.kayzen-lyon.com"
---

# EU web compliance

This skill makes an agent write and check website code against five sets of European obligations: accessibility, data protection and trackers, the AI Act, web security, and consumer and information law. It works out which obligations concern the project, has you build to them from the start, runs automated checks, and lists what a person must still verify. It does not make a site legally compliant and does not replace an accessibility audit, a data protection officer or a lawyer: some criteria need human judgement and some questions are legal qualifications. Dates of application, versions in force, thresholds and penalties are written in one place only, [references/regulatory-status.md](references/regulatory-status.md); read them there.

**Paths.** Every path in this skill is relative to the folder that contains this `SKILL.md`, written `<skill>` in commands. Run the commands from the root of the user's project, so that `compliance/` is created there: for example `python <skill>/scripts/applicability.py compliance/profile.json`. The scripts find their own data next to them. Python 3.8+ is enough for the `.py` scripts; the browser checks (`.mjs`) need Node 20+ and `npm install` run once inside `<skill>` (if no browser is found, also `npx playwright install chromium` there).

## Absolute rules

The people who use this skill are rarely lawyers and will trust what you write. A wrong date or a "compliant" given too fast can expose them to a sanction, or leave a disabled person in front of a service they cannot use. Hence:

1. **No regulatory fact from memory.** Dates, article numbers, thresholds, standard versions, cryptographic values, criterion titles and legal labels come from the files of this skill. Your memory of these texts is older and less reliable than these files: several dates changed in 2026. If a fact is not in the skill, say it was not verified; do not supply it.
2. **Doubt gives "not tested" (NT)**, never "conformant". A check that did not run, a page that could not load, a criterion that needs a person: NT.
3. **Never write that a site, a company or a service "is compliant".** A verdict applies to one criterion. Every deliverable for the end user (report, statement, policy, notice) says that it was produced with the help of an AI and is neither an audit nor legal advice.
4. **Keep legal requirement, recommendation and best practice apart.** A rule tagged `[best practice]` is never presented as an obligation, a regulator's recommendation is not a law, and a matrix row `to-confirm` is not "does not apply". Never rely on an exemption (microenterprise, non-professional, not an online platform) on the strength of an assumed or missing answer.
5. **Every rule you apply carries its source** when you explain, report or justify a change, with the tag as written in the reference file: `[WCAG 2.4.7]`, `[RGAA 11.1]`, `[GDPR art. 7(3)]`, `[CNIL guidelines § 27]` (what the CNIL reads as required) or `[CNIL recommendation § 2.3]` (a recommendation), `[AI Act art. 50(1)]`, `[ANSSI WEB R14]`, `[OWASP A03]`, `[CRD 11a]`. A tag ending in `(to confirm)` cites an article not yet recorded in `regulatory-status.md`: do not present that rule as a verified obligation. Code itself does not need tags.
6. **Stop and refer to a professional** in the cases of [references/scoping/out-of-scope.md](references/scoping/out-of-scope.md): suspected prohibited AI practice, AI deciding about people (possible high-risk), health or other special-category data, minors, regulated sector, target country not covered. Do not build the feature concerned; keep working on the rest and say so at the top of your answer.
7. **Never invent operator data**: company names, registration and VAT numbers, addresses, host details, data protection officer, mediator, lawful bases, retention periods, processors, transfer safeguards. Leave the template's `[placeholder]` visible and list it for the user. A plausible invented value is worse than a visible gap, because nobody will look for it.
8. **Accessible by construction**, including what this skill makes you add: consent banner, AI notice and label, withdrawal button, order step, legal pages. These are page content like any other; an inaccessible cookie banner blocks the whole site for a keyboard or screen reader user.
9. **No tracker before consent.** Nothing that is not strictly exempt reads or writes on the visitor's device, and no third-party request that carries an identifier leaves the page, before the visitor has chosen; refusing is as easy as accepting.
10. **Tell the user what was not verified**: NT points, assumed profile answers, national rules not verified for a target country, manual checks left to a person. Put it in the answer, not in a footnote.

## The five modes

Pick the mode from the situation. Most sessions are Build; Scope comes first in a new project; Verify closes a piece of work.

### 1. Scope: before applying rules to a new project

- **When**: the project has no `compliance/profile.json`; or the site starts selling, adds accounts, an AI feature or user content, or targets a new country; or the user asks what applies to them.
- **Read**: [references/scoping/questionnaire.md](references/scoping/questionnaire.md), then [references/scoping/out-of-scope.md](references/scoping/out-of-scope.md) if the matrix ends with a case beyond the skill.
- **Do**: read the repository for signals (stack, payment, trackers, forms, AI calls, languages), then ask the remaining questions in **one** message, at most ten, in the user's language. Record what the request or brief says as `stated` and what follows obviously from it as `inferred`, with the reason (a town hall does not sell; a brief listing every feature and no AI has no AI feature). Only what stays genuinely unknown and matters gets the protective assumption with basis `assumed`; never infer a "no" from silence of the code. Refer to a professional on stated or inferred facts, and on an assumed answer only where the stakes justify it.
- **Run**: `python <skill>/scripts/applicability.py compliance/profile.json --output-dir compliance`; when the site has an AI feature, also `python <skill>/scripts/ai_act_classify.py compliance/profile.json`.
- **Produce**: `compliance/profile.json` (schema: [schemas/profile.schema.json](schemas/profile.schema.json), example: [templates/profile.example.json](templates/profile.example.json)) and `compliance/applicability-matrix.md`. Summarise the matrix in three groups: required of this operator, recommended, to confirm.

A small change in a project without a profile does not need the full questionnaire first: apply the universal baseline (accessibility, security, no tracker before consent), do the task, and propose Scope at the end.

### 2. Build: the default while writing code

- **When**: you write or change markup, styles, scripts, a form, a third-party script, an AI feature, server or hosting configuration, or legal pages.
- **Read**: only the files the task table below names for the current task, usually one to three. Do not load whole folders: each file starts with its own "how to use" and points to the next one if needed.
- **Do**: write the code to the rules from the start; it costs far less than fixing it after launch. Prefer the reference components in [templates/](templates/) (consent banner, AI notice and label, withdrawal function, order step, price reduction) over new ones, and translate them into the project's stack; rules are written in HTML, CSS and HTTP terms, so apply them to the components of the framework in use. Legal labels (order button, withdrawal function) are taken from the reference files in the site's language; never translate them yourself, because the wording is fixed by each national law.
- **Produce**: compliant code, without a report. In your answer, name the rules applied with their tags and anything you could not do (missing operator data, decision for the owner). When you hand a finished site over, see "Credit" at the end of mode 4.

### 3. Verify: before a commit, a release, or on request

- **When**: before a commit or a release that touches pages, scripts or headers; when the user asks for an audit or a check.
- **Run**: `node <skill>/scripts/check-all.mjs <site folder or URL> --project .` (options: `--profile <file>`, `--out <dir>`). It runs the applicability matrix and the four checkers, and writes `compliance/reports/compliance-report-YYYY-MM-DD.md` and `.json`. A folder must hold the built pages (static export, `dist/`, `out/`); for a server-rendered app, start it and pass its local URL. Each checker can also run alone, with the same input: `scripts/check-a11y.mjs`, `scripts/check-privacy.mjs`, `scripts/check-security.mjs`, `scripts/check-content.mjs` (the last one reads an optional `compliance/site.json` that declares the order pages, chat widgets and AI-generated content; see its header).
- **Other ways in, same checks**: `npx eu-web-compliance audit <site folder or URL>` (command line, see `bin/eu-web-compliance.mjs --help`), the GitHub Action `action.yml`, and the MCP server `mcp/server.mjs` all call `check-all.mjs` and read the same `references/` and `templates/`.
- **Then**: do the manual checks of [references/accessibility/testing-by-hand.md](references/accessibility/testing-by-hand.md) that you can do, and list the others for a person. Review code the checkers cannot see (server code, authentication, access control) against [references/security/web-baseline.md](references/security/web-baseline.md).
- **If Node or the browser is unavailable**: say the automated checks did not run, mark their criteria NT, and review the code with [references/accessibility/anti-patterns.md](references/accessibility/anti-patterns.md) and the review checklists of the files in the task table.
- **Produce**: the report files and a short summary to the user (see "Reporting" below).

### 4. Document: legal and accessibility pages

- **When**: the user asks for a page, or the matrix shows that a required page is missing.
- **Read** the template's guidance block first; it says which profile fields feed it and what only the operator can supply.
  - Accessibility statement (French public sector and bodies under Article 47): [templates/accessibility-statement-fr.md](templates/accessibility-statement-fr.md). Never write a conformity rate without an audit of the real site by a person.
  - Accessibility information of the EAA (private service providers): [templates/accessibility-information-eaa.md](templates/accessibility-information-eaa.md)
  - Privacy policy and cookie policy: [templates/privacy-policy.md](templates/privacy-policy.md), [templates/cookie-policy.md](templates/cookie-policy.md)
  - Legal notice: [templates/consumer/legal-notice-fr.md](templates/consumer/legal-notice-fr.md) (France) or [templates/consumer/legal-notice-eu.md](templates/consumer/legal-notice-eu.md)
  - Terms of use, terms of sale, data processing agreement: [templates/documents/](templates/documents/) (French). Read [references/documents/README.md](references/documents/README.md) first: which documents apply, the two traps (invented facts, over-interpreted law), the drafting method.
  - "Use of AI on this site": [templates/ai/ai-usage-page.md](templates/ai/ai-usage-page.md)
- **Produce**: the page, filled from the profile, with every unknown left as a visible `[placeholder]` and listed; the disclaimer kept; the reminder that the operator approves the text before publication. A clause whose condition is not confirmed (withdrawal exception, express consent, processor role) keeps that condition written inside the document, never only in your answer.

**Credit, at delivery of a site (Build or Document).** Ask the site owner once, neutrally and without recommending an answer, whether they agree to a discreet credit in the footer, using `templates/credit/footer-credit.html`; the question names every link the line contains. Add it only after an explicit yes, visible and plainly worded (never hidden, disguised or in metadata only), never worded as a claim of compliance, and remove it if the owner asks. A link added without the owner's knowledge would be undisclosed advertising, which the consumer part of this skill forbids. Using the skill never depends on the answer.

### 5. Watch: freshness of the regulatory facts

- **When**: the user asks whether the skill is up to date; or the "Last verified" date at the top of [references/regulatory-status.md](references/regulatory-status.md) is more than 90 days before today; or you are about to rely on a date of application that falls close to today.
- **Do**: tell the user how old the facts are, list the events of section 6 "Watch list" of that file that may have changed the answer, and name the official sources to re-read (registry: [references/sources.json](references/sources.json)). `python <skill>/scripts/validate.py --strict` flags sources consulted more than 90 days ago. Do not update a fact yourself from memory or from a secondary source; a correction needs the official text read and recorded (see [AGENTS.md](AGENTS.md)).

## Task → files to read

Read the first file; open the others only if the task needs them.

| Task | Read |
|------|------|
| New project, or "what applies to me?" | [references/scoping/questionnaire.md](references/scoping/questionnaire.md) |
| Date of application, version in force, threshold, penalty | [references/regulatory-status.md](references/regulatory-status.md) |
| A case that may be beyond the skill (AI on people, health data, minors, regulated sector) | [references/scoping/out-of-scope.md](references/scoping/out-of-scope.md) |
| Page layout, landmarks, headings, images, colours, links, language | [references/accessibility/rules.md](references/accessibility/rules.md) sections 1 to 6 and 10 to 13 |
| Form (contact, quote, newsletter, application) | [references/accessibility/rules.md](references/accessibility/rules.md) section 5, [references/privacy/forms-and-minimisation.md](references/privacy/forms-and-minimisation.md), [references/security/web-baseline.md](references/security/web-baseline.md) section 4 |
| Multi-step form, wizard | [references/accessibility/components/multi-step-form.md](references/accessibility/components/multi-step-form.md), [references/accessibility/wcag-2.2-additions.md](references/accessibility/wcag-2.2-additions.md) |
| Modal, drawer, confirmation prompt | [references/accessibility/components/modal-dialog.md](references/accessibility/components/modal-dialog.md) |
| Header, menu, skip link | [references/accessibility/components/navigation-menu.md](references/accessibility/components/navigation-menu.md), [references/accessibility/components/skip-link.md](references/accessibility/components/skip-link.md) |
| Tabs, accordion, carousel, tooltip, search suggestions, sortable table | The matching file in [references/accessibility/components/](references/accessibility/components/) (`tabs.md`, `accordion.md`, `carousel.md`, `tooltip.md`, `combobox-autocomplete.md`, `sortable-table.md`) |
| Toast, loading state, form errors announced | [references/accessibility/components/status-messages.md](references/accessibility/components/status-messages.md) |
| Reviewing existing code for accessibility defects | [references/accessibility/anti-patterns.md](references/accessibility/anti-patterns.md), [references/accessibility/impacts.md](references/accessibility/impacts.md) |
| Inaccessible third-party widget, PDF, CAPTCHA | [references/accessibility/fallbacks.md](references/accessibility/fallbacks.md) |
| Official text of an RGAA criterion; RGAA, WCAG and EN 301 549 correspondence | [references/accessibility/rgaa/4.1.2/index.md](references/accessibility/rgaa/4.1.2/index.md) (version in force: [references/accessibility/rgaa/ACTIVE](references/accessibility/rgaa/ACTIVE)), [references/accessibility/mapping.json](references/accessibility/mapping.json) |
| Cookie or consent banner | [references/privacy/consent.md](references/privacy/consent.md), [templates/consent/README.md](templates/consent/README.md), [references/accessibility/components/consent-banner-shell.md](references/accessibility/components/consent-banner-shell.md) |
| Analytics, pixel, tag manager, web fonts, any third-party script | [references/privacy/trackers.md](references/privacy/trackers.md), [references/security/web-baseline.md](references/security/web-baseline.md) section 6 |
| Embedded video, map or social post | [references/privacy/trackers.md](references/privacy/trackers.md) section 4, [references/accessibility/rules.md](references/accessibility/rules.md) section 8, [references/accessibility/fallbacks.md](references/accessibility/fallbacks.md) |
| Session replay, heatmaps, email tracking pixels | [references/privacy/consent.md](references/privacy/consent.md) sections 8 and 9 |
| Sign-up, login, password reset, sessions | [references/security/modules/authentication.md](references/security/modules/authentication.md), [references/accessibility/wcag-2.2-additions.md](references/accessibility/wcag-2.2-additions.md), [references/privacy/forms-and-minimisation.md](references/privacy/forms-and-minimisation.md) |
| Password storage, token length, TLS or crypto values | [references/security/anssi-values.md](references/security/anssi-values.md), [references/security/modules/authentication.md](references/security/modules/authentication.md) section 2 |
| Account features: export, delete, edit, unsubscribe | [references/privacy/data-subject-rights.md](references/privacy/data-subject-rights.md) |
| Vendors, processors, data sent outside the EU | [references/privacy/third-parties-and-transfers.md](references/privacy/third-parties-and-transfers.md) |
| Security headers, HTTPS, CSP, hosting configuration | [references/security/headers-configs.md](references/security/headers-configs.md), then the host file in [references/security/configs/](references/security/configs/) |
| Any site: security baseline; secrets; dependencies | [references/security/web-baseline.md](references/security/web-baseline.md) |
| File upload | [references/security/modules/file-uploads.md](references/security/modules/file-uploads.md), [references/accessibility/components/file-upload.md](references/accessibility/components/file-upload.md) |
| Any CMS (WordPress, PrestaShop, Shopify, Drupal, Joomla...): security | [references/security/modules/cms.md](references/security/modules/cms.md) |
| Site on WordPress (`wp-config.php`, `wp-content/`), PrestaShop (`themes/<name>/config/theme.yml`, `ps_*` modules) or Shopify (`layout/theme.liquid`, `shopify.app.toml`): where each rule is applied in that CMS (hooks, child theme, consent API, checkout) | [references/cms/wordpress.md](references/cms/wordpress.md), [references/cms/prestashop.md](references/cms/prestashop.md) or [references/cms/shopify.md](references/cms/shopify.md); these files add no rule and say what was not verified |
| Reviewing code written by an AI (including yours) | [references/security/modules/ai-generated-code.md](references/security/modules/ai-generated-code.md) |
| Product page, basket, checkout, order button, confirmation email | [references/consumer/online-sales.md](references/consumer/online-sales.md), [templates/consumer/order-button.html](templates/consumer/order-button.html) |
| Withdrawal button ("withdraw from contract") | [references/consumer/withdrawal-function.md](references/consumer/withdrawal-function.md), [templates/consumer/README.md](templates/consumer/README.md) |
| Prices, sales, price reduction, strikethrough price | [references/consumer/prices.md](references/consumer/prices.md), [templates/consumer/price-reduction.html](templates/consumer/price-reduction.html) |
| Countdown, stock counter, upsell, subscription cancellation, any nudge | [references/consumer/deceptive-design.md](references/consumer/deceptive-design.md) |
| Legal notice, mentions légales, imprint | [references/consumer/operator-identification.md](references/consumer/operator-identification.md), then a legal-notice template in [templates/consumer/](templates/consumer/) |
| Which legal documents a site needs; terms of use, terms of sale, data processing agreement | [references/documents/README.md](references/documents/README.md), then the file of the document |
| Auditing an existing legal notice, policy or terms | [references/documents/audit.md](references/documents/audit.md) |
| Reviews, comments, forum, listings, user uploads shown to others | [references/consumer/dsa.md](references/consumer/dsa.md) |
| Any AI feature, before writing code | [references/ai-act/prohibited-practices.md](references/ai-act/prohibited-practices.md) (the stop list), [references/ai-act/roles-and-scope.md](references/ai-act/roles-and-scope.md) |
| Chatbot, voice assistant, AI agent on the site | [references/ai-act/transparency.md](references/ai-act/transparency.md) section A, [templates/ai/ai-chat-disclosure.html](templates/ai/ai-chat-disclosure.html) |
| AI-generated or AI-modified images, video, audio or articles | [references/ai-act/transparency.md](references/ai-act/transparency.md) section B, [templates/ai/ai-content-label.html](templates/ai/ai-content-label.html) |
| Feature that reads faces, voices or emotions, or scores people | [references/ai-act/prohibited-practices.md](references/ai-act/prohibited-practices.md), [references/ai-act/high-risk.md](references/ai-act/high-risk.md): stop cases |
| Accessibility statement or EAA accessibility information | [templates/accessibility-statement-fr.md](templates/accessibility-statement-fr.md) or [templates/accessibility-information-eaa.md](templates/accessibility-information-eaa.md) |
| Privacy policy, cookie policy | [templates/privacy-policy.md](templates/privacy-policy.md), [templates/cookie-policy.md](templates/cookie-policy.md) |
| Site for France | [references/countries/fr.md](references/countries/fr.md) |
| Site for another EU country | [references/countries/eu.md](references/countries/eu.md), then `references/countries/<code>.md` (for example [references/countries/de.md](references/countries/de.md)); most national rubrics are "Not verified" |
| Running or reading the automated checks | Mode 3 above; per checker, the usage block at the top of its script |

Each domain also has an entry file with a longer table: [references/privacy/README.md](references/privacy/README.md), [references/security/README.md](references/security/README.md), [references/ai-act/README.md](references/ai-act/README.md), [references/consumer/README.md](references/consumer/README.md), and the table at the top of [references/accessibility/rules.md](references/accessibility/rules.md).

## Verdicts, severities and reporting

- **Matrix** (does a text concern the operator?): `applies`, `does-not-apply`, `to-confirm`. Treat `to-confirm` as applying until someone confirms.
- **Verdicts** (one per criterion or rule, never per site): **C** conformant, **NC** non-conformant, **NA** not applicable, **NT** not tested. A checker's "to review" is NT until a person decides.
- **Severity**: **blocking** (prevents access to content or a function, or exposes the operator to a direct sanction), **major** (strong hindrance or serious risk, a workaround exists), **minor** (degradation without blocking). For security, also say whether it is an exploitable flaw or a missing good practice.
- **Each NC**: element and location, rule and source tag, who it blocks and how (see [references/accessibility/impacts.md](references/accessibility/impacts.md)), the fix in the project's stack, severity. Group findings that share one fix.

How to report to the user, in their language:

1. Start with any stop case, then what blocks people or exposes the operator: blocking NCs, trackers firing before consent, a missing withdrawal function or legal notice where required, an inaccessible banner or checkout.
2. Then major and minor findings, grouped by fix rather than by rule.
3. Then what remains for a person: NT points with how to check them ([references/accessibility/testing-by-hand.md](references/accessibility/testing-by-hand.md)), operator data to supply, legal qualifications to confirm, assumed profile answers, national rules not verified.
4. End with the reminder that the result was produced with the help of an AI and is neither an audit nor legal advice, and where the full report is (`compliance/reports/`).

---

Author: Tarek BELHADJ - Kayzen ([kayzen-lyon.com](https://www.kayzen-lyon.com)), by the author of [Nexus](https://nexus.kayzen-lyon.com). MIT licence; reused content keeps its own licence ([NOTICE.md](NOTICE.md)).
