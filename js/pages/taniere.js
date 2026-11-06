/* La tanière — textes d'accroche, fiche, charte et mur des lunes.
   Données : js/data/textes.js, vies.js, lunes.js (ou la base Supabase). */
window.Donnees.pret(function () {
    'use strict';
    var O = window.Outils;
    var e = O.esc;
    var T = (window.TEXTES && window.TEXTES.accueil) || {};

    function texte(id, v) { var el = document.getElementById(id); if (el && v) el.textContent = v; }
    texte('hero-fonction', T.fonction);
    texte('hero-devise', T.devise ? '« ' + T.devise + ' »' : '');
    texte('charte-titre', T.charte_titre);
    texte('charte-intro', T.charte_intro);

    // Ses neuf vies, en petits points sous le titre
    var cible = document.getElementById('compteur-vies');
    if (cible && window.VIES) cible.innerHTML = O.compteurVies(window.VIES);

    // Fiche rapide : des autocollants
    var galets = document.getElementById('fiche-galets');
    if (galets && T.fiche) {
        galets.innerHTML = T.fiche.map(function (f) {
            return '<li class="galet"><span>' + e(f.label) + '</span><strong>' + e(f.valeur) + '</strong></li>';
        }).join('');
    }

    // La charte, sur les plaquettes de la planche d'écorce
    var articles = document.getElementById('charte-articles');
    if (articles && T.charte) {
        articles.innerHTML = T.charte.map(function (a) {
            return '<li class="article">' +
                '<span class="article-num" aria-hidden="true">' + e(a.num) + '</span>' +
                '<h3>' + e(a.titre) + '</h3>' +
                (a.sous ? '<p class="article-sous">' + e(a.sous) + '</p>' : '') +
                '<p>' + e(a.texte) + '</p>' +
            '</li>';
        }).join('');
    }

    // Le mur des lunes : des petits mots collés au ruban adhésif
    var mur = document.getElementById('mur');
    var L = window.LUNES || [];
    if (mur && L.length) {
        mur.innerHTML = L.map(function (s) {
            var teinte = ['azur', 'sauge', 'roux', 'framboise'].indexOf(s.teinte) >= 0 ? s.teinte : 'sauge';
            return '<article class="souvenir ' + teinte + '">' +
                '<span class="epingle" aria-hidden="true"></span>' +
                (s.image ? '<img class="souvenir-image" src="' + O.urlPhoto(s.image) + '" alt="" loading="lazy">' : '') +
                '<span class="souvenir-lune">' + e(s.lune) + '</span>' +
                '<h3>' + e(s.titre) + '</h3>' +
                (s.texte ? '<p>' + e(s.texte) + '</p>' : '') +
            '</article>';
        }).join('');
        var pas = function () { var c = mur.querySelector('.souvenir'); return c ? c.offsetWidth + 28 : 300; };
        document.getElementById('mur-prec').addEventListener('click', function () { mur.scrollBy({ left: -pas(), behavior: 'smooth' }); });
        document.getElementById('mur-suiv').addEventListener('click', function () { mur.scrollBy({ left: pas(), behavior: 'smooth' }); });
        mur.addEventListener('keydown', function (ev) {
            if (ev.key === 'ArrowRight') mur.scrollBy({ left: pas(), behavior: 'smooth' });
            else if (ev.key === 'ArrowLeft') mur.scrollBy({ left: -pas(), behavior: 'smooth' });
        });
        Array.prototype.forEach.call(mur.querySelectorAll('img'), function (img) {
            img.addEventListener('error', function () { img.remove(); });
        });
    }
});
