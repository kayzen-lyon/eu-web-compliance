# Regulatory status

Last verified: 2026-11-14

This file is the only place in the skill where dates of application, versions in force, thresholds and penalty amounts are written. Every other file points here. Each fact cites its source in `sources.json` as `[src: id]`; the validation script rejects a fact without one.

How to read it:

1. Every fact below was read on a primary source on the date above. Facts that could not be confirmed are not here; they are listed in `OPEN-QUESTIONS.md` at the repository root.
2. "Recommended" means a regulator's recommendation or good practice. "Required" means a legal text says so. The difference matters and must be kept when a rule is derived from a fact.
3. This file states what the texts say. It does not decide whether a given website falls under them: that is the job of the scoping step.
4. Scope of this version: EU law, and French law as the first Member State. Other Member States are not covered yet.

## 1. Accessibility

### 1.1 WCAG

- WCAG 2.2 is a W3C Recommendation, first published on 5 October 2023 and republished on 12 December 2024. [src: wcag-22]
- Compared with WCAG 2.1, WCAG 2.2 adds six success criteria at levels A and AA: 2.4.11 Focus Not Obscured (Minimum) (AA), 2.5.7 Dragging Movements (AA), 2.5.8 Target Size (Minimum) (AA), 3.2.6 Consistent Help (A), 3.3.7 Redundant Entry (A), 3.3.8 Accessible Authentication (Minimum) (AA). It removes 4.1.1 Parsing. [src: wcag-22]
- WCAG 2.2 also adds three AAA criteria (2.4.12, 2.4.13, 3.3.9), which are outside the AA target of this skill. [src: wcag-22]
- WCAG 3.0 is a Working Draft (10 September 2026) and is not a conformance reference. [src: wcag-3-draft]

### 1.2 EN 301 549

- EN 301 549 V4.1.1 was published by ETSI on 2 September 2026. Its clauses 9, 10 and 11 are aligned with WCAG 2.2; WCAG 2.2 level AA corresponds to clauses 9.1 to 9.4 and 9.6. It adds Annex ZA (Directive 2016/2102) and Annex ZB (Directive 2019/882). [src: en-301-549-v411]
- V4.1.1 states that presumption of conformity only applies once the standard is cited in the Official Journal of the EU. On the verification date no such citation was found. [src: en-301-549-v411, eu-decision-2021-1339]
- The version that carries presumption of conformity is EN 301 549 V3.2.1 (2021-03), under Implementing Decision (EU) 2018/2048 as amended by Implementing Decision (EU) 2021/1339, and only for Directive (EU) 2016/2102 (public sector). No harmonised standard was found cited under Directive (EU) 2019/882. [src: eu-decision-2021-1339]

### 1.3 European Accessibility Act, Directive (EU) 2019/882

- Member States apply the transposing provisions from 28 June 2025 (Article 31(2)). [src: eaa-2019-882]
- Services in scope when provided to consumers after 28 June 2025 (Article 2(2)): electronic communications services; services providing access to audiovisual media services; elements of air, bus, rail and waterborne passenger transport services (websites, mobile-device-based services including apps, electronic tickets and ticketing, delivery of transport service information, interactive self-service terminals); consumer banking services; e-books and dedicated software; e-commerce services. [src: eaa-2019-882]
- Excluded website and app content (Article 2(4)): pre-recorded time-based media published before 28 June 2025; office file formats published before 28 June 2025; online maps and mapping services, if essential information is provided in an accessible digital manner for maps intended for navigation; third-party content that is neither funded, developed by, nor under the control of the economic operator; archived content not updated or edited after 28 June 2025. [src: eaa-2019-882]
- A microenterprise employs fewer than 10 persons and has an annual turnover not exceeding EUR 2 million or an annual balance sheet total not exceeding EUR 2 million (Article 3(23)). Microenterprises providing services are exempt from the accessibility requirements and from the obligations relating to compliance with them (Article 4(5)). The exemption covers services, not products. [src: eaa-2019-882]
- Disproportionate burden and fundamental alteration (Article 14, Annex VI): the operator carries out and documents an assessment, keeps the results for five years, provides a copy to the authorities on request, and informs the authorities when it relies on the exception (this last duty does not apply to microenterprises). Service providers renew the assessment when the service is altered, when the authority asks, and at least every five years. The exception cannot be invoked when external funding was received to improve accessibility. [src: eaa-2019-882]
- Information duty of service providers (Article 13(2), Annex V): the provider explains how the service meets the accessibility requirements, in the general terms and conditions or an equivalent document, makes it available to the public in written and oral format and in a manner accessible to persons with disabilities, and keeps it for as long as the service is in operation. Content: general description of the service in accessible formats; descriptions and explanations needed to understand how the service works; description of how the service meets the requirements of Annex I. [src: eaa-2019-882]
- Transitional measures (Article 32): until 28 June 2030 service providers may continue to use products they were lawfully using before 28 June 2025; service contracts agreed before 28 June 2025 may continue unaltered until they expire, but no longer than five years from that date. This is not a general postponement for a website created or substantially changed after 28 June 2025. [src: eaa-2019-882]
- Requirements for websites (Annex I, Section III): websites, including related online applications, and mobile-device-based services are made perceivable, operable, understandable and robust. For e-commerce (Section IV): accessibility information about the products and services sold when the responsible operator provides it; accessible identification, security and payment functions. For consumer banking: information not exceeding level B2 of the Common European Framework of Reference for Languages. [src: eaa-2019-882]

