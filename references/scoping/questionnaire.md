# Scoping questionnaire

Read this file when the project has no `compliance/profile.json`, or when the site has changed in a way that changes who it serves or what it does (a shop is added, a chatbot is added, a new country is targeted).

The goal is one file, `compliance/profile.json`, that says who operates the site and what the site does. The script [applicability.py](../../scripts/applicability.py) then reads it with the decision table [obligations.json](obligations.json) and says which obligations concern the project. No rule of the skill is presented as a legal duty before this step is done.

Three steps: read the repository, ask the user what the repository cannot say, write the profile and run the script.

## 1. How an answer is recorded

Each answer in the profile is an object with a `value` and a `basis`. The schema is [profile.schema.json](../../schemas/profile.schema.json); a filled example is [profile.example.json](../../templates/profile.example.json).

| Basis | Use it when | Effect on the matrix |
|---|---|---|
| `stated` | The user said it in this conversation or in a project document. Quote the words in `note`. | The answer decides. |
| `inferred` | A file of the repository shows it. Name the file in `note`. | The answer decides. |
| `assumed` | Nobody answered and the most protective reading was written down. Say so in `note`. | Rows that depend on it are `to-confirm`. |
| (no answer) | No protective value can be written, for example a headcount. | Rows that depend on it are `to-confirm`. |

Two rules keep the profile honest:

1. Infer a "yes" from evidence, never a "no" from silence. Finding an analytics tag proves trackers are present. Finding none proves nothing: tags are often injected by a tag manager, a CMS plugin or the hosting platform. A "no" is `stated` by the user, or it is not written.
2. Never record a guess as `inferred`. A number of employees, a turnover, a legal form or a country are not in the code. Ask.

## 2. What to read in the repository before asking

Search the repository for the signals below and record what you find with basis `inferred`. The names in the tables are illustrations to show what a signal looks like; they are not a complete list, and a tool that is not named here counts just the same. When you find a third-party script or SDK you do not know, read what it loads and classify it by what it does.

### Stack and hosting → `site.stack`

| Look in | Examples of signals |
|---|---|
| Dependency manifests | `package.json` (`next`, `nuxt`, `astro`, `@sveltejs/kit`), `composer.json` (`symfony/*`, `laravel/framework`), `Gemfile` (`rails`), `pyproject.toml` or `requirements.txt` (`django`, `flask`) |
| CMS and static generators | `wp-config.php`, `wp-content/`, `config.toml` with a `themes/` folder, `_config.yml` |
| Deployment files | `Dockerfile`, `vercel.json`, `netlify.toml`, `nginx.conf`, `.htaccess` |

### Selling and payment → `market.sells_online`, `data.third_party_tool_kinds` (`payment`)

| Look in | Examples of signals |
|---|---|
| Packages | `stripe`, `@stripe/stripe-js`, `@paypal/paypal-js`, `@mollie/api-client`, `@adyen/adyen-web` |
| URLs in templates | `js.stripe.com`, `www.paypal.com/sdk/js`, a hosted checkout redirect |
| Code and data model | Routes or folders named `cart`, `checkout`, `order`, `panier`, `commande`; tables `orders`, `invoices`; an e-commerce plugin or theme |

A payment provider shows that something is sold. It does not show to whom: ask whether buyers are consumers (question 4).

### Trackers and third-party scripts → `data.non_essential_trackers`, `data.third_party_tool_kinds`, `data.third_party_tools`

| Kind | Examples of signals |
|---|---|
| `analytics` | `googletagmanager.com/gtag/js`, `gtag(`, a `matomo.js` or `piwik.js` include, `plausible.io/js/`, a `data-website-id` attribute |
| `advertising` | `connect.facebook.net`, `fbq(`, `snap.licdn.com`, `analytics.tiktok.com`, a tag manager container (`googletagmanager.com/gtm.js`) |
| `session-replay` | `static.hotjar.com`, `clarity.ms/tag/`, packages `logrocket`, `@fullstory/browser` |
| `social-embed`, `video-embed`, `maps` | `platform.twitter.com/widgets.js`, `youtube.com/embed/`, `player.vimeo.com`, `maps.googleapis.com` |
| `fonts-or-cdn`, `captcha` | `fonts.googleapis.com`, `cdn.jsdelivr.net`, `google.com/recaptcha`, `hcaptcha.com` |
| `chat-widget` | `widget.intercom.io`, `client.crisp.chat`, `embed.tawk.to` |
| `email-tracking` | A newsletter SDK (`@mailchimp/mailchimp_marketing`, `@getbrevo/brevo`), a 1×1 image in an email template, link-rewriting options in a mailer configuration |
| Own storage | `document.cookie =`, `localStorage.setItem(` with an identifier, a `Set-Cookie` header that is not a session or a consent choice |
| Consent tools | `tarteaucitron`, `axeptio`, `didomi`, `cookiebot`: their presence means trackers were planned, even if you do not see them |

A tag manager container or a consent tool is enough to set `data.non_essential_trackers` to `true` with basis `inferred`. Whether a given tracker needs consent is decided later, with the trackers rules (planned file `references/privacy/trackers.md`), not here.

