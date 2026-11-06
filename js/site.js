/* ==========================================================================
   SITE — menu, pied de page, onglets, thème : écrits une seule fois pour toutes les pages.
   Pour ajouter une page au menu : ajouter une ligne dans PAGES.
   Chaque ligne : [fichier, nom dans le menu, identifiant, phrase de présentation]
   (la phrase sert aux cartes de l'accueil).
   ========================================================================== */
(function () {
    'use strict';

    var PAGES = [
        ['index.html',    'Accueil',      'accueil',  ''],
        ['lui.html',      'Le Meneur',    'lui',      'Son caractère, son physique, ses neuf vies et ses blessures.'],
        ['regne.html',    'Le règne',     'regne',    'Sa charte, sa diplomatie, sa foi et ses actes de meneur.'],
        ['histoire.html', 'Son histoire', 'histoire', 'La chronique de sa vie et le journal des lunes.'],
        ['monde.html',    'Son monde',    'monde',    'Sa lignée, ses relations et la diplomatie du clan.'],
        ['galerie.html',  'Galerie',      'galerie',  'Les illustrations faites par les artistes.']
    ];
    window.PAGES_SITE = PAGES;

    // Son visage : le logo du site
    var ICONE_ETOILE = '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#7A4A2B" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="M9 30c-4-9-1-19 7-18 6 1 10 6 11 11z" fill="#F0B568"/><path d="M55 30c4-9 1-19-7-18-6 1-10 6-11 11z" fill="#F0B568"/><path d="M13 24c0-4 2-7 5-7 2 0 4 2 5 5z" fill="#FFE2C4" stroke-width="1.6"/><path d="M51 24c0-4-2-7-5-7-2 0-4 2-5 5z" fill="#FFE2C4" stroke-width="1.6"/><path d="M32 17c15 0 25 9 25 21 0 11-10 19-25 19S7 49 7 38c0-12 10-21 25-21z" fill="#FFF3E0"/><path d="M21 35c0-6 5-10 11-10s11 4 11 10c0 8-5 14-11 14s-11-6-11-14z" fill="#F0B568" stroke="none"/></g><g stroke="#7A4A2B" stroke-width="2" stroke-linecap="round" fill="none"><path d="M26 49c2 3 4 3 6 0 2 3 4 3 6 0"/></g><ellipse cx="24" cy="36" rx="5.2" ry="5.6" fill="#43BEE3" stroke="#7A4A2B" stroke-width="1.8"/><ellipse cx="40" cy="36" rx="5.2" ry="5.6" fill="#43BEE3" stroke="#7A4A2B" stroke-width="1.8"/><ellipse cx="24.5" cy="36.5" rx="2.2" ry="3" fill="#6B3A22"/><ellipse cx="39.5" cy="36.5" rx="2.2" ry="3" fill="#6B3A22"/><circle cx="23" cy="34" r="1.3" fill="#fff"/><circle cx="38.5" cy="34" r="1.3" fill="#fff"/><path d="M29.5 43.2h5l-2.5 3z" fill="#F4A9A0" stroke="#7A4A2B" stroke-width="1.2" stroke-linejoin="round"/><g fill="#B56A9C" stroke="#7A4A2B" stroke-width="1.3"><circle cx="52" cy="22" r="3.4"/><circle cx="56" cy="27" r="3"/><circle cx="50" cy="28" r="2.8"/></g></svg>';
    var ICONE_MENU =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    var ICONE_LUNE =
        '<svg class="i-lune" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
    var ICONE_SOLEIL =
        '<svg class="i-soleil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

    // Filtre « aquarelle » : bords irréguliers pour les taches de couleur (classe .lavis)
    var defs = document.createElement('div');
    defs.setAttribute('aria-hidden', 'true');
    defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    defs.innerHTML =
        '<svg width="0" height="0"><filter id="aquarelle" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="8" result="b"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="b" scale="70"/></filter></svg>';
    document.body.insertBefore(defs, document.body.firstChild);

    var courante = document.body.getAttribute('data-page');

    // ---------- En-tête ----------
    var liens = PAGES.map(function (p) {
        var actif = p[2] === courante ? ' aria-current="page"' : '';
        return '<li><a href="' + p[0] + '"' + actif + '>' + p[1] + '</a></li>';
    }).join('');

    var entete = document.getElementById('entete');
    if (entete) {
        entete.className = 'site-header';
        entete.innerHTML =
            '<a class="lien-evitement" href="#contenu">Aller au contenu</a>' +
            '<div class="barre">' +
                '<a class="marque" href="index.html">' + ICONE_ETOILE + 'Étoile de Framboisier</a>' +
                '<nav aria-label="Navigation principale"><ul class="menu" id="menu-principal">' + liens + '</ul></nav>' +
                '<button class="bouton-rond bouton-theme" type="button" aria-label="Changer de thème">' + ICONE_LUNE + ICONE_SOLEIL + '</button>' +
                '<button class="bouton-rond bouton-menu" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu-principal">' + ICONE_MENU + '</button>' +
            '</div>';

        var boutonMenu = entete.querySelector('.bouton-menu');
        boutonMenu.addEventListener('click', function () {
            var ouvert = entete.classList.toggle('ouvert');
            boutonMenu.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
        });

        entete.querySelector('.bouton-theme').addEventListener('click', function () {
            var sombre = document.documentElement.getAttribute('data-theme') !== 'dark';
            document.documentElement.setAttribute('data-theme', sombre ? 'dark' : 'light');
            try { localStorage.setItem('theme', sombre ? 'dark' : 'light'); } catch (e) {}
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', sombre ? '#0E1A19' : '#F5EFDF');
        });
    }

    // ---------- Pied de page ----------
    var pied = document.getElementById('pied');
    if (pied) {
        pied.className = 'site-footer';
        pied.innerHTML =
            '<p class="devise-pied">« Le roc au regard d’azur »</p>' +
            '<p>Codex d’Étoile de Framboisier — Créé pour <em>@.araxia.</em></p>' +
            '<p>Inspiré de <em>@Oriyakii</em></p>' +
            (courante === 'accueil'
                ? '<a class="acces-cache" href="admin.html" aria-label="Accès administrateur" title="Dashboard">' + ICONE_ETOILE + '</a>'
                : '');
    }

    // ---------- Onglets (sous-pages) ----------
    // Un conteneur [data-onglets] dont chaque enfant .onglet-panneau a un id et un data-titre.
    // L'adresse (#caractere…) permet d'ouvrir directement un onglet.
    var hote = document.querySelector('[data-onglets]');
    if (hote) {
        var panneaux = Array.prototype.slice.call(hote.children).filter(function (p) {
            return p.classList.contains('onglet-panneau');
        });
        var barre = document.createElement('div');
        barre.className = 'onglets-barre';
        barre.setAttribute('role', 'tablist');
        var boutons = panneaux.map(function (p, i) {
            var b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('role', 'tab');
            b.id = 'onglet-' + p.id;
            b.setAttribute('aria-controls', p.id);
            b.textContent = p.getAttribute('data-titre');
            b.addEventListener('click', function () { choisir(i, true); });
            barre.appendChild(b);
            p.setAttribute('role', 'tabpanel');
            p.setAttribute('aria-labelledby', b.id);
            return b;
        });
        hote.insertBefore(barre, panneaux[0]);

        var courant = -1;
        var choisir = function (i, maj) {
            if (i < 0 || i >= panneaux.length) i = 0;
            panneaux.forEach(function (p, k) {
                p.hidden = k !== i;
                boutons[k].setAttribute('aria-selected', k === i ? 'true' : 'false');
                boutons[k].tabIndex = k === i ? 0 : -1;
            });
            if (maj && courant !== i) {
                history.replaceState(null, '', '#' + panneaux[i].id);
                var haut = barre.getBoundingClientRect().top + window.scrollY - 90;
                if (window.scrollY > haut) window.scrollTo({ top: haut });
            }
            courant = i;
            window.dispatchEvent(new CustomEvent('onglet-change', { detail: panneaux[i].id }));
        };
        barre.addEventListener('keydown', function (e) {
            var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (!d) return;
            var n = (courant + d + panneaux.length) % panneaux.length;
            choisir(n, true);
            boutons[n].focus();
        });
        var depuisAdresse = function () {
            var id = location.hash.replace('#', '');
            var i = panneaux.findIndex(function (p) { return p.id === id; });
            choisir(i < 0 ? 0 : i, false);
        };
        window.addEventListener('hashchange', depuisAdresse);
        depuisAdresse();
    }

    // ---------- Animations ----------
    // Retirer ce bloc pour supprimer toutes les animations du site.
    var feuille = document.createElement('link');
    feuille.rel = 'stylesheet';
    feuille.href = 'css/animations.css';
    document.head.appendChild(feuille);

    var anim = document.createElement('script');
    anim.src = 'js/animations.js';
    document.body.appendChild(anim);
})();
