# eu-web-compliance

[English version](README.md)

Skill pour agents IA de développement : faire respecter, dès l'écriture du code, les obligations européennes qui s'appliquent à un site web.

> **État du projet : version 1.1.1.** Le skill peut être installé et utilisé. Il n'a été relu ni par un juriste, ni par un professionnel de la protection des données, ni par un auditeur d'accessibilité : ses résultats sont une aide, pas un audit ni un avis juridique.

## Ce que le skill couvre

| Domaine | Textes de référence |
|---------|---------------------|
| Accessibilité | European Accessibility Act, EN 301 549, WCAG 2.2 niveau AA, RGAA |
| Protection des données | RGPD, directive ePrivacy, règles de la CNIL sur les traceurs |
| Intelligence artificielle | Règlement européen sur l'IA (AI Act), surtout la transparence de l'article 50 |
| Sécurité | Guides de l'ANSSI, complétés par l'OWASP |
| Consommation et information | Mentions légales, vente en ligne, fonction de rétractation, prix, DSA |

Il fait trois choses : déterminer quelles obligations s'appliquent au projet, faire produire un code conforme dès l'écriture, puis vérifier le résultat en séparant ce qui est prouvé de ce qui reste à contrôler par une personne.

Périmètre : le droit de l'UE et le droit français sont vérifiés. Chacun des 26 autres États membres dispose d'un fichier qui dit clairement ce qui a été vérifié ou non : l'Allemagne est vérifiée en partie, les autres pas encore, et le socle européen s'applique en attendant.

## Ce que le skill ne fait pas

Le skill est relu par un agent IA équipé d'outils spécialisés. Aucun professionnel du droit ni auditeur d'accessibilité ne l'a encore relu ; toute relecture indépendante est bienvenue.

Il ne garantit pas la conformité juridique d'un site et ne remplace ni un audit d'accessibilité, ni un délégué à la protection des données, ni un avocat. Une partie des critères d'accessibilité exige un jugement humain, et la qualification juridique d'un service relève d'un professionnel du droit. Les rapports produits le rappellent et listent les points à faire vérifier.

## Ce que ce skill apporte

Il a été construit à partir de quatre skills ouverts, cités dans [NOTICE.md](NOTICE.md) : chacun est bon dans son sujet, et aucun n'a été recopié tel quel (0,7 % de texte commun, mesuré). Ce que ce skill ajoute :

| | Avant : les quatre skills d'origine, chacun seul | Ce skill |
|---|---|---|
| Périmètre | Un sujet chacun : accessibilité RGAA, pratiques du secteur public français, AI Act, consignes Copilot | Cinq domaines au même endroit : accessibilité, protection des données, AI Act, sécurité, droit de la consommation, avec les documents juridiques |
| Quelles règles s'appliquent | Laissé au lecteur | Une matrice de 62 obligations, calculée à partir du profil du projet ; chacune marquée obligatoire ou recommandée |
| Sources | Citées en partie | Chaque règle se termine par sa source officielle ; chaque date et version se trouve dans un seul fichier, avec une source lue et datée dans `references/sources.json` ; les faits non confirmés vont dans `OPEN-QUESTIONS.md`, pas dans les règles |
| Vérifier le résultat | Surtout des listes de contrôle, un sujet à la fois | Quatre scripts qui chargent les pages dans un vrai navigateur : accessibilité (axe-core et contrôles propres), traceurs déposés avant consentement, en-têtes de sécurité, contenu (pages légales, mentions IA, fonction de rétractation), réunis dans un rapport unique aux verdicts C / NC / NA / NT |
| Preuve que les contrôles marchent | Pas de sites de test mesurés | Six sites d'exemple, chacun en version corrigée et en version fautive : zéro non-conformité sur chaque version corrigée, chaque défaut détectable dans le code signalé sur les versions fautives, comme non-conformité ou comme point à vérifier ([résultats](docs/evaluation/results.md)) |
| Pièces prêtes à l'emploi | Des exemples de code | Composants accessibles à coller : bandeau et chargeur de consentement, mentions de chat IA et de contenu généré, étape de commande, fonction de rétractation, affichage des réductions de prix |
| Pays | France | Droit de l'UE et droit français vérifiés ; un fichier par État membre qui dit ce qui est vérifié et ce qui ne l'est pas |
| Agents | Un outil chacun | Claude Code (skill ou plugin), Codex et tout agent qui lit `AGENTS.md`, GitHub Copilot, Cursor |

