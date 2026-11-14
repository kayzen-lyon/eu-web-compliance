# Data protection and trackers

Entry point of the privacy part of the skill: GDPR, ePrivacy (cookies and other trackers) and the French CNIL rules. Read only the file that matches the task.

## How to use this folder

1. Check first whether the privacy obligations apply to the project: `references/scoping/obligations.json` (domain `privacy`) and the project profile (`data.*` fields).
2. Pick the file from the table below. Each file starts with its own instructions and keeps to one subject.
3. Facts with a date, a duration, an age or an amount are only in [../regulatory-status.md](../regulatory-status.md), section 3. The files link to it instead of repeating them.
4. Every rule ends with its source in square brackets. `GDPR` and `ePrivacy` are EU law, the baseline for every Member State. `LIL` and every `CNIL ...` tag are French; for a site that targets another Member State, those points need that country's authority checked. `[best practice]` is never an obligation.
5. What the skill cannot do here: decide a lawful basis, a retention period, a processor's role, the validity of a transfer, or the lawfulness of a cookie wall. The agent gathers facts, writes "to be confirmed by the controller", and asks. The result is produced by an AI and is not legal advice; the owner or their data protection officer reviews it.

| Task | Read |
|------|------|
| Adding or auditing analytics, pixels, embeds, chat, fonts, any third-party script | [trackers.md](trackers.md) |
| Building or checking a cookie or consent banner | [consent.md](consent.md), then [../../templates/consent/README.md](../../templates/consent/README.md) |
| Audience measurement without a banner | [trackers.md](trackers.md) section 3.3 |
| Session replay, heatmaps | [consent.md](consent.md) section 8 |
| Tracking pixels in emails, newsletters | [consent.md](consent.md) section 9 |
| One consent for all devices of a signed-in user | [consent.md](consent.md) section 7 |
| A contact, sign-up, checkout or application form | [forms-and-minimisation.md](forms-and-minimisation.md) |
| Children, health or other sensitive data | [forms-and-minimisation.md](forms-and-minimisation.md) sections 4, 5 and 9 |
| Logs, error monitoring, retention jobs | [forms-and-minimisation.md](forms-and-minimisation.md) sections 6 and 7 |
| User accounts: export, delete, edit, unsubscribe | [data-subject-rights.md](data-subject-rights.md) |
| Vendors, processors, data sent outside the EU | [third-parties-and-transfers.md](third-parties-and-transfers.md) |
| Writing the privacy policy | [../../templates/privacy-policy.md](../../templates/privacy-policy.md) |
| Writing the cookie policy | [../../templates/cookie-policy.md](../../templates/cookie-policy.md) |

The consent banner is also page content: it follows the accessibility rules, see [../accessibility/components/consent-banner-shell.md](../accessibility/components/consent-banner-shell.md).
