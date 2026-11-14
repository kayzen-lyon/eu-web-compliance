# Collecting personal data: forms, minimisation, retention, logs

What to do whenever the site collects data about people: contact and quote forms, sign-up and account pages, checkout, newsletter subscription, job applications, comments, and the logs and analytics that record visitors.

## How to use this file

1. Before adding a field, a form or a log line, go through section 1. Each field needs a purpose and a lawful basis that the **site owner** confirms. You never choose the lawful basis or the retention period yourself: you ask, and you write "to be confirmed by the controller" where the answer is missing.
2. Then write the form with sections 2 and 3 (information and consent checkboxes), and check sections 4 to 8 when they apply.
3. The form must also be accessible: labels, errors, autocomplete. See [../accessibility/rules.md](../accessibility/rules.md) section 5 and 12.
4. Tags: `GDPR` is EU law, valid in every Member State. `LIL` is the French data protection law. `[best practice]` has no official source and is never presented as an obligation. Ages and other numbers are in [../regulatory-status.md](../regulatory-status.md) section 3.1.
5. What to put in the privacy policy is in [../../templates/privacy-policy.md](../../templates/privacy-policy.md). The rights visitors can exercise are in [data-subject-rights.md](data-subject-rights.md).

The principle behind every rule here: data you do not collect cannot leak, be misused or be asked for back. The people affected are the visitors who fill in the form; a field "just in case" is a risk they carry without benefit.

## 1. Before adding a field: purpose, lawful basis, necessity

- [ ] Each piece of personal data is collected for a specified, explicit purpose, and is not reused later for an incompatible purpose [GDPR art. 5(1)(b)]
- [ ] Each processing has one lawful basis among the six of Article 6: consent, contract, legal obligation, vital interests, public task, legitimate interests. The owner decides which; record it next to the form's code or in the processing register [GDPR art. 6(1)]
- [ ] Collect only the fields the purpose needs: a contact form needs a way to reply, not a postal address, a date of birth or a phone number "in case" [GDPR art. 5(1)(c)]
- [ ] By default, process only the data needed for each specific purpose, in amount, extent of processing, retention and accessibility; profiles and user content are not public by default [GDPR art. 25(2)]
- [ ] Make a field optional, or remove it, when the purpose can be met without it; a field required by the code must be required by the purpose [GDPR art. 5(1)(c); GDPR art. 25(2)]
- [ ] Do not ask for an identity document, a full date of birth or a national identification number unless the owner names the legal obligation or the necessity that requires it [GDPR art. 5(1)(c)]
- [ ] Prefer collecting a derived value to the raw one when it serves the purpose (an "I am over N" confirmation instead of a date of birth, a country instead of a full address) [best practice]
- [ ] If the purpose does not need to identify the person, do not collect identifying data just to comply with the GDPR [GDPR art. 11(1)]

Useful questions to ask the owner, in one message (illustration): "For the contact form: what will you do with each field? Do you need the phone number? How long do you keep messages? Do you want to add people to a newsletter (then a separate, unticked checkbox is needed)?"

## 2. Information at the time of collection

When data is collected from the person, they are told at that moment. The information is concise, transparent, intelligible and easily accessible, in clear and plain language.

- [ ] At the point of collection, give or link to: the controller's identity and contact details, the data protection officer's contact details if there is one, the purposes and lawful basis, the legitimate interests pursued when that is the basis, the recipients or categories of recipients, and any transfer outside the EU with its safeguard [GDPR art. 13(1)]
- [ ] Also give: the retention period or the criteria that set it, the rights of access, rectification, erasure, restriction, objection and portability, the right to withdraw consent at any time when consent is the basis, the right to lodge a complaint with a supervisory authority, whether providing the data is a legal or contractual requirement and what happens if it is not provided, and the existence of automated decision-making with meaningful information about it [GDPR art. 13(2)]
- [ ] Place a short notice next to the submit button that names the controller and the purpose and links to the full privacy policy; the full list of Article 13 items can live in the policy [GDPR art. 12(1)]
- [ ] Mark which fields are required and which are optional, in the label text, so the person knows what happens if they leave one empty [GDPR art. 13(2)(e)]
- [ ] Write the notice in the language of the page and in plain words, not legal jargon [GDPR art. 12(1)]

Illustration of a notice under a contact form (adapt; the bracketed parts come from the owner):

> [Company name] uses the data in this form to answer your request. Fields marked "required" are needed to reply to you. We keep your message for [period confirmed by the owner]. You can access, correct or delete your data and exercise your other rights: see our [privacy policy].

## 3. Consent checkboxes for optional purposes

When a form also serves an optional purpose (newsletter, marketing by partners, publishing a testimonial, keeping a CV for future openings), that purpose usually rests on consent.

- [ ] One checkbox per optional purpose, unticked by default, with a label that says exactly what the person agrees to [GDPR art. 4(11); GDPR art. 7(2)]
- [ ] The consent request is clearly distinguishable from other matters: not inside the terms of use, not merged with "I accept the terms" [GDPR art. 7(2)]
- [ ] Submitting the form, ordering or creating an account does not depend on ticking an optional consent box [GDPR art. 7(4)]
- [ ] Record who consented, to what (the label text or its version), when and through which form, so that consent can be demonstrated [GDPR art. 7(1)]
- [ ] Tell the person how to withdraw, and make withdrawing as easy as ticking the box (an unsubscribe link in every newsletter, a switch in the account) [GDPR art. 7(3)]
- [ ] When personal data are used for direct marketing, the person can object at any time; bring this right to their attention at the latest at the first communication, clearly and separately from other information [GDPR art. 21(2); GDPR art. 21(4)]
- [ ] After an objection to direct marketing, stop using the data for that purpose [GDPR art. 21(3)]
- [ ] Do not tick "I accept the terms" for the person, and do not use it as a consent to marketing; acceptance of a contract and consent to processing are different things [GDPR art. 7(2)]

