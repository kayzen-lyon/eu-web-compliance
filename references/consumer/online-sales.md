# Online sales to consumers

The ordering process of a distance contract between a business and a consumer: what the consumer must be told and when, the summary before the order, the wording of the order button, the confirmation, the terms of sale and, for France, mediation. The withdrawal function has its own file: [withdrawal-function.md](withdrawal-function.md). Prices: [prices.md](prices.md).

## How to use this file

1. This file applies when the site lets consumers conclude a contract and pay online (`distance-selling-to-consumers` in [../scoping/obligations.json](../scoping/obligations.json)). A site that only takes quote requests or bookings without payment: check section 4 with the owner, the button rule still applies whenever the click creates an obligation to pay.
2. Follow the order of the sections: they follow the order of the checkout.
3. The wording and placement rules (sections 3 to 5) are what the agent writes in code. The content of the information (characteristics, delivery times, guarantees, terms of sale) comes from the owner: the agent leaves visible placeholders and lists them as "to be completed by the owner".
4. Dates of application are in [../regulatory-status.md](../regulatory-status.md) section 5.2. A rule followed by relies on a fact read on the primary source on 2026-11-14 and not yet in that file (see [README.md](README.md), point 5).
5. Reference implementation of the final step: [../../templates/consumer/order-button.html](../../templates/consumer/order-button.html).

Why the stakes are high: if the order button is not worded as the law requires, the consumer is not bound by the contract or order [CRD art. 8(2)]. A wrong label is not a cosmetic defect; it can make every sale of the site unenforceable.

## 1. Before the ordering process starts

- [ ] The site states clearly and legibly, at the latest at the beginning of the ordering process, whether any delivery restrictions apply (countries, regions, types of address) and which means of payment are accepted [CRD art. 8(3)]
- [ ] In France, the same information is given at the same moment [C. conso L. 221-14]

"At the latest at the beginning" means before the person starts filling the basket form or the first checkout step, not on the payment step. A short block on the basket page and in the footer, with text names of the payment methods (not only logos), meets it. Logos alone carry no text for a screen reader; if logos are used, each has a text alternative naming the method [WCAG 1.1.1].

## 2. Pre-contractual information

Before the consumer is bound, the trader gives the information of Article 6(1) of Directive 2011/83/EU in a clear and comprehensible manner, in a way appropriate to the medium [CRD art. 8(1)]. In France the list is Article L. 221-5 of the code de la consommation. The agent builds the places where each item lives; the owner provides the content.

| Item (Article 6(1)) | Where it usually lives on a website |
|---------------------|-------------------------------------|
| (a) main characteristics of the goods or services | Product page |
| (b) identity of the trader | Footer, identification page ([operator-identification.md](operator-identification.md)) |
| (c) geographic address, telephone number, email address; other online means of communication that keep a dated written record, if offered | Identification page, contact page |
| (d) address for complaints, if different | Contact page or terms of sale |
| (e) total price including taxes, delivery and other costs, or how they are calculated; for subscriptions, total cost per billing period | Product page, basket, summary |
| (ea) that the price was personalised by automated decision-making, where it is | Next to the price |
| (g) arrangements for payment, delivery and performance, delivery date, complaint handling policy | Product page, basket, terms of sale |
| (h) conditions, time limit and procedure of the right of withdrawal, the model withdrawal form, and the existence and placement of the withdrawal function | Terms of sale, withdrawal page, order confirmation |
| (i) and (j) return costs borne by the consumer; costs if withdrawing after asking for early performance | Terms of sale, product page |
| (k) when there is no right of withdrawal, that fact, or the circumstances in which it is lost | Product page and summary |
| (l) reminder of the legal guarantee of conformity | Terms of sale |
| (m) after-sales service and commercial guarantees, where applicable | Product page, terms of sale |
| (o) and (p) duration of the contract, conditions for terminating it, minimum duration | Product page and summary (subscriptions) |
| (f), (n), (q), (r), (s) cost of the communication means, codes of conduct, deposits, functionality and compatibility of digital content and services | Where relevant |

