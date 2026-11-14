# Combobox with autocomplete

A text field that proposes a list of suggestions while the person types.

## When to use it

- For a short, fixed list of choices, use a native `<select>` or a group of radio buttons. They need no script and work with every assistive technology.
- For simple suggestions on a text field, `<input list>` with `<datalist>` is native, but the suggestion list cannot be styled, does not always follow zoom and text-size settings, and is announced unevenly by screen readers. Test it with the browsers you target before relying on it.
- Use the custom combobox below when the list is long or fetched from a server (illustrations: station search, product search, address lookup).

A combobox is among the hardest components to get right. Whatever you build, typing the full value and submitting must still work: suggestions are a help, not a gate.

Behaviour follows the [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) of the ARIA Authoring Practices Guide (editable combobox, list autocomplete, manual selection). The code below is original to this project.

## Reference implementation

```html
<div class="combobox">
  <label for="station">Departure station</label>
  <p id="station-hint">Type at least two letters, then use the arrow keys to browse the suggestions.</p>
  <input id="station" name="station" type="text"
         role="combobox" aria-autocomplete="list" aria-expanded="false"
         aria-controls="station-list" aria-describedby="station-hint"
         autocomplete="off" autocapitalize="none" spellcheck="false">
  <ul id="station-list" role="listbox" aria-label="Stations" hidden></ul>
  <div id="station-status" role="status" class="visually-hidden"></div>
</div>
```

```css
.combobox { position: relative; max-width: 24rem; }
.combobox input { box-sizing: border-box; width: 100%; min-height: 2.75rem; font: inherit; border: 2px solid currentColor; }
.combobox [role="listbox"] {
  position: absolute;
  z-index: 10;
  inset-inline: 0;
  max-height: 16rem;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  background: Canvas;
  color: CanvasText;
  border: 2px solid currentColor;
}
.combobox [role="option"] { min-height: 2.75rem; padding: 0.5rem 0.75rem; }
/* The active option differs by more than colour: an inset bar and an outline. */
.combobox [role="option"][aria-selected="true"] {
  outline: 2px solid currentColor;
  outline-offset: -2px;
  box-shadow: inset 0.375rem 0 0 currentColor;
}
```

