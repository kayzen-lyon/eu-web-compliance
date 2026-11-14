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
| 6 | Versions consolidées du DSA et du Cyber Resilience Act | La directive 2011/83/UE a été relue avec ses actes modificatifs (2019/2161 et 2023/2673), la directive 2005/29/CE avec son annexe I modifiée ; le DSA et le CRA ne l'ont été que dans leur version d'origine | Relire les versions consolidées avant la v1 |
| 7 | Directive 2002/58/CE consolidée | Non affichable ; l'article 5(3) a été lu dans la directive modificative 2009/136/CE | Suffisant pour la règle ; à relire pour les autres articles |
| 8 | RGPD lu sur la reproduction de la CNIL | Pas de lecture au Journal officiel | Risque faible ; à recouper une fois EUR-Lex disponible |
| 9 | Prolongation du délai de rétractation en l'absence du bouton | Aucun texte ne le dit expressément ; cela résulte d'une lecture combinée des articles L. 221-20 et L. 221-5, 7° | Ne pas l'affirmer dans le skill ; le signaler comme interprétation à faire valider |
| 10 | Levé le 14/11/2026 : la section 4.2.7 de la communication 2021/C 526/01 a été lue (état réglementaire, section 5.3) | — | Base de `references/consumer/deceptive-design.md` |
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
| 22 | Registre des traitements : la matrice considère que les traitements d'un site en fonctionnement (comptes, commandes, demandes de contact) ne sont pas « occasionnels » au sens de l'article 30(5) du RGPD, donc que l'exemption des moins de 250 personnes ne joue pas | Lecture du texte faite par le skill, non validée par un juriste | Le registre est marqué obligatoire dès qu'il y a des données personnelles. Les conditions de l'analyse d'impact et du délégué à la protection des données sont, elles, établies (état réglementaire, section 3.1) |
| 23 | Seuils de la recommandation 2003/361/CE (micro et petites entreprises) auxquels renvoient les articles 19 et 29 du DSA | La définition de plateforme en ligne et l'exclusion ont été lues, pas les seuils | Ligne DSA « plateforme » toujours « à confirmer » |
| 24 | Liste détaillée des exceptions au droit de rétractation en France (article L. 221-28) | L'article 16 de la directive a été lu en entier ; L. 221-28 seulement à travers un outil de résumé | Champ déclaré par l'utilisateur ; renvoi à un professionnel |
| 25 | Règle de rattachement territorial (quel droit national s'applique à un site) | Idem | Règle provisoire choisie dans la matrice, à valider |
| 26 | Définition des « services de commerce électronique » au sens de l'EAA, et champ de l'article 6 bis de la directive 98/6/CE (biens seulement ?) | Idem | Lecture large retenue, à valider |
| 27 | Obligation d'emploi de la langue française (loi n° 94-665) | Non vérifiée | Aucune ligne |

| 28 | Détails de syntaxe des configurations de serveurs : noms d'options helmet (`strictTransportSecurity`, `xFrameOptions`), `http2 on` dans nginx 1.25.1 et plus, `poweredByHeader` et `headers()` avec `output: 'export'` dans Next.js, constantes WordPress `DISALLOW_FILE_EDIT` et `WP_DEBUG`, directive CSP `require-trusted-types-for` | Écrits de mémoire, non relus sur la documentation officielle | Signalés dans `references/security/configs/` ; à vérifier avant la v1 |
| 29 | Échange de clés post-quantique hybride en TLS 1.3 (fiche ANSSI-FT-115) | Fiche non lue | Aucun réglage de courbe recommandé |
| 30 | Paramètres de stockage des mots de passe (Argon2, scrypt, PBKDF2) et entropie des jetons | Les guides ANSSI ne donnent pas ces valeurs | Valeurs de l'OWASP ou extension de WEB R38, marquées `[best practice]` |

| 31 | AI Act, articles 6(3) et 6(4) (dérogation et règle du profilage pour le haut risque), articles 22, 25 et 26, lignes directrices sur les pratiques interdites C(2025) 5052, projet de lignes directrices sur la classification à haut risque | Non lus (erreur 429 sur le service d'assistance) | Le skill repère les domaines de l'annexe III et renvoie à un professionnel, sans appliquer la dérogation |
| 32 | Traduction par IA d'un texte d'intérêt public publié sans relecture | Déduction du point 138 des lignes directrices sur l'article 50, non validée | Classée « à confirmer » par `scripts/ai_act_classify.py` |
| 33 | Texte exact de l'article D. 221-5 du code de la consommation (présentation de la fonction de rétractation) | Non lu ; les libellés français viennent de l'état réglementaire | Composant de rétractation fondé sur L. 221-21 et la directive |
| 34 | Libellés du bouton de commande et de la fonction de rétractation dans les autres langues de l'UE, et formulations « équivalentes » admises | Non vérifiés | Seuls les libellés anglais et français sont proposés ; toute autre formulation est à valider |
| 35 | Règles françaises d'affichage des prix autres que les annonces de réduction | Non lues | Seules les réductions de prix sont couvertes |
| 36 | Autorités allemandes compétentes (accessibilité, traceurs) | Non vérifiées | Fiche pays `de.md` marquée « partial » |


| 37 | CGV entre professionnels (article L. 441-1 du code de commerce) | Non lu | Le module « documents » renvoie à un conseil |
| 38 | Compétence et loi applicable aux contrats avec des consommateurs (règlement Bruxelles I bis, articles 17 à 19 ; règlement Rome I, article 6) | Non lus | Renvoi à un professionnel |
| 39 | Sanction des clauses abusives (article L. 241-1), garanties légales de conformité (articles L. 217-3 et suivants, L. 224-25-12 et suivants), garantie des vices cachés | Non lus | Le modèle de CGV ne les détaille pas |
| 40 | Libellé de la fonction de résiliation en ligne (article D. 215-1) | Lu seulement dans une source secondaire | Non repris |
| 41 | Amende de l'article 1-2 de la LCEN pour une personne morale | Montant annoncé par le skill repris, non vérifié | Non repris |

Point 24 levé partiellement le 14/11/2026 : l'article L. 221-28 a été lu sur Légifrance (état réglementaire, section 5.2), à travers un outil qui restitue des citations exactes courtes.

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
