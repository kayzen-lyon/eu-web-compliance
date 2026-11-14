# RGAA 5: migration procedure

This folder is empty on purpose. RGAA 5 is not published; its status is recorded in [regulatory-status.md](../../../regulatory-status.md), section 1.5, and nowhere else.

**Nothing from an unofficial source may be placed here.** That covers the draft branches of the DINUM repository, working documents, presentations, blog posts and any text reconstructed from memory. A criterion number or a title taken from a draft and later changed would mislead every user of the skill. Until the steps below are done, the skill answers from RGAA 4.1.2 and says so.

## When to start

Start only when both conditions hold:

1. The DINUM has published RGAA 5 as final on <https://accessibilite.numerique.gouv.fr/>, and the legal act that makes it applicable has been read on Légifrance.
2. Official machine-readable files for that version exist on the default branch of <https://github.com/DISIC/accessibilite.numerique.gouv.fr>.

A beta or a public consultation version does not meet condition 1. If one is published, record it in `regulatory-status.md` and stop there.

## Procedure

Do the steps in order. Do not switch `ACTIVE` before step 7.

### 1. Record the facts

- [ ] Add the publication, the applicable legal act and the transition period to `references/regulatory-status.md`, each with its source. [best practice]
- [ ] Add the new official files and pages to `references/sources.json` with the consultation date. [best practice]

### 2. Import the official files

- [ ] Copy the official JSON files, unmodified, into `5/sources/` (use the exact version number as the folder name if it is not `5`, for example `5.0`). [best practice]
- [ ] Write `5/sources/README.md` on the model of [../4.1.2/sources/README.md](../4.1.2/sources/README.md): address, commit, dates, SHA-256 of each file, licence and the attribution it requires. Read the licence again: do not assume it is unchanged. [best practice]

### 3. Check the structure of the files

`scripts/rgaa_official.py` expects the structure of the 4.1.2 files: `topics[].criteria[].criterium` with `title`, `tests`, `particularCases`, `technicalNote` and `references[].wcag`, and a glossary made of `title` and `body`.

- [ ] Compare the new files with that structure before running anything. If it changed, adapt the parsing functions of the script and their tests first. The script stops with exit code 2 on a structure it does not understand; it never guesses. [best practice]

### 4. Build the 4.1.2 to 5 crosswalk

- [ ] Create `5/crosswalk-4.1.2-to-5.json` from the official correspondence table if the DINUM publishes one, citing it. [best practice]
- [ ] If no official table exists, build the crosswalk by comparing official titles and tests, mark the whole file as not official, and give each line a status: `unchanged`, `renumbered`, `reworded`, `split`, `merged`, `removed`, `new`. Leave a line empty when the correspondence is not certain. [best practice]

### 5. Classify the evaluation modes

- [ ] Create `5/evaluation-modes.json` with one entry per criterion of the new version. Carry over an entry from 4.1.2 only when the crosswalk says `unchanged` or `renumbered`; classify the others again by reading the new tests. Keep the file marked as provisional. [best practice]

### 6. Generate in a branch, without switching

- [ ] Write the new version number into `ACTIVE` in a working branch, run `python scripts/rgaa_official.py --write`, then `python scripts/rgaa_official.py` and `python -m unittest discover -s tests`. [best practice]
- [ ] Update the values pinned for 4.1.2 in `tests/test_rgaa_official.py` (number of criteria and themes, SHA-256 of the sources). [best practice]
- [ ] Read the generated criteria files in full once. Check `index.md` for links whose anchor has no glossary entry. [best practice]
- [ ] Complete the `wcag` table of `references/accessibility/mapping.json` by hand for every success criterion the new official file lists and the table lacks; the script names them. Take names and levels from the WCAG Recommendation and clause numbers from EN 301 549, never from memory. [best practice]

### 7. Switch and update what depends on the version

- [ ] Merge the branch: `ACTIVE` now names the new version. Keep the `4.1.2/` folder: audits and statements made under 4.1.2 still refer to it during the transition period. [best practice]
- [ ] Update the accessibility statement templates: name of the framework version, number of criteria, wording required by the new version. [best practice]
- [ ] Update every reference file that cites an RGAA criterion number, using the crosswalk. Search for the tag `[RGAA ` across `references/`. [best practice]
- [ ] Update `regulatory-status.md` (version in force, transition rules), `sources.json`, `NOTICE.md`, `CHANGELOG.md` and the README files. [best practice]
- [ ] Run `python scripts/validate.py` and the whole test suite. [best practice]

## What to tell users during the transition

State which version an audit or a statement was made against, and point to `regulatory-status.md` for the dates between which each version may be used. Do not convert a result obtained under one version into a result under the other: a criterion marked `reworded`, `split` or `merged` in the crosswalk has to be assessed again.
