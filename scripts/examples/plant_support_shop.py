"""Rebuilds examples/support-shop/faulty from fixed and plants the AI and consumer-law defects.
Usage: python scripts/examples/plant_support_shop.py examples
Run it after any change to fixed/: faulty/ is generated, never edited by hand.
The defects are listed in examples/support-shop/expected-content.json; each comment below gives
the id of the entry it plants."""
import shutil
import sys
from pathlib import Path

if len(sys.argv) != 2:
    sys.exit("usage: python scripts/examples/plant_support_shop.py examples")
site = Path(sys.argv[1]) / "support-shop"
fixed, faulty = site / "fixed", site / "faulty"
# faulty/ is deleted below: refuse unless the folder given is really the examples folder.
if not fixed.is_dir():
    sys.exit(f"usage: {fixed} not found; give the examples folder of the skill")
if faulty.exists():
    shutil.rmtree(faulty)
shutil.copytree(fixed, faulty)


def edit(name, pairs):
    path = faulty / name
    text = path.read_text(encoding="utf-8")
    for old, new in pairs:
        if text.count(old) != 1:
            raise SystemExit(f"{name}: expected exactly one occurrence of {old[:70]!r}, found {text.count(old)}")
        text = text.replace(old, new)
    path.write_bytes(text.encode("utf-8"))


def add_file(name, text):
    path = faulty / name
    if path.exists():
        raise SystemExit(f"{name}: already exists in fixed/")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(text.encode("utf-8"))


GREETING = ('data-greeting="Bonjour, je suis Lumi, l\'assistant d\'intelligence artificielle (IA) de Cirelune. Je suis un programme '
            'informatique, pas une personne. Je peux vous aider pour les commandes, la livraison et les retours. Mes réponses peuvent '
            'être fausses : vérifiez les informations importantes dans nos conditions générales de vente."')
BADGE = '            <span class="ai-badge"><span class="ai-badge__mark" aria-hidden="true">IA</span> Pas une personne</span>\n'
NOTICE = """          <div class="ai-chat__notice" id="ai-chat-notice">
            <p><strong>Vous échangez avec un assistant d'intelligence artificielle, pas avec une personne.</strong> Ses réponses sont produites automatiquement et peuvent être fausses.</p>
            <p>Ne saisissez ici ni mot de passe ni coordonnées bancaires. Ce que vous écrivez sert à vous répondre : voir notre <a href="confidentialite.html#assistant">politique de confidentialité</a> et <a href="ia.html">notre utilisation de l'IA</a>.</p>
            <p>Vous préférez une personne ? <a href="aide.html#equipe">Écrire à notre équipe</a> (réponse sous deux jours ouvrés).</p>
          </div>

"""
FOOTER_WITHDRAWAL = '      <p class="footer-withdrawal"><a href="retractation.html">Renoncer au contrat ici</a></p>\n'

# ------------------------------------------------------------------ index.html
edit("index.html", [
    # SS-C-01 chat widget with no AI notice at all: no notice, no badge, neutral title, greeting and
    #         labels without the word IA, launcher that does not say it opens an AI assistant
    ("          Discuter avec notre assistant IA\n", "          Poser une question\n"),
    ('data-assistant-label="Assistant IA"', 'data-assistant-label="Cirelune"'),
    (GREETING, 'data-greeting="Bonjour ! Que puis-je faire pour vous ?"'),
    ('<h3 class="ai-chat__title" id="ai-chat-title">Lumi, assistant IA</h3>', '<h3 class="ai-chat__title" id="ai-chat-title">Une question ?</h3>'),
    (BADGE, ''),
    (NOTICE, ''),
    ('aria-describedby="ai-chat-notice"', ''),
    ("<label for=\"ai-chat-input\">Votre message à l'assistant IA</label>", '<label for="ai-chat-input">Votre message</label>'),
    ("<button type=\"button\" class=\"ai-chat__close\">Fermer l'assistant</button>", '<button type="button" class="ai-chat__close">Fermer</button>'),
    # SS-C-02 decline link worded to make the visitor feel guilty
    ('<a href="#selection">Non merci</a>', '<a href="#selection">Non merci, je préfère payer plein tarif</a>'),
])

