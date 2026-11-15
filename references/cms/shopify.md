# Shopify: where to act

Load this file when the site is a Shopify store: you find a theme with `layout/theme.liquid`, `sections/`, `snippets/` and `.liquid` files, a `shopify.app.toml` or `shopify.extension.toml`, or the owner says the shop runs on Shopify. It tells you where, in a Shopify store, each rule of this skill is applied. It adds no legal rule.

## How to use this file

1. This file is a map, not a rulebook. The rules are in the files it links to; the few checkbox lines below repeat an existing rule, with its original source tag, at the place where a Shopify store usually breaks it. Read the linked file before acting.
2. Every statement about Shopify below was read in Shopify's own documentation (shopify.dev and help.shopify.com; sources `shopify-*` in [../sources.json](../sources.json)). It describes a product that changes: when the admin or the docs disagree with this file, they win on "where", and this skill still wins on "what".
3. "Not verified" means that no official page read for this file settles the point. Report it as "not tested", never as compliant, and do not fill the gap from memory.
4. The security checklist for any CMS is in [../security/modules/cms.md](../security/modules/cms.md) and is not repeated here. Section 1 says which of its items Shopify's documentation places in the platform's hands.
5. Shopify's help pages state that the merchant stays responsible for their own privacy compliance and that policy templates and automated privacy settings are not legal advice. A setting being switched on in the admin proves nothing by itself: check the result in a browser ([../privacy/trackers.md](../privacy/trackers.md) section 5).
6. A headless storefront (Hydrogen or another framework calling the Storefront API) is a normal web application: apply the general files of this skill. Only sections 3, 6 and 7 below still matter, because consent, policies, customer data and checkout stay on Shopify's side.

| Task | Read |
|------|------|
| Adding or auditing a script, pixel, app or embed | Sections 2 to 4 |
| Consent banner | Section 3 |
| Security headers | Section 5 |
| Legal pages | Section 6 |
| Access and erasure requests | Section 7 |
| Order button, checkout, withdrawal function | Section 8 |
| Accessibility of the theme | Section 9 |

## 1. Who holds what on a hosted platform

| Item of [../security/modules/cms.md](../security/modules/cms.md) | On Shopify, according to its documentation |
|------|------|
| TLS certificate, redirection from HTTP to HTTPS | Platform: a certificate is issued for every domain added to the store, visitors are redirected to the HTTPS address, and a third-party certificate cannot be used. Mixed content remains the theme's problem: an asset loaded over plain HTTP makes the page insecure |
| Response headers (HSTS, CSP, cookie attributes) | Not verified: see section 5 |
| Core updates, server, database, runtime, network exposure | Not verified in the pages read. Do not write "handled by Shopify" in a report without a contractual or documentary source from the owner |
| Extensions and themes | Merchant: apps and the theme are chosen, installed and removed by the merchant (rules below) |
| Administrator accounts and multi-factor authentication | Merchant. The admin screens for staff accounts were not read for this file: apply [../security/modules/cms.md](../security/modules/cms.md) section 3 and ask the owner |
| Backups of content and theme | Not verified. A theme kept in a Git repository is its own backup; ask the owner about products, customers and orders |

- [ ] Extensions and themes are limited to what the site uses; unused ones, including those shipped with the CMS, are deleted, not only deactivated [ANSSI WEB R61]
- [ ] Each extension and theme is actively maintained and comes from the CMS's official directory or a vendor whose updates are followed [ANSSI WEB R62]
- [ ] The core and third-party extensions are never edited; changes go into a child theme or a custom extension [ANSSI WEB R63]

On Shopify, "the core" includes what the platform injects into the page: see `content_for_header` below. What remains in the theme after an app is uninstalled is not verified: search the theme for leftover snippets and script tags of removed apps.

## 2. Where code goes

### 2.1 Theme files (Online Store 2.0)

A theme has a fixed set of folders; other subfolders are not supported.

| Folder | Holds | Typical use for this skill |
|--------|-------|----------------------------|
| `layout/` | Layout files; `theme.liquid` is required in every theme | `<html lang>`, `<head>`, skip link, footer links present on every page |
| `templates/` | One template per page type (`templates/customers/` for legacy customer account pages) | Page-specific structure |
| `sections/` | Sections and JSON section groups (header, footer) that merchants add, remove and reorder in the theme editor | Footer links to legal pages, "Manage cookies" control |
| `snippets/` | Reusable Liquid, not visible to merchants in the theme editor | A consent-gated script loader |
| `assets/` | CSS, JavaScript, images, referenced with the `asset_url` filter | Self-hosted scripts and fonts |
| `config/` | Theme settings definitions and values | Options exposed to the merchant |
| `locales/` | Translations of theme text | Labels in each language of the shop |
| `blocks/` | Listed in the theme structure | Not described in the pages read |

