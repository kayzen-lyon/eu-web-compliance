# Cookie policy: drafting

How to draft the page that explains trackers, so that it matches what the site actually does and what the consent banner shows. The rules for trackers and consent are in [../privacy/trackers.md](../privacy/trackers.md) and [../privacy/consent.md](../privacy/consent.md); template: [cookie-policy.md](../../templates/cookie-policy.md).

## How to use this file

1. Two things must agree: the banner (behaviour of the site) and the policy (the document). Build or check the banner first; the policy describes it.
2. The tracker list comes from the inventory of [../privacy/trackers.md](../privacy/trackers.md) section 2, static search and runtime check. Never from a generic list of usual cookies.
3. Recommended durations (how long a choice is kept, tracker lifetime and retention for exempt audience measurement) are CNIL recommendations, not legal periods; read them in [../regulatory-status.md](../regulatory-status.md) section 3.3 with their date.

## 1. What to collect

- [ ] Every tracker actually set or read (cookies, local storage, pixels, SDKs, embeds): name, who sets it, purpose, lifetime, exempt or subject to consent [ePrivacy art. 5(3)]
- [ ] Lifetimes of the site's own trackers come from the code; those of third parties from the vendor's documentation confirmed by the owner; an unknown lifetime stays "[à confirmer]" [best practice]
- [ ] The consent platform in use, if any, and its real settings (buttons, purposes, how long the choice is kept); the policy describes those settings, not the ones it should have [best practice]
- [ ] When unsure whether a tracker is exempt, it is treated as subject to consent [CNIL guidelines]

## 2. Traps

- [ ] A tool is never written as "exempt", "approved" or "certified" by the CNIL; audience measurement is described as exempt only if every condition of the exemption is verified and the owner confirms the vendor terms [CNIL audience measurement]
- [ ] A recommended duration is written as the configured value of the site, and in the answer as a recommendation with its source, never as "the law requires" [CNIL recommendation]
- [ ] A claim that the site is exempt from a banner because it is "strictly B2B" or because the user says so is not accepted; the rule depends on the purpose of each tracker, not on the audience [ePrivacy art. 5(3)]
- [ ] When the banner does not let people refuse as easily as accept, the policy does not hide it: the defect is reported to the owner and fixed in the banner [CNIL guidelines]
- [ ] Browser settings are not presented as a substitute for the banner [CNIL guidelines]
- [ ] Mobile applications: trackers are qualified one by one (SDK, advertising identifier, push token), and a system permission on the phone is not presented as consent to a processing [GDPR art. 7]
- [ ] A rule of an app store about identifiers or tracking is not presented as law [best practice]

## 3. Review checklist

- [ ] Every tracker of the runtime inventory is in the policy, and every tracker in the policy exists [best practice]
- [ ] The purposes and their titles are the same as in the banner [best practice]
- [ ] The list of companies using trackers is complete, with their role as confirmed by the owner ([../privacy/consent.md](../privacy/consent.md) section 2) [CNIL recommendation]
- [ ] A "Manage cookies" control on the page opens the same settings as everywhere else [GDPR art. 7(3)]
- [ ] The privacy policy links to this page and says the same things about trackers [best practice]