Là où un skill d'origine va plus loin, utilisez-le en complément : exemples Rails et DSFR (`Isalafont/claude-skill-rgaa-dev`), obligations des fournisseurs d'IA à usage général et à haut risque (`morellid/ai-act-skill`).

Lors d'un test de bout en bout, des agents neufs ont construit les mêmes petits sites avec et sans le skill. Sans lui, une boutique de thé en ligne présentait 122 non-conformités relevées par les scripts et aucune fonction de rétractation ; avec lui, les trois sites construits n'en avaient plus aucune, une fois corrigé le faux positif propre aux scripts. Les consignes sont dans [docs/evaluation/](docs/evaluation/README.md).

## Installation

Le dépôt est <https://github.com/kayzen-lyon/eu-web-compliance>. Quelle que soit la méthode, le dossier du skill doit s'appeler `eu-web-compliance`, comme le champ `name` de son `SKILL.md`.

**Claude Code, comme plugin.** Dans une session :

```text
/plugin marketplace add kayzen-lyon/eu-web-compliance
/plugin install eu-web-compliance@eu-web-compliance
```

**Claude Code, comme skill personnel.** Cloner dans le dossier des skills (ou dans `.claude/skills/` d'un seul projet) :

```bash
git clone https://github.com/kayzen-lyon/eu-web-compliance.git ~/.claude/skills/eu-web-compliance
```

**Codex.** Cloner dans le dossier des skills de l'utilisateur (ou dans `.agents/skills/` d'un seul projet) :

```bash
git clone https://github.com/kayzen-lyon/eu-web-compliance.git ~/.agents/skills/eu-web-compliance
```

**L'outil `skills` en ligne de commande.** Il trouve le `SKILL.md` à la racine du dépôt et l'installe pour l'agent indiqué (`claude-code`, `codex`, `cursor`, `github-copilot`, entre autres) ; `-g` l'installe pour tous vos projets :

```bash
npx skills add kayzen-lyon/eu-web-compliance -a codex
```

**GitHub Copilot, Cursor et les autres agents qui lisent `AGENTS.md`.** Placer le skill dans le projet (par exemple dans `.vendor/eu-web-compliance/`) et copier le fichier de renvoi adapté : voir [adapters/README.md](adapters/README.md) et la partie A d'[AGENTS.md](AGENTS.md).

**Vérifications dans le navigateur.** Les scripts Python ne demandent que Python 3.8 ou plus récent. Les vérifications qui chargent les pages dans un navigateur (`scripts/*.mjs`) demandent Node 20 ou plus récent et une installation des dépendances, une fois, dans le dossier du skill :

```bash
cd ~/.claude/skills/eu-web-compliance   # ou l'emplacement où le skill est installé
npm install
npx playwright install chromium         # seulement si aucun Chromium, Chrome ou Edge n'est trouvé
```

Pour une installation comme plugin, le dossier est la copie installée du plugin, sous `~/.claude/plugins/`.

## Utiliser le skill

Une fois installé, l'agent charge le skill quand une tâche concerne un site destiné au marché européen ; vous pouvez aussi le nommer. Exemples de demandes :

- « Crée la page d'accueil et le formulaire de contact de ma boulangerie à Lyon, avec la mesure d'audience Matomo et un bandeau cookies. » L'agent pose une fois quelques questions de qualification (qui exploite le site, ce qu'il vend, quelles données il collecte), écrit `compliance/profile.json`, puis construit selon les règles qui s'appliquent.
- « Nous ajoutons à notre boutique en ligne un assistant conversationnel construit sur l'API d'un modèle : que devons-nous afficher aux visiteurs ? » L'agent vérifie la liste des pratiques interdites de l'AI Act, applique les règles de transparence et reprend le composant d'information de référence.
- « Audite le site du dossier `dist/` avant la mise en ligne. » L'agent lance les vérifications, puis liste les non-conformités, ce qui bloque des personnes et ce qu'une personne doit encore vérifier.

Pour lancer toutes les vérifications vous-même, depuis la racine du projet web, sur les pages construites ou sur un serveur local démarré :

```bash
node <dossier du skill>/scripts/check-all.mjs dist --project .
node <dossier du skill>/scripts/check-all.mjs http://localhost:3000 --project . --profile compliance/profile.json
```