`layout/theme.liquid` must contain two Liquid objects: `content_for_header` inside `<head>`, and `content_for_layout` inside `<body>`. `content_for_header` outputs the scripts Shopify requires; the documentation says not to modify or parse it. Consequences for an audit:

- the list of scripts on a page cannot be read from the theme alone: Shopify, apps and pixels add theirs at run time. The static search of [../privacy/trackers.md](../privacy/trackers.md) section 2.1 is necessary and never sufficient on Shopify; the runtime check of its section 2.2 decides;
- never "fix" a tracker by filtering or rewriting `content_for_header`. Act where the script was added: the app's settings, the app embed, the pixel, or the customer privacy settings (section 3).

- [ ] Ask the site owner about anything the code cannot show: tags added through a tag manager interface, scripts injected by the hosting platform or a CMS plugin, email pixels added by the newsletter tool [best practice]

### 2.2 Apps: theme app extensions

Apps built with theme app extensions do not edit theme code. An extension has its own `blocks/`, `assets/`, `snippets/` and `locales/` folders and offers two kinds of blocks:

- **app blocks**, which the merchant places inside a theme section in the theme editor;
- **app embed blocks**, which Shopify injects before `</head>` or `</body>` (targets `head`, `body`, and `compliance_head`, which is included first and is meant for cases such as cookie consent banners). They are deactivated by default after installation and are activated in the theme editor, under Theme settings > App embeds.

Where to look during an inventory: the App embeds list of the published theme, the app blocks in each template, then the theme files for script tags pasted by hand or left by older apps.

### 2.3 What the merchant cannot change