# ------------------------------------------------------------------- aide.html
edit("aide.html", [
    # SS-C-03 the notice is removed from the widget; AI is only mentioned in the page introduction,
    #         and the assistant presents itself as a human-sounding advisor
    ('<p class="lead">Commandes, livraison, retours : trouvez une réponse ou écrivez-nous.</p>',
     '<p class="lead">Commandes, livraison, retours : trouvez une réponse ou écrivez-nous. Nos réponses en ligne sont produites par intelligence artificielle.</p>'),
    ("          Discuter avec notre assistant IA\n", "          Discuter avec Lumi\n"),
    ('data-assistant-label="Assistant IA"', 'data-assistant-label="Lumi"'),
    (GREETING, 'data-greeting="Bonjour, je suis Lumi, votre conseillère. Je peux vous aider pour les commandes, la livraison et les retours."'),
    ('<h3 class="ai-chat__title" id="ai-chat-title">Lumi, assistant IA</h3>', '<h3 class="ai-chat__title" id="ai-chat-title">Lumi, votre conseillère</h3>'),
    (BADGE, ''),
    (NOTICE, ''),
    ('aria-describedby="ai-chat-notice"', ''),
    ("<label for=\"ai-chat-input\">Votre message à l'assistant IA</label>", '<label for="ai-chat-input">Votre message à Lumi</label>'),
    # SS-H-01 (not scored) the fixed answer to "are you a human?" claims to be a person
    ('data-identity-answer="Non, je ne suis pas une personne. Je suis un assistant d\'intelligence artificielle (IA), un programme informatique. '
     'Si vous préférez parler à une personne, utilisez le lien « Écrire à notre équipe » en haut de cette discussion."',
     'data-identity-answer="Oui, je suis Lumi, une vraie personne de notre service client."'),
])

# ----------------------------------------------------------------- produit.html
edit("produit.html", [
    # SS-C-04 the assistant's messages are announced as "Lumi:", without the word IA
    ('data-assistant-label="Assistant IA"', 'data-assistant-label="Lumi"'),
    (GREETING, 'data-greeting="Bonjour, je suis Lumi. Je peux vous aider pour les commandes, la livraison et les retours."'),
    # SS-C-05 AI-generated product photo without any label (badge and caption removed)
    ('          <span class="ai-badge"><span class="ai-badge__mark" aria-hidden="true">IA</span> Générée<span class="visually-hidden"> image</span></span>\n', ''),
    ("""          <strong>Image générée par IA.</strong> La pièce et la table ne sont pas réelles. La bougie montrée est celle que nous vendons : même verre, même couleur, même taille.
          <a href="ia.html">Notre utilisation de l'IA</a>
""", """          La bougie Brume de figuier dans un salon.
"""),
    # SS-C-06 reduction announced without the prior price (struck price with no label, no reference)
    ('        <p class="c-price-prior">Prix le plus bas pratiqué avant la réduction : <s>30,00 €</s></p>\n', '        <p><s>30,00 €</s></p>\n'),
    ('      <p><a href="cgv.html#prix">Comment ce prix de référence est calculé</a></p>\n', ''),
    # SS-C-07 scarcity message that does not come from stock data
    ('<p id="stock">En stock, expédiée sous deux jours ouvrés.</p>', '<p id="stock">Plus que 2 en stock ! Expédiée sous deux jours ouvrés.</p>'),
])

# ---------------------------------------------------------------- produits.html
edit("produits.html", [
    # SS-C-08 countdown that starts again at 09:59 on every load (js/compte-a-rebours.js)
    ('<p class="notice-box" id="soldes">Soldes d\'automne jusqu\'au 30 novembre 2026 à 23 h 59, heure de Paris.</p>',
     '<p class="notice-box countdown" id="soldes">Fin des soldes dans <span id="soldes-temps">10:00</span> !</p>'),
    ('  <script src="consent/consent.js" defer></script>\n',
     '  <script src="consent/consent.js" defer></script>\n  <script src="js/compte-a-rebours.js" defer></script>\n'),
    # SS-C-09 reduction badge and struck price without the prior-price wording (gift box)
    ("""            <p class="c-price-current"><span class="visually-hidden">Prix actuel : </span>39,00 €</p>
            <p class="c-price-prior"><span class="visually-hidden">Prix le plus bas pratiqué avant la réduction : </span><s>52,00 €</s></p>""",
     """            <p class="c-price-current"><span class="visually-hidden">Prix actuel : </span>39,00 €</p>
            <p><span class="visually-hidden">Prix conseillé : </span><s>52,00 €</s></p>"""),
])
add_file("js/compte-a-rebours.js", """/* Faulty version: a sales countdown that restarts from ten minutes on every page load. */
(function () {
  'use strict';
  var left = 600;
  var output = document.getElementById('soldes-temps');
  function show() {
    output.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
  }
  show();
  window.setInterval(function () {
    left = left > 0 ? left - 1 : 0;
    show();
  }, 1000);
}());
""")

