"""Rebuilds examples/showcase-site/faulty from fixed and plants the defects.
Usage: python scripts/examples/plant_showcase.py examples
Run it after any change to fixed/: faulty/ is generated, never edited by hand."""
import re
import shutil
import sys
from pathlib import Path

site = Path(sys.argv[1]) / "showcase-site"
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


def section(text, start, end, new):
    a = text.index(start)
    b = text.index(end)
    return text[:a] + new + text[b:]


# ------------------------------------------------------------------ index.html
edit("index.html", [
    # SC-01 image without alt
    ('<img src="img/staircase.svg" width="320" height="240" alt="Drawing of a straight staircase with six treads, square balusters and a handrail.">',
     '<img src="img/staircase.svg" width="320" height="240">'),
    # SC-02 alt that describes nothing
    ('alt="Drawing of a tall bookcase with four shelves filled with books of different heights."', 'alt="DSC_0042.jpg"'),
    # SC-06 sub-menu toggle is a div with a click handler
    ('<button type="button" class="nav-sub-toggle" aria-expanded="false" aria-controls="submenu-services">Services</button>',
     '<div class="nav-sub-toggle" onclick="toggleSubmenu(this)">Services</div>'),
    # SC-07 no pause control
    ('          <button type="button" class="carousel-pause">Pause automatic rotation</button>\n', ''),
    # SC-08 icon-only buttons without a name
    ('\n            <span class="visually-hidden">Previous testimonial</span>', ''),
    ('\n            <span class="visually-hidden">Next testimonial</span>', ''),
    # SC-11 no captions track
    ('          <track kind="captions" src="media/workshop.en.vtt" srclang="en" label="English captions" default>\n', ''),
    # SC-13 / SC-14 custom modal instead of <dialog>
    ('<dialog id="callback-dialog" aria-labelledby="callback-title">', '<div class="modal" id="callback-dialog" hidden>\n      <div class="modal-box">'),
    ('<form id="callback-form" method="dialog" novalidate>', '<form id="callback-form" novalidate>'),
    ('    </dialog>\n  </main>', '      </div>\n    </div>\n  </div>'),
    # SC-16 no main landmark
    ('<main id="main">', '<div id="main">'),
    # SC-17 French passage without lang
    ('<span lang="fr">« Le bois', '<span>« Le bois'),
    # ambiguous link text
    ('>Request a quote for a similar project</a>', '>Click here</a>'),
    # SC-22 link with no text
    ('              </svg>\n              Phone the workshop\n', '              </svg>\n'),
    # SC-23 drag-only comparison
    ('        </div>\n        <label for="compare-range">Share of the picture showing the door before restoration</label>\n        <input type="range" id="compare-range" min="0" max="100" step="5" value="50">\n',
     '          <div class="compare-handle"></div>\n        </div>\n        <p>Drag the handle to compare the two pictures.</p>\n'),
])

# ---------------------------------------------------------------- pricing.html
text = (faulty / "pricing.html").read_text(encoding="utf-8")
a = text.index('<table class="prices">')
b = text.index("</table>", a)
table = text[a:b]
# SC-24 no header cells in the price table
table = table.replace('<th scope="col">', '<td class="head">').replace('<th scope="row">', '<td class="head">').replace("</th>", "</td>")
# SC-26 availability shown by a coloured dot only
table = re.sub(r'<span class="status">\s*<svg[^>]*><circle[^>]*/></svg>\s*Open\s*</span>', '<span class="status-dot dot-green"></span>', table)
table = re.sub(r'<span class="status">\s*<svg[^>]*><path[^>]*/></svg>\s*Waiting list\s*</span>', '<span class="status-dot dot-red"></span>', table)
assert table.count("status-dot") == 4 and "<th " not in table and "<th>" not in table
text = text[:a] + table + text[b:]
(faulty / "pricing.html").write_bytes(text.encode("utf-8"))
edit("pricing.html", [
    # SC-25 headers attributes point to an id that does not exist
    ('<th id="r-weekend">Saturday</th>', '<th id="r-saturday">Saturday</th>'),
    # SC-27 empty title
    ('<title>Price guide – Brindle &amp; Oak Joinery</title>', '<title></title>'),
    # SC-28 skip link to a missing target
    ('<a class="skip-link" href="#main">', '<a class="skip-link" href="#content">'),
])

