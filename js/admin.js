/* ==========================================================================
   DASHBOARD — connexion Discord + édition de tout le contenu du site.
   Pour ajouter une rubrique modifiable : ajouter une entrée dans RUBRIQUES
   (et la même clé dans js/donnees.js pour que le site la lise).
   ========================================================================== */
(function () {
    'use strict';

    var C = window.SITE_CONFIG;
    var O = window.Outils;

    /* ---------- Description des formulaires ----------
       t : text | area | select | bool | image | liste | groupe | riche
       k : nom du champ      l : libellé      aide : petite explication */

    var STATUTS_CHAT = [
        ['vivant', 'Vivant (PNJ)'], ['vivant-pj', 'Vivant (joué par un joueur)'], ['decede', 'Décédé'],
        ['disparu', 'Disparu'], ['vide', 'Emplacement vide'], ['heros', 'Étoile de Framboisier (mis en avant)']
    ];
    var AFFINITES = [
        ['', 'Aucun cœur'], [3, 'Très apprécié (3 cœurs)'], [2, 'Apprécié (2 cœurs)'], [1, 'Un peu apprécié (1 cœur)'],
        [0, 'Neutre'], [-1, 'Un peu d’aversion (1 cœur sombre)'], [-2, 'Aversion (2 cœurs sombres)'], [-3, 'Forte aversion (3 cœurs sombres)']];

    // Clans / groupes déjà saisis, proposés à l'écriture (pour écrire toujours pareil)
    function clansConnus() {
        var vus = [];
        ((donnees.relations && donnees.relations.liste) || []).forEach(function (r) { if (r.clan && vus.indexOf(r.clan) < 0) vus.push(r.clan); });
        return vus;
    }

    var CHAMP_AVIS = {
        k: 'avis', t: 'liste', l: 'Évolution de son avis (du plus ancien au plus récent)', ajout: 'Ajouter un avis',
        lib: function (o) {
            var a = AFFINITES.filter(function (x) { return String(x[0]) === String(o.affinite == null ? '' : o.affinite); })[0];
            return (o.lune || 'Lune ?') + ' · ' + (a ? a[1] : '');
        },
        item: [
            { k: 'lune', t: 'text', l: 'Lune (âge d’Étoile de Framboisier)', aide: 'Ex. 20 lunes' },
            { k: 'affinite', t: 'select', num: true, l: 'Affinité', opts: AFFINITES },
            { k: 'respect', t: 'bool', l: 'Respect (affiche une étoile)' },
            { k: 'texte', t: 'area', l: 'Appréciation', aide: 'Ce qu’il pense de ce chat à ce moment' }
        ]
    };

    var CHAMPS_RELATION = [
        { k: 'nom', t: 'text', l: 'Nom' },
        { k: 'role', t: 'text', l: 'Rôle', aide: 'Ex. Lieutenante, Fils adoptif' },
        { k: 'clan', t: 'text', l: 'Clan / groupe', aide: 'Sert de filtre sur le site. Laisser vide = « Sans clan »', suggere: clansConnus },
        { k: 'joueur', t: 'text', l: 'Joueur', aide: 'Ex. @Oriyakii ou PNJ' },
        { k: 'photo', t: 'image', l: 'Photo' },
        { k: 'mort', t: 'bool', l: 'Décédé(e) (affiche un crâne)' },
        CHAMP_AVIS
    ];

    var CHAMPS_MEMBRE = [
        { k: 'nom', t: 'text', l: 'Nom' },
        { k: 'role', t: 'text', l: 'Rôle', aide: 'Ex. Grand-mère, Frère' },
        { k: 'statut', t: 'select', l: 'Statut', opts: STATUTS_CHAT },
        { k: 'etiquette', t: 'text', l: 'Pastille', aide: 'Ex. Vivante, Décédé' },
        { k: 'joueur', t: 'text', l: 'Joueur', aide: 'Ex. @Oriyakii ou PNJ' },
        { k: 'tag', t: 'text', l: 'Pastille en plus', aide: 'Facultatif, ex. Highlander' },
        { k: 'photo', t: 'image', l: 'Photo' }
    ];

    var COMPOSANTS = [
        ['', 'Aucun (du texte seulement)'], ['apercu', 'Fiche physique (mensurations et jauges)'], ['vies', 'Les neuf vies'], ['charte', 'La charte du clan'],
        ['diplomatie', 'Clans et groupes voisins'], ['etoiles', 'Le Clan des Étoiles'], ['actions', 'Actions pour le clan'], ['mur-lunes', 'Le mur des lunes'],
        ['journal', 'Les fils de RP'], ['lignee', 'L’arbre généalogique'], ['relations', 'Les relations (cartes)'], ['vue-ensemble', 'Vue d’ensemble des relations'],
        ['galerie', 'La galerie'], ['soins', 'Le dossier de soins']
    ];

    function PAGE(cle, libelle, lien) {
        return {
            k: cle, t: 'groupe', l: libelle, lien: lien,
            champs: [
                { k: 'titre', t: 'text', l: 'Titre de la page' },
                { k: 'intro', t: 'area', l: 'Phrase d’introduction', aide: 'Affichée sous le titre' },
                {
                    k: 'sections', t: 'liste', l: 'Sections de la page', ajout: 'Ajouter une section',
                    lib: function (o) { return (o.titre || '(sans titre)') + (o.masque ? ' — masquée' : '') + (o.composant ? ' · ' + (COMPOSANTS.filter(function (c) { return c[0] === o.composant; })[0] || ['', ''])[1] : ''); },
                    item: [
                        { k: 'titre', t: 'text', l: 'Titre de la section', aide: 'Il apparaît dans le sommaire de la page' },
                        { k: 'surtitre', t: 'text', l: 'Petit texte écrit à la main (facultatif)', aide: 'Au-dessus du titre' },
                        { k: 'masque', t: 'bool', l: 'Masquer cette section sur le site' },
                        { k: 'composant', t: 'select', l: 'Contenu spécial affiché après le texte', opts: COMPOSANTS, aide: 'Les relations, la galerie, etc. se gèrent dans leurs propres rubriques' },
                        { k: 'blocs', t: 'riche', l: 'Le texte' }
                    ]
                }
            ]
        };
    }

    var RUBRIQUES = [
        {
            cle: 'pages', nom: 'Pages et textes', objet: true, defaut: function () { return window.PAGES_TEXTE; },
            aide: 'Tous les textes du site. Dans chaque section, écris avec l’éditeur : titres, citations, séparateurs, listes, encadrés, images, et gras / italique / souligné / barré / surligné / couleurs.',
            champs: [
                PAGE('personnalite', 'Personnalité', 'personnalite.html'),
                PAGE('physique', 'Physique', 'physique.html'),
                PAGE('soins', 'Dossier de soins', 'soins.html'),
                PAGE('histoire', 'Histoire', 'histoire.html'),
                PAGE('relations', 'Relations', 'relations.html'),
                PAGE('galerie', 'Galerie', 'galerie.html'),
                PAGE('regne', 'Le règne', 'regne.html')
            ]
        },
        {
            cle: 'accueil', nom: 'Accueil', objet: true, defaut: function () { return window.ACCUEIL; },
            aide: 'La page d’accueil : son portrait, son nom, son âge. (Les étoiles viennent de la rubrique « Ses vies ».)',
            champs: [
                { k: 'nom', t: 'text', l: 'Nom' }, { k: 'fonction', t: 'text', l: 'Fonction', aide: 'Ex. Meneur du Clan du Tonnerre' },
                { k: 'devise', t: 'text', l: 'Devise', aide: 'Sans les guillemets' }, { k: 'age', t: 'text', l: 'Âge', aide: 'Ex. 24 lunes' },
                { k: 'portrait', t: 'image', l: 'Portrait', aide: 'Une image au fond transparent est idéale' }
            ]
        },
        {
            cle: 'vies', nom: 'Ses vies', liste: true, defaut: function () { return window.VIES; },
            aide: 'Les neuf vies. Quand une vie est perdue : passe-la en « Perdue » et indique la lune. L’accueil et la page « Le règne » se mettent à jour.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter une vie', lib: function (o) { return o.don + (o.statut === 'perdue' ? ' (perdue)' : ''); },
                item: [
                    { k: 'don', t: 'text', l: 'Don' },
                    { k: 'statut', t: 'select', l: 'Statut', opts: [['active', 'Active'], ['perdue', 'Perdue']] },
                    { k: 'lune', t: 'text', l: 'Âge de la perte', aide: 'Seulement si perdue, ex. 15 lunes' },
                    { k: 'texte', t: 'area', l: 'Description du don, ou circonstances de la perte' }
                ]
            }]
        },
        {
            cle: 'relations', nom: 'Relations', liste: true, defaut: function () { return window.RELATIONS; },
            aide: 'Chaque chat a une évolution d’avis datée. Le clan / groupe sert de filtre et à la vue d’ensemble.',
            champs: [{ k: 'liste', t: 'liste', ajout: 'Ajouter une relation', item: CHAMPS_RELATION, lib: function (o) { return o.nom + (o.clan ? ' — ' + o.clan : ''); } }]
        },
        {
            cle: 'lignee', nom: 'Famille (lignée)', objet: true, defaut: function () { return window.LIGNEE; },
            aide: 'L’arbre généalogique : générations → groupes → chats.',
            champs: [
                { k: 'origine', t: 'text', l: 'Répartition des origines', aide: 'Phrase affichée au-dessus de l’arbre' },
                {
                    k: 'generations', t: 'liste', ajout: 'Ajouter une génération', lib: function (o) { return o.titre; },
                    item: [
                        { k: 'titre', t: 'text', l: 'Titre de la génération' },
                        {
                            k: 'groupes', t: 'liste', ajout: 'Ajouter un groupe', lib: function (o) { return o.titre || '(groupe sans titre)'; },
                            item: [
                                { k: 'titre', t: 'text', l: 'Titre du groupe', aide: 'Peut rester vide' },
                                { k: 'couple', t: 'bool', l: 'Les deux premiers sont un couple (cœur entre eux)' },
                                { k: 'membres', t: 'liste', ajout: 'Ajouter un chat', item: CHAMPS_MEMBRE, lib: function (o) { return o.nom + (o.role ? ' — ' + o.role : ''); } }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            cle: 'journal', nom: 'Fils de RP', liste: true, defaut: function () { return window.JOURNAL; },
            aide: 'Un bloc par fil joué sur Discord. Les fils d’une même lune sont regroupés sur la page Histoire.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter un fil', lib: function (o) { return (o.lune ? o.lune + ' · ' : '') + o.titre + (o.enCours ? ' (en cours)' : ''); },
                item: [
                    { k: 'lune', t: 'text', l: 'Lune', aide: 'Ex. 22 lunes' }, { k: 'titre', t: 'text', l: 'Titre du fil' },
                    { k: 'lien', t: 'text', l: 'Lien Discord', aide: 'Laisser # s’il n’y en a pas' },
                    { k: 'compagnons', t: 'text', l: 'Avec qui', aide: 'Séparés par des virgules' },
                    { k: 'resume', t: 'area', l: 'Résumé' }, { k: 'enCours', t: 'bool', l: 'Fil en cours (affiche « En cours »)' }
                ]
            }]
        },
        {
            cle: 'lunes', nom: 'Mur des lunes', liste: true, defaut: function () { return window.LUNES; },
            aide: 'Les souvenirs épinglés (page Histoire), dans l’ordre où ils s’affichent.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter un souvenir', lib: function (o) { return (o.lune ? o.lune + ' · ' : '') + (o.titre || ''); },
                item: [
                    { k: 'lune', t: 'text', l: 'Lune', aide: 'Ex. 15 lunes' }, { k: 'titre', t: 'text', l: 'Titre du moment' },
                    { k: 'texte', t: 'area', l: 'Texte' }, { k: 'image', t: 'image', l: 'Image (facultatif)' },
                    { k: 'teinte', t: 'select', l: 'Couleur de la note', opts: [['', 'Vert'], ['azur', 'Bleu'], ['or', 'Doré'], ['mauve', 'Mauve']] }
                ]
            }]
        },
        {
            cle: 'galerie', nom: 'Galerie', liste: true, defaut: function () { return window.GALERIE; },
            aide: 'Les illustrations. Envoie une image avec le bouton : elle est automatiquement allégée.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter une illustration', lib: function (o) { return (o.titre || 'Illustration') + (o.auteur ? ' — ' + o.auteur : ''); },
                item: [
                    { k: 'fichier', t: 'image', l: 'Image' }, { k: 'titre', t: 'text', l: 'Légende' },
                    { k: 'auteur', t: 'text', l: 'Artiste', aide: 'Ex. @Oriyakii' }, { k: 'alt', t: 'text', l: 'Description (pour les lecteurs d’écran)' }
                ]
            }]
        },
        {
            cle: 'blessures', nom: 'Soins (blessures, maladies)', liste: true, defaut: function () { return window.BLESSURES; },
            aide: 'Le dossier de soins (page Soins, rattachée à Physique).',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter une blessure ou une maladie', lib: function (o) { return (o.lune ? o.lune + ' · ' : '') + (o.nom || ''); },
                item: [
                    { k: 'nom', t: 'text', l: 'Nom' }, { k: 'type', t: 'select', l: 'Type', opts: [['blessure', 'Blessure'], ['maladie', 'Maladie'], ['autre', 'Autre']] },
                    { k: 'lune', t: 'text', l: 'Lune', aide: 'Ex. 15 lunes' }, { k: 'texte', t: 'area', l: 'Ce qui s’est passé' },
                    { k: 'soins', t: 'area', l: 'Soins reçus', aide: 'Qui l’a soigné, avec quelles herbes, combien de temps…' },
                    { k: 'sequelles', t: 'area', l: 'Séquelles', aide: 'Facultatif : cicatrice, faiblesse durable…' }
                ]
            }]
        },
        {
            cle: 'physique_fiche', nom: 'Fiche physique', objet: true, defaut: function () { return window.FICHE_PHYSIQUE; },
            aide: 'Les mensurations et les jauges de la page Physique (section « En un coup d’œil »).',
            champs: [
                { k: 'apercu', t: 'liste', l: 'Mensurations', ajout: 'Ajouter une ligne', lib: function (o) { return o.label + ' : ' + (o.valeur || ''); }, item: [{ k: 'label', t: 'text', l: 'Intitulé' }, { k: 'valeur', t: 'text', l: 'Valeur' }] },
                {
                    k: 'profil', t: 'liste', l: 'Jauges', ajout: 'Ajouter une jauge', lib: function (o) { return o.nom + ' (' + (o.niveau == null ? 0 : o.niveau) + '/5)'; },
                    item: [{ k: 'nom', t: 'text', l: 'Caractéristique' }, { k: 'niveau', t: 'select', num: true, l: 'Niveau', opts: [[0, '0 sur 5'], [1, '1 sur 5'], [2, '2 sur 5'], [3, '3 sur 5'], [4, '4 sur 5'], [5, '5 sur 5']] }]
                }
            ]
        },
        {
            cle: 'charte', nom: 'Charte du clan', objet: true, defaut: function () { return window.CHARTE; },
            aide: 'L’Écorce de la Concorde (page Le règne).',
            champs: [
                { k: 'titre', t: 'text', l: 'Titre de la charte' }, { k: 'intro', t: 'area', l: 'Introduction' },
                {
                    k: 'articles', t: 'liste', l: 'Articles', ajout: 'Ajouter un article', lib: function (o) { return (o.num || '') + ' · ' + (o.titre || ''); },
                    item: [{ k: 'num', t: 'text', l: 'Numéro', aide: 'Ex. I, II, III' }, { k: 'titre', t: 'text', l: 'Titre' }, { k: 'sous', t: 'text', l: 'Sous-titre', aide: 'Facultatif' }, { k: 'texte', t: 'area', l: 'Texte' }]
                }
            ]
        },
        {
            cle: 'diplomatie', nom: 'Diplomatie', liste: true, defaut: function () { return window.DIPLOMATIE; },
            aide: 'Page Le règne : clans voisins, groupes (Solitaires, Domestiques…) et Clan des Étoiles. Chacun a une évolution d’avis datée.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter un clan ou un groupe', lib: function (o) { return o.nom + (o.categorie === 'etoiles' ? ' (section Clan des Étoiles)' : ''); },
                item: [
                    { k: 'nom', t: 'text', l: 'Nom' },
                    { k: 'categorie', t: 'select', l: 'Où l’afficher ?', opts: [['clan', 'Diplomatie : clan voisin'], ['groupe', 'Diplomatie : groupe (solitaires, domestiques…)'], ['etoiles', 'Section « Le Clan des Étoiles »']] },
                    { k: 'role', t: 'text', l: 'Étiquette', aide: 'Ex. Clan voisin, Groupe' }, { k: 'photo', t: 'image', l: 'Emblème ou image (facultatif)' }, CHAMP_AVIS
                ]
            }]
        },
        {
            cle: 'actions', nom: 'Actions pour le clan', liste: true, defaut: function () { return window.ACTIONS; },
            aide: 'Page Le règne : ce qu’il a fait pour le Clan du Tonnerre.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter une action', lib: function (o) { return (o.lune ? o.lune + ' · ' : '') + (o.titre || ''); },
                item: [{ k: 'lune', t: 'text', l: 'Lune', aide: 'Facultatif' }, { k: 'titre', t: 'text', l: 'Titre' }, { k: 'texte', t: 'area', l: 'Texte' }]
            }]
        }
    ];

    /* ---------- Petits outils ---------- */
    var $ = function (id) { return document.getElementById(id); };
    function h(tag, props, enfants) {
        var e = document.createElement(tag);
        Object.keys(props || {}).forEach(function (k) {
            if (k === 'class') e.className = props[k]; else if (k === 'text') e.textContent = props[k]; else e.setAttribute(k, props[k]);
        });
        (enfants || []).forEach(function (c) { if (c) e.appendChild(c); });
        return e;
    }
    var toastTimer;
    function toast(message, erreur) {
        var t = $('toast'); t.textContent = message; t.className = 'admin-toast visible' + (erreur ? ' erreur' : '');
        clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'admin-toast'; }, erreur ? 6000 : 2600);
    }
    function copie(x) { return JSON.parse(JSON.stringify(x)); }

    /* ---------- État ---------- */
    var client = window.supabase.createClient(C.url, C.cle);
    var donnees = {};
    var modifie = {};
    var courante = null;

    /* ---------- Éditeur de formulaires ---------- */
    function fixer(obj, k, v) { if (v === '' || v === false || v == null) delete obj[k]; else obj[k] = v; }
    var compteur = 0;

    function formulaire(defs, obj, change) {
        var corps = h('div', { class: 'grille-champs' });
        var conteneur = h('div');
        function vider() { if (corps.childNodes.length) { conteneur.appendChild(corps); corps = h('div', { class: 'grille-champs' }); } }

        defs.forEach(function (d) {
            var id = 'c' + (++compteur), champ;

            if (d.t === 'liste') { vider(); conteneur.appendChild(liste(d, obj, change)); return; }
            if (d.t === 'riche') {
                vider();
                if (!Array.isArray(obj[d.k])) obj[d.k] = [];
                conteneur.appendChild(h('div', { class: 'champ-riche' }, [h('span', { class: 'etiquette', text: d.l }), window.Editeur.creer(obj[d.k], change, { envoyerImage: envoyerImage })]));
                return;
            }
            if (d.t === 'groupe') {
                vider();
                if (!obj[d.k] || typeof obj[d.k] !== 'object') obj[d.k] = {};
                var det = h('details', { class: 'item groupe-page' });
                var resume = h('summary', {}, [h('span', { class: 'item-titre', text: d.l })]);
                if (d.lien) { var a = h('a', { href: d.lien, target: '_blank', rel: 'noopener', class: 'voir-page', text: 'Voir la page ↗' }); a.addEventListener('click', function (ev) { ev.stopPropagation(); }); resume.appendChild(a); }
                det.appendChild(resume);
                var cg = h('div', { class: 'item-corps' }); cg.appendChild(formulaire(d.champs, obj[d.k], change)); det.appendChild(cg);
                conteneur.appendChild(h('div', { class: 'liste' }, [det]));
                return;
            }
            if (d.t === 'bool') {
                var cb = h('input', { type: 'checkbox', id: id }); cb.checked = !!obj[d.k];
                cb.addEventListener('change', function () { fixer(obj, d.k, cb.checked); change(); });
                champ = h('div', { class: 'champ case' }, [cb, h('label', { for: id, text: d.l })]);
            } else {
                var saisie;
                if (d.t === 'area') {
                    saisie = h('textarea', { id: id }); saisie.value = obj[d.k] == null ? '' : obj[d.k];
                    saisie.addEventListener('input', function () { fixer(obj, d.k, saisie.value); change(); });
                } else if (d.t === 'select') {
                    saisie = h('select', { id: id }, d.opts.map(function (o) { return h('option', { value: String(o[0]), text: o[1] }); }));
                    saisie.value = obj[d.k] == null ? '' : String(obj[d.k]);
                    saisie.addEventListener('change', function () { var v = saisie.value; fixer(obj, d.k, v === '' ? '' : (d.num ? Number(v) : v)); change(); });
                } else if (d.t === 'image') {
                    saisie = champImage(id, d, obj, change);
                } else {
                    saisie = h('input', { type: 'text', id: id });
                    if (d.suggere) {
                        var dl = h('datalist', { id: id + '-dl' }, d.suggere().map(function (v) { return h('option', { value: v }); }));
                        saisie.setAttribute('list', id + '-dl'); document.body.appendChild(dl);
                    }
                    saisie.value = obj[d.k] == null ? '' : obj[d.k];
                    saisie.addEventListener('input', function () { fixer(obj, d.k, saisie.value); change(); });
                }
                var enfants = [h('label', { for: id, text: d.l }), saisie];
                if (d.aide) enfants.push(h('span', { class: 'aide', text: d.aide }));
                champ = h('div', { class: 'champ' }, enfants);
                if (d.t === 'area') champ.style.gridColumn = '1 / -1';
            }
            corps.appendChild(champ);
        });
        vider();
        return conteneur;
    }

    function champImage(id, d, obj, change) {
        var texte = h('input', { type: 'text', id: id, placeholder: 'Nom de fichier ou adresse' });
        var vignette = h('img', { class: 'vignette', alt: '' });
        var fichier = h('input', { type: 'file', accept: 'image/*', hidden: '' });
        var bouton = h('button', { type: 'button', class: 'bouton bouton-clair bouton-petit', text: 'Envoyer une image' });
        function apercu() { if (texte.value.trim()) vignette.src = O.urlPhoto(texte.value.trim()); else vignette.removeAttribute('src'); }
        texte.value = obj[d.k] == null ? '' : obj[d.k]; apercu();
        texte.addEventListener('input', function () { fixer(obj, d.k, texte.value.trim()); change(); });
        texte.addEventListener('change', apercu);
        vignette.addEventListener('error', function () { vignette.removeAttribute('src'); });
        bouton.addEventListener('click', function () { fichier.click(); });
        fichier.addEventListener('change', function () {
            var f = fichier.files[0]; if (!f) return;
            bouton.disabled = true; bouton.textContent = 'Envoi…';
            envoyerImage(f).then(function (url) { texte.value = url; fixer(obj, d.k, url); apercu(); change(); toast('Image envoyée. N’oublie pas d’enregistrer.'); })
                .catch(function (e) { toast('Envoi impossible : ' + (e && e.message ? e.message : e), true); })
                .then(function () { bouton.disabled = false; bouton.textContent = 'Envoyer une image'; fichier.value = ''; });
        });
        return h('div', { class: 'champ-image' }, [vignette, texte, bouton, fichier]);
    }

    // Réduit l'image (1600 px max) et la convertit en WebP avant l'envoi
    function versWebp(f) {
        return createImageBitmap(f).then(function (bmp) {
            var k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
            var c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
            c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
            return new Promise(function (ok) { c.toBlob(function (b) { ok(b && b.type === 'image/webp' ? b : null); }, 'image/webp', 0.82); });
        }).catch(function () { return null; });
    }
    function envoyerImage(f) {
        return versWebp(f).then(function (webp) {
            var base = f.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'image';
            var corps = webp || f, ext = webp ? 'webp' : (f.name.split('.').pop() || 'png').toLowerCase();
            var nom = Date.now().toString(36) + '-' + base + '.' + ext;
            return client.storage.from('photos').upload(nom, corps, { contentType: webp ? 'image/webp' : f.type, cacheControl: '31536000' }).then(function (r) {
                if (r.error) throw r.error;
                return client.storage.from('photos').getPublicUrl(nom).data.publicUrl;
            });
        });
    }

    function liste(d, obj, change) {
        if (!Array.isArray(obj[d.k])) obj[d.k] = [];
        var tab = obj[d.k];
        var boite = h('div', { class: 'liste' });
        var titre = d.l ? h('h3', { class: 'liste-titre', text: d.l }) : null;

        function rendre(ouvert) {
            boite.textContent = '';
            tab.forEach(function (item, i) {
                var det = h('details', { class: 'item' }); if (i === ouvert) det.open = true;
                var nom = h('span', { class: 'item-titre' });
                function libelle() { nom.textContent = (d.lib ? d.lib(item) : '') || '(sans titre)'; }
                libelle();
                function bouton(sym, label, fait, inactif) {
                    var b = h('button', { type: 'button', 'aria-label': label, title: label, text: sym }); b.disabled = !!inactif;
                    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); fait(); }); return b;
                }
                function deplacer(de, vers) { var x = tab.splice(de, 1)[0]; tab.splice(vers, 0, x); change(); rendre(vers); }
                var outils = h('span', { class: 'mini-boutons' }, [
                    bouton('↑', 'Monter', function () { deplacer(i, i - 1); }, i === 0),
                    bouton('↓', 'Descendre', function () { deplacer(i, i + 1); }, i === tab.length - 1),
                    bouton('✕', 'Supprimer', function () { if (!window.confirm('Supprimer « ' + ((d.lib && d.lib(item)) || 'cet élément') + ' » ?')) return; tab.splice(i, 1); change(); rendre(); })
                ]);
                det.appendChild(h('summary', {}, [nom, outils]));
                var corps = h('div', { class: 'item-corps' });
                corps.appendChild(formulaire(d.item, item, function () { libelle(); change(); }));
                det.appendChild(corps); boite.appendChild(det);
            });
            var ajout = h('button', { type: 'button', class: 'bouton-ajout', text: '+ ' + (d.ajout || 'Ajouter') });
            ajout.addEventListener('click', function () { tab.push({}); change(); rendre(tab.length - 1); });
            boite.appendChild(ajout);
        }
        rendre();
        var tout = h('div'); if (titre) tout.appendChild(titre); tout.appendChild(boite); return tout;
    }

    /* ---------- Affichage d'une rubrique ---------- */
    function afficher(r) {
        courante = r;
        $('rubrique-titre').textContent = r.nom;
        $('rubrique-aide').textContent = r.aide;
        var cible = $('formulaire'); cible.textContent = '';
        cible.appendChild(formulaire(r.champs, donnees[r.cle], function () { modifie[r.cle] = true; majOnglets(); }));
        majOnglets();
        window.scrollTo({ top: 0 });
    }
    function majOnglets() {
        Array.prototype.forEach.call($('onglets').children, function (b, i) {
            var r = RUBRIQUES[i]; b.setAttribute('aria-current', r === courante ? 'true' : 'false'); b.className = modifie[r.cle] ? 'modifie' : '';
        });
    }
    function valeurFinale(r) { var v = donnees[r.cle]; return r.liste ? v.liste : v; }

    function enregistrer() {
        var r = courante, b = $('enregistrer');
        b.disabled = true; b.textContent = 'Enregistrement…';
        client.from('contenus').upsert({ cle: r.cle, valeur: valeurFinale(r) }).then(function (res) {
            if (res.error) throw res.error;
            modifie[r.cle] = false; majOnglets(); toast('Enregistré. Le site est à jour !');
        }).catch(function (e) { toast('Échec de l’enregistrement : ' + (e && e.message ? e.message : e), true); })
          .then(function () { b.disabled = false; b.textContent = 'Enregistrer'; });
    }

    /* ---------- Écrans ---------- */
    function ecran(titre, texte, bouton, action) {
        $('app').hidden = true; var e = $('ecran'); e.hidden = false; e.textContent = '';
        e.appendChild(h('h1', { text: titre })); if (texte) e.appendChild(h('p', { text: texte }));
        if (bouton) { var b = h('button', { type: 'button', class: 'bouton', text: bouton }); b.addEventListener('click', action); e.appendChild(b); }
    }
    function connexionDiscord() { client.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: window.location.origin + window.location.pathname } }); }
    function deconnexion() { client.auth.signOut().then(function () { window.location.reload(); }); }

    function charger() {
        return client.from('contenus').select('cle,valeur').then(function (res) {
            if (res.error) throw res.error;
            var lignes = {}; res.data.forEach(function (l) { lignes[l.cle] = l.valeur; });
            RUBRIQUES.forEach(function (r) {
                var defaut = copie(r.defaut() || (r.liste ? [] : {}));
                var v = lignes[r.cle] != null ? copie(lignes[r.cle]) : defaut;
                if (r.cle === 'pages') v = Object.assign({}, defaut, v);                    // une page absente de la base garde sa copie de départ
                if (r.cle === 'relations') v = v.map(O.normaliserRelation);                 // ancien format -> avis datés
                donnees[r.cle] = r.liste ? { liste: v } : v;
                modifie[r.cle] = false;
            });
        });
    }

    function ouvrirDashboard() {
        return charger().then(function () {
            $('ecran').hidden = true; $('app').hidden = false;
            var nav = $('onglets'); nav.textContent = '';
            RUBRIQUES.forEach(function (r) { var b = h('button', { type: 'button', text: r.nom }); b.addEventListener('click', function () { afficher(r); }); nav.appendChild(b); });
            afficher(RUBRIQUES[0]);
        });
    }

    function demarrer(session) {
        if (!session) {
            $('deconnexion').hidden = true; $('qui').textContent = '';
            ecran('Dashboard', 'Connecte-toi avec Discord pour modifier le site.', 'Se connecter avec Discord', connexionDiscord); return;
        }
        var meta = session.user.user_metadata || {};
        $('qui').textContent = meta.full_name || meta.name || (meta.custom_claims && meta.custom_claims.global_name) || '';
        $('deconnexion').hidden = false;
        client.rpc('est_admin').then(function (r) {
            if (r.error) throw r.error;
            if (!r.data) { ecran('Accès refusé', 'Ce compte Discord n’est pas administrateur du site.', 'Se déconnecter', deconnexion); return; }
            return ouvrirDashboard();
        }).catch(function (e) {
            var msg = e && e.message ? e.message : String(e);
            var base = /est_admin|contenus|schema cache|relation/i.test(msg) ? 'La base n’est pas encore prête : lance le fichier supabase/schema.sql dans Supabase (SQL Editor). ' : '';
            ecran('Erreur', base + msg, 'Se déconnecter', deconnexion);
        });
    }

    /* ---------- Lancement ---------- */
    $('deconnexion').addEventListener('click', deconnexion);
    $('enregistrer').addEventListener('click', enregistrer);
    window.addEventListener('beforeunload', function (e) { if (Object.keys(modifie).some(function (k) { return modifie[k]; })) { e.preventDefault(); e.returnValue = ''; } });
    var demarre = false;
    client.auth.onAuthStateChange(function (evenement, session) {
        if (evenement === 'TOKEN_REFRESHED' || evenement === 'USER_UPDATED') return;
        if (evenement === 'SIGNED_IN' && demarre) return;
        demarre = !!session;
        setTimeout(function () { demarrer(session); }, 0);
    });
})();