### Personal data and accounts → `data.collects_personal_data`, `site.user_accounts`

| Look in | Examples of signals |
|---|---|
| Forms | `<form>` with fields such as `email`, `name`, `tel`, `address`; contact, newsletter, quote and job application forms |
| Authentication | `next-auth`, `passport`, `devise`, `django.contrib.auth`, `@supabase/supabase-js` with `auth.`, `@clerk/*`, `firebase/auth`; routes `login`, `signup`, `register`, `connexion` |
| Data model | Migrations or schemas with `users`, `customers`, `email`, `birth_date`, `phone` |
| Sensitive fields | Columns or form fields about health, disability, religion, union membership, sexual orientation, or a national identification number: set `data.special_categories` or `data.health_data` and expect the stop described in [out-of-scope.md](out-of-scope.md) |

### AI features → `ai.*`

| Look in | Examples of signals |
|---|---|
| Packages | `openai`, `@anthropic-ai/sdk`, `@mistralai/mistralai`, `@google/generative-ai`, `ai` (an SDK for streaming model output), `langchain`, `llamaindex`, `ollama`, `@huggingface/inference`, `transformers` |
| URLs and configuration | `api.openai.com`, `api.anthropic.com`, `api.mistral.ai`, `generativelanguage.googleapis.com`; environment variable names ending in `_API_KEY` next to a model name |
| Conversation | A chat component that sends user text to one of the above; a support widget with an automated agent |
| Generated content | A script that writes articles, product descriptions, images or audio into the site's content folder or database |
| Faces, voices, emotions | `face-api.js`, `@mediapipe/tasks-vision`, a camera or microphone permission request next to a classification call: set `ai.emotion_or_biometric` and expect the stop described in [out-of-scope.md](out-of-scope.md) |
| Decisions | Code that scores, ranks, accepts or rejects a person (applicants, borrowers, tenants, pupils, insured persons) with a model output |

The repository rarely shows the operator's role. A site that calls a model API from its own code and presents the result under its own name is likely a provider of that AI system; a site that embeds a ready-made assistant is likely a deployer. "Likely" is not an answer: ask (question 8).

### Languages and markets → `site.languages`

| Look in | Examples of signals |
|---|---|
| Markup | `<html lang="…">`, `hreflang` links |
| Translation files | `locales/`, `messages/fr.json`, `config/locales/*.yml`, an `i18n` block in the framework configuration |
| Clues about countries | Currency, delivery zones, a `mentions-legales` or `impressum` page, the top-level domain, an address in the footer |

Clues about countries are not answers. Use them to pre-fill question 3 and ask.

### Content supplied by users → `content.hosts_user_content`

| Look in | Examples of signals |
|---|---|
| Data model | `comments`, `reviews`, `posts`, `listings`, `messages` linked to a user |
| Uploads | `multer`, Active Storage, an upload endpoint whose files are shown to other visitors |
| Embedded services | A third-party comment or review widget |

## 3. Questions to ask the user

Ask everything in one message. Leave out a question the repository already answered, except to confirm an inference in one line ("I found a payment SDK and a chatbot widget: correct?"). Never ask more than ten. Write for someone who is not a lawyer, in the user's language, and say in one sentence why each answer matters.