### 1.4 France: EAA transposition

- The directive is transposed by Article 16 of loi n° 2023-171 (creating Article L. 412-13 of the code de la consommation), décret n° 2023-931 and an arrêté of 9 October 2023, applicable to services provided after 28 June 2025. [src: fr-loi-2023-171, fr-decret-2023-931, fr-code-consommation]
- Service provider duties, including the information to publish in the general terms and conditions or an equivalent document, are in Article D. 412-57 of the code de la consommation; services in scope are in D. 412-50. [src: fr-code-consommation]
- Competent authorities (Article L. 511-25-1): consumer protection officers (DGCCRF), Arcep, Arcom, ACPR, AMF and Banque de France, each in its sector. [src: fr-code-consommation]
- Penalty for a non-compliant service or missing information (Article R. 451-4): fine for fifth-class offences, at most EUR 1 500 for a natural person. The multiplier for legal persons has not been verified. [src: fr-code-consommation, fr-code-penal-131-13]
- The French microenterprise exemption is worded as fewer than ten employees and turnover or balance sheet total not exceeding EUR 2 million. [src: fr-code-consommation]

### 1.5 France: RGAA and Article 47 of loi n° 2005-102

- RGAA 4.1.2 is the version in force: 106 criteria in 13 themes. It refers to EN 301 549 V2.1.2 (2018-08) and WCAG 2.1 levels A and AA. [src: rgaa-412, rgaa-scope, rgaa-json]
- RGAA 5 is not published. The official site states that it is being drafted with publication planned for the end of 2026, and that it will integrate WCAG 2.2. No beta is announced on the official pages. [src: rgaa-5-announcement]
- The official machine-readable files of RGAA 4.1.2 are `criteres.json`, `glossaire.json` and `methodologies.json`; content is under Licence Ouverte 2.0. [src: rgaa-json]
- Article 47 of loi n° 2005-102 covers public bodies, certain private bodies entrusted with a public service mission, and companies whose turnover exceeds EUR 250 million (average of French turnover over the last three financial years, décret n° 2019-768 Article 2). It requires an accessibility statement, a multi-year plan of at most three years, and a mention on the home page. [src: fr-loi-2005-102, fr-decret-2019-768]
- Penalties are in Article 47-1 of loi n° 2005-102: after formal notice, Arcom may impose up to EUR 50 000 for failure to meet the accessibility obligation and up to EUR 25 000 for failure to meet the statement and publication obligations, renewable after six months. [src: fr-loi-2005-102]
- Article 8 of décret n° 2019-768 (the former EUR 2 000 and EUR 20 000 penalties) was repealed by décret n° 2026-816 of 24 August 2026, in force on 27 August 2026. The same decree makes Article 1 of décret n° 2019-768 refer to harmonised standards published in the Official Journal of the EU, without a version number. [src: fr-decret-2026-816, fr-decret-2019-768]
- Home page mention, as defined by the RGAA: "Accessibilité : totalement conforme" when all criteria are met; "partiellement conforme" when at least 50 % are met; "non conforme" when there is no valid audit or fewer than 50 % are met. A statement is valid for three years, or eighteen months after a new version of the framework. [src: rgaa-mandatory-pages]

## 2. Artificial intelligence: Regulation (EU) 2024/1689

