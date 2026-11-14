# Template: terms of sale (conditions générales de vente), French, consumer sales

Guidance for the agent. Everything above the line "PUBLISHABLE TEXT" stays out of the published document.

This template is produced with an AI tool. It is not legal advice. The published text binds the seller: the seller and their lawyer read and approve it before it goes online. Say so to the user when you hand it over, with the disclaimer of [../../references/documents/README.md](../../references/documents/README.md) section 5.

## When to use it

When contracts are concluded on the site with consumers established in France (`market.sells_online`, `market.sells_to_consumers`, `FR` in `market.target_countries`). Rules: [../../references/documents/terms-of-sale.md](../../references/documents/terms-of-sale.md), then [../../references/consumer/online-sales.md](../../references/consumer/online-sales.md) and [../../references/consumer/withdrawal-function.md](../../references/consumer/withdrawal-function.md). Labels, periods and dates: [../../references/regulatory-status.md](../../references/regulatory-status.md) section 5.2.

Not for: sales to businesses only (different terms, French business-to-business rules not verified by this skill); a seller established outside France (governing law, jurisdiction and mediation to a professional); a marketplace (add the information of Article 6a of Directive 2011/83/EU, see the rules file).

## Qualify first

Fill this with the owner before writing; it decides which optional blocks stay.

| Question | Answer from the owner |
|----------|-----------------------|
| What is sold, item by item: goods, digital content on a medium, digital content without a medium, digital service, subscription | |
| Does each item carry a right of withdrawal? Which exception, confirmed in writing by the owner (`market.withdrawal_right_applies`) | |
| Does the order flow collect, for items supplied at once, express consent and acknowledgement by a separate unchecked control, and does the confirmation email repeat them? | |
| Subscription: duration, renewal, trial, notice, how to terminate online | |
| Payment means, delivery zones and restrictions, delivery times | |
| Mediator the seller has joined | |

## What comes from the operator, never from the agent

Seller identity (copy from the legal notice), products and prices, delivery times and costs, payment means, trial length, notice periods, refund periods, return costs, after-sales service, commercial guarantees, mediator, accessibility information. Each stays a `[placeholder]` until supplied, and every remaining one is listed in the answer.

## What the agent must never write

- A withdrawal exception as a fact when its condition is not confirmed. Conditional clauses are already written below with their condition in a visible bracket `[À CONFIRMER : …]`; keep the bracket until the owner confirms, then delete the bracket and the clauses that do not apply.
- "Aucun remboursement", "le client renonce à son droit de rétractation en commandant", an exclusion of the legal guarantees, an exclusion of all liability, a change of the terms "à tout moment sans préavis", an exclusive court against consumers.
- Termination only by registered letter or telephone for a contract concluded online.
- A link to the former EU online dispute resolution platform.
- A legal label in another wording: the order button and the withdrawal function labels are those of regulatory-status section 5.2, in French here.
- A paraphrase of the official model information on withdrawal: section 6 asks to paste the model of the annex to Article R. 221-3 from Légifrance, in its version in force, completed only where its notes say so.

## Conditional clauses in this template

| Clause | Condition written in the document | Delete when |
|--------|-----------------------------------|-------------|
| 6.3 Digital content supplied at once | Consent, acknowledgement and confirmation collected by the flow | No such content is sold |
| 6.4 Services fully performed | Express request and acknowledgement collected; service fully performed within the period | No such service |
| 6.5 Service at a specific date (events, accommodation, catering, leisure) | The owner confirms the service matches that case | No such service |
| 6.6 Other exception | The owner names the case of Article L. 221-28 and its lawyer confirms | No other exception |
| 8 Subscriptions | A subscription is sold | No subscription |
| 9.2 Goods guarantee, 9.3 digital guarantee | The item type is sold | That item type is not sold |

## Form

An HTML page linked from the footer, from the basket and from the order summary, downloadable or printable, and sent with the order confirmation. Headings stay headings, numbered articles are `h2`. Accessible like any page.

---

PUBLISHABLE TEXT

---

# Conditions générales de vente

Dernière mise à jour : [date]

## 1. Objet et champ d'application

Les présentes conditions générales de vente régissent les ventes conclues sur le site [adresse du site] entre [dénomination du vendeur] (« le vendeur ») et toute personne physique agissant à des fins qui n'entrent pas dans le cadre de son activité professionnelle (« le client »).

Elles sont accessibles à tout moment sur le site, peuvent être téléchargées et imprimées, et sont jointes à l'e-mail de confirmation de commande.

## 2. Vendeur

