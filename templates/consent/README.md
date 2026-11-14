# Reference consent banner and script loader

A framework-free consent banner (`consent-banner.html`, `consent.css`) and loader (`consent.js`) that apply the rules of [../../references/privacy/consent.md](../../references/privacy/consent.md) and the accessibility shell of [../../references/accessibility/components/consent-banner-shell.md](../../references/accessibility/components/consent-banner-shell.md). No dependency, no build step, no network request of its own. MIT licence, like the rest of this skill.

This is reference code produced with the help of an AI. Using it does not make a site compliant: the texts, purposes, partners and durations come from the site owner, and the owner or their adviser reviews the result. It is not legal advice.

## How to use this file

1. Check that the site needs a banner at all: only if the tracker inventory ([../../references/privacy/trackers.md](../../references/privacy/trackers.md) section 2) found trackers that need consent. Without them, add no banner.
2. Install it (section 1), declare one purpose per group of trackers (section 2), mark every script and embed that needs consent (section 3).
3. Run the verification of section 5 before calling the work done. Report what it cannot prove as "not tested".

## 1. Install

1. Copy `consent.js` and `consent.css` into the site's static files, and link them on every page:
   ```html
   <link rel="stylesheet" href="/consent/consent.css">
   <script src="/consent/consent.js" defer></script>
   ```
   The loader reads the page once the DOM is parsed. Keep `defer` (or put the script at the end of `<body>`).
2. Paste the parts of `consent-banner.html` where its comments say: configuration and banner first in `<body>` after the skip link, "Manage cookies" in the footer of **every** page, the settings dialog and the status region at the end of `<body>`. In a component framework, render the same markup from a layout component so it is on every page; keep the ids.
3. Give the main content an `id` matching `focusTarget` in the configuration (default `main`, the fragment uses `#main`). Focus goes there after a choice made from the banner, so keyboard users are not sent back to the top.
4. Replace every `[placeholder]`. Do not invent the controller's name, the partners, the purposes or the durations: take them from the inventory and ask the owner for the rest.
5. With a Content Security Policy: the loader copies the `nonce` of an inert inline script to the activated one, so give inert inline scripts the page nonce, or prefer external scripts (`src`) allowed by the policy.

## 2. Configure

The JSON block `<script type="application/json" id="eu-consent-config">`:

| Key | Default | Meaning |
|-----|---------|---------|
| `version` | `"1"` | Version of the consent configuration. Change it whenever a purpose, a partner or the use of the data changes: every stored choice with another version is ignored and the banner is shown again. |
| `maxAgeMonths` | `6` | How long a choice (consent or refusal) is kept before asking again. The default is the duration the CNIL recommends; see [../../references/regulatory-status.md](../../references/regulatory-status.md) section 3.3, where it is stated as a recommendation, not a legal limit. Change it only on the owner's decision. |
| `storage` | `"cookie"` | `"cookie"` (first-party cookie, sent to the server, readable server-side) or `"localStorage"`. |
| `storageKey` | `"eu-consent"` | Name of the cookie or key. `eu-consent` is the name the CNIL encourages. |
| `messages` | English texts | Messages announced to screen readers after a choice: `accept`, `refuse`, `custom`, `contextual`. Translate them with the page; a French page that keeps the English defaults announces English to its visitors. Example: `{"accept": "Tous les traceurs sont acceptés.", "refuse": "Tous les traceurs sont refusés.", "custom": "Vos choix sont enregistrés.", "contextual": "Votre choix est enregistré. Le contenu est chargé."}` |
| `reloadOnWithdraw` | `true` | Reload the page after a withdrawal when code of the withdrawn purpose already ran. Code that is running cannot be unloaded; reloading is how it stops. The settings dialog tells the visitor. |
| `focusTarget` | `"main"` | CSS selector of the element that receives focus after a choice from the banner. |

What is stored, and nothing else: `{"v": version, "d": ISO date of the choice, "p": {"<purpose>": true|false, ...}}`. Refusals are stored too, so the banner is not shown again on every page. That entry is exempt from consent because it only keeps the choice.

### Purposes

Each purpose is a `<fieldset class="consent-purpose" data-purpose="id">` in the settings dialog:

- `data-purpose`: lower-case id (`analytics`, `advertising`, `video`, `social`, `chat`, `session-replay`; illustrations). The same id is used on scripts and embeds.
- `data-cookies`: space-separated names of the cookies **the site itself** sets for this purpose, `*` at the end for a prefix (`_pk_id* _pk_ses*`, illustration). They are deleted on withdrawal. Cookies set by a third party on its own domain cannot be deleted by the site: the cookie policy tells visitors how to delete them in the browser.
- `data-storage`: same, for `localStorage` and `sessionStorage` keys.
- A legend (short purpose title) and a description that says what is done, with which tool and which companies. Also list each purpose in the banner's first-level summary: a global "Accept all" is only valid if every purpose was presented first.
- Two radios, `accept` and `refuse`, with `refuse` checked in the markup. The loader re-checks them from the stored choice each time the dialog opens. Nothing is ever pre-accepted.

Group trackers into purposes a visitor can understand and may want to choose separately. Do not merge advertising with audience measurement.

## 3. Declare what needs consent

Scripts: change the type to `text/plain` and add the purpose. The browser does not execute it; the loader recreates it as a real script once every listed purpose is accepted. Order is kept for external scripts.

