# Web security baseline

The security rules to apply to any website you build or change. They come from the ANSSI guide for browser-side website security (ANSSI-PA-009), the ANSSI guides on TLS, authentication and cryptography, and the OWASP Top 10 for what ANSSI does not cover.

## How to use this file

1. Read the section that matches what you are about to write. Each section says whether it applies to a **static site** (HTML, CSS and JavaScript files served as they are) or only when there is a **backend** (server code, a database, user accounts, an API).
2. A line starting with `- [ ]` is a rule. Its source is in square brackets at the end:
   - `ANSSI WEB Rn` is recommendation n of ANSSI-PA-009 v2.0; `ANSSI TLS`, `ANSSI MFA`, `ANSSI CRYPTO` and `ANSSI AI` are the other ANSSI guides listed in [README.md](README.md).
   - `OWASP Ann` is a category of the OWASP Top 10 edition named in [../regulatory-status.md](../regulatory-status.md). It names the risk the rule addresses, not a requirement written by OWASP.
   - `GDPR art. 32` is the legal anchor described in [README.md](README.md).
   - `[best practice]` has no official source. Apply it when it costs nothing and never report its absence as a breach of a rule.
3. A rule with a dash after its number (`R14-`) is the guide's own fallback, for when the main recommendation is out of reach.
4. Numbers (key sizes, lifetimes, entropy, password parameters) are not repeated here. They are in [anssi-values.md](anssi-values.md), which is the only place to read them from. Do not write a cryptographic value from memory.
5. Header values are checked by a script against [headers-baseline.json](headers-baseline.json). Ready-made configurations per host are in [headers-configs.md](headers-configs.md).
6. The ANSSI guides say their recommendations are not normative. This skill applies them as its baseline. Do not tell the user that a rule here is a legal obligation unless its tag is `GDPR`.

| Task | Read |
|------|------|
| Any site, before going live | Sections 1, 2, 7, 9 and 10 |
| A form, a search box, a comment field | Sections 4 and 2 |
| Login, accounts, sessions | Section 3, then [modules/authentication.md](modules/authentication.md) |
| Adding an analytics, video, chat or payment script | Section 6 and the CSP part of section 2 |
| `package.json`, `composer.json`, lock files, CI | Section 7 |
| An API, a `fetch` to another domain, a webhook | Section 11 |
| File uploads | [modules/file-uploads.md](modules/file-uploads.md) |
| WordPress, Drupal, Joomla or another CMS | [modules/cms.md](modules/cms.md) |
| Reviewing code you or another AI generated | Section 12 and [modules/ai-generated-code.md](modules/ai-generated-code.md) |

## 1. Transport: HTTPS, HSTS, TLS

Scope: every site, static or not. HTTPS protects the integrity of the page itself: on plain HTTP, a public Wi-Fi hotspot or any machine on the path can inject scripts into a static brochure site as easily as into a shop.

