/* Mairie de Valmont-sur-Aure - site d'exemple (version fautive : défauts introduits volontairement, voir expected-defects.json).
   JavaScript sans dépendance. Exemples du projet eu-web-compliance (MIT). */
(function () {
  'use strict';

  var MOTIF_COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var TAILLE_MAX = 5 * 1024 * 1024;

  function tableau(liste) {
    return Array.prototype.slice.call(liste);
  }

  function sansAccent(texte) {
    return texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* ---------- Validation des formulaires ---------- */

  function decritPar(element, idErreur, ajouter) {
    var ids = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (id) {
      return id && id !== idErreur;
    });
    if (ajouter) {
      ids.push(idErreur);
    }
    if (ids.length) {
      element.setAttribute('aria-describedby', ids.join(' '));
    } else {
      element.removeAttribute('aria-describedby');
    }
  }

  function poserErreur(cible, ancre, message) {
    var idErreur = cible.id + '-erreur';
    var existante = document.getElementById(idErreur);
    if (existante) {
      existante.parentNode.removeChild(existante);
    }
    decritPar(cible, idErreur, Boolean(message));
    var champs = cible.tagName === 'FIELDSET' ? tableau(cible.querySelectorAll('input[type="text"]')) : [cible];
    champs.forEach(function (champ) {
      if (message) {
        champ.setAttribute('aria-invalid', 'true');
      } else {
        champ.removeAttribute('aria-invalid');
      }
    });
    if (!message) {
      return;
    }
    var erreur = document.createElement('p');
    erreur.className = 'erreur';
    erreur.id = idErreur;
    erreur.textContent = 'Erreur : ' + message;
    ancre.parentNode.insertBefore(erreur, ancre);
  }

  function messageChamp(champ) {
    var valeur = champ.value.trim();
    if (champ.type === 'checkbox') {
      return champ.required && !champ.checked ? champ.dataset.msgObligatoire : '';
    }
    if (champ.type === 'file') {
      var fichier = champ.files && champ.files[0];
      if (!fichier) {
        return champ.required ? champ.dataset.msgObligatoire : '';
      }
      if (!/\.(pdf|jpe?g|png)$/i.test(fichier.name)) {
        return champ.dataset.msgFormat;
      }
      return fichier.size > TAILLE_MAX ? champ.dataset.msgTaille : '';
    }
    if (champ.required && valeur === '') {
      return champ.dataset.msgObligatoire;
    }
    if (valeur !== '' && champ.type === 'email' && !MOTIF_COURRIEL.test(valeur)) {
      return champ.dataset.msgFormat;
    }
    if (valeur !== '' && champ.dataset.motif && !new RegExp(champ.dataset.motif).test(valeur)) {
      return champ.dataset.msgFormat;
    }
    return '';
  }

  function messageDate(groupe) {
    var jour = groupe.querySelector('[data-partie="jour"]').value.trim();
    var mois = groupe.querySelector('[data-partie="mois"]').value.trim();
    var annee = groupe.querySelector('[data-partie="annee"]').value.trim();
    if (jour === '' && mois === '' && annee === '') {
      return groupe.dataset.msgObligatoire;
    }
    var valide = /^\d{1,2}$/.test(jour) && /^\d{1,2}$/.test(mois) && /^\d{4}$/.test(annee);
    if (valide) {
      var date = new Date(Number(annee), Number(mois) - 1, Number(jour));
      valide = date.getFullYear() === Number(annee) &&
        date.getMonth() === Number(mois) - 1 &&
        date.getDate() === Number(jour) &&
        date.getTime() <= Date.now();
    }
    return valide ? '' : groupe.dataset.msgFormat;
  }

  function afficherResume(resume, erreurs) {
    var liste = resume.querySelector('ul');
    liste.textContent = '';
    erreurs.forEach(function (erreur) {
      var item = document.createElement('li');
      var lien = document.createElement('a');
      lien.href = '#' + erreur.cible.id;
      lien.textContent = erreur.message;
      lien.addEventListener('click', function (evenement) {
        evenement.preventDefault();
        erreur.cible.focus();
      });
      item.appendChild(lien);
      liste.appendChild(item);
    });
    resume.hidden = erreurs.length === 0;
    if (erreurs.length) {
      resume.focus();
    }
  }

  /* Contrôle les champs visibles d'une zone, écrit un message par erreur près
     du champ, le relie par aria-describedby, puis liste les erreurs dans un
     résumé qui reçoit le focus. Renvoie true si la zone est valide. */
  function validerZone(zone, resume) {
    var erreurs = [];
    var controles = zone.querySelectorAll('input, fieldset[data-groupe-obligatoire], fieldset[data-date]');
    tableau(controles).forEach(function (controle) {
      var message;
      if (controle.disabled || controle.closest('[hidden]')) {
        return;
      }
      if (controle.hasAttribute('data-date')) {
        message = messageDate(controle);
        poserErreur(controle, controle.querySelector('.date-champs'), message);
        if (message) {
          erreurs.push({ cible: controle.querySelector('input'), message: message });
        }
        return;
      }
      if (controle.tagName === 'FIELDSET') {
        var radios = tableau(controle.querySelectorAll('input[type="radio"]'));
        message = radios.some(function (radio) { return radio.checked; }) ? '' : controle.dataset.msgObligatoire;
        poserErreur(controle, controle.querySelector('.choix'), message);
        if (message) {
          erreurs.push({ cible: radios[0], message: message });
        }
        return;
      }
      if (controle.type === 'radio' || controle.closest('fieldset[data-date]')) {
        return;
      }
      message = messageChamp(controle);
      poserErreur(controle, controle.closest('.compteur') || controle, message);
      if (message) {
        erreurs.push({ cible: controle, message: message });
      }
    });
    afficherResume(resume, erreurs);
    return erreurs.length === 0;
  }

  /* ---------- Accueil : suivi d'une demande ---------- */

  function initSuivi() {
    var formulaire = document.getElementById('suivi-form');
    if (!formulaire) {
      return;
    }
    var statut = document.getElementById('suivi-statut');
    formulaire.addEventListener('submit', function (evenement) {
      evenement.preventDefault();
      statut.textContent = '';
      if (validerZone(formulaire, formulaire.querySelector('.resume-erreurs'))) {
        statut.textContent = 'Démonstration : aucun dossier n’est enregistré sur ce site d’exemple et rien n’a été transmis.';
      }
    });
  }

  /* ---------- Démarche : nombre d'exemplaires ---------- */

  function initCompteur() {
    var champ = document.getElementById('exemplaires');
    if (!champ) {
      return;
    }
    var statut = document.getElementById('exemplaires-statut');

    function modifier(pas) {
      var valeur = parseInt(champ.value, 10);
      if (isNaN(valeur)) {
        valeur = 1;
      }
      valeur = Math.min(5, Math.max(1, valeur + pas));
      champ.value = String(valeur);
      statut.textContent = valeur + (valeur > 1 ? ' exemplaires' : ' exemplaire');
    }

    document.getElementById('exemplaires-moins').addEventListener('click', function () {
      modifier(-1);
    });
    document.getElementById('exemplaires-plus').addEventListener('click', function () {
      modifier(1);
    });
  }

  /* ---------- Démarche : formulaire en plusieurs étapes ---------- */

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

  /* ---------- Recherche ---------- */

  function initRecherche() {
    var formulaire = document.getElementById('recherche-form');
    if (!formulaire) {
      return;
    }
    var champ = document.getElementById('q');
    var compte = document.getElementById('compte');
    var resultats = tableau(document.querySelectorAll('#resultats li'));

    function chercher() {
      var requete = champ.value.trim();
      var mots = sansAccent(requete).split(/\s+/).filter(Boolean);
      var total = 0;
      resultats.forEach(function (resultat) {
        var texte = sansAccent(resultat.textContent + ' ' + (resultat.dataset.motsCles || ''));
        var trouve = mots.every(function (mot) {
          return texte.indexOf(mot) !== -1;
        });
        resultat.hidden = !trouve;
        if (trouve) {
          total += 1;
        }
      });
      /* role="status" : le décompte est annoncé sans déplacer le focus. */
      if (requete === '') {
        compte.textContent = total + ' pages référencées.';
      } else if (total === 0) {
        compte.textContent = 'Aucun résultat pour « ' + requete + ' ». Vérifiez l’orthographe ou essayez un mot plus général.';
      } else {
        compte.textContent = total + (total > 1 ? ' résultats' : ' résultat') + ' pour « ' + requete + ' ».';
      }
    }

    formulaire.addEventListener('submit', function (evenement) {
      evenement.preventDefault();
      chercher();
    });

    var initiale = new URLSearchParams(window.location.search).get('q');
    if (initiale) {
      champ.value = initiale;
      chercher();
    }
  }

  /* ---------- Onglets ---------- */

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

  initSuivi();
  initCompteur();
  initDemarche();
  initRecherche();
  initOnglets();
  initAccordeon();
  initPlan();
}());
