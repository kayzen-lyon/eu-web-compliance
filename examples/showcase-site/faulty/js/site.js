/* Brindle & Oak Joinery - example showcase site (faulty version: defects planted on purpose, see expected-defects.json).
   Vanilla JavaScript, no dependency. Part of the eu-web-compliance examples (MIT). */
(function () {
  'use strict';

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }

  /* ---------- Navigation: disclosure sub-menu ---------- */

  function initSubmenus() {
    toArray(document.querySelectorAll('button.nav-sub-toggle')).forEach(function (button) {
      var menu = document.getElementById(button.getAttribute('aria-controls'));
      var item = button.parentNode;
      if (!menu) {
        return;
      }

      function isOpen() {
        return button.getAttribute('aria-expanded') === 'true';
      }

      function setOpen(open) {
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        menu.hidden = !open;
      }

      button.addEventListener('click', function () {
        setOpen(!isOpen());
      });

      item.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && isOpen()) {
          setOpen(false);
          button.focus();
        }
      });

      item.addEventListener('focusout', function (event) {
        if (event.relatedTarget && !item.contains(event.relatedTarget)) {
          setOpen(false);
        }
      });

      document.addEventListener('click', function (event) {
        if (!item.contains(event.target)) {
          setOpen(false);
        }
      });
    });
  }

  /* Mouse-only toggle used by the home page menu. */
  window.toggleSubmenu = function (toggle) {
    var menu = toggle.parentNode.querySelector('.submenu');
    menu.hidden = !menu.hidden;
  };

  /* ---------- Form validation ---------- */

  function fieldHolder(field) {
    return field.closest('.field') || field.parentNode;
  }

  function describedBy(element, errorId, add) {
    var ids = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (id) {
      return id && id !== errorId;
    });
    if (add) {
      ids.push(errorId);
    }
    if (ids.length) {
      element.setAttribute('aria-describedby', ids.join(' '));
    } else {
      element.removeAttribute('aria-describedby');
    }
  }

  function setError(target, anchor, message) {
    var errorId = target.id + '-error';
    var existing = document.getElementById(errorId);
    if (existing) {
      existing.parentNode.removeChild(existing);
    }
    describedBy(target, errorId, Boolean(message));
    if (target.tagName !== 'FIELDSET') {
      if (message) {
        target.setAttribute('aria-invalid', 'true');
      } else {
        target.removeAttribute('aria-invalid');
      }
    }
    if (!message) {
      return;
    }
    var error = document.createElement('p');
    error.className = 'field-error';
    error.id = errorId;
    error.textContent = 'Error: ' + message;
    anchor.parentNode.insertBefore(error, anchor);
  }

  function fieldMessage(field) {
    var value = field.value.trim();
    if (field.type === 'checkbox') {
      return field.required && !field.checked ? field.dataset.msgRequired : '';
    }
    if (field.required && value === '') {
      return field.dataset.msgRequired;
    }
    if (value !== '' && field.type === 'email' && !EMAIL_PATTERN.test(value)) {
      return field.dataset.msgFormat;
    }
    if (value !== '' && field.dataset.pattern && !new RegExp(field.dataset.pattern).test(value)) {
      return field.dataset.msgFormat;
    }
    return '';
  }

  function renderSummary(form, errors) {
    var summary = form.querySelector('.error-summary');
    if (!summary) {
      return;
    }
    var list = summary.querySelector('ul');
    list.textContent = '';
    errors.forEach(function (error) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + error.focusTarget.id;
      link.textContent = error.message;
      link.addEventListener('click', function (event) {
        event.preventDefault();
        error.focusTarget.focus();
      });
      item.appendChild(link);
      list.appendChild(item);
    });
    summary.hidden = errors.length === 0;
    if (errors.length) {
      summary.focus();
    }
  }

  /* Checks every visible control of the form, writes one text message per
     error next to its field, links it with aria-describedby, then lists all
     errors in a summary that receives focus. Returns true when valid. */
  function validateForm(form) {
    var errors = [];
    var controls = form.querySelectorAll('input, select, textarea, fieldset[data-required-group]');
    toArray(controls).forEach(function (control) {
      if (control.disabled || control.closest('[hidden]')) {
        return;
      }
      if (control.tagName === 'FIELDSET') {
        var radios = toArray(control.querySelectorAll('input[type="radio"]'));
        var checked = radios.some(function (radio) {
          return radio.checked;
        });
        var groupMessage = checked ? '' : control.dataset.msgRequired;
        setError(control, control.querySelector('.choice'), groupMessage);
        if (groupMessage) {
          errors.push({ focusTarget: radios[0], message: groupMessage });
        }
        return;
      }
      if (control.type === 'radio' || control.type === 'range' || control.type === 'hidden') {
        return;
      }
      var message = fieldMessage(control);
      var holder = fieldHolder(control);
      var anchor = holder.querySelector('.password-row') || control;
      setError(control, anchor, message);
      if (message) {
        errors.push({ focusTarget: control, message: message });
      }
    });
    renderSummary(form, errors);
    return errors.length === 0;
  }

  function clearErrors(form) {
    toArray(form.querySelectorAll('.field-error')).forEach(function (error) {
      error.parentNode.removeChild(error);
    });
    toArray(form.querySelectorAll('[aria-invalid]')).forEach(function (field) {
      field.removeAttribute('aria-invalid');
    });
    var summary = form.querySelector('.error-summary');
    if (summary) {
      summary.hidden = true;
    }
  }

  /* ---------- Callback modal (custom) ---------- */

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

  /* ---------- Testimonials carousel ---------- */

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

  /* ---------- Before / after comparison (drag handle) ---------- */

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

  /* ---------- Contact page ---------- */

  function initQuickNav() {
    var form = document.getElementById('quick-nav-form');
    if (!form) {
      return;
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      window.location.href = form.querySelector('select').value;
    });
  }

  function initSameAddress() {
    var checkbox = document.getElementById('same-address');
    var fields = document.getElementById('site-address-fields');
    if (!checkbox || !fields) {
      return;
    }

    function apply() {
      fields.hidden = checkbox.checked;
      toArray(fields.querySelectorAll('input')).forEach(function (input) {
        input.required = !checkbox.checked;
      });
    }

    checkbox.addEventListener('change', apply);
    apply();
  }

  function initContactForm() {
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

  /* ---------- Sign-in page ---------- */

  function initSignIn() {
    var form = document.getElementById('sign-in-form');
    var status = document.getElementById('sign-in-status');
    if (!form) {
      return;
    }
    var password = document.getElementById('signin-password');
    var toggle = document.getElementById('toggle-password');
    var email = document.getElementById('signin-email');

    /* Sends focus back to the email field until it holds a valid address. */
    email.addEventListener('blur', function () {
      if (!EMAIL_PATTERN.test(email.value.trim())) {
        window.setTimeout(function () {
          email.focus();
        }, 0);
      }
    });

    toggle.addEventListener('click', function () {
      var show = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      password.type = show ? 'text' : 'password';
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      status.textContent = '';
      if (validateForm(form)) {
        status.textContent = 'This is a demonstration: there is no client area behind this form, and nothing was sent.';
      }
    });
  }

  initSubmenus();
  initCallbackDialog();
  initCarousel();
  initCompare();
  initQuickNav();
  initSameAddress();
  initContactForm();
  initSignIn();
}());