- Regulation (EU) 2026/1744 of 8 July 2026 (Digital Omnibus on AI) was published in the Official Journal on 24 July 2026 and entered into force on 27 July 2026. [src: eu-reg-2026-1744]
- Dates of application (Article 113 as amended): general application on 2 August 2026; Chapters I and II (including Articles 4 and 5) since 2 February 2025; general-purpose AI, governance and penalties since 2 August 2025; high-risk systems of Annex III on 2 December 2027; high-risk systems of Annex I on 2 August 2028; the new prohibitions of Article 5(1)(ba) and (bb) and Article 5(1a) and (1b) on 2 December 2026. [src: ai-act]
- Article 50 has applied since 2 August 2026. Only one relief exists: providers of generative systems placed on the market before 2 August 2026 have until 2 December 2026 to comply with Article 50(2) (Article 111(4)). [src: ai-act]
- Article 50(1), provider: systems intended to interact directly with natural persons are designed so that the persons are informed they are interacting with an AI system, unless this is obvious to a reasonably well-informed, observant and circumspect person in the context. [src: ai-act]
- Article 50(2), provider: synthetic audio, image, video or text outputs are marked in a machine-readable format and detectable as artificially generated or manipulated. Exceptions: assistive function for standard editing; no substantial alteration of the input or its semantics. [src: ai-act]
- Article 50(3), deployer: persons exposed to an emotion recognition or biometric categorisation system are informed of its operation. [src: ai-act]
- Article 50(4), deployer: deep fakes are disclosed as artificially generated or manipulated; text published to inform the public on matters of public interest is disclosed as such, unless it has undergone human review or editorial control and a natural or legal person holds editorial responsibility. [src: ai-act]
- Article 50(5): the information is given in a clear and distinguishable manner at the latest at the time of the first interaction or exposure, and conforms to the applicable accessibility requirements. [src: ai-act]
- Article 4 as amended: providers and deployers take measures to support the development of AI literacy of their staff and of persons operating AI systems on their behalf; the duty does not require guaranteeing a specific level of literacy for any individual. [src: ai-act]
- Prohibited practices (Article 5(1)): (a) harmful subliminal, manipulative or deceptive techniques; (b) exploitation of vulnerabilities; (ba) generation of non-consensual intimate imagery of an identifiable person; (bb) generation of child sexual abuse material; (c) social scoring; (d) crime risk assessment based solely on profiling; (e) untargeted scraping to build facial recognition databases; (f) emotion inference at work and in education, except for medical or safety reasons; (g) biometric categorisation inferring sensitive characteristics; (h) real-time remote biometric identification in public spaces for law enforcement, with exceptions. [src: ai-act]
- Definitions used by this skill (Article 3): AI system (1), provider (3), deployer (4), deep fake (60). A deployer uses an AI system under its authority, except in a personal non-professional activity. [src: ai-act]
- Annex III areas: biometrics; critical infrastructure; education and vocational training; employment and workers management; access to essential private and public services and benefits; law enforcement; migration, asylum and border control; administration of justice and democratic processes. [src: ai-act]
- Penalty ceilings (Article 99): EUR 35 million or 7 % of worldwide annual turnover for prohibited practices; EUR 15 million or 3 % for the other listed obligations, including Article 50; EUR 7.5 million or 1 % for incorrect information. For SMEs including start-ups, the lower of the two amounts applies. [src: ai-act]

### 2.1 Commission guidelines on Article 50 (non-binding)

- The Commission guidelines on Article 50, C(2026) 5054 final, were published on 20 July 2026. They are non-binding (point 5). [src: ai-act-art50-guidelines]
- A disclosure placed only in terms and conditions, URLs or documentation, or a generic site-wide statement, is not sufficient on its own for Article 50(1) (point 38). A machine-readable mark that people cannot perceive, or an ambiguous label such as "assistant", is not sufficient either. [src: ai-act-art50-guidelines]
- The "obvious" exception is read narrowly. It cannot be relied on when the system is available to the general public or to consumers including vulnerable persons such as children, older persons, persons with disabilities or persons with low AI literacy (point 45). [src: ai-act-art50-guidelines]
- Outside the scope of Article 50(2) marking (point 68): source code and adjacent artefacts, including markup, configuration and integral comments; short sequences such as single words, image captions, alt text, UI labels and icon-scale graphics. [src: ai-act-art50-guidelines]
- Grammar and spelling correction, minor stylistic polishing, AI translation and transcription fall under the standard-editing exception; summaries, paraphrases and rewrites that change style, structure and meaning require marking (examples under points 90 to 92). [src: ai-act-art50-guidelines]
- The deployer's labelling duties under Article 50(4) apply in addition to, and without prejudice to, the provider's machine-readable marking under Article 50(2) (point 111). [src: ai-act-art50-guidelines]
- Editorial exception for public-interest text (points 133 to 138): both conditions are required. Human review covers the substance, with fact-checking as a minimum; spell-checking, formal checks or automated review are not enough. The identity and contact details of whoever holds editorial responsibility should be publicly available. [src: ai-act-art50-guidelines]
- Hosting services, online platforms and broadcasters whose role is limited to disseminating AI content created by third parties are not deployers (point 16). [src: ai-act-art50-guidelines]

