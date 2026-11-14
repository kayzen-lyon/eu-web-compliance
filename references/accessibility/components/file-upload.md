# File upload

A field to choose one or more files, with the list of chosen files, validation and progress.

## When to use it

- The native `<input type="file">` with a `<label>` is accessible as it is: focusable, operable with Enter and Space, announced with its label and the chosen file name. Use it unstyled whenever the design allows.
- The enhanced version below adds a list of files with a remove button for each, client-side checks and announcements. Add it when several files are expected or when files must be removable one by one.
- A drag-and-drop zone is only ever an addition to the file field. Dropping files is impossible with a keyboard, a switch or voice control, and difficult for anyone who cannot hold a button while moving.

There is no ARIA Authoring Practices pattern for file upload. This component applies the general rules for form fields, status messages and dragging. The code is original to this project.

## Reference implementation

```html
<div class="upload" data-max-bytes="5242880">
  <label for="proof">Proof of address (required)</label>
  <p id="proof-hint">PDF, JPG or PNG. 5 MB at most per file. You can add several files.</p>
  <input id="proof" name="proof" type="file" multiple required
         accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
         aria-describedby="proof-hint proof-error">
  <p id="proof-error" class="field-error"></p>

  <h3 id="proof-files-title" hidden>Files to send</h3>
  <ul id="proof-files" aria-labelledby="proof-files-title"></ul>

  <div id="proof-status" role="status" class="visually-hidden"></div>
</div>
```

```css
.upload input[type="file"] { max-width: 100%; min-height: 2.75rem; font: inherit; }
.upload input[type="file"]:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
.upload.is-dragover { outline: 3px dashed currentColor; outline-offset: 4px; }
.field-error:not(:empty) { border-inline-start: 4px solid currentColor; padding-inline-start: 0.75rem; font-weight: 700; }
#proof-files { padding: 0; list-style: none; }
#proof-files li { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 0.25rem 0; }
#proof-files button { min-height: 2.75rem; padding: 0.5rem 0.75rem; font: inherit; }
```

```js
const root = document.querySelector('.upload');
const input = root.querySelector('input[type="file"]');
const list = document.getElementById('proof-files');
const listTitle = document.getElementById('proof-files-title');
const error = document.getElementById('proof-error');
const status = document.getElementById('proof-status');
const maxBytes = Number(root.dataset.maxBytes);
const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
let files = [];

const formatSize = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

// Clear, then write: the same message twice in a row is announced twice.
const say = (message) => {
  status.textContent = '';
  window.setTimeout(() => { status.textContent = message; }, 100);
};

const syncInput = () => {           // keep the real field in step, so the form submits these files
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
};

const render = () => {
  list.replaceChildren(...files.map((file, index) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = `${file.name} (${formatSize(file.size)})`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.index = String(index);
    remove.textContent = `Remove ${file.name}`;
    item.append(name, remove);
    return item;
  }));
  listTitle.hidden = files.length === 0;
};

const addFiles = (candidates) => {
  const rejected = [];
  const accepted = [];
  for (const file of candidates) {
    if (!allowed.includes(file.type)) rejected.push(`${file.name}: this format is not accepted, use PDF, JPG or PNG`);
    else if (file.size > maxBytes) rejected.push(`${file.name}: ${formatSize(file.size)}, the limit is ${formatSize(maxBytes)}`);
    else accepted.push(file);
  }
  files = [...files, ...accepted];
  syncInput();
  render();
  error.textContent = rejected.length > 0 ? `Error: ${rejected.join('. ')}` : '';
  input.setAttribute('aria-invalid', String(rejected.length > 0));
  say(rejected.length > 0
    ? `${rejected.length} file(s) not added. ${error.textContent}`
    : `${accepted.length} file(s) added, ${files.length} in total`);
};

input.addEventListener('change', () => addFiles(Array.from(input.files)));

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-index]');
  if (!button) return;
  const index = Number(button.dataset.index);
  const removed = files[index];
  files = files.filter((_, i) => i !== index);
  syncInput();
  render();
  say(`${removed.name} removed, ${files.length} file(s) left`);
  const next = list.querySelectorAll('button')[Math.min(index, files.length - 1)];
  (next ?? input).focus();          // never leave focus on a removed element
});

// Optional complement: dropping files onto the block. The file field remains the main route.
root.addEventListener('dragover', (event) => { event.preventDefault(); root.classList.add('is-dragover'); });
root.addEventListener('dragleave', () => root.classList.remove('is-dragover'));
root.addEventListener('drop', (event) => {
  event.preventDefault();
  root.classList.remove('is-dragover');
  addFiles(Array.from(event.dataTransfer.files));
});
```