Le rapport est écrit dans `compliance/reports/compliance-report-AAAA-MM-JJ.md`, accompagné d'une version `.json` pour l'intégration continue. Une liste de constats vide ne signifie pas que le site est conforme : lisez la partie « non testé » du rapport.

## Autres portes d'entrée : terminal, GitHub Action, serveur MCP

Toutes passent par les mêmes vérificateurs (`scripts/check-all.mjs`) et les mêmes fichiers (`references/`, `templates/`) que le skill. Aucune ne dit qu'un site est conforme. L'audit de départ, ce qui est livré et ce qui reste à faire sont dans [docs/ROADMAP.md](docs/ROADMAP.md).

**Outil en ligne de commande.** Depuis la racine du projet web (Node 20 ou plus récent ; Python 3.8 ou plus récent pour `init` et `qualify`) :

```bash
npx github:kayzen-lyon/eu-web-compliance audit dist --lang fr
```

| Commande | Rôle |
|----------|------|
| `audit <dossier ou URL>` | Lance les quatre vérificateurs et écrit le rapport dans `compliance/reports/` (mêmes options que `check-all.mjs`) |
| `init` | Pose les questions de qualification dans le terminal et écrit `compliance/profile.json` ; Entrée quand vous ne savez pas, rien n'est inventé |
| `qualify [profil]` | Affiche la matrice des obligations |
| `template [nom]` | Liste les modèles, en affiche un, ou le copie avec `--out` |
| `rule <étiquette>` | Trouve les règles qui citent une source, par exemple `rule "RGAA 11.1"` |
| `mcp` | Démarre le serveur MCP |

Le paquet n'est pas encore publié sur npm : d'ici là, la commande passe par l'adresse du dépôt, comme ci-dessus.

**GitHub Action.** Dans un workflow, après la construction du site :

```yaml
- uses: kayzen-lyon/eu-web-compliance@v1
  with:
    target: dist            # dossier construit, ou URL de prévisualisation
    lang: fr
    fail-on-violation: "true"
```

Le rapport s'affiche dans le résumé de l'exécution et il est joint, en Markdown et en JSON, comme fichier téléchargeable. Autres paramètres : `only`, `project`, `profile`, `timeout`, `artifact-name` (voir [action.yml](action.yml)). `@v1` suit la dernière version 1.x ; indiquez une étiquette exacte (`@v1.1.0`) ou une empreinte de commit si vous voulez des contrôles figés.

**Serveur MCP.** Pour les agents qui ne chargent pas de skill. Après `npm install` dans le dossier du skill, déclarez dans votre client MCP :

```json
{
  "mcpServers": {
    "eu-web-compliance": {
      "command": "node",
      "args": ["<dossier du skill>/mcp/server.mjs"]
    }
  }
}
```

Quatre outils : `qualify_project` (profil → matrice des obligations), `audit_site` (URL ou dossier → rapport), `get_template` (modèle de document) et `get_rule` (règles par étiquette). Le serveur est local (stdio) : il tourne sur votre poste et charge les pages avec le même blocage des requêtes vers les sites tiers que les vérificateurs. Les arguments des outils sont écrits par un modèle de langage, qui peut avoir lu une page piégée ; le serveur les contrôle donc : une URL à vérifier est en `http` ou `https` et jamais une adresse de lien local (`169.254.0.0/16`, `fe80::/10`, là où répondent les services de métadonnées des hébergeurs), et un vérificateur tourne 30 minutes au plus. Pour enfermer le serveur dans un dossier, définissez la variable d'environnement `EU_WEB_COMPLIANCE_MCP_ROOT` dans la déclaration ci-dessus : tout chemin de dossier, de projet ou de profil situé hors de ce dossier est refusé. Sans cette variable, le serveur peut lire tout dossier que votre compte peut lire, comme l'outil en ligne de commande.

**WordPress, PrestaShop, Shopify.** Les fiches de [references/cms/](references/cms/) disent à l'agent où agir dans chaque CMS (hooks, thème enfant, API de consentement, bouton de commande). Elles n'ajoutent aucune règle et signalent ce qui n'a pas été vérifié.

