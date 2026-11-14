# Tabs

A row of tabs that shows one panel at a time.

## When to use it

- Use tabs for a small number of parallel views of the same level (illustrations: delivery options, monthly and yearly prices, description and reviews).
- Do not use tabs for links between pages: that is a navigation list with `aria-current="page"` ([navigation-menu.md](navigation-menu.md)). Do not use them for the steps of a process ([multi-step-form.md](multi-step-form.md)).
- There is no native HTML tabs element. When there are many sections, or when the layout is narrow, stacked sections with headings or an accordion ([accordion.md](accordion.md)) are simpler and work without script.

Behaviour follows the [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) of the ARIA Authoring Practices Guide, with automatic activation (a tab shows its panel as soon as it receives focus), which the pattern recommends when panels are already in the page. The code below is original to this project.

## Reference implementation

```html
<h2 id="delivery-title">Delivery options</h2>

<div role="tablist" aria-labelledby="delivery-title">
  <button type="button" role="tab" id="tab-home" aria-controls="panel-home" aria-selected="true">Home delivery</button>
  <button type="button" role="tab" id="tab-pickup" aria-controls="panel-pickup" aria-selected="false" tabindex="-1">Pickup point</button>
  <button type="button" role="tab" id="tab-store" aria-controls="panel-store" aria-selected="false" tabindex="-1">In store</button>
</div>

<div role="tabpanel" id="panel-home" aria-labelledby="tab-home" tabindex="0">
  <p>Delivered within three working days.</p>
</div>
<div role="tabpanel" id="panel-pickup" aria-labelledby="tab-pickup" tabindex="0" hidden>
  <p>Available in 4,000 pickup points.</p>
</div>
<div role="tabpanel" id="panel-store" aria-labelledby="tab-store" tabindex="0" hidden>
  <p>Free collection, ready in two hours.</p>
</div>
```

```css
[role="tablist"] { display: flex; flex-wrap: wrap; gap: 0.25rem; }
[role="tab"] {
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  border: 1px solid currentColor;
  border-bottom-width: 4px;
  border-bottom-color: transparent;
  background: none;
  font: inherit;
  color: inherit;
}
/* The selected tab differs by more than colour: thick underline and weight. */
[role="tab"][aria-selected="true"] { border-bottom-color: currentColor; font-weight: 700; }
[role="tab"]:focus-visible,
[role="tabpanel"]:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
```

```js
for (const tablist of document.querySelectorAll('[role="tablist"]')) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

  const select = (tab, moveFocus) => {
    for (const other of tabs) {
      const selected = other === tab;
      other.setAttribute('aria-selected', String(selected));
      other.tabIndex = selected ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
    }
    if (moveFocus) tab.focus();
  };

  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab, false);
  });

  tablist.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    const last = tabs.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(tabs[target], true);
  });
}
```

Notes on the choices:

- Only the selected tab is in the Tab sequence (`tabindex="-1"` on the others): one Tab press enters the tab list, the next one leaves it. Arrow keys move between tabs. This is what screen reader users expect once "tab" is announced.
- Each panel has `tabindex="0"` so that Tab goes from the tab to its panel even when the panel starts with plain text. If a panel starts with a focusable element, the `tabindex` on the panel can be dropped.
- Up and Down arrows are left alone so that they still scroll the page. For a vertical tab list, add `aria-orientation="vertical"` and use Up and Down instead of Left and Right.
- If a panel loads its content over the network, switch to manual activation: arrows move focus only, Enter or Space selects.
- If the script may not run, the panels marked `hidden` stay unreachable. When that matters, serve the content as headed sections and let the script add the roles and hide the panels.

## Expected keyboard behaviour

| Key | Effect |
|-----|--------|
| Tab | Enters the tab list on the selected tab; pressed again, moves to the panel |
| Right Arrow / Left Arrow | Selects the next / previous tab, wrapping at the ends |
| Home / End | Selects the first / last tab |
| Enter or Space | Selects the focused tab (needed only with manual activation) |

## Common mistakes

- Tabs built with links (`<a href="#">`) or `<div>` elements and no roles: announced as a list of links that lead nowhere.
- `role="tab"` without `aria-selected`: the screen reader cannot say which tab is active.
- Every tab in the Tab sequence and no arrow-key support: contradicts what the role announces.
- Inactive panels hidden with `visibility` tricks or moved off screen: their links stay focusable while invisible. Use `hidden`.
- The selected tab marked by a colour change only.
- Tabs that scroll horizontally with no visible cue at narrow widths. Let them wrap.

## Checklist

- [ ] The container has `role="tablist"` and a name; each tab has `role="tab"`, `aria-selected` and `aria-controls`; each panel has `role="tabpanel"` and `aria-labelledby` pointing to its tab [WCAG 4.1.2; RGAA 7.1]
- [ ] Tabs are `<button>` elements, and the arrow keys, Home and End move between them [WCAG 2.1.1; RGAA 7.3]
- [ ] Only the selected tab has `tabindex="0"`; inactive panels are `hidden` [WCAG 2.4.3; RGAA 12.8]
- [ ] The selected tab is distinguished by something other than colour [WCAG 1.4.1; RGAA 3.1]
- [ ] The focused tab and the focused panel show a visible focus indicator [WCAG 2.4.7; RGAA 10.7]
- [ ] At 320 CSS pixels wide the tabs wrap or stack and all remain reachable [WCAG 1.4.10; RGAA 10.11]
