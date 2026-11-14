"""Rebuilds examples/online-shop/faulty from fixed and plants the privacy and security defects.
Usage: python scripts/examples/plant_online_shop.py examples
Run it after any change to fixed/: faulty/ is generated, never edited by hand.
The defects are listed in examples/online-shop/expected-privacy.json and expected-security.json;
each comment below gives the id of the entry it plants."""
import shutil
import sys
from pathlib import Path

site = Path(sys.argv[1]) / "online-shop"
fixed, faulty = site / "fixed", site / "faulty"
if faulty.exists():
    shutil.rmtree(faulty)
shutil.copytree(fixed, faulty)


def edit(name, pairs):
    path = faulty / name
    text = path.read_text(encoding="utf-8")
    for old, new in pairs:
        if text.count(old) != 1:
            raise SystemExit(f"{name}: expected exactly one occurrence of {old[:70]!r}, found {text.count(old)}")
        text = text.replace(old, new)
    path.write_bytes(text.encode("utf-8"))


def add_file(name, text):
    path = faulty / name
    if path.exists():
        raise SystemExit(f"{name}: already exists in fixed/")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(text.encode("utf-8"))


HEAD_END = '  <script src="js/site.js" defer></script>\n</head>'


def head(extra):
    """Adds lines at the end of <head>, after the site's own scripts."""
    return (HEAD_END, '  <script src="js/site.js" defer></script>\n' + extra + '</head>')


# ------------------------------------------------------------------ index.html
edit("index.html", [
    # OS-P-01 analytics tag pasted with async in the head, outside the consent mechanism
    #         (with an inline snippet that the weakened CSP of OS-S-01 lets run)
    head('''  <script async src="https://www.googletagmanager.com/gtag/js?id=G-LT00EXAMPLE"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-LT00EXAMPLE');
  </script>
'''),
    ('  <script type="text/plain" data-consent-purpose="analytics" src="js/analytics-config.js"></script>\n'
     '  <script type="text/plain" data-consent-purpose="analytics" src="https://www.googletagmanager.com/gtag/js?id=G-LT00EXAMPLE"></script>\n', ''),
    # OS-P-02 video player embedded directly, without the click-to-load placeholder
    ('''      <div class="consent-placeholder" data-consent-placeholder data-consent-purpose="video">
        <p>This video is hosted by an external video platform, which uses trackers. <a href="https://www.youtube.com/watch?v=LT00EXAMPLE">Watch “How we blend our teas” on the video platform</a>.</p>
        <button type="button" class="consent-button" data-consent-allow="video">Allow videos from external platforms</button>
        <template data-consent-content>
          <iframe src="https://www.youtube-nocookie.com/embed/LT00EXAMPLE" title="Video: how we blend our teas" width="560" height="315" allowfullscreen></iframe>
        </template>
      </div>
''', '''      <div class="video-frame">
        <iframe src="https://www.youtube.com/embed/LT00EXAMPLE" title="Video: how we blend our teas" width="560" height="315" allowfullscreen></iframe>
      </div>
'''),
])

# --------------------------------------------------------------- products.html
edit("products.html", [
    # OS-P-10 a script run before the consent loader forgets a refusal, so the banner comes back on every visit
    ('  <script src="consent/consent.js" defer></script>\n',
     '  <script src="js/consent-reminder.js"></script>\n  <script src="consent/consent.js" defer></script>\n'),
    # OS-S-10 third-party library from a public CDN, without integrity
    # OS-P-03 first-party loader that injects an analytics library before consent
    head('''  <script src="https://cdn.jsdelivr.net/npm/lazysizes@5.3.2/lazysizes.min.js" async></script>
  <script src="js/analytics-boot.js" defer></script>
'''),
])
add_file("js/consent-reminder.js", '''/* Faulty version (OS-P-10): asks again on every page when the visitor refused everything,
   by deleting a refusal before the consent loader reads it. */
(function () {
  'use strict';
  var prefix = 'eu-consent=';
  var stored = document.cookie.split('; ').filter(function (part) { return part.indexOf(prefix) === 0; })[0];
  if (!stored) {
    return;
  }
  try {
    var choice = JSON.parse(decodeURIComponent(stored.slice(prefix.length)));
    var values = Object.keys(choice.p || {}).map(function (key) { return choice.p[key]; });
    if (values.length && values.every(function (value) { return value === false; })) {
      document.cookie = prefix + '; Max-Age=0; Path=/';
    }
  } catch (error) {
    document.cookie = prefix + '; Max-Age=0; Path=/';
  }
}());
''')
add_file("js/analytics-boot.js", '''/* Faulty version (OS-P-03): loads the analytics library at start-up, without asking for consent. */
(function () {
  'use strict';
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.google-analytics.com/analytics.js';
  document.head.appendChild(script);
}());
''')