**Veille réglementaire.** Chaque lundi, un workflow compare les pages officielles de `references/sources.json` à leurs empreintes et ouvre une issue quand l'une a changé. Une page changée ne veut pas dire que le droit a changé, et rien n'est corrigé sans relecture de la source. Les pages qui refusent les robots, dont Légifrance, ne sont pas surveillées par ce moyen.

## Contenu du dépôt

| Chemin | Rôle |
|--------|------|
| [SKILL.md](SKILL.md) | Point d'entrée lu par l'agent : règles, modes, table tâche → fichiers |
| [AGENTS.md](AGENTS.md) | Consignes pour les agents qui lisent `AGENTS.md`, et pour les contributeurs |
| [adapters/](adapters/README.md) | Fichiers de renvoi pour GitHub Copilot et Cursor |
| [references/](references/) | Règles par domaine : accessibilité, données, IA, sécurité, consommation, documents juridiques, pays, qualification |
| [templates/](templates/) | Composants et documents de référence : bandeau de consentement, mentions IA, étape de commande, rétractation, réduction de prix, mentions légales, déclaration d'accessibilité et information EAA, politiques de confidentialité et de cookies, CGU, CGV, accord de sous-traitance, ligne de crédit |
| [examples/](examples/README.md) | Sites de test, chacun en version fautive et corrigée, qui mesurent les vérificateurs |
| [docs/evaluation/](docs/evaluation/README.md) | Cahiers des charges de l'évaluation par un agent neuf |
| [bin/](bin/eu-web-compliance.mjs), [action.yml](action.yml), [mcp/](mcp/server.mjs) | Outil en ligne de commande, GitHub Action et serveur MCP : trois portes d'entrée vers les mêmes vérificateurs |
| [references/cms/](references/cms/) | Où appliquer les règles dans WordPress, PrestaShop et Shopify |
| [scripts/watch-sources.mjs](scripts/watch-sources.mjs) | Veille : dit si une page officielle du registre a changé |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Audit du dépôt et feuille de route des portes d'entrée |
| [docs/PRD.md](docs/PRD.md) | Exigences produit, architecture, feuille de route |
| [docs/PROMPT.md](docs/PROMPT.md) | Prompt de construction destiné à un agent |
| [references/regulatory-status.md](references/regulatory-status.md) | Dates et versions en vigueur, seul endroit où elles figurent |
| [references/sources.json](references/sources.json) | Registre des sources officielles consultées |
| [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | Faits non confirmés et décisions en attente |
| [NOTICE.md](NOTICE.md) | Attributions et licences des contenus repris |
| [scripts/validate.py](scripts/validate.py) | Contrôles de structure |
| [CHANGELOG.md](CHANGELOG.md) | Journal des modifications |

## Règles de contribution

- **Aucun fait réglementaire sans source.** Une date, un seuil, un numéro d'article ou une version de norme n'entre dans le dépôt qu'après lecture de la source officielle, inscrite dans `references/sources.json` avec sa date de consultation.
- **Dates et versions en un seul endroit** : `references/regulatory-status.md`. Les autres fichiers y renvoient.
- **Chaque règle porte sa source** entre crochets en fin de ligne, par exemple `[WCAG 2.4.7]`. Une bonne pratique sans source officielle est marquée `[best practice]`.
- **Contenu repris = contenu attribué** dans `NOTICE.md`.

## Vérifier le dépôt

```bash
python -m unittest discover -s tests
```

```bash
python scripts/validate.py
```

Le script ne demande que Python 3.8 ou plus récent. Avec `--strict`, une source consultée il y a plus de 90 jours fait échouer le contrôle.

Les contrôles dans le navigateur demandent Node 20 ou plus récent et un navigateur Chromium (celui de Playwright, ou Edge ou Chrome installé) :

```bash
npm install
```

```bash
node --test
```

```bash
node scripts/check-examples.mjs
```

La dernière commande lance les quatre vérificateurs sur les six sites d'exemple et échoue si une version corrigée a une non-conformité, ou si un vérificateur signale moins de 90 % des défauts de code placés dans les versions fautives.


## Auteur

Tarek BELHADJ, [Kayzen](https://www.kayzen-lyon.com), par l'auteur de [Nexus](https://nexus.kayzen-lyon.com).

## Licence

Code et textes originaux sous [licence MIT](LICENSE). Les contenus repris d'autres projets gardent leur licence d'origine, détaillée dans [NOTICE.md](NOTICE.md).
