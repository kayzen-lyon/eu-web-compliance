"""Rebuilds examples/public-service-fr/faulty from fixed and plants the defects.
Usage: python scripts/examples/plant_fr.py examples
Run it after any change to fixed/: faulty/ is generated, never edited by hand."""
import re
import shutil
import sys
from pathlib import Path

site = Path(sys.argv[1]) / "public-service-fr"
fixed, faulty = site / "fixed", site / "faulty"
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


def section(text, start, end, new):
    a = text.index(start)
    b = text.index(end)
    return text[:a] + new + text[b:]


HELP = '      <p class="aide"><a href="infos-pratiques.html#panneau-contact">Aide et contact</a></p>\n'

# ------------------------------------------------------------------ index.html
text = (faulty / "index.html").read_text(encoding="utf-8")
a = text.index('<ul class="actus">')
b = text.index("</ul>", a)
# list whose children are not list items
actus = text[a:b].replace("<li>", '<div class="actu">').replace("</li>", "</div>")
text = text[:a] + actus + text[b:]
(faulty / "index.html").write_bytes(text.encode("utf-8"))
edit("index.html", [
    # no skip link
    ('  <a class="lien-evitement" href="#contenu">Aller au contenu</a>\n\n', ''),
    # no h1
    ('<h1>Bienvenue à Valmont-sur-Aure</h1>', '<p class="titre-page">Bienvenue à Valmont-sur-Aure</p>'),
    # decorative image with a noisy alternative
    ('<img src="img/picto-document.svg" width="48" height="48" alt="">', '<img src="img/picto-document.svg" width="48" height="48" alt="pictogramme document">'),
    # link whose only content is an image with an empty alternative
    ('''        <img src="img/picto-telephone.svg" width="32" height="32" alt="">
        <span>Accueil de la mairie&nbsp;:</span>
        <a href="tel:+33261910000">02&nbsp;61&nbsp;91&nbsp;00&nbsp;00</a>
''', '''        <span>Accueil de la mairie&nbsp;: 02&nbsp;61&nbsp;91&nbsp;00&nbsp;00</span>
        <a href="tel:+33261910000"><img src="img/picto-telephone.svg" width="32" height="32" alt=""></a>
'''),
    # scrolling text
    ('<p class="en-bref">En bref&nbsp;: marché de producteurs tous les jeudis matin, place de la Halle. Collecte des encombrants le premier lundi du mois.</p>',
     '<marquee class="en-bref" scrollamount="4">En bref&nbsp;: marché de producteurs tous les jeudis matin, place de la Halle. Collecte des encombrants le premier lundi du mois.</marquee>'),
    # image without alt
    ('<img src="img/actu-bibliotheque.svg" width="320" height="200" alt="Dessin de la façade de la bibliothèque : un bâtiment bas à trois grandes fenêtres et une porte centrale.">',
     '<img src="img/actu-bibliotheque.svg" width="320" height="200">'),
    # English passage without lang
    ('<p lang="en">Welcome to', '<p>Welcome to'),
    # memory test instead of a pasteable code
    ('<p>Saisissez le numéro de dossier et le code de suivi reçus par courriel. Les deux champs sont obligatoires.</p>',
     '<p>Saisissez le numéro de dossier reçu par courriel, puis deux caractères de votre code de suivi. Tous les champs sont obligatoires.</p>'),
    ('''          <div class="champ">
            <label for="code-suivi">Code de suivi</label>
            <span class="indication" id="code-indication">Vous pouvez le coller ou laisser votre gestionnaire de mots de passe le remplir.</span>
            <input type="password" id="code-suivi" name="code" autocomplete="current-password" aria-describedby="code-indication" required data-msg-obligatoire="Saisissez votre code de suivi">
          </div>
''', '''          <fieldset class="caracteres">
            <legend>Code de suivi&nbsp;: saisissez son 2<sup>e</sup> et son 5<sup>e</sup> caractère</legend>
            <div class="date-champs">
              <div class="champ">
                <label for="code-2">2<sup>e</sup> caractère</label>
                <input type="password" id="code-2" name="code-2" maxlength="1" autocomplete="off" required data-msg-obligatoire="Saisissez le 2e caractère de votre code de suivi">
              </div>
              <div class="champ">
                <label for="code-5">5<sup>e</sup> caractère</label>
                <input type="password" id="code-5" name="code-5" maxlength="1" autocomplete="off" required data-msg-obligatoire="Saisissez le 5e caractère de votre code de suivi">
              </div>
            </div>
          </fieldset>
'''),
])

