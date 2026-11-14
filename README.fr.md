# eu-web-compliance

[English version](README.md)

Skill pour agents IA de développement : faire respecter, dès l'écriture du code, les obligations européennes qui s'appliquent à un site web.

> **État du projet : en construction (étape M0, fondations).** Le skill n'est pas encore utilisable. Ce dépôt contient pour l'instant le cahier des charges, le registre des sources et les contrôles de structure.

## Ce que le skill couvrira

| Domaine | Textes de référence |
|---------|---------------------|
| Accessibilité | European Accessibility Act, EN 301 549, WCAG 2.2 niveau AA, RGAA |
| Protection des données | RGPD, directive ePrivacy, règles de la CNIL sur les traceurs |
| Intelligence artificielle | Règlement européen sur l'IA (AI Act), surtout la transparence de l'article 50 |
| Sécurité | Guides de l'ANSSI, complétés par l'OWASP |
| Consommation et information | Mentions légales, vente en ligne, fonction de rétractation, prix, DSA |

Il fera trois choses : déterminer quelles obligations s'appliquent au projet, faire produire un code conforme dès l'écriture, puis vérifier le résultat en séparant ce qui est prouvé de ce qui reste à contrôler par une personne.

Périmètre : le droit de l'UE et les 27 États membres. La France est couverte en premier ; chaque autre pays dispose d'un fichier qui dit clairement ce qui a été vérifié ou non.

## Ce que le skill ne fait pas

Le skill est relu par un agent IA équipé d'outils spécialisés. Aucun professionnel du droit ni auditeur d'accessibilité ne l'a encore relu ; toute relecture indépendante est bienvenue.

Il ne garantit pas la conformité juridique d'un site et ne remplace ni un audit d'accessibilité, ni un délégué à la protection des données, ni un avocat. Une partie des critères d'accessibilité exige un jugement humain, et la qualification juridique d'un service relève d'un professionnel du droit. Les rapports produits le rappellent et listent les points à faire vérifier.

## Contenu du dépôt

| Chemin | Rôle |
|--------|------|
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