# ---------------------------------------------------------------- product.html
edit("product.html", [
    # OS-P-04 marketing pixel and its configuration run without consent
    ('<script type="text/plain" data-consent-purpose="marketing" src="js/marketing-config.js"></script>',
     '<script src="js/marketing-config.js"></script>'),
    ('<script type="text/plain" data-consent-purpose="marketing" src="https://connect.facebook.net/en_US/fbevents.js"></script>',
     '<script src="https://connect.facebook.net/en_US/fbevents.js"></script>'),
    # OS-P-05 social network share widget loaded with the page
    ('      <p class="share"><a href="https://twitter.com/intent/tweet?text=Linden%20Blossom%20tea">Share this tea on a social network</a></p>\n',
     '      <p class="share"><a class="twitter-share-button" href="https://twitter.com/intent/tweet?text=Linden%20Blossom%20tea">Share this tea on a social network</a></p>\n'
     '      <script src="https://platform.twitter.com/widgets.js" async></script>\n'),
])

# ----------------------------------------------------------------- basket.html
edit("basket.html", [
    # OS-P-06 first-party cookie with a tracking identifier, set before consent and not declared
    # OS-P-07 retargeting tag that runs as soon as any choice is stored, refusal included
    head('''  <script src="js/visitor-id.js" defer></script>
  <script src="js/retargeting.js" defer></script>
'''),
])
add_file("js/visitor-id.js", '''/* Faulty version (OS-P-06): gives every browser a persistent identifier, before any consent. */
(function () {
  'use strict';
  if (document.cookie.indexOf('visitor_id=') === -1) {
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    document.cookie = 'visitor_id=' + id + '; Max-Age=31536000; Path=/; SameSite=Lax';
  }
}());
''')
add_file("js/retargeting.js", '''/* Faulty version (OS-P-07): loads the retargeting tag once the visitor has answered the banner,
   whatever the answer. It should test window.euConsent.has('marketing'). */
(function () {
  'use strict';
  if (window.euConsent && window.euConsent.get()) {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://bat.bing.com/bat.js';
    document.head.appendChild(script);
  }
}());
''')

# --------------------------------------------------------------- checkout.html
edit("checkout.html", [
    # OS-P-08 session replay script recording the checkout form, before consent
    head('  <script src="https://static.hotjar.com/c/hotjar-0000000.js?sv=6" async></script>\n'),
    # OS-S-06 the checkout form posts to a plain HTTP address
    ('<form id="checkout-form" action="confirmation.html" method="post">',
     '<form id="checkout-form" action="http://pay.lindenmoor-tea.example/checkout" method="post">'),
])

# ----------------------------------------------------------- confirmation.html
edit("confirmation.html", [
    # OS-P-09 advertising pixel image for the purchase, before consent
    ('    <p><a href="products.html">Continue shopping</a></p>\n',
     '    <p><a href="products.html">Continue shopping</a></p>\n'
     '    <img class="pixel" src="https://www.facebook.com/tr?id=000000000000000&amp;ev=Purchase&amp;noscript=1" width="1" height="1" alt="">\n'),
])

# ------------------------------------------------------------------ legal.html
edit("legal.html", [
    # OS-P-11 the banner has no "Refuse all" on its first level: refusing needs "Customise"
    ('      <button type="button" class="consent-button" data-consent="refuse">Refuse all</button>\n', ''),
    # OS-P-12 map embedded directly from a map provider
    ('''    <p>The workshop at 4 Harbour Row is open on Saturdays from 10:00 to 16:00. <a href="https://www.openstreetmap.org/search?query=Harbour%20Row">Find Harbour Row on a map</a>.</p>''',
     '''    <p>The workshop at 4 Harbour Row is open on Saturdays from 10:00 to 16:00.</p>
    <iframe src="https://maps.google.com/maps?q=Harbour%20Row&amp;output=embed" title="Map: location of the workshop" width="560" height="315"></iframe>'''),
    # OS-S-11 link to another site opened in a new tab without rel="noopener"
    ('<a href="https://companies-register.example/EX-000000">entry in the companies register</a>',
     '<a href="https://companies-register.example/EX-000000" target="_blank">entry in the companies register (opens in a new tab)</a>'),
])

# ------------------------------------------------------------------------ CSS
css = (faulty / "css" / "site.css").read_text(encoding="utf-8")
css = css.replace("(fixed version)", "(faulty version: defects planted on purpose, see expected-privacy.json and expected-security.json)")
css += '''
/* ---- Rules below belong to the faulty version only ---- */

main iframe {
  max-width: 100%;
}
'''
(faulty / "css" / "site.css").write_bytes(css.encode("utf-8"))

