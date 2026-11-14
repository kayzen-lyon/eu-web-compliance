"""Rebuilds examples/account-app/faulty from fixed and plants the privacy and security defects.
Usage: python scripts/examples/plant_account_app.py examples
Run it after any change to fixed/: faulty/ is generated, never edited by hand.
The defects are listed in examples/account-app/expected-privacy.json and expected-security.json;
each comment below gives the id of the entry it plants."""
import shutil
import sys
from pathlib import Path

site = Path(sys.argv[1]) / "account-app"
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


MANAGE = '      <p class="footer-manage"><button type="button" class="consent-button consent-manage" data-consent-open>Manage cookies</button></p>\n'

# ------------------------------------------------------------------ index.html
edit("index.html", [
    # AA-P-01 product analytics library loaded before consent
    # AA-P-02 web font from a third-party font service
    head('''  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&amp;display=swap">
  <script src="https://cdn.segment.com/analytics.js/v1/LRK0EXAMPLE/analytics.min.js" defer></script>
'''),
])

# ---------------------------------------------------------------- sign-up.html
edit("sign-up.html", [
    # AA-P-03 advertising conversion tag on the sign-up page, before consent
    head('  <script src="https://www.googleadservices.com/pagead/conversion_async.js" defer></script>\n'),
    # AA-P-04 no "Manage cookies" control on this page: consent cannot be withdrawn here
    (MANAGE, ''),
    # AA-P-09 newsletter box ticked in advance
    ('<input type="checkbox" id="newsletter" name="newsletter" value="yes">',
     '<input type="checkbox" id="newsletter" name="newsletter" value="yes" checked>'),
])

# ---------------------------------------------------------------- sign-in.html
edit("sign-in.html", [
    # AA-P-06 device identifier written to localStorage before consent
    head('  <script src="js/device-id.js" defer></script>\n'),
    # AA-S-04 password field with autocomplete="off"
    ('name="current-password" autocomplete="current-password"', 'name="current-password" autocomplete="off"'),
    ('<span class="hint" id="current-password-hint">You can paste it or let your password manager fill it in.</span>',
     '<span class="hint" id="current-password-hint">Type your password.</span>'),
])
add_file("js/device-id.js", '''/* Faulty version (AA-P-06): gives every browser a stable identifier for "fraud scoring",
   before any consent and without declaring it. */
(function () {
  'use strict';
  try {
    if (!window.localStorage.getItem('fp_device_id')) {
      window.localStorage.setItem('fp_device_id', 'dev-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    }
  } catch (error) {
    /* storage unavailable */
  }
}());
''')

# --------------------------------------------------------- reset-password.html
edit("reset-password.html", [
    # AA-P-08 support chat widget loaded with the page instead of waiting for the chat purpose
    ('<script type="text/plain" data-consent-purpose="chat" src="https://widget.helpdesk.example/loader.js"></script>',
     '<script src="https://widget.helpdesk.example/loader.js" defer></script>'),
    ('<p>Enter the email address of your account. If it matches an account, we send it a link to choose a new password. The link works once, for 30 minutes.</p>',
     '<p>Enter the email address of your account and we send it a link to choose a new password. The link works once, for 30 minutes.</p>'),
])

# ---------------------------------------------------------------- account.html
edit("account.html", [
    # AA-P-05 session replay script on the page that shows personal data
    # AA-S-05 session token copied into localStorage
    head('''  <script src="https://www.clarity.ms/tag/lrk0example" async></script>
  <script src="js/session-cache.js" defer></script>
'''),
])
add_file("js/session-cache.js", '''/* Faulty version (AA-S-05): keeps the session token in localStorage "so that the account page
   opens faster". Any script running on the page can read it. */
(function () {
  'use strict';
  try {
    window.localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtZW1iZXItMDA0MiJ9.demo-signature');
  } catch (error) {
    /* storage unavailable */
  }
}());
''')

