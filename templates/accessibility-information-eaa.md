# Template: accessibility information of a service (European Accessibility Act)

Guidance for the agent. Everything above the line "PUBLISHABLE TEXT" stays out of the published document.

This template is produced with an AI tool. It is not legal advice and it is not an audit. The published text describes the service on behalf of its provider: a person of the provider reads it and approves it before it goes online.

## Who gives this information

A service provider whose service falls under Directive (EU) 2019/882: in the applicability matrix, the rows `eaa-information-duty` (EU) and `fr-eaa-service-provider-duties` (France). Scope, exemption and dates are in sections 1.3 and 1.4 of `references/regulatory-status.md`.

- Row `applies`: the information is mandatory. Use this template.
- Row `to-confirm`: prepare it as a draft and say that the legal duty is not confirmed.
- Row `does-not-apply`: nothing requires this document. Do not publish it as if it were a legal notice. A body covered by the French Article 47 publishes a different document: `templates/accessibility-statement-fr.md`.

The publishable text below is in French, for a service provided to consumers in France. For another Member State, the structure follows Annex V of the directive, which is the same everywhere, but the national transposition was not verified: translate the structure, and write in your report "national rules not verified for" that country.

## What the texts require

Article 13(2) and Annex V of Directive (EU) 2019/882 are summarised in section 1.3 of regulatory-status. In France they are Article D. 412-57, 2° of the code de la consommation and its annex, read on Légifrance on 2026-11-14 (sources `fr-code-consommation` for the article and `fr-code-consommation-d412-57-annexe` for its annex; versions in force on that date, created by décret n° 2023-931). Exact extracts:

Article D. 412-57, 2°:

> « Ils établissent les informations nécessaires conformément à l'annexe du présent article et expliquent comment les services satisfont aux exigences applicables en matière d'accessibilité. Les informations sont mises à la disposition du public sous forme écrite et orale, y compris d'une façon qui est accessible aux personnes handicapées. Les prestataires de services conservent ces informations aussi longtemps que le service est disponible ; »

Annex to Article D. 412-57, « Informations sur les services conformes aux exigences en matière d'accessibilité »:

> « I. - Le prestataire de services inclut les informations évaluant la façon dont le service respecte les exigences en matière d'accessibilité mentionnées à l'article L. 412-13 du code de la consommation dans les clauses et conditions générales ou dans un document équivalent. Ces informations décrivent les exigences applicables et portent, dans la mesure nécessaire à l'évaluation, sur la conception et le fonctionnement du service. Outre l'information du consommateur exigée en vertu de la directive 2011/83/UE, cette documentation comporte, s'il y a lieu, les éléments suivants :
> a) Une description générale du service dans des formats accessibles ;
> b) Les descriptions et explications nécessaires pour comprendre le fonctionnement du service ;
> c) Une description de la manière dont les exigences en matière d'accessibilité mentionnées à l'article L. 412-13 du code de la consommation sont remplies par le service.
> II. - Pour satisfaire aux exigences du I, le prestataire de services peut appliquer entièrement ou en partie les normes harmonisées et les spécifications techniques dont les références ont été publiées au Journal officiel de l'Union européenne.
> III. - Le prestataire de services fournit des informations démontrant que le procédé de prestation du service et le suivi de celui-ci assurent sa conformité avec le I et avec les exigences applicables de l'article D. 412-57. »

The sections of the publishable text follow these points: sections 1, 2 and 3 are I a), b) and c); section 4 is II; section 5 is III; section 6 answers the "written and oral" requirement of Article D. 412-57, 2°.

## Where it goes and in which formats

- Place: in the general terms and conditions, or in an equivalent document. If you publish it as a separate page, the general terms link to it, and the page is reachable from every page (footer link next to the terms).
- Written format: the page itself, accessible. It must pass the accessibility rules of the skill; a PDF alone is not enough unless it is itself accessible.
- Oral format: the texts require the information to be available orally. A website cannot satisfy this by itself. Ask the user how a person can obtain the information orally (a telephone number, a reception desk, a relay service) and write that in section 6. If the user has no answer, leave the placeholder visible and report the gap: do not invent a telephone number or a service.
- Duration: kept available as long as the service is provided. Keep it under version control with the site, and date each update.

## No presumption of conformity

On the verification date no harmonised standard is cited in the Official Journal under this directive: see section 1.2 of `references/regulatory-status.md`, and read it again before writing, because this is on the watch list. Consequences for section 4 of the text:

