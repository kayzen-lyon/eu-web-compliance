# Online withdrawal function

The "withdraw from contract here" function that a trader must offer when a distance contract is concluded through an online interface: scope, labels, placement, the statement, the confirmation step and the acknowledgement of receipt. Reference implementation: [../../templates/consumer/withdrawal-function.html](../../templates/consumer/withdrawal-function.html), documented in [../../templates/consumer/README.md](../../templates/consumer/README.md).

## How to use this file

1. Check that the function is required: section 1. It is required for contracts concluded on the site when the consumer has a right of withdrawal; whether the right exists for a given product is the owner's call (section 7).
2. Build it from the reference component; the rules below say what must not be changed when adapting it.
3. Dates of application and the French administrative fine are in [../regulatory-status.md](../regulatory-status.md) section 5.2.
4. Do not tell the owner what happens to the withdrawal period if the function is missing. No text read by this skill says it expressly (`OPEN-QUESTIONS.md`, item 9). Say that the function is mandatory and that the consequences of its absence are to be assessed by a professional.

## 1. When it is required

- [ ] For distance contracts concluded by means of an online interface, the trader ensures that the consumer can also withdraw by using a withdrawal function [CRD 11a]
- [ ] France: for distance contracts concluded through an online interface, the trader offers the function, free of charge for the consumer [C. conso L. 221-21]

"Also" matters: the function is an extra channel. The consumer can still withdraw by the model form, by email or by any unambiguous statement; the site must not tell them the function is the only way.

In scope: every contract concluded on the site (or in the app) where the consumer has a right of withdrawal, including subscriptions and digital services. Out of scope: contracts where the right of withdrawal does not exist (section 7), and contracts concluded before the date of application (see [../regulatory-status.md](../regulatory-status.md) section 5.2: in France, contracts already running on that date stay under the previous rules).

## 2. Label and placement of the entry point

- [ ] The function is labelled "withdraw from contract here" or an unambiguous corresponding formulation, in an easily legible way [CRD 11a]
- [ ] French label: "renoncer au contrat ici", or an equally unambiguous wording [C. conso L. 221-21]
- [ ] It is continuously available throughout the withdrawal period: not only in the order confirmation email, not only on one day, not dependent on stock or on support opening hours [CRD 11a]
- [ ] It is prominently displayed on the online interface and easily accessible: a link or button in the footer of every page, and on each order in the customer account, with the label above [CRD 11a]
- [ ] It is reachable without logging in, because the consumer may have no account, have lost access, or have ordered as a guest; the statement form identifies the contract instead (section 3) [best practice]
- [ ] It is a real link (`<a href>`) to a dedicated page, or a `<button>` that opens the form on the same page; its accessible name is the visible label [WCAG 2.5.3; RGAA 6.1]
- [ ] The entry point is visible without opening a menu, scrolling a carousel or hovering [best practice]
- [ ] The pre-contractual information and the order confirmation say that the function exists and where it is [CRD art. 6(1)(h)]

Why the footer plus the account: "prominently displayed" and "easily accessible" are not defined in pixels, and the reviewer will look for it the way a consumer would. A footer link on every page is the one place a consumer looks on any page; the link on each order saves typing the order number. Hiding the function in "Help > Returns > Other" is the pattern the law was written against.

## 3. The online withdrawal statement

- [ ] The function lets the consumer send an online withdrawal statement informing the trader of the decision to withdraw [CRD 11a]
- [ ] The statement lets the consumer easily provide or confirm their name [CRD 11a]
- [ ] ... details identifying the contract (order number, and optionally the date or the items concerned) [CRD 11a]
- [ ] ... details of the electronic means (usually an email address) by which the confirmation of the withdrawal will be sent [CRD 11a]
- [ ] When the consumer is logged in or arrives from an order link, these fields are pre-filled and editable: "provide or confirm" means the person may only have to check them [CRD 11a]
- [ ] Nothing else is required to send the statement: no reason for withdrawing, no return label choice, no satisfaction survey, no account creation, no captcha that has no accessible alternative. Optional fields are marked optional and can be left empty [best practice]
- [ ] If the owner wants partial withdrawal (some items of an order), the item choice is optional and defaults to the whole contract [best practice]
- [ ] Every field has a visible label, the right `autocomplete` token (`name`, `email`), and errors are described in text next to the field and in a summary [WCAG 3.3.1, 3.3.2, 1.3.5; RGAA 11.1, 11.10, 11.13]

Why no "reason" field: the consumer withdraws without giving any reason (Directive 2011/83/EU, Article 9(1)). A mandatory reason field is an obstacle the law does not allow; an optional one, placed after the confirmation or clearly marked optional, is acceptable.

Data protection: the statement collects personal data (name, email, order number). Keep only what is needed to process the withdrawal and prove it; see [../privacy/forms-and-minimisation.md](../privacy/forms-and-minimisation.md).

## 4. The confirmation step

- [ ] Once the statement is completed, the consumer submits it by means of a confirmation function [CRD 11a]
- [ ] The confirmation function is labelled in an easily legible manner and only with "confirm withdrawal" or an unambiguous corresponding formulation [CRD 11a]
- [ ] French label: "confirmer la rétractation", or an equally unambiguous wording [C. conso L. 221-21]
- [ ] It is a real `<button type="submit">`, its accessible name is exactly the visible label, and nothing else is written on it [WCAG 2.5.3; RGAA 6.1]
- [ ] Before the button, the screen shows what will be sent (name, contract, email address), so that the person can check it [WCAG 3.3.4; RGAA 11.12]
- [ ] No message that tries to change the person's mind sits between the statement and the confirmation (offer of a voucher, "Are you sure? You will lose...", a countdown) [UCPD art. 9(d)]

