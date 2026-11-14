# European Union baseline

Coverage: partial (EU law read on the Official Journal text; the national transpositions are in the country files)

The rules that are the same in every Member State, domain by domain, with the file of this skill that holds them. Use this page when the project targets a country whose file says "Not verified": the EU baseline applies, and what national law adds remains to be checked locally.

## How to use this file

1. Regulations (GDPR, AI Act, DSA) apply directly and identically everywhere. Directives (European Accessibility Act, ePrivacy, consumer rights, e-commerce, unfair commercial practices, price indication) apply through each national law, which can add requirements or choose options; the country file says which ones, when verified.
2. Dates and versions in force are in [../regulatory-status.md](../regulatory-status.md). Which obligations concern a given project is decided by [../scoping/obligations.json](../scoping/obligations.json).
3. For a project in France, read [fr.md](fr.md) in addition.

## Domains

| Domain | EU text | Kind | Read |
|--------|---------|------|------|
| Accessibility of products and services | Directive (EU) 2019/882 (European Accessibility Act) | Directive | [../accessibility/rules.md](../accessibility/rules.md); status section 1.3 |
| Accessibility of public sector websites | Directive (EU) 2016/2102 | Directive | Status section 1.2 |
| Technical standard | EN 301 549, WCAG 2.2 level AA as the skill's target | Standard | [../accessibility/en-301-549.md](../accessibility/en-301-549.md) |
| Personal data | Regulation (EU) 2016/679 (GDPR) | Regulation | [../privacy/README.md](../privacy/README.md); status section 3.1 |
| Cookies and other trackers | Directive 2002/58/EC, Article 5(3) | Directive | [../privacy/trackers.md](../privacy/trackers.md), [../privacy/consent.md](../privacy/consent.md); status section 3.2 |
| Artificial intelligence | Regulation (EU) 2024/1689 (AI Act) | Regulation | [../ai-act/README.md](../ai-act/README.md); status section 2 |
| Website security | No general EU text for a website as such; the Cyber Resilience Act does not cover a website alone | — | [../security/README.md](../security/README.md); status section 4 |
| Operator identification | Directive 2000/31/EC, Article 5 | Directive | [../consumer/operator-identification.md](../consumer/operator-identification.md) |
| Online sales, order button | Directive 2011/83/EU, Articles 6 and 8 | Directive | [../consumer/online-sales.md](../consumer/online-sales.md) |
| Online withdrawal function | Directive 2011/83/EU, Article 11a | Directive | [../consumer/withdrawal-function.md](../consumer/withdrawal-function.md) |
| Price reductions | Directive 98/6/EC, Article 6a | Directive | [../consumer/prices.md](../consumer/prices.md) |
| Deceptive design | Directive 2005/29/EC; Regulation (EU) 2022/2065, Article 25 for online platforms | Directive; regulation | [../consumer/deceptive-design.md](../consumer/deceptive-design.md) |
| User content, platforms | Regulation (EU) 2022/2065 (DSA) | Regulation | [../consumer/dsa.md](../consumer/dsa.md) |

## Options left to the Member States that change a website

- [ ] Age of digital consent: a default age that a Member State may lower down to a floor (both ages in [../regulatory-status.md](../regulatory-status.md) section 3.1); check the country file [GDPR art. 8]
- [ ] Price reductions: a Member State may set different rules for perishable goods, products recently on the market and progressive reductions [PID art. 6a]
- [ ] Wording of the order button and of the withdrawal function in the national language: set by the transposition; the English wording of the directive is not a translation to reuse [CRD art. 8(2)]
- [ ] Identification page: national laws can require more than Article 5 of Directive 2000/31/EC (example: [de.md](de.md)) [ECD art. 5]
- [ ] Authorities: each Member State designates its own authorities for accessibility, data protection, consumer protection, the DSA and the AI Act; none is named in this file [best practice]

## Coverage of the Member States

| Code | Country | File | Coverage |
|------|---------|------|----------|
| AT | Austria | [at.md](at.md) | not verified |
| BE | Belgium | [be.md](be.md) | not verified |
| BG | Bulgaria | [bg.md](bg.md) | not verified |
| CY | Cyprus | [cy.md](cy.md) | not verified |
| CZ | Czechia | [cz.md](cz.md) | not verified |
| DE | Germany | [de.md](de.md) | partial |
| DK | Denmark | [dk.md](dk.md) | not verified |
| EE | Estonia | [ee.md](ee.md) | not verified |
| ES | Spain | [es.md](es.md) | not verified |
| FI | Finland | [fi.md](fi.md) | not verified |
| FR | France | [fr.md](fr.md) | partial |
| GR | Greece | [gr.md](gr.md) | not verified |
| HR | Croatia | [hr.md](hr.md) | not verified |
| HU | Hungary | [hu.md](hu.md) | not verified |
| IE | Ireland | [ie.md](ie.md) | not verified |
| IT | Italy | [it.md](it.md) | not verified |
| LT | Lithuania | [lt.md](lt.md) | not verified |
| LU | Luxembourg | [lu.md](lu.md) | not verified |
| LV | Latvia | [lv.md](lv.md) | not verified |
| MT | Malta | [mt.md](mt.md) | not verified |
| NL | Netherlands | [nl.md](nl.md) | not verified |
| PL | Poland | [pl.md](pl.md) | not verified |
| PT | Portugal | [pt.md](pt.md) | not verified |
| RO | Romania | [ro.md](ro.md) | not verified |
| SE | Sweden | [se.md](se.md) | not verified |
| SI | Slovenia | [si.md](si.md) | not verified |
| SK | Slovakia | [sk.md](sk.md) | not verified |

Codes are ISO 3166-1 alpha-2, as in [../scoping/obligations.json](../scoping/obligations.json) (Greece is `GR`).
