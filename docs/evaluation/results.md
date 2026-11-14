# Evaluation results

Measured on 2026-11-14, version 1.0.0 (the commit tagged with this version). Agents and model: Claude Code subagents, Claude Opus 5.5.

## 1. Test sites (`node scripts/check-examples.mjs`)

Each site has a fixed version (`fixed/`) and a faulty version (`faulty/`, defects planted by `scripts/examples/plant_*.py`). "Found" counts the defects of type "code" reported as a non-conformity (NC) or as a point to review (NT); "of which NC" counts those reported as a non-conformity. "Not measured": no defect of this domain is planted on this site.

| Site | Checker | Fixed version: NC | Faulty version: defects found | of which NC |
|---|---|---|---|---|
| account-app | a11y | 0 | not measured | not measured |
| account-app | privacy | 0 | 100 % | 62.5 % |
| account-app | security | 0 | 100 % | 66.7 % |
| ai-news | a11y | 0 | not measured | not measured |
| ai-news | content | 0 | 100 % | 40 % |
| online-shop | a11y | 0 | not measured | not measured |
| online-shop | privacy | 0 | 100 % | 75 % |
| online-shop | security | 0 | 100 % | 81.8 % |
| public-service-fr | a11y | 0 | 100 % | 83.3 % |
| showcase-site | a11y | 0 | 100 % | 75 % |
| support-shop | a11y | 0 | not measured | not measured |
| support-shop | content | 0 | 100 % | 40 % |

Reporting a defect as "to review" rather than "non-conformity" is deliberate: when a script cannot prove the defect (a pre-ticked marketing consent box, the integrity of a third-party script, a focus indicator), it hands it to a person instead of concluding.

Other checks on the same day: `python -m unittest discover -s tests` (104 tests, OK), `node --test` (103 tests, 0 failures), `python scripts/validate.py --require-skill` (0 errors, 0 warnings), `python scripts/rgaa_official.py` (0 errors).

## 2. End-to-end build by fresh agents

Agents with no prior context received the briefs of this folder and built the sites, with and without the skill; the results were measured with `scripts/check-all.mjs`.

| Site | Without the skill | With the skill |
|---|---|---|
| Online tea shop ([brief-online-shop.md](brief-online-shop.md)) | 122 NC (38 accessibility, mostly focus hidden or invisible; 84 security, mostly missing headers), no withdrawal function | 1 NC, a false positive of the checker, fixed since |
| Shop with an AI assistant ([brief-support-chatbot.md](brief-support-chatbot.md)) | not built | 0 NC |
| Town hall website ([brief-public-service-fr.md](brief-public-service-fr.md)) | not built | 0 NC |

These measurements were made before the last corrections of the checkers, which turned several verdicts from NC into "to review".

## 3. Limits

- Zero non-conformity does not mean compliant: the scripts only see what can be checked in code, and the reports list what a person still has to verify.
- The skill was reviewed by AI agents (code, law, accessibility, originality), not yet by a lawyer, a data protection professional or an accessibility auditor.