The two-step design (statement, then a button labelled "confirm withdrawal") follows the text: it protects against an accidental click and makes the consumer's intention unambiguous. It is not an invitation to add more steps.

## 5. Acknowledgement of receipt

- [ ] Once the confirmation function is activated, the trader sends an acknowledgement of receipt of the withdrawal on a durable medium, without undue delay [CRD 11a]
- [ ] France: the acknowledgement is sent within a reasonable time [C. conso L. 221-21]
- [ ] The acknowledgement contains the content of the statement and the date and time of its submission [CRD 11a]
- [ ] The durable medium is in practice an email with the content in its body (or a PDF attachment) sent to the address given in the statement; a message shown only in the account is not enough [CRD 11a]
- [ ] The date and time of submission are recorded by the server when the confirmation is received, with the time zone, not taken from the browser clock [best practice]
- [ ] On screen, after confirmation, focus moves to a heading that states the result ("Your withdrawal has been sent"), followed by the date and time and the content sent, and the message says that a copy is sent by email [WCAG 4.1.3; RGAA 7.5]
- [ ] If sending fails, the person is told in text, the data typed is kept, and they can try again; the failure is not presented as a success [WCAG 3.3.1; RGAA 11.10]

Why the timestamp is recorded on the server: the consumer is considered to have withdrawn in time if the statement was submitted before the withdrawal period expired [CRD 11a]. The submission time is the evidence; both parties may need it.

The French and EU wordings differ: "without undue delay" in the directive, "within a reasonable time" in French law (`OPEN-QUESTIONS.md`, section 2, point 3). Sending the acknowledgement automatically and immediately satisfies both.

## 6. Behaviour expected from the reference component

| Step | What happens | Keyboard and screen reader |
|------|--------------|----------------------------|
| Entry point | Link or button "Withdraw from contract here" / "Renoncer au contrat ici" | Reached by Tab like any link; Enter opens the statement |
| Statement | Form with name, contract identification, email; pre-filled when known | Focus moves to the form heading; labels and hints are announced |
| Validation error | Summary of errors receives focus; each error links to its field | The summary heading is read once; fields carry `aria-invalid` |
| Confirm | The filled fields, which are what will be sent, sit above the "Confirm withdrawal" / "Confirmer la rétractation" button, the only submit button | Fields are read before the button in DOM order; Enter in a field submits |
| Acknowledgement | Heading "Withdrawal sent" with the date and time and the content | Focus moves to the heading, which is announced; a status region repeats the result |

The component has no backend: the site provides a callback that sends the statement to its server, which records the time and sends the acknowledgement email. See [../../templates/consumer/README.md](../../templates/consumer/README.md).

## 7. When the right of withdrawal does not apply

The function is only required where a right of withdrawal exists. Directive 2011/83/EU lists the exceptions in Article 16; France lists them in Article L. 221-28 of the code de la consommation (13 cases, read on Légifrance through a summarising tool). They cover, among others (paraphrase, not the legal text):

- services fully performed, when performance began with the consumer's prior express consent and acknowledgement;
- goods or services whose price depends on financial market fluctuations;
- goods made to the consumer's specifications or clearly personalised;
- goods liable to deteriorate or expire rapidly;
- sealed goods unsealed after delivery that cannot be returned for health or hygiene reasons;
- goods inseparably mixed with other items after delivery;
- sealed audio or video recordings or software unsealed after delivery;
- newspapers and magazines, except subscriptions;
- contracts concluded at a public auction;
- accommodation (other than residential), transport of goods, car rental, catering or leisure services for a specific date or period;
- digital content not supplied on a tangible medium, once performance has begun with the consumer's prior express consent and acknowledgement, and the trader's confirmation.

- [ ] The agent does not decide that an exception applies. The owner confirms in writing which products are excluded, and the profile records it (`market.withdrawal_right_applies`); otherwise the function is built [best practice]
- [ ] When an exception applies, the consumer is told before the order that there is no right of withdrawal, or the circumstances in which it is lost [CRD art. 6(1)(k)]
- [ ] For digital content or services that start at once, the express consent and the acknowledgement of losing the right are collected before the order by an unchecked control, and recorded in the confirmation [CRD art. 16]
- [ ] A site that sells both excluded and non-excluded items keeps the function for the contracts that carry a right of withdrawal [CRD 11a]

The list above is a reading aid. Whether a product actually falls under an exception (is a customised T-shirt "clearly personalised"? is a ticket for a concert "a leisure service for a specific date"?) is a legal assessment to confirm with a professional.

## 8. Review checklist

- [ ] An entry point labelled "withdraw from contract here" (or the national wording) is visible on every page and on each order, throughout the withdrawal period [CRD 11a]
- [ ] The statement asks only for name, contract identification and the email for the confirmation, with pre-fill when known [CRD 11a]
- [ ] The submit button reads exactly "confirm withdrawal" (or the national wording) [CRD 11a]
- [ ] An acknowledgement with the content and the date and time of submission is sent by email at once [CRD 11a]
- [ ] Focus moves to the on-screen acknowledgement, which is announced [WCAG 4.1.3; RGAA 7.5]
- [ ] The automated test of the flow passes with the keyboard only ([../../templates/consumer/README.md](../../templates/consumer/README.md)) [best practice]