js = (faulty / "js" / "site.js").read_text(encoding="utf-8")
js = js.replace("(fixed version)", "(faulty version: defects planted on purpose, see expected-privacy.json and expected-security.json)")
(faulty / "js" / "site.js").write_bytes(js.encode("utf-8"))

# -------------------------------------------------------------------- .headers
# One block per page, so that each header defect concerns one page only. A CSP header given
# in two matching blocks would make two policies, so the CSP is never in the "/*" block here.
PER_PAGE = ["Content-Security-Policy", "X-Frame-Options", "Referrer-Policy", "X-Content-Type-Options"]


def read_fixed_headers():
    headers, inside = [], False
    for line in (fixed / ".headers").read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("#") or not line.strip():
            continue
        if not line.startswith(" "):
            inside = line.strip() == "/*"
            continue
        if inside:
            name, value = line.strip().split(":", 1)
            headers.append((name.strip(), value.strip()))
    return headers


def csp_edit(csp, add=None, drop=(), replace=None):
    directives = [part.strip().split() for part in csp.split(";") if part.strip()]
    out = []
    for tokens in directives:
        name = tokens[0]
        if name in drop:
            continue
        if replace and name in replace:
            tokens = [name] + replace[name]
        if add and name in add:
            tokens = tokens + add[name]
        out.append(" ".join(tokens))
    return "; ".join(out)


common = read_fixed_headers()
base = dict(common)
CSP = base["Content-Security-Policy"]
pages = sorted(p.name for p in faulty.glob("*.html"))
blocks = {name: [(h, base[h]) for h in PER_PAGE] for name in pages}


def set_header(page, name, value):
    blocks[page] = [(h, value if h == name else v) for h, v in blocks[page]]
    if name not in [h for h, _ in blocks[page]]:
        blocks[page].append((name, value))


def drop_header(page, name):
    blocks[page] = [(h, v) for h, v in blocks[page] if h != name]


# OS-P-01, OS-P-02 need their hosts allowed; OS-S-01 'unsafe-inline' in script-src
set_header("index.html", "Content-Security-Policy",
           csp_edit(CSP, add={"script-src": ["'unsafe-inline'"], "frame-src": ["https://www.youtube.com"]}))
# OS-S-02 'unsafe-eval'; hosts of OS-P-03 and OS-S-10
set_header("products.html", "Content-Security-Policy",
           csp_edit(CSP, add={"script-src": ["'unsafe-eval'", "https://www.google-analytics.com", "https://cdn.jsdelivr.net"]}))
# OS-S-03 script-src allows any HTTPS origin
set_header("product.html", "Content-Security-Policy", csp_edit(CSP, replace={"script-src": ["'self'", "https:"]}))
# OS-S-04 no frame-ancestors and no X-Frame-Options; host of OS-P-07
set_header("basket.html", "Content-Security-Policy",
           csp_edit(CSP, add={"script-src": ["https://bat.bing.com"]}, drop=("frame-ancestors",)))
drop_header("basket.html", "X-Frame-Options")
# OS-S-05 no X-Content-Type-Options; host of OS-P-08
set_header("checkout.html", "Content-Security-Policy", csp_edit(CSP, add={"script-src": ["https://static.hotjar.com"]}))
drop_header("checkout.html", "X-Content-Type-Options")
# OS-S-07 Referrer-Policy that sends the full address to every site
set_header("confirmation.html", "Referrer-Policy", "unsafe-url")
# OS-S-08 no Content-Security-Policy at all
drop_header("privacy.html", "Content-Security-Policy")
# OS-S-09 server name and version disclosed
set_header("cookies.html", "Server", "nginx/1.25.3")
# host of OS-P-12
set_header("legal.html", "Content-Security-Policy", csp_edit(CSP, add={"frame-src": ["https://maps.google.com"]}))

lines = [
    "# Faulty version: generated by scripts/examples/plant_online_shop.py from fixed/.headers; never edit by hand.",
    "# Planted header defects are listed in ../expected-security.json. One block per page, so that each",
    "# defect concerns one page only; the Content-Security-Policy is therefore never in the /* block.",
    "/*",
]
lines += [f"  {h}: {v}" for h, v in common if h not in PER_PAGE]
for name in pages:
    lines.append(f"/{name}")
    lines += [f"  {h}: {v}" for h, v in blocks[name]]
(faulty / ".headers").write_bytes(("\n".join(lines) + "\n").encode("utf-8"))

print("online-shop faulty rebuilt")