### 2.2 Code of Practice on Transparency of AI-Generated Content (voluntary)

- The final Code of Practice was published on 10 June 2026. Adherence is voluntary and is not conclusive evidence of compliance. [src: ai-content-code-of-practice]
- For providers, the Code calls for at least two layers of machine-readable marking: digitally signed metadata and an imperceptible watermark. Fingerprinting or logging is optional and not sufficient alone. A detection solution is made available free of charge. The Code names no specific technical standard. [src: ai-content-code-of-practice]
- For deployers, the Code calls for the EU icon or an equivalent icon or label containing the acronym "AI", visible from first exposure and detectable by assistive technologies. [src: ai-content-code-of-practice]
- The EU icons exist in three variants (basic, fully AI-generated, partially AI-modified). Their use is optional and free; alternative text or ARIA labelling is recommended. [src: eu-ai-icons]

## 3. Data protection and trackers

### 3.1 GDPR, Regulation (EU) 2016/679

- Articles this skill relies on: 5 (principles), 6 (six lawful bases), 7 (conditions for consent), 8 (children), 9 (special categories), 12 to 14 (information), 15 to 22 (rights of the data subject, including automated individual decisions in Article 22), 25 (data protection by design and by default), 28 (processors), 30 (records of processing), 32 (security), 33 and 34 (breach notification), 35 (impact assessment), 37 (data protection officer), 44 to 49 (transfers), 83 (fines). [src: gdpr]
- Withdrawing consent must be as easy as giving it (Article 7(3)). [src: gdpr]
- The age of consent for information society services is 16, and Member States may lower it to no less than 13 (Article 8). In France it is 15 (Article 45 of loi n° 78-17); below that age, joint consent of the minor and the holder of parental responsibility is required. [src: gdpr, fr-loi-78-17]
- A personal data breach is notified to the supervisory authority, where feasible, within 72 hours (Article 33). [src: gdpr]
- Fines (Article 83): up to EUR 10 million or 2 % of worldwide annual turnover under paragraph 4; up to EUR 20 million or 4 % under paragraphs 5 and 6, whichever is higher. [src: gdpr]

### 3.2 ePrivacy and its French transposition

- Storing information, or gaining access to information already stored, in the terminal equipment of a user is only allowed with consent given after clear and comprehensive information. Two exemptions: technical storage or access for the sole purpose of carrying out the transmission of a communication; storage or access strictly necessary to provide an information society service explicitly requested by the user (Article 5(3) of Directive 2002/58/EC as replaced by Directive 2009/136/EC). [src: eprivacy]
- In France this rule is Article 82 of loi n° 78-17. [src: fr-loi-78-17]
- The Digital Omnibus proposal on data, privacy and cookies, COM(2025) 837, is not adopted. The Council agreed its negotiating mandate on 21 October 2026; the Parliament has not adopted its position. Nothing in it is applicable, and no rule of this skill may rely on it. [src: eu-data-omnibus-status]

### 3.3 France: CNIL rules on cookies and other trackers

