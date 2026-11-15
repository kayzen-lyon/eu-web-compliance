# WordPress: where to act

Load this file when the site runs on WordPress (you find `wp-config.php`, a `wp-content/` folder, a theme with `style.css` and `functions.php`) and you have to apply rules of this skill to it. It adds no legal rule: it says in which file, hook or admin screen each existing rule is applied. The security checklist for any CMS (extensions, updates, accounts, exposure, backups) is in [../security/modules/cms.md](../security/modules/cms.md) and is not repeated here.

## How to use this file

1. Find the task in the table below and read only that section. Each rule line repeats a rule of another file of this skill, with the same source tag, and says where it lands in WordPress; the rule itself, its reasons and its limits are in the file linked in the section.
2. Technical facts about WordPress (hook names, signatures, behaviour) were read on the official pages listed in section 10, on the date given there. A hook or function not named in this file was not verified: read its reference page before using it, do not write it from memory.
3. Sentences marked "observation" and rules tagged `[best practice]` have no official source. They are never obligations.
4. Code blocks are illustrations to adapt (prefix, handles, purposes). They only use functions and hooks verified for this file.
5. Dates, durations and versions of legal texts are in [../regulatory-status.md](../regulatory-status.md).

| Task | Section |
|------|---------|
| Any change to a WordPress site | 1 |
| Adding or auditing a script, a pixel, an embed | 2, then 3 if the WP Consent API plugin is present |
| Security headers | 4 |
| Privacy policy page, export and erasure of personal data | 5 |
| WooCommerce checkout button | 6 |
| Site built with a page builder | 7 |
| Choosing or auditing a theme for accessibility | 8 |

## 1. Where custom code lives

Before editing, note whether the active theme is a parent or a child, and ask the owner about snippets pasted in admin screens, which the repository does not show. A child theme extends a parent theme: the parent can then be updated without losing the modifications. Its only mandatory file is `style.css`, whose header has a `Template` field equal to the parent theme's folder name. The child's `functions.php` does not replace the parent's: both are loaded, the child's first, so copying a parent function into the child causes a duplicate-function error. A template file with the same name as a parent's file overrides it.

- [ ] The core and third-party extensions are never edited; changes go into a child theme or a custom extension [ANSSI WEB R63]
- [ ] Put code that must survive a change of theme (consent gating, headers, personal data exporters) in a small custom plugin, and presentation changes in the child theme [best practice]

## 2. Scripts and styles: hold a tag until consent

Rules applied here: [../privacy/trackers.md](../privacy/trackers.md) section 4 and [../privacy/consent.md](../privacy/consent.md). Reference banner and loader: [../../templates/consent/README.md](../../templates/consent/README.md).

### 2.1 How WordPress prints scripts

| Mechanism | What the official page says | Use for this skill |
|-----------|-----------------------------|--------------------|
| `wp_enqueue_script( $handle, $src, $deps, $ver, $args )` | Registers and prints a script. `$args` is an array with `in_footer` (bool) and `strategy` (`'defer'` or `'async'`), or a boolean meaning "in footer" (array form since 6.3.0) | The only way a script should be added by theme or plugin code |
| `wp_enqueue_scripts` action | The hook to enqueue front-end scripts and styles. `admin_enqueue_scripts` and `login_enqueue_scripts` are the hooks for the administration and login screens | Call `wp_enqueue_script()` and `wp_enqueue_style()` inside it, never outside a hook |
| `script_loader_tag` filter | Filters the HTML `<script>` tag of an enqueued script; arguments `$tag`, `$handle`, `$src` (since 4.1.0) | Make a tag inert until consent, per handle |
| `wp_script_attributes` filter | Filters the attributes (key-value array) of script tags built by `wp_get_script_tag()` (since 5.7.0) | Add an attribute such as a CSP nonce |
| `wp_inline_script_attributes` filter | Same for inline tags built by `wp_get_inline_script_tag()`; arguments `$attributes`, `$data` (since 5.7.0) | Add a CSP nonce to inline scripts printed through that function |
| `wp_dequeue_script( $handle )` | Removes a previously enqueued script (since 3.1.0). The reference page does not say on which hook to call it | Remove a tracker a plugin enqueues; it must run after that plugin's enqueue call |
| `wp_head`, `wp_footer` actions | Fired by `wp_head()` inside `<head>` and by `wp_footer()` near the closing `<body>` tag; both depend on the theme calling them | Where plugins and "header and footer scripts" options print raw markup |