| # | Question | Why it is asked | Profile fields | Obligations that depend on it |
|---|---|---|---|---|
| 1 | Who operates the site: a public body, a private body entrusted with a public service mission, a company, an association or an individual? Is it run as part of an economic activity, as an institution, or as a purely personal site? | Some texts only bind public bodies or large companies; others only bind those who act in the course of a trade. | `operator.type`, `operator.activity_kind` | `fr-rgaa-conformity`, `fr-accessibility-statement` and the other Article 47 rows; `con-operator-identification`; AI Act rows (a personal, non-professional use is treated differently); `dsa-*` |
| 2 | How many people work for the operator? What are its annual turnover and its balance sheet total? For a company established in France: what is the average turnover made in France over the last three financial years? | The European Accessibility Act exempts microenterprises that provide services, and the test combines headcount with turnover or balance sheet. The French Article 47 uses a separate turnover average. | `operator.headcount`, `operator.annual_turnover_eur`, `operator.balance_sheet_total_eur`, `operator.fr_turnover_3y_average_eur` | `eaa-*`, `fr-eaa-service-provider-duties`, Article 47 rows, the level of `a11y-baseline-wcag22-aa` |
| 3 | In which country is the operator established, and which countries does the site address? | Directives are applied through national laws that differ. Only EU law and French law are verified in this version. | `operator.country_of_establishment`, `market.target_countries`, `site.languages` | Every `fr-*` row; the "national rules not verified" lines |
| 4 | Can people order or subscribe on the site? Are the buyers consumers? What is sold (goods, services, digital content, subscriptions)? Does at least one of these sales give the consumer a right of withdrawal? | Selling to consumers at a distance brings rules on the order button, the withdrawal function, prices and mediation. | `market.sells_online`, `market.sells_to_consumers`, `market.sells_what`, `market.withdrawal_right_applies` | `con-order-button`, `con-withdrawal-function`, `con-price-reduction`, `con-no-deceptive-design`, `fr-order-process-information`, `fr-withdrawal-function`, `fr-consumer-mediator`, `fr-ecommerce-identification`, `eaa-*` |
| 5 | Does the site provide to consumers one of these services: online sale of anything, consumer banking, passenger transport (tickets, travel information), e-books, electronic communications, access to audiovisual media? Does the operator work in a sector that needs a licence or has its own supervisor (bank, insurance, health, legal profession, gambling, telecoms, transport)? | These are the services the European Accessibility Act covers. A regulated sector brings rules this skill does not cover. | `eaa.sectors`, `operator.regulated_sector` | `eaa-*`, `fr-eaa-service-provider-duties`; the "regulated sector" stop |
| 6 | Which personal data does the site collect, including through the tools I found (list them)? Any health data or other sensitive data? Are there user accounts? Are other tools added outside the code, for example through a tag manager or the hosting dashboard? Do any of these tools send data outside the European Union? | Data protection rules apply as soon as personal data are processed, and trackers need consent before they run. | `data.*`, `site.user_accounts` | `gdpr-*`, `sec-*`, `privacy-baseline-no-tracker-before-consent`, `fr-trackers-*`, `fr-audience-measurement-exemption`, `fr-session-replay`, `fr-email-tracking-pixels` |
| 7 | Is the site aimed at minors, or likely to be used by them? | Children's consent has its own rules, and several other texts protect minors. | `audience.includes_minors` | `gdpr-children-consent`, `fr-children-consent-age`; the "minors" stop |
| 8 | Does the site have an AI feature: an assistant people talk to, a feature that generates text, images, audio or video for users, emotion recognition or biometric categorisation, a system that takes or prepares decisions about people? Is content published on the site generated by AI? For each AI system: did you build it or have it built under your name, or do you use a product supplied by someone else? | The AI Act sets transparency duties that differ for the provider of a system and for its deployer, and prohibits some uses outright. | `ai.*` | `ai-*`, `gdpr-automated-decisions`; the "prohibited practice" and "high-risk" stops |
| 9 | Can users post content that others can see or that the site stores for them (comments, reviews, listings, uploads)? | Hosting content supplied by users brings duties under the Digital Services Act. | `content.hosts_user_content` | `dsa-intermediary-duties`, `dsa-hosting-notice-action`, `dsa-online-platform-duties` |
| 10 | Is there already someone in charge of these subjects: a data protection officer, a lawyer, an accessibility lead? | The matrix sends some points to a professional; knowing who exists makes that referral concrete. | `referents.*` | None. Used to address the referrals |

How to turn answers into fields:

- Question 1: a sole trader is `individual` with `activity_kind` `commercial`. A hobby blog with no advertising and no sale is `individual` and `personal`. A town hall is `public-body` and `institutional`.
- Question 2: record figures as given, in euros. Do not round a figure towards a threshold and do not convert "small" or "a few people" into a number: ask again or leave the answer out.
- Question 5: put `e-commerce` in `eaa.sectors` whenever a consumer can conclude a contract on the site, whatever is sold. An empty list is an answer ("none of these"); leaving the field out means "not known".
- Question 8: when the user cannot tell provider from deployer, record `ai.role` as `both` with basis `assumed`.

## 4. No answer, or a non-interactive run

When the user does not answer a question, or the agent runs without anyone to ask (continuous integration, batch generation, an autonomous task):

1. Do not stop the work and do not invent an answer.
2. For a yes-or-no answer, write the protective value given by `x-protective-assumption` in the schema, with basis `assumed` and a `note` saying that nobody answered. The protective value is the one that brings more obligations, not fewer: the site sells to consumers, collects personal data, has trackers, may be used by minors, hosts user content.
3. For a figure, a legal form or a country, write nothing. No protective number exists that would not be an invention. The rows that need it come out as `to-confirm`.
4. Treat every `to-confirm` row as if it applied until someone confirms. In particular, never rely on an exemption (microenterprise, non-professional publisher, "not an online platform") on the strength of an assumption.
5. Run the script. Its output lists the assumed answers and the missing ones; copy that list to the top of whatever you deliver, so that the user sees which questions are still open.

An assumption is replaced, never silently kept: when the user answers later, change the value, set the basis to `stated` and run the script again.

## 5. Write the profile and produce the matrix

1. Write `compliance/profile.json` following the schema. Set `updated` to today's date.
2. Run `python scripts/applicability.py compliance/profile.json --output-dir compliance` from the skill folder. It writes `applicability-matrix.md` and `applicability-matrix.json` and fails with a message naming the faulty answer if the profile does not follow the schema.
3. Show the matrix to the user. Keep its three kinds of lines apart when you summarise it: what a legal text requires of this operator, what is recommended (by a regulator or by the skill), and what must be confirmed.
4. If the last section of the matrix lists a case that goes beyond the skill, read [out-of-scope.md](out-of-scope.md) before writing any code for the feature concerned.

Dates of application, thresholds and penalty amounts are never copied into the profile, the matrix or your summary from memory: each row names the section of [regulatory-status.md](../regulatory-status.md) that carries them.
