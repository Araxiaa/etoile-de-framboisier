/* ==========================================================================
   DONNÉES — va chercher le contenu dans Supabase (table « contenus »).
   Si la base est injoignable (hors ligne, panne…), le site garde les valeurs
   des fichiers js/data/*.js : il ne reste jamais vide.
   Les scripts de page s'écrivent  Donnees.pret(function () { ... })  pour attendre.
   ========================================================================== */
(function () {
    'use strict';

    var C = window.SITE_CONFIG;
    var CLES = { relations: 'RELATIONS', vies: 'VIES', journal: 'JOURNAL', galerie: 'GALERIE', lignee: 'LIGNEE', lunes: 'LUNES', diplomatie: 'DIPLOMATIE', actions: 'ACTIONS', blessures: 'BLESSURES',
                 accueil: 'ACCUEIL', charte: 'CHARTE', physique_fiche: 'FICHE_PHYSIQUE' };
    var attente = [];
    var fini = false;

    function terminer() {
        fini = true;
        attente.splice(0).forEach(function (f) { f(); });
    }

    window.Donnees = {
        pret: function (f) { if (fini) f(); else attente.push(f); }
    };

    if (!C || !C.url || !window.fetch) { terminer(); return; }

    var ctrl = window.AbortController ? new AbortController() : null;
    var delai = setTimeout(function () { if (ctrl) ctrl.abort(); }, 3500);

    fetch(C.url + '/rest/v1/contenus?select=cle,valeur', {
        headers: { apikey: C.cle },
        signal: ctrl ? ctrl.signal : undefined
    })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (lignes) {
            lignes.forEach(function (l) {
                if (l.valeur == null) return;
                if (CLES[l.cle]) window[CLES[l.cle]] = l.valeur;
                // les textes des pages : page par page, pour qu'une page absente de la base garde sa copie de secours
                else if (l.cle === 'pages') window.PAGES_TEXTE = Object.assign({}, window.PAGES_TEXTE, l.valeur);
            });
        })
        .catch(function () { /* on garde js/data/*.js */ })
        .then(function () { clearTimeout(delai); terminer(); });
})();
