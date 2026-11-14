# Digital Services Act for sites that host user content

What a website must provide when it stores content supplied by its users (reviews, comments, forum posts, profiles, uploads, marketplace listings), under Regulation (EU) 2022/2065 (DSA). The DSA is a regulation: it applies directly in every Member State, with no transposition.

## How to use this file

1. Section 1 decides the category of the service. Each category adds duties to the previous one: intermediary service (section 2), hosting service (section 3), online platform (section 4).
2. The skill does not decide whether a service is an online platform, nor whether the micro and small enterprise exclusion applies. Both are flagged "to confirm" in the scoping matrix (`dsa-online-platform-duties`). The agent builds sections 2 and 3, asks the owner about section 4, and records the answer.
3. The date of application is in [../regulatory-status.md](../regulatory-status.md) section 5.3.
4. Very large online platforms and search engines have many more duties; they are out of scope of this skill.

## 1. Which category

| The site... | Category | Read |
|-------------|----------|------|
| Stores content provided by users at their request (comments, reviews, uploads, listings) | Hosting service, a type of intermediary service | Sections 2 and 3 |
| ... and makes that content available to the public, that is to a potentially unlimited number of people, without a human decision on who gets access | Online platform, unless the feature is minor and purely ancillary to another service | Sections 2, 3 and 4 (subject to the exclusion of section 4.1) |
| Only publishes its own content, with no user content | Not a hosting service for that site | Nothing in this file |

How to read the "minor and purely ancillary" clause: the DSA definition excludes a feature that is a minor and purely ancillary part of another service and cannot be used without it, as long as this is not used to avoid the regulation. The comment section of an online newspaper is the usual example of an ancillary feature; a review section that drives sales on a shop, or a forum that is the purpose of the site, is less clear. The agent does not decide: it describes the feature to the owner and writes "online platform: to be confirmed by a professional".

The scoping matrix applies these duties when `content.hosts_user_content` is true and the operator acts commercially; for a non-commercial site the question is flagged "to confirm" ([../scoping/obligations.json](../scoping/obligations.json), definition `dsa-hosting-service`).

## 2. Every intermediary service

- [ ] A single point of contact for authorities (Member States, Commission, Board), with the information to identify and contact it published, easily accessible and kept up to date, and the languages it accepts [DSA art. 11]
- [ ] A single point of contact for users, by electronic means and user-friendly, letting the user choose the means of communication; it must not rely solely on automated tools (a chatbot alone is not enough) [DSA art. 12]
- [ ] The terms and conditions state any restrictions imposed on content provided by users, including the policies, procedures, measures and tools used for content moderation (automated and human) and the rules of the internal complaint system, in clear, plain, user-friendly and unambiguous language, publicly available in an easily accessible and machine-readable format [DSA art. 14]
- [ ] Users are informed of any significant change to the terms and conditions [DSA art. 14(2) (to confirm)]
- [ ] A service mainly used by or aimed at minors explains its conditions and restrictions in a way minors can understand [DSA art. 14(3) (to confirm)]
- [ ] A provider established outside the EU designates a legal representative in a Member State and publishes its contact details; this is the owner's decision, the agent only asks [DSA art. 13 (to confirm)]

What the agent builds: a "Contact" page that names the point of contact for users (a form plus an email address, with a human behind it) and the point of contact for authorities (an email address); a "Terms of use" or "Community rules" page in HTML with a section on moderation. "Machine-readable" is met by HTML text with headings, not a scanned PDF.

Annual transparency reports on moderation are required of intermediary services, except micro and small enterprises that are not very large platforms [DSA art. 15 (to confirm)]. This article is not yet recorded in [../regulatory-status.md](../regulatory-status.md): ask the owner and their adviser which applies; the agent does not write the report.

## 3. Hosting services: notice and action, statement of reasons

### 3.1 Reporting illegal content

- [ ] A mechanism lets any person or entity notify the presence of content they consider illegal; it is easy to access, user-friendly and allows notices exclusively by electronic means [DSA art. 16(1)]
- [ ] The form makes it easy to give: why the content is considered illegal; the exact location (URL, and other identification if needed); the name and email address of the notifier; a statement confirming the notifier's good-faith belief that the notice is accurate and complete [DSA art. 16(2)]
- [ ] The name and email are optional for notices about child sexual abuse offences (the exception of Article 16(2)(c)) [DSA art. 16(2)]
- [ ] When the notice contains contact details, a confirmation of receipt is sent without undue delay [DSA art. 16(4) (to confirm)]
- [ ] The notifier is told the decision without undue delay, with the possibilities for redress, and whether automated means were used [DSA art. 16(5) (to confirm)]
- [ ] A "Report" control sits next to each item of user content, with an accessible name that says what is reported (illustration: "Report the review by Alex, 3 March") [WCAG 2.4.4; RGAA 6.1]
- [ ] The report form follows the form rules: visible labels, errors in text, confirmation announced [WCAG 3.3.1, 3.3.2, 4.1.3; RGAA 11.1, 11.10]

