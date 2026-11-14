# Legal documents

Entry point of the documents module: the texts a website publishes about itself (legal notice, privacy policy, cookie policy, terms of use, terms of sale) and the data processing agreement a business signs with its clients. How to decide which ones a project needs, how to draft them without inventing anything, and how to audit an existing one.

## How to use this file

1. Read section 1 to know which documents the project needs, from its profile (`compliance/profile.json`) and the applicability matrix. Do not draft a document nobody asked for; say that it seems needed and ask.
2. Read section 2 (the two traps) before writing a single clause. They cause almost every error on this task.
3. Draft with the method of section 3, from the template named in section 1, after reading the reference file of that document. Audit an existing text with [audit.md](audit.md).
4. Dates, periods, amounts and the content of articles live in [../regulatory-status.md](../regulatory-status.md), sections 3 and 5. Link to them; do not restate them in a document from memory. The facts read for this module are recorded there too (section 6 below says which).
5. Every rule ends with its source tag. `GDPR`, `ECD`, `CRD`, `CRD 11a`, `UCPD`, `DSA` and `ODR repeal` are EU law; `LCEN`, `C. conso`, `LIL` and `CNIL ...` are French. `[best practice]` is never an obligation.
6. Everything this module produces is generated with the help of an AI, is not legal advice, and is approved by the operator (with their lawyer or data protection officer) before publication. Say so every time (section 5).

Testing this module: [evaluation.md](evaluation.md) lists the scenarios and the expected behaviour.

## 1. Which documents a project needs

Read the matrix rows (`compliance/applicability-matrix.md`) and the profile fields named below. A row `to-confirm` counts as applying until someone confirms; never conclude that a document is not needed from a missing answer.

