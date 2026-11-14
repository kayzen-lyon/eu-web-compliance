# Where the skill stops

Read this file when the applicability matrix ends with a case under "Beyond the skill", or when you meet one of the situations below while working, whatever the profile says.

This skill helps an agent build a website that meets the obligations it can check. It is produced by AI agents, no lawyer has reviewed it, and it does not replace legal advice or an audit. In the situations below a mistake would harm people or expose the operator to consequences that a checklist cannot weigh, so the skill refers the user to a professional. Referring is not abandoning: each entry says what the agent still does in the meantime.

How to tell the user: say what you found and where (file, feature, answer of the profile), say that this point is beyond what the skill can decide, name the kind of professional to consult, and say what you did or did not do while waiting. Write it at the top of your report, not in a footnote.

## 1. Situations found by the matrix

| Situation | Trigger in the profile | Why the skill stops | What the agent still does | Who to consult |
|---|---|---|---|---|
| Prohibited AI practice suspected | `ai.emotion_or_biometric` is true or not ruled out; or the agent sees in the code or the request any practice listed in section 2 of [regulatory-status.md](../regulatory-status.md) | Some uses of AI are forbidden outright, and whether a given use falls under the prohibition or one of its exceptions is a legal qualification | Does not write, extend or optimise the feature. Keeps working on the rest of the site. Records the finding in the report with the file and the reason | A lawyer who practises AI regulation, before any further work on the feature |
| Possible high-risk AI area | `ai.decisions_about_people` is true or not ruled out | Classification under Annex III of the AI Act, and the regime that follows, are outside this skill | Applies the transparency rules of the skill, flags the feature, does not state that the system is or is not high-risk | A lawyer who practises AI regulation |
| Health data or other special categories | `data.health_data` or `data.special_categories` is true or not ruled out | Processing these data is prohibited unless an exception applies, and health data often brings sector rules on hosting and security that the skill does not cover | Applies the data protection and security rules of the skill, does not choose the exception or the lawful basis, does not add collection of such data on its own initiative | The data protection officer, or a data protection lawyer |
| Audience includes minors | `audience.includes_minors` is true or not ruled out | Children's consent, age checks, profiling and advertising towards minors need an analysis of the service and its public | Applies the general rules, avoids profiling and advertising features aimed at minors unless the user confirms they were reviewed, flags the point | A data protection professional |
| Regulated sector | `operator.regulated_sector` is true or not ruled out, or `eaa.sectors` names banking, electronic communications, passenger transport or audiovisual media | A sector authority and sector rules apply on top of the matrix (the French authorities are listed in section 1.4 of [regulatory-status.md](../regulatory-status.md)) | Applies every row of the matrix, including the European Accessibility Act rows, and says that sector rules were not checked | The operator's compliance function or a lawyer of the sector |
| Target country not covered | A country of `market.target_countries` or `operator.country_of_establishment` is not France | Only EU law and French law were verified. National transpositions differ on accessibility statements, trackers, legal notices, consumer rules and language | Applies the EU baseline and writes "national rules not verified for" that country in every deliverable. For a country outside the Union, says that its law is not covered at all | A lawyer of that country |

"Not ruled out" means the answer is missing or was only assumed. The agent then behaves as if the situation were present, and asks the question again at the first opportunity.

Referrals rest on facts. Raise one on a stated or inferred answer, and on an assumed answer alone only where the stakes justify it: a possibly prohibited or high-risk AI use, health or other special-category data, minors exposed to profiling or advertising. Elsewhere an assumed answer is an open question to put to the user, not a stop; the script does not list the regulated-sector case when it rests only on an assumed answer. Before assuming anything, record what the request or brief already settles ([questionnaire.md](questionnaire.md) section 1, rule 3): a town hall does not sell online, and a brief that lists the features of a shop and names no AI feature rules AI out.

## 2. Legal qualifications the skill does not make

These rows of the matrix come out as `to-confirm` by design, because the answer depends on a legal assessment of the facts and not on a fact the profile can hold.

