# Sortable table

A data table whose rows can be sorted by clicking a column header.

## When to use it

- Use a real `<table>` for data that has rows and columns. A grid of `<div>` elements loses the row and column relationships that screen readers announce cell by cell.
- Sorting that reloads the page (a link in each header leading to `?sort=amount&dir=desc`) is the simplest robust version and needs no script. The markup rules below apply to it as well; put `aria-sort` on the sorted header in the server-rendered HTML.
- Do not use `role="grid"` for a table that is only read and sorted. That role is for spreadsheet-like widgets where every cell is focusable and navigated with arrow keys.

Behaviour follows the [Sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/) of the ARIA Authoring Practices Guide. The code below is original to this project.

## Reference implementation

```html
<div class="table-scroll" role="region" aria-labelledby="orders-caption" tabindex="0">
  <table data-sortable data-status="orders-status" aria-describedby="orders-sort-hint">
    <caption id="orders-caption">Orders of the last 30 days</caption>
    <thead>
      <tr>
        <th scope="col" aria-sort="ascending">
          <button type="button" data-sort="text">Customer <span class="sort-icon" aria-hidden="true">▲</span></button>
        </th>
        <th scope="col">
          <button type="button" data-sort="number">Amount <span class="sort-icon" aria-hidden="true">↕</span></button>
        </th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Atelier Dubois</th>
        <td data-sort-value="1250.5">1,250.50 €</td>
        <td>Shipped</td>
      </tr>
      <tr>
        <th scope="row">Brasserie du Port</th>
        <td data-sort-value="89">89.00 €</td>
        <td>Awaiting payment</td>
      </tr>
      <tr>
        <th scope="row">Cycles Morel</th>
        <td data-sort-value="430">430.00 €</td>
        <td>Delivered</td>
      </tr>
    </tbody>
  </table>
</div>
<p id="orders-sort-hint" class="visually-hidden">Column headers that are buttons sort the table.</p>
<div id="orders-status" role="status" class="visually-hidden"></div>
```

```css
.table-scroll { overflow-x: auto; }
.table-scroll:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
table { border-collapse: collapse; }
th, td { padding: 0.5rem 0.75rem; border: 1px solid currentColor; text-align: start; }
th button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.75rem;      /* the whole header cell is the target */
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
}
th button:focus-visible { outline: 3px solid currentColor; outline-offset: -3px; }
```

```js
const ICONS = { ascending: '▲', descending: '▼', none: '↕' };

for (const table of document.querySelectorAll('table[data-sortable]')) {
  const status = document.getElementById(table.dataset.status);
  const collator = new Intl.Collator(document.documentElement.lang || undefined, { sensitivity: 'base' });

  table.tHead.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-sort]');
    if (!button) return;
    const header = button.closest('th');
    const direction = header.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';

    for (const other of table.tHead.querySelectorAll('th')) {
      other.removeAttribute('aria-sort');
      const icon = other.querySelector('.sort-icon');
      if (icon) icon.textContent = ICONS.none;
    }
    header.setAttribute('aria-sort', direction);
    button.querySelector('.sort-icon').textContent = ICONS[direction];

    const column = header.cellIndex;
    const valueOf = (row) => {
      const cell = row.cells[column];
      return cell.dataset.sortValue ?? cell.textContent.trim();
    };
    const compare = button.dataset.sort === 'number'
      ? (a, b) => Number(valueOf(a)) - Number(valueOf(b))
      : (a, b) => collator.compare(valueOf(a), valueOf(b));
    const body = table.tBodies[0];
    const rows = Array.from(body.rows).sort(compare);
    body.append(...(direction === 'ascending' ? rows : rows.reverse()));

    const label = button.firstChild.textContent.trim();
    if (status) status.textContent = `Table sorted by ${label}, ${direction} order`;
  });
}
```

Notes on the choices:

- The sort control is a `<button>` inside the `<th>`; the header keeps its `scope`, so cells are still announced with their column name.
- `aria-sort` is on the `<th>`, not on the button, and on one column at a time: the column that currently orders the table. Headers that are not sorted carry no `aria-sort`.
- The direction is shown by a character that differs in shape (▲, ▼, ↕), not by colour, and is hidden from assistive technology because `aria-sort` already says it.
- The hint that headers sort the table is written once, as the description of the table (`aria-describedby`), instead of being repeated in each button name. It is kept out of the caption so that the name of the table and of its scrollable region stays short.
- The header row is not rebuilt, so the button keeps focus after sorting and can be pressed again.
- The result is announced through a `role="status"` region: not every screen reader re-reads `aria-sort` when it changes.
- Displayed values keep their human format ("1,250.50 €"); `data-sort-value` carries the machine value, so sorting does not depend on parsing localised text.
- The wrapper scrolls sideways when the table is wider than the screen, keeps the page itself from scrolling in two directions, and is focusable and named so that a keyboard user can scroll it with the arrow keys.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab | Moves to the scrollable wrapper, then to each sort button, then on to the rest of the page |
| Enter or Space on a sort button | Sorts by that column, ascending; pressed again, descending. Focus stays on the button |
| Arrow keys on the wrapper | Scroll the table when it is wider than the screen |

## Common mistakes

- `onclick` on the `<th>` itself: not focusable, no role.
- No `aria-sort`, or `aria-sort` left on the previous column.
- Direction shown by an arrow colour, or by an icon font with no text alternative and no state in the code.
- Rebuilding the whole table on each sort, which drops keyboard focus to the top of the page.
- `display: block` or `display: flex` on `<table>`, `<tr>` or `<td>` to make the table responsive: this can strip the table semantics in some browsers, so test with a screen reader if you do it. Scroll the wrapper instead, or present a different, simpler structure (a list of cards) at narrow widths.
- No `<caption>`, no `scope` on headers, first-column identifiers in `<td>` instead of `<th scope="row">`.
- Row actions that are 16-pixel icons with no name ("edit", "delete" for which row?).

## Checklist

- [ ] The data is in a `<table>` with a `<caption>`, `<th scope="col">` column headers and `<th scope="row">` row headers [WCAG 1.3.1; RGAA 5.4, 5.6, 5.7]
- [ ] Each sort control is a `<button>` inside its header cell, with the column name as its accessible name [WCAG 4.1.2; RGAA 7.1]
- [ ] The sorted column, and only that one, carries `aria-sort="ascending"` or `aria-sort="descending"` on its `<th>` [WCAG 1.3.1; RGAA 7.1]
- [ ] The sort direction is visible through a shape or text, not colour alone [WCAG 1.4.1; RGAA 3.1]
- [ ] Keyboard focus stays on the sort button after sorting [WCAG 2.4.3; RGAA 7.3]
- [ ] The new order is announced through a `role="status"` region [WCAG 4.1.3; RGAA 7.5]
- [ ] A table wider than the viewport scrolls inside a focusable, named container [WCAG 1.4.10; RGAA 10.11]
