# Prices and price reductions

How to show prices to consumers, and how to announce a price reduction with the prior price. Reference markup: [../../templates/consumer/price-reduction.html](../../templates/consumer/price-reduction.html).

## How to use this file

1. Section 1 applies to every site that shows prices to consumers. Section 2 applies whenever the site announces a reduction ("-20 %", a struck-through price, "was / now", "sale").
2. The code can show the prior price correctly only if the data exists: the agent checks that the price history needed by section 2 is stored, or tells the owner it is missing.
3. Dates of application are in [../regulatory-status.md](../regulatory-status.md) section 5.2. A rule followed by relies on a fact read on the primary source on 2026-11-14 and not yet in that file (see [README.md](README.md), point 5).
4. France: Article L. 112-1-1 of the code de la consommation transposes the price-reduction rule. Other French rules on price display (unit price, arrêtés on price marking) have not been read by this skill and are not covered.

## 1. Showing prices

- [ ] Prices are clear and unambiguous and say whether taxes and delivery costs are included [ECD art. 5(2)]
- [ ] The price shown to consumers before the order is the total price including taxes; delivery and other costs are shown, or how they are calculated, or at least the fact that they may be payable [CRD art. 6(1)(e)]
- [ ] For a subscription or a contract of indeterminate duration, the total cost per billing period is shown, and the total monthly cost when charged at a fixed rate [CRD art. 6(1)(e)]
- [ ] Where the price was personalised by automated decision-making, the consumer is told [CRD art. 6(1)(ea)]
- [ ] A product called "free" costs nothing beyond the unavoidable cost of responding and of delivery [UCPD Annex I no. 20]
- [ ] Costs are not revealed only at the last step: delivery costs, service fees and compulsory extras appear on the product page or in the basket as soon as they can be calculated (see [deceptive-design.md](deceptive-design.md), hidden costs) [UCPD art. 7]
- [ ] The price is text in the HTML, with the currency, not only an image or a CSS pseudo-element [WCAG 1.3.1; RGAA 10.2]
- [ ] The currency is written so that a screen reader reads it correctly: a symbol next to the number (`19,90 €`, `€19.90`) is fine; a separately styled superscript cents part keeps the decimal separator in the text [best practice]

## 2. Announcing a price reduction

- [ ] Any announcement of a price reduction indicates the prior price applied by the trader before the reduction [PID art. 6a]
- [ ] The prior price is the lowest price applied by the trader during the reference period before the reduction; the minimum length of that period is in [../regulatory-status.md](../regulatory-status.md) section 5.2 [PID art. 6a]
- [ ] France: the same rule, in Article L. 112-1-1 [C. conso L. 112-1-1]
- [ ] The percentage or amount of reduction is calculated from that prior price, not from a recommended retail price or from a higher price applied earlier [PID art. 6a]
- [ ] The code computes the prior price from a stored price history (date and price for each change), not from a field typed by hand at sale time [best practice]
- [ ] When the history covers less than the reference period, the agent does not display a reduction based on a guess; it asks the owner, and records the question in the report [best practice]

Member States may set different rules for perishable goods, for products on the market for less than the reference period, and for reductions that increase progressively [PID art. 6a]. Apply them only when the country file says the State uses them; until then use the general rule.

Comparisons that are not a reduction of the trader's own price (with a competitor's price, with a recommended price, "2 for 1" offers, loyalty prices) are not covered by Article 6a; they are judged under the unfair commercial practices rules and must not mislead about the price or the existence of a price advantage [UCPD art. 6]. Whether Article 6a covers services as well as goods is not settled by this skill (`OPEN-QUESTIONS.md`, item 26): apply the rule to every reduction announced on the site, which is the cautious reading.

### 2.1 Markup

A struck-through price is a visual convention. A screen reader often does not announce `<s>` or `<del>`, so "€39.90 €29.90" is heard as two prices with no relation. The text must say which is which.

- [ ] The prior price and the current price are each introduced by words ("Price before reduction", "Current price"), visible or visually hidden, so that the meaning does not depend on the strike-through or the colour [WCAG 1.3.1, 1.4.1; RGAA 3.1, 10.2]
- [ ] The reduction percentage, if shown, is text and is not the only place where the current price appears [WCAG 1.3.1]
- [ ] Colour contrast of the prior price (often grey) meets the minimum for text [WCAG 1.4.3; RGAA 3.2]
- [ ] Where the reference period is short or a national exception is used, the explanation is near the price or linked from it [best practice]

## 3. Review checklist

- [ ] Prices include taxes, and delivery costs are visible before the last step [CRD art. 6(1)(e)]
- [ ] Every announced reduction shows the prior price defined in Article 6a [PID art. 6a]
- [ ] The prior price is computed from stored history [best practice]
- [ ] Prior and current prices are labelled in text [WCAG 1.3.1]
