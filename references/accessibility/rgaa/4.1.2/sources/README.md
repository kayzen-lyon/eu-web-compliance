# Official RGAA 4.1.2 files

The three JSON files in this folder are unmodified copies of the files published by the DINUM (Direction interministérielle du numérique, French State). Never edit them: every criteria file and the glossary of this version are generated from them.

## Origin

| File | Content | SHA-256 |
|------|---------|---------|
| `criteres.json` | 13 themes, 106 criteria, their tests, special cases, technical notes and WCAG references | `25f71c18150d15514253badd883d0c62e329bc3928814779dc4b41497002a13a` |
| `glossaire.json` | 119 glossary entries | `6855035e03fd9c47aee743976897f9958539e5b2be88996a41a1b273e29e01a4` |
| `methodologies.json` | Test methodology of each of the 258 tests | `199dcd99b3c9783465c74936e721f2d905bfbd286ff6a3197358912e2ba1b84d` |

- Repository: [DISIC/accessibilite.numerique.gouv.fr](https://github.com/DISIC/accessibilite.numerique.gouv.fr/tree/main/RGAA), folder `RGAA/`.
- Download address: `https://raw.githubusercontent.com/DISIC/accessibilite.numerique.gouv.fr/main/RGAA/<file>`.
- Commit copied: [`95d5ef33`](https://github.com/DISIC/accessibilite.numerique.gouv.fr/commit/95d5ef33df9efe7c862da02ea98c6b8c02909007), dated 7 January 2026.
- Date of copy: 14 November 2026.
- `criteres.json` and `glossaire.json` are byte-for-byte identical to the copies held by the DINUM skill [etalab-ia/skills](https://github.com/etalab-ia/skills/tree/main/skills/rgaa/sources) at its commit `0eae080`.

## Licence and attribution

The files are published under the [Licence Ouverte 2.0 / Open Licence 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/). That licence requires naming the source and the date of last update of the reused information. The attribution for this folder, and for every file generated from it, is:

> Référentiel général d'amélioration de l'accessibilité (RGAA), version 4.1.2 — DINUM. Source: <https://github.com/DISIC/accessibilite.numerique.gouv.fr>, last updated 7 January 2026 (commit 95d5ef33). Licence Ouverte 2.0.

The MIT licence of this repository does not apply to these files or to the official text copied into the generated files.

## How the files are used

`scripts/rgaa_official.py` reads `criteres.json` and `glossaire.json` and generates, in the parent folder, one `criteria-NN-<theme>.md` file per theme, `glossary.md` and `index.md`. It also rebuilds the RGAA part of `references/accessibility/mapping.json`.

```bash
python scripts/rgaa_official.py           # check that generated files match these sources
python scripts/rgaa_official.py --write   # regenerate
```

The official text is copied character for character. Two things are done to the markup, never to the words:

- a link to a glossary entry, written `(#anchor)` in the source, points to `(glossary.md#anchor)`;
- the list items of special cases and technical notes already start with `- ` in the source and are copied as they are.

`methodologies.json` is stored for reference and for future audit tooling. No file is generated from it yet.

## Known oddities of the official data

They are kept as published, not corrected.

- One link of `criteres.json` uses the anchor `#table-descriptions-techniques`, which matches no glossary entry. It is left unchanged in the generated text.
- WCAG labels are not written consistently: `1.4.1 Use of color (A)` and `1.4.1 Use of Color (A)`, `3.2.1 On focus (A)` and `3.2.1 On Focus (A)`, `4.1.2 Name, role, Value (A)` and `4.1.2 Name, Role, Value (A)`. The generated criteria files print the labels as they are; `mapping.json` keys them by number.
- The file declares WCAG version 2.1 and still lists success criterion 4.1.1 Parsing, which WCAG 2.2 removed.

## Following an official revision of RGAA 4.1.2

1. Replace the three files with the new official ones, without editing them.
2. Update the commit, the dates and the SHA-256 values above, and the pinned values in `tests/test_rgaa_official.py`.
3. Run `python scripts/rgaa_official.py --write`, then read the whole diff of the generated files.
4. If criteria were added or removed, update `../evaluation-modes.json`: the script refuses to run while a criterion has no mode.
5. Update the entry `rgaa-json` in `references/sources.json`.

A new major version (RGAA 5) does not go here: follow [../../5/README.md](../../5/README.md).
