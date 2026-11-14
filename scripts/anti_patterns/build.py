"""Generate the anti-pattern catalogue (Markdown topic files + JSON index) and test the patterns."""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from data_a import STRUCTURE, NAMES, ARIA
from data_b import KEYBOARD, FORMS
from data_c import VISUAL, MEDIA, DYNAMIC

OUT = Path(sys.argv[1])
FLAGS = {'i': re.I, 's': re.S, 'm': re.M}

FILES = [
    ('anti-patterns-structure.md', 'Anti-patterns: structure', 'Page skeleton, headings, landmarks, tables, lists, frames, document-level settings.', [('Structure', STRUCTURE)]),
    ('anti-patterns-names-links.md', 'Anti-patterns: text alternatives, names and links', 'Images, icons, charts, and the accessible names of links and buttons.', [('Text alternatives, names and links', NAMES)]),
    ('anti-patterns-aria-dynamic.md', 'Anti-patterns: ARIA and dynamic updates', 'Roles, states and misuse of ARIA; messages and changes that happen without a page load.', [('ARIA', ARIA), ('Dynamic updates', DYNAMIC)]),
    ('anti-patterns-keyboard.md', 'Anti-patterns: keyboard, focus and pointer', 'Keyboard access, focus visibility and order, traps, shortcuts, target size, dragging.', [('Keyboard, focus and pointer', KEYBOARD)]),
    ('anti-patterns-forms.md', 'Anti-patterns: forms and authentication', 'Labels, errors, required fields, autocomplete, login, CAPTCHA, time limits.', [('Forms and authentication', FORMS)]),
    ('anti-patterns-visual-media.md', 'Anti-patterns: visual presentation, media and motion', 'Contrast, colour, zoom and reflow, images of text; video, audio, animation.', [('Visual presentation', VISUAL), ('Media and motion', MEDIA)]),
]


def criterion(e):
    parts = []
    if e['wcag']:
        parts.append('WCAG ' + ', '.join(e['wcag']))
    if e['rgaa']:
        parts.append('RGAA ' + ', '.join(e['rgaa']))
    return '; '.join(parts) if parts else 'best practice (no official criterion)'


def compile_rx(d, key='value'):
    flags = 0
    for f in d.get('flags', ''):
        flags |= FLAGS[f]
    return re.compile(d[key], flags)


def hits(d, text):
    if not compile_rx(d).search(text):
        return False
    if d.get('unless') and compile_rx(d, 'unless').search(text):
        return False
    return True


def run_tests(entries):
    failures, infos = [], []
    for e in entries:
        for d in e['detect']:
            if d['type'] != 'regex':
                continue
            try:
                compile_rx(d)
                if d.get('unless'):
                    compile_rx(d, 'unless')
            except re.error as exc:
                failures.append(f"{e['id']}: regex does not compile: {exc}")
                continue
            if not d['_test']:
                continue
            if not hits(d, e['bad']):
                failures.append(f"{e['id']}: regex does not match the bad example: {d['value'][:60]}")
            if hits(d, e['good']):
                (failures if e.get('conf') == 'certain' else infos).append(
                    f"{e['id']}: regex also matches the good example ({e.get('conf', 'heuristic')})")
    return failures, infos


def entry_md(e):
    lines = [f"### {e['id']} · {e['title']}", '', e['what'], '',
             f"- Severity: {e['sev']}. Criterion: {criterion(e)}.",
             f"- Detect: {e['dtext']}", '',
             'Bad:', f"```{e['lang']}", e['bad'], '```', '',
             'Good:', f"```{e['lang']}", e['good'], '```', '']
    return lines


def topic_md(name, title, scope, sections):
    lines = [f'# {title}', '',
             f'{scope} Severity levels, the way to read "Detect" lines and the machine-readable patterns are in [anti-patterns.md](anti-patterns.md). The examples are illustrations: recognise the pattern, do not copy the wording.', '']
    for heading, entries in sections:
        if len(sections) > 1:
            lines += [f'## {heading}', '']
        for e in entries:
            lines += entry_md(e)
    return '\n'.join(lines).rstrip('\n') + '\n'


def json_entry(e, filename):
    detect = [{k: v for k, v in d.items() if not k.startswith('_')} for d in e['detect']]
    return {'id': e['id'], 'title': e['title'], 'severity': e['sev'], 'confidence': e.get('conf', 'heuristic'),
            'wcag': e['wcag'], 'rgaa': e['rgaa'], 'axe': e.get('axe', []), 'file': filename, 'detect': detect}


