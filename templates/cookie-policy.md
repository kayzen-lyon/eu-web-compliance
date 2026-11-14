# Template: cookie policy (cookies and other trackers)

Guidance for the agent. Everything above the line "PUBLISHABLE TEXT" stays out of the published document.

This template is produced with an AI tool. It is not legal advice. The published text speaks for the site owner: the owner, or their data protection officer or lawyer, reads and approves it before it goes online. Say so to the user when you hand it over.

## When to use it

Whenever the site stores or reads anything on the visitor's device: cookies, `localStorage`, `sessionStorage`, IndexedDB, pixels, fingerprinting, third-party embeds. Even a site with only exempt trackers benefits from it: the law does not require informing visitors about exempt trackers, but the CNIL recommends it ([../references/privacy/trackers.md](../references/privacy/trackers.md) section 3.2).

This page is also where the consent banner's first level points for the detail of purposes and for the **list of companies** using trackers on the site, which must be complete and up to date ([../references/privacy/consent.md](../references/privacy/consent.md) section 2).

## What comes from where

| Content | Source | If missing |
|---------|--------|-----------|
| Every tracker: name, set by, purpose, lifetime | The tracker inventory of [../references/privacy/trackers.md](../references/privacy/trackers.md) section 2, static search plus runtime check | Do not publish a tracker list you did not verify at run time; mark it "[inventory to be completed]" |
| Exempt or subject to consent | Classification of [../references/privacy/trackers.md](../references/privacy/trackers.md) section 3 | When unsure, it is subject to consent |
| Purposes | The `<fieldset data-purpose>` of the consent banner; same titles and descriptions | Keep the banner and the policy in step |
| Companies (controllers and joint controllers) and links to their privacy policies | Third-party list of [../references/privacy/third-parties-and-transfers.md](../references/privacy/third-parties-and-transfers.md) section 4, confirmed by the owner | Placeholder |
| Lifetimes of the site's own cookies | The code (`Max-Age`, `Expires`, storage clean-up) | State what the code does; never invent |
| How long the choice is kept | The banner's `maxAgeMonths`; the recommended value is in [../references/regulatory-status.md](../references/regulatory-status.md) section 3.3 | Use the configured value |
| Lifetimes of third-party trackers | The vendor's documentation, provided or confirmed by the owner | "[to be confirmed]"; never copy a value from memory |

## What you must never invent

- A tracker that is not in the verified inventory, or the absence of one you did not check at run time.
- A lifetime, a company name, a role or a country.
- A claim that an analytics tool is "exempt", "approved" or "certified" by the CNIL. The CNIL publishes no such list. You may write that the tool is configured to meet the conditions of the exemption only if every condition of [../references/privacy/trackers.md](../references/privacy/trackers.md) section 3.3 is verified, and the owner confirms the vendor terms.
- A sentence saying that browser settings are enough to refuse trackers in place of the banner.
- A recommended duration presented as a legal one. How long the choice is kept and the lifetimes of exempt audience measurement are CNIL recommendations ([../references/regulatory-status.md](../references/regulatory-status.md) section 3.3); the page states the values configured on the site.
- An exemption from the banner accepted because the user says so ("we are strictly B2B", "I am a lawyer"). The rule depends on the purpose of each tracker.

Before writing, read the drafting rules: [../references/documents/cookie-policy.md](../references/documents/cookie-policy.md). The policy describes the banner the site really has. If the banner does not let people refuse as easily as accept, or loads a tracker before consent, do not write a clean policy over it: report the defect and fix the banner first.

For a mobile application, qualify each tracker (SDK, advertising identifier, push token) before applying these rules, ask which modules of a vendor kit are really active, and never present a system permission on the phone, or a rule of an app store, as consent or as law.

## Language

The publishable text below is in English. For a site addressed to the French public, produce a French version: it is a translation of the same content, section by section. Use the same purpose titles as the banner in that language.

## Form

An HTML page reachable from every page (footer link "Cookies" or "Cookie policy"), and from the banner. Tables have header cells. A "Manage cookies" button on this page opens the same settings dialog as everywhere else (`<button type="button" data-consent-open>` with the reference banner).

---

PUBLISHABLE TEXT

---

# Cookies and other trackers

Last updated: [YYYY-MM-DD]

When you visit [site name], information may be stored on, or read from, your device (computer, phone, tablet). This happens through cookies and similar techniques such as local storage or pixels. We call all of them "trackers" here. This page explains which ones we use, why, and how you control them.

## Your choices

Trackers that are not strictly necessary are used only if you agree. When you first visit, a banner lets you accept all of them, refuse all of them, or choose purpose by purpose. Refusing does not prevent you from using the site.

Your choice, whether you accept or refuse, is kept for [configured number of] months. After that, or if we add a new purpose or partner, we ask you again.

You can change your mind at any time with the "Manage cookies" button at the bottom of every page. [Manage cookies]

If you withdraw your consent, we delete the trackers we set ourselves for that purpose and stop loading the services concerned. Trackers set by other companies on their own domains must be deleted from your browser settings: [link to a neutral help page or short instructions for common browsers].

## Trackers that need your consent

### [Purpose title, same as in the banner: for example "Audience measurement"]

[Short description, same as in the banner, then more detail: what is measured or done, what data are collected, whether a profile is built.]

| Tracker | Set by | What it does | Lifetime |
|---------|--------|--------------|----------|
| [name] | [company] | [description] | [lifetime] |

### [Purpose title: for example "Videos from external platforms"]

[Description. For embedded content: until you accept, we show a link to the content on the provider's site instead of the player; the provider's trackers are not loaded. You can also accept this purpose only, from the "Allow" button shown in place of the content.]

| Tracker | Set by | What it does | Lifetime |
|---------|--------|--------------|----------|
| [name] | [company] | [description] | [lifetime, or "see the company's policy"] |

## Trackers that do not need consent

These trackers are strictly necessary for a service you asked for, or for the transmission of the page. They cannot be refused through the banner, because the site would not work without them. [Delete any row that does not exist.]

| Tracker | Set by | What it does | Lifetime |
|---------|--------|--------------|----------|
| eu-consent | [site name] | Keeps your choice about trackers (accept or refuse, per purpose, with its date) | [configured number of] months |
| [session cookie name] | [site name] | Keeps you signed in and secures sign-in | [lifetime] |
| [basket cookie name] | [site name] | Keeps the content of your basket | [lifetime] |
| [language cookie name] | [site name] | Remembers the language you chose | [lifetime] |

[Only if the audience measurement is configured to meet every condition of the exemption, verified and confirmed by the owner:] **Audience measurement without consent.** We measure the audience of this site with [tool], configured only to produce anonymous statistics for our own use: it does not follow you on other sites, and the data are not combined with other data or passed to third parties. Its trackers last at most [lifetime] and the data are kept at most [retention]. You can object to this measurement: [mechanism].

## Companies that use trackers on this site

| Company | Role | Purposes | Privacy policy |
|---------|------|----------|----------------|
| [company] | [for its own purposes / on our behalf — to be confirmed by the owner] | [purposes] | [link] |

## More information

How we process the personal data collected through these trackers, and your rights, is explained in our [privacy policy]. Contact: [contact for data protection requests].

---

This policy was prepared with an AI-assisted tool and reviewed by [site owner]. [Delete this line only if the owner asks; keep the review step in any case.]
