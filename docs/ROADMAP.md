# Audit et feuille de route : les portes d'entrée du skill

Document du 15 novembre 2026. Il complète la section 15 de [PRD.md](PRD.md), qui décrit les étapes M0 à M4 ayant mené à la version 1.0.0. Il porte sur l'étape suivante : rendre les vérificateurs et les règles du skill utilisables hors d'un agent qui charge un skill.

## 1. Audit du dépôt avant ce chantier

L'audit a porté sur la version 1.0.0 (commit `48f73b0`) : structure, scripts, tests, intégration continue, registre des sources.

### Ce qui était solide

- **Un seul orchestrateur.** `scripts/check-all.mjs` lance la matrice d'applicabilité, le classement AI Act et les quatre vérificateurs, puis écrit un rapport Markdown et un rapport JSON qui suit `schemas/report.schema.json`. Ses codes de sortie sont stables : 0, 1 (non-conformité), 2 (erreur).
- **Des vérificateurs sûrs par construction.** Toute requête vers un hôte tiers et toute requête qui pourrait envoyer des données sont interrompues (`scripts/lib/browser.mjs`). Le texte cité depuis un site est signalé comme une donnée, pas une instruction.
- **Des faits tracés.** Chaque règle se termine par sa source, chaque source est dans `references/sources.json`, et `scripts/validate.py` le contrôle.
- **Des tests qui mesurent.** Six sites d'exemple, en version corrigée et fautive, fixent un taux de détection minimal.

### Ce qui manquait

