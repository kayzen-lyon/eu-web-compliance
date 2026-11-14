# Express and Next.js

Header and cookie configurations for Node.js applications. Read [../headers-configs.md](../headers-configs.md) first for the CSP strategy and the verification steps.

## How to use this file

1. An application that renders HTML per request can, and should, use a CSP nonce: a fresh random value per response, placed in the header and on each `<script>` tag.
2. TLS usually ends at a reverse proxy or the hosting platform in front of Node. Configure TLS there ([web-servers.md](web-servers.md) or the host), and tell the application it is behind a proxy so that `Secure` cookies and HTTPS detection work.
3. The code blocks are illustrations of the values to reach; adapt names and origins, keep the values.

## Express without helmet

```js
// security-headers.js
import crypto from 'node:crypto';

// adapt: add third-party origins only when the site uses them
function cspFor(nonce) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function securityHeaders(req, res, next) {
  // 16 random bytes = 128 bits from the operating system's generator, new for each response
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce; // templates write <script nonce="<%= cspNonce %>">
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': cspFor(nonce),
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
}
```

```js
// app.js
import express from 'express';
import session from 'express-session';
import { securityHeaders } from './security-headers.js';

const app = express();
app.disable('x-powered-by');          // no framework disclosure
app.set('trust proxy', 1);            // adapt: number of proxies in front; needed for Secure cookies
app.use(securityHeaders);
app.use(express.json({ limit: '100kb' }));                        // adapt the size limit
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw new Error('SESSION_SECRET is not set');

app.use(session({
  name: '__Host-sid',                 // __Host- prefix: Secure, Path=/, no Domain enforced by the browser
  secret: sessionSecret,              // from the environment, never in code
  resave: false,
  saveUninitialized: false,           // no cookie before there is something to keep
  cookie: {
    httpOnly: true,                   // ANSSI WEB R30 (express-session default, kept explicit)
    secure: true,                     // ANSSI WEB R31 (default is false)
    sameSite: 'lax',                  // ANSSI WEB R32, R33; never 'none' or 'auto' for a session
    path: '/',
    maxAge: 30 * 60 * 1000,           // adapt with the owner: ANSSI MFA R12 gives no fixed value
  },
}));
```

Notes:

- express-session's defaults are `httpOnly: true`, `secure: false`, no `SameSite`. Its `sameSite: 'auto'` sets `None` on HTTPS, which ANSSI WEB R33 excludes for a session cookie.
- Call `req.session.regenerate()` right after a successful sign-in, so the identifier used before sign-in is discarded.
- Error handler for production: log the error, answer with a short message and no stack trace.

```js
// Last middleware. No stack trace or internal message reaches the client.
app.use((err, req, res, next) => {
  req.log?.error?.(err);              // adapt to the project's logger
  res.status(err.status && err.status < 500 ? err.status : 500).send('An error occurred.');
});
```

## Express with helmet

helmet's defaults are close to the baseline but not equal to it. Its default CSP contains `style-src 'self' https: 'unsafe-inline'`, `img-src 'self' data:`, `font-src 'self' https: data:` and `frame-ancestors 'self'`, and its default `X-Frame-Options` is `SAMEORIGIN`. Override them:

```js
import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';

const app = express();
app.set('trust proxy', 1);            // adapt

app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,               // start from nothing rather than helmet's lenient defaults
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`, "'strict-dynamic'"],
      styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
      imgSrc: ["'self'"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],         // adapt: third-party APIs used after consent
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// helmet does not set Permissions-Policy
app.use((req, res, next) => {
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
```

Notes:

- helmet removes `X-Powered-By` and sends `X-XSS-Protection: 0`, `X-Content-Type-Options: nosniff`, `Origin-Agent-Cluster: ?1`; keep those defaults.
- Option names (`strictTransportSecurity`, `xFrameOptions`) follow the helmet documentation read on 2026-11-14. If the installed major version rejects one, read its README; the values stay the same.
- Cookie and session settings are the same as in the previous section.

## Next.js (App Router)

Next.js inserts inline scripts for its runtime, so a CSP without `'unsafe-inline'` needs either a nonce (pages rendered per request) or hashes through its experimental SRI support. Next.js documentation describes both; its own examples include `img-src 'self' blob: data:` and, in the variant without nonces, `'unsafe-inline'`. Do not copy those parts: they contradict ANSSI WEB R15.

### Nonce in the proxy (pages rendered per request)

Recent Next.js versions name this file `proxy.ts` (older ones: `middleware.ts` exporting `middleware`). Every page that uses the nonce must be rendered per request.

```ts
// proxy.ts (project root or src/)
import { NextRequest, NextResponse } from 'next/server';

function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16)); // 128 bits
  return btoa(String.fromCharCode(...bytes));
}

export function proxy(request: NextRequest) {
  const nonce = makeNonce();
  const isDev = process.env.NODE_ENV === 'development';
  // adapt: add third-party origins only when the site uses them
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp); // Next.js reads the nonce from here

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
```

- `'unsafe-eval'` is added in development only, because React uses `eval` for debugging there; production must not contain it.
- Read the nonce in a Server Component with `(await headers()).get('x-nonce')` and pass it to `<Script nonce={nonce}>` for any script you add.
- Nonces disable static generation and CDN caching of those pages. If that cost is not acceptable, use the experimental SRI option (`experimental.sri` in `next.config.js`) with a CSP without nonce, and test it: it is marked experimental.

### Other headers in `next.config.js`

The headers that do not change per request go in `next.config.js` (or `vercel.json` on Vercel):

```js
// next.config.js
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  poweredByHeader: false,             // removes X-Powered-By: Next.js
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

Notes:

- With `output: 'export'` (static export), `headers()` is not applied: put the headers in the host's file ([static-hosts.md](static-hosts.md)) and check the built HTML for inline `<script>` blocks, which then need hashes.
- Server Actions and Route Handlers check authentication and authorisation themselves; hiding a button is not access control ([../web-baseline.md](../web-baseline.md) section 5).
- Only variables prefixed `NEXT_PUBLIC_` reach the browser; never put a secret in one.
