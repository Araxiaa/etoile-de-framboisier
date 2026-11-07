/* ==========================================================================
   PAGES — construit une page à partir de ses sections (texte en blocs + composants).
   Données : window.PAGES_TEXTE[<identifiant de la page>] (base en ligne, ou js/data/pages.js).
   Une page HTML contient : #p-kicker, #p-titre, #p-intro, #rail et #corps.
   ========================================================================== */
window.Donnees.pret(function () {
    'use strict';
    var e = window.Riche.esc;
    var id = document.body.getAttribute('data-contenu');
    var P = (window.PAGES_TEXTE || {})[id];
    var corps = document.getElementById('corps');
    if (!P || !corps) return;

    var KICKERS = {
        personnalite: 'Qui il est', physique: 'À quoi il ressemble', soins: 'Sous l’œil de la guérisseuse',
        histoire: 'Lune après lune', relations: 'Autour de lui', galerie: 'Vu par les artistes', regne: 'Meneur du Tonnerre'
    };
    function poser(sel, texte) { var el = document.getElementById(sel); if (el) el.textContent = texte; }
    poser('p-kicker', P.kicker || KICKERS[id] || '');
    poser('p-titre', P.titre || '');
    poser('p-intro', P.intro || '');
    if (P.titre) document.title = P.titre + ' — Étoile de Framboisier';

    function slug(s, i) {
        return String(s.id || s.titre || 'section-' + i).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section-' + i;
    }

    var visibles = (P.sections || []).filter(function (s) {
        return !s.masque && ((s.blocs && s.blocs.length) || (s.composant && window.Composants.existe(s.composant)));
    });

    corps.innerHTML = visibles.map(function (s, i) {
        return '<section class="bloc-section" id="' + slug(s, i) + '">' +
            '<header>' + (s.surtitre ? '<span class="main">' + e(s.surtitre) + '</span>' : '') + '<h2>' + e(s.titre) + '</h2></header>' +
            (s.blocs && s.blocs.length ? '<div class="contenu-texte">' + window.Riche.html(s.blocs) + '</div>' : '') +
            (s.composant ? '<div class="contenu-composant" data-composant="' + e(s.composant) + '"></div>' : '') +
        '</section>';
    }).join('');

    Array.prototype.forEach.call(corps.querySelectorAll('[data-composant]'), function (el) {
        window.Composants.monter(el.getAttribute('data-composant'), el);
    });

    // Sommaire des sections (colonne de gauche, puces sur petit écran)
    var rail = document.getElementById('rail');
    var page = document.querySelector('.page');
    if (rail && visibles.length > 1) {
        rail.innerHTML = '<span class="etiquette">Dans cette page</span><ol>' + visibles.map(function (s, i) {
            return '<li><a href="#' + slug(s, i) + '">' + e(s.titre) + '</a></li>';
        }).join('') + '</ol>';
        var liens = Array.prototype.slice.call(rail.querySelectorAll('a'));
        var secs = Array.prototype.slice.call(corps.querySelectorAll('.bloc-section'));
        function majActif() {
            var actif = 0;
            secs.forEach(function (sec, i) { if (sec.getBoundingClientRect().top < window.innerHeight * 0.4) actif = i; });
            liens.forEach(function (a, i) { a.classList.toggle('actif', i === actif); });
        }
        window.addEventListener('scroll', majActif, { passive: true });
        majActif();
    } else {
        if (rail) rail.hidden = true;
        if (page) page.classList.add('sans-rail');
    }

    // Adresse directe vers une section
    if (location.hash) {
        var cible = document.getElementById(location.hash.slice(1));
        if (cible) setTimeout(function () { cible.scrollIntoView(); }, 60);
    }
    window.dispatchEvent(new CustomEvent('page-prete'));
});