Observation: a `<script>` printed directly on `wp_head` or `wp_footer`, pasted in a theme or plugin option, or written in a template file, is not an enqueued script, so `script_loader_tag` never sees it. Find these in the inventory ([../privacy/trackers.md](../privacy/trackers.md) section 2) and confirm with the runtime check, on a page served the way visitors get it.

### 2.2 Rules

- [ ] A script whose purpose needs consent is not executed before consent for that purpose: it is not just "disabled" after loading, it is not loaded. Declare it as inert (`<script type="text/plain" data-consent-purpose="...">`) or load it from code that runs only after consent [ePrivacy art. 5(3)]
- [ ] A tag manager that itself sets or reads trackers, or that loads trackers, is loaded only after consent, or configured so that it loads nothing that needs consent before the choice; verify the result at run time, not in its settings [ePrivacy art. 5(3)]
- [ ] An iframe from a provider that sets or reads trackers is replaced by a placeholder until consent; the placeholder explains what loading it involves and offers a button to allow it [CNIL FAQ embedded content]
- [ ] Put a control that reopens the choices on every page, with a descriptive name such as "Manage cookies", in a place where visitors expect it (footer or a persistent icon) [CNIL recommendation § 3]
- [ ] Prefer a tracker plugin's own "wait for consent" setting or its documented integration over rewriting its tags; when you rewrite, re-test after each update of that plugin [best practice]
- [ ] Prefer gating in the browser (inert tag activated by the consent loader) to a PHP condition on the visitor's choice when pages may be served from a page cache [best practice]

In WordPress the "Manage cookies" control goes in the footer template or footer block of the child theme, so that it is on every page; embeds inserted by editors in post content (video, map, social post) are iframes and need the placeholder too.

### 2.3 Illustration: make an enqueued script inert until consent

This makes chosen handles inert for the reference loader of this skill, which recreates them once the purpose is accepted. `WP_HTML_Tag_Processor` (since 6.2.0) edits attributes without string replacement.

```php
<?php
// Illustration. Adapt the prefix, the handles and the purposes to the tracker inventory.
// Map: script handle => consent purpose declared in the consent settings dialog.
function myprefix_consent_purposes() {
	return array(
		'myprefix-analytics' => 'analytics',
	);
}

add_action( 'wp_enqueue_scripts', 'myprefix_enqueue_assets' );
function myprefix_enqueue_assets() {
	wp_enqueue_script(
		'myprefix-analytics',
		get_theme_file_uri( 'js/analytics.js' ), // placeholder file of the child theme
		array(),
		'1.0.0',
		array( 'in_footer' => true )
	);
}

add_filter( 'script_loader_tag', 'myprefix_hold_until_consent', 10, 3 );
function myprefix_hold_until_consent( $tag, $handle, $src ) {
	$purposes = myprefix_consent_purposes();
	if ( ! isset( $purposes[ $handle ] ) ) {
		return $tag;
	}
	$processor = new WP_HTML_Tag_Processor( $tag );
	// Every script tag printed for this handle becomes inert.
	while ( $processor->next_tag( 'script' ) ) {
		$processor->set_attribute( 'type', 'text/plain' );
		$processor->set_attribute( 'data-consent-purpose', $purposes[ $handle ] );
	}
	return $processor->get_updated_html();
}
```

After the change, run the checks of [../privacy/trackers.md](../privacy/trackers.md) section 5 on the real site: before any choice, after refusal, after acceptance, after withdrawal.

## 3. WP Consent API (feature plugin)

The plugin "WP Consent API" (wordpress.org plugin directory; repository `WordPress/wp-consent-level-api`) is not part of core. It is a shared interface: a consent management plugin writes the visitor's choice, other plugins read it. By itself it shows no banner and blocks nothing; third-party scripts and iframes still have to be blocked by the consent tool.