- **Checkout pages.** `checkout.liquid` is no longer supported for the information, shipping and payment steps, and it has been retired, with "additional scripts", from the Thank you and Order status pages (dates are on Shopify's pages; they are not regulatory dates). Checkout is customised only through Shopify's extension types (section 8). A script cannot be pasted into checkout.
- **`content_for_header`.** See above.
- **Response headers of a Liquid storefront.** Not verified: see section 5.

## 3. Consent: the Customer Privacy API and the admin settings

Rules: [../privacy/trackers.md](../privacy/trackers.md) and [../privacy/consent.md](../privacy/consent.md). Shopify's part is a consent store shared by the banner, Shopify's own features, pixels and apps.

### 3.1 Admin settings

In the admin, Settings > Customer privacy holds the cookie banner, the privacy policy automation and the data sharing opt-out page. The cookie banner is shown in the regions selected there, on the storefront, cart, checkout and customer account pages, and passes the visitor's choice to the Customer Privacy API. Visitors reopen their choices through a "Cookie preferences" link. Shopify's help states that this banner governs Shopify's own tools, including its cookies and Shopify pixels, and apps integrated with the Customer Privacy API; for third-party cookies or pixels installed by hand or through other apps, it says a third-party banner or custom logic may be needed.

So the built-in banner does not hold back a script pasted in the theme. That script must check consent itself (3.3), or move into a pixel (section 4).

Not verified: the wording, layout and button order of the built-in banner, and whether it meets each rule of [../privacy/consent.md](../privacy/consent.md) sections 2 to 4. Check the rendered banner against that file and against [../accessibility/components/consent-banner-shell.md](../accessibility/components/consent-banner-shell.md), as for any third-party consent tool. An app that draws its own banner is checked the same way; Shopify's documentation sends questions about such banners to the app's developer.

- [ ] Refusing requires no more effort than accepting: no extra screen, no extra click, no hidden link [CNIL guidelines § 30]
- [ ] Put a control that reopens the choices on every page, with a descriptive name such as "Manage cookies", in a place where visitors expect it (footer or a persistent icon) [CNIL recommendation § 3]
- [ ] Without a positive action, treat the visitor as having refused, and run nothing that needs consent [CNIL guidelines § 27; CNIL recommendation § 2]

Region settings matter for the last rule: where the banner is not configured for the visitor's region, nothing asks them. For a shop that targets the EU, verify from an EU location that the banner appears and that nothing runs before the choice.

### 3.2 The API

| Need | Customer Privacy API (`window.Shopify.customerPrivacy`) |
|------|------|
| Load it | `window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.2' }], callback)`; the callback receives an error value |
| Record a choice (custom banner) | `setTrackingConsent({ analytics, marketing, preferences }, callback)`, each key `true` or `false`; `sale_of_data` is a separate key for opt-out regimes outside the scope of this skill |
| What the visitor actually chose | `currentVisitorConsent()` returns `'yes'`, `'no'` or `''` (no choice yet) for `marketing`, `analytics`, `preferences`, `sale_of_data`. It ignores region and merchant settings |
| What Shopify considers allowed | `analyticsProcessingAllowed()`, `marketingAllowed()`, `preferencesProcessingAllowed()`, `saleOfDataAllowed()`. They combine merchant settings, the visitor's location and the consent given |
| React to a change | `visitorConsentCollected` event on `document`; `event.detail` has `analyticsAllowed`, `marketingAllowed`, `preferencesAllowed`, `saleOfDataAllowed`. It fires on a change, not when the listener is added |
| Is the visitor in a banner region | `shouldShowBanner()`; it does not say whether consent was given |

Shopify's documentation adds: record consent only on a visitor's interaction, never automatically on their behalf, and never read or modify Shopify's cookies directly.

The "allowed" methods depend on how the merchant configured regions, so `true` does not always mean "this visitor said yes". For a tracker that needs consent under [../privacy/trackers.md](../privacy/trackers.md), gate on the recorded choice.

The purposes are fixed (analytics, marketing, preferences). [../privacy/consent.md](../privacy/consent.md) section 4 asks for one choice per distinct purpose: when a store's trackers do not fit these three, say so in the report instead of forcing them into the nearest one.

For a headless storefront, `setTrackingConsent` takes extra parameters (`headlessStorefront`, `checkoutRootDomain`, `storefrontRootDomain`, `storefrontAccessToken`); Shopify recommends Hydrogen's analytics and consent components there. Read that page before building; it is not summarised here.

### 3.3 Holding back a script pasted in the theme

- [ ] A script whose purpose needs consent is not executed before consent for that purpose: it is not just "disabled" after loading, it is not loaded. Declare it as inert (`<script type="text/plain" data-consent-purpose="...">`) or load it from code that runs only after consent [ePrivacy art. 5(3)]
- [ ] A tag manager that itself sets or reads trackers, or that loads trackers, is loaded only after consent, or configured so that it loads nothing that needs consent before the choice; verify the result at run time, not in its settings [ePrivacy art. 5(3)]

Illustration: a loader in `assets/consent-gate.js`, included from `layout/theme.liquid` with `<script src="{{ 'consent-gate.js' | asset_url }}" defer></script>`. The tracker's file is self-hosted in `assets/`; adapt the purpose and the file name.

```liquid
<script type="application/json" id="consent-gate-config">
  { "analyticsSrc": {{ 'audience-measurement.js' | asset_url | json }} }
</script>
```

```js
// assets/consent-gate.js: loads the analytics file only after a recorded "yes".
(function () {
  var config = JSON.parse(document.getElementById('consent-gate-config').textContent);
  var loaded = false;

  function loadAnalytics() {
    if (loaded) { return; }
    loaded = true;
    var script = document.createElement('script');
    script.src = config.analyticsSrc;
    document.head.appendChild(script);
  }

  function check() {
    var privacy = window.Shopify && window.Shopify.customerPrivacy;
    if (privacy && privacy.currentVisitorConsent().analytics === 'yes') { loadAnalytics(); }
  }

  if (!window.Shopify || !window.Shopify.loadFeatures) { return; } // no API: nothing loads
  window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.2' }], function (error) {
    if (error) { return; } // API unavailable: treated as a refusal
    check();
    document.addEventListener('visitorConsentCollected', check);
  });
})();
```

After a withdrawal the script already running is stopped by the next page load, as [../privacy/consent.md](../privacy/consent.md) section 6 describes; deleting the tracker's own first-party cookies is the project's code to write. In the Liquid block, `asset_url` returns the CDN address of a file of the theme's `assets/` folder and `json` converts the string to JSON, with its quotes.

- [ ] Before any choice: no cookie, storage entry or IndexedDB database other than exempt ones, and no request to a third-party host that sets or reads trackers [ePrivacy art. 5(3)]

Which of Shopify's own cookies are set before the choice, and whether each fits an exemption, is not verified: list what the runtime check finds and classify each entry with [../privacy/trackers.md](../privacy/trackers.md) section 3.

## 4. Web pixels (customer events)

Pixels are Shopify's managed way to run tracking code. They are added and managed in the Customer events section of the admin, in two kinds: **app pixels**, installed by an app, and **custom pixels**, written by hand in the admin. They run in a sandbox (strict for app pixels, lax for custom pixels), cannot draw interface elements such as a banner, and load on the storefront, checkout, Thank you and Order status pages.

Relation to consent, as documented:

- an app pixel declares the permissions it requires in `shopify.extension.toml` (`analytics`, `marketing`, `preferences`, `sale_of_data`); a custom pixel declares them in the admin;
- the pixel manager loads a pixel only if the visitor has given permission for every setting the pixel declares as required;
- inside a pixel, `init.customerPrivacy` gives the initial permissions, and `customerPrivacy.subscribe('visitorConsentCollected', ...)` reports changes.

What this means for the agent:

- a tracker that needs consent belongs in a pixel with the matching permission declared, not in `theme.liquid`: pixels also load at checkout, which theme layouts no longer cover (section 2.3);
- a pixel that declares no required permission is not held back by this mechanism. Read each pixel's declared permissions and compare them with its purpose in the tracker inventory;
- the permissions follow the merchant's region settings (section 3.1): verify from an EU location, before any choice and after a refusal, that no pixel request leaves;
- what happens to events that occurred before consent (dropped, or replayed once consent is given) is not verified. If it matters for the owner, test it.

## 5. HTTP security headers

General rules and values: [../security/headers-configs.md](../security/headers-configs.md) and [../security/web-baseline.md](../security/web-baseline.md).

- **Liquid storefront: not verified.** No official page read for this file lists the headers Shopify sends for a storefront, nor a setting to change them. Headers cannot be set at a web server the merchant does not operate, and no documented theme or admin mechanism for it was found. Do not promise the owner a CSP or an HSTS value. Run the header checker on the live domain, report what is sent, and report missing or weak headers as "depends on the platform", with the severity of [../security/headers-baseline.json](../security/headers-baseline.json).
- **HTTPS** is documented as provided by the platform (section 1).
- **Hydrogen.** The developer sets the response headers in the server entry file; Hydrogen supplies a default content security policy through `createContentSecurityPolicy`, with a nonce, which can be extended with custom directives. Apply [../security/headers-configs.md](../security/headers-configs.md) as for any server-rendered application.
- **Apps.** An app sends its own headers from its own server; Shopify documents a `frame-ancestors` directive to set on every route of an app that renders HTML. This concerns the app's developer, not the storefront.

- [ ] If the host cannot set headers, the policy goes in a `<meta http-equiv="Content-Security-Policy">` placed first in `<head>`; this form cannot carry `frame-ancestors` or reporting, so say so in the report [ANSSI WEB R14-]

Whether such a `<meta>` policy can be strict on a Liquid storefront is not verified: `content_for_header`, apps and pixels add scripts the theme does not control. Try it on an unpublished copy of the theme, and report the result rather than weakening the policy until errors disappear.

- [ ] Scripts and stylesheets loaded from another origin carry `integrity="sha384-…"` (or `sha256`/`sha512`) and `crossorigin="anonymous"` [ANSSI WEB R12]

This applies to tags written in the theme. Prefer a copy in `assets/`.

## 6. Store policies and legal pages

Rules: [../consumer/operator-identification.md](../consumer/operator-identification.md), [../consumer/online-sales.md](../consumer/online-sales.md) section 6, [../documents/terms-of-sale.md](../documents/terms-of-sale.md), and the privacy policy template in [../../templates/privacy-policy.md](../../templates/privacy-policy.md).

Policies are edited in the admin under Settings > Policies. The help page lists a return (refund) policy, privacy policy, terms of service, shipping policy, legal notice, contact information and subscription policy. Saved policies are linked by default in the checkout footer, and can be added to the store's menus. Refund, privacy, terms of service, shipping and subscription policies have documented addresses under `/policies/` (for example `/policies/privacy-policy`). Shopify's guide for merchants selling in Germany describes the legal notice as the Impressum.

What the admin does not do:

- Shopify states that its policy templates are for information only, are not legal advice and do not guarantee compliance. An "automated" policy is a draft to check against the skill's templates, never the proof that the page is right.
- The default links are in the **checkout** footer. Links on every page of the storefront are the theme's job: add them to the footer menu or the footer section.
- The list has no entry named "terms of sale". Which field receives them is the owner's choice; their content comes from the owner.
- Not verified: the public address of the legal notice and of the contact information, and the fields offered for each country.

- [ ] The identification details are easily, directly and permanently accessible [ECD art. 5(1)]
- [ ] A link labelled with words a person recognises ("Legal notice", "Imprint", "Mentions légales", in the language of the page) is in the footer of every page, and leads to one page that holds all the identification details [best practice]
- [ ] Until a value is supplied, keep the placeholder in square brackets and list it in the report as "to be completed by the owner" [best practice]

## 7. Customer data requests

Rules: [../privacy/data-subject-rights.md](../privacy/data-subject-rights.md). Shopify's GDPR help page says Shopify acts as a processor that follows the merchant's instructions for customer data, that a data processing addendum sets out the responsibilities, and that understanding and meeting GDPR obligations remains the merchant's responsibility.

**Admin tools.** On a customer's profile (Customers), More actions offers "Request customer data" and "Erase personal data". Erasure redacts personal data such as name and address; some order information (what was sold, date and time) stays visible in the admin, and the profile and order history remain. A pending erasure can be cancelled for a short time. Erasure does not cover data held by Shop or Shop Pay, and the help page says the merchant must contact the other companies the data was shared with.

**Apps.** Every app distributed through the Shopify App Store must subscribe to three compliance webhooks, declared with `compliance_topics` in `shopify.app.toml`:

| Topic | Meaning |
|-------|---------|
| `customers/data_request` | A request to see the data the app stores about a customer |
| `customers/redact` | A request to delete a customer's data |
| `shop/redact` | A request to delete a shop's data, sent after the app is uninstalled |

The app answers with a 2xx status, rejects a request whose HMAC header is invalid with 401, and completes the action within the period Shopify's page gives, unless it is legally required to keep the data. When building an app, implement the three handlers for real (find and export, delete or anonymise in every store the app controls), not as empty endpoints. Shopify's timings are its own; the legal deadline is the one of [../privacy/data-subject-rights.md](../privacy/data-subject-rights.md) section 1.

- [ ] Give people a simple way to exercise their rights: a contact address or form dedicated to data protection requests, named in the privacy policy [GDPR art. 12(2); GDPR art. 13(2)(b)]
- [ ] Delete or anonymise the person's data in every store the site controls: database and replicas, search index, caches, file storage (avatars, uploads), newsletter and email tools, analytics with user identifiers, support tools [GDPR art. 17(1)]
- [ ] Ask processors to delete their copies (through their deletion API or a documented manual step), and notify other recipients of the erasure [GDPR art. 19; GDPR art. 28(3)]

The admin's erasure covers Shopify's side. Tools fed outside the webhook mechanism (a newsletter service loaded by a script, a spreadsheet export, a support desk) are not reached by it: list them for the owner. Not verified: a self-service "download my data" or "delete my account" function for customers in Shopify's customer accounts.

## 8. Checkout and the order button

Rules: [../consumer/online-sales.md](../consumer/online-sales.md) sections 3 and 4, [../consumer/withdrawal-function.md](../consumer/withdrawal-function.md).

**What can be customised.** Checkout is changed through Shopify's extension types: checkout UI extensions, Functions, web pixel extensions and payments extensions, plus branding through the Admin API. Checkout UI extensions run in an isolated sandbox (a web worker without access to the DOM or to the checkout page's HTML) and are limited to the components and APIs the platform exposes. On the information, shipping and payment steps they are available only to stores on the Shopify Plus plan. The structure, markup and focus handling of checkout therefore belong to Shopify: the agent can test them and report defects, not fix them.