- Refusing must be as simple as accepting. The CNIL strongly recommends a "refuse all" control on the same screen and in the same format as "accept all". [src: cnil-cookies-guidelines, cnil-cookies-recommendation]
- The controller must be able to prove at any time that valid consent was collected. [src: cnil-cookies-guidelines]
- Keeping the user's choice, consent as well as refusal, for 6 months is a recommended good practice, not a mandatory duration. [src: cnil-cookies-recommendation]
- Consent must be specific. The CNIL recommends asking it separately for each distinct purpose; a global accept or refuse remains possible if all purposes are presented first. Withdrawal is possible at any time through an easily accessible mechanism, such as a "manage my cookies" link on every page. [src: cnil-cookies-guidelines, cnil-cookies-recommendation]
- Trackers exempt from consent include those that store the user's tracker choice, authentication, shopping basket, interface personalisation expected by the user such as language, load balancing, limiting free access to a sample of paid content, and some audience measurement trackers. The list is not exhaustive. [src: cnil-cookies-guidelines]
- Audience measurement is exempt only if it is strictly limited to measuring the audience of the site or app for the publisher's exclusive account, produces anonymous statistics only, involves no cross-site tracking, and no cross-referencing or transmission to third parties. The CNIL recommends a tracker lifetime of 13 months without automatic renewal and data retention of at most 25 months. [src: cnil-cookies-guidelines, cnil-cookies-recommendation]
- The CNIL does not publish a list of exempt audience measurement tools. It offers a self-assessment tool to vendors; self-assessment does not prejudge an inspection. No tool may be described as recognised exempt by the CNIL. [src: cnil-audience-measurement]
- Cookie walls are not banned in general; their lawfulness is assessed case by case, and the user must be told clearly what refusing entails. [src: cnil-cookies-guidelines]
- Transfers to US entities certified under the EU-US Data Privacy Framework have been possible since the adequacy decision of 10 July 2023; for other recipients a compliant setup such as proxying remains necessary. [src: cnil-transfers-analytics]
- Multi-device consent (recommendation published 16 January 2026) is optional and limited to authenticated environments. Its multi-device scope is stated at the first level of the consent interface; a rule resolves conflicts between the choice made before login and the choice stored in the account; moving to multi-device consent requires a new consent. [src: cnil-cookies-recommendation]
- Tracking pixels in emails (recommendation adopted 12 March 2026): consent is required for measuring opens for campaign performance or personalisation and for profiling. Individual open measurement strictly limited to deliverability of requested emails is exempt. Each email carries a withdrawal link in its footer. [src: cnil-email-pixels]
- Session replay tools (délibération n° 2026-114, published 5 November 2026): prior consent is required; specific information is given at the first level of the consent interface; all content categories are masked by default; passwords and bank data are never collected; the tool should not be used for advertising retargeting. [src: cnil-session-replay]

## 4. Security

- ANSSI-PA-009 v2.0 of 28 April 2021 is the reference guide for browser-side website security, with recommendations numbered R1 to R63. No newer version is published. [src: anssi-web]
- ANSSI TLS guide v1.2 of 26 March 2020: TLS 1.3 is supported and preferred, TLS 1.2 is accepted subject to the guide's recommendations (R3); SSLv2, SSLv3, TLS 1.0 and TLS 1.1 are not used (R4). [src: anssi-tls]
- ANSSI-PG-078 v2.0 of 8 October 2021 covers multi-factor authentication and passwords. [src: anssi-mfa]
- ANSSI-PG-083 v3.00 of 20 March 2026 covers the choice and sizing of cryptographic mechanisms. [src: anssi-crypto]
- ANSSI-PA-102 v1.0 of 29 April 2024 addresses AI-assisted code generation in section 5.5: systematically review AI-generated source code (R30), limit generation for critical modules (R31), raise developer awareness (R32). [src: anssi-genai]
- A joint ANSSI and BSI publication, "AI Coding Assistants", is dated 4 October 2024. [src: anssi-bsi-ai-coding]
- ANSSI guides state that their recommendations are not normative. [src: anssi-web]
- OWASP Top 10:2025 is final. Categories: A01 Broken Access Control; A02 Security Misconfiguration; A03 Software Supply Chain Failures; A04 Cryptographic Failures; A05 Injection; A06 Insecure Design; A07 Authentication Failures; A08 Software or Data Integrity Failures; A09 Security Logging and Alerting Failures; A10 Mishandling of Exceptional Conditions. [src: owasp-top10-2025]
- The Cyber Resilience Act applies to products with digital elements. Its recital 12 excludes websites that do not support the functionality of such a product. It is therefore not treated as applicable to a website as such. [src: cra]

## 5. Consumer and information law

### 5.1 Identification of the website operator

- EU basis (Article 5 of Directive 2000/31/EC): name of the provider, geographic address, contact details including an email address, trade register and registration number, supervisory authority for regulated activities, details for regulated professions, VAT number. Prices are indicated clearly and unambiguously, stating whether tax and delivery costs are included. [src: ecommerce-directive]
- France (Article 1-1 of the LCEN, in force since 23 May 2024): natural persons publish surname, first names, home address and telephone number, plus registration number if registered; legal persons publish name, registered office and telephone number, plus registration number, share capital and registered office address if registered; all publish the name of the publication director, and the name, address and telephone number of the host. Non-professionals may publish only the host's details if they have given their own identity to the host. [src: fr-lcen]
- France: the penalty for missing identification is in Article 1-2 of the LCEN: one year of imprisonment and a fine of EUR 75 000. [src: fr-lcen]
- France (Article 19 of the LCEN, e-commerce): name, address of establishment, email address and telephone details allowing effective contact, registration number, share capital and registered office, VAT number, licensing authority, professional rules for regulated professions. [src: fr-lcen]

