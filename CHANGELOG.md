# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Les versions suivent le versionnage sémantique.

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
