# PRD — Skill « eu-web-compliance »

Document d'exigences produit. Version 0.1 du 14 novembre 2026.

Nom de travail du skill : `eu-web-compliance` (le nom définitif doit rester en minuscules, chiffres et tirets, 64 caractères au plus, identique au nom du dossier).

---

## 1. Résumé

`eu-web-compliance` est un skill unique, open source (MIT), qu'un agent IA de développement charge lorsqu'il crée, modifie ou audite un site web destiné au marché européen. Il réunit dans un même paquet cinq domaines aujourd'hui dispersés dans quatre dépôts :

1. l'accessibilité (European Accessibility Act, EN 301 549, WCAG 2.2 AA, RGAA 4.1.2 avec préparation du RGAA 5) ;
2. la protection des données (RGPD, directive ePrivacy, règles CNIL sur les traceurs) ;
3. le règlement européen sur l'IA (AI Act), surtout la transparence de l'article 50 ;
4. la sécurité web (guides ANSSI, complétés par l'OWASP) ;
5. les obligations d'information et de protection du consommateur propres à un site (mentions légales, CGV, bouton de rétractation, affichage des prix, DSA).

Le skill fait trois choses : il détermine quelles obligations s'appliquent au projet, il fait produire à l'agent un code conforme dès l'écriture, et il vérifie le résultat en distinguant ce qui est prouvé de ce qui reste à contrôler par une personne.

## 2. Problème

- Un agent qui génère un site applique rarement ces règles spontanément, et quand il le fait, il s'appuie sur sa mémoire, souvent périmée (dates de l'AI Act, version du RGAA, règles cookies).
- Les skills existants sont partiels : chacun couvre un seul domaine, souvent une seule pile technique (Rails, React) ou un seul public (État français).
- Aucun ne couvre le RGPD côté interface (bandeau, blocage des scripts avant consentement), ni les obligations consommateur, ni le lien entre les domaines. Exemple de lien : l'information « vous parlez à une IA » exigée par l'AI Act doit elle-même être accessible.
- Les textes bougent vite. Entre juin et novembre 2026 : calendrier de l'AI Act modifié, EN 301 549 V4.1.1 publiée, bouton de rétractation devenu obligatoire, trois nouvelles recommandations CNIL.

## 3. Objectifs et non-objectifs

### Objectifs

| # | Objectif | Mesure de réussite |
|---|----------|--------------------|
| O1 | Un site généré avec le skill ne contient aucun défaut détectable automatiquement dans les cinq domaines | Zéro violation axe-core (WCAG 2.2 AA) et zéro règle « bloquante » en échec sur les sites de test du dépôt |
| O2 | L'agent sait quelles obligations s'appliquent avant d'écrire du code | Matrice d'applicabilité produite pour 100 % des projets, avec la source de chaque obligation |
| O3 | Chaque règle est traçable jusqu'à un texte officiel | 100 % des règles portent un identifiant de source ; le contrôle automatique échoue sinon |
| O4 | Le skill dit la vérité sur ce qu'il n'a pas vérifié | Chaque rapport liste les points « non testés » ; aucun rapport n'emploie « conforme » pour l'ensemble du site |
| O5 | Le skill reste à jour | Chaque fait réglementaire porte une date de vérification ; alerte au-delà de 90 jours |
| O6 | Le skill fonctionne avec les principaux agents | Installation documentée et testée pour Claude Code, Codex, Copilot, Cursor, OpenCode |
| O7 | Le passage au RGAA 5 se fait sans réécriture | Ajout d'un jeu de données et d'une table de correspondance, sans toucher aux règles de génération |

### Non-objectifs

- **Garantir la conformité juridique.** Aucun outil ne le peut : une part des critères d'accessibilité exige un jugement humain (le skill RGAA d'Isalafont estime que l'analyse statique couvre de façon fiable 30 à 40 critères sur 106), et la qualification juridique d'un service relève d'un juriste. Le skill vise « conforme par construction pour tout ce qui est vérifiable, et liste explicite du reste ».
- Remplacer un audit d'accessibilité, un délégué à la protection des données, un avocat ou un organisme notifié.
- Couvrir les applications mobiles natives, les documents bureautiques et les logiciels embarqués (prévu après la v1, voir la feuille de route).
- Traiter en détail les systèmes d'IA à haut risque : le skill les détecte et renvoie vers les obligations, sans produire la documentation de conformité.
- Couvrir les réglementations sectorielles (santé, finance, dispositifs médicaux) au-delà de leur signalement.

## 4. Utilisateurs

| Utilisateur | Besoin |
|-------------|--------|
| Agent IA de développement (utilisateur direct) | Des instructions courtes au chargement, des références détaillées lues à la demande, des scripts déterministes, des gabarits à remplir |
| Développeur ou développeuse indépendant, agence, PME | Livrer un site qui respecte les obligations sans être juriste ; obtenir les pages légales et un rapport lisible |
| Équipe produit du secteur public | Appliquer le RGAA et les guides ANSSI, préparer la déclaration d'accessibilité |
| Auditeur, DPO, juriste | Un rapport qui sépare le prouvé de l'incertain et qui cite ses sources |
| Contributeur open source | Ajouter un pays, une pile technique ou une mise à jour réglementaire sans casser le reste |

## 5. Sources à fusionner