### 5.2 Distance selling

- The order button is labelled only with the words "order with obligation to pay" or an equally unambiguous wording; otherwise the consumer is not bound (Article 8(2) of Directive 2011/83/EU). In France: "commande avec obligation de paiement" (Article L. 221-14). [src: consumer-rights-directive, fr-code-consommation]
- France: sites state, at the latest at the start of the ordering process, the accepted means of payment and any delivery restrictions (Article L. 221-14). Pre-contractual information is listed in Article L. 221-5. [src: fr-code-consommation]
- Online withdrawal function (Article 11a of Directive 2011/83/EU, applicable from 19 June 2026): for distance contracts concluded through an online interface, a function labelled "withdraw from contract here" or an equally unambiguous wording, continuously available throughout the withdrawal period, prominently displayed and easily accessible. The statement lets the consumer provide or confirm name, contract identification and the electronic means for receiving confirmation; a confirmation function is labelled "confirm withdrawal"; an acknowledgement of receipt is sent on a durable medium, with its content and the date and time of submission. [src: withdrawal-function-directive]
- France: the withdrawal function is in Article L. 221-21 and Article D. 221-5 of the code de la consommation, in force since 19 June 2026. Labels: "renoncer au contrat ici" and "confirmer la rétractation", or an equally unambiguous wording. The acknowledgement is sent within a reasonable time. Contracts already running on 19 June 2026 remain under the previous rules. Administrative fine under Article L. 242-13: up to EUR 15 000 for a natural person and EUR 75 000 for a legal person. [src: fr-code-consommation]
- Price reduction announcements indicate the prior price, meaning the lowest price applied during a period of at least 30 days before the reduction (Article 6a of Directive 98/6/EC). In France: Article L. 112-1-1, in force since 28 May 2022. [src: price-reduction-directive, fr-code-consommation]
- The European online dispute resolution platform no longer exists: Regulation (EU) No 524/2013 is repealed with effect from 20 July 2025. A website must not link to it as a required mention. [src: odr-repeal]
- France: the trader communicates the contact details of the competent consumer mediator, visibly and legibly on the website, in the general terms or on order forms (Articles L. 616-1 and R. 616-1). [src: fr-code-consommation]

### 5.3 Digital Services Act and deceptive design

- Regulation (EU) 2022/2065 has applied since 17 February 2024. [src: dsa]
- All intermediary service providers: single point of contact for authorities (Article 11), point of contact for recipients that does not rely solely on automated tools (Article 12), clear terms and conditions on restrictions and moderation (Article 14). [src: dsa]
- Hosting providers: notice and action mechanism (Article 16), statement of reasons (Article 17). [src: dsa]
- Online platforms, except micro and small enterprises (Article 19): interfaces must not deceive or manipulate (Article 25), advertising transparency (Article 26), protection of minors (Article 28). Article 25 does not apply to practices covered by Directive 2005/29/EC or by the GDPR. [src: dsa]
- For websites that are not online platforms, deceptive interfaces fall under the unfair commercial practices rules: Articles 5 to 9 of Directive 2005/29/EC. [src: ucpd]
- A Digital Fairness Act was proposed by the Commission on 11 November 2026 (COM(2026) 1100 final). It is a proposal with no legal effect. [src: digital-fairness-act-proposal]

### 5.4 Eco-design (not mandatory)

- France: the RGESN, version 2024, has 78 criteria and describes itself as non-binding. [src: rgesn-2024]

## 6. Watch list

Events that would change this file. Check them at each review.

1. Publication of RGAA 5, or of its beta, and the order that brings it into force.
2. Citation of EN 301 549 V4.1.1 in the Official Journal of the EU, under Directive 2016/2102 or Directive 2019/882.
3. 2 December 2026: end of the Article 50(2) transition and start of the new Article 5 prohibitions of the AI Act.
4. Progress of the Digital Omnibus on data, privacy and cookies, COM(2025) 837.
5. Progress of the Digital Fairness Act proposal, COM(2026) 1100.
6. French transposition of the NIS2 directive.
7. Outcome of pending French court cases and DGCCRF inspections on the European Accessibility Act.
