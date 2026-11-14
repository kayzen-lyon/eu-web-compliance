# Third-party services, processors and transfers outside the EU

What the agent must find out, list and ask about whenever the site sends personal data to another organisation: hosting, email delivery, analytics, payment, chat, CRM, error monitoring, AI APIs, embedded content, fonts and CDNs.

## How to use this file

1. Every third-party service the site uses goes into the list of section 4. Build it from the tracker inventory ([trackers.md](trackers.md) section 2) and from the server code (APIs called, SDKs, webhooks, SMTP settings, storage buckets).
2. For each service, sections 1 to 3 tell you which questions matter. The agent describes properties (what data leaves, to whom, where, for what); it does not judge a vendor "compliant" or "non-compliant", and it does not recommend or blacklist brands. Brand names below are only illustrations of a category.
3. The legal qualification of a vendor (processor, joint controller, independent controller) and the validity of a transfer mechanism are decisions for the owner and their adviser. The agent gathers the facts and asks.
4. Tags: `GDPR` is EU law, valid in every Member State. `CNIL guidelines` is the French regulator's reading. `[best practice]` has no official source. The current state of transfers to the United States is in [../regulatory-status.md](../regulatory-status.md) section 3.3: read it there, do not rely on memory, because it has changed several times.

Why it matters: the owner remains responsible for what their vendors do with visitors' data. A script added in one line can send every visitor's IP address, and sometimes form contents, to a company in another legal system.

## 1. Who is who

- **Controller**: decides why and how data are processed. The site owner is the controller for the site's own processing, including trackers managed by a vendor on its behalf.
- **Processor**: processes data only on the controller's behalf and instructions (hosting, email delivery, a support desk used only for the owner's customers).
- **Joint controllers**: decide purposes and means together. A site that embeds a third party's content or button which collects data for that third party's own purposes is usually a joint controller with it for the collection.
- **Independent controller**: a service that uses the data for its own purposes (an advertising network, a social network) is a controller in its own right for those purposes.

- [ ] Treat the site owner as controller for trackers set on its site, including when a vendor manages them on its behalf [CNIL guidelines § 34]
- [ ] Treat a third party that sets trackers through the site for its own purposes as a controller, and the site and that third party as joint controllers for the reading and writing on the device [CNIL guidelines § 35; CNIL guidelines § 38]
- [ ] Joint controllers set out their respective responsibilities transparently in an arrangement, in particular who collects and proves consent [GDPR art. 26(1); CNIL guidelines § 39]
- [ ] A service that reads or writes on the device exclusively on behalf of the site is a processor, and a contract under Article 28 is needed [CNIL guidelines § 40]

## 2. Processors (Article 28)

- [ ] Use only processors that provide sufficient guarantees of appropriate technical and organisational measures [GDPR art. 28(1)]
- [ ] Before personal data flow to a processor, a contract or other legal act binds it; it sets the subject, duration, nature and purpose of the processing, the types of data and categories of persons, and the controller's obligations and rights [GDPR art. 28(3)]
- [ ] The contract requires the processor to: act only on documented instructions (including on transfers), ensure confidentiality of its staff, apply Article 32 security, respect the conditions for sub-processors, help with rights requests and with Articles 32 to 36, delete or return the data at the end, and allow audits [GDPR art. 28(3)]
- [ ] A processor engages a sub-processor only with the controller's prior written authorisation, specific or general; with general authorisation, the controller is told of changes and can object [GDPR art. 28(2)]
- [ ] Ask the owner whether the contract exists for each processor (most vendors publish a "data processing agreement" or "DPA" to accept); never state that it does when you have not seen it [GDPR art. 28(3)]
- [ ] Send each processor only the data its task needs (an email delivery service needs the address and the message, not the whole customer profile) [GDPR art. 5(1)(c)]

## 3. Transfers outside the EU

