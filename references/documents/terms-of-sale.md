# Terms of sale: drafting

The terms of sale (conditions générales de vente) carry the contractual and pre-contractual information of sales concluded on the site. This file says what they must hold, which clauses depend on a condition that must be written into the clause, and what the agent never decides. The checkout itself is in [../consumer/online-sales.md](../consumer/online-sales.md), the withdrawal function in [../consumer/withdrawal-function.md](../consumer/withdrawal-function.md). Template: [terms-of-sale-fr.md](../../templates/documents/terms-of-sale-fr.md).

## How to use this file

1. Qualify the sale (section 1) before writing any clause. The withdrawal and guarantee rules differ for goods, digital content, digital services and subscriptions, and for consumers and businesses.
2. Fill the template section by section; each clause below says where its content comes from.
3. Periods, labels, dates and fines are in [../regulatory-status.md](../regulatory-status.md) section 5.2.
4. The terms only describe the site. The order button, the summary and the withdrawal function are built in the checkout; terms that announce a function the site does not have are a false statement.

## 1. Qualify the sale

- [ ] Write down, with the owner, what is sold, item by item: goods, digital content supplied on a tangible medium, digital content without a tangible medium (download, file), digital service (online tool, software as a service), subscription, or a combination; one offer can mix several (an online tool plus downloadable templates) [best practice]
- [ ] Write down whether the buyers are consumers, businesses or both; consumer rules are written for consumers and are not removed by a statement that the service is "for professionals" when consumers can buy [best practice]
- [ ] Write down the country of establishment of the seller and the target countries; for a seller established outside France selling to French consumers, the governing-law, jurisdiction and mediation clauses are left to a professional [best practice]
- [ ] An online marketplace states for each offer whether the seller is a trader, that EU consumer rights do not apply to contracts with a non-trader, how obligations are shared, and where the ranking parameters are explained [CRD art. 6a]

## 2. Content of the terms (consumer sales)

The terms are one of the places where the pre-contractual information lives ([../consumer/online-sales.md](../consumer/online-sales.md) section 2); the item-dependent information is also shown in the flow.

- [ ] Identity, geographic address, telephone and email of the trader, as in the legal notice [CRD art. 6(1)(c)]
- [ ] Total price including taxes, delivery and other costs, or how they are calculated; for subscriptions, the total cost per billing period [CRD art. 6(1)(e)]
- [ ] When the price was personalised by automated decision-making, that fact [CRD art. 6(1)(ea)]
- [ ] Payment, delivery and performance arrangements, delivery date, complaint handling; values from the owner and from the billing tool, never invented (trial length, notice, refund period) [CRD art. 6(1)(g)]
- [ ] The steps to conclude the contract, whether it is archived and accessible, how to correct input errors, the languages offered [ECD art. 10(1)]
- [ ] The terms can be stored and reproduced by the customer (HTML page, download, copy in the confirmation email) [ECD art. 10(3) (to confirm)]
- [ ] Duration of the contract, conditions for terminating it, minimum duration, for contracts with a duration [CRD art. 6(1)(o)]
- [ ] A reminder of the existence of the legal guarantee of conformity [CRD art. 6(1)(l)]
- [ ] France: the contact details of the competent consumer mediator, chosen by the owner [C. conso L. 616-1]
- [ ] No link to the former EU online dispute resolution platform, and no clause presenting it as available [ODR repeal]
- [ ] Where the service is in scope of the European Accessibility Act, the information on how it meets the accessibility requirements, in these terms or an equivalent document [EAA]

## 3. Right of withdrawal

- [ ] The clause states the conditions, time limit and procedure of the right of withdrawal, and the existence and placement of the withdrawal function [CRD art. 6(1)(h)]
- [ ] The withdrawal period and its rules are taken from [../regulatory-status.md](../regulatory-status.md) section 5.2, not from memory [CRD art. 9(1)]
- [ ] France: the information follows the official model of the annex to Article R. 221-3, reproduced from Légifrance in its version in force and completed only where its notes say so; the agent does not reword it [C. conso R. 221-3]
- [ ] The clause says where the online withdrawal function is, with its legal label in the language of the site ("renoncer au contrat ici" in French), and that the consumer may also withdraw by any unambiguous statement; the function itself is built from [../../templates/consumer/withdrawal-function.html](../../templates/consumer/withdrawal-function.html) [CRD 11a]
- [ ] No clause says "no refund whatever the reason", "the customer waives the right of withdrawal by ordering" or any equivalent; such a clause contradicts the right of withdrawal and the legal guarantee at once [CRD art. 9(1)]

### 3.1 Exceptions: the condition is written into the clause