| Source | Licence | Ce qu'on reprend | Ce qui manque |
|--------|---------|------------------|---------------|
| `Isalafont/claude-skill-rgaa-dev` (v1.2.2) | Licence Ouverte 2.0 (attribution obligatoire : source et date) | Guide d'implémentation « accessibilité d'abord », règles d'or, anti-patterns ARIA, exemples HTML universels, checklists par type de page, couleurs et contrastes, solutions de repli (composant tiers, PDF, vidéo), impacts par handicap | Centré Rails et DSFR ; RGAA 4.1.2 seulement |
| `etalab-ia/skills` — `rgaa` | MIT | Méthode d'auto-évaluation en trois phases, statuts C / NC / NA / NT, classement des 106 critères par mode d'évaluation (code, mixte, conditions réelles, jugement humain), textes officiels générés depuis le JSON de la DINUM, scripts de contrôle avec tests | Audit seulement, pas de génération ; HTML, React, ERB |
| `etalab-ia/skills` — `securite-developpement`, `anssi-guides` | MIT | 14 domaines de sécurité issus de 13 guides ANSSI, traçabilité règle par règle (`[WEB R14]`, `[DINUM]`), fichier de valeurs chiffrées à ne jamais réinventer, mode conseil et mode audit, schéma JSON des constats | Orienté applications de l'État ; pas de section « site vitrine ou e-commerce » |
| `etalab-ia/skills` — `usage-ia-agents-etat` | MIT | Principe d'alerte proactive (transparence IA, données sensibles envoyées à un outil grand public, automatisation sans validation humaine) | Public : agents de l'État ; à généraliser |
| `morellid/ai-act-skill` | MIT | Classification d'un système d'IA, pratiques interdites, article 50 détaillé avec les lignes directrices de la Commission, calendrier à jour, registre `sources.yaml` (URL, date, empreinte), exemples avec sortie attendue, adaptateurs Copilot et Cursor, script de validation | En anglais ; orienté conseil juridique, pas génération de code |
| `github/awesome-copilot` | MIT (Copyright GitHub, Inc.) | `instructions/a11y.instructions.md` (environ 40 anti-patterns WCAG 2.2 avec motif de détection et gravité), `instructions/security-and-owasp.instructions.md` (OWASP Top 10, en-têtes HTTP, cookies), `skills/gdpr-compliant` (minimisation, durées, journal de consentement, droits des personnes), agents d'accessibilité (commandes axe-core, pa11y, Lighthouse ; test clavier en navigateur), hooks de détection de secrets et de licences | Rien sur l'AI Act, le RGAA, l'ANSSI, les bandeaux cookies, l'écoconception |

Constats issus de l'analyse :

- **Aucune source ne couvre le bandeau cookies ni le blocage des scripts avant consentement.** Ce volet est à écrire à partir des textes de la CNIL.
- **Aucune source ne couvre les obligations consommateur** (mentions légales, bouton de rétractation, prix). À écrire à partir des textes.
- **Aucune source ne couvre le RGAA 5**, qui n'est pas publié (voir section 6).
- Les deux skills RGAA se recoupent largement : l'un guide l'écriture, l'autre l'évaluation. Le nouveau skill garde les deux rôles sur un seul jeu de critères.

## 6. État réglementaire au 14 novembre 2026

> **Section remplacée.** Depuis l'étape M0, la référence est `references/regulatory-status.md`, dont chaque fait a été relu sur une source officielle. Le tableau ci-dessous est conservé comme point de départ ; il contient des éléments corrigés depuis, notamment : les sanctions RGAA (Arcom, 50 000 € et 25 000 €, article 47-1 de la loi n° 2005-102) ; l'article qui porte la fonction de rétractation en France (L. 221-21 et D. 221-5, et non L. 222-7) ; l'absence de la norme C2PA dans le code de bonnes pratiques européen ; le caractère recommandé, et non obligatoire, des durées CNIL de 6, 13 et 25 mois. Les points restés sans confirmation sont dans `OPEN-QUESTIONS.md`.

Ce tableau fixe ce que la v1 doit encoder. Niveau de preuve : **P** = vérifié sur source officielle le 14/11/2026 ; **S** = rapporté par une source secondaire ; **C** = connaissance du texte, non relue ce jour. Tout ce qui n'est pas **P** doit être vérifié sur la source officielle avant d'entrer dans le skill.

### Accessibilité

| Fait | Preuve |
|------|--------|
| Le RGAA 5 n'est pas publié. Le site officiel annonce une publication « prévue fin 2026 ». Le RGAA 4.1.2 reste en vigueur : 106 critères, 13 thématiques | P |
| Le RGAA 5 intégrera WCAG 2.2, des critères pour les applications mobiles et les documents bureautiques, des critères reformulés qui précisent ceux du 4.1.2 sans les contredire. Consigne de la DINUM : ne pas suspendre les travaux en 4.1.2 | P |
| Bêta publique attendue fin 2026 (intitulés seuls), version finale en 2027, entrée en vigueur par arrêté à date inconnue. Notion de « point bloquant » envisagée ; déclaration via un téléservice | S |
| Une branche de travail `RGAA5` existe dans `DISIC/accessibilite.numerique.gouv.fr` : 17 thématiques (les 13 actuelles, plus Documentation et fonctionnalités d'accessibilité, Outils d'édition, Captcha, Communication en temps réel). Brouillon instable | P |
| Le JSON officiel du RGAA 4.1.2 (`criteres.json`, `glossaire.json`, `methodologies.json`) est publié par la DINUM sous Licence Ouverte 2.0 | P |
| EN 301 549 V4.1.1 publiée par l'ETSI le 02/09/2026 ; elle adopte WCAG 2.2. Elle n'est pas encore la référence légale : la présomption de conformité reste attachée à la V3.2.1 (WCAG 2.1 AA) | P |
| Citation de la V4.1.1 au Journal officiel de l'UE attendue entre mi-décembre 2026 et fin janvier 2027 | S |
| WCAG 2.2 : recommandation W3C, réédition du 12/12/2024. WCAG 3.0 reste un brouillon, à ne pas utiliser comme référence | P |
| EAA (directive 2019/882) applicable depuis le 28/06/2025. Services visés : commerce électronique, banque de détail, transport de voyageurs, livres numériques, communications électroniques, accès aux médias audiovisuels | C |
| Exemption des microentreprises pour les services : moins de 10 personnes et chiffre d'affaires ou total de bilan ne dépassant pas 2 M€. La transition jusqu'en 2030 n'est pas un report général pour un site nouveau ou refondu | C |
| Charge disproportionnée : évaluation documentée, conservée 5 ans. Information sur l'accessibilité du service à publier (annexe V) | C |
| France : loi n° 2023-171, décret n° 2023-931, arrêté du 09/10/2023. Contrôles DGCCRF en cours ; premières décisions de justice en 2026 | S |