```js
function setupCombobox(input, getSuggestions) {
  const listbox = document.getElementById(input.getAttribute('aria-controls'));
  const status = input.closest('.combobox').querySelector('[role="status"]');
  let options = [];
  let active = -1;

  const setActive = (index) => {
    active = index;
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    if (index === -1) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    input.setAttribute('aria-activedescendant', options[index].id);
    options[index].scrollIntoView({ block: 'nearest' });
  };

  const close = () => {
    listbox.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    setActive(-1);
  };

  const render = (values) => {
    options = values.map((value, i) => {
      const option = document.createElement('li');
      option.id = `${listbox.id}-option-${i}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.textContent = value;
      return option;
    });
    listbox.replaceChildren(...options);
    listbox.hidden = options.length === 0;
    input.setAttribute('aria-expanded', String(options.length > 0));
    setActive(-1);
    status.textContent = options.length === 0
      ? 'No suggestion'
      : `${options.length} suggestions available`;
  };

  const choose = (index) => {
    input.value = options[index].textContent;
    close();
    status.textContent = `${input.value} selected`;
  };

  input.addEventListener('input', async () => {
    const query = input.value.trim();
    if (query.length < 2) {
      close();
      status.textContent = '';
      return;
    }
    const values = await getSuggestions(query);
    if (input.value.trim() === query) render(values);   // ignore answers that arrive late
  });

  input.addEventListener('keydown', (event) => {
    if (listbox.hidden) {
      if (event.key === 'ArrowDown' && input.value.trim().length >= 2) {
        event.preventDefault();                         // reopen the suggestions
        input.dispatchEvent(new Event('input'));
      }
      return;
    }
    const last = options.length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(active === last ? 0 : active + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(active <= 0 ? last : active - 1);
    } else if (event.key === 'Enter' && active !== -1) {
      event.preventDefault();                           // do not submit the form
      choose(active);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  listbox.addEventListener('mousedown', (event) => event.preventDefault()); // keep focus in the field
  listbox.addEventListener('click', (event) => {
    const option = event.target.closest('[role="option"]');
    if (option) choose(options.indexOf(option));
  });
  input.addEventListener('blur', close);
}

// Illustration: a static list. Replace with a request to your own endpoint.
const stations = ['Lille Europe', 'Lille Flandres', 'Lyon Part-Dieu', 'Lyon Perrache', 'Marseille Saint-Charles'];
setupCombobox(document.getElementById('station'), async (query) =>
  stations.filter((name) => name.toLowerCase().includes(query.toLowerCase())));
```

Notes on the choices:

- Keyboard focus never leaves the text field. The option being browsed is pointed to with `aria-activedescendant`, and the screen reader announces it. Moving real focus into the list would stop the person from typing.
- Nothing is selected automatically: Enter with no highlighted option submits the form with what was typed.
- The number of suggestions is written into a `role="status"` region that exists before any text is put in it, so that a screen reader user learns that a list appeared. If requests are frequent, wait about half a second after the last keystroke before updating the message.
- `autocomplete="off"` is set here because this field is a search, and the browser's own suggestion list would cover the custom one. Do not copy it to fields that collect personal data (name, address, email): those need their `autocomplete` token (see [../rules.md](../rules.md), section 5). An address lookup should fill ordinary, editable address fields that keep their tokens.
- The `mousedown` handler only stops the field from losing focus; the choice itself is made on `click`, so a press can still be cancelled by sliding away.
- System colours (`Canvas`, `CanvasText`) keep the list readable in dark and forced-colours modes. With brand colours, check each state for contrast.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Typing | Updates the suggestions; focus stays in the field |
| Down Arrow / Up Arrow | Highlights the next / previous suggestion, wrapping at the ends |
| Enter | With a suggestion highlighted: puts it in the field and closes the list. Otherwise: submits the form |
| Down Arrow, list closed | Reopens the suggestions (at least two letters typed) |
| Escape | Closes the list and keeps the typed text |
| Tab | Leaves the field and closes the list, keeping the typed text |

## Common mistakes

- A list of `<div>` elements with no roles: a screen reader user types and hears nothing about the suggestions.
- `aria-expanded` never updated, or `aria-activedescendant` pointing to an `id` that does not exist.
- Options reachable by mouse only.
- The highlighted option marked by a background colour alone, often with too little contrast.
- The first suggestion applied automatically on Tab or on blur, replacing what the person typed.
- The list closing as soon as the pointer leaves the field, before a slow pointer user reaches an option.
- No result message: silence both when the list appears and when there is nothing to show.
- The list cut off or covering the field at 200 % zoom or at 320 CSS pixels.

## Checklist

- [ ] The field has a visible `<label>`, `role="combobox"`, `aria-expanded`, `aria-controls` and `aria-autocomplete`; the list has `role="listbox"` and its items `role="option"` [WCAG 4.1.2; RGAA 7.1]
- [ ] Arrow keys browse the suggestions, Enter chooses, Escape closes, and focus stays in the field throughout [WCAG 2.1.1; RGAA 7.3]
- [ ] The browsed option is exposed with `aria-activedescendant` and `aria-selected="true"`, and shown with a cue other than colour [WCAG 1.4.1; RGAA 3.1]
- [ ] The appearance of suggestions and their number are announced through a `role="status"` region [WCAG 4.1.3; RGAA 7.5]
- [ ] Moving through the suggestions changes nothing by itself: a choice is only made on Enter or click [WCAG 3.2.2; RGAA 7.4]
- [ ] Free text can still be submitted when no suggestion fits [best practice]
- [ ] At 200 % zoom and at 320 CSS pixels wide, the field and the list stay fully visible and usable [WCAG 1.4.10; RGAA 10.11]