- [ ] Every page and every resource is served over HTTPS, even when the site handles no sensitive data, and the TLS settings follow the ANSSI TLS guide [ANSSI WEB R1]
- [ ] Plain HTTP requests are answered with a permanent redirect to the same URL over HTTPS, and nothing else is served on HTTP [ANSSI WEB R1]
- [ ] Responses over HTTPS carry `Strict-Transport-Security` with a `max-age` of at least one year (31536000 seconds, the value in the guide's example) [ANSSI WEB R2]
- [ ] `includeSubDomains` is added once every subdomain of the domain is served over HTTPS; check with the owner first, because a subdomain still on HTTP becomes unreachable [ANSSI WEB R2]
- [ ] `preload` is added only when the owner decides to submit the domain to the browsers' preload list; it is hard to undo, so never add it on your own initiative [best practice]
- [ ] The server accepts TLS 1.3 and TLS 1.2 only; SSLv2, SSLv3, TLS 1.0 and TLS 1.1 are disabled [ANSSI TLS R3, R4]
- [ ] TLS 1.2 uses only the cipher suites listed in [anssi-values.md](anssi-values.md), all with forward secrecy (ECDHE, or DHE as a fallback) and an authenticated mode (GCM, CCM, ChaCha20-Poly1305) [ANSSI TLS R6, R7, R10]
- [ ] When clients are not under your control, the server's cipher order wins over the client's [ANSSI TLS R13]
- [ ] TLS compression is off, session tickets live 24 hours at most, and 0-RTT data is refused by the server [ANSSI TLS R19, R20, R23]
- [ ] The certificate is signed with a SHA-2 function, uses a key of the size given in [anssi-values.md](anssi-values.md), and is renewed automatically before it expires [ANSSI TLS R24, R26]
- [ ] Someone (owner or host) watches Certificate Transparency logs for certificates issued for the domain [ANSSI WEB R3]
- [ ] TLS software (web server, OpenSSL or equivalent, hosting image) is kept up to date [ANSSI TLS R2]

On managed hosts (Netlify, Vercel, Cloudflare Pages and the like), TLS versions and suites are set by the host, not by you. Do not claim they follow the ANSSI TLS guide: list them as "to verify with an external TLS test" in the report.

## 2. Browser-side protections (HTTP headers)

Scope: every site. These headers cost nothing on a static site and block whole classes of attacks (script injection, clickjacking, data leaking through the `Referer`). Set them on the server or host, not in `<meta>` tags, except where a host cannot set headers.

### Content Security Policy (CSP)

A CSP tells the browser which origins may supply scripts, styles, images and frames. If an attacker manages to inject markup, the browser refuses to run it.

- [ ] Every HTML response carries a `Content-Security-Policy` header [ANSSI WEB R13, R14]
- [ ] If the host cannot set headers, the policy goes in a `<meta http-equiv="Content-Security-Policy">` placed first in `<head>`; this form cannot carry `frame-ancestors` or reporting, so say so in the report [ANSSI WEB R14-]
- [ ] The policy contains `default-src`, and its value is not `*` [ANSSI WEB R16]
- [ ] The policy contains none of `'unsafe-inline'`, `'unsafe-eval'` or `data:` [ANSSI WEB R15]
- [ ] Inline scripts and styles are moved to external files; when one inline block must stay, it is allowed by its hash (`'sha256-…'`) or by a nonce that changes on every response [ANSSI WEB R5, R15]
- [ ] A nonce is used only when a server builds each response; a nonce written in a static file or a `_headers` file is the same for every visitor and protects nothing [best practice]
- [ ] `frame-ancestors` is set to `'none'`, or to `'self'` or a short list of origins when the site must be framed [ANSSI WEB R17]
- [ ] `object-src 'none'` and `base-uri 'self'` (or `'none'`) are set, because `default-src` does not cover `base-uri` and plugins are not needed [best practice]
- [ ] `form-action` lists where the site's forms may post, because `default-src` does not cover it [best practice]
- [ ] `connect-src` lists the origins the page's scripts may call, and no other [ANSSI WEB R20, R37]
- [ ] A new or changed policy is first deployed as `Content-Security-Policy-Report-Only`, checked in the browser console on every page, then switched to enforcing [best practice]
- [ ] Before adding a reporting endpoint (`report-to`), the owner has weighed what the reports reveal and who receives them, since reports contain URLs visited by users [ANSSI WEB R19]

Third-party scripts loaded after consent (analytics, maps, video) need their origins in `script-src`, `connect-src`, `img-src` or `frame-src`. Add exactly the origins their documentation lists, never a wildcard to make an error go away.

### Framing, referrer, MIME type, permissions, isolation

- [ ] HTML responses carry `X-Frame-Options: DENY` (or `SAMEORIGIN` when the site frames itself), matching `frame-ancestors`, for browsers without CSP level 2 [ANSSI WEB R18]
- [ ] Every response carries `Referrer-Policy` with one of `no-referrer`, `same-origin`, `strict-origin` or `strict-origin-when-cross-origin`; `unsafe-url` and the browser default are not used [ANSSI WEB R21]
- [ ] A link that must send less (or more) than the site policy uses the `referrerpolicy` attribute on that element [ANSSI WEB R22]
- [ ] Every response carries a `Content-Type` that names the real type, with `charset=utf-8` for text [ANSSI WEB R6]
- [ ] Every response carries `X-Content-Type-Options: nosniff`, so a file uploaded as text can never be run as a script [OWASP A02]
- [ ] HTML responses carry `Cross-Origin-Opener-Policy: same-origin`; use `same-origin-allow-popups` only for a page that opens a payment or sign-in popup that must talk back [ANSSI WEB R46]
- [ ] Responses carry `Cross-Origin-Resource-Policy: same-origin` (or `same-site`) unless other sites are meant to embed the resource [best practice]
- [ ] HTML responses carry a `Permissions-Policy` that turns off the browser features the site does not use, for example `camera=(), microphone=(), geolocation=()` [best practice]
- [ ] `X-XSS-Protection` is absent or set to `0`; the old filter it controls is retired and CSP replaces it [ANSSI WEB section 5.2.1]
- [ ] Links with `target` carry `rel="noopener"` (or `noreferrer`), and `window.open` with a target passes `noopener` [ANSSI WEB R45]

`X-XSS-Protection: 0` is the value the ANSSI guide gives in a warning box of section 5.2.1, not in a numbered recommendation. `X-Content-Type-Options` and `Permissions-Policy` do not appear as recommendations in the ANSSI guide.

## 3. Cookies and sessions

Scope: static sites that set cookies (consent choice, language) and every site with a backend. Who may set a cookie at all, before consent, is decided by the privacy part of this skill, not here.

- [ ] Every cookie carries `Secure` once the site is HTTPS-only [ANSSI WEB R31]
- [ ] A cookie that JavaScript does not need to read carries `HttpOnly` [ANSSI WEB R29]
- [ ] (backend) A session cookie always carries `HttpOnly` [ANSSI WEB R30]
- [ ] Every cookie carries `SameSite=Strict`, or `SameSite=Lax` when it must follow a link from another site and no state-changing action is reachable by `GET` [ANSSI WEB R32]
- [ ] (backend) A session cookie has `SameSite` set to `Strict` or `Lax`, never `None` and never absent [ANSSI WEB R33]
- [ ] Cookies have no `Domain` attribute unless they must reach subdomains, and a `Path` as narrow as the area that uses them (for example `/admin` for an admin session) [ANSSI WEB R28]
- [ ] Prefer the `__Host-` name prefix for session cookies: the browser then refuses the cookie unless it is `Secure`, has `Path=/` and no `Domain` [best practice]
- [ ] Cookies hold a session identifier or a low-value preference, never personal or sensitive data in clear [ANSSI WEB R26]
- [ ] `localStorage`, `sessionStorage` and IndexedDB hold only data whose loss or disclosure has no consequence (preferences, cache); tokens and personal data do not go there [ANSSI WEB R23, R24]
- [ ] Web SQL Database is not used [ANSSI WEB R25]
- [ ] (backend) The administration area lives on its own subdomain or origin when the platform allows it, so its session cookie is never sent to the public part [ANSSI WEB R27]
- [ ] (backend) An authenticated session has a maximum lifetime, after which the user signs in again; the right length depends on the data (see [modules/authentication.md](modules/authentication.md)) [ANSSI MFA R12]
- [ ] (backend) The session identifier is replaced at sign-in and invalidated on the server at sign-out [OWASP A07]
- [ ] (backend) Session identifiers come from a cryptographic random generator with at least 128 bits of entropy [ANSSI WEB R38]

The 128-bit figure is the ANSSI value for anti-CSRF tokens (R38); this skill applies it to session identifiers too, since both are bearer secrets guessed the same way.

## 4. Forms and input handling

Scope: client-side parts apply to every site; the server parts apply as soon as a form is sent to a server or a third-party service.

- [ ] (backend) Every value received (form fields, query string, headers, cookies, JSON bodies, uploaded file names) is checked on the server against what is expected: type, length, format, allowed values; reject rather than repair [ANSSI WEB R8]
- [ ] Prefer allowlists (a postcode is digits, a sort order is one of `asc` or `desc`) to blocklists of "bad" characters [ANSSI WEB R8]
- [ ] Client-side validation is kept for the user's comfort only; the server repeats every check [OWASP A06]
- [ ] Data placed in a page is escaped for its context (HTML text, attribute, URL, JavaScript, CSS) by the template engine's automatic escaping; turning auto-escaping off needs a written reason [ANSSI WEB R7]
- [ ] In the browser, text is inserted with `textContent`, `setAttribute` or `createTextNode`, not `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write` [ANSSI WEB R4]
- [ ] When HTML from users must be shown (rich text, comments), it goes through a maintained HTML sanitiser with an allowlist of tags and attributes [OWASP A05]
- [ ] `eval`, `new Function`, and `setTimeout` or `setInterval` with a string are not used [ANSSI WEB R9, R10]
- [ ] JavaScript runs in strict mode; ES modules and classes are strict by default, older scripts start with `"use strict";` [ANSSI WEB R47]
- [ ] (backend) Database queries use parameters or an ORM's query builder; no SQL, NoSQL filter or shell command is built by joining strings with user input [OWASP A05]
- [ ] (backend) A redirect target taken from a request (`?next=`, `?returnUrl=`) is checked against a list of allowed paths or origins [OWASP A01]
- [ ] (backend) Every state-changing request (POST, PUT, PATCH, DELETE) is protected against cross-site request forgery: an anti-CSRF token from a cryptographic generator with at least 128 bits of entropy, checked on the server, in addition to `SameSite` cookies [ANSSI WEB R38]
- [ ] (backend) `GET` requests never change state, so that `SameSite=Lax` cookies stay safe [ANSSI WEB R32]
- [ ] (backend) Request bodies, query strings and form fields have a size limit [OWASP A06]

What a form collects and how people are informed is decided by the privacy part of this skill.

## 5. Authentication and passwords

Scope: backend only; a static site has no accounts. Load [modules/authentication.md](modules/authentication.md) as soon as the site has user accounts, an admin area or a password reset.

- [ ] Passwords are never stored in clear or with a fast hash (MD5, SHA-1, SHA-256 alone); they are derived with Argon2 or scrypt, with a random salt of at least 128 bits per account [ANSSI MFA R28, R29]
- [ ] Sign-in is only possible over HTTPS [ANSSI MFA R11]
- [ ] Failed sign-in attempts are limited over time (growing delay or temporary lock) [ANSSI MFA R10]
- [ ] Administrator and other privileged accounts use multi-factor authentication [ANSSI MFA R1]
- [ ] A one-time code sent by SMS is not used as an authentication factor [ANSSI MFA R8]
- [ ] Every request to a protected resource checks on the server that this user may act on this object (no reliance on hidden buttons or IDs that are hard to guess) [OWASP A01]
- [ ] Do not write the password hashing, session or access-control code yourself: use the framework's or a maintained library's implementation, and flag the module for human review [ANSSI AI R31]

## 6. Third-party scripts and subresource integrity

Scope: every site. A script from another origin runs with the same rights as your own code: it can read forms, cookies without `HttpOnly`, and everything on the page.

- [ ] Each third-party script has a stated purpose and an owner; scripts without one are removed [ANSSI WEB R61]
- [ ] A library is served from the site's own origin when its licence allows, instead of a public CDN [best practice]
- [ ] Scripts and stylesheets loaded from another origin carry `integrity="sha384-…"` (or `sha256`/`sha512`) and `crossorigin="anonymous"` [ANSSI WEB R12]
- [ ] Scripts and stylesheets from the site's own build also carry `integrity` when the build tool can generate it [ANSSI WEB R11]
- [ ] Resources fetched from another origin that need no authentication carry `crossorigin="anonymous"` [ANSSI WEB R43]
- [ ] A script whose code is obfuscated and that calls other origins (CORS) is not included; if it cannot be avoided, it runs isolated in a Web Worker or a sandboxed iframe [ANSSI WEB R42, R42-]
- [ ] Untrusted content (user HTML, third-party widgets) shown in an iframe uses the `sandbox` attribute with only the permissions it needs [ANSSI WEB R50, R51]
- [ ] `postMessage` is called with an explicit target origin, never `"*"`, and a message handler checks `event.origin` and the message format before acting [ANSSI WEB R54, R55]
- [ ] `document.domain` is never written, and JSON-P is not used [ANSSI WEB R57, R58]

SRI cannot cover a script that the provider changes without notice (many tag managers and analytics loaders). For those, record in the report that integrity is not checked and keep them behind consent and a narrow CSP.

## 7. Dependencies and supply chain

Scope: every project with a package manager, including static-site generators.

- [ ] Dependencies are limited to what the site uses; unused packages, plugins and themes are removed, or disabled if removal is impossible [ANSSI WEB R61]
- [ ] Dependencies are listed and kept up to date, and published vulnerabilities are followed for each of them [ANSSI WEB R62]
- [ ] The core of a framework, CMS or library is never edited; changes go through plugins, configuration or a fork that is maintained [ANSSI WEB R63]
- [ ] The lock file (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `composer.lock`, `poetry.lock`) is committed, and CI installs from it (`npm ci` or equivalent) [OWASP A03]
- [ ] The package manager's audit (`npm audit`, `composer audit`, `pip-audit` or equivalent) runs in CI and blocks on known high-severity vulnerabilities [OWASP A03]
- [ ] Before adding a package, check that it works and adds real value, that its origin and reputation are known, that it has no unresolved security issue, and that it is maintained [ANSSI WEB section 6.2]
- [ ] Also check its name letter by letter (typosquatting), its install scripts and its licence [best practice]
- [ ] Every package you suggest exists in the official registry under that exact name; AI assistants invent plausible package names [ANSSI AI R30]
- [ ] Versions are pinned through the lock file and upgrades are reviewed, not applied automatically to production [best practice]

The licence check is a project rule of this skill (requirement F-S5), not an ANSSI or OWASP recommendation.

## 8. Secrets

Scope: every project. A secret in a repository is public as soon as the repository is, and stays in the history after deletion.

- [ ] No secret (API key, password, token, private key, connection string) is written in source code, templates, client-side bundles or documentation; they come from environment variables or a secret manager [OWASP A07]
- [ ] Anything shipped to the browser is public: only publishable keys (designed to be public, restricted by domain) go in front-end code or `NEXT_PUBLIC_`/`VITE_`-prefixed variables [OWASP A02]
- [ ] `.env` files are in `.gitignore`; a `.env.example` lists the variable names with placeholder values [best practice]
- [ ] A secret scanner runs before commit or in CI [best practice]
- [ ] A secret that reached a repository, a log or a chat is revoked and replaced, not only deleted from the code [best practice]
- [ ] Default accounts and passwords of every component are changed or disabled before going live [OWASP A07]

## 9. Errors, debug and logging

Scope: error pages apply to every site; logging applies with a backend.

- [ ] Production error pages show a short message and a reference, never a stack trace, a query, a file path or a version number [ANSSI WEB R59]
- [ ] Development, test and production use distinct configurations, and an automated check prevents a debug or test configuration from reaching production [ANSSI WEB R59, R60]
- [ ] Debug endpoints, source maps with original code, test pages, `phpinfo()` and directory listings are not served in production [ANSSI WEB R60]
- [ ] The `Server` header shows no version number, and `X-Powered-By` and similar headers are removed [OWASP A02]
- [ ] (backend) Exceptions are caught at the edge of each request; a failure denies access instead of granting it [OWASP A10]
- [ ] (backend) Sign-ins, failed sign-ins, password changes, privilege changes and access denials are logged with a timestamp, without passwords, tokens or full card numbers [OWASP A09]
- [ ] (backend) Logs contain only the personal data needed for security, and are deleted after a defined period [GDPR art. 32]

Detailed logging architecture, backup and incident handling are outside this file; see the "not covered" list in [README.md](README.md).

## 10. Security of processing (GDPR)

Scope: any site that processes personal data, which includes a contact form, a newsletter sign-up, server logs with IP addresses and any user account.

- [ ] Personal data in transit is protected by sections 1 and 2 of this file, and personal data at rest is reachable only by the people and services that need it [GDPR art. 32]
- [ ] The measures applied, and the ones left to the owner (hosting, backups, access management), are listed in the final report so the owner can document them [GDPR art. 32]

Article 32 requires measures appropriate to the risk and does not list them. This skill meets it with the ANSSI baseline; a lawyer or the data protection officer decides what is appropriate for a given processing.

## 11. CORS and APIs

Scope: backend, and any static site that calls an API.

- [ ] (backend) An API that answers other origins checks the `Origin` header against a list of allowed origins and echoes only an allowed one in `Access-Control-Allow-Origin` [ANSSI WEB R40]
- [ ] (backend) `Access-Control-Allow-Origin: *` is used only for public, unauthenticated data, and never together with `Access-Control-Allow-Credentials: true` [ANSSI WEB R40]
- [ ] (backend) A cross-origin call that carries sensitive data requires a preflight (for example by requiring a custom header or `Content-Type: application/json`) [ANSSI WEB R39]
- [ ] (backend) Independent web services each get their own domain or subdomain [ANSSI WEB R41]
- [ ] (backend) API responses are data (JSON), not HTML fragments to insert with `innerHTML`, and are sent with `Content-Type: application/json` [ANSSI WEB R34, R6]
- [ ] Client code uses `fetch` rather than `XMLHttpRequest`, with `mode`, `credentials` and `redirect` set explicitly [ANSSI WEB R44]
- [ ] (backend) Each endpoint checks authentication and authorisation itself, and list endpoints are paginated with a maximum page size [OWASP A01]
- [ ] (backend) Endpoints that send e-mail, check passwords or cost money (sign-up, sign-in, password reset, contact form, search) are rate-limited [OWASP A06]
- [ ] (backend) Incoming webhooks verify the sender's signature before acting [OWASP A08]
- [ ] (backend) A server that fetches a URL given by a user (link preview, import by URL) only reaches allowed hosts and never internal addresses [OWASP A01]

## 12. Reviewing AI-generated code

Scope: every project where code was written by an AI assistant, which includes the code you are writing now. Full rules: [modules/ai-generated-code.md](modules/ai-generated-code.md).

- [ ] AI-generated code is not run automatically in the developer's environment and not committed automatically; a person reviews and commits it [ANSSI AI R30]
- [ ] The final report lists the files you generated and marks those that touch authentication, cryptography, access rights or sensitive data as "needs human review" [ANSSI AI R31]
- [ ] Every library referenced in generated code is checked: it exists, it is the intended package, it is maintained [ANSSI AI R30]