**Where the wording comes from.** Two documented places:

- Settings > Checkout, section Checkout language, "Edit checkout content";
- Online Store, the menu beside the theme, "Edit default theme content", category "Checkout & system", which Shopify describes as holding all the content of the checkout plus system titles, errors and notices. Other languages go through translations; update them after each change.

Shopify's guide for merchants selling in Germany documents a "Require a confirmation step" option (Settings > General, Order processing) and a "Review notice html" text in the "Checkout & system" category for a notice with links to the policies.

Not verified: the name of the entry that holds the label of the button placing the order, its default text in each language, and whether every checkout variant (including accelerated payment buttons) uses it. Open the checkout in each language sold, read the button, and report.

- [ ] The button that places the order is labelled only with "order with obligation to pay" or a corresponding unambiguous formulation that says that placing the order entails an obligation to pay [CRD art. 8(2)]
- [ ] In French, the label is "commande avec obligation de paiement" or an equally unambiguous wording [C. conso L. 221-14]
- [ ] Directly before the order, on the same screen as the order button and in a clear and prominent manner, the site shows the main characteristics, the total price with all costs, and, for contracts with a duration, the duration, the conditions of termination and the minimum duration [CRD art. 8(2)]
- [ ] The site states clearly and legibly, at the latest at the beginning of the ordering process, whether any delivery restrictions apply (countries, regions, types of address) and which means of payment are accepted [CRD art. 8(3)]