A transfer happens when personal data are sent to, or made accessible from, a country outside the European Union (strictly, outside the European Economic Area). Loading a script, a font or an image from a server outside the EU sends at least the visitor's IP address there. Using an EU data centre of a company subject to a non-EU law can still involve access from outside; that analysis belongs to the owner's adviser.

- [ ] Every transfer rests on one mechanism of Chapter V, including onward transfers by the recipient [GDPR art. 44]
- [ ] An adequacy decision of the Commission for the destination country, territory or sector allows the transfer without further authorisation [GDPR art. 45(1)]
- [ ] For the United States, the adequacy decision covers only organisations certified under the EU-US Data Privacy Framework; check the recipient's certification and read the current status in [../regulatory-status.md](../regulatory-status.md) section 3.3 [GDPR art. 45(1)]
- [ ] Without adequacy, the transfer needs appropriate safeguards with enforceable rights and effective remedies for the persons, most often the standard data protection clauses adopted by the Commission, or binding corporate rules [GDPR art. 46(1); GDPR art. 46(2)]
- [ ] The derogations of Article 49 (explicit consent after being told of the risks, necessity for a contract with the person, and others) are for specific situations; do not use them as the routine basis for a site-wide tool, and flag any reliance on them to the owner's adviser [GDPR art. 49(1)]
- [ ] Tell people about transfers, the safeguard used and how to get a copy of it, in the information at collection and in the privacy policy [GDPR art. 13(1)(f)]
- [ ] Anything beyond these checks (a transfer impact assessment, supplementary measures, a recipient with no certification and no clauses, access by foreign authorities) goes to a professional; the agent does not conclude that a transfer is lawful [best practice]

Technical ways to reduce or avoid transfers, to offer the owner as options, never as the only acceptable choice:

- Self-host fonts, scripts and libraries; serve them from the site's own domain [best practice]
- Choose the vendor's EU data region when it offers one, and record it [best practice]
- For analytics, a server-side proxy that strips or pseudonymises identifiers before anything leaves the EU can avoid sending identifying data to the vendor; whether a given setup is enough is a legal assessment [best practice]

## 4. What to list and what to ask

Produce this list in the project (for example in `compliance/third-parties.json` or in the privacy policy source), one entry per service. It feeds the privacy policy, the cookie policy and the owner's record of processing.

| Field | Illustration |
|-------|--------------|
| Category | Email delivery, analytics, payment, hosting, chat, video embed, fonts, error monitoring, AI API |
| Service and company | Name as it appears in the code or the contract |
| How it is called | Script tag, iframe, server API, SMTP, SDK, webhook |
| Data sent | IP address, email, name, order, message content, device data, page URLs |
| Purpose | Why the site uses it |
| Role (to confirm) | Processor, joint controller, independent controller |
| Contract (to confirm) | Processing agreement accepted or signed: yes, no, unknown |
| Location of processing | Country or region; EU region selected or not |
| Transfer mechanism (to confirm) | Adequacy, Data Privacy Framework certification, standard clauses, none known |
| Needs consent first | Yes if it reads or writes on the device for a non-exempt purpose ([trackers.md](trackers.md)) |

- [ ] Fill what the code shows, mark the rest "to be confirmed by the owner", and ask all open questions in one message [best practice]
- [ ] Never fill the role, the contract status or the transfer mechanism from memory or from the vendor's marketing page; they come from the owner or from documents the owner provides [best practice]
- [ ] When a service receives special categories of data, children's data or data used for automated decisions, flag it for professional review [GDPR art. 9(1); GDPR art. 22(1)]
- [ ] Re-run the list whenever a dependency, a script or a server integration is added [best practice]

Illustration of the questions to the owner (adapt to the findings):

> I found these services that receive visitors' data: [list]. For each one, can you confirm: (1) whether you accepted their data processing agreement; (2) which data region your account uses; (3) for the ones based outside the EU, which transfer mechanism they rely on (adequacy, Data Privacy Framework certification, standard contractual clauses). Until you confirm, the privacy policy will show these points as "to be completed".