# ---------------------------------------------------------- demarche-acte.html
edit("demarche-acte.html", [
    # breadcrumb named by an id that does not exist
    ('<nav class="fil conteneur" aria-label="Fil d’Ariane">', '<nav class="fil conteneur" aria-labelledby="titre-fil">'),
    # time limit without warning
    ('      <ol class="etapes">', '      <p class="session">Pour votre sécurité, votre session expire au bout de 15 minutes.</p>\n\n      <ol class="etapes">'),
    # current step shown by colour only
    ('<li aria-current="step">Votre demande</li>', '<li class="active">Votre demande</li>'),
    ('<h2 tabindex="-1">Étape 1 sur 4&nbsp;: votre demande</h2>', '<h2 tabindex="-1">Votre demande</h2>'),
    ('<h2 tabindex="-1">Étape 2 sur 4&nbsp;: personne concernée par l’acte</h2>', '<h2 tabindex="-1">Personne concernée par l’acte</h2>'),
    ('<h2 tabindex="-1">Étape 3 sur 4&nbsp;: vos coordonnées</h2>', '<h2 tabindex="-1">Vos coordonnées</h2>'),
    ('<h2 tabindex="-1">Étape 4 sur 4&nbsp;: vérification</h2>', '<h2 tabindex="-1">Vérification</h2>'),
    # generic error message, no focus, no field identified
    ('''        <div class="resume-erreurs" id="resume-erreurs" tabindex="-1" hidden>
          <h2>Le formulaire contient des erreurs</h2>
          <ul></ul>
        </div>
''', '''        <div class="resume-erreurs" id="resume-erreurs" hidden>
          <p>Le formulaire contient des erreurs.</p>
        </div>
'''),
    # fieldset without legend
    ('<legend>Type d’acte (obligatoire)</legend>', '<p class="pseudo-legende">Type d’acte (obligatoire)</p>'),
    # label not associated
    ('<label for="nom">Nom de naissance (obligatoire)</label>', '<label>Nom de naissance (obligatoire)</label>'),
    # expected date format not given
    ('<fieldset id="naissance" data-date aria-describedby="naissance-indication" data-msg-obligatoire', '<fieldset id="naissance" data-date data-msg-obligatoire'),
    ('            <span class="indication" id="naissance-indication">Par exemple&nbsp;: 27 3 1985</span>\n', ''),
    # duplicate id
    ('<label for="demandeur-prenom">Votre prénom (obligatoire)</label>', '<label for="prenom">Votre prénom (obligatoire)</label>'),
    ('<input type="text" id="demandeur-prenom" name="demandeur-prenom"', '<input type="text" id="prenom" name="demandeur-prenom"'),
    # email without autocomplete
    ('<input type="email" id="courriel" name="courriel" autocomplete="email" ', '<input type="email" id="courriel" name="courriel" '),
    # upload replaced by a clickable div
    ('<input type="file" id="piece" name="piece" accept=".pdf,.jpg,.jpeg,.png" aria-describedby="piece-indication"',
     '<div class="depot" onclick="document.getElementById(\'piece\').click()">Choisir un fichier</div>\n            <input type="file" class="depot-natif" id="piece" name="piece" accept=".pdf,.jpg,.jpeg,.png" aria-describedby="piece-indication"'),
    # email asked a second time
    ('''          <dl class="recap" id="recap"></dl>
''', '''          <dl class="recap" id="recap"></dl>
          <div class="champ">
            <label for="courriel-confirmation">Adresse électronique de réception de l’acte (obligatoire)</label>
            <input type="email" id="courriel-confirmation" name="courriel-confirmation" autocomplete="email" required>
          </div>
'''),
])

