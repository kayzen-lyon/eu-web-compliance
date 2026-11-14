# Template: French accessibility statement (déclaration d'accessibilité)

Guidance for the agent. Everything above the line "PUBLISHABLE TEXT" stays out of the published page.

This template is produced with an AI tool. It is not legal advice and it is not an audit. The published statement engages the body that signs it: a person of that body reads it and approves it before it goes online.

## Who publishes it

The bodies covered by Article 47 of loi n° 2005-102: see section 1.5 of `references/regulatory-status.md` for who they are and for the penalties. In the applicability matrix this is the row `fr-accessibility-statement`.

- Row `applies`: the statement is mandatory. Use this template.
- Row `to-confirm`: prepare the page as a draft, say that the legal duty is not confirmed, and do not publish on your own decision.
- Row `does-not-apply`: do not use this template. A private service provider covered by the European Accessibility Act gives a different document: `templates/accessibility-information-eaa.md`. A body can be under both texts, and then publishes both.

## Where it goes

Read on the official page "Déclaration d'accessibilité" (DINUM, consulted 2026-11-14, source `rgaa-mandatory-pages`):

- The statement is published on the site it covers, in an accessible format, on an accessibility page reachable directly from the home page and from every page of the site. In practice: a footer link present on all pages.
- The home page also carries the conformity mention (row `fr-accessibility-home-mention`). The mention and the statement always say the same thing.
- The statement links to the multi-year accessibility plan and to the action plan of the current year (row `fr-accessibility-multiannual-plan`). If they do not exist, tell the user: the statement cannot link to documents that were not written.
- The official page also provides for filing the statement through an online service whose arrangements are set by ministerial order, and sets how complaints about accessibility are acknowledged and answered. Tell the user to read that page for both points: `https://accessibilite.numerique.gouv.fr/obligations/declaration-accessibilite/`.

## What must come from a real audit

The skill cannot produce a conformity rate. The percentage of criteria met, the conformity status that follows from it, the list of non-conformities, the pages tested and the test environment all describe an audit carried out on the real site, by a person, against the RGAA version in force (named in `references/accessibility/rgaa/ACTIVE`). Automated checks and the agent's own review of the code are not that audit.

| Part of the statement | Where the content comes from |
|---|---|
| Name of the body, name and address of the site, contact form, contact details | The user or the project profile |
| Links to the multi-year plan and the action plan | The user |
| Conformity status, percentage of criteria met, average rate | The audit report only. Never computed, estimated or carried over by the agent |
| Non-conformities, with alternatives | The audit report |
| Derogations for disproportionate burden | A decision of the body, explained and reasoned. The agent never decides one |
| Content not subject to the obligation | The audit report, checked against the exemptions of the applicable law |
| Dates, technologies, test environment, tools, pages tested | The audit report; the list of technologies may be completed from the repository |

When no audit currently valid exists:

- The official page defines this case as non-conformity (section 1.5 of `references/regulatory-status.md`). The status line therefore reads "non conforme", and the home page mention too.
- Do not fill in a percentage, a list of pages tested or a test environment. Tell the user that these sections need an audit, and leave their placeholders visible in the draft so that nobody mistakes it for a finished statement.
- Do not replace the audit with the skill's own report. You may give that report to the user as preparation for the audit.

## Wording

The text below the line is the format the official page gives as mandatory, copied as read on 2026-11-14 (content under Licence Ouverte 2.0, DINUM). Keep its headings, their order and its sentences. Replace only the parts in square brackets, and delete the bracketed instructions once followed. Do not translate it: the statement is published in French. Keep the two addresses of the Défenseur des droits and its postal address exactly as given.

The official site also publishes a filled example at `https://accessibilite.numerique.gouv.fr/ressources/modele-de-declaration/`. Read it to see what finished sections look like; its dates and sample content are illustrations.

When you turn the text into a page of the site: one `h1` for the page title, the headings below as `h2` and `h3` in the order given, real lists, links with explicit text, and the page language set to French. The statement itself must pass the accessibility rules of the skill.

## When RGAA 5 arrives

