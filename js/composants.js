/* ==========================================================================
   COMPOSANTS — les blocs « spéciaux » d'une section (vies, relations, fils de RP, galerie…).
   Une section peut contenir du texte (blocs) puis un composant :
   Composants.monter('relations', element) remplit l'élément.
   Les données viennent de la base (dashboard) ; js/data/*.js sert de copie de secours.
   ========================================================================== */
(function () {
    'use strict';
    var O = window.Outils, e = O.esc, R = {};
    var ETOILE = 'M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z';

    function paras(texte) {
        return String(texte || '').split(/\n\s*\n/).filter(Boolean).map(function (p) { return '<p>' + e(p.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
    }
    function nombre(s) { var m = String(s || '').match(/\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(',', '.')) : null; }
    function rels() { return (window.RELATIONS || []).map(O.normaliserRelation); }
    function diplo() { return (window.DIPLOMATIE || []).map(O.normaliserRelation); }
    function dernier(r) { return r.avis[r.avis.length - 1] || {}; }
    function clanDe(r) { return r.clan || 'Sans clan'; }
    function sansAccent(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

    /* ---------- Mensurations et jauges ---------- */
    R.apercu = function (el) {
        var F = window.FICHE_PHYSIQUE || {};
        var dl = (F.apercu || []).map(function (a) { return '<div><dt>' + e(a.label) + '</dt><dd>' + e(a.valeur) + '</dd></div>'; }).join('');
        var jauges = (F.profil || []).map(function (j) {
            var c = ''; for (var i = 1; i <= 5; i++) c += '<i class="' + (i <= j.niveau ? 'plein' : '') + '"></i>';
            return '<li class="jauge" role="img" aria-label="' + e(j.nom) + ' : ' + j.niveau + ' sur 5"><span>' + e(j.nom) + '</span><span class="jauge-piste">' + c + '</span></li>';
        }).join('');
        el.innerHTML = '<div class="apercu"><dl class="apercu-liste">' + dl + '</dl><div><h3 class="etiquette" style="margin-bottom:18px">Son profil</h3><ul class="jauges">' + jauges + '</ul></div></div>';
    };

    /* ---------- Les neuf vies ---------- */
    R.vies = function (el) {
        var vies = window.VIES || [];
        el.innerHTML = '<div class="vies"><div class="astres" role="group" aria-label="Les neuf vies"></div><div class="vie-detail" aria-live="polite"></div></div>';
        var astres = el.querySelector('.astres'), detail = el.querySelector('.vie-detail');
        astres.innerHTML = vies.map(function (v, i) {
            return '<button type="button" class="astre-btn ' + (v.statut === 'perdue' ? 'perdue' : 'active') + '" data-i="' + i + '" aria-pressed="false">' +
                '<span class="astre-forme"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ETOILE + '"/></svg><b>' + (i + 1) + '</b></span><small>' + e(v.don) + '</small></button>';
        }).join('');
        function montrer(i) {
            var v = vies[i]; if (!v) return;
            var perdue = v.statut === 'perdue';
            Array.prototype.forEach.call(astres.children, function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
            detail.innerHTML = '<span class="main">Vie n°' + (i + 1) + '</span><h3>' + e(v.don) + (perdue ? '<span class="chip mauve">Perdue' + (v.lune ? ' à ' + e(v.lune) : '') + '</span>' : '<span class="chip azur">Active</span>') + '</h3><p>' + e(v.texte) + '</p>';
        }
        astres.addEventListener('click', function (ev) { var b = ev.target.closest ? ev.target.closest('.astre-btn') : null; if (b) montrer(parseInt(b.getAttribute('data-i'), 10)); });
        var p = vies.findIndex(function (v) { return v.statut === 'perdue'; });
        montrer(p < 0 ? 0 : p);
    };

    /* ---------- Fils de RP ---------- */
    R.journal = function (el) {
        var donnees = window.JOURNAL || [], filtre = 'tous', recent = true;
        function enCours(x) { return x.enCours === true || x.enCours === 'true'; }
        function compagnons(c) { return (Array.isArray(c) ? c : String(c || '').split(',')).map(function (n) { return n.trim(); }).filter(function (n) { return n && n !== '—'; }); }
        var total = donnees.length, enc = donnees.filter(enCours).length;
        el.innerHTML = '<p class="fils-bilan">' + total + (total > 1 ? ' fils' : ' fil') + ' · ' + enc + ' en cours</p>' +
            '<div class="onglets" role="group" aria-label="Filtrer les fils"><button type="button" data-f="tous" aria-pressed="true">Tous</button><button type="button" data-f="cours" aria-pressed="false">En cours</button><button type="button" data-f="fini" aria-pressed="false">Terminés</button>' +
            '<button type="button" data-o="1" style="margin-left:auto" aria-pressed="false">Du plus récent au plus ancien</button></div><div class="fils"></div>';
        var zone = el.querySelector('.fils');
        function rendre() {
            var liste = donnees.filter(function (x) { return filtre === 'tous' || (filtre === 'cours') === enCours(x); });
            var groupes = [], index = {};
            liste.forEach(function (x) { var k = x.lune || '—'; if (!(k in index)) { index[k] = groupes.length; groupes.push({ lune: k, fils: [] }); } groupes[index[k]].fils.push(x); });
            groupes.sort(function (a, b) { return (nombre(a.lune) || 0) - (nombre(b.lune) || 0); });
            if (recent) { groupes.reverse(); groupes.forEach(function (g) { g.fils.reverse(); }); }
            zone.innerHTML = groupes.length ? groupes.map(function (g) {
                return '<section class="groupe-lune"><h2 class="lune-titre">' + e(g.lune) + '</h2>' + g.fils.map(function (x) {
                    var lien = x.lien && x.lien !== '#', avec = compagnons(x.compagnons);
                    return '<article class="fil"><h3>' + (lien ? '<a href="' + e(x.lien) + '" target="_blank" rel="noopener">' + e(x.titre) + '</a>' : e(x.titre)) + '</h3>' +
                        '<span class="statut chip ' + (enCours(x) ? 'or' : '') + '">' + (enCours(x) ? 'En cours' : 'Terminé') + '</span>' +
                        (x.resume ? '<p>' + e(x.resume) + '</p>' : '') +
                        (avec.length ? '<ul class="chips">' + avec.map(function (n) { return '<li class="chip">' + e(n) + '</li>'; }).join('') + '</ul>' : '') + '</article>';
                }).join('') + '</section>';
            }).join('') : '<p class="vide-page">Aucun fil dans cette catégorie.</p>';
        }
        el.querySelector('.onglets').addEventListener('click', function (ev) {
            var b = ev.target.closest ? ev.target.closest('button') : null; if (!b) return;
            if (b.hasAttribute('data-o')) { recent = !recent; b.textContent = recent ? 'Du plus récent au plus ancien' : 'Du plus ancien au plus récent'; }
            else { filtre = b.getAttribute('data-f'); Array.prototype.forEach.call(el.querySelectorAll('[data-f]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
            rendre();
        });
        rendre();
    };

    /* ---------- La lignée ---------- */
    R.lignee = function (el) {
        var D = window.LIGNEE || { generations: [] };
        var ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        function membre(m) {
            var st = m.statut || 'vivant';
            return '<li class="membre statut-' + st + '">' + O.avatar(m.nom, st === 'vide' ? null : m.photo) + '<h4>' + e(m.nom) + '</h4>' +
                (m.role ? '<span class="role">' + e(m.role) + '</span>' : '') + (m.joueur ? '<span class="joueur">' + e(m.joueur) + '</span>' : '') +
                '<span class="etats">' + (m.etiquette ? '<span class="chip ' + (st === 'vivant' ? 'mousse' : st === 'heros' ? 'mauve' : '') + '">' + e(m.etiquette) + '</span>' : '') + (m.tag ? '<span class="chip or">' + e(m.tag) + '</span>' : '') + '</span></li>';
        }
        el.innerHTML = (D.origine ? '<p class="lignee-origine">' + e(D.origine) + '</p>' : '') + (D.generations || []).map(function (gen, i) {
            return '<section class="gen"><h2 class="gen-titre"><i>' + (ROM[i] || i + 1) + '</i>' + e(gen.titre) + '</h2>' + (gen.groupes || []).map(function (g) {
                return (g.titre ? '<h3 class="etiquette groupe-titre">' + e(g.titre) + '</h3>' : '') + '<ul class="membres">' + (g.membres || []).map(membre).join('') + '</ul>';
            }).join('') + '</section>';
        }).join('');
        O.activerAvatars(el);
    };

    /* ---------- Les relations : liste ---------- */
    function tendance(r) {
        var a = r.avis.filter(function (x) { return typeof x.affinite === 'number'; });
        if (a.length < 2) return 0;
        return Math.sign(a[a.length - 1].affinite - a[a.length - 2].affinite);
    }
    R.relations = function (el) {
        var liste = rels(), clan = 'Tous', q = '';
        var c = O.icone('coeur'), s = O.icone('sombre');
        var clans = ['Tous']; liste.forEach(function (r) { if (clans.indexOf(clanDe(r)) < 0) clans.push(clanDe(r)); });
        // les derniers changements : les relations dont l'avis a évolué, les plus récents d'abord
        var chg = liste.filter(function (r) { return tendance(r) !== 0; }).sort(function (a, b) { return (nombre(dernier(b).lune) || 0) - (nombre(dernier(a).lune) || 0); }).slice(0, 5);
        function cs(r, i) { var a = r.avis.filter(function (x) { return typeof x.affinite === 'number'; }); return O.coeurs({ affinite: a[i].affinite, respect: a[i].respect }); }
        el.innerHTML = '<p class="rel-bilan">' + liste.length + ' relations suivies — chacune a son évolution, lune après lune.</p>' +
            (chg.length ? '<ul class="changements"><h3>Derniers changements</h3>' + chg.map(function (r) {
                var a = r.avis.filter(function (x) { return typeof x.affinite === 'number'; });
                return '<li><span><b>' + e(r.nom) + '</b><small>' + e(dernier(r).lune || '') + '</small></span><span>' + cs(r, a.length - 2) + '<span class="fleche">→</span>' + cs(r, a.length - 1) + '</span></li>';
            }).join('') + '</ul>' : '') +
            '<div class="legende-ligne"><span><span class="coeurs">' + c + c + c + '</span> apprécie</span><span><span class="coeurs">' + s + s + s + '</span> aversion</span><span><span class="coeurs">' + c + s + '</span> neutre</span><span><span class="coeurs">' + O.icone('etoile') + '</span> respect</span><span><span class="coeurs">' + O.icone('crane') + '</span> décédé(e)</span></div>' +
            '<div class="rel-outils"><div class="onglets" style="margin:0;padding:0;border:0" role="group" aria-label="Filtrer par clan"></div><input type="search" placeholder="Rechercher un chat, un rôle, un clan…" aria-label="Rechercher une relation"></div><ul class="rel-liste"></ul>';
        var onglets = el.querySelector('.onglets'), ul = el.querySelector('.rel-liste');
        onglets.innerHTML = clans.length > 2 ? clans.map(function (n, i) { return '<button type="button" data-c="' + e(n) + '" aria-pressed="' + (i === 0) + '">' + e(n) + '</button>'; }).join('') : '';
        function rendre() {
            ul.innerHTML = '';
            var html = liste.map(function (r, i) {
                var t = tendance(r), d = dernier(r);
                var vu = (clan === 'Tous' || clanDe(r) === clan) && (!q || sansAccent([r.nom, r.role, r.clan].join(' ')).indexOf(q) >= 0);
                if (!vu) return '';
                return '<li class="rel' + (r.mort ? ' defunt' : '') + '"><button type="button" data-i="' + i + '" aria-haspopup="dialog">' + O.avatar(r.nom, r.photo) +
                    '<span class="nom">' + e(r.nom) + '</span><span class="sous-nom">' + (r.role ? '<span class="chip">' + e(r.role) + '</span>' : '') + '<span class="chip ' + (r.clan ? 'mousse' : '') + '">' + e(clanDe(r)) + '</span>' +
                    O.coeurs({ affinite: d.affinite, respect: d.respect, mort: r.mort }) + (t ? '<span class="tend ' + (t > 0 ? 'haut' : 'bas') + '">' + (t > 0 ? '▲' : '▼') + '</span>' : '') + '</span></button></li>';
            }).join('');
            ul.innerHTML = html || '<li class="vide-page">Aucune relation ne correspond.</li>';
            O.activerAvatars(ul);
        }
        onglets.addEventListener('click', function (ev) {
            var b = ev.target.closest ? ev.target.closest('button') : null; if (!b) return;
            clan = b.getAttribute('data-c'); Array.prototype.forEach.call(onglets.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); rendre();
        });
        el.querySelector('input').addEventListener('input', function (ev) { q = sansAccent(ev.target.value.trim()); rendre(); });
        ul.addEventListener('click', function (ev) { var b = ev.target.closest ? ev.target.closest('button[data-i]') : null; if (b) window.Fiche.ouvrir(liste[parseInt(b.getAttribute('data-i'), 10)]); });
        rendre();
    };

    /* ---------- Vue d'ensemble : le framboisier ---------- */
    function baieSvg(x, y, r, classe, i) {
        // une framboise : sept petites drupéoles autour d'une centrale, et une feuille
        var d = r * 0.46, g = '';
        [[0, 0], [1, 0], [-1, 0], [.5, .87], [-.5, .87], [.5, -.87], [-.5, -.87]].forEach(function (p) { g += '<circle class="gr" cx="' + (p[0] * d).toFixed(1) + '" cy="' + (p[1] * d).toFixed(1) + '" r="' + (d * 0.62).toFixed(1) + '"/>'; });
        return '<g class="baie ' + classe + '" tabindex="0" role="button" data-i="' + i + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><g class="grappe">' + g +
            '<path class="feuille" d="M0 ' + (-r * .95).toFixed(1) + 'c' + (r * .5).toFixed(1) + ' ' + (-r * .5).toFixed(1) + ' ' + (r * .95).toFixed(1) + ' ' + (-r * .2).toFixed(1) + ' ' + (r * .9).toFixed(1) + ' ' + (-r * .15).toFixed(1) + 'c' + (-r * .3).toFixed(1) + ' ' + (r * .45).toFixed(1) + ' ' + (-r * .9).toFixed(1) + ' ' + (r * .3).toFixed(1) + ' ' + (-r * .9).toFixed(1) + ' ' + (r * .15).toFixed(1) + 'z"/></g>';
    }
    R['vue-ensemble'] = function (el) {
        var liste = rels();
        function sens(r) { if (r.mort) return 'mort'; var a = dernier(r).affinite; return typeof a !== 'number' ? 'autre' : a > 0 ? 'aime' : a < 0 ? 'aversion' : 'neutre'; }
        var cpt = { aime: 0, neutre: 0, aversion: 0, mort: 0 };
        liste.forEach(function (r) { if (cpt[sens(r)] != null) cpt[sens(r)]++; });
        var W = 1000, H = 640, cx = 500, cy = 390, svg = '', tiges = '';
        var vivants = liste.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return !x.r.mort; });
        var morts = liste.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.mort; });
        vivants.forEach(function (x, k) {
            var d = dernier(x.r), a = typeof d.affinite === 'number' ? Math.abs(d.affinite) : 0, force = a + (d.respect ? 1 : 0);
            var dist = 235 - Math.min(force, 4) * 36 + (k % 3) * 12, ang = k * 2.39996 + 0.4;   // l'angle d'or : une répartition naturelle
            var px = cx + Math.cos(ang) * dist * 1.55, py = cy + Math.sin(ang) * dist * 0.92;
            px = Math.max(60, Math.min(W - 60, px)); py = Math.max(150, Math.min(H - 50, py));
            var cl = sens(x.r) === 'autre' ? 'autre' : sens(x.r);
            var r = 17 + Math.min(force, 4) * 4.5;
            tiges += '<path class="fr-tige" d="M' + cx + ' ' + cy + 'Q' + ((cx + px) / 2 + (k % 2 ? 24 : -24)) + ' ' + ((cy + py) / 2 - 16) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + '"/>';
            svg += baieSvg(px, py, r, cl, x.i) + '<text y="' + (r + 18).toFixed(0) + '">' + e(x.r.nom) + '</text></g>';
        });
        // ceux qui nous ont quittés : des étoiles dans le ciel, comme dans les légendes
        var ciel = '<text class="fr-ciel-titre" x="' + cx + '" y="34" text-anchor="middle">' + (morts.length ? 'Ceux qui veillent depuis les étoiles' : '') + '</text>';
        morts.forEach(function (x, k) {
            var px = cx + (k - (morts.length - 1) / 2) * 120, py = 76 + (k % 2) * 28, pts = [];
            for (var j = 0; j < 10; j++) { var a = -Math.PI / 2 + j * Math.PI / 5, q = j % 2 ? 6 : 14; pts.push((q * Math.cos(a)).toFixed(1) + ',' + (q * Math.sin(a)).toFixed(1)); }
            ciel += '<g class="etoile-morte" tabindex="0" role="button" data-i="' + x.i + '" transform="translate(' + px + ' ' + py + ')"><polygon points="' + pts.join(' ') + '"/><text y="32">' + e(x.r.nom) + '</text></g>';
        });
        var centre = '<g class="fr-centre"><circle cx="' + cx + '" cy="' + cy + '" r="46" fill="var(--or-clair)" opacity=".35"/><circle cx="' + cx + '" cy="' + cy + '" r="34" fill="var(--papier)" stroke="var(--or)" stroke-width="1.5"/>' +
            '<g transform="translate(' + (cx - 21) + ' ' + (cy - 21) + ') scale(.66)">' + (window.VISAGE_SVG || '').replace('<svg viewBox="0 0 64 64" aria-hidden="true">', '<g>').replace(/<\/svg>$/, '</g>') + '</g></g>';
        var f = function (n, lib, cl) { return '<li class="chiffre ' + cl + '"><b>' + n + '</b><span>' + lib + '</span></li>'; };
        el.innerHTML = '<ul class="chiffres">' + f(liste.length, 'chats et chattes', '') + f(cpt.aime, 'qu’il apprécie', 'aime') + f(cpt.neutre, 'neutres', 'neutre') + f(cpt.aversion, 'qu’il évite', 'aversion') + f(cpt.mort, 'disparus', 'mort') + '</ul>' +
            '<div class="framboisier"><svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Le framboisier de ses relations">' + ciel + tiges + centre + svg + '</svg></div>' +
            '<p class="fr-legende">Plus un lien est fort, plus la baie est proche et grosse. <i class="a"></i>apprécié <i class="n"></i>neutre <i class="v"></i>aversion <i class="m"></i>disparu (une étoile). Touche une baie pour voir l’évolution.</p>';
        function ouvrir(ev) { var g = ev.target.closest ? ev.target.closest('[data-i]') : null; if (g) window.Fiche.ouvrir(liste[parseInt(g.getAttribute('data-i'), 10)]); }
        el.addEventListener('click', ouvrir);
        el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ouvrir(ev); } });
    };

    /* ---------- La charte : l'Écorce de la Concorde ---------- */
    R.charte = function (el) {
        var C = window.CHARTE || {};
        el.innerHTML = '<div class="ecorce">' + (C.intro ? '<p class="chapeau-charte">' + e(C.intro) + '</p>' : '') + '<ol class="articles">' + (C.articles || []).map(function (a) {
            return '<li class="article"><span class="article-num" aria-hidden="true">' + e(a.num) + '</span><h3>' + e(a.titre) + '</h3>' + (a.sous ? '<p class="article-sous">' + e(a.sous) + '</p>' : '') + '<p>' + e(a.texte) + '</p></li>';
        }).join('') + '</ol></div>';
    };

    /* ---------- Diplomatie ---------- */
    R.diplomatie = function (el) {
        var voisins = diplo().filter(function (r) { return r.categorie !== 'etoiles'; });
        el.innerHTML = '<p class="rel-bilan">Clique sur un clan ou un groupe pour suivre l’évolution de son regard sur eux.</p><ul class="rel-liste">' + voisins.map(function (r, i) {
            var d = dernier(r), nb = r.avis.length;
            return '<li class="rel"><button type="button" data-i="' + i + '" aria-haspopup="dialog">' + O.avatar(O.motCle(r.nom), r.photo) + '<span class="nom">' + e(r.nom) + '</span><span class="sous-nom">' +
                (r.role ? '<span class="chip ' + (r.categorie === 'groupe' ? 'or' : 'mousse') + '">' + e(r.role) + '</span>' : '') + O.coeurs({ affinite: d.affinite, respect: d.respect }) +
                '<span class="chip">' + (nb ? nb + ' avis' : 'pas encore d’avis') + '</span></span></button></li>';
        }).join('') + '</ul>';
        O.activerAvatars(el);
        el.addEventListener('click', function (ev) { var b = ev.target.closest ? ev.target.closest('button[data-i]') : null; if (b) window.Fiche.ouvrir(voisins[parseInt(b.getAttribute('data-i'), 10)]); });
    };

    /* ---------- Le Clan des Étoiles ---------- */
    R.etoiles = function (el) {
        var et = diplo().filter(function (r) { return r.categorie === 'etoiles'; })[0];
        if (!et) { el.innerHTML = '<p class="vide-page">Rien à raconter pour le moment.</p>'; return; }
        el.innerHTML = '<div class="ciel-etoiles">' + (et.role ? '<p class="etiquette">' + e(et.role) + '</p>' : '') + '<h3>' + e(et.nom) + '</h3><div class="fr-corps-inline"></div></div>';
        window.Fiche.inserer(el.querySelector('.fr-corps-inline'), et);
    };

    /* ---------- Ses actions pour le clan ---------- */
    R.actions = function (el) {
        var A = window.ACTIONS || [];
        el.innerHTML = '<ol class="actions">' + A.map(function (a, i) {
            return '<li class="action"><span class="action-num" aria-hidden="true">' + (i + 1) + '</span><div>' + (a.lune ? '<span class="main">' + e(a.lune) + '</span>' : '') + '<h3>' + e(a.titre) + '</h3>' + paras(a.texte) + '</div></li>';
        }).join('') + '</ol>';
    };

    /* ---------- Le dossier de soins ---------- */
    R.soins = function (el) {
        var B = window.BLESSURES || [], TYPES = { blessure: 'Blessure', maladie: 'Maladie', autre: 'Autre' };
        if (!B.length) { el.innerHTML = '<p class="vide-page">Rien à signaler pour le moment.</p>'; return; }
        var nb = function (t) { return B.filter(function (b) { return (b.type || 'blessure') === t; }).length; };
        el.innerHTML = '<p class="bilan-sante main">' + nb('blessure') + ' blessure' + (nb('blessure') > 1 ? 's' : '') + ' · ' + nb('maladie') + ' maladie' + (nb('maladie') > 1 ? 's' : '') + ' · ' + nb('autre') + ' autre' + (nb('autre') > 1 ? 's' : '') + '</p><ol class="soins">' + B.map(function (b) {
            var t = TYPES[b.type] ? b.type : 'blessure';
            return '<li class="soin"><div class="soin-tete"><span class="chip ' + (t === 'maladie' ? 'azur' : t === 'autre' ? 'or' : 'mauve') + '">' + TYPES[t] + '</span>' + (b.lune ? '<span class="main">' + e(b.lune) + '</span>' : '') + '</div><h3>' + e(b.nom) + '</h3>' + paras(b.texte) +
                ((b.soins || b.sequelles) ? '<div class="soin-blocs">' + (b.soins ? '<div class="soin-bloc soins-recus"><span class="etiquette">Soins reçus</span>' + paras(b.soins) + '</div>' : '') + (b.sequelles ? '<div class="soin-bloc"><span class="etiquette">Séquelles</span>' + paras(b.sequelles) + '</div>' : '') + '</div>' : '') + '</li>';
        }).join('') + '</ol>';
    };

    /* ---------- Le mur des lunes : les souvenirs ---------- */
    R['mur-lunes'] = function (el) {
        var L = window.LUNES || [];
        if (!L.length) { el.innerHTML = '<p class="vide-page">Rien d’épinglé pour le moment.</p>'; return; }
        el.innerHTML = '<ul class="souvenirs">' + L.map(function (s) {
            return '<li class="souvenir"><span class="lune">' + e(s.lune) + '</span><div><h3>' + e(s.titre) + '</h3>' + (s.texte ? '<p>' + e(s.texte) + '</p>' : '') + '</div>' + (s.image ? '<img src="' + O.urlPhoto(s.image) + '" alt="" loading="lazy">' : '') + '</li>';
        }).join('') + '</ul>';
        Array.prototype.forEach.call(el.querySelectorAll('img'), function (img) { img.addEventListener('error', function () { img.remove(); }); });
    };

    /* ---------- Parcours : toute sa vie en une frise, assemblée toute seule ---------- */
    var TYPES_P = { chapitre: 'Chapitre', souvenir: 'Souvenir', fil: 'Fil RP', soin: 'Santé', vie: 'Vie', action: 'Acte', relation: 'Relation' };
    function evenements() {
        var ev = [];
        var hist = ((window.PAGES_TEXTE || {}).histoire || { sections: [] }).sections;
        hist.forEach(function (s) {
            if (/^chapitre/.test(s.id || '') && nombre(s.surtitre) != null) {
                var p1 = (s.blocs || []).filter(function (b) { return b.t === 'p'; })[0], txt = p1 ? window.Riche.texteBrut(p1.html) : '';
                ev.push({ type: 'chapitre', lune: nombre(s.surtitre), label: s.surtitre, titre: s.titre, texte: txt.length > 170 ? txt.slice(0, txt.lastIndexOf(' ', 170)) + '…' : txt, href: '#histoire/' + s.id });
            }
        });
        (window.LUNES || []).forEach(function (s) { if (nombre(s.lune) != null) ev.push({ type: 'souvenir', lune: nombre(s.lune), label: s.lune, titre: s.titre, texte: s.texte, href: '#histoire/lunes' }); });
        (window.JOURNAL || []).forEach(function (f) { if (nombre(f.lune) != null) ev.push({ type: 'fil', lune: nombre(f.lune), label: f.lune, titre: f.titre, texte: f.resume, lien: f.lien && f.lien !== '#' ? f.lien : '' }); });
        (window.BLESSURES || []).forEach(function (b) { if (nombre(b.lune) != null) ev.push({ type: 'soin', lune: nombre(b.lune), label: b.lune, titre: b.nom, texte: String(b.texte || '').split(/\n/)[0], href: '#physique/dossier' }); });
        (window.VIES || []).forEach(function (v) { if (v.statut === 'perdue' && nombre(v.lune) != null) ev.push({ type: 'vie', lune: nombre(v.lune), label: v.lune, titre: 'Une vie perdue : ' + v.don, texte: v.texte, href: '#regne/vies' }); });
        (window.ACTIONS || []).forEach(function (a) { if (nombre(a.lune) != null) ev.push({ type: 'action', lune: nombre(a.lune), label: a.lune, titre: a.titre, texte: String(a.texte || '').split(/\n/)[0], href: '#regne/actions' }); });
        rels().forEach(function (r) {
            var av = r.avis.filter(function (x) { return typeof x.affinite === 'number' && nombre(x.lune) != null; });
            for (var i = 1; i < av.length; i++) if (av[i].affinite !== av[i - 1].affinite) ev.push({ type: 'relation', lune: nombre(av[i].lune), label: av[i].lune, titre: r.nom, texte: av[i].texte, href: '#relations/diverses' });
        });
        return ev.sort(function (a, b) { return a.lune - b.lune; });
    }
    R.parcours = function (el) {
        var ev = evenements(), filtre = 'tout';
        var types = Object.keys(TYPES_P).filter(function (t) { return ev.some(function (x) { return x.type === t; }); });
        el.innerHTML = '<div class="onglets" role="group" aria-label="Filtrer la frise"><button type="button" data-t="tout" aria-pressed="true">Tout</button>' + types.map(function (t) { return '<button type="button" data-t="' + t + '" aria-pressed="false">' + TYPES_P[t] + '</button>'; }).join('') + '</div><ol class="frise"></ol>';
        var ol = el.querySelector('.frise');
        function rendre() {
            ol.innerHTML = ev.filter(function (x) { return filtre === 'tout' || x.type === filtre; }).map(function (x) {
                var titre = x.lien ? '<a href="' + e(x.lien) + '" target="_blank" rel="noopener">' + e(x.titre) + '</a>' : x.href ? '<a href="' + x.href + '">' + e(x.titre) + '</a>' : e(x.titre);
                return '<li class="t-' + x.type + '"><span class="lune">' + e(x.label) + '</span><i class="noeud" aria-hidden="true"></i><div><span class="type">' + TYPES_P[x.type] + '</span><h3>' + titre + '</h3>' + (x.texte ? '<p>' + e(x.texte) + '</p>' : '') + '</div></li>';
            }).join('');
        }
        el.querySelector('.onglets').addEventListener('click', function (ev2) {
            var b = ev2.target.closest ? ev2.target.closest('button') : null; if (!b) return;
            filtre = b.getAttribute('data-t'); Array.prototype.forEach.call(el.querySelectorAll('.onglets button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); rendre();
        });
        rendre();
    };

    /* ---------- La galerie ---------- */
    R.galerie = function (el) {
        var oeuvres = window.GALERIE || [];
        el.innerHTML = '<div class="galerie">' + oeuvres.map(function (g, i) {
            var u = O.urlPhoto(g.fichier);
            return '<figure class="oeuvre"><a href="' + u + '" data-i="' + i + '" aria-label="Agrandir : ' + e(g.titre) + ' par ' + e(g.auteur) + '"><img src="' + u + '" alt="' + e(g.alt || g.titre) + '" loading="lazy" decoding="async"></a><figcaption><strong>' + e(g.titre) + '</strong>Par ' + e(g.auteur) + '</figcaption></figure>';
        }).join('') + '</div>';
        Array.prototype.forEach.call(el.querySelectorAll('img'), function (img, i) {
            function remplacer() { var m = document.createElement('div'); m.className = 'oeuvre-manquante'; m.textContent = 'Image introuvable : ' + oeuvres[i].fichier; if (img.parentNode) img.parentNode.replaceChild(m, img); }
            img.addEventListener('error', remplacer);
            if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') remplacer();
        });
        if (typeof HTMLDialogElement !== 'function') return;
        var boite = document.getElementById('visionneuse');
        if (!boite) {
            boite = document.createElement('dialog'); boite.id = 'visionneuse'; boite.className = 'visionneuse'; boite.setAttribute('aria-label', 'Illustration en grand');
            boite.innerHTML = '<button class="vis-fermer" type="button" aria-label="Fermer">×</button><button class="vis-nav vis-prec" type="button" aria-label="Précédente">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="vis-nav vis-suiv" type="button" aria-label="Suivante">›</button>';
            document.body.appendChild(boite);
            boite.querySelector('.vis-fermer').addEventListener('click', function () { boite.close(); });
            boite.addEventListener('click', function (ev) { if (ev.target === boite) boite.close(); });
        }
        var img = boite.querySelector('img'), leg = boite.querySelector('figcaption'), cur = 0;
        function afficher(i) { cur = (i + oeuvres.length) % oeuvres.length; var g = oeuvres[cur]; img.src = O.urlPhoto(g.fichier); img.alt = g.alt || g.titre; leg.innerHTML = '<strong>' + e(g.titre) + '</strong> — par ' + e(g.auteur); }
        boite.querySelector('.vis-prec').onclick = function () { afficher(cur - 1); };
        boite.querySelector('.vis-suiv').onclick = function () { afficher(cur + 1); };
        boite.onkeydown = function (ev) { if (ev.key === 'ArrowLeft') afficher(cur - 1); else if (ev.key === 'ArrowRight') afficher(cur + 1); };
        el.addEventListener('click', function (ev) { var a = ev.target.closest ? ev.target.closest('a[data-i]') : null; if (!a) return; ev.preventDefault(); afficher(parseInt(a.getAttribute('data-i'), 10)); boite.showModal(); });
    };

    window.Composants = {
        monter: function (nom, el) { if (R[nom]) R[nom](el); else el.innerHTML = ''; },
        existe: function (nom) { return !!R[nom]; },
        evenements: evenements
    };
})();
