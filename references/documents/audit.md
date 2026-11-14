# Auditing an existing legal document

How to review a legal notice, privacy policy, cookie policy, terms of use, terms of sale or data processing agreement that already exists. An audit is not a rewrite: it classifies what is written, finds what is missing, and links the problems to each other.

## How to use this file

1. Qualify first (section 1), as for drafting ([README.md](README.md) section 3): a clause can be valid in one context and abusive in another.
2. Classify every clause and every required item with the statuses of section 2, then look for contradictions (section 3).
3. Open the reference file of the document type for the rules to check against: [legal-notice.md](legal-notice.md), [privacy-policy.md](privacy-policy.md), [cookie-policy.md](cookie-policy.md), [terms-of-use.md](terms-of-use.md), [terms-of-sale.md](terms-of-sale.md), [data-processing-agreement.md](data-processing-agreement.md).
4. Do not rewrite the whole document unless the user asks. Propose corrected wording only for the clauses classified as risky or missing, and only with facts the owner gave.

## 1. Qualify before judging

- [ ] Establish what the document governs (goods, digital content, digital service, subscription), who the parties are (consumers, businesses), and the countries concerned, before applying any rule [best practice]
- [ ] Do not decide that an exception or a waiver works or fails without reading what the contract and the order flow actually do; a waiver of the right of withdrawal "by ordering" does not meet the conditions of the digital content exception [C. conso L. 221-28]
- [ ] Compare the document with the site: the trackers found at run time, the vendors in the code, the buttons in the checkout, the existence of a withdrawal function; a document that describes a site that does not exist is a finding [best practice]

## 2. Statuses

| Status | Meaning |
|--------|---------|
| Present and consistent | The item or clause exists and matches the applicable rules and the facts |
| Incomplete or to verify | Present, but partial, vague, or based on a fact to confirm (for example a price without "taxes included") |
| Missing or risky | A required item is absent, or a clause is probably contrary to a mandatory rule |
| Not applicable | The rule does not concern this case; say why |

- [ ] Every clause read gets a status, not only the absences [best practice]
- [ ] "Missing or risky" is reserved for a legal requirement or a clause contrary to mandatory law, with its source tag; a best practice that is not followed is "incomplete or to verify" and is labelled as a recommendation [best practice]
- [ ] The audit is a verdict per item, never a verdict on the whole document; it never says the document "is compliant" [best practice]

## 3. Contradictions to look for

- [ ] "No refund whatever the reason" against the right of withdrawal and the legal guarantee of conformity: one finding that links both rules [CRD art. 9(1)]
- [ ] "The customer waives the right of withdrawal by subscribing" without express consent, acknowledgement and confirmation [C. conso L. 221-28]
- [ ] "We may change these terms at any time without notice" for consumers; with user content hosted, also against the duty to inform of significant changes [DSA art. 14(2)]
- [ ] An exclusive court chosen by the seller in terms accepted by consumers [best practice]
- [ ] Termination only by registered letter for a subscription concluded online (France) [C. conso L. 215-1-1]
- [ ] Tacit renewal without the information on non-renewal (France) [C. conso L. 215-1]
- [ ] A clause excluding all liability, or another clause creating a significant imbalance to the consumer's detriment [C. conso L. 212-1]
- [ ] A link to the former EU online dispute resolution platform presented as a required mention [ODR repeal]
- [ ] One lawful basis for every processing, one retention period for every data, vendors missing while the code sends data to them [GDPR art. 13(1)]
- [ ] A cookie policy that describes a banner different from the one on the site [CNIL guidelines]
- [ ] Identity facts that differ between documents (company name, host, address) [best practice]
- [ ] Dated references (thresholds, recommended durations, platforms) are checked against [../regulatory-status.md](../regulatory-status.md) and reported with their verification date [best practice]

## 4. Output

A table per document, then the links between findings, then the points to confirm with the owner, then the disclaimer of [README.md](README.md) section 5.

| Clause or item | Status | Why | Source |
|----------------|--------|-----|--------|
| Price | Incomplete or to verify | Does not say whether taxes are included | [CRD art. 6(1)(e)] |
| Right of withdrawal | Missing or risky | Absent, and contradicted by the "no refund" clause | [CRD art. 6(1)(h)] |
| "No refund" | Missing or risky | Contrary to the right of withdrawal and to the legal guarantee | [CRD art. 9(1)] |
| Mediator (France) | Missing or risky | Absent while the site sells to consumers | [C. conso L. 616-1] |
| Intellectual property | Present and consistent | Not a legal requirement; no issue found | [best practice] |

- [ ] If the audit shows that another document is probably needed (a privacy policy next to terms of sale that collect data), say so without drafting it unasked [best practice]
- [ ] Name first the finding with the most serious effect (a clause already depriving consumers of a mandatory right, special data processed without a basis), not in the middle of a list [best practice]