INDEX_HEAD = '''# Anti-patterns: what generated code gets wrong

A catalogue of the accessibility defects that coding agents and templates produce most often. Use it in two ways: read the topic file that matches what you are writing, so as not to produce these patterns; or run the detection patterns over existing code to find candidates for review.

The list is partly derived from the anti-patterns of `a11y.instructions.md` in [github/awesome-copilot](https://github.com/github/awesome-copilot) (MIT, Copyright GitHub, Inc.) and from the ARIA anti-patterns of the skill `rgaa-dev` by Isabelle Lafont ([Isalafont/claude-skill-rgaa-dev](https://github.com/Isalafont/claude-skill-rgaa-dev), Licence Ouverte 2.0, version 1.2.2 of 2026-06-17); text, examples, severities and detection patterns rewritten. See [../../NOTICE.md](../../NOTICE.md).

This catalogue finds known mistakes. It proves nothing about what it does not find: a page with no match is not conformant, it is unexamined by this catalogue. Automated findings are completed by the checks in [testing-by-hand.md](testing-by-hand.md).

## Severity

Severity describes what happens to the person, in the usual case. It is not a legal ranking: a `minor` defect can still be a failure of a required criterion.

| Level | Meaning |
|-------|---------|
| `blocking` | With their tool, the person cannot perceive the content or complete the task, and nothing else on the page lets them get around it. Also used for the one defect that can cause physical harm (flashing). |
| `major` | The person can get through, but at the cost of substantial extra effort, loss of part of the information, or a real risk of error. |
| `minor` | Noise or friction. Content and functions remain available. |

Raise the level by one when the defect sits on a path that cannot be avoided (sign-in, checkout, consent, contact). Use [impacts.md](impacts.md) to word the impact in a report.

## Topic files

| File | Ids | Covers |
|------|-----|--------|
{files_table}

Each entry gives: a stable id, what the pattern is and why it hurts, severity, the criterion (WCAG 2.2 success criterion, RGAA 4.1.2 criterion when one exists), how to detect it, a bad example and a good one. An entry whose criterion reads "best practice" is advice with no official source and must not be reported as a non-conformity.

The framework-specific forms of these patterns (`onClick` on a `<div>` in JSX, `(click)` in Angular, `@click` in Vue, `htmlFor`) are covered by the same entries; several regular expressions accept those syntaxes.

## Machine-readable index

The block below is the single source for detection patterns: one JSON array, one object per line. A script can extract it as the first fenced block tagged `json` in this file.

| Field | Content |
|-------|---------|
| `id` | Stable identifier, `AP-<TOPIC>-<NN>`. Ids are never reused or renumbered. |
| `severity` | `blocking`, `major` or `minor`, as defined above. |
| `confidence` | `certain`: a match is a defect. `heuristic`: a match is a candidate that a person or a DOM-based check must confirm; report it as "to verify", not as a failure. |
| `wcag`, `rgaa` | Success criteria of WCAG 2.2 and criteria of RGAA 4.1.2. Both empty: best practice. |
| `axe` | Ids of related axe-core rules, as a hint; check them against the installed version. Empty: no direct equivalent known. |
| `file` | Topic file that holds the explanation and the examples. |
| `detect` | One or more detectors. Any one matching is enough to raise the entry. |

Detector fields:

- `type: "regex"`: `value` is a regular expression written to work both with Python `re` and with JavaScript `RegExp`; `flags` uses `i` (ignore case) and `s` (dot matches newline). Apply it to source files of the kind given by `target`: `html` (HTML and templates, including JSX, Vue and Angular templates), `css` or `js`. When `unless` is present, it is a second expression: if it matches anywhere in the same file, drop the finding. When `page_condition` is present, it names a check run on the rendered page; drop the finding when the page does not meet it (`link-in-text-without-underline`: the page has a link inside running text, outside `nav`, `header` and `footer`, not styled as a button and not the only content of its block, that is not underlined).
- `type: "selector"`: `value` is a CSS selector for `document.querySelectorAll` on the rendered page (`target: "dom"`). Some use `:has()` and `:is()`.
- `type: "structural"`: `value` describes in words a check that needs the DOM, computed styles or program logic.

Regular expressions over source code see neither the rendered DOM nor computed styles. Prefer the selector and structural detectors when a browser is available, and treat regular-expression matches on templates as hints. When this catalogue was written, every regular expression was run against the bad and good examples of its entry, in Python and in JavaScript, and every selector was run against the same examples in a Chromium browser. Structural descriptions were not machine-tested. Examples are short; expect false positives and misses on real code.

```json
{json_block}
```
'''


def main():
    all_entries = [e for _, _, _, sections in FILES for _, entries in sections for e in entries]
    ids = [e['id'] for e in all_entries]
    assert len(ids) == len(set(ids)), 'duplicate id'
    failures, infos = run_tests(all_entries)
    for line in infos:
        print('INFO ', line)
    for line in failures:
        print('FAIL ', line)
    if failures:
        sys.exit(1)

    rows, json_lines = [], []
    for name, title, scope, sections in FILES:
        text = topic_md(name, title, scope, sections)
        (OUT / name).write_text(text, encoding='utf-8', newline='\n')
        entries = [e for _, es in sections for e in es]
        prefixes = sorted({e['id'].rsplit('-', 1)[0] for e in entries})
        rows.append(f"| [{name}]({name}) | {', '.join('`' + p + '-*`' for p in prefixes)} ({len(entries)}) | {scope} |")
        json_lines += [json.dumps(json_entry(e, name), ensure_ascii=False) for e in entries]
        print(f'{name}: {len(entries)} entries, {text.count(chr(10))} lines')
    block = '[\n' + ',\n'.join(json_lines) + '\n]'
    json.loads(block)
    index = INDEX_HEAD.replace('{files_table}', '\n'.join(rows)).replace('{json_block}', block)
    (OUT / 'anti-patterns.md').write_text(index, encoding='utf-8', newline='\n')
    print(f'anti-patterns.md: {len(all_entries)} entries, {index.count(chr(10))} lines')
    by_sev = {}
    for e in all_entries:
        by_sev[e['sev']] = by_sev.get(e['sev'], 0) + 1
    print(by_sev, 'certain:', sum(1 for e in all_entries if e.get('conf') == 'certain'))


main()