RGAA 5 is not published (section 1.5 of `references/regulatory-status.md`). Nothing from its drafts enters a statement. When it is published and brought into force, the statement format, the criteria counted in the conformity rate and the validity of existing statements may change: read `references/accessibility/rgaa/5/README.md` for the migration procedure, check the official page again, and update this template before using it. Until then, a statement is drawn up against the version named in `references/accessibility/rgaa/ACTIVE`, and its validity periods are those of section 1.5 of regulatory-status.

---

PUBLISHABLE TEXT (everything below this line; delete everything above, this line included)

# Déclaration d’accessibilité

[Nom de l’organisme concerné] s’engage à rendre [son (ses) site(s) internet, intranet, extranet et son (ses) application(s) mobile(s), etc.] accessibles conformément à l’article 47 de la loi n° 2005-102 du 11 février 2005.

À cette fin, il met en œuvre la stratégie et les actions suivantes [liens vers le schéma pluriannuel et vers le plan d’action de l’année en cours incluant le bilan des actions réalisées l’année précédente].

Cette déclaration d’accessibilité s’applique à [Nom du site web de l’application mobile, ou d’un autre service auquel la déclaration s’applique].

## État de conformité

[Nom du site web, de l’application mobile, ou d’un autre service concerné] est [totalement / partiellement / non] conforme avec [pour les sites : le référentiel général d’amélioration de l’accessibilité / autre protocole de test utilisé ; pour les autres services de communication : protocole de test utilisé].

### Résultat des tests

L’audit de conformité réalisé [en interne / par la société NNN] révèle que :

- [pourcentage de critères RGAA respectés] des critères RGAA sont respectés.
- [Facultatif] Le taux moyen de conformité du service en ligne s’élève à [taux moyen de conformité du service en ligne].

[Détailler ici les résultats des tests ou insérer un lien vers le rapport de test]

## Contenus non accessibles

Les contenus listés ci-dessous ne sont pas accessibles pour les raisons suivantes.

### Non conformité

- [Lister la/les non-conformité(s) du/de la/des site(s) internet/application(s) mobile(s) et/ou décrire quels section(s)/contenu(s)/fonction(s) ne sont pas encore conformes, indiquer les alternatives s’il y a lieu].

### Dérogations pour charge disproportionnée

- [Lister la/le/les section(s)/contenu(s)/fonction(s) non accessible(s) pour laquelle/lequel/lesquels la dérogation pour charge disproportionnée est temporairement invoquée, indiquer les alternatives s’il y a lieu].

### Contenus non soumis à l’obligation d’accessibilité

- [Lister la/le/les section(s)/contenu(s)/fonction(s) non accessible(s) qui n’entre(nt) pas dans le champ d’application de la législation applicable, indiquer les alternatives s’il y a lieu].

## Établissement de cette déclaration d’accessibilité

Cette déclaration a été établie le [JJ mois AAAA]. Elle a été mise à jour le [JJ mois AAAA].

### Technologies utilisées pour la réalisation [Du site web / De l’application mobile / Du service…]

- [Liste des technologies utilisées]

### Environnement de test

Agents utilisateurs, technologies d’assistance et outils utilisés pour vérifier l’accessibilité

- [Indiquer les combinaisons utilisées pour effectuer les vérifications de conformité]

### Les outils utilisés lors de l’évaluation

- [Indiquer les outils utilisés]

### Pages du site ayant fait l’objet de la vérification de conformité

- [Indiquer la liste des pages qui ont été testées]

## Retour d’information et contact

Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable du [site internet / application mobile / Autre service] pour être orienté vers une alternative accessible ou obtenir le contenu sous une autre forme.

- Envoyer un message [url du formulaire en ligne]
- Contacter [Nom de l’entité responsable du service en ligne] [url d’une page avec les coordonnées de l’entité]

## Voies de recours

Cette procédure est à utiliser dans le cas suivant.

Vous avez signalé au responsable du site internet un défaut d’accessibilité qui vous empêche d’accéder à un contenu ou à un des services du portail et vous n’avez pas obtenu de réponse satisfaisante.

- Écrire un message au Défenseur des droits : <https://www.defenseurdesdroits.fr/nous-contacter-355>
- Contacter le délégué du Défenseur des droits près de chez vous : <https://www.defenseurdesdroits.fr/carte-des-delegues>
- Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) :
  Défenseur des droits
  Libre réponse 71120
  75342 Paris CEDEX 07
