# Template: privacy policy

Guidance for the agent. Everything above the line "PUBLISHABLE TEXT" stays out of the published document.

This template is produced with an AI tool. It is not legal advice. The published text speaks for the controller (the site owner): the controller, or their data protection officer or lawyer, reads and approves it before it goes online. Say so to the user when you hand it over.

## When to use it

Whenever the site processes personal data (profile field `data.collects_personal_data`; applicability rows `gdpr-information-notice` and related in `references/scoping/obligations.json`). Almost every site does: contact forms, accounts, orders, newsletters, logs kept with IP addresses, analytics.

The content is what Articles 13 (and 14, for data not collected from the person) of the GDPR require, listed in [../references/privacy/forms-and-minimisation.md](../references/privacy/forms-and-minimisation.md) section 2. Rights are described in [../references/privacy/data-subject-rights.md](../references/privacy/data-subject-rights.md). Trackers get their own document: [cookie-policy.md](cookie-policy.md); this policy links to it.

## What comes from where

| Content | Source | If missing |
|---------|--------|-----------|
| Controller identity and contact details | The owner (legal name, address, email). Not in the profile | Leave the placeholder visible and report it |
| Data protection officer | Profile `referents.dpo`, and the owner for the contact details | If `false` or unknown, delete that sentence rather than inventing a contact |
| Processing activities: what data, why, on which lawful basis | The forms, accounts, orders and logs found in the code, confirmed by the owner | Write the data and purpose you found; write the basis as "[to be confirmed by the controller]" |
| Legitimate interests pursued | The owner | Placeholder |
| Recipients and processors | The list of [../references/privacy/third-parties-and-transfers.md](../references/privacy/third-parties-and-transfers.md) section 4, and profile `data.third_party_tools` | List categories found in the code; mark the rest to be confirmed |
| Transfers outside the EU and safeguard | Profile `data.transfers_outside_eu`, the third-party list, and the owner | "[to be confirmed by the controller]" |
| Retention periods | The owner only | "[to be confirmed by the controller]" |
| Automated decisions | Profile `ai.decisions_about_people`, and the owner | If none, say none; if any, flag it for legal review |
| Supervisory authority | The country of establishment (`operator.country_of_establishment`); in France, the CNIL | Placeholder |

## What you must never invent

- The controller's legal name, address, registration number or contact email.
- A lawful basis. The owner chooses it among the six of Article 6 of the GDPR; you may suggest the usual one for a processing, marked as a suggestion to confirm.
- A retention period, a legal retention obligation, or a "we keep your data for as long as necessary" sentence presented as a period.
- A processor, its role, its contract status, its location or its transfer mechanism.
- A data protection officer or a security certification.
- A statement that the site is "GDPR compliant".

Placeholders stay in square brackets until the owner fills them. A published policy with a visible placeholder is better than a wrong statement; still, list every remaining placeholder in your report so the owner completes them before release.

## Language

The publishable text below is in English. For a site addressed to the French public, produce a French version: it is a translation of the same content, section by section, not a different document. Publish each language version in the language of the pages it serves, and keep them in step when one changes.

## Form

Publish it as an HTML page reachable from every page (footer link "Privacy policy" or "Personal data"), linked from each form's short notice, and written to the accessibility rules of the skill (headings, lists, links with meaningful text). Keep the sentences short. Delete sections that do not apply rather than leaving them empty, except where the template says to keep them.

---

PUBLISHABLE TEXT

---

# Privacy policy

Last updated: [YYYY-MM-DD]

This page explains which personal data [Controller name] collects through [site name or address], why, and what rights you have.

## Who is responsible for your data

The controller is [legal name, legal form], [postal address], [registration number if any]. Contact: [email address or contact form for data protection requests].

[Only if a data protection officer is appointed:] You can contact our data protection officer at [contact details].

## What we collect, why, and on which basis

[One block per processing activity found in the code and confirmed by the owner. Illustrations below: keep only those that exist, add the others.]

### Answering your messages

