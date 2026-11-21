# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Les versions suivent le versionnage sémantique.

## [1.1.3] - 2026-11-21

L'installation passe par GitHub, et seulement par GitHub : le paquet ne sera pas publié sur npm (décision du propriétaire).

### Corrigé

- `SKILL.md` et un commentaire de `mcp/server.mjs` donnaient la commande `npx eu-web-compliance`, qui suppose un paquet npm. Ce nom étant libre sur npm, un tiers pourrait le prendre et faire exécuter son code. La commande indiquée est partout `npx github:kayzen-lyon/eu-web-compliance`, et la documentation dit de ne jamais lancer la forme courte.
- README : l'adresse `github:` est présentée comme la voie officielle, avec `#v1` pour suivre la dernière version 1.x.
- `docs/ROADMAP.md` : publication npm écartée ; essai de l'Action depuis un dépôt tiers consigné (réussi le 15/11/2026).

## [1.1.2] - 2026-11-15

Les sept constats mineurs que la relecture de la 1.1.0 avait laissés ouverts. Chacun porte un test.

### Corrigé

- Requêtes tierces : une adresse du site vérifié qui redirige vers un hôte tiers était suivie par le navigateur, sans passer par le blocage ; le tiers recevait la requête, qui n'était pas relevée. Les vérificateurs demandent maintenant chaque réponse du site sans suivre de redirection : si la chaîne sort du site, la requête est relevée comme tierce (champ `redirected_from`) et interrompue. Défaut trouvé par un essai sur une prévisualisation protégée, reproduit en local avant correction.
- Une page qui redirige vers un autre site (mur de connexion d'une prévisualisation protégée, site déplacé) n'est plus analysée à la place du site demandé : les quatre vérificateurs rendent « page non analysée », avec le nom de l'autre site. Avant, la page de connexion de l'hébergeur était auditée et ses défauts attribués au site.
- Requêtes tierces : le « site » d'un nom d'hôte est désormais son domaine enregistrable, d'après la liste des suffixes publics (bibliothèque `tldts`, licence MIT, inscrite dans `NOTICE.md`). Deux sites voisins sur `vercel.app`, `github.io` ou `co.uk` ne sont plus vus comme un seul : leurs requêtes sont bloquées et signalées comme tierces.
- Rapport Markdown : les crochets et les chevrons du texte cité depuis un site vérifié sont échappés ; un site ne peut plus faire apparaître un lien, une image ou une balise dans le rapport ni dans le résumé de l'Action.
- Sous-processus : la sortie d'un vérificateur est plafonnée à 64 Mio ; au-delà, il est arrêté. Le serveur MCP rend au plus 50 corrections groupées et 50 actions, la liste complète restant dans le fichier du rapport.
- `check-all` : le message d'un profil illisible ne cite plus les premiers caractères du fichier.
- Serveur statique des vérificateurs : les motifs d'un fichier `_headers` sont comparés sans expression régulière, en temps proportionnel à leur longueur ; un motif très répété ne peut plus bloquer une vérification.
- Veille des sources : une page de plus de 25 Mio n'est pas lue ; l'issue de veille ne reçoit plus le même commentaire chaque semaine tant que la liste des pages à relire n'a pas changé.

### Sécurité

- Les actions GitHub utilisées par `action.yml` et par les workflows sont référencées par empreinte de commit ; `.github/dependabot.yml` propose leurs mises à jour une fois par mois, dans une pull request à relire.

## [1.1.1] - 2026-11-15

Corrections issues de deux relectures indépendantes du code de la 1.1.0 (qualité et sécurité) et d'un essai de l'Action appelée par son étiquette `v1`, sur un dossier de pages et sur une adresse en ligne. Chaque constat corrigé a été vérifié dans le code avant correction et porte un test.

### Corrigé

- Veille des sources : une source jugée instable une fois n'était plus jamais comparée ; `--update` lui redonne une empreinte dès que deux lectures de suite concordent.
- Veille des sources : une page suivie qui répond 404 ou 410 est signalée comme disparue (état `gone`) et fait ouvrir l'issue ; un refus (403, 429) ou une panne reste « injoignable », sans alerte.
- Veille des sources : `--only` suivi d'un identifiant absent du registre rend le code 2 au lieu d'être ignoré.
- Serveur MCP : `audit_site` résolvait deux fois un chemin relatif quand `project` était donné ; les chemins sont rendus absolus avant le lancement de `check-all`.
- Vérificateur de contenu : la recherche de la page des mentions légales suivait les redirections sans passer par le blocage des requêtes tierces ; une redirection n'est plus suivie que si elle reste sur le site vérifié.
- Recherche de règles (`rule`, `get_rule`) : un fichier de référence aux fins de ligne Windows ne rendait aucune règle.
- GitHub Action : `fail-on-violation: False` (avec une majuscule) est lu comme `false`.
- `init` : `0x10` ou `1e3` ne sont plus acceptés comme nombres.

### Sécurité

- Serveur MCP, nouveau fichier `mcp/guard.mjs` : `audit_site` refuse une cible qui n'est pas en `http` ou `https` et toute adresse de lien local, y compris derrière un nom de domaine ; avec la variable `EU_WEB_COMPLIANCE_MCP_ROOT`, les chemins reçus par `audit_site` et `qualify_project` sont bornés à ce dossier ; `timeout_minutes` est plafonné à 30.
- Une cible d'audit qui commence par un tiret est refusée : elle aurait été lue comme une option de `check-all`.

### Non corrigé, inscrit dans `docs/ROADMAP.md`

- Sites voisins d'un même suffixe public (`*.vercel.app`, `*.github.io`) vus comme un seul site, liens Markdown possibles dans le texte cité d'un site vérifié, sorties des sous-processus sans plafond de taille, actions GitHub référencées par étiquette et non par empreinte, commentaires répétés sur l'issue de veille.

## [1.1.0] - 2026-11-15

Portes d'entrée vers les mêmes vérificateurs et les mêmes règles que le skill. Audit de départ et suites dans `docs/ROADMAP.md`. Version publiée sur GitHub avec les étiquettes `v1.1.0` et `v1` ; le paquet n'est pas encore publié sur npm.

### Ajouté

- Outil en ligne de commande `bin/eu-web-compliance.mjs` (champ `bin` de `package.json`) : `audit` (appelle `check-all.mjs`), `init` (questions de qualification dans le terminal, en français ou en anglais, pilotées par le schéma du profil), `qualify`, `template`, `rule` (recherche des règles par étiquette, avec le texte officiel d'un critère RGAA) et `mcp`.
- GitHub Action `action.yml` : paramètres `target`, `only`, `lang`, `fail-on-violation` ; rapport dans le résumé de l'exécution et rapports Markdown et JSON joints ; essayée sur un site d'exemple par un job de `validate.yml`.
- Serveur MCP `mcp/server.mjs` (SDK officiel, stdio) : outils `qualify_project`, `audit_site`, `get_template`, `get_rule`.
- Fiches CMS `references/cms/wordpress.md`, `prestashop.md` et `shopify.md` : où appliquer les règles existantes dans chaque CMS, sans règle nouvelle ; 39 pages officielles des éditeurs inscrites dans `references/sources.json` ; ligne de renvoi dans `SKILL.md`.
- Veille réglementaire : `scripts/watch-sources.mjs`, empreintes dans `references/sources-fingerprints.json`, workflow hebdomadaire `watch-sources.yml` qui ouvre une issue quand une page officielle a changé.
- Module commun `scripts/lib/skill-api.mjs`, seul point de passage des portes d'entrée vers `check-all.mjs`, `applicability.py`, `templates/` et `references/`.
- Tests `tests/entry-points.test.mjs` (30 tests).

### Modifié

- `package.json` : `private` retiré, `playwright` et `axe-core` passés en dépendances d'exécution, dépendances `@modelcontextprotocol/sdk` et `zod` ajoutées, liste `files` du paquet.

## [1.0.0] - 2026-11-14

Première version publiée : qualification, accessibilité, protection des données, sécurité, AI Act, droit de la consommation et documents juridiques, avec quatre vérificateurs mesurés sur six sites de test. Relue par des agents IA (code, droit, accessibilité, originalité) ; pas encore relue par un professionnel.

### Ajouté

- Étape M3 (vérification) : vérificateur `scripts/check-content.mjs` (transparence IA, bouton de commande, fonction de rétractation, réductions de prix, cases précochées, comptes à rebours, mentions légales) et deux sites de test (boutique avec assistant IA, site d'actualité utilisant l'IA) ; messages du bandeau de consentement traduisibles.
- Étape M4 (assemblage) : `SKILL.md`, `AGENTS.md`, adaptateurs Copilot et Cursor, paquet Claude Code (`.claude-plugin/`) ; orchestrateur `scripts/check-all.mjs` et rapport unifié en anglais ou en français, avec schémas JSON publiés ; crédit d'auteur Kayzen et Nexus dans l'outil et ses rapports, ligne de crédit proposée au propriétaire du site (`templates/credit/`) ; cahiers des charges de l'évaluation par un agent neuf (`docs/evaluation/`).
- Étape M0 (fondations) : arborescence du dépôt, licence MIT, `NOTICE.md`, registre des sources (`references/sources.json`), état réglementaire daté (`references/regulatory-status.md`), script de contrôle de structure (`scripts/validate.py`) avec ses tests, intégration continue.
- `docs/PRD.md` et `docs/PROMPT.md` : exigences produit et prompt de construction.
- Étape M1 (qualification et accessibilité) :
  - qualification : questionnaire, schéma du profil de projet, 56 obligations dans une table de décision, script `scripts/applicability.py` qui produit la matrice d'applicabilité, cas renvoyés à un professionnel ;
  - RGAA 4.1.2 : fichiers officiels de la DINUM inchangés, 106 critères générés en texte officiel par `scripts/rgaa_official.py`, mode d'évaluation de chaque critère, procédure de passage au RGAA 5 ;
  - correspondance RGAA, WCAG 2.2 et EN 301 549 V4.1.1 (`mapping.json`) et exigences d'EN 301 549 au-delà de WCAG ;
  - règles de génération accessibles, catalogue de 87 anti-patterns avec motifs de détection (généré par `scripts/anti_patterns/`), 13 composants de référence, solutions de repli, impacts, tests à faire à la main ;
  - modèles de déclaration d'accessibilité (France) et d'information d'accessibilité (EAA) ;
  - vérificateur `scripts/check-a11y.mjs` (axe-core, parcours clavier, redistribution à 320 px, contrôles de structure, catalogue d'anti-patterns) ;
  - deux sites de test, chacun en version fautive (78 défauts plantés au total) et corrigée, et `scripts/check-examples.mjs`, qui exige zéro non-conformité sur les versions corrigées et au moins 90 % des défauts « code » retrouvés sur les versions fautives.
- Étape M2 (protection des données et sécurité) :
  - données personnelles et traceurs : 216 règles (`references/privacy/`) distinguant l'exigence légale, la recommandation de la CNIL et la bonne pratique ; bandeau de consentement de référence sans dépendance (`templates/consent/`) ; modèles de politique de confidentialité et de politique cookies ; modèle de déclaration des traceurs ;
  - sécurité : 256 règles (`references/security/`) appuyées sur les guides de l'ANSSI, complétées par l'OWASP ; socle d'en-têtes lisible par machine ; configurations pour nginx, Apache, Caddy, Netlify, Cloudflare Pages, Vercel, Express et Next.js ; valeurs chiffrées de l'ANSSI ; modules authentification, téléversement, CMS et code généré par IA ;
  - vérificateurs `scripts/check-privacy.mjs` (traceurs avant consentement, comportement du bandeau) et `scripts/check-security.mjs` (en-têtes, cookies, hygiène côté navigateur), avec leurs tests ;
  - deux sites de test (boutique en ligne, application avec compte), 42 défauts plantés ; `check-examples.mjs` mesure désormais les trois vérificateurs ;
  - état réglementaire complété : délais de réponse aux demandes de droits, registre des traitements, analyse d'impact, délégué à la protection des données, pixels de suivi, fiche CMS de l'ANSSI.

### Corrigé

- Relecture juridique : ligne de crédit neutre qui annonce chaque lien et ne laisse jamais entendre une conformité ; libellés français de la fonction de rétractation lus dans l'article D. 221-5 du code de la consommation ; socle WCAG 2.2 AA et socle d'en-têtes de sécurité reclassés en recommandations ; articles européens non relus marqués `(to confirm)` ; adresse du dépôt public renseignée.
- Attributions complétées : version et date du skill d'Isabelle Lafont (1.2.2 du 17/06/2026) dans `NOTICE.md` et dans chaque fichier concerné, mention du W3C dans `mapping.json`.
- README : section « Ce que ce skill apporte » et commandes de vérification dans le navigateur.
- Qualification : les faits dits dans la demande ou le cahier des charges sont `stated`, leurs conséquences évidentes `inferred` (une mairie ne vend pas ; un cahier des charges qui liste toutes les fonctions sans IA exclut l'IA) ; seule une inconnue qui compte reçoit l'hypothèse protectrice `assumed`, et un renvoi à un professionnel repose sur des faits, ou sur une hypothèse seulement quand l'enjeu le justifie ; `applicability.py` ne signale plus le « secteur réglementé » sur une seule réponse supposée (`questionnaire.md`, `out-of-scope.md`, `SKILL.md`, `obligations.json`, schéma du profil).
- Sécurité : l'absence de `includeSubDomains` dans HSTS devient un point à revoir (NT), à ajouter seulement quand tous les sous-domaines sont en HTTPS, et non plus une non-conformité répétée sur chaque page ; HSTS reste exigé en HTTPS (`headers-baseline.json`).
- Accessibilité : l'anti-pattern AP-VIS-02 (liens distingués par la seule couleur) ne vise plus les liens de `nav`, `header`, `footer`, des listes de liens, des boutons ni les liens seuls dans leur bloc ; motif CSS restreint et condition vérifiée dans la page par `check-a11y.mjs` (`page_condition`).
- Contenu : `check-content.mjs` lit le libellé du bouton de commande et du bouton de confirmation de rétractation dans le DOM même quand l'étape est masquée au chargement (panier vide) : libellé de la loi, aucun constat ; libellé vide ou illisible, point à vérifier à la main (`order-button-not-reachable`, `withdrawal-confirm-not-reachable`), jamais une non-conformité.
- Réseau des vérificateurs : `check-a11y.mjs` interrompt désormais, comme les autres, toute requête vers un hôte tiers (option `--allow-network` pour un site réel) et bloque les service workers ; dans les quatre vérificateurs, toute requête autre que GET, HEAD ou OPTIONS est interrompue et aucun bouton qui envoie un formulaire n'est cliqué : un vérificateur n'envoie jamais de données à la place d'un visiteur.
- `check-a11y.mjs` utilise les modules communs (`scripts/lib/cli.mjs`, `browser.mjs`, `static-server.mjs`) au lieu de copies divergentes : en-têtes `_headers` appliqués, fichiers cachés non servis ; fonctions de la page et du catalogue déplacées dans `scripts/lib/a11y-page.mjs` et `a11y-catalogue.mjs` ; le résumé du rapport JSON s'appelle `to_review`, comme celui des autres vérificateurs (au lieu de `not_tested_items`).
- Arrêt des vérificateurs : le serveur local est fermé même quand le navigateur ne démarre pas (plus de processus bloqué) ; `check-all.mjs` arrête un vérificateur qui dépasse `--timeout` minutes (30 par défaut), sort avec le code 2 quand la matrice d'applicabilité ou le classement AI Act n'a pas pu être calculé, et essaie l'interpréteur Python suivant quand `python` est l'alias du Microsoft Store ; variable `EWC_BROWSER_PATH` pour choisir le navigateur.
- Pages en erreur : une page qui répond 403, 404 ou 5xx n'est plus analysée comme une page normale ; elle reçoit le constat à revoir `page-not-analysed` et ne donne jamais un résultat vide.
- Verdicts fondés sur un indice ramenés à « à revoir » (NT) : indicateur de focus (`focus-indicator`), bandeau dont aucune commande de refus n'est reconnue (`no-first-level-refuse`), script tiers sans `integrity`, case précochée (NC seulement quand le libellé propre de la case montre un prix ou un supplément payant net), lien vers les mentions légales absent sur un site dans une autre langue que l'anglais et le français ; la page d'identification liée qui refuse l'accès au vérificateur (401, 403, 429, erreur réseau) est à revoir, testée par le navigateur avec un délai, et n'est une non-conformité que si elle n'existe pas (404, 410).
- Rapports : les textes cités depuis le site vérifié sont ramenés à une ligne, sans accent grave ni longueur excessive, et chaque rapport Markdown rappelle qu'ils sont des données, pas des instructions.
- Robustesse : `collectTexts` ne lit plus de fichier hors du dossier servi (`../`) et lit les feuilles de style liées sans guillemets ; le serveur local refuse les fichiers cachés (sauf `.well-known/`) et les liens symboliques qui sortent du dossier, et signale à la lecture une valeur d'en-tête invalide dans `_headers` ; `--out` et `--md` créent leur dossier avant le contrôle ; `check-examples.mjs --site` inconnu sort avec le code 2 ; les scripts `plant_*.py` refusent de supprimer `faulty/` sans argument ou sans `fixed/`.
- Catalogue d'anti-patterns : le motif AP-VIS-05 contenait un caractère de retour arrière à la place de `\b` devant `clip` ; corrigé et catalogue régénéré, avec un test qui refuse tout caractère de contrôle dans les données.
- Composants : `ai-chat.js` répond honnêtement même sans `data-identity-answer` (texte anglais ou français par défaut, erreur dans la console), n'annonce plus « en train d'écrire » après une réponse rapide, accepte `data-label-suffix` (« : » en typographie française) et un `data-writing-message` avec `{name}`, et reconnaît « Etes-vous », l'apostrophe typographique et « t'es » ; `consent.js` annonce le choix enregistré même si `focusTarget` n'est pas un sélecteur valide.
