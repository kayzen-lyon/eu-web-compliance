# Is it AI, and who is responsible for it?

Two questions decide everything else in this folder: is the feature an **AI system** within the meaning of the AI Act, and is the website operator its **provider**, its **deployer**, or both? The answer changes which paragraph of Article 50 is the operator's own legal duty.

## How to use this file

1. Run section 1 for every feature that the code, the dependencies or the user call "AI". Run section 2 for every feature that passes section 1.
2. Record the result in the project profile (section 4). The classifier `scripts/ai_act_classify.py` reads it.
3. Some cases cannot be settled from the code: a heavily customised vendor product, a white-label assistant, a model trained with someone's help. Record them as `both` (the protective reading) and tell the user that the role is to be confirmed by a lawyer. Do not choose the convenient answer.
4. Tags are explained in [README.md](README.md). The definitions quoted come from Article 3 as summarised in [../regulatory-status.md](../regulatory-status.md) section 2.

## 1. Is it an AI system?

Article 3(1) defines an AI system as a machine-based system designed to operate with varying levels of autonomy that infers, from the input it receives, how to generate outputs such as predictions, content, recommendations or decisions. In practice for a website: a feature built on a machine-learning model (a language model, an image model, a classifier, a recommender) is an AI system; a feature that only follows rules written by people is not.

- [ ] Treat as an AI system any feature that calls a language, image, audio or video model (an API such as a chat-completion endpoint, an embedded vendor assistant, a self-hosted model) [AI Act art. 3(1)]
- [ ] Treat as not an AI system a rule-based bot that answers from a fixed decision tree or keyword table, and an automatic reply that is the same for everyone; the Guidelines give "rule-based quick message answers" as an example [AI Act Guidelines point 30]
- [ ] When the code does not show which one it is (a vendor widget whose engine is unknown), record it as an AI system and mark it "to confirm" [best practice]
- [ ] A feature marketed as "AI" that is in fact rule-based is outside the AI Act, but calling it AI is a statement to consumers: do not build UI that claims capabilities the feature does not have [best practice]

Why the protective default: a disclosure on a feature that turns out not to be AI costs a sentence; a missing disclosure on one that is AI breaches Article 50.

## 2. Provider or deployer?

- **Provider** (Article 3(3)): develops an AI system, or has it developed, and places it on the market or puts it into service under its own name or trademark, for payment or free of charge.
- **Deployer** (Article 3(4)): uses an AI system under its authority, except in a personal non-professional activity. Authority means deciding to deploy the system and how it is used; technical control is not needed [AI Act Guidelines point 12].
- One operator can be both for the same system, for example a company that builds an in-house generator and uses it to make deep fakes [AI Act Guidelines point 15].

| Website situation | Likely role of the operator | Why |
|-------------------|-----------------------------|-----|
| Embeds a vendor chatbot or support widget, configured but not modified, shown under the vendor's product | Deployer | The vendor offers the system under its own name to businesses that use it as supplied (Guidelines point 11) |
| Builds its own chatbot ("Ask Lumen", "ShopAssist") on a model API, with its own prompts, retrieval and interface, under its own name | Provider of that chatbot, and its deployer | An organisation that develops an interactive system in-house and puts it into service under its own name is a provider (Guidelines point 11); the model vendor stays the provider of the model |
| Takes an existing generative system, modifies it (for example with new training data, fine-tuning) and puts it into service under its own name | Provider of the new system | Guidelines point 11, footnote 5 |
| Uses a third-party image or text generator in its back office and publishes some outputs on the site | Deployer | It uses the system under its authority; the tool vendor is the provider |
| Offers visitors an AI generator (avatar maker, copywriting tool) built on a model API under the site's brand | Provider of that generator | Same as the second row; the visitors who use it are deployers of their own outputs, or exempt if acting privately (Guidelines points 19 and 20) |
| Hosts content that its users generated with AI elsewhere (forum, marketplace listings) | Neither, for that content | Hosting or disseminating third-party AI content does not make a deployer (Guidelines point 16); platform duties are in the consumer-law part of the skill (`references/consumer/`) |
| An agency or freelancer builds or runs the AI feature for the operator | The operator keeps its role | A legal person remains a deployer when it involves contractors on its behalf; its staff are not separate deployers (Guidelines point 14) |
| A private individual's personal blog, no economic activity | Not a deployer | Article 3(4) excludes personal non-professional use; regular economic benefit makes an activity professional (Guidelines point 19) |