# ---------------------------------------------------------------- privacy.html
edit("privacy.html", [
    # AA-P-07 "Refuse" is a small grey link under two buttons, instead of a button like "Accept all"
    ('      <button type="button" class="consent-button" data-consent="refuse">Refuse all</button>\n', ''),
    ('''      <button type="button" class="consent-button" data-consent="customise">Customise</button>
    </div>
  </section>''', '''      <button type="button" class="consent-button" data-consent="customise">Customise</button>
    </div>
    <p class="consent-quiet"><a href="#main" data-consent="refuse">Refuse</a></p>
  </section>'''),
])

# ------------------------------------------------------------------------- JS
js = (faulty / "js" / "site.js").read_text(encoding="utf-8")
js = js.replace("(fixed version)", "(faulty version: defects planted on purpose, see expected-privacy.json and expected-security.json)")
old_reset = '''  function resetMessage() {
    /* Same answer whether or not the address has an account, so that the form does not reveal who is a member. */
    return 'If an account exists for this address, we have sent it a link to choose a new password. (Demo: nothing was sent.)';
  }
'''
new_reset = '''  /* Faulty version (AA-S-10): the answer says whether the address has an account. */
  var MEMBERS = ['jordan.sample@example.com'];

  function resetMessage(email) {
    return MEMBERS.indexOf(email.toLowerCase()) === -1
      ? 'No account is registered with this address.'
      : 'We have sent a link to choose a new password to this address. (Demo: nothing was sent.)';
  }
'''
old_call = "      say('reset-status', resetMessage());"
new_call = "      say('reset-status', resetMessage(document.getElementById('email').value.trim()));"
for old in (old_reset, old_call):
    if js.count(old) != 1:
        raise SystemExit(f"js/site.js: expected exactly one occurrence of {old[:70]!r}")
js = js.replace(old_reset, new_reset).replace(old_call, new_call)
(faulty / "js" / "site.js").write_bytes(js.encode("utf-8"))

# ------------------------------------------------------------------------ CSS
css = (faulty / "css" / "site.css").read_text(encoding="utf-8")
css = css.replace("(fixed version)", "(faulty version: defects planted on purpose, see expected-privacy.json and expected-security.json)")
css += '''
/* ---- Rules below belong to the faulty version only ---- */

.consent-quiet {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
}

.consent-quiet a {
  color: #5f6375;
}
'''
(faulty / "css" / "site.css").write_bytes(css.encode("utf-8"))

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


# AA-S-06 default-src * (which also lets the scripts and font of AA-P-01 and AA-P-02 load)
set_header("index.html", "Content-Security-Policy",
           "default-src *; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'")
# AA-S-07 no Referrer-Policy; host of AA-P-03
set_header("sign-up.html", "Content-Security-Policy", csp_edit(CSP, add={"script-src": ["https://www.googleadservices.com"]}))
drop_header("sign-up.html", "Referrer-Policy")
# AA-S-01, AA-S-02, AA-S-03 session cookie without Secure, HttpOnly and SameSite (and without the __Host- prefix)
set_header("sign-in.html", "Set-Cookie", "sid=demo-session-0001; Path=/")
# AA-S-09 CSP without frame-ancestors (X-Frame-Options still sent)
set_header("reset-password.html", "Content-Security-Policy", csp_edit(CSP, drop=("frame-ancestors",)))
# AA-S-08 framework disclosed; host of AA-P-05
set_header("account.html", "Content-Security-Policy", csp_edit(CSP, add={"script-src": ["https://www.clarity.ms"]}))
set_header("account.html", "X-Powered-By", "Express")

lines = [
    "# Faulty version: generated by scripts/examples/plant_account_app.py from fixed/.headers; never edit by hand.",
    "# Planted header defects are listed in ../expected-security.json. One block per page, so that each",
    "# defect concerns one page only; the Content-Security-Policy is therefore never in the /* block.",
    "/*",
]
lines += [f"  {h}: {v}" for h, v in common if h not in PER_PAGE]
for name in pages:
    lines.append(f"/{name}")
    lines += [f"  {h}: {v}" for h, v in blocks[name]]
(faulty / ".headers").write_bytes(("\n".join(lines) + "\n").encode("utf-8"))

print("account-app faulty rebuilt")
