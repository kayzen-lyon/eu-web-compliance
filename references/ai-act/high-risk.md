# High-risk areas: recognise, stop, refer

Annex III of the AI Act lists areas where an AI system is presumed high-risk and subject to a heavy regime (risk management, data governance, documentation, human oversight, registration, deployer duties). This skill does not produce that work. Its job is to recognise, from a website feature, that the project may have entered one of these areas, and to stop and refer before the feature is built.

## How to use this file

1. Read section 1 whenever a feature scores, ranks, filters, selects, prices or decides about individual people, or uses biometric data. The profile field `ai.decisions_about_people` set to `true` means you must read it.
2. If a row matches, follow section 2. Do not decide yourself whether the system is actually high-risk: the classification conditions of Article 6, including its derogation in paragraphs 3 and 4, have not been read by this skill (`OPEN-QUESTIONS.md`, item 31), applying them is a legal assessment, and the Commission's guidance on classification is outside this skill.
3. The dates on which the high-risk regime applies are in [../regulatory-status.md](../regulatory-status.md) section 2. A later date is not a reason to build now: a system put into service before it will have to comply on that date, and redesigning it then costs more.
4. Prohibitions come first: some uses in these areas are not high-risk but prohibited ([prohibited-practices.md](prohibited-practices.md)).

## 1. Annex III areas as they show up on a website

The area names follow Annex III as summarised in [../regulatory-status.md](../regulatory-status.md) section 2; the point letters were read on the [AI Act Service Desk](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3). The website features are illustrations.

| Annex III area | Uses listed (summary) | Website features that should trigger a stop |
|----------------|----------------------|---------------------------------------------|
| 1. Biometrics | Remote biometric identification (1a), categorisation by sensitive or protected traits from biometric data (1b), emotion recognition (1c) | Face matching of visitors, age or gender estimation from a selfie used to sort people, webcam emotion analysis |
| 2. Critical infrastructure | Safety components in critical digital infrastructure, road traffic, water, gas, heating, electricity | A web dashboard that lets an AI control or switch a utility network (unusual for a website) |
| 3. Education and vocational training | Admission or assignment (3a), evaluating learning outcomes (3b), assessing the level of education a person will get (3c), monitoring prohibited behaviour during tests (3d) | Automated grading of essays or exams, AI that ranks applicants to a school or course, online proctoring that flags cheating |
| 4. Employment and workers management | Recruitment and selection, including targeted job ads, screening and evaluating candidates (4a); decisions on promotion, termination, task allocation, and monitoring of performance and behaviour (4b) | CV screening or ranking on a careers page, chatbot that pre-selects applicants, AI that targets job ads at chosen profiles, employee performance scoring in an intranet |
| 5. Essential private and public services | Public authorities assessing eligibility for benefits and services (5a), creditworthiness or credit scoring except fraud detection (5b), risk assessment and pricing in life and health insurance (5c), emergency call triage and dispatch (5d) | Instant loan or "buy now, pay later" decision, insurance quote priced by AI on a person's profile, benefit eligibility checker of a public body, symptom triage for emergencies |
| 6. Law enforcement | Uses by or for law enforcement authorities | Not expected on an ordinary website |
| 7. Migration, asylum and border control | Uses by public authorities | Visa or residence application assistants of a public body that assess applicants |
| 8. Justice and democratic processes | Assisting judicial authorities (8a); influencing elections, referendums or voting behaviour (8b), except tools for campaign logistics nobody is exposed to | Political micro-targeting or AI persuasion content aimed at voters; AI used by a court or arbitrator |

- [ ] When a feature takes or prepares a decision about a person in one of the Annex III areas, treat it as possibly high-risk and stop before building it [AI Act Annex III]
- [ ] A chatbot, translation or content tool on a site in one of these sectors is not high-risk by that fact alone: the test is what the AI decides or prepares about people, not the sector of the site [best practice]
- [ ] Credit scoring is listed, but AI used to detect financial fraud is excluded from point 5(b); whether a given fraud model stays outside is still for a lawyer to confirm [AI Act Annex III]
- [ ] Emotion recognition is an Annex III use where it is not prohibited; the Guidelines note that it is therefore also high-risk, in addition to Article 50(3) [AI Act Guidelines point 102]
- [ ] A system that is high-risk may also fall under Article 50: complying with one does not settle the other [AI Act Guidelines point 25]

## 2. What to do

- [ ] Stop work on the feature and tell the user which area it may fall under, why, and that the high-risk regime is outside this skill [best practice]
- [ ] Refer the owner to a lawyer who practises AI regulation before the feature goes live, and to the vendor's documentation if a third-party system is used [best practice]
- [ ] Do not write risk management files, conformity documentation, technical documentation or registration content: producing them from a website project would give false assurance [best practice]
- [ ] Offer the lawful part that does not depend on the decision: the form, the accessible pages, the privacy notice, a human review step in the workflow [best practice]
- [ ] Record the case in the report under "stop: possible high-risk area", with the area, the evidence, and "to be reviewed by a lawyer" [best practice]

Illustration of the message to the user (adapt; do not copy as is):

> The "auto-shortlist" step ranks job applicants with an AI model. Recruitment and screening of candidates is an area listed in Annex III of the AI Act, so the system may be high-risk, with obligations this skill does not cover. I have not built the ranking. Please have a lawyer who practises AI regulation review it before it goes live. Meanwhile I have built the application form and a manual review queue.

## 3. Deployer of a vendor's high-risk system

When the operator buys an HR, credit or education tool and only embeds it:

- [ ] The operator is the deployer, as defined in Article 3(4), even though the vendor built the system [AI Act art. 3(4)]
- [ ] A deployer of a high-risk system has duties of its own under the high-risk regime; this skill has not read them, so the details are for a lawyer [AI Act art. 26 (to confirm)]
- [ ] People subject to decisions of a high-risk system have to be informed of its use under the deployer rules; this information is distinct from the Article 50 notices but may be combined with them [AI Act Guidelines point 25, footnote 14]
- [ ] Ask the vendor in writing how its system is classified and what documentation and instructions it provides, and keep the answer with the project [best practice]

## 4. Automated decisions and the GDPR

Independently of the AI Act, a decision based solely on automated processing that produces legal or similarly significant effects on a person is regulated by Article 22 of the GDPR. The rules and the stop are in [../privacy/data-subject-rights.md](../privacy/data-subject-rights.md).

- [ ] When an AI feature decides about people, run both checks: this file for the AI Act, and Article 22 for the GDPR [GDPR art. 22(1)]

This file is produced with the help of an AI and is not legal advice.
