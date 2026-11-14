# eu-web-compliance

[Version française](README.fr.md)

A skill for AI coding agents: make the code of a website meet the European obligations that apply to it, from the first line written.

> **Project status: version 1.0.0.** The skill can be installed and used. It has not been reviewed by a lawyer, a data protection professional or an accessibility auditor; treat its output as help, not as an audit or legal advice.

## What the skill covers

| Domain | Reference texts |
|--------|-----------------|
| Accessibility | European Accessibility Act, EN 301 549, WCAG 2.2 level AA, national frameworks such as the French RGAA |
| Data protection | GDPR, ePrivacy Directive, national guidance on cookies and trackers |
| Artificial intelligence | EU AI Act, mainly the transparency duties of Article 50 |
| Security | ANSSI guides, completed by OWASP |
| Consumer and information law | Legal notice, online sales, withdrawal function, prices, DSA |

Scope: EU law and French law are verified. Each of the other 26 Member States has a file that states plainly what has and has not been verified: Germany is partly verified, the others not yet, and the EU baseline applies until they are.

The skill does three things: it works out which obligations apply to the project, has the agent write compliant code from the start, then checks the result while separating what is proven from what a person still has to verify.

## What the skill does not do

It does not guarantee that a website is legally compliant, and it replaces neither an accessibility audit, nor a data protection officer, nor a lawyer. Some accessibility criteria need human judgement, and the legal qualification of a service is a matter for a legal professional. Reports say so and list the points left for human review.

The skill is reviewed by an AI agent using specialised tools. No legal professional or accessibility auditor has reviewed it yet; independent review is welcome.

## What this skill adds

It was built from four open skills, credited in [NOTICE.md](NOTICE.md): each is good at its own subject, and none of them was copied as is (0.7 % of shared text, measured). What this skill adds:

| | Before: the four source skills, each on its own | This skill |
|---|---|---|
| Scope | One subject each: RGAA accessibility, French public-sector practices, AI Act, Copilot instructions | Five domains in one place: accessibility, data protection, AI Act, security, consumer law, with legal documents |
| Which rules apply | Left to the reader | An applicability matrix of 62 obligations, computed from a project profile; each one marked mandatory or recommended |
| Sources | Partly cited | Every rule ends with its official source; every date and version sits in one file, each with a source read and dated in `references/sources.json`; unconfirmed facts go to `OPEN-QUESTIONS.md`, not into the rules |
| Checking the result | Mostly checklists, one subject at a time | Four scripts that load the pages in a real browser: accessibility (axe-core and checks of its own), trackers set before consent, security headers, content (legal pages, AI disclosures, withdrawal function), merged into one report with verdicts C / NC / NA / NT |
| Proof that the checks work | No measured test sites | Six example sites, each in a fixed and a faulty version: zero non-conformity on every fixed version, every defect detectable from code reported on the faulty ones, as a non-conformity or as a point to review ([results](docs/evaluation/results.md)) |
| Ready-made parts | Code examples | Accessible components ready to paste: consent banner and loader, AI chat and AI content notices, order step, withdrawal function, price reduction display |
| Countries | France | EU law and French law verified; one file per Member State saying what is and is not verified |
| Agents | One tool each | Claude Code (skill or plugin), Codex and any agent that reads `AGENTS.md`, GitHub Copilot, Cursor |

Where a source skill goes further, use it alongside: Rails and DSFR examples (`Isalafont/claude-skill-rgaa-dev`), obligations of AI providers for general-purpose and high-risk systems (`morellid/ai-act-skill`).

In an end-to-end test, fresh agents built the same small websites with and without the skill. Without it, an online tea shop had 122 non-conformities found by the checkers and no withdrawal function; with it, the three sites built had none left after the checkers' own false positive was fixed. The briefs are in [docs/evaluation/](docs/evaluation/README.md).

## Installation

The repository is <https://github.com/kayzen-lyon/eu-web-compliance>. Whatever the method, the skill's folder must be named `eu-web-compliance`, the `name` of its `SKILL.md`.

**Claude Code, as a plugin.** In a session:

```text
/plugin marketplace add kayzen-lyon/eu-web-compliance
/plugin install eu-web-compliance@eu-web-compliance
```

**Claude Code, as a personal skill.** Clone into your skills folder (or into `.claude/skills/` of one project):

```bash
git clone https://github.com/kayzen-lyon/eu-web-compliance.git ~/.claude/skills/eu-web-compliance
```

**Codex.** Clone into the user skills folder (or into `.agents/skills/` of one project):

```bash
git clone https://github.com/kayzen-lyon/eu-web-compliance.git ~/.agents/skills/eu-web-compliance
```

**The `skills` CLI.** It finds the `SKILL.md` at the root of the repository and installs it for the agent you name (`claude-code`, `codex`, `cursor`, `github-copilot`, among others); `-g` installs it for all your projects:

```bash
npx skills add kayzen-lyon/eu-web-compliance -a codex
```

