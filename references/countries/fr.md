# France

Coverage: partial (accessibility, trackers, data protection, identification, consumer law and security verified on official French sources; language requirements and the AI Act national authority not verified)

Everything French in the skill, domain by domain, with the file that holds the rules. French law applies on top of the EU baseline ([eu.md](eu.md)).

## How to use this file

1. Read the rubric of the domain you are working on, then the linked file. Dates, amounts and thresholds are in [../regulatory-status.md](../regulatory-status.md); this file gives the section number.
2. When France applies: the scoping matrix uses `fr-established` (operator established in France) for the identification page, and `fr-targeted` (France among the target countries) for consumer and accessibility duties ([../scoping/obligations.json](../scoping/obligations.json)). Which law governs a cross-border site is not settled by this skill (`OPEN-QUESTIONS.md`, item 25).
3. Every rule ends with its source. A rubric marked "Not verified" has no rule: do not fill it from memory.

## 1. Accessibility

Transposition of the European Accessibility Act: Article L. 412-13 of the code de la consommation and its implementing articles (status section 1.4). Public bodies and large companies: Article 47 of loi n° 2005-102 and the RGAA (status section 1.5). Authorities: DGCCRF and sector regulators for the EAA; Arcom for Article 47 (status sections 1.4 and 1.5).

- [ ] A service in scope of the EAA provided to consumers in France meets the accessibility requirements and publishes the information of Article D. 412-57 in its general terms or an equivalent document; template: [../../templates/accessibility-information-eaa.md](../../templates/accessibility-information-eaa.md) [C. conso D. 412-57]
- [ ] A body covered by Article 47 publishes an accessibility statement in the mandatory format, reachable from the home page and every page; template: [../../templates/accessibility-statement-fr.md](../../templates/accessibility-statement-fr.md) [Loi 2005-102 art. 47]
- [ ] ... publishes a multi-year accessibility plan, within the maximum duration of status section 1.5 [Loi 2005-102 art. 47]
- [ ] ... shows on the home page the conformity mention defined by the RGAA ("Accessibilité : totalement / partiellement / non conforme"); without a valid audit it is "non conforme" [RGAA]
- [ ] The technical reference is RGAA 4.1.2 (version in force: status section 1.5); the skill targets WCAG 2.2 AA, which covers it: [../accessibility/rules.md](../accessibility/rules.md), [../accessibility/rgaa/4.1.2/index.md](../accessibility/rgaa/4.1.2/index.md) [RGAA]

## 2. Cookies and other trackers

Transposition of Article 5(3) of the ePrivacy directive: Article 82 of loi n° 78-17 (status section 3.2). Authority and guidelines: CNIL (status section 3.3).

- [ ] Trackers that are not exempt are set only after consent; the CNIL rules on the banner, refusal, proof and withdrawal are in [../privacy/consent.md](../privacy/consent.md) and the inventory in [../privacy/trackers.md](../privacy/trackers.md) [LIL art. 82]
- [ ] Refusing is as simple as accepting [CNIL guidelines]
- [ ] Audience measurement without consent only under the conditions of the exemption, which no tool can claim on the CNIL's behalf (status section 3.3) [CNIL guidelines]

## 3. Data protection

Authority: CNIL. National law: loi n° 78-17 (Informatique et Libertés).

- [ ] Age of digital consent: set by Article 45 of loi n° 78-17 (value in status section 3.1); below it, consent is given jointly by the minor and the holder of parental responsibility, where consent is the lawful basis and the service is offered directly to a child [LIL art. 45]
- [ ] Forms, rights and transfers follow [../privacy/README.md](../privacy/README.md) [GDPR]

## 4. Mandatory identification of the website

- [ ] Every publisher established in France publishes the identification of Article 1-1 of the LCEN ("mentions légales"); template: [../../templates/consumer/legal-notice-fr.md](../../templates/consumer/legal-notice-fr.md); rules: [../consumer/operator-identification.md](../consumer/operator-identification.md) section 1.2 [LCEN art. 1-1]
- [ ] A site that sells online adds the information of Article 19 of the LCEN (same file, section 1.3) [LCEN art. 19]
- [ ] The penalty for missing identification is in status section 5.1; do not restate it to users as a threat, cite it when asked [LCEN art. 1-2]

## 5. Consumer law

Code de la consommation (status section 5.2).

- [ ] Order button: "commande avec obligation de paiement" or an equally unambiguous wording; means of payment and delivery restrictions stated at the latest at the start of the ordering process: [../consumer/online-sales.md](../consumer/online-sales.md) [C. conso L. 221-14]
- [ ] Pre-contractual information: Article L. 221-5 [C. conso L. 221-5]
- [ ] Withdrawal function labelled "renoncer au contrat ici", confirmation labelled "confirmer la rétractation", acknowledgement within a reasonable time; contracts running before the date of application stay under the previous rules: [../consumer/withdrawal-function.md](../consumer/withdrawal-function.md) [C. conso L. 221-21]
- [ ] The withdrawal function is free of charge for the consumer [C. conso L. 221-21]
- [ ] The exceptions to the right of withdrawal are listed in Article L. 221-28 (13 cases, read through a summarising tool; confirm before relying on a specific item) [C. conso L. 221-28]
- [ ] Price reductions show the prior price: Article L. 112-1-1; [../consumer/prices.md](../consumer/prices.md) [C. conso L. 112-1-1]
- [ ] The contact details of the competent consumer mediator are given visibly and legibly on the site, in the general terms or on order forms [C. conso L. 616-1]
- [ ] Deceptive design and the DSA: EU rules apply as such, see [../consumer/deceptive-design.md](../consumer/deceptive-design.md) and [../consumer/dsa.md](../consumer/dsa.md) [UCPD art. 5]

A rule marked relies on a fact read on Légifrance on 2026-11-14 that is not yet in `regulatory-status.md`.

Whether a missing withdrawal function extends the withdrawal period is not stated by any text read (`OPEN-QUESTIONS.md`, item 9). Do not assert it.

Not covered yet: the French rules on price marking other than reductions, and the template of general terms of sale (F-C7).

## 6. Language

Not verified. The obligation to use French (loi n° 94-665) has not been read on Légifrance (`OPEN-QUESTIONS.md`, item 27). The legal labels above are the French wording to use on a French page.

## 7. Artificial intelligence: national authority

Not verified. The authorities designated by France under the AI Act have not been read on an official source. The AI Act itself applies as an EU regulation: [../ai-act/README.md](../ai-act/README.md).

## 8. Security

Agency: ANSSI. Reference guides and versions: status section 4. Rules: [../security/README.md](../security/README.md).

- [ ] The browser-side security baseline follows the ANSSI web guide (ANSSI-PA-009); its recommendations are not normative [ANSSI WEB]