### AI Act (règlement 2024/1689)

| Fait | Preuve |
|------|--------|
| L'article 50 (transparence) s'applique depuis le 02/08/2026 : information « vous interagissez avec une IA », marquage des contenus générés, information sur la reconnaissance d'émotions, étiquetage des hypertrucages et des textes d'intérêt public générés par IA | P |
| Seul sursis : les systèmes génératifs mis sur le marché avant le 02/08/2026 ont jusqu'au 02/12/2026 pour le marquage de l'article 50(2) | P |
| Haut risque reporté : annexe III au 02/12/2027, annexe I au 02/08/2028. Nouvelles interdictions (contenus intimes non consentis, pédopornographie) au 02/12/2026 | P |
| L'article 4 (maîtrise de l'IA) est assoupli, pas supprimé | P |
| Ces changements viennent du règlement (UE) 2026/1744, en vigueur depuis le 27/07/2026 | S (contenu confirmé sur le texte consolidé de la Commission) |
| Code de bonnes pratiques sur le marquage des contenus générés par IA : version finale du 10/06/2026, volontaire. Lignes directrices de la Commission sur l'article 50 publiées le 20/07/2026, non contraignantes | P |
| Détails pratiques (deux techniques de marquage, icônes UE, mention dans les CGU insuffisante, code source hors champ du marquage) | S — à relire dans les lignes directrices et le Code |

### Protection des données