```html
<!-- Illustrations: the URLs and code are placeholders. -->
<script type="text/plain" data-consent-purpose="analytics" src="/js/analytics.js"></script>
<script type="text/plain" data-consent-purpose="advertising">
  /* code that sets or reads advertising trackers */
</script>
<!-- A module: keep the real type in data-consent-type. -->
<script type="text/plain" data-consent-type="module" data-consent-purpose="chat" src="/js/chat-widget.js"></script>
<!-- Several purposes: runs only when all are accepted. -->
<script type="text/plain" data-consent-purpose="analytics advertising" src="/js/conversion.js"></script>
```

Embeds (video, map, social post, any iframe from a provider that sets or reads trackers): wrap the real markup in an inert `<template>` inside a placeholder. Until consent, nothing is requested. The placeholder offers a link to the content on the provider's site and a button that accepts that purpose only (contextual consent, recorded with method `contextual`).

```html
<div class="consent-placeholder" data-consent-placeholder data-consent-purpose="maps">
  <p>This map is provided by [map provider], which uses trackers. <a href="[link to the map]">Open the map on [map provider]</a>.</p>
  <button type="button" class="consent-button" data-consent-allow="maps">Allow maps from external providers</button>
  <template data-consent-content>
    <iframe src="[embed URL]" title="[Map: what it shows]" width="600" height="400"></iframe>
  </template>
</div>
```

Code in your own bundle that must wait (a framework that initialises an SDK, for example): do not call it at start-up. Read the choice and listen for changes:

```js
if (window.euConsent && window.euConsent.has('analytics')) startAnalytics();
document.addEventListener('eu-consent:change', (event) => {
  if (event.detail.analytics) startAnalytics();
});
```

Do not load a tag manager that can inject trackers outside this mechanism; if the project uses one, it is itself declared as a script of the purposes it serves, and the runtime check of section 5 decides.

## 4. Proof of consent

`window.euConsent.onRecord(callback)` receives, for each choice, a minimal record:

```json
{ "id": "random UUID", "timestamp": "2026-11-14T10:00:00.000Z", "version": "1",
  "choices": { "analytics": true, "video": false },
  "method": "accept | refuse | custom | contextual | withdrawal" }
```

The loader sends it nowhere. If the owner wants a per-visitor proof log, the project sends this record to its own endpoint and stores it as is: no IP address, no full user agent, no account identifier unless the owner documents why. Keep, in any case, the other proof the CNIL recommends: dated copies of this code and configuration (the git history does this if the configuration is committed) and dated screenshots of the banner for each `version`.

Other API: `euConsent.get()` (current choices or `null`), `euConsent.has(purpose)`, `euConsent.open()` (opens the settings, for an extra "Manage cookies" link), `euConsent.onChange(fn)`, `euConsent.reset()` (forgets the choice and reloads; for tests).

## 5. Verify

Run all three before reporting the banner as done.

1. **Accessibility.** On a page that includes the banner: `node scripts/check-a11y.mjs <folder or URL>` from the skill root. Expected: zero non-conformity. Then check by hand what the script cannot: the dialog with a screen reader, 200 % zoom, the texts.
2. **No tracker before consent.** Run `node scripts/check-privacy.mjs <folder or URL>` from the skill root, after copying `templates/trackers.example.json` to `compliance/trackers.json` in the project and completing it (it declares the `eu-consent` cookie, which stores the visitor's choice and is exempt). The script performs the steps below; to check by hand, use a fresh browser context or a private window with the developer tools open:
   - before any click: no cookie or storage entry except exempt ones, no request to a third-party host that sets or reads trackers, no iframe from such a host;
   - after "Refuse all": the same, plus the `eu-consent` entry with every purpose `false`; reload: no banner, still nothing;
   - after "Accept all": the declared scripts run and the embeds load;
   - "Manage cookies", then "Refuse all": the page reloads, the site's cookies of the purpose are gone, its scripts no longer run;
   - a stored choice older than `maxAgeMonths`, or with another `version`: the banner is shown again.
3. **Visual parity.** "Accept all", "Refuse all" and "Customise" have the same size, colours and font; nothing in the banner's text pressures the visitor.

A self-test written with Playwright for this reference passed these checks (47 assertions, including keyboard order, focus after choice, Escape in the dialog, contextual consent and reflow at 320 px), and `check-a11y.mjs` reported zero non-conformity on its demo page. Re-run equivalent checks on the real site: the site's own scripts, tag managers and CMS plugins are what usually leak.

What these checks cannot prove, to list as "not tested": what third parties do with data on their servers, whether an analytics configuration meets every condition of the exemption, whether the texts are accurate and complete.

## 6. Limits

- One choice per browser. Multi-device consent for signed-in users is optional and not built in; see [../../references/privacy/consent.md](../../references/privacy/consent.md) section 7 if the owner wants it.
- Contextual consent from a placeholder stores the choice for that purpose and keeps the others as they were (refused if nothing was chosen); the banner stays on screen for the rest of the page.
- Without JavaScript, nothing that needs consent runs (scripts stay `text/plain`, embeds stay in `<template>`), and the banner stays hidden. That is the safe failure.
- The texts are in English. Translate them into the language of the page, with the same meaning and the same visual weight for each choice.