| Element | What the plugin's documentation says |
|---------|--------------------------------------|
| Categories | `functional`, `preferences`, `statistics`, `statistics-anonymous`, `marketing`; the list can be filtered with `wp_consent_categories` |
| Consent type | Set by the consent management plugin through the `wp_get_consent_type` filter (PHP) or `window.wp_consent_type` (JavaScript, followed by a `wp_consent_type_defined` event on `document`); documented values `optin` and `optout` |
| Reading, PHP and JavaScript | `wp_has_consent( 'marketing' )` returns whether the category may be used |
| Writing, JavaScript | `wp_set_consent( 'marketing', 'allow' )`; the visitor's choice is described as not set, allow or deny |
| Reacting to a change | `wp_listen_for_consent_change` event on `document`; `event.detail` maps each changed category to its new value |
| Per service | `wp_has_service_consent()`, `wp_is_service_denied()`, `wp_set_service_consent( $service, $bool )` in PHP and JavaScript |
| Declaring a plugin as compliant | `add_filter( "wp_consent_api_registered_{$plugin}", '__return_true' )` with `$plugin = plugin_basename( __FILE__ )` |
| Declaring cookies | `wp_add_cookie_info()` on `plugins_loaded`, with in order the cookie name, the service, the category, the expiry and the purpose text; read back with `wp_get_cookie_info()` |

Behaviour to know before relying on it: with type `optin`, a category is granted only if the visitor chose "allow"; with `optout`, it is granted when the visitor allowed it or made no choice; when no consent management plugin sets a type, every category is reported as granted.

- [ ] Without a positive action, treat the visitor as having refused, and run nothing that needs consent [CNIL guidelines § 27; CNIL recommendation § 2]
- [ ] Ask consent separately for each distinct purpose; a global "Accept all" is allowed only if every purpose was presented first and a per-purpose choice remains available [CNIL recommendation § 2.3; CNIL guidelines § 19]
- [ ] Do not describe any tool as "exempt", "CNIL-approved" or "CNIL-compliant": the CNIL publishes no list of exempt tools (vendors only self-assess), and the outcome depends on the configuration [CNIL FAQ exempt tools]
- [ ] Code that reads `wp_has_consent()` first checks that the function exists and that a consent tool sets the type to `optin`; otherwise it behaves as refused [best practice]

In WordPress terms: the first rule means the consent type must be `optin` for visitors covered by the skill's rules, and a site where the API is active without a consent tool grants everything. The second means the five categories must be mapped to the purposes shown in the banner, a mapping the owner validates; several purposes merged into `marketing` are still presented separately to the visitor. The third applies to the category name `statistics-anonymous`: the name proves nothing, check the tool against [../privacy/trackers.md](../privacy/trackers.md) section 3.3.

```php
<?php
// Illustration, in a custom plugin's main file.
$myprefix_plugin = plugin_basename( __FILE__ );
add_filter( "wp_consent_api_registered_{$myprefix_plugin}", '__return_true' );

function myprefix_marketing_allowed() {
	// No Consent API: behave as refused.
	return function_exists( 'wp_has_consent' ) && wp_has_consent( 'marketing' );
}
```

```js
// Illustration: start a marketing feature only when the category becomes allowed.
document.addEventListener( 'wp_listen_for_consent_change', function ( event ) {
	if ( event.detail && event.detail.marketing === 'allow' ) {
		startMarketingFeature(); // placeholder: your own function
	}
} );
```

The reference banner of this skill does not call the WP Consent API. Connecting the two (calling `wp_set_consent()` when the visitor chooses) is custom work to test like any consent code.

## 4. Security headers from PHP

Values and CSP strategy: [../security/headers-configs.md](../security/headers-configs.md). Setting headers on the web server or host ([../security/configs/web-servers.md](../security/configs/web-servers.md)) is the first choice; PHP is the fallback when the server cannot be configured.

| Hook | What the official page says |
|------|-----------------------------|
| `wp_headers` filter | Filters the associative array of HTTP headers before they are sent; arguments `$headers`, `$wp`; applied by `WP::send_headers()` (since 2.8.0) |
| `send_headers` action | Fires once the requested HTTP headers for caching, content type, etc. have been sent; receives the `WP` instance; used to add headers to the response (since 2.1.0) |

