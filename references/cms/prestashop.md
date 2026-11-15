# PrestaShop: where to act

Load this file when the site is a PrestaShop shop (you find `config/defines.inc.php`, a `themes/<name>/config/theme.yml`, a `modules/` folder with `ps_*` modules) and you must apply this skill's rules to it. It adds no rule of its own: it says in which PrestaShop file, hook or setting each existing rule is applied.

The security checklist for any CMS (extensions, updates, administration, exposure, backups) is in [../security/modules/cms.md](../security/modules/cms.md) and is not repeated here.

## How to use this file

1. Every PrestaShop fact below was read on the project's own pages: the developer documentation (`devdocs.prestashop-project.org`, version 9 pages unless stated), the user guide (`docs.prestashop-project.org`, version 8 pages), the project blog (`build.prestashop-project.org`) and the `PrestaShop` organisation's repositories on GitHub. Section 9 lists what those pages did not settle; treat each item there as "not verified" and check it on the installed shop.
2. Versions covered by the pages read: asset registration (with the `actionFrontControllerSetMedia` hook) was read for 1.7, 8 and 9; hooks in general, child themes, overrides, debug mode and theme guidelines for 9 only; the checkout templates in the `develop` branch of `classic-theme` and the `2.x` branch of `hummingbird`. Read the installed version in the back office before relying on a path, and compare with the documentation of that version.
3. The checkbox lines repeat rules that already exist in this skill, with the same source tag, applied to PrestaShop. The rule files stay the reference: [../privacy/trackers.md](../privacy/trackers.md), [../privacy/consent.md](../privacy/consent.md), [../privacy/data-subject-rights.md](../privacy/data-subject-rights.md), [../consumer/online-sales.md](../consumer/online-sales.md), [../consumer/withdrawal-function.md](../consumer/withdrawal-function.md), [../consumer/prices.md](../consumer/prices.md), [../accessibility/rules.md](../accessibility/rules.md), [../security/headers-configs.md](../security/headers-configs.md).
4. No module, official or not, makes a shop compliant. Report what each module does and what was tested, never "compliant".

## 1. Where code goes

| Need | Place | Never |
|------|-------|-------|
| Change markup or styles of the shop | A child theme (section 2) | Editing the parent theme or a core template |
| Change what a module displays | A copy of the module's file inside the theme (section 2) | Editing the module's own files |
| Add behaviour, a script or a stylesheet | A custom module that registers hooks (below) | Editing core classes or controllers |
| Change core behaviour when no hook exists | An override, as a last resort (section 3) | Shipping an override in a distributed module |

- [ ] The core, the parent theme and third-party modules are never edited; changes go into a child theme or a custom module [ANSSI WEB R63]
- [ ] Modules and themes are limited to what the shop uses; unused ones, including those shipped with PrestaShop, are deleted, not only deactivated [ANSSI WEB R61]
- [ ] Before a module goes to production, it is studied and tested on the four points of the CMS module (it works, its origin is known, it has no unresolved security issue, it is maintained) [ANSSI WEB section 6.2]

### Hooks

A module registers each hook it uses, usually in its `install()` method, with `registerHook('<hookName>')`, and implements a public, non-static method named `hook` followed by the hook name (`hookDisplayHeader`, `hookActionFrontControllerSetMedia`). Hook names start with `display` (they output something in the front or back office) or `action` (they react to an event). A theme template calls a display hook with `{hook h='hookName'}`, or `{hook h='hookName' mod='modulename'}` for one module.

| Hook | What the pages read say |
|------|-------------------------|
| `actionFrontControllerSetMedia` | Front-office action hook called from `classes/controller/FrontController.php`; the documented place for a module to register or unregister scripts and stylesheets |
| `displayHeader` (alias `Header`) | Front-office display hook that adds elements to the `<head>` of pages; read what each module registered on it returns |

### Scripts and stylesheets

Inside `hookActionFrontControllerSetMedia`, a module calls `$this->context->controller->registerJavascript($id, $relativePath, $options)` and `registerStylesheet(...)`; a module front controller does the same in `setMedia()` after `parent::setMedia()`. A theme declares its assets under the `assets` key of `theme.yml`. Registering an asset with an ID that already exists replaces the earlier one. `unregisterJavascript($id)` and `unregisterStylesheet($id)` remove an asset by its ID.

Options documented for `registerJavascript`: `position` (`head` or `bottom`, default `bottom`), `priority` (0 to 999, default 50, lower loads earlier), `inline`, `attributes` (`async` or `defer`), `server` (`local` or `remote`), `version`. The pages read spell the loading option `attributes` in PHP and `attribute` in `theme.yml` examples: check the result in the rendered page.

