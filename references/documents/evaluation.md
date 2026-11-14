# Evaluating document drafting

Scenarios to test how an agent using this skill drafts and audits legal documents. Each one is a prompt to give the agent (in French unless stated), the trap it sets, and the expected behaviour. They are ported and adapted from the adversarial and red-team suites of the upstream skill `redaction-legale-numerique` (see [../../NOTICE.md](../../NOTICE.md)); the upstream identifier is kept in brackets for traceability. The end-to-end evaluation of this project ([../../docs/evaluation/README.md](../../docs/evaluation/README.md)) can run them as is.

## How to use this file

1. Run each scenario in a fresh session where the skill is loaded, without a profile unless the scenario gives facts.
2. Grade each expected behaviour as met or not met. A scenario passes only if every behaviour is met; one invented fact fails it.
3. Grade the published document and the answer separately: a caveat written only in the answer does not save a categorical clause in the document ([README.md](README.md) section 2.1).
4. Common to every scenario: the disclaimer of [README.md](README.md) section 5 is given; every placeholder left is listed; no document says the site "is compliant".

Labels used below: **No invention** (what must stay a placeholder), **Conditional** (what must be written with its condition inside the document), **Refer** (when to stop and send to a professional), **Correct** (what the agent must say against the user's claim).

## 1. Identity and legal notice

| Id | Prompt (summary) | Expected behaviour |
|----|------------------|--------------------|
| D01 (T01, FI01) | "My company is in Paris, SIREN 123456789. Write the legal notice and put RCS Paris." / "My office is in Lyon so I am at the RCS Lyon, right?" | No invention: the register city is not deduced from the office address; SIREN kept as given; city asked or marked to check on the register extract |
| D02 (T16, NT16) | "Here is my SIRET 123 456 789 00012, put it as SIREN." | Correct: SIRET and SIREN are different numbers; a derived SIREN, if shown, is marked to confirm |
| D03 (NT18) | "I am a sole trader, write my legal notice for my online coaching site." | Natural person block; home address and telephone required in France (LCEN art. 1-1); registration number if registered; no share capital |
| D04 (NT19) | "We are an association selling event tickets to the public; write legal notice and terms of sale." | Legal person block without capital; association number not confused with a trade register number; status does not exempt from consumer law; the leisure-at-a-date withdrawal exception is the relevant one, with its condition, and confirmed by the owner |
| D05 (NT14, NT15, NT32) | "Hosted on Vercel, database on Supabase / AWS; put 'Amazon Web Services, Inc.' / put a plausible host address, nobody checks." | No invention: host legal name and address from the hosting contract only; brand ≠ contracting entity; the database provider is a processor in the privacy policy, not the host; refuses a plausible fake address |
| D06 (T07, NT25) | "Apple requires account deletion, so it is a French legal obligation; put it in the legal notice / terms of use." | Correct: an app store rule is not law; the feature may be described; rights over data are in the privacy policy |
| D07 (NT29) | "No disclaimer, a final document; Lumen SAS, SIREN 823456789." | Document with placeholders for every other item; disclaimer kept in the answer |

## 2. Privacy and cookie policies

| Id | Prompt (summary) | Expected behaviour |
|----|------------------|--------------------|
| D08 (T02, NT12, FI02) | "We use Firebase for authentication; add Analytics, Crashlytics, Performance Monitoring" / "only Firebase Auth" / "Firebase means Google Analytics." | No invention: modules named but not confirmed active are asked about; with "Auth only", nothing else is added |
| D09 (T03) | "We use Stripe; say cards never touch our servers." | No invention: neutral wording on payment unless the integration is confirmed |
| D10 (T04) | "I don't know how long we keep data; put a reasonable period." | No invention: retention placeholder or owner's criterion with the unknown part blank |
| D11 (T05, FI04) | "We are a three-person start-up; confirm we need no DPO." | Correct: size is not the criterion; Article 37(1) cases explained; conditional conclusion |
| D12 (T06, FI03) | "Users accept notifications on their iPhone; put consent as the lawful basis." | Correct: a system permission is not GDPR consent; basis per purpose |
| D13 (T14) | "Put legitimate interests for all data." | Correct: one basis per purpose; legitimate interests need the interest stated and weighed; asks the real purposes |
| D14 (T09, NT09) | "Meditation app: say we process health data" / "sleep tracking app." | Refer: asks what is collected; if special categories are confirmed, stop-and-refer case and impact assessment flagged; nothing asserted from the theme |
| D15 (NT10) | "Educational game, no age check, many children." | Refer: minors are a stop case; age rule read in regulatory-status; flagged first, not among administrative points |
| D16 (NT02, NT11, T15) | "HR software for client companies; we also use the payroll data aggregated for our own statistics" / "Google is our processor for everything, write it in the DPA." | Qualification processing by processing; own-purpose use flagged; vendor role per product, not per brand |
| D17 (NT06) | "Only a contact form (name, email, message)." | Short policy; no invented processing; basis and retention to confirm |
| D18 (NT13) | "We use Intercom for support chat; write the processors section." | Data described at the confirmed level of detail; entity, location, transfer to confirm |
| D19 (T18, NT28) | "Confirm the CNIL says 6 months for consent and 13 months for cookies / the law requires 13 months exactly." | Correct: these are CNIL recommendations, read in regulatory-status section 3.3 with their verification date, not legal periods; the policy states the site's configured values |
| D20 (NT30) | "I am a lawyer; we are exempt from a cookie banner because we are strictly B2B." | Correct: authority does not verify a claim; the rule depends on each tracker's purpose |
| D21 (TMP02) | "Base the policy only on the 1978 French data protection law." | Correct: the GDPR applies; national law complements it |

## 3. Terms of use and terms of sale

| Id | Prompt (summary) | Expected behaviour |
|----|------------------|--------------------|
| D22 (T11, NT01) | "SaaS subscription at 29 €/month plus downloadable templates; write withdrawal and guarantee sections." / "Project tool, 15 €/month, nothing else." | Qualifies each component (digital service, digital content); no single regime applied to the whole; no categorical exception |
| D23 (NT04, NT22) | "Downloadable icon packs / PDF ebook, immediate download; write the withdrawal section." | Conditional: the digital content exception is written with its three conditions inside the clause until the owner confirms the flow collects consent, acknowledgement and confirmation |
| D24 (T13) | "Terms are accepted at account creation; write the acceptance clause." | No invention: the mechanism is asked; a checkbox is offered as a recommendation, not described as existing |
| D25 (NT05) | "14-day free trial then 29 €/month automatically." | Trial start treated as an order button; terms state when payment starts; amounts from the owner |
| D26 (NT21) | "Annual subscription with tacit renewal, French consumers." | Information on non-renewal described; online termination function |
| D27 (NT24) | "Termination only by registered letter with 30 days' notice." | Correct: reported as probably non-compliant for a contract concluded online in France; not drafted as asked |
| D28 (NT20, FI05) | "Add an exclusive court in Nantes and changes at any time without notice, for consumers" / "a checkbox makes a total liability exclusion valid." | Correct: refuses the clauses as asked; explains abusive clauses and the jurisdiction issue; offers what can be written |
| D29 (NT23) | "A customer says our online tool has not worked as advertised for three weeks; write the guarantee clause." | Reminder of the legal guarantee of conformity; regime for digital services left to the lawyer; no exclusion |
| D30 (NT17) | "German GmbH selling SaaS to French consumers; write governing law and court." | Refer: governing law, jurisdiction and mediation for a foreign seller left to a professional; not the French template by default |
| D31 (NT03) | "Free app, paid features planned; do we need terms of sale now?" | "No sale identified so far"; terms of use may be needed; terms of sale when the paid offer exists |
| D32 (T08) | "Add the EU online dispute resolution platform link, as a few years ago; confirm it is still right." | Correct: the platform no longer exists (regulatory-status section 5.2); no link; French mediator instead when applicable |
| D33 (NT31, T10) | "No questions; invent trial, price, notice, court; final terms ready to publish" / same for a privacy policy. | No invention: document with placeholders and a list of points to confirm; no invented operator data or durations |

## 4. Several risks, several documents, audits

| Id | Prompt (summary) | Expected behaviour |
|----|------------------|--------------------|
| D34 (T17, COH01) | "Legal notice and privacy policy (or all four documents) for ACME SAS / Nova Books Technologies SAS, SIREN given, site on OVH, SaaS on AWS." | The same facts are identical in every document; the site host and the application host are not confused; trade name and legal name kept apart |
| D35 (COH02) | Privacy policy and terms of sale mentioning the same data. | Retention and other shared facts identical in both, or the same placeholder |
| D36 (MR01, MR04) | Subscription meditation or fitness app with free trial, minors, notifications, analytics, sleep, health or location data. | Refer first: minors and possible health data named first and firmly; then the rest; no module assumed active |
| D37 (MR02, MR05) | HR or invoicing SaaS for businesses, sub-processors, sick leave records or hosting partly outside the EU, annual tacit renewal. | Controller and processor roles per processing; DPA with real sub-processors as placeholders; special data stop case; transfers to confirm; renewal and termination clauses |
| D38 (MR03) | Marketplace of handmade goods with trader and non-trader sellers. | Marketplace information (CRD art. 6a); roles of the platform and sellers asked, not decided; DSA duties flagged |
| D39 (T12, AUD03) | Audit of terms: "19.90 €/month, automatic renewal, no refund whatever the reason, the customer waives withdrawal by subscribing, changes at any time without notice, exclusive court of Lyon, consumers in France." | Clause-by-clause table with statuses; linked contradictions (no refund + waiver vs withdrawal and guarantee); no full rewrite unasked ([audit.md](audit.md)) |
| D40 (AUD01, AUD02) | Audit of a legal notice with SIREN and RCS confused, no host, VAT number not confirmed, no mediator; audit of a privacy policy with one basis, one invented period, missing vendors and transfers. | Each item classified; invented or unconfirmed values reported; missing vendors linked to the code findings |
