# Security header configurations

Ready-to-adapt configurations that implement [web-baseline.md](web-baseline.md) sections 1 to 3 on common hosts. The machine-readable expectations they must meet are in [headers-baseline.json](headers-baseline.json).

## How to use this file

1. Find the host or framework in the table below and open its file. Copy the block, then adapt only the parts marked "adapt": the domain, the third-party origins in the CSP, the session cookie name.
2. Keep the values of the shared header set below unless you have a reason you can write in the report. Weakening a value to make an error disappear (adding `'unsafe-inline'`, `*`, `data:`) is never that reason.
3. After deploying, run the verification at the end of this file.
4. A host's own documentation was read on 2026-11-14 for the syntax of each file; the URLs are listed at the end. If a host changed its syntax since, its documentation wins on syntax, and this skill wins on values.

| Host or framework | File |
|-------------------|------|
| nginx, Apache httpd, Caddy | [configs/web-servers.md](configs/web-servers.md) |
| Netlify, Cloudflare Pages (`_headers`), Vercel (`vercel.json`) | [configs/static-hosts.md](configs/static-hosts.md) |
| Express (plain or with helmet), Next.js | [configs/node.md](configs/node.md) |
| WordPress or another CMS | [modules/cms.md](modules/cms.md), then the web server or host file |
| This project's test sites | Section "Test sites" below |

## The shared header set

Every configuration in this folder sends the same headers. Values and reasons:

| Header | Value | Rule |
|--------|-------|------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (HTTPS responses only; drop `includeSubDomains` until every subdomain is on HTTPS) | ANSSI WEB R2 |
| `Content-Security-Policy` | See "CSP strategy" below | ANSSI WEB R13 to R17 |
| `X-Frame-Options` | `DENY` | ANSSI WEB R18 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (or `no-referrer`, `same-origin`, `strict-origin`) | ANSSI WEB R21 |
| `X-Content-Type-Options` | `nosniff` | OWASP A02 |
| `Cross-Origin-Opener-Policy` | `same-origin` (`same-origin-allow-popups` on a page that opens a payment or sign-in popup) | ANSSI WEB R46 |
| `Cross-Origin-Resource-Policy` | `same-origin` (`cross-origin` for files other sites must embed) | best practice |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()`, plus any feature the site does not use | best practice |
| `Server` | No version number | OWASP A02 |
| `X-Powered-By` | Removed | OWASP A02 |

`X-XSS-Protection` is not sent. If a platform adds it, set it to `0` (ANSSI WEB, section 5.2.1).

## CSP strategy

Start from the strict policy for a site that loads everything from its own origin:

```text
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

Then pick the strategy the platform allows:

| Situation | Strategy |
|-----------|----------|
| Static files, no inline script or style | The strict policy above, as a fixed header. Best case. |
| Static files with a few inline blocks you cannot move | Fixed header with one `'sha256-…'` (or `sha384`) per inline block in `script-src` or `style-src`. Recompute the hash whenever the block changes, or the block stops running. |
| Server renders each page (Express, Next.js dynamic, PHP, CMS) | A nonce generated for each response, at least 128 bits from a cryptographic generator, in `script-src 'nonce-…' 'strict-dynamic'` and on every `<script>` tag. |
| The page builds HTML in the browser | Add `require-trusted-types-for 'script'` once the code uses only safe DOM APIs; test in Report-Only first. |

Rules that apply to every strategy:

- A nonce in a static file or a `_headers` file is constant, so it protects nothing: use hashes there.
- `upgrade-insecure-requests` is not in the base policy: it is useful only when old `http://` links remain, and it breaks a site served over plain HTTP (such as a local test server). Add it on HTTPS-only sites if needed.
- `style-src 'unsafe-inline'` is common in framework defaults and component libraries. Remove it; if a library needs it, report the library as the reason and the severity as medium.
- `img-src data:` and `font-src data:` appear in many templates. The ANSSI guide forbids `data:` in any directive (R15). Serve images and fonts as files.
- Each third-party service added after consent needs its own origins, from its documentation, in the narrowest directive (`script-src`, `connect-src`, `img-src`, `frame-src`). Write them as `https://exact.host`, never `https:` or `*.example.com` unless the provider documents that it needs it.
- Deploy a changed policy as `Content-Security-Policy-Report-Only` first, open every page with the browser console visible, fix the violations, then switch to the enforcing header.

## Test sites

The test sites of this project are served by `scripts/lib/static-server.mjs`, which applies a Netlify-style headers file found at the root of the site folder. Inside this repository the file is named `.headers`, because `scripts/validate.py` rejects file names starting with `_`; the server also reads `_headers`. Same format as Netlify: a path pattern on its own line, then indented `Name: value` lines.

This is the file to put at the root of each corrected test site. The site loads no third-party resource and has no inline script or style:

```text
# Security headers for a static test site (format of Netlify _headers).
# Served by scripts/lib/static-server.mjs over plain HTTP: HSTS is ignored by
# browsers on HTTP, but it is declared so the configuration can be checked.
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

For a test site with accounts, add a block for the page that signs the user in (the test server sends `Set-Cookie` as given):

```text
/account/sign-in.html
  Set-Cookie: __Host-sid=test-session-value; Path=/; Secure; HttpOnly; SameSite=Lax
```

The faulty version of a test site should miss or weaken headers in ways the checker must find, for example: no CSP, `script-src 'self' 'unsafe-inline'`, `Referrer-Policy: unsafe-url`, a session cookie without `HttpOnly`, `Server: nginx/1.25.3`.

## Verify

1. Run the project's header checker against the built site or URL: `node scripts/check-security.mjs <folder or URL>`. It compares every response with [headers-baseline.json](headers-baseline.json).
2. Look at the real headers yourself: `curl -sI https://example.org/` (or the browser's network panel). Check an HTML page, a CSS or JS file, an image and an error page (404): `add_header` in nginx and `Header` in Apache skip error responses unless told otherwise.
3. Open each page with the browser console visible: every CSP violation is logged there. Zero violations on every page is the target.
4. For TLS, use an external TLS test and compare the versions, suites and certificate with [anssi-values.md](anssi-values.md). This cannot be checked from a local folder.
5. Fetch a server-rendered page twice and compare the nonces: they must differ.

## Documentation read for the syntax (2026-11-14)

- nginx: `https://nginx.org/en/docs/http/ngx_http_headers_module.html`, `https://nginx.org/en/docs/http/ngx_http_ssl_module.html`, `https://nginx.org/en/docs/http/ngx_http_core_module.html`
- Apache httpd 2.4: `https://httpd.apache.org/docs/2.4/mod/mod_headers.html`, `https://httpd.apache.org/docs/2.4/mod/mod_ssl.html`, `https://httpd.apache.org/docs/2.4/mod/core.html`
- Caddy: `https://caddyserver.com/docs/caddyfile/directives/header`, `https://caddyserver.com/docs/caddyfile/directives/tls`, `https://caddyserver.com/docs/automatic-https`
- Netlify: `https://docs.netlify.com/routing/headers/`
- Cloudflare Pages: `https://developers.cloudflare.com/pages/configuration/headers/`
- Vercel: `https://vercel.com/docs/project-configuration/vercel-json`
- Next.js: `https://nextjs.org/docs/app/guides/content-security-policy`
- helmet: `https://helmet.js.org/`
- express-session: `https://github.com/expressjs/session`
- MDN, for header syntax: `Permissions-Policy`, `X-Content-Type-Options`, `Set-Cookie` pages under `https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/`