```php
<?php
// Illustration, in a custom plugin. Values come from the shared header set.
add_filter( 'wp_headers', 'myprefix_security_headers' );
function myprefix_security_headers( $headers ) {
	return array_merge(
		$headers,
		array(
			'X-Content-Type-Options' => 'nosniff',
			'Referrer-Policy'        => 'strict-origin-when-cross-origin',
			'X-Frame-Options'        => 'DENY',
		)
	);
}
```

Observation (not stated by the reference pages, which only say the filter is applied by `WP::send_headers()`): these hooks act on responses that PHP generates through that method. Expect files served directly by the web server (images, CSS, JavaScript, uploads) and pages replayed by a page cache or a CDN not to carry them, and do not assume the administration, login, REST or AJAX responses do. Check each kind of response as [../security/headers-configs.md](../security/headers-configs.md) section "Verify" describes.

- [ ] HSTS, Content Security Policy and secure session cookies are in place, as the web guide recommends [ANSSI WEB R2, R14, R30]
- [ ] The CSP is tested with the theme and every extension in Report-Only mode first: CMS themes and page builders often rely on inline scripts and styles [ANSSI WEB R15]

A per-response CSP nonce can be added to script tags with the `wp_script_attributes` and `wp_inline_script_attributes` filters. Observation: scripts that a theme, a plugin or a page builder prints without those functions do not get the nonce and will be blocked; the Report-Only phase shows which. When one of them is the reason for `'unsafe-inline'`, report it by name.

## 5. Privacy tools in core

Rules applied here: [../privacy/data-subject-rights.md](../privacy/data-subject-rights.md); the policy text itself: [../documents/privacy-policy.md](../documents/privacy-policy.md).

| Tool | Where | What the official pages say |
|------|-------|-----------------------------|
| Privacy policy page | Settings, Privacy | An administrator creates a page from a template or designates an existing one. The link is shown on the login and registration pages; linking it from every other page is up to the site. Theme functions: `get_privacy_policy_url()`, `the_privacy_policy_link()`, `get_the_privacy_policy_link()` |
| Suggested policy text | Privacy Policy Guide screen | A plugin or theme suggests text with `wp_add_privacy_policy_content( $plugin_name, $policy_text )`, called on `admin_init` |
| Export | Tools, Export Personal Data | The administrator enters a username or email address; the person confirms by an emailed link; the administrator sends or downloads a `.zip`. The page describes the archive as containing an `index.html`, and says it only gathers data from WordPress and participating plugins |
| Erasure | Tools, Erase Personal Data | Same confirmation flow; erasure is permanent, has no confirmation prompt in the admin, does not touch backups, and only covers WordPress and participating plugins. Erasing personal data is not deleting the user account |
| Exporter hook | `wp_privacy_personal_data_exporters` filter | Each entry has `exporter_friendly_name` and `callback`. The callback receives `( $email_address, $page = 1 )` and returns `array( 'data' => $items, 'done' => $bool )`; each item has `group_id`, `group_label`, `item_id` and `data`, a list of `name` and `value` pairs |
| Eraser hook | `wp_privacy_personal_data_erasers` filter | Each entry has `eraser_friendly_name` and `callback`. The callback receives `( $email_address, $page = 1 )` and returns `items_removed`, `items_retained`, `messages` (array) and `done` |

- [ ] Give people a simple way to exercise their rights: a contact address or form dedicated to data protection requests, named in the privacy policy [GDPR art. 12(2); GDPR art. 13(2)(b)]
- [ ] Provide a copy of the personal data processed about the person [GDPR art. 15(3)]
- [ ] For data the person provided, processed on the basis of consent or contract by automated means, offer an export in a structured, commonly used, machine-readable format (JSON or CSV, not a PDF or a screenshot) [GDPR art. 20(1)]
- [ ] Delete or anonymise the person's data in every store the site controls: database and replicas, search index, caches, file storage (avatars, uploads), newsletter and email tools, analytics with user identifiers, support tools [GDPR art. 17(1)]
- [ ] For each custom table, post type or user meta that holds personal data, register an exporter and an eraser, and test both with a test account [best practice]
- [ ] List for the owner the plugins that store personal data and register no exporter or eraser: the core tools do not cover them [best practice]

