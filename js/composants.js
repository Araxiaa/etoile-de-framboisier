/* ==========================================================================
   COMPOSANTS — les blocs « spéciaux » d'une page (vies, relations, galerie…).
   Dans une page, une section peut contenir du texte (blocs) puis un composant.
   Composants.monter('relations', element) remplit l'élément.
   Les données viennent de la base (dashboard) ; js/data/*.js sert de copie de secours.
   ========================================================================== */
(function () {
    'use strict';
    var O = window.Outils;
    var e = O.esc;
    var R = {};

    function paras(texte) {
        return String(texte || '').split(/\n\s*\n/).filter(Boolean).map(function (p) {
            return '<p>' + e(p.trim()).replace(/\n/g, '<br>') + '</p>';
        }).join('');
    }

    /* ---------- Fiche physique : mensurations et jauges ---------- */
    R.apercu = function (el) {
        var F = window.FICHE_PHYSIQUE || {};
        var jauges = (F.profil || []).map(function (j) {
            var cases = '';
            for (var i = 1; i <= 5; i++) cases += '<i class="' + (i <= j.niveau ? 'plein' : '') + '"></i>';
            return '<li class="jauge" role="img" aria-label="' + e(j.nom) + ' : ' + j.niveau + ' sur 5"><span>' + e(j.nom) + '</span><span class="jauge-piste">' + cases + '</span></li>';
        }).join('');
        var dl = (F.apercu || []).map(function (a) { return '<div><dt>' + e(a.label) + '</dt><dd>' + e(a.valeur) + '</dd></div>'; }).join('');
        el.innerHTML = '<div class="apercu">' +
            '<div class="portrait-mini"><img src="' + O.urlPhoto((window.ACCUEIL || {}).portrait || 'Headshot Etoile de Framboisier Oriyakii.webp') + '" alt="Portrait d’Étoile de Framboisier" loading="lazy"></div>' +
            '<div class="carte"><h3>En un coup d’œil</h3><dl class="fiche-dl">' + dl + '</dl></div>' +
            '<div class="carte"><h3>Son profil</h3><ul class="jauges">' + jauges + '</ul></div>' +
        '</div>';
    };

    /* ---------- Les neuf vies : neuf étoiles ---------- */
    R.vies = function (el) {
        var vies = window.VIES || [];
        el.innerHTML = '<div class="vies"><div class="orbes" role="group" aria-label="Les neuf vies"></div><div class="vie-detail carte" aria-live="polite"></div>' +
            '<div class="bilan-vies">' + O.compteurVies(vies) + '</div></div>';
        var orbes = el.querySelector('.orbes'), detail = el.querySelector('.vie-detail');
        orbes.innerHTML = vies.map(function (v, i) {
            return '<button type="button" class="orbe ' + (v.statut === 'perdue' ? 'perdue' : 'active') + '" data-i="' + i + '" aria-pressed="false">' +
                '<span class="orbe-astre">' + O.icone('etoile') + '<span class="orbe-num">' + (i + 1) + '</span></span><span class="orbe-don">' + e(v.don) + '</span></button>';
        }).join('');
        function montrer(i) {
            var v = vies[i]; if (!v) return;
            var perdue = v.statut === 'perdue';
            Array.prototype.forEach.call(orbes.children, function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
            detail.className = 'vie-detail carte ' + (perdue ? 'perdue' : 'active');
            detail.innerHTML = '<span class="main">Vie n°' + (i + 1) + '</span><h3>' + e(v.don) + ' ' +
                (perdue ? '<span class="pastille defaut">Perdue' + (v.lune ? ' à ' + e(v.lune) : '') + '</span>' : '<span class="pastille">Active</span>') + '</h3><p>' + e(v.texte) + '</p>';
        }
        orbes.addEventListener('click', function (ev) {
            var b = ev.target.closest ? ev.target.closest('.orbe') : null;
            if (b) montrer(parseInt(b.getAttribute('data-i'), 10));
        });
        var p = vies.findIndex(function (v) { return v.statut === 'perdue'; });
        montrer(p < 0 ? 0 : p);
    };

    /* ---------- Le mur des lunes ---------- */
    R['mur-lunes'] = function (el) {
        var L = window.LUNES || [];
        if (!L.length) { el.innerHTML = '<p class="vide">Rien d’épinglé pour le moment.</p>'; return; }
        el.innerHTML = '<div class="mur-barre"><p class="main">Les moments qui ont marqué sa vie</p><div class="mur-fleches">' +
            '<button type="button" class="bouton-rond" data-d="-1" aria-label="Souvenirs précédents"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
            '<button type="button" class="bouton-rond" data-d="1" aria-label="Souvenirs suivants"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div></div>' +
            '<div class="mur" tabindex="0" aria-label="Frise des souvenirs, à faire défiler">' + L.map(function (s) {
                var teinte = ['azur', 'mousse', 'or', 'mauve'].indexOf(s.teinte) >= 0 ? s.teinte : (s.teinte === 'sauge' ? 'mousse' : s.teinte === 'roux' ? 'or' : s.teinte === 'framboise' ? 'mauve' : 'mousse');
                return '<article class="souvenir ' + teinte + '"><span class="ruban" aria-hidden="true"></span>' +
                    (s.image ? '<img class="souvenir-image" src="' + O.urlPhoto(s.image) + '" alt="" loading="lazy">' : '') +
                    '<span class="main">' + e(s.lune) + '</span><h3>' + e(s.titre) + '</h3>' + (s.texte ? '<p>' + e(s.texte) + '</p>' : '') + '</article>';
            }).join('') + '</div>';
        var mur = el.querySelector('.mur');
        function pas() { var c = mur.querySelector('.souvenir'); return c ? c.offsetWidth + 24 : 300; }
        el.querySelector('.mur-fleches').addEventListener('click', function (ev) {
            var b = ev.target.closest ? ev.target.closest('[data-d]') : null;
            if (b) mur.scrollBy({ left: pas() * parseInt(b.getAttribute('data-d'), 10), behavior: 'smooth' });
        });
        Array.prototype.forEach.call(mur.querySelectorAll('img'), function (img) { img.addEventListener('error', function () { img.remove(); }); });
    };

    /* ---------- Les fils de RP ---------- */
    R.journal = function (el) {
        var donnees = window.JOURNAL || [], recent = false;
        el.innerHTML = '<div class="journal-barre"><p class="journal-bilan"></p><button type="button" class="bouton bouton-clair bouton-petit" aria-pressed="false">Voir le plus récent en premier</button></div><div class="fil-journal"></div>';
        var fil = el.querySelector('.fil-journal'), bouton = el.querySelector('button'), bilan = el.querySelector('.journal-bilan');
        function enCours(x) { return x.enCours === true || x.enCours === 'true'; }
        function compagnons(c) { return (Array.isArray(c) ? c : String(c || '').split(',')).map(function (n) { return n.trim(); }).filter(function (n) { return n && n !== '—'; }); }
        function sujet(x) {
            var lien = x.lien && x.lien !== '#';
            var avec = compagnons(x.compagnons);
            return '<li class="sujet' + (enCours(x) ? ' en-cours' : '') + '"><div class="sujet-tete"><h3>' + (lien ? '<a href="' + e(x.lien) + '" target="_blank" rel="noopener">' + e(x.titre) + '</a>' : e(x.titre)) + '</h3>' +
                (enCours(x) ? '<span class="pastille or">En cours</span>' : '') + '</div><p class="sujet-resume">' + e(x.resume) + '</p>' +
                (avec.length ? '<ul class="pastilles">' + avec.map(function (n) { return '<li class="pastille neutre">' + e(n) + '</li>'; }).join('') + '</ul>' : '') + '</li>';
        }
        function rendre() {
            var groupes = [], index = {};
            donnees.forEach(function (x) { if (!(x.lune in index)) { index[x.lune] = groupes.length; groupes.push({ lune: x.lune, sujets: [] }); } groupes[index[x.lune]].sujets.push(x); });
            if (recent) { groupes.reverse(); groupes.forEach(function (g) { g.sujets.reverse(); }); }
            fil.innerHTML = groupes.map(function (g) {
                var n = String(g.lune).match(/\d+/);
                return '<section class="lune-groupe"><h3 class="lune-titre"><span class="lune-disque" aria-hidden="true"></span>' +
                    (n ? '<span class="lune-num">' + n[0] + '</span><span class="main">' + (n[0] === '1' ? 'lune' : 'lunes') + '</span>' : '<span class="main">' + e(g.lune) + '</span>') +
                    '<span class="lune-compte">' + g.sujets.length + (g.sujets.length > 1 ? ' fils' : ' fil') + '</span></h3><ol class="lune-sujets">' + g.sujets.map(sujet).join('') + '</ol></section>';
            }).join('');
        }
        var total = donnees.length, encours = donnees.filter(enCours).length;
        bilan.textContent = total + (total > 1 ? ' fils joués' : ' fil joué') + (encours ? ', dont ' + encours + ' en cours' : '') + '. Chaque titre ouvre le fil sur Discord.';
        bouton.addEventListener('click', function () {
            recent = !recent; bouton.setAttribute('aria-pressed', String(recent));
            bouton.textContent = recent ? 'Revenir à l’ordre chronologique' : 'Voir le plus récent en premier'; rendre();
        });
        rendre();
    };

    /* ---------- La lignée ---------- */
    R.lignee = function (el) {
        var D = window.LIGNEE || { generations: [] };
        var CL = { 'vivant': 'mousse', 'vivant-pj': '', 'decede': 'neutre', 'disparu': 'or', 'vide': 'neutre', 'heros': 'defaut' };
        function fiche(m) {
            var st = m.statut || 'vivant';
            return '<article class="fiche-chat statut-' + st + '">' + O.avatar(m.nom, st === 'vide' ? null : m.photo) + '<h4>' + e(m.nom) + '</h4>' +
                (m.role ? '<p class="fiche-role">' + e(m.role) + '</p>' : '') +
                '<div class="fiche-etiquettes">' + (m.etiquette ? '<span class="pastille ' + (CL[st] || '') + '">' + e(m.etiquette) + '</span>' : '') + (m.tag ? '<span class="pastille or">' + e(m.tag) + '</span>' : '') + '</div>' +
                (m.joueur ? '<p class="fiche-joueur">' + e(m.joueur) + '</p>' : '') + '</article>';
        }
        el.innerHTML = (D.origine ? '<p class="origine"><span class="main">Répartition</span> ' + e(D.origine) + '</p>' : '') + '<div class="arbre">' +
            (D.generations || []).map(function (gen) {
                return '<section class="generation"><h3 class="gen-titre">' + e(gen.titre) + '</h3><div class="groupes">' +
                    (gen.groupes || []).map(function (g) {
                        return '<div class="groupe' + (g.couple ? ' couple' : '') + '">' + (g.titre ? '<h4 class="groupe-titre">' + e(g.titre) + '</h4>' : '') +
                            '<div class="membres">' + (g.membres || []).map(fiche).join('') + '</div></div>';
                    }).join('') + '</div></section>';
            }).join('<div class="lien-gen" aria-hidden="true"></div>') + '</div>';
        O.activerAvatars(el);
    };

    /* ---------- Les relations (cartes + fiche d'évolution des avis) ---------- */
    function rels() { return (window.RELATIONS || []).map(O.normaliserRelation); }
    function dernier(r) { return r.avis[r.avis.length - 1] || {}; }
    function clanDe(r) { return r.clan || 'Sans clan'; }

    R.relations = function (el) {
        var liste = rels();
        el.innerHTML = '<div class="legende-ligne" id="legende-rel"></div><div class="filtres" role="group" aria-label="Filtrer par clan"></div><ul class="relations"></ul>';
        var c = O.icone('coeur'), s = O.icone('sombre');
        el.querySelector('#legende-rel').innerHTML = '<span><span class="coeurs">' + c + c + c + '</span> apprécie</span><span><span class="coeurs">' + s + s + s + '</span> aversion</span><span><span class="coeurs">' + c + s + '</span> neutre</span><span><span class="coeurs">' + O.icone('etoile') + '</span> respect</span><span><span class="coeurs">' + O.icone('crane') + '</span> décédé(e)</span>';
        var ul = el.querySelector('.relations');
        ul.innerHTML = liste.map(function (r, i) {
            return '<li class="relation' + (r.mort ? ' defunt' : '') + '" data-clan="' + e(clanDe(r)) + '"><button type="button" class="relation-bouton" data-i="' + i + '" aria-haspopup="dialog">' +
                O.avatar(r.nom, r.photo, 'grand') + '<span class="relation-corps"><span class="relation-nom">' + e(r.nom) + '</span><span class="relation-meta">' +
                (r.role ? '<span class="pastille neutre">' + e(r.role) + '</span>' : '') + '<span class="pastille ' + (r.clan ? 'mousse' : 'neutre') + '">' + e(clanDe(r)) + '</span></span>' +
                '<span class="relation-bas">' + O.coeurs({ affinite: dernier(r).affinite, respect: dernier(r).respect, mort: r.mort }) + '<span class="relation-nb">' + r.avis.length + ' avis</span></span></span></button></li>';
        }).join('');
        O.activerAvatars(ul);
        var clans = []; liste.forEach(function (r) { if (clans.indexOf(clanDe(r)) < 0) clans.push(clanDe(r)); });
        var filtres = el.querySelector('.filtres');
        if (clans.length > 1) {
            filtres.innerHTML = ['Tous'].concat(clans).map(function (n, i) { return '<button type="button" class="filtre" data-f="' + e(n) + '" aria-pressed="' + (i === 0) + '">' + e(n) + '</button>'; }).join('');
            filtres.addEventListener('click', function (ev) {
                var b = ev.target.closest ? ev.target.closest('.filtre') : null; if (!b) return;
                var f = b.getAttribute('data-f');
                Array.prototype.forEach.call(filtres.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
                Array.prototype.forEach.call(ul.children, function (li) { li.hidden = f !== 'Tous' && li.getAttribute('data-clan') !== f; });
            });
        } else filtres.hidden = true;
        ul.addEventListener('click', function (ev) {
            var b = ev.target.closest ? ev.target.closest('.relation-bouton') : null;
            if (b) window.Fiche.ouvrir(liste[parseInt(b.getAttribute('data-i'), 10)]);
        });
    };

    /* ---------- Vue d'ensemble : tout le monde en un regard ---------- */
    R['vue-ensemble'] = function (el) {
        var liste = rels();
        function sens(r) { if (r.mort) return 'mort'; var a = dernier(r).affinite; return typeof a !== 'number' ? 'autre' : a > 0 ? 'aime' : a < 0 ? 'aversion' : 'neutre'; }
        var cpt = { aime: 0, neutre: 0, aversion: 0, mort: 0 };
        liste.forEach(function (r) { if (cpt[sens(r)] != null) cpt[sens(r)]++; });
        var groupes = {}, ordre = [];
        liste.forEach(function (r, i) { var k = clanDe(r); if (!groupes[k]) { groupes[k] = []; ordre.push(k); } groupes[k].push(i); });
        var fiche = function (n, lib, cl) { return '<li class="chiffre ' + cl + '"><b>' + n + '</b><span>' + lib + '</span></li>'; };
        el.innerHTML = '<ul class="chiffres">' + fiche(liste.length, 'chats et chattes', '') + fiche(cpt.aime, 'qu’il apprécie', 'aime') + fiche(cpt.neutre, 'neutres', 'neutre') + fiche(cpt.aversion, 'qu’il évite', 'aversion') + fiche(cpt.mort, 'disparus', 'mort') + '</ul>' +
            ordre.map(function (k) {
                return '<section class="ensemble-groupe"><h3>' + e(k) + ' <small>' + groupes[k].length + '</small></h3><ul class="ensemble-liste">' +
                    groupes[k].map(function (i) {
                        var r = liste[i]; var d = dernier(r);
                        return '<li><button type="button" class="ensemble-chip sens-' + sens(r) + '" data-i="' + i + '">' + O.avatar(r.nom, r.photo) + '<span><b>' + e(r.nom) + '</b>' +
                            O.coeurs({ affinite: d.affinite, respect: d.respect, mort: r.mort }) + '</span></button></li>';
                    }).join('') + '</ul></section>';
            }).join('');
        O.activerAvatars(el);
        el.addEventListener('click', function (ev) {
            var b = ev.target.closest ? ev.target.closest('.ensemble-chip') : null;
            if (b) window.Fiche.ouvrir(liste[parseInt(b.getAttribute('data-i'), 10)]);
        });
    };

    /* ---------- La galerie ---------- */
    R.galerie = function (el) {
        var oeuvres = window.GALERIE || [];
        el.innerHTML = '<div class="galerie">' + oeuvres.map(function (g, i) {
            var u = O.urlPhoto(g.fichier);
            return '<figure class="oeuvre"><a href="' + u + '" data-i="' + i + '" aria-label="Agrandir : ' + e(g.titre) + ' par ' + e(g.auteur) + '"><img src="' + u + '" alt="' + e(g.alt || g.titre) + '" decoding="async"></a>' +
                '<figcaption><strong>' + e(g.titre) + '</strong>Par ' + e(g.auteur) + '</figcaption></figure>';
        }).join('') + '</div>';
        Array.prototype.forEach.call(el.querySelectorAll('img'), function (img, i) {
            function remplacer() { var m = document.createElement('div'); m.className = 'oeuvre-manquante'; m.textContent = 'Image introuvable : ' + oeuvres[i].fichier; if (img.parentNode) img.parentNode.replaceChild(m, img); }
            img.addEventListener('error', remplacer);
            if (img.complete && img.naturalWidth === 0) remplacer();
        });
        if (typeof HTMLDialogElement !== 'function') return;
        var boite = document.createElement('dialog');
        boite.className = 'visionneuse';
        boite.setAttribute('aria-label', 'Illustration en grand');
        boite.innerHTML = '<button class="vis-fermer" type="button" aria-label="Fermer">×</button><button class="vis-nav vis-prec" type="button" aria-label="Précédente">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="vis-nav vis-suiv" type="button" aria-label="Suivante">›</button>';
        document.body.appendChild(boite);
        var img = boite.querySelector('img'), leg = boite.querySelector('figcaption'), cur = 0;
        function afficher(i) { cur = (i + oeuvres.length) % oeuvres.length; var g = oeuvres[cur]; img.src = O.urlPhoto(g.fichier); img.alt = g.alt || g.titre; leg.innerHTML = '<strong>' + e(g.titre) + '</strong> — par ' + e(g.auteur); }
        el.addEventListener('click', function (ev) {
            var a = ev.target.closest ? ev.target.closest('a[data-i]') : null; if (!a) return;
            ev.preventDefault(); afficher(parseInt(a.getAttribute('data-i'), 10)); boite.showModal();
        });
        boite.querySelector('.vis-fermer').addEventListener('click', function () { boite.close(); });
        boite.querySelector('.vis-prec').addEventListener('click', function () { afficher(cur - 1); });
        boite.querySelector('.vis-suiv').addEventListener('click', function () { afficher(cur + 1); });
        boite.addEventListener('click', function (ev) { if (ev.target === boite) boite.close(); });
        boite.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowLeft') afficher(cur - 1); else if (ev.key === 'ArrowRight') afficher(cur + 1); });
    };

    /* ---------- La charte du clan ---------- */
    R.charte = function (el) {
        var C = window.CHARTE || {};
        el.innerHTML = (C.intro ? '<p class="chapeau-charte">' + e(C.intro) + '</p>' : '') + '<ol class="articles">' + (C.articles || []).map(function (a) {
            return '<li class="article"><span class="article-num" aria-hidden="true">' + e(a.num) + '</span><h3>' + e(a.titre) + '</h3>' +
                (a.sous ? '<p class="article-sous">' + e(a.sous) + '</p>' : '') + '<p>' + e(a.texte) + '</p></li>';
        }).join('') + '</ol>';
    };

    /* ---------- Diplomatie : clans voisins et groupes ---------- */
    function diplo() { return (window.DIPLOMATIE || []).map(O.normaliserRelation); }
    R.diplomatie = function (el) {
        var voisins = diplo().filter(function (r) { return r.categorie !== 'etoiles'; });
        el.innerHTML = '<ul class="relations">' + voisins.map(function (r, i) {
            var d = dernier(r), nb = r.avis.length;
            return '<li class="relation"><button type="button" class="relation-bouton" data-i="' + i + '" aria-haspopup="dialog">' + O.avatar(O.motCle(r.nom), r.photo, 'grand') +
                '<span class="relation-corps"><span class="relation-nom">' + e(r.nom) + '</span><span class="relation-meta">' + (r.role ? '<span class="pastille ' + (r.categorie === 'groupe' ? 'or' : 'mousse') + '">' + e(r.role) + '</span>' : '') + '</span>' +
                '<span class="relation-bas">' + O.coeurs({ affinite: d.affinite, respect: d.respect }) + '<span class="relation-nb">' + (nb ? nb + ' avis' : 'pas encore d’avis') + '</span></span></span></button></li>';
        }).join('') + '</ul>';
        O.activerAvatars(el);
        el.addEventListener('click', function (ev) {
            var b = ev.target.closest ? ev.target.closest('.relation-bouton') : null;
            if (b) window.Fiche.ouvrir(voisins[parseInt(b.getAttribute('data-i'), 10)]);
        });
    };

    /* ---------- Le Clan des Étoiles ---------- */
    R.etoiles = function (el) {
        var et = diplo().filter(function (r) { return r.categorie === 'etoiles'; })[0];
        if (!et) { el.innerHTML = '<p class="vide">Rien à raconter pour le moment.</p>'; return; }
        el.innerHTML = '<div class="etoiles-carte carte"><div class="etoiles-tete"><span class="sceau" aria-hidden="true">' + O.icone('etoile') + '</span><div><h3>' + e(et.nom) + '</h3>' +
            (et.role ? '<p class="etiquette">' + e(et.role) + '</p>' : '') + '</div></div><div class="etoiles-corps"></div></div>';
        window.Fiche.inserer(el.querySelector('.etoiles-corps'), et);
    };

    /* ---------- Ses actions pour le clan ---------- */
    R.actions = function (el) {
        var A = window.ACTIONS || [];
        el.innerHTML = '<ol class="actions">' + A.map(function (a, i) {
            return '<li class="action"><span class="action-num" aria-hidden="true">' + (i + 1) + '</span><div>' + (a.lune ? '<span class="main">' + e(a.lune) + '</span>' : '') +
                '<h3>' + e(a.titre) + '</h3>' + paras(a.texte) + '</div></li>';
        }).join('') + '</ol>';
    };

    /* ---------- Le dossier de soins ---------- */
    R.soins = function (el) {
        var B = window.BLESSURES || [];
        var TYPES = { blessure: 'Blessure', maladie: 'Maladie', autre: 'Autre' };
        if (!B.length) { el.innerHTML = '<p class="vide">Rien à signaler pour le moment.</p>'; return; }
        var nb = function (t) { return B.filter(function (b) { return (b.type || 'blessure') === t; }).length; };
        el.innerHTML = '<p class="bilan-sante main">' + nb('blessure') + ' blessure' + (nb('blessure') > 1 ? 's' : '') + ' · ' + nb('maladie') + ' maladie' + (nb('maladie') > 1 ? 's' : '') + ' · ' + nb('autre') + ' autre' + (nb('autre') > 1 ? 's' : '') + '</p>' +
            '<ol class="soins">' + B.map(function (b) {
                var t = TYPES[b.type] ? b.type : 'blessure';
                return '<li class="soin ' + t + '"><div class="soin-tete"><span class="pastille ' + (t === 'maladie' ? '' : t === 'autre' ? 'or' : 'defaut') + '">' + TYPES[t] + '</span>' + (b.lune ? '<span class="main">' + e(b.lune) + '</span>' : '') + '</div>' +
                    '<h3>' + e(b.nom) + '</h3>' + (b.texte ? paras(b.texte) : '') +
                    (b.soins ? '<div class="soin-bloc soins-recus"><span class="main">Soins reçus</span>' + paras(b.soins) + '</div>' : '') +
                    (b.sequelles ? '<div class="soin-bloc sequelles"><span class="main">Séquelles</span>' + paras(b.sequelles) + '</div>' : '') + '</li>';
            }).join('') + '</ol>';
    };

    window.Composants = {
        monter: function (nom, el) { if (R[nom]) R[nom](el); else el.innerHTML = ''; },
        existe: function (nom) { return !!R[nom]; },
        noms: Object.keys(R)
    };
})();
