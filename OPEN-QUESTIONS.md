# Points ouverts

Dernière mise à jour : 14 novembre 2026.

Ce fichier liste ce qui n'a pas pu être confirmé sur une source officielle, et les décisions en attente. Rien de ce qui figure ici n'entre dans `references/regulatory-status.md` tant que le point n'est pas levé.

## 1. Faits non confirmés

| # | Point | Ce qui manque | Conséquence pour le skill |
|---|-------|---------------|---------------------------|
| 1 | Citation d'EN 301 549 V4.1.1 au Journal officiel de l'UE | Recherche faite sur les métadonnées de l'Office des publications, pas sur le moteur d'EUR-Lex (indisponible le 14/11/2026). Résultat : rien trouvé | À re-vérifier sur EUR-Lex dès qu'il répond. Le skill indique la V3.2.1 comme version de référence légale |
| 2 | Amende EAA pour une personne morale en France | L'article 131-41 du code pénal (multiplication par cinq) n'a pas été ouvert | Le skill n'indique que le plafond de 1 500 € pour une personne physique |
| 3 | Renvois internes de l'article R. 451-4 du code de la consommation | Lus à travers un outil de résumé, avec des numéros incohérents | Recopier les renvois depuis Légifrance avant de les citer |
| 4 | Texte intégral des quatre catégories de l'article 47, I, de la loi n° 2005-102 | Même limite de lecture | Reprendre le texte exact avant d'écrire la règle de qualification « secteur public » |
| 5 | Sections de la recommandation CNIL sur le rejeu de session (délibération n° 2026-114) | Lue via un extracteur automatique | Vérifier les numéros de section avant de les citer |
| 6 | Versions consolidées des directives 2011/83/UE et 2005/29/CE, du DSA et du Cyber Resilience Act | Seules les versions d'origine du Journal officiel ont été lues | Relire les versions consolidées avant d'écrire les règles détaillées (étapes M2 et M3) |
| 7 | Directive 2002/58/CE consolidée | Non affichable ; l'article 5(3) a été lu dans la directive modificative 2009/136/CE | Suffisant pour la règle ; à relire pour les autres articles |
| 8 | RGPD lu sur la reproduction de la CNIL | Pas de lecture au Journal officiel | Risque faible ; à recouper une fois EUR-Lex disponible |
| 9 | Prolongation du délai de rétractation en l'absence du bouton | Aucun texte ne le dit expressément ; cela résulte d'une lecture combinée des articles L. 221-20 et L. 221-5, 7° | Ne pas l'affirmer dans le skill ; le signaler comme interprétation à faire valider |
| 10 | Section 4.2.7 de la communication de la Commission sur les pratiques déloyales (interfaces trompeuses) | Seule la table des matières a été lue | Lire la section avant d'écrire la liste des interfaces trompeuses |
| 11 | Contenu de la proposition de Digital Fairness Act | Page de garde seulement | Sans effet aujourd'hui ; à suivre |
| 12 | Transposition française de NIS2 | Dernier état officiel lu : 17 mars 2026 (texte en cours d'examen). État au 14/11/2026 non lu | Le skill ne dit rien de NIS2 pour l'instant |
| 13 | Date de publication de l'OWASP Top 10:2025 | Absente des pages officielles lues | Citer l'édition sans date |
| 14 | Licence de l'OWASP Top 10 | Le site dit CC BY 3.0, le dépôt dit CC BY-SA 4.0 | Ne citer que les identifiants et intitulés |
| 15 | Conditions de réutilisation des publications de la CNIL et de la spécification Agent Skills | Non lues | Citer et reformuler, sans recopier |
| 16 | Définition de « SMC » (petites entreprises de taille intermédiaire) dans l'AI Act modifié | Non lue | Le skill ne mentionne que la règle applicable aux PME |
| 17 | Publication au Journal officiel des lignes directrices sur l'article 50 | Non vérifiée | Sans incidence : elles sont de toute façon non contraignantes |
| 18 | Guides ANSSI de 2025 et 2026 sur l'IA (« approche par les risques », « système IA agentique ») | Titres et dates lus, pas les documents | À lire avant de les utiliser comme source |

| 19 | EN 301 549 V3.2.1, version qui porte aujourd'hui la présomption de conformité | Non lue : seule la V4.1.1 l'a été | `mapping.json` ne donne que les clauses V4.1.1 |
| 20 | Tableau ZA.1 d'EN 301 549 V4.1.1 (contenu web) : la clause 10 (documents) n'y figure pas, alors que l'annexe A la dit minimale | Contradiction apparente dans la norme | Signalé dans `references/accessibility/en-301-549.md`, sans trancher |
| 21 | Tableau ZB.5 d'EN 301 549 V4.1.1 : renvoi à une clause 4.2.12 introuvable | Probable erreur de la norme | Renvoi non repris |
| 22 | Conditions d'application du registre des traitements, du délégué à la protection des données et de l'analyse d'impact | Faits absents de l'état réglementaire | Aucune ligne dans la matrice d'obligations |
| 23 | Définition de « plateforme en ligne » et exclusion des micro et petites entreprises du DSA | Idem | Ligne DSA « plateforme » toujours « à confirmer » |
| 24 | Exceptions au droit de rétractation | Idem | Champ déclaré par l'utilisateur |
| 25 | Règle de rattachement territorial (quel droit national s'applique à un site) | Idem | Règle provisoire choisie dans la matrice, à valider |
| 26 | Définition des « services de commerce électronique » au sens de l'EAA, et champ de l'article 6 bis de la directive 98/6/CE (biens seulement ?) | Idem | Lecture large retenue, à valider |
| 27 | Obligation d'emploi de la langue française (loi n° 94-665) | Non vérifiée | Aucune ligne |

## 2. Écarts relevés entre les textes

Ces points ne sont pas des erreurs du skill : ce sont des incohérences entre sources officielles, que le skill devra expliquer à l'utilisateur.

1. Le RGAA 4.1.2 se réfère à EN 301 549 V2.1.2 et à WCAG 2.1. La version de la norme citée au Journal officiel de l'UE est la V3.2.1, et la plus récente (V4.1.1) reprend WCAG 2.2. Le skill vise WCAG 2.2 niveau AA, ce qui couvre les trois.
2. Aucune norme harmonisée n'est citée au titre de l'European Accessibility Act. Un site privé ne peut donc pas s'appuyer sur une présomption de conformité : il doit démontrer qu'il satisfait les exigences de l'annexe I.
3. Accusé de réception de la rétractation : « sans retard indu » dans la directive, « dans un délai raisonnable » en droit français.
4. Terminaux en libre-service : vingt ans au plus dans la directive, quinze ans en France. Sans effet sur un site web.

## 3. Décisions en attente

1. Écoconception (RGESN) : l'inclure comme module facultatif ou non ? Elle n'est pas obligatoire, et sa licence (partage à l'identique) interdit d'en recopier le texte.
2. Un seul skill avec des modes internes, ou un skill accompagné de commandes séparées ?
3. Périmètre géographique : les 27 États membres seulement, ou aussi la Norvège, l'Islande et le Liechtenstein, puis le Royaume-Uni et la Suisse ?
4. Serveur MCP « Juris Limen » : non connecté pendant l'étape M0. À connecter avant la relecture de l'étape M4.

## 4. Limites de la vérification du 14 novembre 2026

- eur-lex.europa.eu était indisponible. Les textes de l'UE ont été lus sur le dépôt de l'Office des publications, qui sert le même texte du Journal officiel, et sur le service d'assistance AI Act de la Commission pour le règlement consolidé.
- cyber.gouv.fr bloquait les lectures automatiques. Les guides de l'ANSSI ont été lus sur messervices.cyber.gouv.fr.
- Les pages de Légifrance ont été lues à travers un outil qui restitue des extraits : les citations courtes sont exactes, mais les articles longs n'ont pas été relus mot à mot.
- Seuls le droit de l'UE et le droit français ont été vérifiés. Les 26 autres États membres restent à faire.
- La vérification a été faite par des agents IA. Aucun juriste ne l'a relue.
