# Rights of the people whose data the site holds

What a site with user accounts, orders, a newsletter or contact forms must make possible so that people can exercise their GDPR rights, and how to build the user-facing part.

## How to use this file

1. Section 1 applies to every site that processes personal data: there must be a working way to send a request. Sections 2 to 7 describe each right and what to build when the site has accounts.
2. The agent builds the interface and the technical means (export, deletion, preference switches). Handling requests (checking identity, answering within the deadline, deciding on exceptions) is the owner's job; the agent lists it for them, it does not decide it.
3. Tags: `GDPR` is EU law, valid in every Member State. `[best practice]` has no official source. Deadlines are stated by the GDPR article cited; they are not restated here as numbers to avoid drift: read Article 12(3) when you need them.
4. Write the matching section of the privacy policy with [../../templates/privacy-policy.md](../../templates/privacy-policy.md).

Why build it in the site rather than leave it to email: a right that exists on paper but is hard to use is not facilitated, and the GDPR requires the controller to facilitate it. Self-service also reduces the owner's workload and the risk of missing a deadline.

## 1. Every site: a way to make a request

- [ ] Give people a simple way to exercise their rights: a contact address or form dedicated to data protection requests, named in the privacy policy [GDPR art. 12(2); GDPR art. 13(2)(b)]
- [ ] Accept requests by electronic means; when a request is made electronically, the answer is given electronically where possible, unless the person asks otherwise [GDPR art. 12(3)]
- [ ] Answer without undue delay and within the time limit of Article 12(3), which allows an extension for complex or numerous requests if the person is told within the first period; build the request log so the owner sees the due date [GDPR art. 12(3)]
- [ ] Do not charge for requests, except in the cases Article 12(5) allows for manifestly unfounded or excessive requests [GDPR art. 12(5)]
- [ ] Ask for additional information to confirm identity only when there is a reasonable doubt; do not demand an identity document by default from a signed-in user [GDPR art. 12(6); GDPR art. 5(1)(c)]
- [ ] Tell people they can lodge a complaint with a supervisory authority (in France, the CNIL) [GDPR art. 13(2)(d)]
- [ ] Keep a log of requests received (date, type, status, date answered) for the owner, without copying the data requested into it [best practice]

A rights request form is itself a form: apply [forms-and-minimisation.md](forms-and-minimisation.md) (collect only what is needed to identify the requester and the request) and the accessibility rules.

## 2. Access and portability

Access (Article 15): the person can obtain confirmation that their data are processed, a copy of the data, and information about the processing. Portability (Article 20): for data they provided, processed by automated means on the basis of consent or contract, they can receive them in a structured, commonly used, machine-readable format and have them sent to another controller where technically feasible.

- [ ] Provide a copy of the personal data processed about the person [GDPR art. 15(3)]
- [ ] With the copy, give the information of Article 15(1): purposes, categories of data, recipients, retention period, rights, source of the data if not collected from the person, existence of automated decision-making [GDPR art. 15(1)]
- [ ] For data the person provided, processed on the basis of consent or contract by automated means, offer an export in a structured, commonly used, machine-readable format (JSON or CSV, not a PDF or a screenshot) [GDPR art. 20(1)]
- [ ] On a site with accounts, offer a "Download my data" function in the account settings, covering every store listed for that person (profile, orders, messages, consents, preferences) [best practice]
- [ ] Generate the export only for the authenticated account holder, deliver it over an authenticated channel, and make download links expire [GDPR art. 32(1)]
- [ ] Do not include other people's personal data in the export without checking that it does not adversely affect their rights (messages exchanged with others, for example) [GDPR art. 15(4)]

## 3. Rectification

- [ ] Let the person correct inaccurate data and complete incomplete data; on a site with accounts, an editable profile does most of this [GDPR art. 16]
- [ ] Propagate corrections to the copies the site controls (newsletter tool, CRM, search index), and notify the recipients of the data unless that proves impossible or involves disproportionate effort [GDPR art. 19]

## 4. Erasure

The person can obtain erasure when, among other grounds, the data are no longer needed, they withdraw the consent the processing relied on, they object successfully, the processing was unlawful, or a legal obligation requires erasure. Exceptions exist (freedom of expression, legal obligation, public health, archiving and research, legal claims).

- [ ] On a site with accounts, offer a "Delete my account" function that is as easy to find as account creation, with a confirmation step [GDPR art. 17(1); GDPR art. 12(2)]
- [ ] Delete or anonymise the person's data in every store the site controls: database and replicas, search index, caches, file storage (avatars, uploads), newsletter and email tools, analytics with user identifiers, support tools [GDPR art. 17(1)]
- [ ] Keep only what a legal obligation requires (invoices, for example) and say so to the person; the owner decides which exceptions apply, not the agent [GDPR art. 17(3)]
- [ ] Ask processors to delete their copies (through their deletion API or a documented manual step), and notify other recipients of the erasure [GDPR art. 19; GDPR art. 28(3)]
- [ ] Document how long deleted data remain in backups and that they are not restored into production [best practice]
- [ ] When the data were made public (a public profile, a published comment), take reasonable steps to inform other controllers processing them [GDPR art. 17(2)]

## 5. Restriction and objection

- [ ] Be able to restrict processing of a person's data (keep it but not use it) while a dispute about accuracy or an objection is examined; a flag on the record that the code checks before non-essential processing is one way [GDPR art. 18(1)]
- [ ] When processing rests on legitimate interests or a public task, the person can object on grounds relating to their situation; processing then stops unless the controller shows compelling legitimate grounds, which the owner decides [GDPR art. 21(1)]
- [ ] For direct marketing, objection is unconditional and takes effect at once: an unsubscribe link in every message, and an opt-out in the account [GDPR art. 21(2); GDPR art. 21(3)]
- [ ] Bring the right to object to the person's attention at the latest at the first communication, clearly and separately from other information [GDPR art. 21(4)]

## 6. Withdrawal of consent

- [ ] For each processing based on consent, provide a withdrawal as easy as giving consent: a switch in the account, an unsubscribe link, the "Manage cookies" control for trackers [GDPR art. 7(3)]
- [ ] After withdrawal, stop the processing based on that consent; erase the data when no other lawful basis remains [GDPR art. 7(3); GDPR art. 17(1)]
- [ ] Withdrawal does not affect what was lawfully done before it; do not ask the person to justify it [GDPR art. 7(3)]

Trackers have their own withdrawal rules: [consent.md](consent.md) section 6.

## 7. Automated decisions

The person has the right not to be subject to a decision based solely on automated processing, including profiling, that produces legal effects or similarly significantly affects them (for example an automatic refusal of credit or of a job application), unless an exception of Article 22(2) applies.

- [ ] When the site makes such decisions, stop and flag it to the owner: whether Article 22 applies and which exception is relied on is a legal decision [GDPR art. 22(1); GDPR art. 22(2)]
- [ ] Where the decision relies on contract or explicit consent, provide at least a way to obtain human intervention, to express one's point of view and to contest the decision [GDPR art. 22(3)]
- [ ] Inform people of the existence of automated decision-making, with meaningful information about the logic involved and its consequences [GDPR art. 13(2)(f)]

The link with the AI Act for decisions made by AI systems is handled in the AI part of this skill.

## 8. What to list for the owner

The agent cannot run the request process. At the end of the work, list for the owner (illustration):

- the address or form where requests arrive, and who reads it;
- the deadline of Article 12(3) and how they will track it;
- which data are kept despite an erasure request, and on which legal basis;
- which processors hold copies and how to have them deleted;
- whether a data protection officer exists, so the privacy policy can name them.