# -------------------------------------------------------------- recherche.html
edit("recherche.html", [
    # help link moved from the header to the footer
    (HELP + '      <nav class="menu"', '      <nav class="menu"'),
    ('  <footer class="pied">\n    <div class="conteneur">\n', '  <footer class="pied">\n    <div class="conteneur">\n' + HELP),
    # icon-only button without a name
    ('\n              <span class="visuellement-cache">Lancer la recherche</span>', ''),
    # result count not announced
    ('<p class="statut" id="compte" role="status">', '<p class="statut" id="compte">'),
])

# -------------------------------------------------------- infos-pratiques.html
text = (faulty / "infos-pratiques.html").read_text(encoding="utf-8")
a = text.index('<table class="horaires">')
b = text.index("</table>", a)
# header cells without scope in a table with two header rows
table = re.sub(r' scope="(colgroup|col|row)"', "", text[a:b])
text = text[:a] + table + text[b:]
a = text.index("      <details>")
b = text.index("      <h2>Le carillon de la mairie</h2>")
# accordion that does not expose its state
items = re.findall(r"<summary>(.*?)</summary>\s*<p>(.*?)</p>", text[a:b], re.S)
assert len(items) == 3
accordion = '      <div class="accordeon">\n'
for question, answer in items:
    accordion += f'''        <div class="accordeon-item">
          <h3><button type="button" class="accordeon-titre">{question}</button></h3>
          <div class="accordeon-panneau" hidden>
            <p>{answer}</p>
          </div>
        </div>
'''
accordion += "      </div>\n\n"
text = text[:a] + accordion + text[b:]
(faulty / "infos-pratiques.html").write_bytes(text.encode("utf-8"))
edit("infos-pratiques.html", [
    # invalid language code
    ('<html lang="fr">', '<html lang="français">'),
    # tabs outside a tablist
    ('<div class="onglets-liste" role="tablist" aria-labelledby="titre-onglets">', '<div class="onglets-liste">'),
    # map that only moves by dragging
    ('Le plan ci-dessous défile horizontalement et verticalement, à la souris, au doigt ou au clavier.', 'Faites glisser le plan pour le déplacer.'),
    ('<div class="plan" role="region" aria-label="Plan du centre-ville, zone défilante" tabindex="0">', '<div class="plan">'),
    # sound that starts by itself and cannot be stopped
    ('''      <audio controls preload="none" src="media/carillon.wav">
        <a href="media/carillon.wav">Télécharger l’extrait sonore (WAV, 40&nbsp;Ko)</a>
      </audio>
''', '''      <audio autoplay loop src="media/carillon.wav"></audio>
'''),
])

# ---------------------------------------------------------- accessibilite.html
edit("accessibilite.html", [
    # no title element
    ('  <title>Déclaration d’accessibilité (page d’exemple) – Mairie de Valmont-sur-Aure</title>\n', ''),
])

# ------------------------------------------------------------------------ CSS
css = (faulty / "css" / "site.css").read_text(encoding="utf-8")
css = css.replace("(version corrigée)", "(version fautive : défauts introduits volontairement, voir expected-defects.json)")
css += '''
/* ---- Les règles ci-dessous n'existent que dans la version fautive ---- */

.titre-page {
  margin: 0 0 0.75rem;
  font-size: 2.125rem;
  font-weight: 700;
  line-height: 1.2;
}

.alerte {
  height: 4.5rem;
  overflow: hidden;
}

.demarches a:focus,
.demarches a:focus-visible {
  outline: none;
}

.actus .date {
  color: #9aa3a8;
}

.pseudo-legende {
  font-weight: 700;
}

.session {
  font-weight: 600;
}

.etapes li.active {
  color: #0f5c5c;
}

.compteur {
  gap: 2px;
}

.compteur button {
  width: 16px;
  min-width: 0;
  height: 16px;
  min-height: 0;
  border-width: 1px;
}

.compteur button svg {
  width: 8px;
  height: 8px;
}

.depot {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  color: var(--sarcelle-fonce);
  font-weight: 600;
  border: 2px solid var(--sarcelle);
  border-radius: 0.25rem;
  cursor: pointer;
}

.depot-natif {
  display: none !important;
}

.recherche-form {
  min-width: 40rem;
}

.aide-recherche {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  margin: 0;
  padding: 1.75rem 1rem;
  border-top: 2px solid var(--encre);
}

.plan {
  overflow: hidden;
  cursor: grab;
  touch-action: none;
}

.plan img {
  pointer-events: none;
  user-select: none;
}

.accordeon h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.accordeon-titre {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  font: inherit;
  font-weight: 600;
  text-align: left;
  color: var(--encre);
  background: var(--fond);
  border: 1px solid var(--trait);
  border-radius: 0.25rem;
  cursor: pointer;
}

.accordeon-panneau {
  padding: 0 1rem 0.5rem;
}
'''
(faulty / "css" / "site.css").write_bytes(css.encode("utf-8"))