### 3.2 Telling users why their content was restricted

- [ ] When the provider removes, disables, demotes or restricts content, suspends payments, suspends or ends the service or the account, on the ground of illegality or of the terms and conditions, it gives the affected user a clear and specific statement of reasons, where it knows their electronic contact details [DSA art. 17(1)]
- [ ] The statement says: what the decision is (and its territorial scope and duration); the facts relied on, including whether it followed a notice; whether automated means were used; the legal or contractual ground and why; the redress available (internal complaint, out-of-court settlement, court) [DSA art. 17(3)]
- [ ] The back office stores, for each moderation decision, the data needed to produce that statement (decision type, ground, notice reference, automated or not, date) [best practice]

The skill does not write moderation decisions. It builds the data model, the templates and the forms so that the owner can comply.

## 4. Online platforms

### 4.1 Exclusion for micro and small enterprises

- [ ] Section 3 of Chapter III of the DSA (Articles 19 to 28, additional provisions for online platforms) does not apply to providers of online platforms that qualify as micro or small enterprises as defined in Recommendation 2003/361/EC, except Article 24(3), and except very large online platforms [DSA art. 19]
- [ ] The exclusion continues for a period after a provider loses that status (duration: [../regulatory-status.md](../regulatory-status.md) section 5.3), unless it is a very large online platform [DSA art. 19(1)]
- [ ] The marketplace duties of Section 4 (Articles 29 to 32) have the same exclusion for micro and small enterprises [DSA art. 29]

The size thresholds of Recommendation 2003/361/EC were not read by this skill. The agent asks the owner whether the provider is a micro or small enterprise in that sense and records the answer with "to be confirmed by a professional". When the answer is unknown, build the features of section 4.2: they are good practice in any case.

### 4.2 Duties of platforms that are not excluded

- [ ] An internal complaint-handling system, free of charge and electronic, available for a period after a decision set by Article 20, against decisions on notices and on content, accounts and monetisation; decisions on complaints are not taken solely by automated means [DSA art. 20 (to confirm)]
- [ ] Information about out-of-court dispute settlement is easily accessible, clear and user-friendly on the interface [DSA art. 21(1) (to confirm)]
- [ ] The interface does not deceive or manipulate users or otherwise materially distort their ability to make free and informed decisions; see [deceptive-design.md](deceptive-design.md) [DSA art. 25]
- [ ] Each advertisement shows, clearly and in real time, that it is an advertisement, on whose behalf it is presented, who paid if different, and meaningful information on the main targeting parameters [DSA art. 26(1)]
- [ ] Users who post content can declare that it contains commercial communications, and the platform then marks it for other users [DSA art. 26(2) (to confirm)]
- [ ] No advertising based on profiling with special categories of personal data [DSA art. 26(3) (to confirm)]
- [ ] Recommender systems: the main parameters, and the options to change them, are set out in the terms and conditions [DSA art. 27 (to confirm)]
- [ ] A platform accessible to minors puts in place appropriate and proportionate measures for a high level of privacy, safety and security of minors, and shows no profiling-based advertising to users it knows with reasonable certainty to be minors [DSA art. 28]
- [ ] A marketplace that lets consumers conclude contracts with traders collects the traders' identification before they can offer products (traceability) and designs its interface so that traders can give their pre-contractual and product safety information [DSA art. 30, 31 (to confirm)]

Marketplaces also have consumer-law duties of their own: see [online-sales.md](online-sales.md) section 2 (Article 6a of Directive 2011/83/EU).

## 5. Accessibility of these features

Report buttons, complaint forms and statements of reasons are page content: [../accessibility/rules.md](../accessibility/rules.md) applies. An advertisement label must be text that assistive technology reads, not only a coloured badge [WCAG 1.4.1; RGAA 3.1].

## 6. Review checklist

- [ ] Point of contact for users, not only automated, published and easy to find [DSA art. 12]
- [ ] Point of contact for authorities published [DSA art. 11]
- [ ] Terms of use with a moderation section, in HTML [DSA art. 14]
- [ ] A report control on each item of user content and a notice form with the elements of Article 16(2) [DSA art. 16]
- [ ] Statements of reasons can be produced for each restriction [DSA art. 17]
- [ ] Platform status and the micro or small enterprise question recorded as answered by the owner, or "to confirm" [DSA art. 19]