The last rule is met in the theme (cart page or drawer, footer), before checkout starts. If the label or the summary cannot be brought into line with the settings above, say so to the owner as a platform limit to raise with Shopify or a professional; do not report the checkout as compliant.

**Withdrawal function.** Nothing in the pages read describes a built-in withdrawal function. Build it in the theme (a page template plus a footer link) or in an app, from the reference component of [../consumer/withdrawal-function.md](../consumer/withdrawal-function.md); the server side (timestamp, acknowledgement email) needs an app or an external service: the theme folders of section 2.1 hold templates and static assets, and no server-side code of the merchant's was described in the pages read.

- [ ] It is continuously available throughout the withdrawal period: not only in the order confirmation email, not only on one day, not dependent on stock or on support opening hours [CRD 11a]
- [ ] In practice: a link or button with the label above in the footer of every page, and on each order in the customer account [best practice]

## 9. Accessibility

Rules: [../accessibility/rules.md](../accessibility/rules.md) and its component files. Which standard is legally required: [../regulatory-status.md](../regulatory-status.md).

Shopify publishes accessibility requirements for themes submitted to its Theme Store (a minimum Lighthouse accessibility score, keyboard access to every part of a page, visible focus, focus order matching the DOM, `alt` on every image, labels tied to inputs, valid HTML, contrast and touch target minimums) and accessibility best practices for themes, based on WCAG, which state that following them does not guarantee an accessible theme. Consequences:

