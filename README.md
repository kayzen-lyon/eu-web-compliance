# eu-web-compliance

[Version française](README.fr.md)

A skill for AI coding agents: make the code of a website meet the European obligations that apply to it, from the first line written.

> **Project status: under construction (milestone M0, foundations).** The skill is not usable yet. For now this repository holds the requirements, the source registry and the structural checks.

## What the skill will cover

| Domain | Reference texts |
|--------|-----------------|
| Accessibility | European Accessibility Act, EN 301 549, WCAG 2.2 level AA, national frameworks such as the French RGAA |
| Data protection | GDPR, ePrivacy Directive, national guidance on cookies and trackers |
| Artificial intelligence | EU AI Act, mainly the transparency duties of Article 50 |
| Security | ANSSI guides, completed by OWASP |
| Consumer and information law | Legal notice, online sales, withdrawal function, prices, DSA |

Scope: EU law and the 27 Member States. France is covered first; each other country has a file that states plainly what has and has not been verified.

The skill will do three things: work out which obligations apply to the project, have the agent write compliant code from the start, then check the result while separating what is proven from what a person still has to verify.

## What the skill does not do

It does not guarantee that a website is legally compliant, and it replaces neither an accessibility audit, nor a data protection officer, nor a lawyer. Some accessibility criteria need human judgement, and the legal qualification of a service is a matter for a legal professional. Reports say so and list the points left for human review.

The skill is reviewed by an AI agent using specialised tools. No legal professional or accessibility auditor has reviewed it yet; independent review is welcome.

## Repository contents

| Path | Purpose |
|------|---------|
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

## Licence

Original code and text under the [MIT licence](LICENSE). Content reused from other projects keeps its original licence, detailed in [NOTICE.md](NOTICE.md).
