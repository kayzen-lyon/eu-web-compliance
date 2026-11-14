# AGENTS.md

Instructions for coding agents that read `AGENTS.md` (Codex, GitHub Copilot, Cursor, Windsurf, Amp, Devin and others). This repository is the agent skill `eu-web-compliance`: its entry point is [SKILL.md](SKILL.md). Part A is for agents working on **another** project that uses the skill; part B is for agents working **on this repository**.

## A. Using this skill from a website project

Agents that load Agent Skills natively (Claude Code, Codex, and others through `npx skills`) need nothing from this section: see the installation section of [README.md](README.md). For the others, vendor the skill into the project and point the project's own `AGENTS.md` at it.

### 1. Vendor the skill

From the root of the website project, one of:

```bash
# Submodule: easy to update with `git submodule update --remote`
git submodule add https://github.com/<owner>/eu-web-compliance.git .vendor/eu-web-compliance

# Or a plain snapshot
git clone --depth 1 https://github.com/<owner>/eu-web-compliance.git .vendor/eu-web-compliance
```

`<owner>` is a placeholder: the public repository does not exist yet. For the browser checks, run `npm install` once inside `.vendor/eu-web-compliance` (Node 20+); the other scripts need only Python 3.8+.

### 2. Paste this block into the project's `AGENTS.md`

```markdown
## EU web compliance

This website is built for the European market. The skill `eu-web-compliance` is vendored in
`.vendor/eu-web-compliance/`. Before creating, changing or auditing pages, forms, scripts,
third-party tags, AI features, server headers or legal pages, read
`.vendor/eu-web-compliance/SKILL.md` and follow it: choose the mode it describes (Scope, Build,
Verify, Document, Watch) and read only the reference files its task table names. Paths in
SKILL.md are relative to `.vendor/eu-web-compliance/`; run its scripts from this project's root,
for example `python .vendor/eu-web-compliance/scripts/applicability.py compliance/profile.json`.

Rules that always apply:
- No regulatory date, threshold, article or version from memory: read it in the skill's files.
- A doubt gives "not tested", never "compliant"; never say the site is compliant.
- Keep legal requirements, recommendations and best practices apart; cite the source tag of each rule.
- Never invent operator data (registration numbers, DPO, retention periods): leave placeholders.
- Everything you add (cookie banner, AI notice, withdrawal button) is accessible.
- No tracker runs before consent.
- Stop and refer to a professional in the cases listed in `references/scoping/out-of-scope.md`.
- Tell the user what was not verified.
```

GitHub Copilot and Cursor can also use the files in [adapters/](adapters/), described in [adapters/README.md](adapters/README.md).

## B. Working on this repository

Read [docs/PRD.md](docs/PRD.md) (requirements and architecture) and [docs/PROMPT.md](docs/PROMPT.md) (how the work is done) before a substantial change. The rules below exist because the users of this skill are not lawyers and will trust it: a wrong fact is worse than a missing one.

### Sources and facts

- **No regulatory fact without an official source read for the change.** A date, threshold, article number, standard version, cryptographic value or criterion title enters the repository only after the official text has been opened (EUR-Lex, Légifrance, cnil.fr, cyber.gouv.fr, w3.org, etsi.org, accessibilite.numerique.gouv.fr…) and recorded in [references/sources.json](references/sources.json) with its URL, consultation date and proof level `P`. A fact that cannot be confirmed goes into [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md), not into the skill.
- **Dates and versions in force live only in [references/regulatory-status.md](references/regulatory-status.md).** Each fact there is a `- ` line ending with `[src: <id>]`; other files link to the section instead of repeating the value. Update its `Last verified:` line when you re-verify.
- **Official texts are never reworded inside a quotation**, and WCAG text is not translated (see [NOTICE.md](NOTICE.md)).
- **Reused content is attributed** in [NOTICE.md](NOTICE.md), file by file, with origin, licence and date. Share-alike or copyleft content is cited, never copied.

### Rule format

- A rule in a reference file is a checkbox line that ends with its source in square brackets: `- [ ] It closes with Escape and with a visible, named button [WCAG 2.1.2; RGAA 12.9]` (from `references/accessibility/components/modal-dialog.md`). The tag must start with a `tag` declared in `references/sources.json`; a rule with no official source is tagged `[best practice]` and is never worded as an obligation.
- One subject per reference file, 500 lines at most; `SKILL.md` stays under 300 lines. Each reference file starts with a short "How to use this file".
- Rules are written in English, framework-neutral (HTML, CSS, HTTP). Documentation for users exists in English and French; `CHANGELOG.md` is in French.
- Code examples obey the skill's own rules: an inaccessible example banner would discredit the whole skill.
- File names: lowercase, digits, dots and hyphens; LF line endings; no file over 5 MB.

### Generated files: never edit them by hand

| Files | Edit instead | Regenerate with |
|-------|--------------|-----------------|
| `references/accessibility/rgaa/<version>/criteria-*.md`, `glossary.md`, `index.md`, and the RGAA part of `references/accessibility/mapping.json` | Nothing: they come from the official DINUM JSON in `rgaa/<version>/sources/` and from `evaluation-modes.json` | `python scripts/rgaa_official.py --write` |
| `references/accessibility/anti-patterns.md` and `anti-patterns-*.md` | `scripts/anti_patterns/data_a.py`, `data_b.py`, `data_c.py` | `python scripts/anti_patterns/build.py references/accessibility` |
| `examples/<site>/faulty/` | `examples/<site>/fixed/` and the planting script | `python scripts/examples/plant_<site>.py examples` (`plant_showcase.py`, `plant_fr.py`, `plant_online_shop.py`, `plant_account_app.py`) |

Nothing from a draft of RGAA 5 goes into the repository: follow [references/accessibility/rgaa/5/README.md](references/accessibility/rgaa/5/README.md) on the day of publication.

### Check before you hand over

```bash
python -m unittest discover -s tests
python scripts/validate.py
python scripts/rgaa_official.py
npm install                      # once; add `npx playwright install chromium` if no browser is found
node --test tests/
node scripts/check-examples.mjs
```

`python scripts/validate.py --require-skill` also requires `SKILL.md`; `--strict` turns warnings (sources older than 90 days) into failures. If a check fails, report it with its output; do not weaken a test or a threshold to make it pass.

### Commits and publication

- Conventional Commits, written in French for this project: `feat(accessibilite): …`, `fix: …`, `docs: …`, `chore: …`. The body says what was verified and how.
- Nothing is pushed, published, tagged or released, and no public repository is created, without the explicit approval of the owner (Tarek BELHADJ, Kayzen). Commit only when asked.

---

Author: Tarek BELHADJ - Kayzen (<https://www.kayzen-lyon.com>), by the author of Nexus (<https://nexus.kayzen-lyon.com>).