**GitHub Copilot, Cursor and other agents that read `AGENTS.md`.** Vendor the skill in the project (for example in `.vendor/eu-web-compliance/`) and copy the matching pointer file: see [adapters/README.md](adapters/README.md) and part A of [AGENTS.md](AGENTS.md).

**Browser checks.** The Python scripts need only Python 3.8 or later. The checks that load pages in a browser (`scripts/*.mjs`) need Node 20 or later and the dependencies installed once, inside the skill's folder:

```bash
cd ~/.claude/skills/eu-web-compliance   # or wherever the skill is installed
npm install
npx playwright install chromium         # only if no Chromium, Chrome or Edge is found
```

For a plugin install, the folder is the plugin's installed copy under `~/.claude/plugins/`.

## Using the skill

Once installed, the agent loads the skill when a task concerns a website for the European market; you can also name it. Examples of requests:

- "Build the landing page and contact form for my bakery in Lyon, with Matomo analytics and a cookie banner." The agent asks a few scoping questions once (who runs the site, what it sells, which data it collects), writes `compliance/profile.json`, then builds to the rules that apply.
- "We are adding a support chatbot built on a model API to our online shop: what do we have to show visitors?" The agent checks the AI Act stop list, applies the transparency rules and uses the reference chat notice.
- "Audit the site in `dist/` before we go live." The agent runs the checks, then lists what is non-conformant, what blocks people, and what a person must still verify.

To run every check yourself, from the root of the website project, on the built pages or on a running local server:

```bash
node <skill folder>/scripts/check-all.mjs dist --project .
node <skill folder>/scripts/check-all.mjs http://localhost:3000 --project . --profile compliance/profile.json
```

The report is written to `compliance/reports/compliance-report-YYYY-MM-DD.md`, with a `.json` twin for continuous integration. An empty list of findings does not mean the site is compliant: read the "not tested" part of the report.

## Repository contents

| Path | Purpose |
|------|---------|
| [SKILL.md](SKILL.md) | Entry point read by the agent: rules, modes, task-to-file table |
| [AGENTS.md](AGENTS.md) | Instructions for agents that read `AGENTS.md`, and for contributors |
| [adapters/](adapters/README.md) | Pointer files for GitHub Copilot and Cursor |
| [references/](references/) | Rules by domain: accessibility, privacy, ai-act, security, consumer, documents, countries, scoping |
| [templates/](templates/) | Reference components and documents: consent banner, AI notices, order step, withdrawal function, price reduction, legal notices, accessibility statement and EAA information, privacy and cookie policies, terms of use, terms of sale, data processing agreement, credit line |
| [examples/](examples/README.md) | Test sites, each in a faulty and a fixed version, that measure the checkers |
| [docs/evaluation/](docs/evaluation/README.md) | Briefs for the end-to-end evaluation by a fresh agent |
| [docs/PRD.md](docs/PRD.md) | Product requirements, architecture, roadmap (in French) |
| [docs/PROMPT.md](docs/PROMPT.md) | Build prompt for an agent (in French) |
| [references/regulatory-status.md](references/regulatory-status.md) | Dates and versions in force; the only place where they are written |
| [references/sources.json](references/sources.json) | Registry of the official sources consulted |
| [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | Unconfirmed facts and pending decisions |
| [NOTICE.md](NOTICE.md) | Attribution and licences of reused content |
| [scripts/validate.py](scripts/validate.py) | Structural checks |
| [CHANGELOG.md](CHANGELOG.md) | Change log (in French) |

## Contribution rules

- **No regulatory fact without a source.** A date, a threshold, an article number or a standard version enters the repository only after the official source has been read and recorded in `references/sources.json` with its consultation date.
- **Dates and versions live in one place**: `references/regulatory-status.md`. Other files point to it.
- **Every rule carries its source** in square brackets at the end of the line, for example `[WCAG 2.4.7]`. A good practice with no official source is tagged `[best practice]`.
- **Reused content is attributed** in `NOTICE.md`.

## Checking the repository

```bash
python -m unittest discover -s tests
```

```bash
python scripts/validate.py
```

The script only needs Python 3.8 or later. With `--strict`, a source consulted more than 90 days ago makes the check fail.

The browser checks need Node 20 or later and a Chromium-based browser (Playwright's, or an installed Edge or Chrome):

```bash
npm install
```

```bash
node --test tests/
```

```bash
node scripts/check-examples.mjs
```

The last command runs the four checkers on the six example sites and fails if a fixed version has a non-conformity, or if a checker reports less than 90 % of the defects planted in code in the faulty versions.


## Author

Tarek BELHADJ, [Kayzen](https://www.kayzen-lyon.com), by the author of [Nexus](https://nexus.kayzen-lyon.com).

## Licence

Original code and text under the [MIT licence](LICENSE). Content reused from other projects keeps its original licence, detailed in [NOTICE.md](NOTICE.md).