# ---------------------------------------------------------------- contact.html
edit("contact.html", [
    # SC-36 zoom disabled
    ('<meta name="viewport" content="width=device-width, initial-scale=1">',
     '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">'),
    # SC-35 select that navigates on change
    ('''      <form class="quick-nav" id="quick-nav-form" action="pricing.html">
        <div class="field">
          <label for="quick-nav">Check typical prices first</label>
          <select id="quick-nav" name="section">
''', '''      <div class="quick-nav">
        <div class="field">
          <label for="quick-nav">Check typical prices first</label>
          <select id="quick-nav" name="section" onchange="if (this.value) { window.location.href = this.value; }">
            <option value="">Choose a service</option>
'''),
    ('''        </div>
        <button type="submit" class="button button-secondary">Go to the price guide</button>
      </form>
''', '''        </div>
      </div>
'''),
    # SC-32 errors shown by colour only: no summary, no messages
    ('''        <div class="error-summary" id="contact-errors" tabindex="-1" hidden>
          <h3>There is a problem</h3>
          <ul></ul>
        </div>

''', ''),
    # SC-29 email field without a programmatic label
    ('<label for="email">Email address</label>', '<span class="field-label">Email address</span>'),
    ('<input type="email" id="email" name="email"', '<input type="email" name="email"'),
    # SC-30 invalid autocomplete value
    ('id="phone" name="phone" autocomplete="tel"', 'id="phone" name="phone" autocomplete="nope"'),
    # SC-34 the work address must be typed again
    ('''          <div class="choice">
            <input type="checkbox" id="same-address" name="same-address" checked>
            <label for="same-address">Same as my address above</label>
          </div>
          <div id="site-address-fields" hidden>
''', '''          <div id="site-address-fields">
'''),
    ('<input type="text" id="site-address" name="site-address" data-msg', '<input type="text" id="site-address" name="site-address" required data-msg'),
    ('<input type="text" id="site-postcode" name="site-postcode" data-msg', '<input type="text" id="site-postcode" name="site-postcode" required data-msg'),
    # SC-31 radio buttons without fieldset and legend
    ('''        <fieldset class="radio-group" id="work-type" data-required-group data-msg-required="Select a type of work">
          <legend>Type of work</legend>
''', '''        <div class="radio-group" id="work-type">
          <p class="field-label">Type of work</p>
'''),
    ('''            <label for="work-other">Something else</label>
          </div>
        </fieldset>
''', '''            <label for="work-other">Something else</label>
          </div>
        </div>
'''),
    # SC-37 accessible name does not contain the visible label
    ('<button type="submit" class="button">Send request</button>', '<button type="submit" class="button" aria-label="Submit form">Send request</button>'),
    # SC-33 status message without role
    ('<p class="form-status" id="form-status" role="status"></p>', '<p class="form-status" id="form-status"></p>'),
])

# ---------------------------------------------------------------- sign-in.html
edit("sign-in.html", [
    # SC-40 no lang
    ('<html lang="en">', '<html>'),
    # SC-41 timed refresh
    ('  <meta name="viewport" content="width=device-width, initial-scale=1">\n',
     '  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta http-equiv="refresh" content="600">\n'),
    # SC-38 paste blocked, password managers discouraged
    ('<span class="hint" id="password-hint">You can paste it or let your password manager fill it in.</span>',
     '<span class="hint" id="password-hint">For your security, pasting is disabled: type your password.</span>'),
    ('name="password" autocomplete="current-password"', 'name="password" autocomplete="off" onpaste="return false"'),
    # SC-39 help line moved from the header to the end of the footer
    ('      <p class="help-line">Need help? <a href="tel:+441632960417">Call 01632 960 417</a></p>\n    </div>\n  </header>',
     '    </div>\n  </header>'),
    ('      <p>Brindle &amp; Oak Joinery is a fictional business. This is an example site of the eu-web-compliance project.</p>\n',
     '      <p>Brindle &amp; Oak Joinery is a fictional business. This is an example site of the eu-web-compliance project.</p>\n      <p class="help-line">Need help? <a href="tel:+441632960417">Call 01632 960 417</a></p>\n'),
])

# ------------------------------------------------------------------------ CSS
css = (faulty / "css" / "site.css").read_text(encoding="utf-8")
css = css.replace("(fixed version)", "(faulty version: defects planted on purpose, see expected-defects.json)")
a = css.index("@media (prefers-reduced-motion: reduce) {")
css = css[:a].rstrip() + "\n"
css += '''
/* ---- Rules below belong to the faulty version only ---- */

.hero .lead {
  color: #a3aaad;
}

.services-intro a {
  text-decoration: none;
}

.hero-actions a.button:focus,
.hero-actions a.button:focus-visible {
  outline: none;
}

.hero-badge {
  animation: badge-pulse 1.2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
}

.notice-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding: 3.5rem 0;
}

.gallery {
  grid-template-columns: repeat(3, 300px);
}

.carousel-picker {
  gap: 4px;
}

.carousel-picker button {
  width: 14px;
  min-width: 0;
  height: 14px;
  min-height: 0;
  padding: 0;
  font-size: 0;
  border-radius: 50%;
}

.compare-frame::after {
  content: none;
}

.compare-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--split);
  width: 28px;
  margin-left: -14px;
  background: #ffffff;
  border: 2px solid var(--ink);
  cursor: ew-resize;
  touch-action: none;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
}

.modal-box {
  width: calc(100% - 2rem);
  max-width: 30rem;
  padding: 1.5rem;
  background: var(--paper);
  border-radius: 0.5rem;
}

.modal-box h2 {
  margin-top: 0;
}

.prices td.head {
  font-weight: 700;
  background: var(--cream);
}

.status-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.dot-green {
  background: #1d7a3e;
}

.dot-red {
  background: #c62828;
}

.is-invalid {
  border-color: #e53935;
}

#sign-in-form input {
  border: 1px solid #d5d9db;
}
'''
(faulty / "css" / "site.css").write_bytes(css.encode("utf-8"))