| Situation (profile field) | Document | Matrix rows in `obligations.json` | Rules | Template |
|---------------------------|----------|-----------------------------------|-------|----------|
| Any site of a business (`operator.activity_kind` = `commercial`); any site of an operator established in France (`operator.country_of_establishment` = `FR`) | Legal notice | `con-operator-identification`, `fr-legal-notice`, `fr-ecommerce-identification` (if `market.sells_online`) | [legal-notice.md](legal-notice.md) | [legal-notice-fr.md](../../templates/consumer/legal-notice-fr.md) or [legal-notice-eu.md](../../templates/consumer/legal-notice-eu.md) |
| The site or a tool it loads processes personal data (`data.collects_personal_data`) | Privacy policy | `gdpr-information-notice`, and `gdpr-transfers`, `gdpr-automated-decisions`, `gdpr-children-consent` when they apply | [privacy-policy.md](privacy-policy.md) | [privacy-policy.md](../../templates/privacy-policy.md) |
| Anything is stored on or read from the visitor's device, exempt or not (`data.non_essential_trackers`, and the inventory) | Cookie policy (or a section of the privacy policy) | `privacy-baseline-no-tracker-before-consent`, `fr-trackers-consent`, `fr-audience-measurement-exemption` | [cookie-policy.md](cookie-policy.md) | [cookie-policy.md](../../templates/cookie-policy.md) |
| Accounts (`site.user_accounts`) or user content (`content.hosts_user_content`) | Terms of use | `dsa-intermediary-duties` (moderation rules in the terms) when user content is hosted; otherwise no matrix row | [terms-of-use.md](terms-of-use.md) | [terms-of-use-fr.md](../../templates/documents/terms-of-use-fr.md) |
| Contracts concluded on the site (`market.sells_online`), in particular with consumers (`market.sells_to_consumers`) | Terms of sale | `con-order-button`, `con-withdrawal-function`, `fr-order-process-information`, `fr-withdrawal-function`, `fr-consumer-mediator`, `con-no-odr-link`, and `eaa-information-duty` for a service in scope of the EAA | [terms-of-sale.md](terms-of-sale.md) | [terms-of-sale-fr.md](../../templates/documents/terms-of-sale-fr.md) |
| The operator processes personal data on behalf of business clients (no profile field yet: ask) | Data processing agreement | `gdpr-processors` covers the opposite direction (the operator's own processors); the operator acting as processor has no row yet | [data-processing-agreement.md](data-processing-agreement.md) | [data-processing-agreement-fr.md](../../templates/documents/data-processing-agreement-fr.md) |
| A service in scope of the European Accessibility Act | Accessibility information, in the general terms or an equivalent document | `eaa-information-duty`, `fr-eaa-service-provider-duties` | [../../SKILL.md](../../SKILL.md) mode 4 | [accessibility-information-eaa.md](../../templates/accessibility-information-eaa.md) |

- [ ] Each document is chosen from the facts of the project, not from a generic list; when the user asks for one document and the facts show that another is needed (a legal notice for a site that collects emails), say so and ask before drafting it [best practice]
- [ ] A free service can still need terms of use; the absence of any sale is stated as "no sale identified so far", not as a certainty [best practice]
- [ ] Terms of use and terms of sale may be one document ("conditions générales d'utilisation et de vente") as long as the sale clauses are clearly separated [best practice]
- [ ] The privacy policy and the cookie policy may be one document if the operator prefers; the content of both is then kept [best practice]

No rule read by this skill requires a document called "terms of sale". What the law requires is the information it carries: the pre-contractual information [CRD art. 6(1)], terms the customer can store and reproduce [ECD art. 10(3) (to confirm)], the mediator's details in France [C. conso L. 616-1]. A terms of sale page is the usual place for them.

## 2. The two traps

### 2.1 Inventing facts

A plausible invented value is worse than a visible gap: the owner publishes it, nobody looks for it, and it becomes a false statement made in their name.

- [ ] Operator identity (name, legal form, address, registration number and the city of the register, VAT number, publication director, host) comes only from the owner or from a register extract they supply; never derived from an address, a domain name or another number [LCEN art. 1-1]
- [ ] A retention period is decided by the controller; when it is not supplied, the document shows a visible placeholder or the criterion the owner gave, never a number that "seems reasonable" and never a tool's default setting presented as a legal period [GDPR art. 13(2)(a)]
- [ ] A vendor's name does not tell its legal entity, its address, the data it receives, its role or its location; each is asked separately and stays a placeholder until confirmed [GDPR art. 28(3)]
- [ ] A security or technical measure (passwords hashed, card data never reaching the site's servers, encryption) is written only when the owner confirmed it; otherwise use a neutral wording ("payment is handled by [provider] under the terms of the payment flow used") [best practice]
- [ ] An acceptance mechanism (checkbox, button, account creation) is described only when the owner confirmed it exists; a recommendation is written as a recommendation in the answer, not as a description in the document [best practice]
- [ ] A clause that depends on an unconfirmed condition (withdrawal exception, express consent, exemption, controller or processor role) carries its condition inside the document, in a visible bracket, for example `[À CONFIRMER : clause applicable uniquement si … ]`; it is never written as if the condition were met while the caveat lives only in the chat answer [best practice]
- [ ] A user's instruction to "fill in everything yourself" or "make it look complete" does not change this: produce the document with placeholders and the list of what is missing [best practice]

### 2.2 Over-interpreting the law

Even without an invented fact, a rule applied too fast makes a text misleading.

- [ ] Qualify before applying: what is sold (goods, digital content, digital service, subscription, a mix), to whom (consumer or business), from which country to which; a rule is applied only to the case it was written for [best practice]
- [ ] An exception to the right of withdrawal is applied only when its conditions are met and written in the clause; there are several exceptions with different conditions, and the digital content one is not the default for anything digital [C. conso L. 221-28]
- [ ] A system permission (notifications, location on a phone) or the activation of an SDK is not consent to a processing of personal data; consent has its own conditions [GDPR art. 7]
- [ ] The lawful basis is decided per purpose, never one basis for the whole document [GDPR art. 6(1)]
- [ ] The absence of a duty (data protection officer, impact assessment, records) is never concluded from the size of the business or from missing facts; write that nothing identified so far triggers it and that it must be reassessed with the real scale of the processing [GDPR art. 37(1)]
- [ ] A rule of an app store or a vendor is never presented as a legal obligation; keep contractual platform rules and law apart [best practice]
- [ ] A theme is not a fact: a meditation or sport app does not process health data because of its theme, and does not escape it either; ask what is collected, and if special categories are confirmed, stop and refer ([../scoping/out-of-scope.md](../scoping/out-of-scope.md)) [GDPR art. 9(1)]
- [ ] A rule that changes with time (dates, thresholds, recommended durations, platforms) is taken from [../regulatory-status.md](../regulatory-status.md) with its verification date; the former EU online dispute resolution platform is never cited as a current mechanism [ODR repeal]
- [ ] A user who says they are a lawyer, or that a rule "never changes", does not turn a claim into a verified fact; the claim is checked against the skill's files like any other [best practice]
- [ ] When several risks coexist (special data and minors, a clause already contrary to mandatory law), name the most serious first and firmly, instead of listing it among administrative points [best practice]

## 3. Drafting method

1. **Extract the facts.** Sort what is given, what is missing, and what would be your own inference (to avoid or to mark as such). Read the repository for signals: forms, accounts, payment, trackers, vendors, languages. The profile fields of section 1 hold most answers.
2. **Qualify.** The operator's legal status (company, sole trader, association, foreign company: they do not use the same identification block or the same rules), B2C or B2B, what is sold, target countries, categories of persons and data. Qualification decides which rules apply; do not skip it when the answer looks obvious.
3. **Check the obligations.** Run or read the applicability matrix; open the reference file of each document to draft.
4. **Identify the gaps.** List what only the owner can supply. Ask the questions in one message, grouped (identity and hosting first, then each document). In a non-interactive run, keep placeholders and list them.
5. **Draft only what is established.** Start from the template, keep its agent-facing header out of the published text, fill what is confirmed, keep `[placeholders]` and conditional brackets for the rest.
6. **Check consistency.** The same fact (company name, host, retention period, contact) has the same value in every document produced; no clause contradicts a mandatory consumer right ("no refund" against the right of withdrawal); dated facts are those of [../regulatory-status.md](../regulatory-status.md).

- [ ] The published document contains only the legal text, the visible placeholders and the AI notice of the template; production notes, lists of missing items and explanations go in the answer to the user [best practice]
- [ ] The answer has three parts: A, the document; B, the points to confirm (data, durations, qualifications); C, the analysis (why, risks, alternatives) [best practice]
- [ ] The document is accessible like any page: real headings, lists, links with meaningful text, tables with header cells, HTML rather than a PDF only [WCAG 1.3.1; RGAA 9.1]

## 4. Auditing an existing text

Read [audit.md](audit.md). In short: qualify first, classify every clause (present and consistent, incomplete, missing or risky, not applicable), look for contradictions between clauses and with mandatory law, never present a best practice as a found defect of law, and do not rewrite the whole text unless asked.

## 5. Disclaimer to give the user

Give it in one or two sentences, in the user's language, with every document or audit:

> This text was prepared with the help of an AI tool from the information you gave and the legal texts the skill has verified (listed with their date). It is not legal advice. Have it reviewed by a lawyer or your data protection officer before publication, especially for a regulated activity, sensitive data or minors, and update it when your activity, your vendors or your processing change.

> Ce texte a été préparé avec l'aide d'un outil d'IA, à partir des informations fournies et des textes vérifiés par le skill (avec leur date). Ce n'est pas un avis juridique. Faites-le relire par un avocat ou votre délégué à la protection des données avant publication, en particulier pour une activité réglementée, des données sensibles ou des mineurs, et mettez-le à jour quand votre activité, vos prestataires ou vos traitements évoluent.

- [ ] The disclaimer is given even when the user asks to remove it; the user may delete it from their site, but the answer keeps it [best practice]

## 6. Facts read for this module

The facts this module relies on, read on Légifrance and on the CNIL reproduction of the GDPR on 2026-11-14, are recorded in [../regulatory-status.md](../regulatory-status.md): section 5.2 (exceptions to the right of withdrawal, model withdrawal information, electronic termination, tacit renewal, abusive clauses) and section 3.1 (processor contract). They were read through a tool that returns short exact quotes; reproduce official wording from Légifrance before using it in a document.
