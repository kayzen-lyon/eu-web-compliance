# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Les versions suivent le versionnage sémantique.

## [Non publié]

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

- Qualification : les faits dits dans la demande ou le cahier des charges sont `stated`, leurs conséquences évidentes `inferred` (une mairie ne vend pas ; un cahier des charges qui liste toutes les fonctions sans IA exclut l'IA) ; seule une inconnue qui compte reçoit l'hypothèse protectrice `assumed`, et un renvoi à un professionnel repose sur des faits, ou sur une hypothèse seulement quand l'enjeu le justifie ; `applicability.py` ne signale plus le « secteur réglementé » sur une seule réponse supposée (`questionnaire.md`, `out-of-scope.md`, `SKILL.md`, `obligations.json`, schéma du profil).
- Sécurité : l'absence de `includeSubDomains` dans HSTS devient un point à revoir (NT), à ajouter seulement quand tous les sous-domaines sont en HTTPS, et non plus une non-conformité répétée sur chaque page ; HSTS reste exigé en HTTPS (`headers-baseline.json`).
- Accessibilité : l'anti-pattern AP-VIS-02 (liens distingués par la seule couleur) ne vise plus les liens de `nav`, `header`, `footer`, des listes de liens, des boutons ni les liens seuls dans leur bloc ; motif CSS restreint et condition vérifiée dans la page par `check-a11y.mjs` (`page_condition`).
- Contenu : `check-content.mjs` lit le libellé du bouton de commande et du bouton de confirmation de rétractation dans le DOM même quand l'étape est masquée au chargement (panier vide) : libellé de la loi, aucun constat ; libellé vide ou illisible, point à vérifier à la main (`order-button-not-reachable`, `withdrawal-confirm-not-reachable`), jamais une non-conformité.