## 2. Child themes and template overrides

A child theme is a folder in `/themes/` with `config/theme.yml` and `preview.png`. Its `theme.yml` names the parent with the `parent` key; `name` must match the folder name; `assets: use_parent_assets: true` loads the parent's registered CSS and JavaScript before the child's. The parent theme must be present in `/themes/`.

- A template placed in the child theme at the same path as in the parent replaces the parent's template.
- To change one block only, extend the parent's file with the `parent:` prefix (`{extends file='parent:catalog/listing/category.tpl'}`); without the prefix the file extends itself and loops.
- A theme replaces a module's template, CSS or JavaScript by placing a file at the mirrored path under `themes/<theme>/modules/<module>/` (for a template: `themes/<theme>/modules/<module>/views/templates/...`). PrestaShop then ignores the module's own file.
- An empty override file makes PrestaShop render nothing for that file. Partials included with a relative path still load from the module, so each included file needs its own override.

After a theme or module update, compare every overridden template with the new original: an override silently hides fixes made upstream, including accessibility and security fixes.

## 3. Overrides of classes and controllers

The developer documentation describes overrides (`/override/classes/...`, `/override/controllers/front/...`, `/override/modules/<module>/...`; a module ships its own in `modules/<module>/override/`, copied on install) and warns about them:

- overrides are exclusive: two modules cannot reliably override the same behaviour;
- the documentation advises against overrides in a module meant for distribution, and says they are forbidden in partner modules;
- hooks, new classes or controllers, and service overrides are to be tried first;
- the cache is cleared after an override is added (back office, or the Symfony console).

- [ ] List every file under `/override/` in the report, with the module that installed it and the reason, and check each one again after a core update; prefer a hook when one exists [best practice]

## 4. Holding a third-party tag until consent

The rules are in [../privacy/trackers.md](../privacy/trackers.md) section 4 and [../privacy/consent.md](../privacy/consent.md).

**Consent mechanism in the core.** The pages read describe no tracker consent banner in the PrestaShop core or in the official GDPR module: `psgdpr` handles consent checkboxes on forms and access to personal data (section 5), not trackers. Not verified beyond those pages. Inventory what the installed shop does, then build the mechanism with this skill's consent template or let the owner choose a tool; this file recommends none.

**Where tags come from in a shop.** Three places: assets registered by modules (`registerJavascript`), markup printed by modules in `displayHeader` or another display hook, and scripts written directly in theme templates. A back-office setting of an analytics or advertising module is a fourth: ask the owner.

- [ ] Before the choice, the shop stores or reads only exempt trackers: check with every module enabled as in production, not on a bare theme [ePrivacy art. 5(3); LIL art. 82]
- [ ] A script whose purpose needs consent is not registered, printed or loaded before consent for that purpose; it is declared inert or loaded from code that runs only after consent [ePrivacy art. 5(3)]
- [ ] A tag manager installed by a module is loaded only after consent, or configured so that it loads nothing that needs consent before the choice; verify at run time, not in the module's settings [ePrivacy art. 5(3)]
- [ ] Ask the owner which tags are added through module settings in the back office: the code does not show them [best practice]

In a custom module, register only a first-party loader; the loader reads the stored choice and adds the vendor's script after consent for its purpose:

```php
public function install()
{
    return parent::install()
        && $this->registerHook('actionFrontControllerSetMedia');
}

public function hookActionFrontControllerSetMedia(array $params)
{
    // First-party file only: no request goes to the vendor before consent.
    $this->context->controller->registerJavascript(
        'mymodule-consent-loader',
        'modules/mymodule/views/js/consent-loader.js',
        ['position' => 'bottom', 'priority' => 200]
    );
}
```

For a tag that another module adds:

| How the module adds it | Where to act |
|------------------------|--------------|
| `registerJavascript` with a known ID | `unregisterJavascript('<that id>')` from your module's `hookActionFrontControllerSetMedia`, then load it from the consent loader. The order in which modules run on that hook was not read: verify in the rendered page |
| A template printed in a display hook | Override that template in the theme (section 2) so the script is inert (`<script type="text/plain" data-consent-purpose="...">`) until consent |
| No ID and no template (markup built in PHP) | Do not edit the module. Disable its tag in its settings or replace the module, and report it by name |

## 5. Personal data: the `psgdpr` module

`PrestaShop/psgdpr` is the project's GDPR module. Its README (branch `dev`) says it needs PrestaShop 8.0.0 or later, lets the merchant enable a consent checkbox on some forms and modules with a custom message, and lets customers view and download their personal data as PDF and CSV from their account. It is partially compatible with multistore.

