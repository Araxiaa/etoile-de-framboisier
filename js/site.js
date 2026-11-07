/* ==========================================================================
   SITE — en-tête, navigation, pied de page et thème, écrits une seule fois pour toutes les pages.
   Pour ajouter une page au menu : ajouter une ligne dans PAGES.
   Chaque ligne : [fichier, nom dans le menu, identifiant (data-page de la page)]
   ========================================================================== */
(function () {
    'use strict';

    var PAGES = [
        ['personnalite.html', 'Personnalité', 'personnalite'],
        ['physique.html',     'Physique',     'physique'],
        ['histoire.html',     'Histoire',     'histoire'],
        ['relations.html',    'Relations',    'relations'],
        ['galerie.html',      'Galerie',      'galerie'],
        ['regne.html',        'Le règne',     'regne']
    ];

    // Son visage : le logo du site
    var VISAGE = '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#7A4A2B" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="M9 30c-4-9-1-19 7-18 6 1 10 6 11 11z" fill="#F0B568"/><path d="M55 30c4-9 1-19-7-18-6 1-10 6-11 11z" fill="#F0B568"/><path d="M13 24c0-4 2-7 5-7 2 0 4 2 5 5z" fill="#FFE2C4" stroke-width="1.6"/><path d="M51 24c0-4-2-7-5-7-2 0-4 2-5 5z" fill="#FFE2C4" stroke-width="1.6"/><path d="M32 17c15 0 25 9 25 21 0 11-10 19-25 19S7 49 7 38c0-12 10-21 25-21z" fill="#FFF3E0"/><path d="M21 35c0-6 5-10 11-10s11 4 11 10c0 8-5 14-11 14s-11-6-11-14z" fill="#F0B568" stroke="none"/></g><g stroke="#7A4A2B" stroke-width="2" stroke-linecap="round" fill="none"><path d="M26 49c2 3 4 3 6 0 2 3 4 3 6 0"/></g><ellipse cx="24" cy="36" rx="5.2" ry="5.6" fill="#43BEE3" stroke="#7A4A2B" stroke-width="1.8"/><ellipse cx="40" cy="36" rx="5.2" ry="5.6" fill="#43BEE3" stroke="#7A4A2B" stroke-width="1.8"/><ellipse cx="24.5" cy="36.5" rx="2.2" ry="3" fill="#6B3A22"/><ellipse cx="39.5" cy="36.5" rx="2.2" ry="3" fill="#6B3A22"/><circle cx="23" cy="34" r="1.3" fill="#fff"/><circle cx="38.5" cy="34" r="1.3" fill="#fff"/><path d="M29.5 43.2h5l-2.5 3z" fill="#F4A9A0" stroke="#7A4A2B" stroke-width="1.2" stroke-linejoin="round"/><g fill="#B56A9C" stroke="#7A4A2B" stroke-width="1.3"><circle cx="52" cy="22" r="3.4"/><circle cx="56" cy="27" r="3"/><circle cx="50" cy="28" r="2.8"/></g></svg>';
    var LUNE = '<svg class="i-lune" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
    var SOLEIL = '<svg class="i-soleil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    var MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    window.VISAGE_SVG = VISAGE;

    var courante = document.body.getAttribute('data-page');

    var entete = document.getElementById('entete');
    if (entete) {
        entete.className = 'site-header';
        entete.innerHTML =
            '<a class="lien-evitement" href="#contenu">Aller au contenu</a>' +
            '<div class="barre">' +
                '<a class="marque" href="index.html">' + VISAGE + 'Étoile de Framboisier</a>' +
                '<nav aria-label="Navigation principale"><ul class="menu" id="menu-principal">' +
                    PAGES.map(function (p) { return '<li><a href="' + p[0] + '"' + (p[2] === courante ? ' aria-current="page"' : '') + '>' + p[1] + '</a></li>'; }).join('') +
                '</ul></nav>' +
                '<button class="bouton-rond bouton-theme" type="button" aria-label="Passer du jour à la nuit">' + LUNE + SOLEIL + '</button>' +
                '<button class="bouton-rond bouton-menu" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu-principal">' + MENU + '</button>' +
            '</div>';
        var bm = entete.querySelector('.bouton-menu');
        bm.addEventListener('click', function () {
            var ouvert = entete.classList.toggle('ouvert');
            bm.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
        });
        entete.querySelector('.bouton-theme').addEventListener('click', function () {
            var sombre = document.documentElement.getAttribute('data-theme') !== 'dark';
            document.documentElement.setAttribute('data-theme', sombre ? 'dark' : 'light');
            try { localStorage.setItem('theme', sombre ? 'dark' : 'light'); } catch (e) {}
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', sombre ? '#1B1829' : '#FBF5EA');
        });
    }

    var pied = document.getElementById('pied');
    if (pied) {
        pied.className = 'site-footer';
        pied.innerHTML =
            '<p class="devise-pied">« Le roc au regard d’azur »</p>' +
            '<p>Codex d’Étoile de Framboisier — Créé pour <em>@.araxia.</em></p>' +
            '<p>Inspiré de <em>@Oriyakii</em></p>' +
            '<a class="acces-cache" href="admin.html" aria-label="Accès administrateur" title="Dashboard">' + VISAGE + '</a>';
    }

    // Animations (pétales de freesia, lucioles, apparition). Retirer ce bloc pour tout couper.
    var feuille = document.createElement('link');
    feuille.rel = 'stylesheet';
    feuille.href = 'css/animations.css';
    document.head.appendChild(feuille);
    var anim = document.createElement('script');
    anim.src = 'js/animations.js';
    document.body.appendChild(anim);
})();
