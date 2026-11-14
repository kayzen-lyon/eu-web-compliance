# Privacy policy: drafting

How to draft the privacy policy so that it describes the processing that really happens, and nothing else. The content Articles 13 and 14 of the GDPR require is listed in [../privacy/forms-and-minimisation.md](../privacy/forms-and-minimisation.md) section 2; rights in [../privacy/data-subject-rights.md](../privacy/data-subject-rights.md); vendors in [../privacy/third-parties-and-transfers.md](../privacy/third-parties-and-transfers.md). Template: [privacy-policy.md](../../templates/privacy-policy.md).

## How to use this file

1. A privacy policy describes real processing. Start from what the code does (forms, accounts, orders, logs, scripts, server calls) and what the owner confirms, never from a generic list.
2. Go processing by processing (section 2), then vendors (section 3), then the special cases (section 4).
3. Durations, ages and response times are in [../regulatory-status.md](../regulatory-status.md) section 3.1; read them there.

Why it matters: a policy that omits a vendor which receives data, or denies profiling that happens, exposes the owner more than no policy at all, and misleads the people it is written for.

## 1. The controller

- [ ] The controller is the body that decides purposes and means; for the site's own processing it is usually the operator; take its identity from the legal notice, word for word [GDPR art. 13(1)(a)]
- [ ] The data protection officer's contact is given only if one is designated; never conclude that none is required from the size of the business: say that nothing identified so far triggers the duty and that it is reassessed with the real scale of the processing [GDPR art. 37(1)]
- [ ] A business-to-business software service is qualified processing by processing: it is controller for what it decides itself (its customers' accounts, billing, security, its own statistics) and processor only for what it does on its clients' instructions with the data they entrust to it; never "all customer data = processor" in one block [GDPR art. 28(3)]
- [ ] The policy covers the controller's own processing; the processing done as a processor is governed by the data processing agreement ([data-processing-agreement.md](data-processing-agreement.md)) and the client's own policy [best practice]

## 2. Each processing activity

For each one: data, purpose, lawful basis, whether providing the data is required, retention.

- [ ] One block per purpose; one lawful basis per purpose, chosen by the owner among the six of Article 6; a suggestion of the usual basis is marked as a suggestion to confirm [GDPR art. 6(1)]
- [ ] "Legitimate interests" for everything is refused: each such purpose states the interest pursued, and the owner weighs it against the persons' interests [GDPR art. 13(1)(d)]
- [ ] The basis of an analytics tool depends on its configuration and on the tracker rules; it is not deduced from the tool's category ([../privacy/trackers.md](../privacy/trackers.md) section 3.3) [CNIL guidelines]
- [ ] A marketing newsletter is not sent on a basis that the owner has not confirmed; when consent is the basis, withdrawal is as easy as subscribing [GDPR art. 7(3)]
- [ ] Retention: the period or the criterion that sets it, as given by the owner; when it is unknown, a visible placeholder ("[durée à confirmer par le responsable du traitement]"), or the owner's criterion with its unknown part left blank ("durée du compte + [à définir]") [GDPR art. 13(2)(a)]
- [ ] A setting shown in a tool's console (an analytics retention window, a log rotation) is described as the configured value confirmed by the owner, not as a legal period [best practice]
- [ ] Required and optional fields are stated, with what happens if a required one is not given [GDPR art. 13(2)(e)]
- [ ] A short or trivial processing (a contact form only) gets a short policy; do not invent processing to make the document look complete [best practice]

## 3. Recipients, vendors and transfers

- [ ] Every vendor that receives personal data is listed, including the "invisible" ones (analytics, error monitoring, chat, email delivery, AI APIs) found in the code or declared by the owner [GDPR art. 13(1)(e)]
- [ ] For each vendor, the product name is confirmed; its legal entity, address, role, the data it receives and its location are written only when the owner confirmed them, otherwise placeholders [best practice]
- [ ] A vendor brand is not one product: the activation of one module (authentication) does not prove the activation of others (analytics, crash reporting); ask which modules are active, even when the user names them [best practice]
- [ ] Data a support or chat tool receives are written at the level of detail confirmed ("content of your exchanges with support and the information needed for the tool to work"), not as an invented list of technical fields [best practice]
- [ ] Payment: "payment is handled by [provider] under the terms of the payment flow used" unless the owner confirmed the integration; never "card data never reach our servers" without that confirmation [best practice]
- [ ] Transfers outside the EU: the safeguard is the one the owner confirms (adequacy, Data Privacy Framework certification, standard clauses); the current position on the United States is in [../regulatory-status.md](../regulatory-status.md) section 3.3 [GDPR art. 13(1)(f)]

## 4. Rights, security, special cases

- [ ] Rights are listed with the nuance that some depend on the lawful basis (portability, objection, withdrawal of consent); not one uniform list presented as applying to every processing [GDPR art. 13(2)(b)]
- [ ] The response time is stated as Article 12 sets it, including the possible extension; read it in [../regulatory-status.md](../regulatory-status.md) section 3.1 [GDPR art. 12(3)]
- [ ] The right to complain to a supervisory authority is stated; in France, the CNIL [GDPR art. 13(2)(d)]
- [ ] Security is described in general terms confirmed by the owner, never detailed in an exploitable way, never invented [GDPR art. 32]
- [ ] Minors: if the service may be used by children and consent is a basis, the age rule of the target country applies (France: [../regulatory-status.md](../regulatory-status.md) section 3.1); minors are a stop-and-refer case of [../scoping/out-of-scope.md](../scoping/out-of-scope.md) [GDPR art. 8]
- [ ] Health or other special categories: never written because of the product's theme, never denied either; ask what is collected (sleep, mood, symptoms, heart rate); when confirmed, stop and refer, and flag the likely impact assessment [GDPR art. 9(1)]
- [ ] Location data, profiling, automated decisions: describe them only as confirmed, and flag them for the owner's adviser [GDPR art. 22(1)]
- [ ] When several of these risks combine (special data, minors, large scale), say that an impact assessment is probably due, as a separate point from the policy, even if the user did not ask [GDPR art. 35(3)]
- [ ] The policy is based on the GDPR and the national law; a policy based only on an old national law is outdated [GDPR art. 13(1)]

## 5. Review checklist

- [ ] Each processing found in the code is in the policy, and nothing is in the policy that the code and the owner do not confirm [GDPR art. 13(1)]
- [ ] No invented retention period, vendor entity, technical measure or data protection officer [best practice]
- [ ] The trackers part matches the cookie policy and the banner ([cookie-policy.md](cookie-policy.md)) [best practice]
- [ ] The controller identity matches the legal notice [best practice]