A module that stores personal data of its own connects to it through hooks (project how-to of 2018, hook list of the version 9 documentation, and the module's `dev` source):

| Hook | Role |
|------|------|
| `registerGDPRConsent` | Registered by a module so that `psgdpr` lists it for a consent checkbox |
| `displayGDPRConsent` | Display hook called inside the module's form (`{hook h='displayGDPRConsent' id_module=$id_module}`); the module assigns `id_module` to the template |
| `actionExportGDPRData` | Called for each registered module with the customer as an array; `psgdpr` decodes the return value as JSON (a list of rows) and adds it to the export. JSON is what the module's hook returns to `psgdpr`, not the format of the file the customer downloads |
| `actionDeleteGDPRCustomer` | Called for each registered module with the customer data; the module deletes its own rows. The how-to's example returns `json_encode(true)` |

The how-to's examples identify the person by the `email` key of the customer array. The module covers only what each installed module implements.

- [ ] The export covers every store listed for the person: for each module that keeps personal data, check that it implements `actionExportGDPRData`, and report the ones that do not [GDPR art. 15(3)]
- [ ] Erasure reaches every store the shop controls: each module that keeps personal data implements `actionDeleteGDPRCustomer`, and stores outside PrestaShop (newsletter tool, analytics, support tool) are handled separately [GDPR art. 17(1)]
- [ ] A custom module that stores personal data registers the three hooks at install and returns only its own data [best practice]
- [ ] Keep only what a legal obligation requires (invoices, for example) and say so to the person; the owner decides which exceptions apply, not the agent or the module [GDPR art. 17(3)]

A consent checkbox added by `psgdpr` on a form is not consent to trackers and does not replace section 4.

## 6. Checkout, order button and prices

**Templates.** In both default themes the payment step is `templates/checkout/_partials/steps/payment.tpl`. As read in `classic-theme` (`develop`) and `hummingbird` (`2.x`):

- the conditions to approve are checkboxes in a form with the id `conditions-to-approve`, each `required` and none checked by default; the list comes from the `conditions_to_approve` variable and modules can add entries;
- the order button is a `<button type="submit">` inside `#payment-confirmation`; its label is the string "Place order" ("Place Order" in Hummingbird) of the translation domain `Shop.Theme.Checkout`;
- the string "Order with an obligation to pay" exists in the same template, but as a `<label>` shown only when JavaScript is off;
- when `show_final_summary` is true, the template includes `checkout/_partials/order-final-summary.tpl` above the button;
- the template calls the hooks `displayPaymentTop`, `displayCheckoutBeforeConfirmation` and `displayPaymentByBinaries`.

**Settings.** The user guide (version 8, Orders preferences page of the order settings) documents "Enable final summary", "Terms of service", "Page for the Terms and conditions", guest checkout and gift wrapping.

**One Page Checkout.** From PrestaShop 9.2 the native module `ps_onepagecheckout` can replace the step-by-step checkout when the merchant enables it. Its pay button has the id `opc-pay-button` and required `conditions_to_approve` checkboxes gate it. Check which checkout is active before editing templates.

- [ ] The button that places the order is labelled only with "order with obligation to pay" or a corresponding unambiguous formulation: in the default themes read, override the payment step template in the child theme (or the string of `Shop.Theme.Checkout`) and check the rendered label in each language of the shop [CRD art. 8(2)]
- [ ] In French, the label is "commande avec obligation de paiement" or an equally unambiguous wording [C. conso L. 221-14]
- [ ] The accessible name of the button is the visible label, word for word, after the override [WCAG 2.5.3; RGAA 11.9]
- [ ] Directly before the order, on the same screen as the order button, the shop shows the main characteristics and the total price with all costs: enable the final summary and check what it contains [CRD art. 8(2)]
- [ ] No option that costs money (gift wrapping, an option added by a module in the checkout) is pre-selected [CRD art. 22]
- [ ] Acceptance of the terms of sale stays a separate unchecked checkbox, not merged with consent to marketing by a module that adds entries to the conditions [GDPR art. 7(2)]
- [ ] A withdrawal function is present when the right of withdrawal applies; the pages read describe none in the core, so build it as [../consumer/withdrawal-function.md](../consumer/withdrawal-function.md) says, in a custom module and the child theme [CRD 11a]
- [ ] Any announcement of a price reduction indicates the prior price defined by the directive; how PrestaShop computes the struck-through price was not read, so test it on a product with a price history [PID art. 6a]

**`ps_legalcompliance` ("Legal Compliance", the remake for 1.7 of `advancedeucompliance`, itself end-of-life).** Its repository is archived: the README says the module is no longer maintained. Its source (version 3.0.2, declared for PrestaShop 1.7.3.0 and later) registers hooks on prices, cart, checkout summary, footer, emails and terms (`displayProductPriceBlock`, `displayCheckoutSummaryTop`, `termsAndConditions`, `displayOverrideTemplate`, `actionEmailAddAfterContent` among them) and offers labels such as the tax and shipping mentions, the previous-price label, the price per unit, delivery time information and revocation terms; it switches the final summary on. Its description speaks of helping merchants with e-commerce law, which is not a guarantee. An unmaintained module falls under the rule below.

- [ ] Each module is actively maintained and comes from the official directory or a vendor whose updates are followed; report an archived module such as this one, by name, with what would replace its functions [ANSSI WEB R62]

## 7. Security settings and HTTP headers

**Debug mode.** `_PS_MODE_DEV_` is defined in `config/defines.inc.php` and can be switched with "Debug mode" in Advanced parameters > Performance. The documentation tells to run production with `_PS_MODE_DEV_` and `_PS_DEBUG_PROFILING_` (the profiler) set to `false`, and notes that default settings keep server error messages from customers.

- [ ] Production shows no debug output: `_PS_MODE_DEV_` and `_PS_DEBUG_PROFILING_` are `false` in `config/defines.inc.php` [ANSSI WEB R59]
- [ ] Prefer to check that the server configuration does not carry the `_TOKEN_` environment variable that the documentation gives to disable the back-office token (`SetEnv _TOKEN_ disabled`) [best practice]

**Response headers.** Not verified: the developer documentation pages read describe no hook or setting to add security response headers. A pull request on `PrestaShop/PrestaShop` proposes native Content Security Policy and security headers behind a feature flag; on the day it was read it was open, not merged, and targeted a later minor version, so nothing in it can be relied on. Set headers at the web server, see [../security/headers-configs.md](../security/headers-configs.md).

- [ ] Every HTML response carries a `Content-Security-Policy` header, set at the web server in front of PrestaShop [ANSSI WEB R13, R14]
- [ ] The CSP is tested in Report-Only mode with the theme and every module first: the asset API allows inline scripts and styles (`inline` option) and modules add elements to the `<head>` through `displayHeader` [ANSSI WEB R15]

When a module needs `'unsafe-inline'` or `'unsafe-eval'`, report it by name as [../security/modules/cms.md](../security/modules/cms.md) section 4 says.

## 8. Accessibility of the default themes

What the developer documentation (version 9) states:

- Hummingbird is the default theme for PrestaShop 9.1 and later and replaces Classic, which is deprecated for new development in PrestaShop 9; it uses Bootstrap 5.3.
- The theme guidelines apply to new themes, say existing themes are not required to comply, and are aligned with WCAG 2.2 AA.
- The Hummingbird accessibility page says the theme is "built to comply with EAA-relevant standards" (PrestaShop developer documentation). It gives no audit, no conformance statement and no list of failures.
- Nothing was read about the accessibility of Classic: not verified.

A theme's own claim is not a test result. The content, the modules, the consent banner and every override change the outcome.

- [ ] Report the theme's accessibility as "not tested" until the rendered shop (home, listing, product, cart, each checkout step, account, contact) has passed this skill's checks with the modules enabled as in production [best practice]
- [ ] Everything added to the theme (consent banner, withdrawal function, overridden checkout templates) follows [../accessibility/rules.md](../accessibility/rules.md), whatever the parent theme does [best practice]

Versions of the standards in force are in [../regulatory-status.md](../regulatory-status.md).

## 9. Not verified on the pages read

- Whether the core or a native module ships a tracker consent mechanism.
- The order in which modules run on `actionFrontControllerSetMedia`, and how hook positions are changed.
- How the checkout order button label is changed from the back-office translation screen.
- Whether `ps_legalcompliance` changes the order button label, and whether it works on PrestaShop 8 or 9.
- How PrestaShop computes the reference price shown for a reduction.
- Session cookie attributes (`Secure`, `HttpOnly`, `SameSite`) and the HTTPS setting: check them with the header checker after sign-in.
- Any hook or setting for response headers in a released version.
- The accessibility of the Classic theme, and any audit of Hummingbird.
- The exact return value `psgdpr` expects from `actionDeleteGDPRCustomer` in its current version (the how-to dates from 2018).

## 10. In the report

List: the PrestaShop version, the active theme and its parent, the checkout in use, every module with its version and maintenance status, every file under `/override/` and every template overridden in the theme, where each third-party tag is added and how it is held until consent, which modules implement the GDPR hooks, how headers are set, and each item of section 9 that was checked on the shop or left "not verified".
