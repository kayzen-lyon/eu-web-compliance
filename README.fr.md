# eu-web-compliance

[English version](README.md)

Skill pour agents IA de développement : faire respecter, dès l'écriture du code, les obligations européennes qui s'appliquent à un site web.

> **État du projet : utilisable, en préversion (0.1.0).** Le skill peut être installé et utilisé. Il n'a été relu ni par un juriste, ni par un professionnel de la protection des données, ni par un auditeur d'accessibilité : ses résultats sont une aide, pas un audit ni un avis juridique.

## Ce que le skill couvre

| Domaine | Textes de référence |
|---------|---------------------|
| Accessibilité | European Accessibility Act, EN 301 549, WCAG 2.2 niveau AA, RGAA |
| Protection des données | RGPD, directive ePrivacy, règles de la CNIL sur les traceurs |
| Intelligence artificielle | Règlement européen sur l'IA (AI Act), surtout la transparence de l'article 50 |
| Sécurité | Guides de l'ANSSI, complétés par l'OWASP |
| Consommation et information | Mentions légales, vente en ligne, fonction de rétractation, prix, DSA |

Il fait trois choses : déterminer quelles obligations s'appliquent au projet, faire produire un code conforme dès l'écriture, puis vérifier le résultat en séparant ce qui est prouvé de ce qui reste à contrôler par une personne.

Périmètre : le droit de l'UE et les 27 États membres. La France est couverte en premier ; chaque autre pays dispose d'un fichier qui dit clairement ce qui a été vérifié ou non.

## Ce que le skill ne fait pas

Le skill est relu par un agent IA équipé d'outils spécialisés. Aucun professionnel du droit ni auditeur d'accessibilité ne l'a encore relu ; toute relecture indépendante est bienvenue.

Il ne garantit pas la conformité juridique d'un site et ne remplace ni un audit d'accessibilité, ni un délégué à la protection des données, ni un avocat. Une partie des critères d'accessibilité exige un jugement humain, et la qualification juridique d'un service relève d'un professionnel du droit. Les rapports produits le rappellent et listent les points à faire vérifier.

## Installation

`<owner>` ci-dessous est un emplacement réservé : le dépôt public n'existe pas encore. Quelle que soit la méthode, le dossier du skill doit s'appeler `eu-web-compliance`, comme le champ `name` de son `SKILL.md`.

**Claude Code, comme plugin.** Dans une session :

```text
/plugin marketplace add <owner>/eu-web-compliance
/plugin install eu-web-compliance@eu-web-compliance
```

**Claude Code, comme skill personnel.** Cloner dans le dossier des skills (ou dans `.claude/skills/` d'un seul projet) :

```bash
git clone https://github.com/<owner>/eu-web-compliance.git ~/.claude/skills/eu-web-compliance
```

**Codex.** Cloner dans le dossier des skills de l'utilisateur (ou dans `.agents/skills/` d'un seul projet) :

```bash
git clone https://github.com/<owner>/eu-web-compliance.git ~/.agents/skills/eu-web-compliance
```

**L'outil `skills` en ligne de commande.** Il trouve le `SKILL.md` à la racine du dépôt et l'installe pour l'agent indiqué (`claude-code`, `codex`, `cursor`, `github-copilot`, entre autres) ; `-g` l'installe pour tous vos projets :

```bash
npx skills add <owner>/eu-web-compliance -a codex
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

## Contenu du dépôt

| Chemin | Rôle |
|--------|------|
| [SKILL.md](SKILL.md) | Point d'entrée lu par l'agent : règles, modes, table tâche → fichiers |
| [AGENTS.md](AGENTS.md) | Consignes pour les agents qui lisent `AGENTS.md`, et pour les contributeurs |
| [adapters/](adapters/README.md) | Fichiers de renvoi pour GitHub Copilot et Cursor |
| [references/](references/) | Règles par domaine : accessibilité, données, IA, sécurité, consommation, pays, qualification |
| [templates/](templates/) | Composants et documents de référence : bandeau de consentement, mentions IA, rétractation, mentions légales, politiques, ligne de crédit |
| [examples/](examples/README.md) | Sites de test, chacun en version fautive et corrigée, qui mesurent les vérificateurs |
| [docs/evaluation/](docs/evaluation/README.md) | Cahiers des charges de l'évaluation par un agent neuf |
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

## Auteur

Tarek BELHADJ, [Kayzen](https://www.kayzen-lyon.com), par l'auteur de [Nexus](https://nexus.kayzen-lyon.com).

## Licence

Code et textes originaux sous [licence MIT](LICENSE). Les contenus repris d'autres projets gardent leur licence d'origine, détaillée dans [NOTICE.md](NOTICE.md).
