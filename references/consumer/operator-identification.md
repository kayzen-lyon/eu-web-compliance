# Operator identification

What a website must say about who runs it, where to put it, and what the agent must never make up. Covers the EU baseline (Article 5 of Directive 2000/31/EC) and France (Articles 1-1 and 19 of the LCEN).

## How to use this file

1. Read section 1 to know which list applies: it depends on the country of establishment of the operator and on whether it acts as a business, as a non-professional, or sells online.
2. Build the page from the template: [../../templates/consumer/legal-notice-fr.md](../../templates/consumer/legal-notice-fr.md) for an operator established in France, [../../templates/consumer/legal-notice-eu.md](../../templates/consumer/legal-notice-eu.md) otherwise. For another Member State, check its country file (`../countries/<code>.md`): national lists often add items (Germany, for example, see [../countries/de.md](../countries/de.md)).
3. Every value comes from the site owner. Section 4 lists what the agent must never invent. A placeholder left visible is better than a plausible fake: a wrong registration number misleads consumers and authorities, and can itself be an offence.
4. The penalty for missing identification in France is in [../regulatory-status.md](../regulatory-status.md) section 5.1; do not restate it in the page.

## 1. Who must publish what

The EU list is a floor. National laws (France's LCEN, Germany's DDG) transpose it and can add items. Apply the list of the country where the operator is established, and the EU list in any case.

### 1.1 EU baseline: any information society service (Directive 2000/31/EC, Article 5)

"Information society service" means, in short, a service normally provided for remuneration at a distance by electronic means. A business website, including one funded by advertising, is treated as one by this skill; a purely private site is not ([../scoping/obligations.json](../scoping/obligations.json), `con-operator-identification`, applies when `operator.activity_kind` is `commercial`).

- [ ] The site gives easy, direct and permanent access to the name of the provider [ECD art. 5(1)(a)]
- [ ] ... the geographic address at which the provider is established (a street address, not only a PO box) [ECD art. 5(1)(b)]
- [ ] ... contact details allowing rapid, direct and effective contact, including an email address [ECD art. 5(1)(c)]
- [ ] ... where the provider is registered in a trade register or similar public register, that register and the registration number [ECD art. 5(1)(d)]
- [ ] ... where the activity needs an authorisation, the details of the supervisory authority [ECD art. 5(1)(e)]
- [ ] ... for a regulated profession: the professional body, the professional title and the Member State where it was granted, and a reference to the applicable professional rules and how to access them [ECD art. 5(1)(f)]
- [ ] ... where the activity is subject to VAT, the VAT identification number [ECD art. 5(1)(g)]
- [ ] Whenever the site mentions prices, they are clear and unambiguous and say whether taxes and delivery costs are included (details in [prices.md](prices.md)) [ECD art. 5(2)]

"Easy, direct and permanent" is why the usual solution is a link in the footer of every page. A page reachable only through the terms of sale, or only after login, is not direct.

### 1.2 France: every website publisher (LCEN, Article 1-1)

Applies when the operator is established in France (`fr-legal-notice` in the scoping matrix). The French page is usually titled "Mentions légales".

- [ ] A natural person acting professionally publishes surname, first names, home address and telephone number, and the registration number if registered [LCEN art. 1-1]
- [ ] A legal person publishes its name (dénomination or raison sociale), registered office and telephone number, and, if registered, the registration number, share capital and registered office address [LCEN art. 1-1]
- [ ] Every publisher gives the name of the publication director (directeur de la publication) [LCEN art. 1-1]
- [ ] Every publisher gives the name, address and telephone number of the host (the company that stores the site) [LCEN art. 1-1]
- [ ] A non-professional publisher may publish only the host's name, address and telephone number, provided they have given their own identification details to the host; the agent asks the owner to confirm this before using the reduced form [LCEN art. 1-1]

Why the host matters: a person who wants to report illegal content, or a court, must be able to reach the company that physically stores the site even when the publisher does not answer.

### 1.3 France: sites that sell online (LCEN, Article 19)

Applies in addition to Article 1-1 when the operator established in France sells goods or services online (`fr-ecommerce-identification`).

- [ ] The seller gives its name (natural person) or company name (legal person), the address where it is established, its email address and a telephone number that allow effective contact [LCEN art. 19]
- [ ] ... its registration number, share capital and registered office address, if registered [LCEN art. 19]
- [ ] ... its individual VAT identification number, if subject to VAT [LCEN art. 19]
- [ ] ... the name and address of the authority that granted the licence, if the activity requires one [LCEN art. 19]
- [ ] ... for a regulated profession, the applicable professional rules, the professional title, the State where it was granted, and the professional body [LCEN art. 19]