In WordPress terms: the core tools are run by an administrator after an emailed confirmation; they are not a self-service function in the visitor's account, and they do not replace the contact point. Compare the generated archive with the format rule above before presenting it as a portability export. Never write the policy text from the suggestions alone: they describe what a plugin does by default, not what this site does.

```php
<?php
// Illustration: register an exporter for data stored by a custom plugin.
add_filter( 'wp_privacy_personal_data_exporters', 'myprefix_register_exporter' );
function myprefix_register_exporter( $exporters ) {
	return array_merge(
		$exporters,
		array(
			'myprefix-plugin' => array(
				'exporter_friendly_name' => __( 'My plugin data', 'myprefix' ),
				'callback'               => 'myprefix_export_by_email',
			),
		)
	);
}

function myprefix_export_by_email( $email_address, $page = 1 ) {
	$items = array(); // Fill from the plugin's own store, in pages, for this email address only.
	return array(
		'data' => $items,
		'done' => true,
	);
}
```

## 6. WooCommerce: the order button

Rules applied here: [../consumer/online-sales.md](../consumer/online-sales.md) sections 3 and 4; reference markup: [../../templates/consumer/order-button.html](../../templates/consumer/order-button.html).

| Checkout | Where the label is set | Read on |
|----------|------------------------|---------|
| Checkout block | JavaScript filter `placeOrderButtonLabel`, registered with `registerCheckoutFilters` taken from `window.wc.blocksCheckout`; the callback receives `( defaultValue, extensions )` and returns the label string | WooCommerce developer documentation |
| Classic (shortcode) checkout | PHP filter `woocommerce_order_button_text` (default "Place order"); the whole button passes through `woocommerce_order_button_html` in the template `checkout/payment.php` | Source code of the official WooCommerce repository, not a documentation page |

- [ ] The button that places the order is labelled only with "order with obligation to pay" or a corresponding unambiguous formulation that says that placing the order entails an obligation to pay [CRD art. 8(2)]
- [ ] In French, the label is "commande avec obligation de paiement" or an equally unambiguous wording [C. conso L. 221-14]
- [ ] The accessible name of the button is the visible label, word for word; no `aria-label` that says something else ("Next", "Continue") [WCAG 2.5.3; RGAA 11.9]
- [ ] Find out which checkout the site uses (block or classic) before writing the filter, then read the rendered button with each payment method selected, in each language of the site [best practice]

```php
<?php
// Illustration, classic checkout. The wording comes from online-sales.md section 4.
add_filter( 'woocommerce_order_button_text', 'myprefix_order_button_label' );
function myprefix_order_button_label( $label ) {
	return __( 'Order with obligation to pay', 'myprefix' );
}
```

Not verified for this file: whether a payment extension can replace the label after these filters, how the summary before the button is built, WooCommerce's own privacy and consent settings, and anything about the withdrawal function. Check them on the running site and report them as "not tested" otherwise.

## 7. Page builders

Nothing in this section was read in a vendor's documentation; it is generic and applies to any visual builder (Elementor, Divi, WPBakery and similar). Read the vendor's own documentation before stating what a given builder does.

- [ ] Inventory the builder's own injection points (custom code areas, HTML and embed widgets, site-wide header and footer code, integrations): scripts placed there may bypass the enqueue system and the gating of section 2 [best practice]
- [ ] Treat video, map and social widgets of a builder as embeds: check at run time what they request before consent [best practice]
- [ ] Test the pages the builder generates with the accessibility checker and by hand; the widgets' markup is not under your control, so report defects you cannot fix with the widget's name [best practice]

## 8. Accessibility: the "accessibility-ready" theme tag

The WordPress themes team lists what a theme needs in order to use the `accessibility-ready` tag in the theme directory: a skip link, landmarks with meaningful roles and names, keyboard navigation, controls with accessible names, roles and states, labelled form fields, a meaningful heading structure, underlined links in text, no ambiguous link text, sufficient contrast of text and controls, text alternatives, accessible audio, video and animations, support for reflow, resize and text spacing, no unexpected change of context, no new window or tab without warning, accessible content on hover or focus, an accessibility statement, no recommended or required inaccessible plugin, and support for screen reader text. The page does not state a WCAG conformance level for the tag.