- Data: [name, email address, message].
- Purpose: answering your request sent through the contact form.
- Lawful basis: [to be confirmed by the controller; usually legitimate interests in answering, or pre-contractual steps at your request].
- Retention: [to be confirmed by the controller].

### Your account

- Data: [email address, password (stored hashed), name, preferences].
- Purpose: creating and managing your account.
- Lawful basis: [to be confirmed by the controller; usually performance of the contract].
- Retention: [to be confirmed by the controller].

### Orders and invoices

- Data: [name, delivery address, email, order details; payment is handled by [payment provider], we do not store your card number].
- Purpose: processing and delivering your order, invoicing, after-sales service.
- Lawful basis: [to be confirmed by the controller; usually performance of the contract, and legal obligations for invoices].
- Retention: [to be confirmed by the controller, including the legal retention period for invoices that applies to the controller].

### Newsletter

- Data: [email address].
- Purpose: sending you our newsletter, if you asked for it.
- Lawful basis: your consent, which you can withdraw at any time with the unsubscribe link in each email or [in your account].
- Retention: [to be confirmed by the controller].

### Security and technical logs

- Data: [IP address, date and time, page requested, browser type].
- Purpose: keeping the site secure and working.
- Lawful basis: [to be confirmed by the controller; usually legitimate interests in securing the site].
- Retention: [to be confirmed by the controller].

Fields marked "required" in our forms are needed for the purpose stated; without them we cannot [answer you / create your account / process your order]. Other fields are optional.

[Only if a processing relies on legitimate interests:] Where we rely on our legitimate interests, they are: [interests stated by the controller]. You can object to such processing, see "Your rights".

## Who receives your data

Your data are accessible only to the people at [Controller name] who need them, and to the following service providers acting on our behalf:

| Service | Purpose | Location |
|---------|---------|----------|
| [Hosting provider] | Hosting the site | [country or region] |
| [Email delivery service] | Sending emails | [country or region] |
| [Payment provider] | Payment | [country or region] |

[Add any recipient that acts on its own behalf, for example an embedded content provider or advertising partner, and say so.]

## Transfers outside the European Union

[If none:] Your data are not transferred outside the European Union.

[If some:] Some of the providers above process data outside the European Union: [provider and country]. These transfers rely on [an adequacy decision of the European Commission / the provider's certification under the EU-US Data Privacy Framework / standard data protection clauses adopted by the European Commission — to be confirmed by the controller]. You can obtain a copy of these safeguards by writing to [contact].

## Cookies and other trackers

Our use of cookies and other trackers, and how to change your choices, is explained in our [cookie policy]. You can change your choices at any time with "Manage cookies" at the bottom of every page.

## Automated decisions

[If none:] We do not take decisions about you based solely on automated processing.

[If some: describe them, with meaningful information about the logic and the consequences, and how to obtain human review. This section must be reviewed by the controller's legal adviser.]

## Your rights

You have the right to:

- access your data and obtain a copy;
- have inaccurate data corrected;
- have your data erased, in the cases provided by law;
- restrict the processing of your data;
- receive the data you gave us in a machine-readable format, and have them sent to another organisation, when processing is based on your consent or a contract;
- object to processing based on our legitimate interests, and object at any time to direct marketing;
- withdraw your consent at any time, for processing based on consent, without affecting what was done before;
- [only if applicable: not be subject to a decision based solely on automated processing, and obtain human review].

[Only if the site has accounts:] You can download, correct or delete your data directly from [your account settings].

To exercise your rights, write to [contact]. We answer within the time limit set by Article 12 of the General Data Protection Regulation. We may ask for information to confirm your identity if we have a reasonable doubt about it.

You also have the right to lodge a complaint with a data protection supervisory authority, in particular in the Member State where you live or work. [For France: the Commission nationale de l'informatique et des libertés (CNIL), www.cnil.fr.]

## Changes to this policy

We update this page when our processing changes. The date at the top shows the last update.

---

This policy was prepared with an AI-assisted tool and reviewed by [Controller name]. [Delete this line only if the owner asks; keep the review step in any case.]