The letters follow Article 6(1) as amended by Directives (EU) 2019/2161 and 2023/2673; points (c), (ea), (h), (l), (r) and (s) were changed or added by those directives.

- [ ] Each item of Article 6(1) that applies to the offer is given before the order, in plain language, in the language of the site [CRD art. 6(1)]
- [ ] Information that depends on the item (total price, delivery cost, duration, absence of withdrawal right) is shown in the flow, not only in the terms of sale [best practice]
- [ ] When the site is an online marketplace, it also says whether each seller is a trader or not, that EU consumer rights do not apply to contracts with a non-trader, how responsibilities are shared, and where the main ranking parameters are explained [CRD art. 6a]
- [ ] Before the order is placed, the steps to conclude the contract, whether the contract is archived and accessible, the means to identify and correct input errors, and the languages offered are stated [ECD art. 10(1)]
- [ ] The person can see and correct what they entered before placing the order (an editable basket and a summary with "Change" links) [ECD art. 11(2)]

## 3. The summary directly before the order

- [ ] Directly before the order, on the same screen as the order button and in a clear and prominent manner, the site shows the main characteristics, the total price with all costs, and, for contracts with a duration, the duration, the conditions of termination and the minimum duration [CRD art. 8(2)]
- [ ] The summary is shown above the button in reading order, so that a keyboard or screen reader user meets it before the button [WCAG 1.3.2]
- [ ] Every extra payment (insurance, gift wrap, express delivery, donation) has been chosen by an explicit action of the consumer; no option that costs money is pre-selected [CRD art. 22]
- [ ] Each group in the summary has a "Change" link whose accessible name says what it changes (illustration: "Change the delivery address") [WCAG 2.4.4; RGAA 6.1]
- [ ] The person can review and correct all entries before a commitment with financial effect [WCAG 3.3.4; RGAA 11.12]

"Directly before" is why the summary and the button sit together. A summary two steps earlier, or behind a disclosure widget that starts closed, does not meet it.

A pre-ticked paid option is reimbursable to the consumer when consent was inferred from a default [CRD art. 22]: the cost falls on the trader, and the practice is also listed among deceptive designs ([deceptive-design.md](deceptive-design.md)).

## 4. The order button

- [ ] The button that places the order is labelled only with "order with obligation to pay" or a corresponding unambiguous formulation that says that placing the order entails an obligation to pay [CRD art. 8(2)]
- [ ] In French, the label is "commande avec obligation de paiement" or an equally unambiguous wording [C. conso L. 221-14]
- [ ] The label is easily legible: real text in the button, at least the size of the body text, with sufficient contrast, not an icon or an image of text [CRD art. 8(2)]
- [ ] The accessible name of the button is the visible label, word for word; no `aria-label` that says something else ("Next", "Continue") [WCAG 2.5.3; RGAA 6.1]
- [ ] It is a real `<button type="submit">` inside the order `<form>`, reachable and operable with the keyboard [WCAG 2.1.1; RGAA 7.3]
- [ ] Nothing else on the button: no price, no promotional wording, no second action. Put the total next to the button, not inside it [CRD art. 8(2)]
- [ ] Only this button commits the person; earlier steps use labels that say they do not ("Continue to payment") [best practice]

Labels to use:

| Language of the page | Label written in the law |
|----------------------|--------------------------|
| English | Order with obligation to pay |
| French | Commande avec obligation de paiement |
| Other languages | The wording of the national transposition; see `../countries/<code>.md`. Until it is verified there, ask the owner for the wording their lawyer approved |

The law accepts "a corresponding unambiguous formulation", but this skill has no verified list of alternatives. Use the legal wording by default. If the owner wants another label (for example a shorter one in a mobile layout), the agent uses it only once the owner confirms that a professional validated it, and notes that in the report.

Labels to avoid: "Order", "Confirm", "Continue", "Next", "Submit", "Register", "Validate", "Complete", "Commander" alone, "Valider ma commande": none of them says that the click entails an obligation to pay. A free trial that turns into a paid subscription: treat the button that starts it as an order button, and confirm the wording with a professional.