| # | Constat | Conséquence | Traité dans ce chantier |
|---|---------|-------------|-------------------------|
| 1 | `package.json` était marqué `private`, sans champ `bin` | Impossible de lancer les vérifications avec `npx` | Oui |
| 2 | `playwright` et `axe-core` étaient déclarés en dépendances de développement alors que les vérificateurs en ont besoin pour tourner | Une installation de production n'aurait pas eu de navigateur piloté | Oui |
| 3 | Aucun fichier `action.yml` | Chaque dépôt devait recopier les étapes d'installation dans son propre workflow | Oui |
| 4 | Aucun module commun entre les scripts et une éventuelle autre porte d'entrée | Chaque nouvelle porte aurait recopié des appels, avec un risque de divergence | Oui : `scripts/lib/skill-api.mjs` |
| 5 | Les questions de qualification n'existaient qu'en prose (`questionnaire.md`) | Seul un agent pouvait remplir `compliance/profile.json` | Oui : `init`, piloté par le schéma du profil |
| 6 | Une règle ne se retrouvait qu'en lisant les fichiers | Pas de recherche par étiquette (`[RGAA 11.1]`) | Oui : `rule` et `get_rule` |
| 7 | Un seul fichier sur les CMS, limité à la sécurité | L'agent ne savait pas où agir dans WordPress, PrestaShop ou Shopify | Oui : `references/cms/` |
| 8 | La fraîcheur des sources ne tenait qu'à l'âge de la date `consulted` (90 jours) | Un texte modifié le lendemain d'une relecture restait invisible trois mois | Oui, en partie (voir 3.5) |
| 9 | La matrice d'applicabilité dépend de Python | L'outil `npx` demande Python pour `init`, `qualify` et la matrice du rapport | Non : voir 4.1 |
| 10 | La version est écrite à quatre endroits (`package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `SKILL.md`) | Risque de numéros divergents à la prochaine version | Non : voir 4.4 |
| 11 | Les actions GitHub utilisées sont désignées par leur version majeure (`@v4`), pas par leur empreinte | Pratique courante, mais moins stricte que l'épinglage par empreinte | Non : voir 4.4 |
| 12 | L'intégration continue ne tourne que sous Linux | Le comportement sous Windows et macOS n'est vérifié que sur le poste du mainteneur (Windows) | Non : voir 4.4 |

## 2. Règle commune

Chaque porte d'entrée passe par `scripts/check-all.mjs` et par les fichiers de `references/`, `templates/` et `schemas/`, sans copie. Le module `scripts/lib/skill-api.mjs` est le seul point de passage : il appelle `check-all.mjs` et `applicability.py`, liste les modèles et cherche les règles. Une correction faite dans un vérificateur ou dans une règle profite donc au skill, à l'outil en ligne de commande, à l'Action et au serveur MCP.

Les garde-fous du skill s'appliquent à toutes les portes : aucune ne dit qu'un site est conforme, chacune rappelle que le résultat n'est ni un audit ni un avis juridique, et le blocage des requêtes vers les sites tiers n'est réglable par aucun paramètre des nouvelles portes.

## 3. Ce qui est livré

### 3.1 Outil en ligne de commande

Fichier `bin/eu-web-compliance.mjs`, déclaré dans le champ `bin` de `package.json`.

| Commande | Rôle |
|----------|------|
| `audit <dossier ou URL>` | Lance `check-all.mjs` avec les mêmes options et les mêmes codes de sortie |
| `init` | Pose les questions de qualification dans le terminal, en français ou en anglais, et écrit `compliance/profile.json`, puis la matrice |
| `qualify [profil]` | Affiche la matrice d'applicabilité |
| `template [nom]` | Liste les modèles, en affiche un ou le copie |
| `rule <étiquette>` | Trouve les règles qui citent une source ; pour un critère RGAA, affiche aussi son texte officiel |
| `mcp` | Démarre le serveur MCP |

`init` suit les règles du questionnaire : une réponse donnée est enregistrée `stated` ; un oui/non laissé sans réponse reçoit la lecture protectrice, marquée `assumed` ; un chiffre, un pays ou une forme juridique sans réponse n'est pas écrit. Les types et les valeurs permises viennent du schéma du profil ; seuls les libellés courts des questions sont dans `scripts/lib/init-questions.json`, et un test échoue si un champ du schéma n'a pas de question.

L'outil se lance depuis le dépôt GitHub, et c'est la voie officielle : `npx github:kayzen-lyon/eu-web-compliance audit dist`.

### 3.2 GitHub Action

Fichier `action.yml` à la racine (action composite). Paramètres : `target`, `only`, `lang`, `fail-on-violation`, et aussi `project`, `profile`, `timeout`, `artifact-name`, `node-version`, `python-version`. Elle installe Node, Python, les dépendances et Chromium, lance l'audit, écrit le rapport Markdown dans le résumé de l'exécution et joint les rapports Markdown et JSON comme fichier téléchargeable. Les valeurs fournies par l'appelant passent par des variables d'environnement, jamais par le texte d'un script.

Un job de `validate.yml` essaie l'Action sur un site d'exemple à chaque pull request.

### 3.3 Fiches CMS

`references/cms/wordpress.md`, `prestashop.md` et `shopify.md` disent où appliquer les règles existantes dans chaque CMS : hooks, thème enfant, API de consentement, outils de données personnelles, bouton de commande, en-têtes. Elles n'ajoutent aucune règle : chaque case à cocher reprend une règle existante avec son étiquette d'origine, ou est marquée `[best practice]`. Chaque fait technique a été lu le 15 novembre 2026 sur une page officielle de l'éditeur, inscrite dans `references/sources.json` (39 entrées). Ce qui n'a pas pu être confirmé est écrit « not verified » dans la fiche. `SKILL.md` envoie l'agent vers la bonne fiche quand il reconnaît le CMS.

### 3.4 Serveur MCP

Fichier `mcp/server.mjs`, avec le SDK officiel `@modelcontextprotocol/sdk`, en transport stdio. Quatre outils : `qualify_project`, `audit_site`, `get_template`, `get_rule`. `audit_site` rend le résumé, les constats les plus graves d'abord (40 par défaut) et le chemin du rapport complet. `get_template` ne lit que des fichiers listés dans `templates/`.

### 3.5 Veille réglementaire

`scripts/watch-sources.mjs` calcule une empreinte du texte de chaque page de `references/sources.json` et la compare à `references/sources-fingerprints.json`. Le workflow `watch-sources.yml` le lance chaque lundi et ouvre une issue, ou complète l'issue ouverte, quand une page a changé. Rien n'est corrigé automatiquement : la règle du dépôt reste la relecture de la source officielle.

Mesure du 15 novembre 2026 : sur 126 sources, 111 ont une empreinte stable d'une lecture à l'autre, et 15 refusent les robots (réponse HTTP 403), dont 14 pages de Légifrance. Ces 15 sources ne sont pas surveillées par ce moyen ; elles restent sous la règle manuelle des 90 jours.

## 4. Ce qui reste à faire

### 4.1 Décisions qui reviennent au propriétaire du dépôt

Chaque point publie quelque chose sous le nom de Kayzen. Le propriétaire a demandé la publication le 15 novembre 2026 : la version 1.1.0 et les étiquettes `v1.1.0` et `v1` existent sur GitHub. Le reste attend une action de sa part.

| Décision | Effet | État |
|----------|-------|------|
| Créer l'étiquette `v1` et la version `v1.1.0` | `uses: kayzen-lyon/eu-web-compliance@v1` fonctionne | Fait le 15 novembre 2026 |
| Publier le paquet sur npm | `npx eu-web-compliance audit …` fonctionnerait sans l'adresse du dépôt | Écarté par le propriétaire le 21 novembre 2026 : pas de compte npm. L'installation passe par GitHub. Conséquence à connaître : le nom `eu-web-compliance` reste libre sur npm (vérifié le 21/11/2026) et quelqu'un d'autre peut le prendre ; la documentation dit donc de toujours écrire l'adresse `github:` complète. Réserver le nom demanderait un compte npm |
| Inscrire l'Action sur le GitHub Marketplace | Visibilité | À faire : case à cocher dans la page de la version, après acceptation des conditions du Marketplace par le propriétaire |
| Inscrire le serveur dans un registre MCP | Visibilité auprès des clients MCP | Non prévu : les registres attendent en général un paquet npm |

### 4.2 Limites connues de ce qui est livré

- **Python reste nécessaire** pour `init`, `qualify` et la matrice du rapport. Porter `applicability.py` en JavaScript donnerait un outil entièrement Node ; il faudra alors garder un seul moteur, ou prouver par un test que les deux rendent la même matrice sur tous les profils d'essai.
- **Le serveur MCP est local (stdio).** Il sert les clients qui lancent un serveur sur le poste de l'utilisateur. Un service en ligne qui n'accepte que des serveurs MCP distants (HTTP) ne peut pas l'utiliser tel quel ; cela demanderait un hébergement, une authentification et une limite d'usage, et un serveur public qui charge des adresses à la demande pose des questions de sécurité à traiter avant.
- **Les fiches CMS ont été rédigées par un agent** à partir de pages lues à travers un outil qui résume les pages. Les noms de hooks et de fonctions ont été recoupés, mais une relecture par une personne qui pratique chaque CMS reste à faire. Les fiches datent du 15 novembre 2026 et décrivent des produits qui changent.
- **La veille ne voit pas Légifrance.** L'API officielle de Légifrance permettrait de suivre ces 14 textes ; elle demande un compte et une clé, donc une décision du propriétaire.
- **L'Action a été essayée par son étiquette `v1`** (15/11/2026), depuis une branche temporaire du dépôt public, sur un dossier de pages et sur une adresse en ligne : installation, quatre vérificateurs, résumé, rapport joint, sorties et code de sortie sont conformes. Sur une prévisualisation protégée (essai du 15/11/2026 sur un déploiement Vercel), l'outil ne peut pas entrer : depuis la 1.1.2 il rend « page non analysée » au lieu d'auditer la page de connexion. Pour vérifier une prévisualisation, il faut lui donner une adresse accessible sans connexion. Un dossier de pages servi sans ses en-têtes de production donne des non-conformités de sécurité : c'est attendu, et l'audit de l'adresse en ligne est alors le bon contrôle.
- **Constats de la relecture du 15/11/2026** : tous corrigés, en 1.1.1 puis en 1.1.2 (voir `CHANGELOG.md`). Il reste un choix assumé : sans la variable `EU_WEB_COMPLIANCE_MCP_ROOT`, le serveur MCP lit tout dossier lisible par l'utilisateur, comme l'outil en ligne de commande ; la variable est décrite dans les README.

### 4.3 Suites proposées, par ordre de valeur

1. Fait le 15/11/2026 : versions publiées sur GitHub, `npx github:…` et l'Action (`@v1`) vérifiés depuis un dépôt tiers.
2. Porter la qualification en JavaScript (4.2).
3. Fiches CMS supplémentaires : Drupal, Joomla, Webflow, Wix, Squarespace, avec la même méthode.
4. Suivre Légifrance par son API.
5. Commentaire automatique du rapport sur la pull request, en option de l'Action.
6. Serveur MCP distant, après une étude de sécurité.

### 4.4 Hygiène du dépôt

- Fait : un test échoue quand les numéros de version divergent (`package.json`, `package-lock.json`, `.claude-plugin/plugin.json`, `SKILL.md`, `CHANGELOG.md`).
- Épingler les actions GitHub par empreinte de commit.
- Faire tourner les tests Node sous Windows et macOS dans l'intégration continue.

---

Auteur : Tarek BELHADJ - Kayzen (<https://www.kayzen-lyon.com>), par l'auteur de Nexus (<https://nexus.kayzen-lyon.com>).