### 1.4 Overlapping lists

The same facts (name, address, email, register number) also appear in the pre-contractual information of a consumer sale ([online-sales.md](online-sales.md) section 2), and the DSA asks hosting services for a point of contact ([dsa.md](dsa.md) section 2). One well-built identification page can serve all three, as long as each list is complete.

## 2. Where to put it

- [ ] A link labelled with words a person recognises ("Legal notice", "Imprint", "Mentions légales", in the language of the page) is in the footer of every page, and leads to one page that holds all the identification details [best practice]
- [ ] The page is HTML text, not an image or a PDF only, so that it can be read, translated, copied and found by assistive technology [best practice]
- [ ] The page has a `<title>` and an `<h1>` that name it, and groups the items under headings (publisher, publication director, host, regulated activity) [WCAG 2.4.2; RGAA 8.6]
- [ ] The email address is a `mailto:` link and the telephone number a `tel:` link with the number in international format in the `href` [best practice]
- [ ] The identification is reachable without accepting cookies, without creating an account and without JavaScript [best practice]
- [ ] Contact details are not obfuscated in a way that blocks screen readers or copy and paste (text rendered on a canvas, image of an email address) [WCAG 1.1.1]

The footer link costs nothing and satisfies "easy, direct and permanent access" on every page. Hiding the details inside the terms of sale makes them hard to find and fails that test.

## 3. Operator types at a glance

| Operator | EU list (1.1) | France 1-1 (1.2) | France 19 (1.3) |
|----------|---------------|------------------|-----------------|
| Company or sole trader selling online, established in France | Yes | Yes, natural or legal person form | Yes |
| Company or sole trader with a showcase site, established in France | Yes | Yes | No |
| Association, foundation, public body established in France | To confirm with the owner whether the activity is economic (if not, the EU list may not apply) | Yes (legal person form) | Only if it sells online |
| Private person with a personal blog, established in France | No | Yes, or the reduced host-only form | No |
| Business established in another Member State | Yes | No | No; apply that country's file |
| Business established outside the EU and targeting EU consumers | To confirm with a professional | To confirm with a professional | To confirm with a professional |

The last row is open: which national rules bind an operator from outside the EU is a question of territorial scope that this skill does not settle (`OPEN-QUESTIONS.md`, item 25).

## 4. What the agent must never invent

These values identify a real person or company. A plausible fake one is worse than a visible gap.

- [ ] Company name, legal form, share capital, registered office: taken from the owner or from the official register extract the owner provides, never guessed from the domain name [LCEN art. 1-1]
- [ ] Registration number (RCS, RM, SIREN or SIRET in France, Handelsregister number in Germany, any national register number): never generated, never copied from a similar company, never filled with a format-valid number [ECD art. 5(1)(d)]
- [ ] VAT identification number: never derived from a registration number with a formula, even where such a formula exists, because the operator may not be VAT-registered [ECD art. 5(1)(g)]
- [ ] Host details: the name, address and telephone number of the company that actually stores the site, confirmed by the owner. Do not assume the domain registrar, the CDN or the framework vendor is the host [LCEN art. 1-1]
- [ ] Publication director: a natural person named by the owner [LCEN art. 1-1]
- [ ] Supervisory authority, professional body and professional title: only when the owner confirms the activity is regulated, with the exact names they give [ECD art. 5(1)(e)]
- [ ] Until a value is supplied, keep the placeholder in square brackets and list it in the report as "to be completed by the owner" [best practice]

When generating a site from a brief that names a company, the agent may pre-fill the company name from the brief, but still marks every other field as a placeholder and asks.

## 5. Checklist for a review

- [ ] The identification details are easily, directly and permanently accessible [ECD art. 5(1)]
- [ ] In practice, a link to the identification page is in the footer of every page [best practice]
- [ ] Every item of the applicable lists (sections 1.1 to 1.3) is present, or explicitly marked "not applicable" by the owner [ECD art. 5(1)]
- [ ] No placeholder, "lorem ipsum" or sample number is left on a published page [best practice]
- [ ] No item was invented by the agent (section 4) [best practice]
- [ ] No link to the former EU online dispute resolution platform is presented as a required mention (see [online-sales.md](online-sales.md) section 7) [best practice]