The rules to apply are those of [../accessibility/rules.md](../accessibility/rules.md); the tag changes none of them. Two of them, as located in a WordPress theme:

- [ ] A link placed at the very start of the page leads to the main content, so that repeated blocks can be skipped [WCAG 2.4.1; RGAA 12.7]
- [ ] The page has one visible `<main>` for its main content, a `<header>` for the banner, `<nav>` for navigation areas and a `<footer>` [WCAG 1.3.1; RGAA 9.2, 12.6]
- [ ] Treat the tag as a starting point when choosing a theme, never as a test result: it covers the theme as reviewed, not the content, the plugins, the page builder or later customisation [best practice]

The skip link and landmarks live in the theme's header and footer templates (or template parts of a block theme): fix them in the child theme. Content defects (headings, alternatives, link texts) are fixed in the editor by the people who write the content; list them for the owner.

## 9. In the report

Add to the items of [../security/modules/cms.md](../security/modules/cms.md) section 7: where custom code was put (child theme, custom plugin); each script handle made inert and its purpose; scripts found outside the enqueue system and who must remove them; whether the WP Consent API is active, which tool sets the consent type and to what; how headers are set and which response types were checked; which stores of personal data have an exporter and an eraser; which checkout WooCommerce uses and the label read on the rendered page; everything marked "not verified" above that was not tested on the site.

## 10. Documentation read for this file (2026-11-15)

- WordPress developer reference: `https://developer.wordpress.org/reference/functions/wp_enqueue_script/`, `https://developer.wordpress.org/reference/functions/wp_dequeue_script/`, `https://developer.wordpress.org/reference/functions/wp_get_inline_script_tag/`, `https://developer.wordpress.org/reference/functions/wp_add_privacy_policy_content/`
- Hooks: `https://developer.wordpress.org/reference/hooks/wp_enqueue_scripts/`, `https://developer.wordpress.org/reference/hooks/script_loader_tag/`, `https://developer.wordpress.org/reference/hooks/wp_script_attributes/`, `https://developer.wordpress.org/reference/hooks/wp_inline_script_attributes/`, `https://developer.wordpress.org/reference/hooks/wp_head/`, `https://developer.wordpress.org/reference/hooks/wp_footer/`, `https://developer.wordpress.org/reference/hooks/send_headers/`, `https://developer.wordpress.org/reference/hooks/wp_headers/`, `https://developer.wordpress.org/reference/hooks/wp_privacy_personal_data_exporters/`, `https://developer.wordpress.org/reference/hooks/wp_privacy_personal_data_erasers/`
- HTML API: `https://developer.wordpress.org/reference/classes/wp_html_tag_processor/` and its `set_attribute/` and `get_updated_html/` pages
- Handbooks: `https://developer.wordpress.org/themes/advanced-topics/child-themes/`, `https://developer.wordpress.org/plugins/privacy/adding-the-personal-data-exporter-to-your-plugin/`, `https://developer.wordpress.org/plugins/privacy/adding-the-personal-data-eraser-to-your-plugin/`, `https://developer.wordpress.org/plugins/privacy/suggesting-text-for-the-site-privacy-policy/`
- User documentation: `https://wordpress.org/documentation/article/settings-privacy-screen/`, `https://wordpress.org/documentation/article/tools-export-personal-data-screen/`, `https://wordpress.org/documentation/article/tools-erase-personal-data-screen/`
- WP Consent API: `https://wordpress.org/plugins/wp-consent-api/`, `https://github.com/WordPress/wp-consent-level-api`
- Themes team: `https://make.wordpress.org/themes/handbook/review/accessibility/required/`
- WooCommerce: `https://developer.woocommerce.com/docs/block-development/extensible-blocks/cart-and-checkout-blocks/filters-in-cart-and-checkout/checkout-and-place-order-button/`; source files `plugins/woocommerce/includes/wc-template-functions.php` and `plugins/woocommerce/templates/checkout/payment.php` in `https://github.com/woocommerce/woocommerce`
