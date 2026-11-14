# Netlify, Cloudflare Pages and Vercel

Header files for static hosting platforms. Read [../headers-configs.md](../headers-configs.md) first for the CSP strategy and the verification steps.

## How to use this file

1. These hosts manage TLS themselves: you cannot choose TLS versions, cipher suites or certificates. Do not claim the ANSSI TLS values are met; mark them "to verify with an external TLS test" in the report.
2. Header files apply to static files the host serves. On Netlify and Cloudflare Pages they do **not** apply to responses produced by functions, edge functions or server-side rendering: such code must set the headers itself (see [node.md](node.md) for Next.js).
3. A static header file sends the same value to every visitor, so the CSP uses hashes, never a nonce.
4. The blocks are illustrations of the values to reach; replace the parts marked "adapt".

## Netlify `_headers`

Place `_headers` (no extension) in the folder that is deployed (the publish directory), for example by putting it in `public/` or `static/` for a framework that copies those folders. Some generators skip files starting with `_` and need to be told to include it.

```text
# _headers (Netlify). Paths start at the site root; indented lines are headers.
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  # adapt: add third-party origins only when the site uses them
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Notes:

- When the same header is listed more than once for a path, Netlify joins the values with commas. For CSP that produces an invalid policy, so write each security header once, under `/*`.
- Netlify's documentation says `Server` is typically ignored in `_headers` and `Set-Cookie` may be overridden by its own cookie handling: set cookies in the code that needs them.
- `_headers` is global to all deploy contexts (production, previews, branch deploys).

## Cloudflare Pages `_headers`

Place `_headers` (no extension) in the build output folder (or in `public/` or `static/` for a framework that copies them there). Limits: 100 rules, 2,000 characters per line, which is enough for a strict CSP.

```text
# _headers (Cloudflare Pages)
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  # adapt: add third-party origins only when the site uses them
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

# Keep preview deployments out of search engines (adapt the project name)
https://:project.pages.dev/*
  X-Robots-Tag: noindex
```

Notes:

- A request that matches several rules receives the headers of all of them, and a repeated header is joined with commas. To change a value for a sub-path, first remove it with `! Header-Name` in a rule placed after the broad one, then set the new value:

```text
/embed/*
  ! X-Frame-Options
  ! Content-Security-Policy
  # adapt: the one site allowed to frame /embed/
  Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors https://partner.example
```

- `_headers` does not apply to Pages Functions or `_worker.js`, including SSR frameworks: set headers in that code.

## Vercel `vercel.json`

Vercel reads `headers` from `vercel.json` at the project root. `source` matches the path without the query string.

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Resource-Policy", "value": "same-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

Notes:

- JSON has no comments: adapt the CSP origins directly in the value.
- Vercel's own documentation example sets `X-XSS-Protection: 1; mode=block`. Do not copy it: with a strict CSP the ANSSI guide says to send `0` or nothing (section 5.2.1).
- A Next.js project on Vercel sets headers in `next.config.js` or in its proxy instead; see [node.md](node.md).

## Hashes for an inline block that must stay

When an inline `<script>` or `<style>` cannot be moved to a file (for example a short theme switcher that must run before paint), allow that exact block by its hash:

1. Take the exact text between the opening and closing tags, byte for byte, including spaces and line breaks.
2. Compute its SHA-256 (or SHA-384) and encode it in base64, for example with `printf '%s' "$CONTENT" | openssl dgst -sha256 -binary | openssl base64 -A`.
3. Add `'sha256-<base64>'` to `script-src` (or `style-src`) in the header file.
4. Open the page with the console visible: if the hash is wrong, the block is blocked and a CSP violation is logged (Chromium-based browsers also print the hash they computed).

Any edit to the block, even one space, changes the hash. Prefer moving the code to a file, then remove the hash.