- these are a marketplace's entry conditions, not a conformity statement. A Theme Store theme is not thereby conformant to WCAG, RGAA or EN 301 549, and a Lighthouse score is not an audit. Their thresholds are Shopify's own and are not copied here;
- a theme from another source, or a custom one, carries no such check at all;
- content entered by the merchant (image alternatives, headings in rich text, colours chosen in theme settings) and every app block or app embed can break a sound theme. Test the published store, not the theme's demo.

Where to act: `layout/theme.liquid` for the `lang` attribute, the skip link and the landmarks; `sections/` and `snippets/` for components; `config/` for colour settings whose combinations must keep the contrast; `locales/` for accessible names in every language.

- [ ] Every action available with a pointer is available with the keyboard alone [WCAG 2.1.1; RGAA 7.3]
- [ ] Text has a contrast ratio of at least 4.5:1 with its background; large text (24 px and above, or about 18.5 px and above in bold) at least 3:1. This includes placeholder text, text on images or gradients, and hover, focus and visited states [WCAG 1.4.3; RGAA 3.2]
- [ ] Payment, identification and security functions (card fields, 3-D Secure frame, login) are perceivable, operable, understandable and robust [EAA]

The markup of checkout cannot be edited by the merchant (sections 2.3 and 8); what can be edited on Shopify-hosted customer account pages is not verified. Test them with [../accessibility/testing-by-hand.md](../accessibility/testing-by-hand.md), report defects as "third-party component, not correctable by the site", and never leave them out of the report.

## 10. In the report

List: the theme and its origin; every app, app embed and pixel with its purpose and declared consent permissions; scripts found in theme files; the customer privacy settings observed (regions, banner) and the result of the runtime check from an EU location; the headers actually sent; the legal pages and where they are linked; the order button label read in each language; how access and erasure requests are handled outside Shopify; and every point marked "not verified" in this file that the work depended on.