Notes on the choices:

- Accepted formats and the size limit are stated before the person chooses, in a hint tied to the field. Learning the limit from an error message after a long upload wastes effort that some people cannot spare.
- Each remove button names its file ("Remove invoice.pdf"): a row of identical "Remove" buttons is meaningless out of visual context.
- When a file is removed, focus goes to the next remove button, or to the file field if the list is empty. Removing the focused element without this sends keyboard focus back to the top of the page.
- Messages go to a `role="status"` region; the error text is also visible next to the field and tied to it with `aria-describedby`. The word "Error:" is part of the text itself (not generated in CSS), so the message does not rely on colour or on styles being loaded.
- Checks done in the browser are a convenience. The server validates again and returns errors in the same form, with the same wording and with the files already accepted still listed where possible.

### Styling the field as a button

Keep the real input in the page and focusable. Hide it with the visually-hidden class (see [../rules.md](../rules.md), section 1), style its `<label>` as the button, and show focus on the label when the input has it:

```css
.upload-label { display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0.5rem 1rem; border: 2px solid currentColor; }
.upload input.visually-hidden:focus-visible + .upload-label { outline: 3px solid currentColor; outline-offset: 2px; }
```

Never hide the input with `display: none` or `hidden`: it would leave the Tab sequence, and the styled label alone is not focusable.

### Progress

For an upload that takes time, show a native `<progress>` with a label, and announce the start and the end in the status region rather than every percent:

```html
<label for="proof-progress">Sending invoice.pdf</label>
<progress id="proof-progress" max="100" value="40">40 %</progress>
```

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab | Moves to the file field, then to each remove button |
| Enter or Space on the file field | Opens the file chooser of the operating system |
| Enter or Space on a remove button | Removes that file; focus moves to the next remove button, or to the file field |

## Common mistakes

- A drop zone built from a `<div>` with the real input hidden by `display: none`: nothing to focus, nothing announced.
- "Drag your files here" as the only instruction.
- Format and size limits revealed only by an error.
- Errors shown as a red border with no text, or as a toast that disappears.
- The list of chosen files rendered with no announcement, so a screen reader user does not know whether the choice was taken into account.
- Remove buttons that are a bare "×".
- A progress bar made of `<div>` elements with no role, value or label.
- Emptying the whole selection when one file is invalid.

## Checklist

- [ ] The upload is a native `<input type="file">` with a visible, associated `<label>`, and it stays focusable when restyled [WCAG 2.1.1; RGAA 11.1]
- [ ] Accepted formats and size limits are stated before selection and tied to the field [WCAG 3.3.2; RGAA 11.10]
- [ ] Everything that drag and drop does can be done through the file field [WCAG 2.5.7]
- [ ] Each chosen file is listed in text with a remove button that names the file [WCAG 4.1.2; RGAA 11.9]
- [ ] Adding, removing and rejecting files are announced through a `role="status"` region [WCAG 4.1.3; RGAA 7.5]
- [ ] A rejected file produces a text error that names the file, gives the reason and says what is accepted [WCAG 3.3.3; RGAA 11.11]
- [ ] After a file is removed, keyboard focus is on a logical element, not lost [WCAG 2.4.3; RGAA 7.3]
- [ ] Progress is exposed with `<progress>` or `role="progressbar"` and a label [WCAG 4.1.2; RGAA 7.1]