## 5. Confirmation after the order

- [ ] The site acknowledges receipt of the order without undue delay and by electronic means [ECD art. 11(1)]
- [ ] The trader sends the confirmation of the contract on a durable medium (an email with the details in its body or as a PDF attachment, not only a link to an account page) within a reasonable time, at the latest at delivery or before the service begins [CRD art. 8(7)]
- [ ] The confirmation includes all the Article 6(1) information not already given on a durable medium, and, for digital content supplied immediately, the record of the consumer's express consent and acknowledgement that the right of withdrawal is lost [CRD art. 8(7)]
- [ ] The confirmation says where the withdrawal function is and how long it is available (see [withdrawal-function.md](withdrawal-function.md)) [CRD art. 6(1)(h)]
- [ ] The terms of sale given to the consumer can be stored and reproduced (downloadable or included in the email) [ECD art. 10(3)]
- [ ] The confirmation page after payment has a heading that states the result and the order number, and focus moves to it when it replaces the form without a page load [WCAG 4.1.3; RGAA 7.5]

## 6. Terms of sale and when the right of withdrawal is excluded

- [ ] The terms of sale are reachable from every page of the checkout and from the summary, as HTML, and can be downloaded or printed [best practice]
- [ ] Acceptance of the terms of sale, where the owner wants a record of it, is a separate unchecked checkbox, not merged with consent to marketing or to the processing of data for other purposes [GDPR art. 7(2)]
- [ ] When the right of withdrawal does not apply to an item, the product page and the summary say so before the order [CRD art. 6(1)(k)]
- [ ] For services performed or digital content supplied during the withdrawal period, the flow collects the consumer's express request or consent and acknowledgement as a separate, unchecked control, with a label that states the consequence [CRD art. 16]

Whether a given product falls under an exception is a legal judgement: see [withdrawal-function.md](withdrawal-function.md) section 7. The agent does not write "no right of withdrawal" on a product without the owner's written confirmation.

The terms of sale themselves (template F-C7) are not provided by this skill yet. Do not generate them from memory; ask the owner for their text or their lawyer's.

## 7. Dispute resolution

- [ ] No link to the former European online dispute resolution platform is presented as a required mention, and existing ones are removed or reworded: the platform no longer exists ([../regulatory-status.md](../regulatory-status.md) section 5.2) [best practice]
- [ ] France: the contact details of the competent consumer mediator are given visibly and legibly on the site, in the general terms or on order forms [C. conso L. 616-1]
- [ ] France: the mediator's name, website address and postal address come from the owner, who must have joined a mediation scheme; the agent never picks one [C. conso R. 616-1]

## 8. Accessibility of the checkout

The checkout is in scope of the European Accessibility Act for e-commerce services ([../regulatory-status.md](../regulatory-status.md) section 1.3): identification, security and payment functions must be accessible. Build it with [../accessibility/components/multi-step-form.md](../accessibility/components/multi-step-form.md).

- [ ] Payment, identification and security functions (card fields, 3-D Secure frame, login) are perceivable, operable, understandable and robust [EAA]
- [ ] A third-party payment frame has a `title` and is tested with the keyboard; if it fails, the defect is reported, not hidden [WCAG 4.1.2; RGAA 2.1]

## 9. Review checklist

- [ ] Delivery restrictions and means of payment shown before the checkout begins [CRD art. 8(3)]
- [ ] Summary with characteristics, total price and duration on the same screen as the order button [CRD art. 8(2)]
- [ ] Order button worded "order with obligation to pay" or equivalent, in the language of the page [CRD art. 8(2)]
- [ ] No pre-selected paid option [CRD art. 22]
- [ ] Confirmation on a durable medium [CRD art. 8(7)]
- [ ] Withdrawal function present when the right of withdrawal applies ([withdrawal-function.md](withdrawal-function.md)) [CRD 11a]
- [ ] France: mediator details present [C. conso L. 616-1]
