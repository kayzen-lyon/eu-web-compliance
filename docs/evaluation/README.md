# End-to-end evaluation

This folder holds the briefs used to test the skill the way it will be used: an AI coding agent that knows nothing about the project receives a one-page brief and the skill, builds the site, and the skill's own checkers measure the result. The same brief is run a second time without the skill, as a baseline.

Why this test matters: the other tests prove that the checkers work on sites written by people who knew the rules. This one shows whether the instructions of `SKILL.md` are clear enough for an agent that has never seen them. What the fresh agent misses points to what the skill does not say clearly enough.

## Briefs

| Brief | Main domains exercised |
|-------|------------------------|
| [brief-showcase.md](brief-showcase.md) | Accessibility, operator identification, trackers |
| [brief-public-service-fr.md](brief-public-service-fr.md) | RGAA, accessibility statement, French legal notice |
| [brief-online-shop.md](brief-online-shop.md) | Consent, online sales, order button, withdrawal function, prices |
| [brief-account-app.md](brief-account-app.md) | Authentication, security headers, data subject rights |
| [brief-support-chatbot.md](brief-support-chatbot.md) | AI Act Article 50(1), consumer law, consent |
| [brief-ai-news.md](brief-ai-news.md) | AI Act Article 50(4), editorial exception, AI usage page |

## Protocol

1. Start a fresh agent session in an empty folder. Give it the brief only, and the skill installed as described in the repository README. Do not give it any other instruction.
2. Let it build the site to completion, as it would for a client.
3. From the skill root, run `node scripts/check-all.mjs <site folder> --project <site folder>`.
4. Record: non-conformities per domain, whether `compliance/profile.json` was produced and how many questions were asked, which mandatory documents exist, and what the agent told the user it had not verified.
5. Repeat steps 1 to 4 without the skill installed.
6. For each defect found with the skill, find the instruction of the skill that should have prevented it, and improve that instruction. Re-run until the result stabilises.

Success, as defined in `docs/PRD.md` section 14: with the skill, zero accessibility non-conformity found by the checker, no tracker before consent, every baseline security header present, every mandatory page present, and an honest list of what remains for a person.

Results are recorded in `results.md` with the date, the agent and model used, and the skill commit.