- [ ] The agent never decides that an exception applies; the owner confirms in writing which products are concerned, and the profile records it (`market.withdrawal_right_applies`) [best practice]
- [ ] Each exception is the one that matches what is sold; for example the exception for leisure services at a specific date is not the exception for digital content, and the conditions of one are not borrowed for another [C. conso L. 221-28]
- [ ] Digital content without a tangible medium: the right is lost only when performance began with the consumer's prior express consent, the consumer acknowledged losing the right, and the trader confirmed that agreement; until the owner confirms that the order flow collects and confirms all three, the clause is written as conditional [C. conso L. 221-28]
- [ ] Services: the exception applies only to services fully performed before the end of the period, with the prior express agreement and acknowledgement; a running subscription is not "fully performed" by being started [C. conso L. 221-28]
- [ ] The conditional wording sits inside the published clause, for example: `[À CONFIRMER : applicable uniquement si votre parcours de commande recueille, par une case distincte non cochée par défaut, l'accord exprès du client pour l'exécution immédiate et sa reconnaissance de la perte du droit de rétractation, et si l'e-mail de confirmation reprend cet accord]` [best practice]
- [ ] When an exception applies, the product page and the order summary say so before the order, not only the terms [CRD art. 6(1)(k) (to confirm)]
- [ ] Express consent to early performance is collected by a separate unchecked control whose label states the consequence ([../consumer/online-sales.md](../consumer/online-sales.md) section 6) [CRD art. 16]

## 4. Order, price and payment clauses

- [ ] The clause describing the order says that the order is placed with the button labelled with the legal wording of [../regulatory-status.md](../regulatory-status.md) section 5.2, and the site really uses that label ([../../templates/consumer/order-button.html](../../templates/consumer/order-button.html)) [CRD art. 8(2)]
- [ ] The accepted means of payment and any delivery restriction are stated, and also shown at the start of the ordering process [CRD art. 8(3)]
- [ ] No paid option is presented as accepted by default [CRD art. 22]
- [ ] The confirmation on a durable medium is described as the site really sends it [CRD art. 8(7)]

## 5. Subscriptions, renewal, termination

- [ ] A free trial that turns into a paid subscription without a new action: the terms state when payment starts, the amount, and how to stop before; the button that starts the trial is treated as an order button ([../consumer/online-sales.md](../consumer/online-sales.md) section 4) [CRD art. 8(2)]
- [ ] France, contract concluded electronically: the terms describe the free online termination function the site offers; a clause that allows termination only by registered letter or telephone is reported to the owner as probably non-compliant, not drafted [C. conso L. 215-1-1]
- [ ] France, fixed-term service contracts with tacit renewal: the terms describe the written information on non-renewal the trader sends before the end of each period, and the consumer's right to terminate if it is not sent [C. conso L. 215-1]
- [ ] Changes of price or terms during a subscription are distinguished (change required by law, change of service, price change, substantial change) and each procedure is the owner's choice, checked by a lawyer; no "change at any time without notice" [best practice]

## 6. Guarantees and liability

- [ ] The legal guarantees cannot be removed by the terms; the clause reminds the consumer of the legal guarantee of conformity, and its exact regime (goods, or digital content and services) is written by the owner's lawyer, not from memory [CRD art. 6(1)(l)]
- [ ] Goods and digital content or services do not share one guarantee paragraph by default; qualify first (section 1) [best practice]
- [ ] A commercial guarantee or after-sales service is described only as the owner offers it [CRD art. 6(1)(m)]
- [ ] No clause excludes all liability; a clause creating a significant imbalance to the consumer's detriment is abusive [C. conso L. 212-1]
- [ ] No clause gives exclusive jurisdiction to a court chosen by the seller against consumers [best practice]

## 7. Business-to-business sales

- [ ] Terms for business customers only are a different document; the consumer clauses above are not removed from terms that consumers can also accept [best practice]
- [ ] French rules specific to sales between businesses (communication of terms on request, payment terms, penalties) have not been verified by this skill; leave them to the owner's lawyer [best practice]

## 8. Review checklist

- [ ] What is sold and to whom is qualified, item by item [best practice]
- [ ] Withdrawal: period from regulatory-status, official French model where applicable, function described with its legal label [CRD art. 6(1)(h)]
- [ ] Every exception carries its condition in the clause, and the owner confirmed it [C. conso L. 221-28]
- [ ] No "no refund", no waiver of withdrawal by ordering, no exclusion of the legal guarantee [CRD art. 9(1)]
- [ ] Mediator present (France), no ODR link [C. conso L. 616-1]
- [ ] Prices, trial, notice and refund values match the billing tool, as confirmed by the owner [best practice]