| Question | Rows concerned | What the agent still does |
|---|---|---|
| Is a private body entrusted with a public service mission one of those Article 47 of loi n° 2005-102 covers? | `fr-rgaa-conformity`, `fr-accessibility-statement`, `fr-accessibility-multiannual-plan`, `fr-accessibility-home-mention` | Builds to the accessibility baseline, prepares the statement template as a draft, and asks the user to have the qualification confirmed |
| Is the operator the provider or the deployer of an AI system? | `ai-disclose-interaction`, `ai-mark-synthetic-content` | Makes the disclosure visible on the site in both cases; does not claim that marking of generated content is someone else's duty |
| Is published AI content a deep fake, or text informing the public on matters of public interest, and does the editorial exception apply? | `ai-disclose-generated-content` | Labels AI-generated content by default; never removes a label on the ground that an exception applies without the user's explicit confirmation |
| Is the service an online platform, and does the size exclusion apply? | `dsa-online-platform-duties` | Applies the hosting duties when user content is stored; says that the platform layer was not assessed |
| Is a site run outside any economic activity an intermediary service? | `dsa-intermediary-duties`, `dsa-hosting-notice-action` | Offers a simple way to report content; says that the duty was not confirmed |
| Does children's consent, or the rule on automated decisions, apply to this processing? | `gdpr-children-consent`, `fr-children-consent-age`, `gdpr-automated-decisions` | Applies the general data protection rules and flags the point |
| Can the operator rely on disproportionate burden, on fundamental alteration, or on an exclusion of content from the European Accessibility Act? | `eaa-disproportionate-burden`, `eaa-service-accessibility` | Builds the content accessibly. Never writes that an exception applies: the assessment and its documentation belong to the operator |

## 3. Subjects the skill does not cover

The matrix is limited to what [regulatory-status.md](../regulatory-status.md) establishes. The subjects below have no row. Silence of the matrix on them does not mean that nothing applies.

- Products. The European Accessibility Act also covers products, with no microenterprise exemption for them, and the Cyber Resilience Act covers products with digital elements (section 4 of regulatory-status explains why a website as such is not treated as one). The skill deals with websites and the services they provide.
- Data protection governance: whether a data protection officer must be appointed, whether an impact assessment is required, whether a record of processing must be kept. The articles are listed in section 3.1 of regulatory-status; their conditions are not encoded.
- The high-risk regime of the AI Act and the obligations of general-purpose AI model providers.
- Network and information security legislation, sector security rules, and certification schemes.
- Exceptions to the consumer's right of withdrawal, guarantees, unfair contract terms, and the content of general terms and conditions beyond the mentions listed in the matrix.
- Language requirements, intellectual property, advertising rules, tax and invoicing.
- The law of any country other than France, and of any country outside the European Union.
- Open points listed in `OPEN-QUESTIONS.md` at the root of the repository: nothing from that file is used as a rule.

## 4. Things the skill never does, whatever the profile

- It does not state that a site, a company or a service "is compliant". A verdict applies to one criterion, and a doubt gives "not tested".
- It does not produce an accessibility conformity rate. That figure comes from an audit carried out on the real site by a person; see the header of [accessibility-statement-fr.md](../../templates/accessibility-statement-fr.md).
- It does not tell an operator that it is exempt on the strength of an assumed or missing answer.
- It does not answer a formal notice, a complaint or a request from an authority. It tells the user to take advice at once and to keep the documents.
- It does not quote a date of application, a threshold or a penalty amount from memory: it points to the section of regulatory-status that carries it.

## 5. What "consult a professional" means in practice

Give the user something they can act on:

1. The question to put to the professional, in one or two sentences, with the facts the agent observed.
2. The kind of professional: a lawyer for a legal qualification; the data protection officer or the data protection authority's public guidance for personal data; an accessibility auditor for a conformity audit; the sector's compliance function for sector rules. If `referents` in the profile names someone, say so.
3. What is blocked meanwhile (a prohibited or possibly prohibited feature) and what is not (everything else).
4. The rows of the matrix to update once the answer is known, so that the profile is corrected and the script run again.