- [ ] Ask the user who built the AI feature and under whose name it appears to visitors, before deciding any Article 50 duty; the code alone rarely answers [best practice]
- [ ] Record the operator as provider when it develops an interactive or generative system, or has one developed, and puts it into service under its own name, including for its own use only [AI Act art. 3(3); AI Act Guidelines point 11]
- [ ] Record the operator as provider when it modifies an existing generative system (new training data, fine-tuning) and puts it into service under its own name [AI Act Guidelines point 11]
- [ ] Record the operator as deployer when it uses a system supplied by someone else under its authority, even if a contractor operates it [AI Act art. 3(4); AI Act Guidelines points 12, 14]
- [ ] When the vendor's name and the site's name both appear, or a vendor product is rebranded, record `both` and mark the role "to confirm" with a lawyer [best practice]
- [ ] Free and open-source licensing does not remove Article 50 duties for a system in its scope [AI Act Guidelines point 23]
- [ ] A provider outside the Union is caught when the output of its system is used in the Union; a deployer outside the Union when it foresees use of the output in the Union, for example by posting it on the open web [AI Act Guidelines points 10, 13]

What each role means for Article 50:

| Paragraph | Who owes it | What the site does in every case |
|-----------|-------------|----------------------------------|
| 50(1) tell people they interact with an AI | Provider | Shows the notice of [../../templates/ai/ai-chat-disclosure.html](../../templates/ai/ai-chat-disclosure.html), whoever the provider is |
| 50(2) machine-readable marking and detection | Provider | Keeps the marks the generator added (does not strip metadata); a provider site implements marking |
| 50(3) inform people exposed to emotion recognition or biometric categorisation | Deployer | First runs [prohibited-practices.md](prohibited-practices.md) |
| 50(4) label deep fakes and public-interest text | Deployer | Uses [../../templates/ai/ai-content-label.html](../../templates/ai/ai-content-label.html) |
| 50(5) clear, distinguishable, first interaction or exposure, accessible | Whoever owes 50(1) to (4) | Every notice follows [transparency.md](transparency.md) section D |

When the operator is only a deployer of a chatbot, Article 50(1) is the vendor's legal duty. The skill still shows the notice on the site: the visitor meets the chatbot on the operator's page, the cost is one line, and it covers the case where the role was misjudged. Tell the user it is a precaution, not their legal obligation, so they can weigh it.

## 3. Out of scope

- [ ] Research, testing and development before a system is placed on the market or put into service is excluded, but testing in real-world conditions is not; a public beta on the live site counts as real-world use [AI Act Guidelines point 22]
- [ ] Outputs that only select or rank existing content (recommenders, search ranking) are not synthetic content under Article 50(2) [AI Act Guidelines point 65]
- [ ] Recommender systems, spam filters, automatic translation or transcription tools, search without generation and auto-completion do not interact directly with persons within the meaning of Article 50(1) [AI Act Guidelines point 31]
- [ ] Source code, markup, configuration, schemas and their integral comments written with an AI tool are outside Article 50(2) marking: do not label them [AI Act Guidelines point 68]
- [ ] Being outside Article 50 does not take a feature outside Article 5 or the high-risk rules, and complying with Article 50 does not make a feature lawful [AI Act Guidelines point 25]

Military, defence and national security uses are also excluded from the Regulation; a website project is not expected to rely on that exclusion, and the skill does not assess it.

## 4. Recording the role in the profile

The profile field `ai.role` (schema: `schemas/profile.schema.json`) takes `provider`, `deployer` or `both`. Its protective default is `both`. Each answer carries its basis: `stated` (the user said so), `inferred` (read in the code) or `assumed`.

```json
"ai": {
  "conversational_assistant": {"value": true, "basis": "inferred", "note": "Vendor chat widget loaded in layout"},
  "role": {"value": "deployer", "basis": "stated", "note": "User: vendor chatbot used as supplied, vendor name shown in the widget"}
}
```

The role can differ between features (a vendor chatbot and an in-house image generator on the same site). The classifier accepts an optional `ai.features` list where each feature carries its own `role`; see the header of `scripts/ai_act_classify.py` for the fields. Until that list is part of the published schema, keep it in a copy of the profile used only for the classifier, or record the per-feature roles in the `note`.

- [ ] Never record `deployer` on the basis of "we only call an API": building a product on an API under one's own name is the provider case of section 2 [AI Act Guidelines point 11]
- [ ] Write in the `note` the facts that led to the role (who built it, whose name is shown, whether the model was modified), so that a reviewer can check the reasoning [best practice]