| Fait | Preuve |
|------|--------|
| L'« omnibus numérique » sur le RGPD et les cookies est toujours une proposition. Les règles actuelles s'appliquent : article 5(3) ePrivacy, article 82 de la loi Informatique et Libertés, RGPD. Ne coder aucune exemption fondée sur un signal du navigateur | S |
| CNIL : « Tout refuser » au même niveau et au même format que « Tout accepter » ; preuve du consentement ; choix conservé 6 mois (bonne pratique) ; exemption de la mesure d'audience sous conditions strictes | P |
| CNIL, nouveautés 2026 : consentement multi-terminaux (16/01/2026), pixels de suivi dans les courriels (14/04/2026), rejeu de session (JO du 05/11/2026) | P |
| Durées de 13 mois (traceur) et 25 mois (données de mesure d'audience) | C |

### Sécurité

| Fait | Preuve |
|------|--------|
| Guide de référence pour un site : ANSSI-PA-009 v2.0 (28/04/2021), 63 recommandations côté navigateur | P |
| Mécanismes cryptographiques : ANSSI-PG-083 v3.00 (20/03/2026). TLS : recommandations v1.2 (2020) et fiche post-quantique ANSSI-FT-115 (02/02/2026) | P pour les références ; dates TLS en C |
| Code généré par IA : recommandations ANSSI-PA-102 (29/04/2024) et publication ANSSI/BSI « AI Coding Assistants » (04/10/2024) | P |
| Le Cyber Resilience Act ne vise pas un site web en tant que tel. NIS2 : transposition française à vérifier | S |

### Consommation et information

| Fait | Preuve |
|------|--------|
| Fonction de rétractation en ligne obligatoire depuis le 19/06/2026 (directive 2023/2673 ; en France, ordonnance n° 2026-2, article L. 222-7 du code de la consommation) | P pour le texte français ; détails (libellé, confirmation, accusé de réception) en S |
| Annonce de réduction : prix le plus bas des 30 derniers jours (directive 2019/2161 ; article L. 112-1-1) | C |
| DSA applicable depuis le 17/02/2024 : point de contact, clarté des CGU, signalement de contenus, interdiction des interfaces trompeuses sur les plateformes | C |
| Mentions légales : LCEN, article 1-1 (numérotation à confirmer) | C |
| Digital Fairness Act proposé le 11/11/2026 : à surveiller, non applicable | S |
| RGESN (écoconception) : version 2024, 78 critères, non contraignant | S |

**Conséquence pour le RGAA 5.** La demande initiale parle du « nouveau RGAA 5 qui arrive ». Il n'est pas publié et son contenu final est inconnu. La v1 cible donc le RGAA 4.1.2 complété par les six critères ajoutés par WCAG 2.2 (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8), ce qui correspond à ce que le RGAA 5 a annoncé intégrer. L'architecture rend le référentiel remplaçable (exigence F-A8).

## 7. Principes de conception

1. **Qualifier avant d'appliquer.** Aucune règle n'est imposée sans avoir établi qu'elle concerne le projet. Une microentreprise n'a pas les mêmes obligations qu'une banque.
2. **Socle universel, obligations conditionnelles.** Certaines exigences valent pour tout site (accessibilité de base, HTTPS, pas de traceur sans consentement) parce qu'elles coûtent peu à la création et beaucoup après. Les autres dépendent de la qualification. Le rapport distingue toujours « obligatoire pour vous », « recommandé » et « sans objet ».
3. **Jamais de mémoire.** Dates, seuils, versions, valeurs cryptographiques et textes de critères viennent des fichiers du skill, pas des souvenirs du modèle.
4. **Une règle, une source.** Chaque règle porte un identifiant qui renvoie à un texte officiel daté. Une bonne pratique sans source officielle est marquée comme telle.
5. **Quatre verdicts, pas deux.** Conforme, non conforme, non applicable, non testé. Le doute donne « non testé », jamais « conforme ».
6. **Raisonner par impact.** Un défaut est signalé avec la personne qu'il bloque et l'outil concerné, pas en récitant une règle.
7. **Lecture progressive.** Le fichier principal reste court ; l'agent ne charge que les références utiles à la tâche.
8. **Déterministe quand c'est possible.** Ce qu'un script peut vérifier n'est pas laissé à l'appréciation du modèle.
9. **Indépendant de la pile technique.** Règles exprimées en HTML, CSS et HTTP ; adaptations par framework dans des fichiers séparés.
10. **Europe d'abord, pays ensuite.** Le socle est le droit de l'UE ; chacun des 27 États membres est un module (section 18). La France est le premier à être complet.
11. **Aide, pas avis juridique.** Chaque livrable le rappelle et indique quand consulter un professionnel.

## 8. Fonctionnement

### 8.1 Modes

| Mode | Déclencheur | Résultat |
|------|-------------|----------|
| **Qualifier** | Début de projet, ou première utilisation dans un dépôt | Fichier `compliance/profile.json` et matrice d'applicabilité |
| **Construire** | L'agent écrit ou modifie de l'interface, un formulaire, un traceur, une fonction d'IA, une configuration serveur | Code conforme dès l'écriture, sans rapport |
| **Vérifier** | Avant un commit, une livraison, ou sur demande d'audit | Rapport Markdown et JSON dans `compliance/reports/` |
| **Documenter** | Sur demande, ou quand la qualification montre qu'une page obligatoire manque | Pages légales pré-remplies à partir du profil |
| **Veiller** | Sur demande, ou quand un fait réglementaire a plus de 90 jours | Liste des faits à re-vérifier et de leurs sources |

### 8.2 Qualification

L'agent déduit ce qu'il peut du dépôt (pile technique, présence d'un paiement, de traceurs, d'appels à un modèle d'IA, langues), puis pose en une seule fois les questions restantes, au plus dix :

1. Qui exploite le site : organisme public, entreprise, association, particulier ?
2. Effectif et chiffre d'affaires ou total de bilan (pour l'exemption des microentreprises) ?
3. Pays d'établissement et pays visés ?
4. Le site vend-il à des consommateurs, et quoi ?
5. Relève-t-il d'un secteur visé par l'EAA (banque, transport, livres numériques, télécommunications, médias audiovisuels) ?
6. Quelles données personnelles sont collectées, y compris par des outils tiers ?
7. Le public comprend-il des mineurs ?
8. Le site contient-il une fonction d'IA (assistant conversationnel, génération de contenu, recommandation, analyse d'émotions ou biométrique) ? Des contenus du site sont-ils générés par IA ?
9. Le site héberge-t-il des contenus déposés par des utilisateurs ?
10. Existe-t-il déjà un référent (DPO, juriste, référent accessibilité) ?

Sans réponse, ou en exécution non interactive, l'agent retient l'hypothèse la plus protectrice et l'écrit dans le profil comme hypothèse.

### 8.3 Matrice d'applicabilité

Pour chaque obligation : s'applique ou non, pourquoi (réponse du profil), texte source, échéance, niveau (obligatoire, recommandé, sans objet). Elle sert de table des matières au reste du travail et figure en tête de chaque rapport.

### 8.4 Verdicts et priorités

Verdicts : **C** conforme, **NC** non conforme, **NA** non applicable, **NT** non testé. Chaque critère a un mode d'évaluation : code, mixte, conditions réelles, jugement humain (repris du classement d'Etalab).