# ------------------------------------------------------------------------- JS
js = (faulty / "js" / "site.js").read_text(encoding="utf-8")
js = js.replace("(version corrigée)", "(version fautive : défauts introduits volontairement, voir expected-defects.json)")

js = section(js, "  /* ---------- Démarche : formulaire en plusieurs étapes ---------- */", "  /* ---------- Recherche ---------- */", '''  /* ---------- Démarche : formulaire en plusieurs étapes ---------- */

  function initDemarche() {
    var formulaire = document.getElementById('demarche');
    if (!formulaire) {
      return;
    }
    var etapes = tableau(formulaire.querySelectorAll('.etape'));
    var reperes = tableau(document.querySelectorAll('.etapes li'));
    var resume = document.getElementById('resume-erreurs');
    var confirmation = document.getElementById('confirmation');
    var memePersonne = document.getElementById('meme-personne');
    var courante = 0;

    function champ(nom) {
      return document.getElementById(nom) || formulaire.elements[nom];
    }

    function valeur(nom) {
      return champ(nom).value.trim();
    }

    function reporterIdentite() {
      if (memePersonne.checked) {
        formulaire.elements['demandeur-nom'].value = valeur('nom');
        formulaire.elements['demandeur-prenom'].value = valeur('prenom');
      }
    }

    function remplirRecap() {
      var acte = formulaire.querySelector('input[name="acte"]:checked');
      var fichier = document.getElementById('piece').files[0];
      var lignes = [
        ['Type d’acte', acte ? acte.parentNode.querySelector('label').textContent : ''],
        ['Nombre d’exemplaires', valeur('exemplaires')],
        ['Personne concernée', valeur('prenom') + ' ' + valeur('nom')],
        ['Date de naissance', [valeur('naissance-jour'), valeur('naissance-mois'), valeur('naissance-annee')].join('/')],
        ['Commune de naissance', valeur('commune')],
        ['Demandeur', formulaire.elements['demandeur-prenom'].value + ' ' + valeur('demandeur-nom')],
        ['Adresse électronique', valeur('courriel')],
        ['Téléphone', valeur('telephone') || 'Non renseigné'],
        ['Pièce d’identité', fichier ? fichier.name : '']
      ];
      var recap = document.getElementById('recap');
      recap.textContent = '';
      lignes.forEach(function (ligne) {
        var terme = document.createElement('dt');
        var description = document.createElement('dd');
        terme.textContent = ligne[0];
        description.textContent = ligne[1];
        recap.appendChild(terme);
        recap.appendChild(description);
      });
    }

    function etapeValide(etape) {
      var valide = true;
      var radios = tableau(etape.querySelectorAll('input[type="radio"]'));
      var date = etape.querySelector('fieldset[data-date]');
      tableau(etape.querySelectorAll('input')).forEach(function (controle) {
        var saisie = controle.value.trim();
        if (controle.type === 'radio') {
          return;
        }
        if (controle.type === 'checkbox') {
          valide = valide && !(controle.required && !controle.checked);
          return;
        }
        if (controle.required && saisie === '') {
          valide = false;
        }
        if (controle.type === 'email' && saisie !== '' && !MOTIF_COURRIEL.test(saisie)) {
          valide = false;
        }
      });
      if (radios.length && !radios.some(function (radio) { return radio.checked; })) {
        valide = false;
      }
      if (date && messageDate(date) !== '') {
        valide = false;
      }
      return valide;
    }

    function afficher(numero) {
      courante = numero;
      etapes.forEach(function (etape, position) {
        etape.hidden = position !== numero;
      });
      reperes.forEach(function (repere, position) {
        repere.classList.toggle('active', position === numero);
      });
      resume.hidden = true;
      if (numero === 2) {
        reporterIdentite();
      }
      if (numero === 3) {
        remplirRecap();
      }
    }

    function avancer() {
      if (!etapeValide(etapes[courante])) {
        resume.hidden = false;
        return;
      }
      if (courante < etapes.length - 1) {
        afficher(courante + 1);
        return;
      }
      formulaire.hidden = true;
      document.querySelector('.etapes').hidden = true;
      confirmation.hidden = false;
    }

    tableau(formulaire.querySelectorAll('.continuer')).forEach(function (bouton) {
      bouton.addEventListener('click', avancer);
    });
    tableau(formulaire.querySelectorAll('.precedent')).forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        afficher(courante - 1);
      });
    });
    formulaire.addEventListener('submit', function (evenement) {
      evenement.preventDefault();
      avancer();
    });
    memePersonne.addEventListener('change', reporterIdentite);

    /* Limite de temps : au bout de 15 minutes, la saisie est effacée. */
    window.setTimeout(function () {
      formulaire.reset();
      afficher(0);
      resume.querySelector('p').textContent = 'Votre session a expiré. Recommencez votre saisie.';
      resume.hidden = false;
    }, 15 * 60 * 1000);

    afficher(0);
  }

''')

