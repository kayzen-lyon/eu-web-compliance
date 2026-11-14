# Consumer and information law

Entry point of the consumer part of the skill: who runs the site (identification), how a consumer orders and withdraws online, how prices and reductions are shown, which interface designs are forbidden, and what a site that hosts user content must offer under the Digital Services Act. Read only the file that matches the task.

## How to use this folder

1. Check first which obligations apply to the project: `references/scoping/obligations.json` (domain `consumer`) and the project profile (`operator.*`, `market.*`, `content.*` fields). A site that sells nothing to consumers and hosts no user content usually needs only [operator-identification.md](operator-identification.md).
2. Pick the file from the table below. Each file starts with its own instructions and keeps to one subject.
3. Dates of application, periods and amounts are only in [../regulatory-status.md](../regulatory-status.md), section 5. The files link to it instead of repeating them.
4. Every rule ends with its source in square brackets. `ECD`, `CRD`, `CRD 11a`, `PID`, `UCPD` and `DSA` are EU law: the baseline everywhere, applied through each Member State's transposition (except the DSA, a regulation that applies directly). `LCEN` and `C. conso` are French. `[best practice]` is never an obligation.
5. What the skill cannot do here: decide whether the right of withdrawal applies to a given product, whether a site is an "online platform", which national law governs a cross-border sale, or what the general terms of sale say. The agent gathers facts, writes "to be confirmed by a professional", and asks. Everything produced is generated with the help of an AI and is not legal advice.

## Scope

- **EU baseline**: Directive 2000/31/EC (e-commerce), Directive 2011/83/EU (consumer rights) as amended, including the online withdrawal function (Article 11a), Directive 98/6/EC Article 6a (price reductions), Directive 2005/29/EC (unfair commercial practices), Regulation (EU) 2022/2065 (DSA).
- **France**: LCEN Articles 1-1 and 19, code de la consommation (order button, withdrawal function, mediator, price reductions). Everything French is gathered in [../countries/fr.md](../countries/fr.md).
- **Other Member States**: national transpositions differ (wording of buttons, mediation, identification page). See the country file `../countries/<code>.md`; most rubrics are "Not verified" at this stage, and the EU baseline applies until they are.

## Task → file

| Task | Read |
|------|------|
| Legal notice, imprint, "about us" identification, footer contact details | [operator-identification.md](operator-identification.md), then [../../templates/consumer/legal-notice-fr.md](../../templates/consumer/legal-notice-fr.md) or [../../templates/consumer/legal-notice-eu.md](../../templates/consumer/legal-notice-eu.md) |
| Product page, basket, checkout, order button, order confirmation email | [online-sales.md](online-sales.md), then [../../templates/consumer/order-button.html](../../templates/consumer/order-button.html) |
| "Withdraw from contract" button, cancellation of an online purchase | [withdrawal-function.md](withdrawal-function.md), then [../../templates/consumer/README.md](../../templates/consumer/README.md) |
| Price display, sales, "-30 %", strikethrough prices | [prices.md](prices.md), then [../../templates/consumer/price-reduction.html](../../templates/consumer/price-reduction.html) |
| Countdown, stock counter, upsell, newsletter opt-in, cancellation flow, any nudge | [deceptive-design.md](deceptive-design.md) |
| Reviews, comments, forum, marketplace listings, user uploads | [dsa.md](dsa.md) |
| Subscription with automatic renewal | [online-sales.md](online-sales.md) section 2 and [deceptive-design.md](deceptive-design.md) section 3 |
| France: everything French in one place | [../countries/fr.md](../countries/fr.md) |
| Another Member State | `../countries/<code>.md`, for example [../countries/de.md](../countries/de.md) |

## Links with the other parts of the skill

- Checkout forms, the withdrawal form and the legal notice page are page content: they follow [../accessibility/rules.md](../accessibility/rules.md) and [../accessibility/components/multi-step-form.md](../accessibility/components/multi-step-form.md). An inaccessible order button is both an accessibility defect and, for e-commerce services, an obligation of the European Accessibility Act ([../regulatory-status.md](../regulatory-status.md) section 1.3).
- Personal data collected by an order or a withdrawal statement follows [../privacy/forms-and-minimisation.md](../privacy/forms-and-minimisation.md).
- A consent banner must not use the patterns of [deceptive-design.md](deceptive-design.md) either; its own rules are in [../privacy/consent.md](../privacy/consent.md).
