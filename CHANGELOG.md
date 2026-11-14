# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Les versions suivent le versionnage sémantique.

## [Non publié]

### Ajouté

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