[Dénomination], [forme juridique], [adresse du siège ou de l'établissement], [immatriculation : registre et numéro], [numéro de TVA, si assujetti].
Téléphone : [numéro]. Adresse électronique : [adresse]. [Adresse pour les réclamations, si différente : …]

Les mentions légales complètes figurent sur la page Mentions légales ([lien vers la page]).

## 3. Produits et services

Les caractéristiques essentielles de chaque [produit / contenu numérique / service] sont présentées sur sa page. [Pour les contenus et services numériques : fonctionnalités, compatibilité et interopérabilité, telles que décrites par le vendeur.]

## 4. Prix

Les prix sont indiqués en euros, toutes taxes comprises. Les frais de livraison et tout autre frais sont indiqués avant la commande : [mode de calcul ou montant]. [Pour un abonnement : le coût total par période de facturation est de [montant] par [période].]

[Uniquement si le prix est personnalisé sur la base d'une prise de décision automatisée : le prix proposé a été personnalisé sur la base d'une prise de décision automatisée.]

## 5. Commande, paiement et livraison

### 5.1 Étapes de la commande

Le client sélectionne [les produits / l'offre], vérifie le récapitulatif de sa commande, peut corriger toute erreur de saisie à l'aide des liens « Modifier », puis passe commande en cliquant sur le bouton « Commande avec obligation de paiement ». [Langue(s) proposée(s) pour la conclusion du contrat : …]

Le vendeur accuse réception de la commande par voie électronique et adresse au client la confirmation du contrat sur un support durable (e-mail) [au plus tard au moment de la livraison / avant le début de l'exécution du service]. [Le contrat est archivé par le vendeur et accessible au client : [comment] / Le contrat n'est pas archivé par le vendeur.]

### 5.2 Paiement

Moyens de paiement acceptés : [liste]. Le paiement est exigible [à la commande / autre]. Le paiement est traité par [prestataire de paiement], selon les modalités applicables au parcours de paiement utilisé.

### 5.3 Livraison

Zones de livraison : [zones]. Restrictions de livraison : [restrictions, ou « aucune »]. Délai de livraison : [délai ou date]. [Pour les contenus numériques : modalités de fourniture.]

## 6. Droit de rétractation

### 6.1 Information sur le droit de rétractation

[Insérer ici, sans le reformuler, le texte du modèle d'information figurant à l'annexe de l'article R. 221-3 du code de la consommation, copié depuis Légifrance dans sa version en vigueur à la date de publication, et complété uniquement aux endroits indiqués par ses notes (identité et coordonnées du vendeur, point de départ du délai selon ce qui est vendu, frais de retour, emplacement de la fonction de rétractation).]

### 6.2 Fonction de rétractation en ligne

Le client peut se rétracter en ligne à l'aide de la fonction « Renoncer au contrat ici », disponible [en bas de chaque page du site et sur chaque commande de l'espace client] pendant toute la durée du délai de rétractation. Il y indique ou confirme son nom, les éléments permettant d'identifier le contrat et l'adresse électronique à laquelle la confirmation lui sera envoyée, puis valide à l'aide du bouton « Confirmer la rétractation ». Le vendeur lui adresse un accusé de réception sur un support durable, reprenant le contenu de sa déclaration ainsi que la date et l'heure de son envoi.

Le client peut aussi se rétracter par toute autre déclaration dénuée d'ambiguïté, notamment par courrier ou par e-mail à [adresse], ou au moyen du formulaire de rétractation.

### 6.3 Contenus numériques fournis immédiatement

[À CONFIRMER : clause applicable uniquement si, pour ces contenus, le parcours de commande recueille par une case distincte non cochée par défaut le consentement exprès du client à l'exécution avant la fin du délai de rétractation et sa reconnaissance de la perte de son droit de rétractation, et si l'e-mail de confirmation reprend cet accord. À défaut, supprimer cette clause : le droit de rétractation s'applique.]
Pour [liste des contenus numériques sans support matériel], le droit de rétractation ne peut être exercé lorsque l'exécution a commencé avant la fin du délai de rétractation, après que le client a donné son consentement préalable et exprès, a reconnu qu'il perdra son droit de rétractation, et que le vendeur lui a fourni la confirmation de cet accord.

### 6.4 Services pleinement exécutés

[À CONFIRMER : clause applicable uniquement aux services pleinement exécutés avant la fin du délai de rétractation, dont l'exécution a commencé à la demande préalable et expresse du client avec reconnaissance de la perte de son droit, recueillies par le parcours de commande. Un abonnement en cours n'est pas un service pleinement exécuté. À défaut, supprimer cette clause.]
Pour [liste des services], le droit de rétractation ne peut être exercé une fois le service pleinement exécuté, si l'exécution a commencé avec l'accord préalable et exprès du client et sa reconnaissance de la perte de son droit de rétractation. [Si le client se rétracte après avoir demandé que l'exécution commence pendant le délai : montant proportionnel dû, selon le modèle d'information de l'article 6.1.]

### 6.5 Services fournis à une date ou une période déterminée

[À CONFIRMER : clause applicable uniquement si le vendeur confirme que la prestation est un service d'hébergement autre que résidentiel, de transport de biens, de location de voitures, de restauration ou d'activité de loisirs fourni à une date ou une période déterminée. À défaut, supprimer cette clause.]
Pour [liste des prestations et leurs dates], le droit de rétractation ne peut être exercé, conformément à l'article L. 221-28 du code de la consommation.

### 6.6 Autres cas

[À CONFIRMER : autre exception de l'article L. 221-28 du code de la consommation, nommée par le vendeur et validée par son conseil, avec les produits concernés. À défaut, supprimer cette clause.]

Lorsque le droit de rétractation ne s'applique pas à un produit, cette information figure également sur sa page et dans le récapitulatif de commande.

## 7. Remboursement

En cas de rétractation, le vendeur rembourse le client dans les conditions et délais indiqués à l'article 6.1. [Politique de remboursement commerciale supplémentaire du vendeur, le cas échéant.]

## 8. Abonnements

[Bloc à supprimer si aucun abonnement n'est vendu.]

### 8.1 Durée et renouvellement

L'abonnement est conclu pour [durée] [et se renouvelle par tacite reconduction pour [durée] / est à durée indéterminée]. [Durée minimale d'engagement : …]

[Si la reconduction est tacite :] Le vendeur informe le client par écrit, dans le délai prévu par l'article L. 215-1 du code de la consommation, de la possibilité de ne pas reconduire le contrat, avec la date limite de non-reconduction dans un encadré apparent. À défaut, le client peut résilier gratuitement le contrat à tout moment à compter de la date de reconduction.

### 8.2 Essai

[Uniquement si un essai est proposé :] L'essai dure [durée]. À son terme, l'abonnement payant de [montant] par [période] commence [automatiquement / sur action du client]. Le client peut y mettre fin avant cette date [comment].

### 8.3 Résiliation

Le client peut résilier son abonnement en ligne, gratuitement, à l'aide de la fonction « [libellé de la fonction de résiliation du site] » accessible [emplacement]. Le vendeur accuse réception de la notification et informe le client, sur un support durable, de la date à laquelle la résiliation prend effet. [Préavis éventuel : …]

### 8.4 Modification de l'abonnement

[Modalités choisies par le vendeur et validées par son conseil, en distinguant changement imposé par la loi, évolution du service, changement de prix et modification substantielle ouvrant au client un droit de résiliation.]

## 9. Garanties

### 9.1 Garanties légales

Le client bénéficie de la garantie légale de conformité [et, pour les biens, de la garantie des vices cachés : mention à valider par le conseil du vendeur], que les présentes conditions ne peuvent ni exclure ni limiter.

### 9.2 Biens

[Bloc à supprimer si aucun bien n'est vendu. Rappel des conditions de mise en œuvre de la garantie légale de conformité des biens, rédigé ou validé par le conseil du vendeur.]

### 9.3 Contenus et services numériques

[Bloc à supprimer si aucun contenu ou service numérique n'est vendu. Rappel des conditions de mise en œuvre de la garantie légale de conformité des contenus et services numériques, rédigé ou validé par le conseil du vendeur.]

### 9.4 Garantie commerciale et service après-vente

[Uniquement si le vendeur en propose : contenu, durée, étendue, coordonnées.]

## 10. Responsabilité

[Clause choisie par le vendeur et validée par son conseil, dans les limites autorisées par la loi. Elle ne peut pas priver le client des droits que la loi lui reconnaît.]

## 11. Données personnelles

Le traitement des données personnelles liées aux commandes est décrit dans la politique de confidentialité ([lien vers la page]).

## 12. Accessibilité du service

[Uniquement pour un service soumis aux exigences d'accessibilité du code de la consommation : informations sur la manière dont le service satisfait à ces exigences, ou lien vers le document équivalent, voir le modèle « accessibility-information-eaa ».]

## 13. Réclamations et médiation

Pour toute réclamation, le client peut contacter le vendeur à [adresse ou formulaire].

En cas de litige, le client peut recourir gratuitement au médiateur de la consommation dont relève le vendeur : [nom du médiateur], [adresse du site du médiateur], [adresse postale du médiateur].

## 14. Droit applicable

[Clause rédigée ou validée par le conseil du vendeur. Elle ne peut pas priver le client consommateur de la protection que lui assurent les dispositions impératives de la loi de son pays de résidence, ni lui imposer une juridiction choisie par le vendeur.]

---

Ces conditions ont été préparées avec l'aide d'un outil d'IA et approuvées par [dénomination du vendeur]. [Supprimer cette ligne uniquement à la demande du vendeur ; l'étape d'approbation reste obligatoire.]
