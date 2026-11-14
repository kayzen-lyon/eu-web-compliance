# Notice

This repository is released under the MIT licence (see [LICENSE](LICENSE)). The MIT licence covers the original code and text written for this project. It does not cover the material listed below, which is reused from other projects or quoted from official texts and keeps its own licence. Content adapted from MIT-licensed projects stays under the MIT licence, with the copyright notice of its authors kept below.

Licence terms below were read on the sources recorded in [references/sources.json](references/sources.json) on 2026-11-14.

## Rules for contributors

1. Reused content is listed in this file, file by file, with its origin, its licence and the date it was taken.
2. Content under a licence that requires attribution keeps that attribution in the file where it appears.
3. Content under a share-alike or copyleft licence (CC BY-SA, AGPL, GPL) is not copied into this repository. It may be cited and linked.
4. Official texts are quoted exactly, with their reference, and are never reworded inside a quotation.

## Upstream skills

Each file that reuses content from one of these projects is listed in the table below.

| Project | Licence | Attribution required |
|---------|---------|----------------------|
| [Isalafont/claude-skill-rgaa-dev](https://github.com/Isalafont/claude-skill-rgaa-dev), by Isabelle Lafont | Licence Ouverte 2.0 | Source and date of last update (version 1.2.2 of 2026-06-17 was used) |
| [etalab-ia/skills](https://github.com/etalab-ia/skills), DINUM | MIT, Copyright (c) 2026 Benoit Vinceneux | Copyright and permission notice |
| [morellid/ai-act-skill](https://github.com/morellid/ai-act-skill) | MIT, Copyright (c) 2026 Davide Morelli | Copyright and permission notice |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | MIT, Copyright GitHub, Inc. | Copyright and permission notice |
| [JosephFa/redaction-legale-numerique](https://github.com/JosephFa/redaction-legale-numerique), by Joseph Farah | MIT, Copyright (c) 2026 Joseph Farah | Copyright and permission notice |

### Reused files

| File in this repository | Origin | Licence | Date taken |
|-------------------------|--------|---------|------------|
| `scripts/rgaa_official.py` (adapted) | etalab-ia/skills, `skills/rgaa/scripts/officiel.py` and `check-classement.py`, commit 0eae080 | MIT, Copyright (c) 2026 Benoit Vinceneux | 2026-11-14 |
| `references/accessibility/rgaa/4.1.2/evaluation-modes.json` (English translation of a provisional classification proposed by Isabelle Lafont) | etalab-ia/skills, `skills/rgaa/references/classement/*.md`, commit 0eae080 | MIT, Copyright (c) 2026 Benoit Vinceneux | 2026-11-14 |
| `references/accessibility/rgaa/4.1.2/sources/*.json` (unmodified) and the generated `criteria-*.md` and `glossary.md` | DISIC/accessibilite.numerique.gouv.fr, folder `RGAA/`, commit 95d5ef33 (last updated 2026-01-07), DINUM | Licence Ouverte 2.0 | 2026-11-14 |
| `references/accessibility/mapping.json` (success criterion names and levels) | WCAG 2.2, W3C Recommendation | W3C Document License 2023 | 2026-11-14 |
| `references/accessibility/impacts.md` (adapted, translated, reorganised by defect family; attribution also in the file) | Isalafont/claude-skill-rgaa-dev, `skills/rgaa-dev/impacts.md`, v1.2.2 of 2026-06-17, by Isabelle Lafont; etalab-ia/skills, `skills/rgaa/references/impacts.md` | Licence Ouverte 2.0; MIT, Copyright (c) 2026 Benoit Vinceneux | 2026-11-14 |
| `references/accessibility/fallbacks.md` (outline and order of preference reused, text rewritten, no code reused) | Isalafont/claude-skill-rgaa-dev, `skills/rgaa-dev/fallbacks.md`, v1.2.2 of 2026-06-17, by Isabelle Lafont | Licence Ouverte 2.0 | 2026-11-14 |
| `references/accessibility/rules.md` (selection of rules inspired by the golden rules and checklists, text rewritten) | Isalafont/claude-skill-rgaa-dev, `skills/rgaa-dev/SKILL.md` and `checklist.md`, v1.2.2 of 2026-06-17; github/awesome-copilot, `instructions/a11y.instructions.md` | Licence Ouverte 2.0; MIT, Copyright GitHub, Inc. | 2026-11-14 |
| `references/accessibility/anti-patterns*.md` and their generator `scripts/anti_patterns/` (list partly derived from the S, A, K, F, V and D anti-patterns; text, examples, severities and detection patterns rewritten) | github/awesome-copilot, `instructions/a11y.instructions.md`; Isalafont/claude-skill-rgaa-dev, `SKILL.md` (ARIA anti-patterns), v1.2.2 of 2026-06-17 | MIT, Copyright GitHub, Inc.; Licence Ouverte 2.0 | 2026-11-14 |
| `references/accessibility/components/*.md` (keyboard behaviour follows the WAI-ARIA Authoring Practices; original code, no APG code copied) | W3C WAI-ARIA Authoring Practices Guide | Cited by link only | 2026-11-14 |
| `references/accessibility/wcag-2.2-additions.md` (success criterion numbers and names; requirements described in this project's own words) | WCAG 2.2, W3C Recommendation | W3C Document License 2023 | 2026-11-14 |
| `references/privacy/forms-and-minimisation.md` (sections 6 to 8: selection of logging, retention and test-data practices; every rule re-checked on the GDPR or marked best practice; text rewritten) | github/awesome-copilot, `skills/gdpr-compliant/SKILL.md` | MIT, Copyright GitHub, Inc. | 2026-11-14 |
| `references/privacy/data-subject-rights.md` (outline of export and erasure features and list of stores to erase; re-checked on GDPR Articles 12 to 22; text rewritten) | github/awesome-copilot, `skills/gdpr-compliant/references/data-rights.md` | MIT, Copyright GitHub, Inc. | 2026-11-14 |
| `references/security/web-baseline.md`, `references/security/anssi-values.md`, `references/security/modules/cms.md` (selection of rules and values inspired by the checklist, values file and CMS module; every ANSSI id and value re-checked on the guide texts, text rewritten, items marked [DINUM] upstream kept only as [best practice]) | etalab-ia/skills, `skills/securite-developpement/references/checklist.md`, `valeurs-anssi.md`, `modules/cms.md`, commit 0eae080 | MIT, Copyright (c) 2026 Benoit Vinceneux | 2026-11-14 |
| `references/security/web-baseline.md`, `references/security/configs/node.md` (anti-pattern list on headers, cookies, secrets and dependencies used as a checklist; values replaced where they contradict ANSSI; no text copied) | github/awesome-copilot, `instructions/security-and-owasp.instructions.md` | MIT, Copyright GitHub, Inc. | 2026-11-14 |
| `references/security/**` (ANSSI recommendations cited by identifier and reworded; TLS cipher suites, key sizes and password-length table reproduced as values) | ANSSI-PA-009 v2.0, TLS guide v1.2, ANSSI-PG-078 v2.0, ANSSI-PG-083 v3.00, ANSSI-PA-102 v1.0 | Licence Ouverte 2.0 (TLS guide: Licence Ouverte 1.0) | 2026-11-14 |
| `references/ai-act/transparency.md` (outline by paragraph and reading of Article 50 and of the Commission guidelines; every point re-checked on C(2026) 5054 final and the Code of Practice; rewritten as decision trees) | morellid/ai-act-skill, `tasks/check-transparency.md` | MIT, Copyright (c) 2026 Davide Morelli | 2026-11-14 |
| `references/ai-act/roles-and-scope.md` (definition test and roles, adapted and re-checked) | morellid/ai-act-skill, `tasks/classify-system.md` (steps 1 and 7), `tasks/check-transparency.md` (horizontal points) | MIT, Copyright (c) 2026 Davide Morelli | 2026-11-14 |
| `references/ai-act/prohibited-practices.md` (list and grid reused, rewritten as website signals) | morellid/ai-act-skill, `tasks/check-prohibited-practices.md` | MIT, Copyright (c) 2026 Davide Morelli | 2026-11-14 |
| `references/ai-act/high-risk.md` (list of areas, rewritten) | morellid/ai-act-skill, `tasks/classify-system.md` (step 4) | MIT, Copyright (c) 2026 Davide Morelli | 2026-11-14 |
| `scripts/ai_act_classify.py` (decision logic derived) and `tests/test_ai_act_classify.py` (two examples ported: customer-service chatbot, HR emotion recognition) | morellid/ai-act-skill, `tasks/check-transparency.md`, `examples/classify-customer-service-chatbot/`, `examples/classify-hr-emotion-recognition/` | MIT, Copyright (c) 2026 Davide Morelli | 2026-11-14 |
| `references/ai-act/README.md`, item 5 of "How to use" (proactive alert without blocking, reworded) | etalab-ia/skills, `skills/usage-ia-agents-etat/SKILL.md` | MIT, Copyright (c) 2026 Benoit Vinceneux | 2026-11-14 |
| `references/consumer/deceptive-design.md` (examples summarised from section 4.2.7) | Commission Notice 2021/C 526/01 | EU text; reuse with acknowledgement of the source | 2026-11-14 |
| `adapters/README.md`, `adapters/copilot-instructions.md`, `adapters/cursor-rule.mdc` (structure only: pointer files to a vendored skill, `.vendor/` path, AGENTS.md block; text written for this project) | morellid/ai-act-skill, `adapters/` | MIT, Copyright (c) 2026 Davide Morelli | 2026-11-14 |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (field layout only, no text reused) | Isalafont/claude-skill-rgaa-dev, `.claude-plugin/` | Licence Ouverte 2.0 | 2026-11-14 |
| `references/documents/README.md` (applicability table, the two traps, four-step method, three-part delivery, disclaimer; translated, rewritten, re-sourced) | JosephFa/redaction-legale-numerique, `SKILL.md`, commit d103856 | MIT, Copyright (c) 2026 Joseph Farah | 2026-11-14 |
| `references/documents/legal-notice.md`, `templates/consumer/legal-notice-fr.md`, `templates/consumer/legal-notice-eu.md` (drafting traps by operator type; reworked against LCEN art. 1-1) | same, `references/mentions-legales.md` | MIT, Copyright (c) 2026 Joseph Farah | 2026-11-14 |
| `references/documents/privacy-policy.md`, `templates/privacy-policy.md` (traps on vendors, payment, retention, DPO, B2B roles) | same, `references/politique-confidentialite.md` | MIT, Copyright (c) 2026 Joseph Farah | 2026-11-14 |
| `references/documents/cookie-policy.md`, `templates/cookie-policy.md` (traps, mobile trackers) | same, `references/cookies.md` | MIT, Copyright (c) 2026 Joseph Farah | 2026-11-14 |
| `references/documents/terms-of-use.md`, `references/documents/terms-of-sale.md`, `templates/documents/terms-of-use-fr.md`, `templates/documents/terms-of-sale-fr.md` (checklists and outline; every rule re-checked or marked best practice) | same, `references/cgu-cgv.md` | MIT, Copyright (c) 2026 Joseph Farah | 2026-11-14 |
| `references/documents/data-processing-agreement.md`, `templates/documents/data-processing-agreement-fr.md` (outline; clauses re-read on GDPR Articles 28 and 33) | same, `references/dpa.md` | MIT, Copyright (c) 2026 Joseph Farah | 2026-11-14 |
| `references/documents/audit.md` (statuses, contradiction search, output table) | same, `references/audit.md` | MIT, Copyright (c) 2026 Joseph Farah | 2026-11-14 |
| `references/documents/evaluation.md` (40 scenarios condensed from the adversarial and red-team test cases; expectations adapted) | same, `adversarial/manifest.json`, `redteam/manifest.json` | MIT, Copyright (c) 2026 Joseph Farah | 2026-11-14 |
| `templates/accessibility-statement-fr.md` (mandatory format, reproduced word for word) | DINUM, page « Déclaration d'accessibilité » | Licence Ouverte 2.0 | 2026-11-14 |
| `templates/accessibility-information-eaa.md` (quotes Article D. 412-57, 2°, and its annex) | Légifrance, code de la consommation | Licence Ouverte 2.0 | 2026-11-14 |

## Official texts and standards

| Material | Licence or reuse terms | How this project uses it |
|----------|------------------------|--------------------------|
| RGAA criteria, tests and glossary (DINUM) | Licence Ouverte 2.0 | Official text reproduced without change, generated by script from the official JSON files, with source and date |
| French legal texts from Légifrance | Licence Ouverte 2.0 unless stated otherwise | Short exact quotations with article reference and link |
| ANSSI guides | Licence Ouverte 2.0; the TLS guide prints Licence Ouverte 1.0 | Recommendations cited by identifier and reworded; values quoted with their source |
| CNIL guidelines and recommendations | Reuse terms not reviewed | Cited by document and section, reworded, never copied at length |
| German federal law (gesetze-im-internet.de) | Reuse terms not reviewed | Paraphrased with section numbers in `references/countries/de.md`; no text copied |
| EU legal texts | Reuse allowed with acknowledgement of the source and without distorting the meaning (Commission Decision 2011/833/EU) | Short exact quotations with article reference |
| European Commission guidelines and Code of Practice on AI-generated content | CC BY 4.0 unless stated otherwise | Cited by point number, reworded |
| WCAG 2.2 (W3C) | W3C Document License, 2023 version | See the section below |
| EN 301 549 (ETSI, CEN, CENELEC) | ETSI copyright; reproduction terms not reviewed | Clause numbers only; no text reproduced |
| OWASP Top 10:2025 | Unclear: the site states CC BY 3.0 and the repository states CC BY-SA 4.0 | Category identifiers and titles only, with attribution; no text reproduced |
| RGESN 2024 (Arcep, Arcom, ADEME) | CC BY-SA 4.0 | Criterion numbers only; no text reproduced, because of the share-alike clause |
| EU icons for labelling AI-generated content | Free use without attribution, as stated by the Commission | May be referenced; not bundled yet |

Under the Licence Ouverte 2.0, attribution names the source (at least the name of the licensor) and the date of last update; a hyperlink to the source can satisfy it.

## WCAG and the W3C Document License

The W3C Document License allows copying and distributing the contents of a W3C document, including extracts, provided the copy includes a link to the original W3C document, the W3C copyright notice and the status of the document. It grants no right to create modifications or derivative works, except in software, in its supporting materials and in its documentation, with the notice the licence prescribes.

Consequences for this repository:

- Success criterion numbers and names are cited, with a link to the Recommendation.
- Where success criterion text is copied, it is copied exactly, kept in clearly identified passages, and accompanied by the link, the copyright notice and the document status. The MIT licence does not apply to those passages.
- Translations and rewordings of success criteria are derivative works. This project describes what a criterion requires in its own words and links to the official text, instead of translating it.

Required notice for material copied or derived from a W3C document:

> Copyright © 2023 W3C®. This software or document includes material copied from or derived from Web Content Accessibility Guidelines (WCAG) 2.2, https://www.w3.org/TR/WCAG22/.

This reading of the licence is the project's own and has not been reviewed by a lawyer.

## Tools called, not redistributed

| Tool | Licence |
|------|---------|
| axe-core (Deque Systems) | MPL-2.0 |
| Playwright (Microsoft) | Apache-2.0 |

## Points still to settle before publication

- Reuse terms of CNIL publications and of the Agent Skills specification have not been reviewed.
- The licence of each ANSSI guide is printed in the guide; check it again whenever a new guide is added.
- The combination of Licence Ouverte 2.0 content with an MIT-licensed repository is handled here by keeping that content under its own licence and attributing it. No lawyer has reviewed this arrangement.
