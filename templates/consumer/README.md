# Consumer templates and reference components

Framework-free, accessible reference code for the consumer part of the skill, and two identification page templates. No dependency, no build step, no network request of their own. MIT licence, like the rest of this skill.

This is reference code produced with the help of an AI. Using it does not make a site compliant: texts, prices, terms and identification details come from the site owner, who reviews the result with an adviser where needed. It is not legal advice.

## How to use this folder

1. Read the matching reference file first: [../../references/consumer/README.md](../../references/consumer/README.md) says which one.
2. Copy the component, keep the parts marked as fixed in its header comment (labels set by law, order of the summary and the button, data attributes), and adapt the rest to the site's layout.
3. Run the checks of section 5 on the real pages before calling the work done.

| File | What it is | Rules |
|------|-----------|-------|
| `withdrawal-function.html`, `withdrawal-function.js` | Online withdrawal function: entry button, statement, "Confirm withdrawal", on-screen acknowledgement | [../../references/consumer/withdrawal-function.md](../../references/consumer/withdrawal-function.md) |
| `order-button.html` | Final order step: summary directly before the order button worded as the law requires | [../../references/consumer/online-sales.md](../../references/consumer/online-sales.md) |
| `price-reduction.html` | Markup for a current price, a reduction and the prior price, read correctly by screen readers | [../../references/consumer/prices.md](../../references/consumer/prices.md) |
| `consumer.css` | Shared styles: contrast, focus, target size, error states | — |
| [legal-notice-fr.md](legal-notice-fr.md) | French "mentions légales" page | [../../references/consumer/operator-identification.md](../../references/consumer/operator-identification.md) |
| [legal-notice-eu.md](legal-notice-eu.md) | Generic EU identification page | Same |

## 1. Withdrawal function: install

1. Copy `withdrawal-function.js` and `consumer.css` into the site's static files and load them on the withdrawal page:
   ```html
   <link rel="stylesheet" href="/consumer/consumer.css">
   <script src="/consumer/withdrawal-function.js" defer></script>
   ```
2. Paste the `<section data-withdrawal>` of `withdrawal-function.html` into the withdrawal page. Keep its `data-*` attributes and ids.
3. Put a link labelled "Withdraw from contract here" (French: "Renoncer au contrat ici") to that page in the footer of **every** page, and on each order in the customer account. It must stay there for the whole withdrawal period of every contract concluded on the site.
4. Replace the demo handler at the end of `withdrawal-function.html` with the site's own (section 2).
5. Language: the script reads `lang` on the page (or `"locale"` in the configuration) and uses the English or French wording. For another language, pass `"texts"` in the configuration with the wording of that country's transposition (see `references/countries/<code>.md`), never a free translation of the legal labels.

### Configuration

The JSON block `<script type="application/json" data-wd-config>` inside the section:

| Key | Meaning |
|-----|---------|
| `locale` | `"en"` or `"fr"`. Default: the `lang` of the page. |
| `prefill` | `{ "name", "contractId", "email" }` known by the server (logged-in customer, link from an order). Rendered by the server into the page; never passed in the URL, because URLs end up in logs and browser history. |
| `texts` | Overrides any text of the dictionary (`window.euWithdrawal.texts.en` lists the keys). |

## 2. Withdrawal function: the handler (the site's backend)

The component sends nothing by itself. The site registers one function:

```js
window.euWithdrawal.setHandler(async (statement) => {
  // statement: { name, contractId, email, locale, text }
  const response = await fetch('/api/withdrawals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statement),
  });
  if (!response.ok) throw new Error('withdrawal not recorded');
  return response.json(); // must contain { receivedAt: ISO 8601 string set by the server, reference?: string }
});
```

The server endpoint (illustration of what it must do, in any stack):

1. Validate the three fields again; do not require anything else (no reason, no account).
2. Record the statement and the date and time of receipt from the server clock, with the time zone. This timestamp is the evidence that the withdrawal was made within the period.
3. Send the acknowledgement of receipt on a durable medium without delay: an email to `statement.email` whose body repeats the content of the statement and that date and time. A link to the account alone is not a durable medium.
4. Answer `{ receivedAt, reference }`. The component shows the same date and time on screen.
5. Protect the endpoint like any form: CSRF token or same-site cookie, rate limiting, server-side validation, no personal data in logs beyond what the withdrawal needs ([../../references/security/web-baseline.md](../../references/security/web-baseline.md), [../../references/privacy/forms-and-minimisation.md](../../references/privacy/forms-and-minimisation.md)).

If the handler throws or answers without `receivedAt`, the component tells the person that the statement was **not** sent and keeps what they typed. Never show the acknowledgement before the server has recorded the statement.

Without JavaScript the section shows only the entry button, which does nothing. For a site that must work without JavaScript, render the same form as a normal `<form method="post">` handled by the server, with the same labels, and render the acknowledgement page on the server.

## 3. Order step

`order-button.html` is the last step of a checkout. Keep: the summary groups (items with main characteristics, delivery, payment, price with every cost, right of withdrawal) above the form; the "Change" links; the button `Order with obligation to pay` (French: `Commande avec obligation de paiement`) as the only submit button, with no other text inside it. The French strings are in the header comment of the file. Build the earlier steps with [../../references/accessibility/components/multi-step-form.md](../../references/accessibility/components/multi-step-form.md).

## 4. Price reduction

`price-reduction.html` shows two layouts. Prefer the one with visible labels. The prior price must be computed on the server from the stored price history ([../../references/consumer/prices.md](../../references/consumer/prices.md) section 2).

## 5. Verify

1. **Accessibility.** From the root of the website project: `node <skill>/scripts/check-a11y.mjs <folder or URL>`. Expected: zero non-conformity. On 2026-11-14 the three pages of this folder gave 0 non-conformity (browser: Edge, through the checker's fallback).
2. **Withdrawal flow with the keyboard only.** A Playwright test written for this reference passed 40 assertions on 2026-11-14, in English and in French: the entry button is reached with Tab and has the legal label; Enter moves focus to the statement heading; an empty submission moves focus to the error summary and marks the three fields invalid; each error link moves focus to its field; after filling the fields and pressing Enter on "Confirm withdrawal", focus moves to the acknowledgement heading, which states the result, and the acknowledgement shows a machine-readable date and time, the full content and the email address, while a status region announces the result; axe-core finds no violation in each state; a failing handler shows an error, keeps the data and shows no acknowledgement. Re-run equivalent checks on the real site, including the server's email.
3. **By hand.** Read the pages with a screen reader; check the email acknowledgement arrives, contains the content and the date and time, and is readable; check the entry link is on every page; check the labels against the country file for a page not in English or French.

What these checks cannot prove, to list as "not tested": whether the right of withdrawal applies to the products sold, whether the texts and terms of sale are correct, whether the email is actually delivered in production.