a = js.index("  /* ---------- Onglets (modèle WAI-ARIA APG, activation automatique) ---------- */")
b = js.index("  initSuivi();")
js = js[:a] + '''  /* ---------- Onglets ---------- */

  function initOnglets() {
    var onglets = tableau(document.querySelectorAll('.onglets-liste [role="tab"]'));

    function activer(onglet) {
      onglets.forEach(function (autre) {
        var actif = autre === onglet;
        autre.setAttribute('aria-selected', actif ? 'true' : 'false');
        autre.tabIndex = actif ? 0 : -1;
        document.getElementById(autre.getAttribute('aria-controls')).hidden = !actif;
      });
    }

    onglets.forEach(function (onglet) {
      onglet.addEventListener('click', function () {
        activer(onglet);
      });
    });

    function selonAncre() {
      var id = window.location.hash.slice(1);
      onglets.forEach(function (onglet) {
        if (id && onglet.getAttribute('aria-controls') === id) {
          activer(onglet);
        }
      });
    }

    window.addEventListener('hashchange', selonAncre);
    selonAncre();
  }

  /* ---------- Accordéon ---------- */

  function initAccordeon() {
    tableau(document.querySelectorAll('.accordeon-titre')).forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        var panneau = bouton.parentNode.nextElementSibling;
        panneau.hidden = !panneau.hidden;
      });
    });
  }

  /* ---------- Plan : déplacement par glisser ---------- */

  function initPlan() {
    var plan = document.querySelector('.plan');
    var depart = null;
    if (!plan) {
      return;
    }
    plan.addEventListener('pointerdown', function (evenement) {
      depart = { x: evenement.clientX + plan.scrollLeft, y: evenement.clientY + plan.scrollTop };
      plan.setPointerCapture(evenement.pointerId);
    });
    plan.addEventListener('pointermove', function (evenement) {
      if (depart) {
        plan.scrollLeft = depart.x - evenement.clientX;
        plan.scrollTop = depart.y - evenement.clientY;
      }
    });
    plan.addEventListener('pointerup', function () {
      depart = null;
    });
  }

''' + js[b:]
js = js.replace("  initOnglets();\n", "  initOnglets();\n  initAccordeon();\n  initPlan();\n")
(faulty / "js" / "site.js").write_bytes(js.encode("utf-8"))
print("public-service-fr faulty rebuilt")
