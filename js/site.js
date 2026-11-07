/* ==========================================================================
   SITE — le chef d'orchestre : routes (#page/section), menus, recherche, thème, accueil.
   Les textes viennent de PAGES_TEXTE (dashboard → « Pages et textes »).
   Pour ajouter une page au menu : ajouter une ligne dans PAGES (identifiant, nom, accroche).
   ========================================================================== */
(function () {
    'use strict';
    var O = window.Outils, e = O.esc;
    var PAGES = [
        ['personnalite', 'Personnalité', 'Qui il est vraiment, derrière le regard d’azur'],
        ['physique', 'Physique', 'Son apparence, ses cicatrices et son dossier de soins'],
        ['histoire', 'Histoire', 'Sa vie lune après lune, ses souvenirs et ses fils de RP'],
        ['relations', 'Relations', 'Sa famille, ses liens et l’évolution de chaque avis'],
        ['galerie', 'Galerie', 'Tel que les artistes l’ont vu'],
        ['regne', 'Le règne', 'Meneur du Tonnerre : charte, diplomatie et neuf vies']
    ];
    var KICKERS = { personnalite: 'Qui il est', physique: 'À quoi il ressemble', histoire: 'Lune après lune', relations: 'Autour de lui', galerie: 'Vu par les artistes', regne: 'Meneur du Tonnerre' };
    var vue = document.getElementById('vue'), sous = document.getElementById('sous');
    var arbre = [], plat = [], courant = null;

    /* ---------- Son visage (logo) : les pupilles suivent le curseur ---------- */
    var VISAGE = '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#7A4A2B" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="M9 30c-4-9-1-19 7-18 6 1 10 6 11 11z" fill="#F0B568"/><path d="M55 30c4-9 1-19-7-18-6 1-10 6-11 11z" fill="#F0B568"/><path d="M13 24c0-4 2-7 5-7 2 0 4 2 5 5z" fill="#FFE2C4" stroke-width="1.6"/><path d="M51 24c0-4-2-7-5-7-2 0-4 2-5 5z" fill="#FFE2C4" stroke-width="1.6"/><path d="M32 17c15 0 25 9 25 21 0 11-10 19-25 19S7 49 7 38c0-12 10-21 25-21z" fill="#FFF3E0"/><path d="M21 35c0-6 5-10 11-10s11 4 11 10c0 8-5 14-11 14s-11-6-11-14z" fill="#F0B568" stroke="none"/></g><g stroke="#7A4A2B" stroke-width="2" stroke-linecap="round" fill="none"><path d="M26 49c2 3 4 3 6 0 2 3 4 3 6 0"/></g><ellipse cx="24" cy="36" rx="5.2" ry="5.6" fill="#43BEE3" stroke="#7A4A2B" stroke-width="1.8"/><ellipse cx="40" cy="36" rx="5.2" ry="5.6" fill="#43BEE3" stroke="#7A4A2B" stroke-width="1.8"/>PUPILLES<path d="M29.500 43.200h5l-2.500 3z" fill="#F4A9A0" stroke="#7A4A2B" stroke-width="1.2" stroke-linejoin="round"/><g fill="#B56A9C" stroke="#7A4A2B" stroke-width="1.3"><circle cx="52" cy="22" r="3.400"/><circle cx="56" cy="27" r="3"/><circle cx="50" cy="28" r="2.800"/></g></svg>';
    var PUP = '<g class="pup g"><ellipse cx="24.500" cy="36.500" rx="2.200" ry="3" fill="#6B3A22"/><circle cx="23" cy="34" r="1.300" fill="#fff"/></g><g class="pup d"><ellipse cx="39.500" cy="36.500" rx="2.200" ry="3" fill="#6B3A22"/><circle cx="38.500" cy="34" r="1.300" fill="#fff"/></g>';
    window.VISAGE_SVG = VISAGE.replace('PUPILLES', '<ellipse cx="24.500" cy="36.500" rx="2.200" ry="3" fill="#6B3A22"/><ellipse cx="39.500" cy="36.500" rx="2.200" ry="3" fill="#6B3A22"/>');
    var logo = VISAGE.replace('PUPILLES', PUP).replace('<svg viewBox="0 0 64 64" aria-hidden="true">', '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true">');
    var marque = document.getElementById('marque');
    marque.querySelector('.logo-place').outerHTML = logo;
    var svgLogo = marque.querySelector('.logo'), pups = marque.querySelectorAll('.pup');
    var dernierMouv = Date.now(), reve = false;
    function eveil() {
        dernierMouv = Date.now();
        if (reve) { reve = false; marque.classList.remove('reve'); svgLogo.classList.remove('trebuche'); void svgLogo.getBoundingClientRect(); svgLogo.classList.add('trebuche'); }
    }
    addEventListener('pointermove', function (ev) {
        eveil();
        var b = svgLogo.getBoundingClientRect(), dx = ev.clientX - (b.left + b.width / 2), dy = ev.clientY - (b.top + b.height / 2), d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 160) * 1.8;
        Array.prototype.forEach.call(pups, function (p) { p.style.transform = 'translate(' + (dx / d * k).toFixed(2) + 'px,' + (dy / d * k).toFixed(2) + 'px)'; });
    }, { passive: true });
    ['keydown', 'scroll', 'pointerdown', 'touchstart'].forEach(function (n) { addEventListener(n, eveil, { passive: true }); });
    setInterval(function () { if (!reve && Date.now() - dernierMouv > 25000 && !document.hidden) { reve = true; marque.classList.add('reve'); } }, 3000);

    /* ---------- Construction de l'arbre du site à partir des textes ---------- */
    function slug(s, i) { return String(s.id || s.titre || 's' + i).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 's' + i; }
    function bati() {
        var T = window.PAGES_TEXTE || {};
        if (T.histoire) window.Riche.migrerHistoire(T.histoire);
        arbre = PAGES.map(function (p) {
            var d = T[p[0]] || {}, secs = (d.sections || []).slice();
            if (p[0] === 'physique' && T.soins) secs = secs.concat(T.soins.sections || []);
            secs = secs.filter(function (s) { return !s.masque && ((s.blocs && s.blocs.length) || (s.composant && window.Composants.existe(s.composant))); })
                .map(function (s, i) { s = Object.assign({}, s); s.id = slug(s, i); return s; });
            return { id: p[0], nom: p[1], phrase: p[2], titre: d.titre || p[1], intro: d.intro || '', sections: secs };
        });
        plat = [];
        arbre.forEach(function (p) { p.sections.forEach(function (s) { plat.push({ page: p, sec: s }); }); });
    }

    /* ---------- Menus ---------- */
    function menus() {
        document.getElementById('menu').innerHTML = arbre.map(function (p) { return '<li><a href="#' + p.id + '" data-p="' + p.id + '">' + e(p.nom) + '</a></li>'; }).join('');
        document.getElementById('constellation').innerHTML = arbre.map(function (p) {
            return '<li><a href="#' + p.id + '">' + e(p.nom) + '</a><ul>' + p.sections.map(function (s) { return '<li><a href="#' + p.id + '/' + s.id + '">' + e(s.titre) + '</a></li>'; }).join('') + '</ul></li>';
        }).join('');
    }
    var volet = document.getElementById('volet'), burger = document.getElementById('burger');
    function volets(ouvrir) {
        volet.hidden = !ouvrir; burger.setAttribute('aria-expanded', String(ouvrir)); burger.lastChild.nodeValue = ouvrir ? 'Fermer' : 'Ciel'; document.body.classList.toggle('volet-ouvert', ouvrir);
        if (ouvrir) { var a = volet.querySelector('a'); if (a) a.focus(); }
    }
    burger.addEventListener('click', function () { volets(volet.hidden); });
    volet.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('a')) volets(false); });

    /* ---------- Thème ---------- */
    document.getElementById('theme').addEventListener('click', function () {
        var nuit = document.documentElement.getAttribute('data-theme') !== 'nuit';
        document.documentElement.setAttribute('data-theme', nuit ? 'nuit' : 'jour');
        try { localStorage.setItem('theme', nuit ? 'nuit' : 'jour'); } catch (x) {}
        var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', nuit ? '#0E1128' : '#FBF2E2');
    });

    /* ---------- Recherche ---------- */
    var rech = document.getElementById('recherche'), champ = document.getElementById('recherche-champ'), liste = document.getElementById('recherche-liste'), index = null, sel = 0, resultats = [];
    function sa(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
    function indexer() {
        index = [];
        plat.forEach(function (x) {
            var txt = (x.sec.blocs || []).map(function (b) { return window.Riche.texteBrut(b.html || b.texte || (b.items || []).join(' ') || ''); }).join(' ');
            index.push({ lieu: x.page.nom, titre: x.sec.titre, href: '#' + x.page.id + '/' + x.sec.id, texte: txt, cle: sa(x.sec.titre + ' ' + txt) });
        });
        (window.RELATIONS || []).forEach(function (r) { index.push({ lieu: 'Relation', titre: r.nom, href: '#relations/diverses', texte: r.role || '', cle: sa(r.nom + ' ' + (r.role || '') + ' ' + (r.clan || '')) }); });
        (window.JOURNAL || []).forEach(function (f) { index.push({ lieu: 'Fil de RP', titre: f.titre, href: '#histoire/fils', texte: f.resume || '', cle: sa(f.titre + ' ' + (f.resume || '')) }); });
        (window.LUNES || []).forEach(function (s) { index.push({ lieu: 'Souvenir', titre: s.titre, href: '#histoire/lunes', texte: s.texte || '', cle: sa(s.titre + ' ' + (s.texte || '')) }); });
    }
    function chercher() {
        var q = sa(champ.value.trim()); if (!index) indexer();
        resultats = q.length < 2 ? [] : index.filter(function (x) { return x.cle.indexOf(q) >= 0; }).sort(function (a, b) { return (sa(b.titre).indexOf(q) >= 0) - (sa(a.titre).indexOf(q) >= 0); }).slice(0, 30);
        sel = 0;
        liste.innerHTML = resultats.map(function (x, i) {
            var p = sa(x.texte).indexOf(q), ex = p >= 0 ? '…' + x.texte.slice(Math.max(0, p - 30), p + 70) + '…' : x.texte.slice(0, 80);
            return '<li' + (i === 0 ? ' class="sel"' : '') + '><a href="' + x.href + '"><small>' + e(x.lieu) + '</small><span><b>' + e(x.titre) + '</b><br>' + e(ex) + '</span></a></li>';
        }).join('') || (q.length >= 2 ? '<li><a style="pointer-events:none"><small></small><span>Rien ne correspond.</span></a></li>' : '');
    }
    function recherche(ouvrir) {
        rech.hidden = !ouvrir; document.body.classList.toggle('recherche-ouverte', ouvrir);
        if (ouvrir) { champ.value = ''; liste.innerHTML = ''; setTimeout(function () { champ.focus(); }, 30); }
    }
    document.getElementById('chercher').addEventListener('click', function () { recherche(true); });
    champ.addEventListener('input', chercher);
    rech.addEventListener('click', function (ev) { if (ev.target === rech || (ev.target.closest && ev.target.closest('a[href^="#"]'))) recherche(false); });
    function marquerSel() { Array.prototype.forEach.call(liste.children, function (li, i) { li.classList.toggle('sel', i === sel); if (i === sel) li.scrollIntoView({ block: 'nearest' }); }); }
    addEventListener('keydown', function (ev) {
        var saisie = /^(INPUT|TEXTAREA|SELECT)$/.test((ev.target || {}).tagName) || (ev.target && ev.target.isContentEditable);
        if (ev.key === 'Escape') { if (!rech.hidden) recherche(false); else if (!volet.hidden) volets(false); return; }
        if ((ev.key === '/' && !saisie) || ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k')) { ev.preventDefault(); recherche(true); return; }
        if (!rech.hidden) {
            if (ev.key === 'ArrowDown') { ev.preventDefault(); sel = Math.min(resultats.length - 1, sel + 1); marquerSel(); }
            else if (ev.key === 'ArrowUp') { ev.preventDefault(); sel = Math.max(0, sel - 1); marquerSel(); }
            else if (ev.key === 'Enter' && resultats[sel]) { location.hash = resultats[sel].href; recherche(false); }
        }
    });

    /* ---------- Apparition au défilement ---------- */
    var obs = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('vu'); obs.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' }) : null;
    function reveler(racine) {
        Array.prototype.forEach.call(racine.querySelectorAll('.contenu-texte > *, .rel, .fil, .article, .action, .soin, .souvenir, .oeuvre, .membre, .frise li, .gen, .groupe-lune'), function (n) {
            if (!obs) return; n.classList.add('revele'); obs.observe(n);
        });
    }

    /* ---------- Accueil ---------- */
    var ROCHER = '<svg class="roc" viewBox="0 0 900 460" aria-hidden="true"><defs><linearGradient id="roc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--roche-a)"/><stop offset=".55" stop-color="var(--roche-b)"/><stop offset="1" stop-color="var(--roche-c)"/></linearGradient></defs><path class="roc-fond" d="M0 460V300c40-30 70-34 110-60 30-36 70-60 130-70 40-50 110-86 190-80 60 4 100 30 130 60 50-6 100 10 130 40 60 6 120 40 140 100v170z"/><path class="fente" d="M230 170c-6 40-4 80 8 140M420 92c8 50 6 100-6 170M610 110c-10 50-4 90 16 150"/><path class="lumiere" d="M240 172c40-46 100-74 170-78M520 100c40 4 80 20 110 50"/></svg>';
    var COLLINES = '<svg class="collines l1" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 300V160c120-60 240-80 380-40 140 40 220 90 380 50 150-38 260-80 400-30 110 40 200 20 280-10v170z"/></svg><svg class="collines l2" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 300V200c160-40 280-30 440 10 140 34 260 40 420-6 200-56 380-20 580 30v66z"/></svg><svg class="collines l3" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 300V230c200-30 360 10 560 24 220 14 360-40 880 6v40z"/></svg>';
    var ECLAIR = '<svg class="eclair" viewBox="0 0 54 96" aria-hidden="true"><path d="M30 0 8 54h16L14 96 46 38H29z" fill="#FFF3C4"/></svg>';
    function couronne(vies) {
        var n = vies.length || 9, W = 520, H = 150, cx = W / 2, cy = 232, R = 214, svg = '';
        for (var i = 0; i < n; i++) {
            var t = n === 1 ? .5 : i / (n - 1), ang = Math.PI * (1.17 + .66 * t), x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang), r = 11 + 15 * (1 - Math.abs(t - .5) * 2), pts = [];
            for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? r * .46 : r; pts.push((x + q * Math.cos(a)).toFixed(1) + ',' + (y + q * Math.sin(a)).toFixed(1)); }
            svg += '<polygon class="astre' + (vies[i] && vies[i].statut === 'perdue' ? ' perdue' : '') + '" style="animation-delay:' + (i * .28).toFixed(2) + 's" points="' + pts.join(' ') + '"/>';
        }
        return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + svg + '</svg>';
    }
    function accueil() {
        var A = window.ACCUEIL || {}, vies = window.VIES || [], act = vies.filter(function (v) { return v.statut !== 'perdue'; }).length;
        var mots = String(A.nom || 'Étoile de Framboisier').split(' '), dern = mots.pop();
        var img = A.portrait ? O.urlPhoto(A.portrait) : 'assets/photos/Headshot%20Etoile%20de%20Framboisier%20Oriyakii.webp';
        var accroche = A.accroche || 'Calme, rêveur, un brin hautain. Un jeune meneur qui préfère la concorde aux griffes — et qui porte son clan plus lourdement qu’il ne le montre.';
        vue.className = 'vue acc';
        vue.innerHTML = '<section class="heros"><div class="heros-scene"><div class="soleil"></div><div class="nuages-heros"><i></i><i></i><i></i></div><div class="orage"></div>' + ECLAIR + COLLINES + '</div>' +
            '<div class="heros-texte"><p class="kicker">' + e(A.fonction || 'Meneur du Clan du Tonnerre') + '</p><h1><span>' + e(mots.join(' ')) + '</span><span class="l2">' + e(dern) + '</span></h1>' +
            '<p class="devise">« ' + e(A.devise || 'Le roc au regard d’azur') + ' »</p><p class="accroche">' + e(accroche) + '</p>' +
            '<ul class="faits"><li><span class="etiquette">Âge</span><strong>' + e(A.age || '') + '</strong></li><li><span class="etiquette">Vies</span><strong>' + act + ' sur ' + (vies.length || 9) + '</strong></li></ul>' +
            '<div class="heros-actions"><a class="bouton plein" href="#personnalite">Le rencontrer</a><a class="bouton" href="#histoire/parcours">Son parcours</a></div></div>' +
            '<figure class="heros-portrait"><div class="couronne">' + couronne(vies) + '</div><img src="' + e(img) + '" alt="Portrait d’Étoile de Framboisier, meneur du Clan du Tonnerre" width="680" height="680" fetchpriority="high"></figure>' + ROCHER + '</section>' +
            '<ul class="entrees" aria-label="Explorer le site">' + arbre.map(function (p) { return '<li><a href="#' + p.id + '"><b>' + e(p.nom) + '</b><span>' + e(p.phrase) + '</span><i aria-hidden="true">→</i></a></li>'; }).join('') + '</ul>';
        var im = vue.querySelector('.heros-portrait img'); im.addEventListener('error', function () { im.remove(); });
        // la scène bouge doucement avec le curseur
        var h = vue.querySelector('.heros'), so = vue.querySelector('.soleil'), c = vue.querySelectorAll('.collines');
        if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) h.addEventListener('pointermove', function (ev) {
            var b = h.getBoundingClientRect(), x = (ev.clientX - b.left) / b.width - .5, y = (ev.clientY - b.top) / b.height - .5;
            so.style.transform = 'translate(' + (x * -26).toFixed(1) + 'px,' + (y * -18).toFixed(1) + 'px)';
            Array.prototype.forEach.call(c, function (n, i) { n.style.transform = 'translateX(' + (x * (i + 1) * 12).toFixed(1) + 'px)'; });
        });
    }

    /* ---------- Une section d'une page ---------- */
    function pageVue(p, s) {
        var i = plat.findIndex(function (x) { return x.page === p && x.sec === s; }), prec = plat[i - 1], suiv = plat[i + 1];
        var premier = p.sections[0] === s;
        vue.className = 'vue';
        vue.innerHTML = '<header class="entete"><p class="kicker">' + e(p.nom === s.titre ? KICKERS[p.id] : (KICKERS[p.id] || p.nom)) + '</p><h1>' + e(s.titre) + '</h1>' +
            ((premier && p.intro) || s.surtitre ? '<p class="chapeau">' + e(premier && p.intro ? p.intro : s.surtitre) + '</p>' : '') + '</header>' +
            '<div class="contenu">' + (s.blocs && s.blocs.length ? '<div class="contenu-texte">' + window.Riche.html(s.blocs) + '</div>' : '') +
            (s.composant ? '<div class="contenu-composant" data-composant="' + e(s.composant) + '"></div>' : '') + '</div>' +
            '<nav class="pagination" aria-label="Page précédente et suivante">' + (prec ? '<a class="prec" href="#' + prec.page.id + '/' + prec.sec.id + '"><span>Précédent</span><b>' + e(prec.sec.titre) + '</b></a>' : '') +
            (suiv ? '<a class="suiv" href="#' + suiv.page.id + '/' + suiv.sec.id + '"><span>Suivant</span><b>' + e(suiv.sec.titre) + '</b></a>' : '') + '</nav>';
        Array.prototype.forEach.call(vue.querySelectorAll('[data-composant]'), function (el) { window.Composants.monter(el.getAttribute('data-composant'), el); });
        reveler(vue);
        document.title = s.titre + ' — Étoile de Framboisier';
    }
    function sousNav(p, s) {
        if (!p || p.sections.length < 2) { sous.hidden = true; sous.innerHTML = ''; return; }
        sous.hidden = false;
        sous.innerHTML = p.sections.map(function (x) { return '<a href="#' + p.id + '/' + x.id + '"' + (x === s ? ' aria-current="page"' : '') + '>' + e(x.titre) + '</a>'; }).join('');
        var a = sous.querySelector('[aria-current]'); if (a && a.scrollIntoView) { var l = a.offsetLeft - 40; sous.scrollLeft = l; }
    }

    /* ---------- Le routeur ---------- */
    function route() {
        volets(false);
        var h = decodeURIComponent(location.hash.replace(/^#\/?/, '')), parts = h.split('/'), id = parts[0] || 'accueil';
        var p = arbre.filter(function (x) { return x.id === id; })[0], s = null;
        Array.prototype.forEach.call(document.querySelectorAll('#menu a'), function (a) { if (p && a.getAttribute('data-p') === p.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
        if (id === 'accueil' || !p) {
            accueil(); sousNav(null); document.title = 'Étoile de Framboisier — Le roc au regard d’azur';
        } else {
            s = p.sections.filter(function (x) { return x.id === parts[1]; })[0] || p.sections[0];
            if (!s) { vue.className = 'vue'; vue.innerHTML = '<div class="entete"><h1>' + e(p.titre) + '</h1></div><p class="vide-page">Cette page est vide pour le moment.</p>'; sousNav(null); }
            else { pageVue(p, s); sousNav(p, s); }
        }
        courant = id;
        window.scrollTo({ top: 0, behavior: 'instant' });
        var b = document.getElementById('principal'); if (b) b.focus({ preventScroll: true });
        progression();
    }
    var prog = document.getElementById('progression');
    function progression() { var m = document.documentElement.scrollHeight - innerHeight; prog.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, scrollY / m) : 0) + ')'; }
    addEventListener('scroll', progression, { passive: true });

    function demarrer() {
        bati(); menus(); index = null;
        addEventListener('hashchange', route);
        route();
    }
    window.Donnees.pret(demarrer);
})();