# ------------------------------------------------------------------ panier.html
edit("panier.html", [
    # SS-C-10 means of payment and delivery restrictions no longer shown at the start of the order
    ("""      <section class="notice-box" id="avant-commande" aria-labelledby="avant-commande-titre">
        <h2 id="avant-commande-titre">Avant de commander</h2>
        <p>Moyens de paiement acceptés : carte bancaire (Visa, Mastercard) et virement bancaire.</p>
        <p>Livraison : nous livrons uniquement en France métropolitaine, en Belgique et au Luxembourg. Pas de livraison en point relais.</p>
      </section>

""", ''),
    # SS-C-11 paid insurance ticked by default
    ('<input type="checkbox" id="opt-assurance" name="assurance" value="oui">', '<input type="checkbox" id="opt-assurance" name="assurance" value="oui" checked>'),
])

# ---------------------------------------------------------------- commande.html
edit("commande.html", [
    # SS-C-12 order button that does not say the order entails an obligation to pay
    ('class="c-button c-button--primary">Commande avec obligation de paiement</button>', 'class="c-button c-button--primary">Valider ma commande</button>'),
    # SS-C-13 newsletter and partner offers ticked by default
    ("""          <input type="checkbox" id="lettre" name="lettre" value="oui">
          <label for="lettre">Recevoir la lettre d'information mensuelle (facultatif)</label>""",
     """          <input type="checkbox" id="lettre" name="lettre" value="oui" checked>
          <label for="lettre">Recevoir la lettre d'information et les offres de nos partenaires</label>"""),
])

# ------------------------------------------------------------- retractation.html
edit("retractation.html", [
    # SS-C-14 the confirmation button says "send my request" instead of "confirmer la rétractation"
    #         (data-text removed, otherwise the script would restore the legal label)
    ('<button type="submit" class="c-button c-button--primary" data-text="confirmLabel">Confirmer la rétractation</button>',
     '<button type="submit" class="c-button c-button--primary">Envoyer ma demande</button>'),
    # SS-C-15 a mandatory reason field added to the statement
    ("""            <p class="c-alert" data-wd-send-error role="alert"></p>""",
     """            <div class="c-field">
              <label for="wd-reason">Motif de la rétractation</label>
              <select id="wd-reason" name="reason" required>
                <option value="">Choisir un motif</option>
                <option>Le produit ne me plaît pas</option>
                <option>Le produit est abîmé</option>
              </select>
            </div>

            <p class="c-alert" data-wd-send-error role="alert"></p>"""),
])

# ---------------------------------------------------------------------- cgv.html
# SS-C-16 the withdrawal function is missing from the footer of this page
edit("cgv.html", [(FOOTER_WITHDRAWAL, '')])

# ---------------------------------------------------------- confidentialite.html
# SS-C-17 the footer entry uses a wording that is not the legal label
edit("confidentialite.html", [(FOOTER_WITHDRAWAL, '      <p class="footer-withdrawal"><a href="retractation.html">Retourner un article</a></p>\n')])

# ------------------------------------------------------------------ cookies.html
# SS-C-18 no link to the legal notice from this page
edit("cookies.html", [('          <li><a href="mentions-legales.html">Mentions légales</a></li>\n', '')])

# --------------------------------------------------------- mentions-legales.html
edit("mentions-legales.html", [
    # SS-C-19 the host block is missing
    ("""      <h2 id="hebergeur">Hébergeur</h2>
      <p>Le site est hébergé par Hébergement Exemple SAS (fictive), 1 avenue des Serveurs, 00000 Exempleville, France, téléphone : <a href="tel:+33000000001">+33 0 00 00 00 01</a>.</p>

""", ''),
    # SS-C-20 link to the former EU online dispute resolution platform presented as a mention
    ("""      <h2>Nous contacter</h2>""",
     """      <p>Plateforme européenne de règlement en ligne des litiges : <a href="https://ec.europa.eu/consumers/odr/">ec.europa.eu/consumers/odr</a>.</p>

      <h2>Nous contacter</h2>"""),
])

print(f"faulty tree rebuilt: {faulty}")
