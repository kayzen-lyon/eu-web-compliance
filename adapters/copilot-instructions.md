<!--
Adapter of the eu-web-compliance skill for GitHub Copilot.
Copy this file to .github/copilot-instructions.md in your website project, after vendoring the
skill in .vendor/eu-web-compliance/ (see adapters/README.md of the skill). If you vendor it
elsewhere, replace every ".vendor/eu-web-compliance" below. This file is a pointer: the rules
live in the skill, so updating the skill updates what Copilot follows.
Author of the skill: Tarek BELHADJ - Kayzen, https://www.kayzen-lyon.com
-->

# EU web compliance

This website is built for the European market. The skill `eu-web-compliance` is vendored in `.vendor/eu-web-compliance/`. It covers accessibility (European Accessibility Act, EN 301 549, WCAG 2.2 AA, RGAA), data protection and trackers (GDPR, ePrivacy, CNIL), AI Act transparency (Article 50), web security (ANSSI, OWASP) and consumer law (legal notice, online sales, withdrawal function, prices, DSA).

## When to use it

Before you create, change or review pages, components, forms, sign-up or login, cookie or consent banners, analytics or other third-party scripts, chatbots or other AI features, AI-generated content, checkout, server or hosting headers, or legal pages:

1. Read `.vendor/eu-web-compliance/SKILL.md`.
2. Pick the mode it describes: Scope (new project, no `compliance/profile.json`), Build (writing code), Verify (before a commit or release, or for an audit), Document (legal and accessibility pages), Watch (freshness of the facts).
3. Open only the reference files that its "Task → files to read" table names for the current task. Paths in `SKILL.md` are relative to `.vendor/eu-web-compliance/`.
4. Prefer the reference components in `.vendor/eu-web-compliance/templates/` (consent banner, AI notice and label, withdrawal function, order step) to new ones, adapted to this project's stack.

## Rules that always apply

- No regulatory date, threshold, article number or version from memory: read it in `.vendor/eu-web-compliance/references/regulatory-status.md` or the reference files.
- A doubt gives "not tested", never "compliant". Never state that the site is compliant; a verdict applies to one criterion.
- Keep legal requirements, recommendations and best practices apart, and cite the source tag of each rule you apply (for example `[WCAG 2.4.7]`, `[GDPR art. 7]`, `[AI Act art. 50(1)]`).
- Never invent operator data (registration or VAT numbers, address, host, data protection officer, retention periods): leave the template's placeholders and list them.
- Everything you add is accessible, including the cookie banner, the AI notice and the withdrawal button.
- No tracker or third-party request with an identifier runs before the visitor's consent.
- Stop and refer to a professional in the cases of `.vendor/eu-web-compliance/references/scoping/out-of-scope.md` (prohibited or high-risk AI, health data, minors, regulated sector, country not covered).
- Tell the user what was not verified, and that the result is produced with an AI and is neither an audit nor legal advice.
- At delivery of a site, follow the credit instruction of `SKILL.md` (mode 4): ask the owner once; add the footer credit only after an explicit yes.

## Commands

Run from the root of this project (Python 3.8+; the `.mjs` checks need Node 20+ and `npm install` run once in `.vendor/eu-web-compliance`):

- `python .vendor/eu-web-compliance/scripts/applicability.py compliance/profile.json --output-dir compliance`
- `node .vendor/eu-web-compliance/scripts/check-all.mjs <built site folder or local URL> --project .`