Rules on sending electronic marketing messages (for example, in France, the code des postes et des communications électroniques) are not covered by this file. Ask the owner whether they send marketing messages, and flag the question for their adviser rather than deciding when consent to the messages themselves is needed. Tracking pixels in those emails are covered in [consent.md](consent.md) section 9.

## 4. Children

- [ ] Ask whether the service is offered directly to children. Where it relies on consent for an information society service offered directly to a child, consent below the age set by the Member State is given or authorised by the holder of parental responsibility; the ages are in [../regulatory-status.md](../regulatory-status.md) section 3.1, and France sets its own [GDPR art. 8(1); LIL art. 45]
- [ ] Make reasonable efforts, using available technology, to verify that parental consent was given; the method is the owner's decision with their adviser [GDPR art. 8(2)]
- [ ] Where legitimate interests is the basis, the balance weighs more heavily for the person when they are a child; flag such processing for review [GDPR art. 6(1)(f)]
- [ ] Do not collect more data to check age than the check needs (a date of birth kept for ever to confirm one threshold is excessive) [GDPR art. 5(1)(c)]

A site aimed at minors is one of the cases where the skill stops and recommends a professional (see the escalations of `references/scoping/obligations.json`).

## 5. Special categories of data

Data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, trade union membership, genetic data, biometric data used to identify a person, health data, and data about sex life or sexual orientation are prohibited from processing unless one of the exceptions of Article 9(2) applies.

- [ ] When a form, an account or a tool would process data of these categories, stop and ask the owner which exception of Article 9 applies; never choose the exception yourself [GDPR art. 9(1)]
- [ ] Do not add such a field "for statistics" or "to personalise"; the default answer is not to collect it [GDPR art. 5(1)(c); GDPR art. 9(1)]
- [ ] Free-text fields invite sensitive disclosures (a medical condition in a booking note); say in the label what is expected, and warn against including sensitive information when the purpose does not need it [best practice]
- [ ] Large-scale processing of these categories is one of the cases listed in Article 35(3) for an impact assessment: flag it to the owner and their data protection officer or adviser [GDPR art. 35(3)]

## 6. Retention

- [ ] Every kind of personal data has a retention period, or criteria that set it, decided by the owner; data are kept no longer than the purpose needs [GDPR art. 5(1)(e); GDPR art. 13(2)(a)]
- [ ] Never invent a retention period. Write "to be confirmed by the controller" and list the question for the owner; legal retention duties (tax, commercial) depend on the country and the activity [GDPR art. 5(1)(e)]
- [ ] Implement deletion or anonymisation when the period ends, with a scheduled job, rather than relying on a manual clean-up [best practice]
- [ ] Store the creation date (or the date that starts the retention period) with each record, so that the deletion job can find what to delete [best practice]
- [ ] Apply the same retention to copies: exports, caches, search indexes, email tools, backups (backups may expire on their own cycle, which the owner documents) [best practice]

## 7. Logs, URLs and analytics without excess personal data

Logs and monitoring are processing of personal data as soon as they hold IP addresses, identifiers or form contents. They need a purpose (security, debugging), a retention period and appropriate security.

- [ ] Log events, not contents: "user 8f3c… changed their email", not the old and new addresses [GDPR art. 5(1)(c)]
- [ ] Never log passwords, authentication tokens, session identifiers, card numbers or the full body of requests that may contain personal data [GDPR art. 32(1)]
- [ ] Keep personal data out of URLs (path and query string): they end up in server and proxy logs, browser history and the `Referer` header sent to third parties. Send them in a POST body or keep them server-side [best practice]
- [ ] Use an internal identifier rather than the email address as the key in logs and analytics events [best practice]
- [ ] Truncate or mask IP addresses in application logs when the full address is not needed for the purpose (illustration: drop the last octet of an IPv4 address). This is common practice, not a legal requirement with a set method [best practice]
- [ ] Set a retention period for logs and purge them automatically [GDPR art. 5(1)(e)]
- [ ] Do not send form contents, email addresses or user identifiers to analytics or error-monitoring tools; scrub them before sending [GDPR art. 5(1)(c)]
- [ ] Apply security measures appropriate to the risk to stored personal data (encryption, access control, ability to restore, regular testing); detailed values are in the security part of this skill [GDPR art. 32(1)]

## 8. Development and test data

- [ ] Do not use production personal data in development, test or staging environments; use generated data and addresses under reserved test domains such as `example.com` [best practice]
- [ ] If a production copy is unavoidable, scrub or pseudonymise it before it leaves production [GDPR art. 32(1)]

## 9. When to stop and ask a professional

Flag these to the owner, and recommend that their data protection officer or a lawyer reviews them, instead of deciding:

- Processing that may require a data protection impact assessment. Article 35(3) names systematic and extensive automated evaluation of people with legal or similarly significant effects, large-scale processing of special categories or criminal data, and large-scale systematic monitoring of a publicly accessible area; the list is not exhaustive.
- Special categories of data (section 5), children (section 4), automated decisions about people ([data-subject-rights.md](data-subject-rights.md) section 7).
- Whether the owner must appoint a data protection officer or keep a record of processing activities (Articles 37 and 30): the agent does not decide this.

The record of processing activities is not generated by this version of the skill; listing purposes, bases, recipients and retention as you build the forms gives the owner most of its content.