- Name the technical reference actually used to build and evaluate the service (the skill builds to the target named in `references/accessibility/rules.md`).
- Do not write that the service is "conforme à la norme harmonisée", "certifié" or "présumé conforme". Applying a standard is a method; the provider still has to show that the requirements are met.

## What the agent may write, and what it may not

- Describe only what was built and verified. Section 3 lists requirement by requirement how the service meets it, from the skill's verification report and from any audit the user provides. A requirement that was not tested is written as not yet evaluated, never as met.
- Do not write that the service "est conforme" as a whole. The skill does not issue that verdict.
- Known shortcomings are stated, with the alternative offered and the planned correction. If the evaluation shows that the service does not meet a requirement, Article D. 412-57 also gives the provider duties towards the authorities (corrective measures, information); their exact wording is not recorded in `references/regulatory-status.md` and is to be confirmed. Tell the user plainly; this is a point for a lawyer, described in `references/scoping/out-of-scope.md`.
- If the provider intends to rely on disproportionate burden or fundamental alteration, the assessment and its documentation are the provider's (row `eaa-disproportionate-burden`). Do not write such a claim on your own initiative.
- For an online shop, section 3 also covers identification, security and payment functions, and the accessibility information about the products sold when the operator responsible for them provides it (row `eaa-ecommerce-functions`).

Replace every part in square brackets and delete the bracketed instructions once followed. Unlike the French accessibility statement, no official model exists for this document: the wording below is a proposal of the skill, and only the structure comes from the texts.

---

PUBLISHABLE TEXT (everything below this line; delete everything above, this line included)

# Accessibilité du service [nom du service]

[Nom du prestataire], [forme juridique et adresse], fournit le service [nom du service] à l’adresse [adresse du site]. Ce document explique comment ce service respecte les exigences d’accessibilité qui lui sont applicables en vertu de l’article L. 412-13 du code de la consommation. Il fait partie de nos conditions générales [ou : il complète nos conditions générales, accessibles à l’adresse (lien)].

Dernière mise à jour : [JJ mois AAAA].

## 1. Description générale du service

[Décrire en quelques phrases simples ce que le service permet de faire, à qui il s’adresse et par quels moyens il est fourni : site web, application mobile, courrier électronique, téléphone.]

Cette description est disponible dans les formats suivants : [page web accessible ; autres formats proposés, par exemple document téléchargeable accessible, version facile à lire].

## 2. Fonctionnement du service

[Expliquer, étape par étape, comment une personne utilise le service : créer un compte, rechercher, commander, payer, suivre une commande, contacter l’assistance, résilier. Signaler les étapes qui passent par un prestataire tiers, par exemple le paiement.]

## 3. Manière dont le service remplit les exigences d’accessibilité

Le service a été évalué le [JJ mois AAAA] par [nom de la personne ou de l’organisme, interne ou externe], selon la méthode suivante : [méthode : audit manuel, tests avec technologies d’assistance, contrôles automatisés ; pages et parcours évalués].

[Pour chaque exigence applicable au service, indiquer comment elle est remplie. Une exigence qui n’a pas encore été évaluée est indiquée comme telle.]

| Exigence applicable | Comment le service la remplit | État |
|---|---|---|
| [Exigence] | [Description] | [Remplie / Partiellement remplie / Non remplie / Non évaluée] |

### Limites connues

[Lister les contenus ou fonctions qui ne remplissent pas encore une exigence, l’alternative proposée et la date de correction prévue. N’écrire qu’aucune limite n’est connue que si un audit réalisé par une personne et fourni par le prestataire le montre, en rappelant sa date et son périmètre ; à défaut, laisser cette section en attente et le signaler.]

## 4. Normes et spécifications techniques appliquées

Pour concevoir et évaluer le service, nous appliquons [référence technique utilisée, avec sa version], [en totalité / pour les parties suivantes : …].

## 5. Suivi de la conformité

[Décrire comment l’accessibilité est maintenue dans le temps : contrôles réalisés avant chaque mise en ligne, fréquence des évaluations, prise en compte des évolutions du service et des exigences, traitement des signalements, personne ou équipe responsable.]

## 6. Obtenir ces informations sous une autre forme et nous contacter

Ces informations sont disponibles par écrit sur cette page. Vous pouvez aussi les obtenir oralement : [moyen réel indiqué par le prestataire : numéro de téléphone et horaires, accueil physique, service de relais].

Si vous rencontrez une difficulté d’accès à un contenu ou à une fonction du service, vous pouvez nous la signaler : [formulaire accessible ou adresse électronique ; autre moyen de contact]. Nous vous indiquerons une solution ou une alternative.