# ------------------------------------------------------------------------- JS
js = (faulty / "js" / "site.js").read_text(encoding="utf-8")
js = js.replace("(fixed version)", "(faulty version: defects planted on purpose, see expected-defects.json)")

js = js.replace("  /* ---------- Form validation ---------- */", '''  /* Mouse-only toggle used by the home page menu. */
  window.toggleSubmenu = function (toggle) {
    var menu = toggle.parentNode.querySelector('.submenu');
    menu.hidden = !menu.hidden;
  };

  /* ---------- Form validation ---------- */''')

js = section(js, "  /* ---------- Callback dialog (native <dialog>) ---------- */", "  /* ---------- Testimonials carousel ---------- */", '''  /* ---------- Callback modal (custom) ---------- */

  function initCallbackDialog() {
    var modal = document.getElementById('callback-dialog');
    var opener = document.getElementById('open-callback');
    var status = document.getElementById('callback-status');
    if (!modal || !opener) {
      return;
    }
    var form = modal.querySelector('form');

    opener.addEventListener('click', function () {
      status.textContent = '';
      modal.hidden = false;
    });

    modal.querySelector('[data-close]').addEventListener('click', function () {
      modal.hidden = true;
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (validateForm(form)) {
        form.reset();
        modal.hidden = true;
        status.textContent = 'Thank you. We will call you back within one working day. (Demo: nothing was sent.)';
      }
    });
  }

''')

js = section(js, "  /* ---------- Testimonials carousel ---------- */", "  /* ---------- Before / after comparison (native range input) ---------- */", '''  /* ---------- Testimonials carousel ---------- */

  function initCarousel() {
    var carousel = document.querySelector('.carousel');
    if (!carousel) {
      return;
    }
    var slides = toArray(carousel.querySelectorAll('.slide'));
    var pickers = toArray(carousel.querySelectorAll('.carousel-picker button'));
    var index = 0;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, position) {
        slide.hidden = position !== index;
      });
      pickers.forEach(function (picker, position) {
        if (position === index) {
          picker.setAttribute('aria-current', 'true');
        } else {
          picker.removeAttribute('aria-current');
        }
      });
    }

    carousel.querySelector('.carousel-prev').addEventListener('click', function () {
      show(index - 1);
    });
    carousel.querySelector('.carousel-next').addEventListener('click', function () {
      show(index + 1);
    });
    pickers.forEach(function (picker, position) {
      picker.addEventListener('click', function () {
        show(position);
      });
    });

    show(0);
    window.setInterval(function () {
      show(index + 1);
    }, 4000);
  }

''')

js = section(js, "  /* ---------- Before / after comparison (native range input) ---------- */", "  /* ---------- Contact page ---------- */", '''  /* ---------- Before / after comparison (drag handle) ---------- */

  function initCompare() {
    var frame = document.querySelector('.compare-frame');
    var handle = document.querySelector('.compare-handle');
    if (!frame || !handle) {
      return;
    }
    var dragging = false;

    handle.addEventListener('pointerdown', function (event) {
      dragging = true;
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', function (event) {
      if (!dragging) {
        return;
      }
      var box = frame.getBoundingClientRect();
      var share = Math.min(100, Math.max(0, (event.clientX - box.left) / box.width * 100));
      frame.style.setProperty('--split', share + '%');
    });
    handle.addEventListener('pointerup', function () {
      dragging = false;
    });
  }

''')

a = js.index("  function initContactForm() {")
b = js.index("  /* ---------- Sign-in page ---------- */")
js = js[:a] + '''  function initContactForm() {
    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    if (!form) {
      return;
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var valid = true;
      toArray(form.querySelectorAll('input[required], textarea[required]')).forEach(function (field) {
        var value = field.value.trim();
        var wrong = value === '' || (field.type === 'email' && !EMAIL_PATTERN.test(value));
        field.classList.toggle('is-invalid', wrong);
        if (wrong) {
          valid = false;
        }
      });
      status.textContent = '';
      if (valid) {
        form.reset();
        status.textContent = 'Thank you. Your request has been received; we reply within two working days. (Demo: nothing was sent.)';
      }
    });
  }

''' + js[b:]

old = "    var toggle = document.getElementById('toggle-password');\n"
assert js.count(old) == 1
js = js.replace(old, old + '''    var email = document.getElementById('signin-email');

    /* Sends focus back to the email field until it holds a valid address. */
    email.addEventListener('blur', function () {
      if (!EMAIL_PATTERN.test(email.value.trim())) {
        window.setTimeout(function () {
          email.focus();
        }, 0);
      }
    });
''')
(faulty / "js" / "site.js").write_bytes(js.encode("utf-8"))
print("showcase faulty rebuilt")