Priorités : **bloquant** (empêche l'accès ou expose à une sanction directe), **majeur** (gêne forte ou risque sérieux, contournable), **mineur** (dégradation sans blocage).

Pour la sécurité, on ajoute la distinction faille exploitable / bonne pratique manquante.

## 9. Exigences fonctionnelles

Priorités : **P0** indispensable à la v1, **P1** attendu en v1.x, **P2** ultérieur.

### Qualification

| ID | Exigence | Prio |
|----|----------|------|
| F-Q1 | Détecter la pile technique, les traceurs, les fournisseurs de paiement et les appels à des modèles d'IA à partir du dépôt | P0 |
| F-Q2 | Poser les questions manquantes en un seul message ; écrire `compliance/profile.json` | P0 |
| F-Q3 | Produire la matrice d'applicabilité avec source et échéance de chaque obligation | P0 |
| F-Q4 | Signaler les cas qui dépassent le skill (haut risque IA, données de santé, mineurs, secteur régulé) et orienter vers un professionnel | P0 |

### Accessibilité

| ID | Exigence | Prio |
|----|----------|------|
| F-A1 | Règles de génération : HTML sémantique, nom accessible, clavier, focus visible, contrastes, zoom et redistribution, cibles de 24 px, formulaires, médias, mouvements, langue | P0 |
| F-A2 | Bibliothèque de composants de référence en HTML, CSS et JS sans dépendance : modale, onglets, accordéon, menu, liste déroulante avec saisie, infobulle, carrousel, tableau triable, téléversement, formulaire à étapes, messages d'état, lien d'évitement | P0 |
| F-A3 | Anti-patterns avec motif de détection, gravité et correction (base : awesome-copilot et Isalafont) | P0 |
| F-A4 | Les 106 critères du RGAA 4.1.2, texte officiel généré depuis le JSON de la DINUM, mode d'évaluation et correction pour chacun | P0 |
| F-A5 | Table de correspondance critère RGAA, critère WCAG 2.2, clause EN 301 549 | P0 |
| F-A6 | Les six critères ajoutés par WCAG 2.2, traités comme obligatoires dans le socle | P0 |
| F-A7 | Vérification automatique : axe-core en navigateur piloté, contrôle de contraste calculé, parcours clavier scripté ; résultats rattachés aux critères | P0 |
| F-A8 | Référentiel remplaçable : données dans `references/accessibility/rgaa/<version>/`, version active dans un fichier unique, emplacement prêt pour le RGAA 5 avec sa table de passage 4.1.2 vers 5 | P0 |
| F-A9 | Générer la déclaration d'accessibilité (secteur public français) et l'information d'accessibilité de l'annexe V de l'EAA (secteur privé) | P0 |
| F-A10 | Solutions de repli et charge disproportionnée : gabarit d'évaluation documentée, alternative, voie de recours | P1 |
| F-A11 | Exigences d'EN 301 549 hors WCAG applicables au web (préférences utilisateur, documentation, assistance) | P1 |
| F-A12 | Adaptations par pile : React/Next, Vue/Nuxt, Svelte, Astro, Rails, WordPress ; DSFR quand il est détecté | P1 |
| F-A13 | Documents téléchargeables (PDF) et applications mobiles | P2 |

### Protection des données

| ID | Exigence | Prio |
|----|----------|------|
| F-D1 | Inventaire des traceurs et des scripts tiers ; aucun dépôt ni lecture sur le terminal avant consentement, sauf exemption justifiée | P0 |
| F-D2 | Bandeau de consentement de référence, accessible : accepter et refuser au même niveau, choix par finalité, retrait aussi simple que l'accord, preuve conservée, nouveau recueil après 6 mois | P0 |
| F-D3 | Chargement conditionnel des scripts par finalité ; contrôle automatique des requêtes et des cookies avant consentement | P0 |
| F-D4 | Formulaires : minimisation, information au moment de la collecte, base légale, pas de case pré-cochée | P0 |
| F-D5 | Générer la politique de confidentialité et la politique cookies à partir du profil et de l'inventaire | P0 |
| F-D6 | Droits des personnes : parcours d'accès, de rectification, d'effacement, de portabilité, d'opposition | P1 |
| F-D7 | Sous-traitants et transferts hors UE : liste, signalement des services à risque, alternatives | P1 |
| F-D8 | Cas CNIL récents : multi-terminaux, pixels dans les courriels, rejeu de session | P1 |
| F-D9 | Mineurs, données sensibles, déclencheurs d'analyse d'impact : détection et renvoi | P1 |
| F-D10 | Registre des traitements : gabarit pré-rempli | P2 |

### AI Act

| ID | Exigence | Prio |
|----|----------|------|
| F-I1 | Détecter les fonctions d'IA du site et déterminer le rôle de l'exploitant (fournisseur ou déployeur) | P0 |
| F-I2 | Contrôle des pratiques interdites (article 5) : arrêt et alerte | P0 |
| F-I3 | Article 50(1) : composant d'information « vous échangez avec une IA », visible dès la première interaction, accessible, répété quand il le faut ; jamais limité aux CGU | P0 |
| F-I4 | Article 50(2) et 50(4) : arbre de décision pour les contenus générés par IA publiés sur le site (texte, image, audio, vidéo), étiquette visible, conservation des métadonnées de provenance, exceptions | P0 |
| F-I5 | Article 50(3) : information en cas de reconnaissance d'émotions ou de catégorisation biométrique ; rappel des interdictions au travail et à l'école | P0 |
| F-I6 | Repérage du haut risque (annexe III) et renvoi vers les obligations, avec le calendrier en vigueur | P0 |
| F-I7 | Calendrier d'application tenu dans un fichier unique daté | P0 |
| F-I8 | Article 4 : rappel de l'obligation de maîtrise de l'IA pour l'exploitant | P1 |
| F-I9 | Gabarit de page « Usage de l'IA sur ce site » | P1 |
| F-I10 | Lien avec le RGPD pour les décisions automatisées (article 22) | P1 |

### Sécurité

| ID | Exigence | Prio |
|----|----------|------|
| F-S1 | En-têtes HTTP de référence et configuration par hébergeur courant : politique de sécurité de contenu, HSTS, protection contre l'encadrement, politique de référent, politique de permissions | P0 |
| F-S2 | Cookies de session, protection contre la falsification de requête, validation des entrées, échappement des sorties, intégrité des ressources tierces | P0 |
| F-S3 | Secrets : aucun secret dans le code ; contrôle automatique | P0 |
| F-S4 | Authentification et mots de passe selon l'ANSSI ; valeurs chiffrées lues dans un fichier unique | P0 |
| F-S5 | Dépendances : audit, versions figées, licences | P0 |
| F-S6 | Traçabilité : identifiant de recommandation ANSSI ou OWASP sur chaque règle | P0 |
| F-S7 | Précautions propres au code écrit par IA (relecture, modules critiques) | P1 |
| F-S8 | Journalisation, sauvegarde, gestion des incidents et notification de violation sous 72 h | P1 |
| F-S9 | Modules conditionnels : CMS, conteneurs, chaîne d'intégration | P1 |

### Consommation et information

| ID | Exigence | Prio |
|----|----------|------|
| F-C1 | Mentions légales : gabarit selon le statut de l'exploitant et le pays | P0 |
| F-C2 | Vente en ligne : information précontractuelle, bouton de commande explicite, récapitulatif, confirmation | P0 |
| F-C3 | Fonction de rétractation en ligne (obligatoire depuis le 19/06/2026) : composant de référence accessible | P0 |
| F-C4 | Prix : toutes taxes comprises, prix de référence sur 30 jours pour les réductions | P1 |
| F-C5 | Interfaces trompeuses : liste de motifs interdits, appliquée au bandeau, au tunnel d'achat, à la résiliation | P1 |
| F-C6 | Contenus d'utilisateurs : point de contact, signalement, motivation des décisions (DSA) | P1 |
| F-C7 | Gabarit de CGV | P2 |
| F-C8 | Écoconception (RGESN) : module facultatif, présenté comme recommandation | P2 |

### Rapports et documents

| ID | Exigence | Prio |
|----|----------|------|
| F-R1 | Rapport unique couvrant les cinq domaines : matrice, synthèse par domaine, non-conformités détaillées, points non testés, hypothèses | P0 |
| F-R2 | Chaque non-conformité : élément et emplacement, règle et source, impact, correction dans la pile du projet, priorité | P0 |
| F-R3 | Sortie JSON conforme à un schéma publié, pour l'intégration continue | P0 |
| F-R4 | Avertissement en tête de rapport : produit par une IA, ne vaut ni audit ni avis juridique | P0 |
| F-R5 | Liste « à vérifier par une personne », avec la marche à suivre pour chaque point | P0 |
| F-R6 | Corrections groupées quand plusieurs constats portent sur le même code | P1 |
| F-R7 | Suivi entre deux rapports : corrigé, nouveau, inchangé | P2 |

### Fraîcheur des données

| ID | Exigence | Prio |
|----|----------|------|
| F-V1 | Registre `sources.json` : identifiant, titre, URL, version, date de consultation, licence, niveau de preuve | P0 |
| F-V2 | Fichier `regulatory-status.md` daté, seul endroit où figurent dates d'application et versions en vigueur | P0 |
| F-V3 | Script qui signale les sources consultées il y a plus de 90 jours et les liens morts | P0 |
| F-V4 | Régénération des textes officiels du RGAA depuis le JSON de la DINUM, avec contrôle d'écart | P0 |
| F-V5 | Tâche planifiée dans le dépôt qui ouvre un ticket quand une source change | P1 |
| F-V6 | Surveillance explicite : publication du RGAA 5, citation d'EN 301 549 V4.1.1 au Journal officiel de l'UE, omnibus RGPD, Digital Fairness Act | P0 |

### Compatibilité et distribution

| ID | Exigence | Prio |
|----|----------|------|
| F-X1 | `SKILL.md` conforme à la spécification Agent Skills (`name`, `description`, `license`) | P0 |
| F-X2 | Installation par `npx skills add`, par clone, et comme plugin Claude Code | P0 |
| F-X3 | `AGENTS.md` et adaptateurs pour Copilot et Cursor qui pointent vers le skill sans le dupliquer | P1 |
| F-X4 | Documentation et rapports en français et en anglais ; règles en une seule langue de référence pour éviter les divergences | P1 |

## 10. Exigences non fonctionnelles

| ID | Exigence |
|----|----------|
| N1 | `SKILL.md` de 300 lignes au plus ; aucun fichier de référence au-delà de 500 lignes ; l'agent ne charge jamais plus de trois références pour une tâche courante |
| N2 | Scripts sans dépendance lourde : Python 3.8+ ou Node 20+, bibliothèque standard autant que possible ; axe-core et Playwright comme seules dépendances d'exécution, facultatives |
| N3 | Les scripts fonctionnent sous Linux, macOS et Windows |
| N4 | Aucune télémétrie ; aucun appel réseau sans demande explicite, sauf la mise à jour des sources |
| N5 | Aucune donnée du projet de l'utilisateur ne quitte sa machine |
| N6 | Chaque script a ses tests ; l'intégration continue valide la structure, les liens internes, la traçabilité et les exemples |
| N7 | Les exemples de code du skill respectent eux-mêmes les règles du skill ; un contrôle automatique le vérifie |
| N8 | Fins de ligne LF, noms de fichiers en minuscules avec tirets, aucun fichier de plus de 5 Mo |

## 11. Architecture

```
eu-web-compliance/
├── SKILL.md                      point d'entrée : modes, aiguillage, règles absolues
├── README.md / README.fr.md
├── LICENSE                       MIT
├── NOTICE.md                     attributions et licences des contenus repris
├── CHANGELOG.md
├── AGENTS.md
├── .claude-plugin/plugin.json
├── adapters/                     Copilot, Cursor
├── references/
│   ├── regulatory-status.md      dates et versions en vigueur (fichier unique)
│   ├── sources.json              registre des sources (JSON : lisible sans dépendance)
│   ├── scoping/                  questionnaire, matrice, cas hors périmètre
│   ├── accessibility/
│   │   ├── rules.md              règles de génération
│   │   ├── anti-patterns.md
│   │   ├── components/           un fichier par composant
│   │   ├── wcag-2.2-additions.md
│   │   ├── en-301-549.md
│   │   ├── mapping.json          RGAA / WCAG / EN 301 549
│   │   ├── fallbacks.md
│   │   └── rgaa/
│   │       ├── ACTIVE            version en vigueur
│   │       ├── 4.1.2/            sources JSON, critères, classement, corrections
│   │       └── 5/                vide jusqu'à publication ; README de migration
│   ├── privacy/                  traceurs, consentement, formulaires, droits, transferts, cas CNIL
│   ├── ai-act/                   rôles, interdictions, article 50, haut risque, calendrier
│   ├── security/                 checklist, valeurs ANSSI, en-têtes, modules
│   ├── consumer/                 mentions légales, vente, rétractation, prix, interfaces trompeuses, DSA
│   ├── stacks/                   adaptations par framework
│   └── countries/                un fichier par État membre (at.md … se.md), plus eu.md
├── templates/                    déclaration d'accessibilité, politiques, mentions légales,
│                                 page IA, bandeau, bouton de rétractation, rapport, profil
├── scripts/                      qualification, vérifications, rapport, sources, validation
├── schemas/                      profil, constats
├── examples/                     sites de test avec défauts connus et sortie attendue
└── tests/
```

Le fichier `SKILL.md` contient uniquement : quand se déclencher, les cinq modes, la table « tâche vers fichiers à lire », la douzaine de règles absolues, les verdicts, et l'avertissement. Tout le reste est en référence.

## 12. Licences et attribution

- Code, scripts et textes originaux : MIT.
- Contenus repris d'`Isalafont/claude-skill-rgaa-dev` et textes officiels du RGAA (DINUM) : Licence Ouverte 2.0. Réutilisation libre avec mention de la source et de la date de mise à jour. `NOTICE.md` liste chaque fichier concerné.
- Contenus repris d'`etalab-ia/skills`, `morellid/ai-act-skill` et `github/awesome-copilot` : MIT ; conserver les mentions de droit d'auteur.
- Textes de l'UE : réutilisation autorisée avec mention de la source ; citer par extraits et lier vers EUR-Lex.
- WCAG : la licence du W3C encadre la reproduction. Citer les numéros et intitulés des critères et lier vers la recommandation, sans recopier les textes explicatifs. À confirmer en lisant la licence avant publication.
- Guides ANSSI : vérifier la licence de chaque guide ; citer les recommandations par identifiant et reformuler.
- Bibliothèques tierces (axe-core : MPL 2.0) : appelées, non redistribuées.

Point à faire valider avant publication : la compatibilité exacte entre contenus sous Licence Ouverte 2.0 et dépôt MIT, par un fichier `NOTICE.md` clair plutôt que par un changement de licence des contenus repris.

## 13. Qualité et tests

1. **Sites de test.** Au moins six dans `examples/` : vitrine, boutique en ligne, site public français, site avec assistant conversationnel, blog avec contenus générés par IA, application avec compte utilisateur. Chacun existe en version fautive (défauts connus et listés) et en version corrigée.
2. **Évaluation de la détection.** Sur les versions fautives : au moins 90 % des défauts de type « code » retrouvés, aucun faux « conforme ».
3. **Évaluation de la génération.** On demande à un agent de construire chaque site à partir d'un cahier des charges, avec et sans le skill. Avec le skill : zéro violation axe-core, zéro traceur avant consentement, tous les en-têtes de sécurité présents, toutes les pages obligatoires présentes.
4. **Contrôles de structure** à chaque modification : métadonnées de `SKILL.md`, liens internes, taille des fichiers, source de chaque règle, validité des JSON et YAML, écart nul entre textes officiels et source.
5. **Relecture** avant la v1 : faite par l'agent, domaine par domaine, avec des skills spécialisés et le serveur MCP juridique du porteur du projet (décision n° 4, section 17). Chaque règle est relue contre sa source ; les réserves figurent dans le README, qui précise qu'aucun professionnel n'a encore relu le skill.

## 14. Indicateurs de succès

| Indicateur | Cible v1 |
|-----------|----------|
| Violations axe-core sur les sites générés avec le skill | 0 |
| Défauts « code » détectés sur les sites fautifs | 90 % ou plus |
| Faux « conforme » | 0 |
| Règles sans source | 0 |
| Critères RGAA 4.1.2 couverts (texte, mode, correction) | 106 sur 106 |
| Sources de plus de 90 jours au moment d'une version | 0 |
| Agents pour lesquels l'installation est testée | 5 |
| Délai entre la publication du RGAA 5 et sa prise en charge | 30 jours |

## 15. Feuille de route

| Étape | Contenu | Critère de sortie |
|-------|---------|-------------------|
| M0 — Fondations | Dépôt, licences, `NOTICE.md`, registre des sources, état réglementaire vérifié sur sources officielles, contrôles de structure | Tous les faits de la section 6 en niveau P ou retirés |
| M1 — Qualification et accessibilité | F-Q, F-A1 à F-A9, deux sites de test | Indicateurs d'accessibilité atteints |
| M2 — Données et sécurité | F-D1 à F-D5, F-S1 à F-S6, deux sites de test | Zéro traceur avant consentement ; en-têtes complets |
| M3 — AI Act et consommation | F-I1 à F-I7, F-C1 à F-C3, deux sites de test | Arbres de décision validés sur les exemples |
| M4 — Rapport unifié et distribution | F-R, F-X, documentation bilingue, relecture outillée, 27 fichiers pays créés (France complète, les autres avec leur état de couverture) | Version 1.0 publiée |
| M5 — RGAA 5 | Jeu de données, table de passage, bascule de la version active | Dans les 30 jours suivant la publication officielle |
| M6 — États membres | Allemagne, Espagne, Italie, Pays-Bas, Belgique, Pologne, puis les vingt autres | Chaque rubrique de chaque pays citée sur source officielle |
| Ensuite | Exigences P1 et P2, mobile et documents | — |

## 16. Risques

| Risque | Parade |
|--------|--------|
| L'utilisateur croit son site « certifié conforme » | Avertissement en tête de chaque rapport ; mot « conforme » réservé aux critères, jamais au site ; liste des points à vérifier par une personne |
| Fait réglementaire périmé ou faux | Fichier unique daté, niveau de preuve, alerte à 90 jours, surveillance des quatre échéances connues |
| Le RGAA 5 final diffère des annonces | Référentiel remplaçable ; aucune donnée du brouillon dans le skill |
| Skill trop lourd pour le contexte de l'agent | Limites de taille (N1), lecture à la demande, table d'aiguillage |
| Obligations imposées à tort à un petit site | Qualification préalable ; trois niveaux dans le rapport |
| Divergence entre droit de l'UE et droits nationaux | Modules par pays ; pays non couverts signalés comme tels |
| Contenu repris sans attribution correcte | `NOTICE.md` tenu fichier par fichier ; contrôle en relecture |
| Erreur d'un domaine qui en casse un autre (bandeau cookies inaccessible, par exemple) | Les composants de référence passent les contrôles des cinq domaines |

## 17. Décisions prises et questions ouvertes

### Décisions du 14 novembre 2026

1. **Nom** : `eu-web-compliance`, pour le skill et le dépôt.
2. **Langue** : règles et fichiers de référence en anglais ; textes officiels cités dans leur langue d'origine ; documentation (README) et rapports en français et en anglais. Le PRD et le prompt restent en français.
3. **Périmètre pays** : le droit de l'UE et les 27 États membres. Voir la section 18.
4. **Relecture avant la v1** : faite par l'agent lui-même, à l'aide de skills spécialisés (accessibilité, sécurité, juridique) et du serveur MCP juridique « Juris Limen » du porteur du projet. Conséquence à afficher dans le README et dans chaque rapport : le skill a été relu par une IA outillée, pas par un professionnel du droit ni par un auditeur d'accessibilité. Une relecture humaine indépendante reste recommandée et sera sollicitée auprès de la communauté après publication.

### Questions encore ouvertes

1. Faut-il inclure l'écoconception (RGESN) alors qu'elle n'est pas obligatoire ? Proposition : module facultatif en P2.
2. Le skill doit-il rester un seul skill, ou un skill principal accompagné de commandes dédiées (`audit`, `qualify`) dans un même plugin ? Proposition : un seul skill, modes internes.
3. Le périmètre s'arrête-t-il aux 27 États membres, ou inclut-il l'Espace économique européen (Norvège, Islande, Liechtenstein), le Royaume-Uni et la Suisse ? Proposition : les 27 d'abord ; les trois pays de l'EEE ensuite ; Royaume-Uni et Suisse signalés comme hors périmètre.
4. Le serveur MCP « Juris Limen » n'était pas connecté lors de l'étape M0 : à connecter avant l'étape M4.

## 18. Couverture des 27 États membres

Le socle du skill est le droit de l'UE, identique partout : RGPD, AI Act, DSA et règlements d'application directe. Les directives (EAA, ePrivacy, droits des consommateurs, commerce électronique) sont transposées par chaque pays, avec des différences qui touchent le code d'un site. Chaque pays est donc un fichier `references/countries/<code>.md` qui répond aux mêmes questions :

| Rubrique | Ce qui varie d'un pays à l'autre |
|----------|----------------------------------|
| Accessibilité | Loi de transposition de l'EAA, autorité de contrôle, sanctions, référentiel national éventuel (RGAA en France, BITV en Allemagne), contenu de la déclaration d'accessibilité |
| Traceurs | Loi transposant l'article 5(3) ePrivacy, autorité compétente, lignes directrices nationales sur le bandeau et sur la mesure d'audience |
| Protection des données | Autorité de contrôle, âge du consentement numérique (entre 13 et 16 ans selon le pays), règles nationales complémentaires |
| Mentions obligatoires | Informations d'identification exigées sur un site (mentions légales, Impressum, etc.) |
| Consommation | Transposition de la fonction de rétractation, médiation, règles de prix |
| Langue | Obligation éventuelle d'employer la langue nationale |
| IA | Autorité nationale désignée au titre de l'AI Act |
| Sécurité | Agence nationale et guides de référence |

Règles de construction :

- Un pays n'est marqué « couvert » que si chaque rubrique cite une source officielle de ce pays, lue dans sa langue. Sinon la rubrique porte la mention « non vérifié », et le rapport le dit à l'utilisateur.
- Quand le profil du projet vise un pays non couvert, le skill applique le socle de l'UE et signale ce qui reste à vérifier localement.
- Ordre de travail : France (v1 complète), puis Allemagne, Espagne, Italie, Pays-Bas, Belgique, Pologne, puis les vingt autres. Les 27 fichiers existent dès la v1, même partiels, pour que l'état de couverture soit visible.
- La couverture de 27 droits nationaux est le chantier le plus lourd du projet et le plus exposé à l'erreur : c'est là que les contributions de juristes locaux seront le plus utiles.

---

*Ce document décrit un outil d'aide à la mise en conformité. Il ne constitue pas un avis juridique.*
