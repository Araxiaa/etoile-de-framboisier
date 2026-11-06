/* ==========================================================================
   SCÈNE — la tanière : chaque objet (ou bouton du sommaire) ouvre un tiroir.
   Adresse : #ciel ouvre le tiroir « ciel », #ciel/etoiles ouvre son onglet « etoiles ».
   Pour ajouter un objet : un groupe [data-ouvre="nom"] dans le dessin (index.html)
   et une section id="t-nom" dans la zone des tiroirs.
   ========================================================================== */
(function () {
    'use strict';

    var ouvert = null;       // tiroir actuellement ouvert
    var retour = null;       // l'élément qui l'a ouvert (le focus y revient)

    function tiroir(nom) { return document.getElementById('t-' + nom); }

    function majAdresse(nom, onglet) {
        var h = nom ? '#' + nom + (onglet ? '/' + onglet : '') : location.pathname + location.search;
        try { history.replaceState(null, '', h); } catch (e) {}
    }

    function ouvrir(nom, onglet, source) {
        var t = tiroir(nom);
        if (!t) return;
        if (ouvert && ouvert !== t) ouvert.hidden = true;
        ouvert = t;
        if (source) retour = source;
        t.hidden = false;
        document.body.classList.add('tiroir-ouvert');
        var corps = t.querySelector('.tiroir-corps');
        if (corps) corps.scrollTop = 0;
        var hote = t.querySelector('[data-onglets]');
        if (hote && hote.choisirOnglet) hote.choisirOnglet(onglet || '');
        if (hote && !onglet) hote.choisirOnglet(hote.querySelector('.onglet-panneau').id);
        majAdresse(nom, onglet || (hote ? hote.querySelector('.onglet-panneau:not([hidden])').id : ''));
        var titre = t.querySelector('h2');
        if (titre) { titre.setAttribute('tabindex', '-1'); titre.focus({ preventScroll: true }); }
        window.dispatchEvent(new CustomEvent('tiroir-ouvert', { detail: nom }));
    }

    function fermer() {
        if (!ouvert) return;
        ouvert.hidden = true;
        ouvert = null;
        document.body.classList.remove('tiroir-ouvert');
        majAdresse('');
        if (retour && retour.focus) { try { retour.focus({ preventScroll: true }); } catch (e) {} }
    }

    // Un clic (ou Entrée / Espace) sur un objet de la scène ou du sommaire
    document.addEventListener('click', function (ev) {
        var cible = ev.target.closest ? ev.target.closest('[data-ouvre]') : null;
        if (cible) { ev.preventDefault(); ouvrir(cible.getAttribute('data-ouvre'), '', cible); return; }
        if (ev.target.closest && ev.target.closest('[data-ferme]')) { ev.preventDefault(); fermer(); return; }
        if (ev.target.closest && ev.target.closest('[data-accueil]')) { ev.preventDefault(); fermer(); window.scrollTo({ top: 0 }); }
    });
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && ouvert && !document.querySelector('dialog[open]')) { fermer(); return; }
        if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('g[data-ouvre]')) {
            ev.preventDefault();
            ouvrir(ev.target.getAttribute('data-ouvre'), '', ev.target);
        }
    });

    // Quand on change d'onglet dans un tiroir, l'adresse suit
    window.addEventListener('onglet-change', function (ev) {
        var d = ev.detail;
        if (!d || !d.signaler || !ouvert) return;
        majAdresse(ouvert.id.replace(/^t-/, ''), d.id);
        var corps = ouvert.querySelector('.tiroir-corps');
        if (corps) corps.scrollTo({ top: 0 });
    });

    // Adresse directe : #ciel  ou  #ciel/etoiles
    function depuisAdresse() {
        var h = location.hash.replace('#', '').split('/');
        if (h[0] && tiroir(h[0])) { if (!ouvert || ouvert.id !== 't-' + h[0]) ouvrir(h[0], h[1] || ''); }
        else if (ouvert) { ouvert.hidden = true; ouvert = null; document.body.classList.remove('tiroir-ouvert'); }
    }
    window.addEventListener('hashchange', depuisAdresse);
    depuisAdresse();

    // Le panorama (petits écrans) démarre centré sur le nid
    var defile = document.querySelector('.scene-defile');
    if (defile) defile.scrollLeft = (defile.scrollWidth - defile.clientWidth) / 2;
})();
