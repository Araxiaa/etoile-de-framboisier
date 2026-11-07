/* ==========================================================================
   ÉDITEUR — l'éditeur de texte du dashboard.
   On écrit par blocs (paragraphe, titre, citation, séparateur, liste, encadré, image, lien),
   et dans un paragraphe on peut mettre en gras, italique, souligné, barré, surligné,
   en couleur, en petites capitales, ou ajouter un lien.
   Ce qu'on voit en écrivant est ce que les visiteurs lisent (même feuille de style).

   Editeur.creer(blocs, onChange, { envoyerImage })  ->  élément à insérer dans la page.
   `blocs` est modifié sur place ; onChange() est appelé à chaque modification.
   ========================================================================== */
(function () {
    'use strict';
    var Riche = window.Riche;

    function h(tag, props, enfants) {
        var el = document.createElement(tag);
        Object.keys(props || {}).forEach(function (k) {
            if (k === 'class') el.className = props[k];
            else if (k === 'text') el.textContent = props[k];
            else if (k === 'html') el.innerHTML = props[k];
            else el.setAttribute(k, props[k]);
        });
        (enfants || []).forEach(function (c) { if (c) el.appendChild(c); });
        return el;
    }

    var TYPES = [
        ['p', 'Paragraphe'], ['titre', 'Titre'], ['soustitre', 'Sous-titre'], ['citation', 'Citation'], ['sep', 'Séparateur'],
        ['liste', 'Liste'], ['encadre', 'Encadré'], ['image', 'Image'], ['lien', 'Lien']
    ];
    var NOMS = {}; TYPES.forEach(function (t) { NOMS[t[0]] = t[1]; });

    function neuf(type) {
        switch (type) {
            case 'p': return { t: 'p', html: '' };
            case 'titre': return { t: 'titre', niveau: 2, texte: '' };
            case 'soustitre': return { t: 'titre', niveau: 3, texte: '' };
            case 'citation': return { t: 'citation', html: '', auteur: '', style: 'grande' };
            case 'sep': return { t: 'sep', motif: 'etoile' };
            case 'liste': return { t: 'liste', items: [''], style: 'etoiles' };
            case 'encadre': return { t: 'encadre', ton: 'note', titre: '', html: '' };
            case 'image': return { t: 'image', src: '', legende: '', taille: 'moyenne' };
            case 'lien': return { t: 'lien', texte: '', href: '', desc: '' };
        }
        return { t: 'p', html: '' };
    }

    /* ---------- Mise en forme : fonctions qui agissent sur la zone en cours d'édition ---------- */
    var GROUPES = { c: /^c-/, m: /^m-/ };

    function deballer(el) {
        var parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
    }

    // Applique (ou retire) une classe de style sur la sélection : <span class="c-mauve">, <mark class="m-miel">, <span class="pc">
    function basculerClasse(zone, classe, groupe, balise) {
        var sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed || !zone.contains(sel.anchorNode)) return false;
        var r = sel.getRangeAt(0);
        // déjà dans un élément de ce style ? on le retire
        var n = r.commonAncestorContainer; if (n.nodeType === 3) n = n.parentNode;
        var existant = n.closest ? n.closest('.' + classe) : null;
        if (existant && zone.contains(existant)) { deballer(existant); return true; }
        var frag = r.extractContents();
        // on retire les styles du même groupe qui seraient déjà dans la sélection
        if (groupe) Array.prototype.forEach.call(frag.querySelectorAll('span,mark'), function (x) {
            var cl = (x.getAttribute('class') || '').split(/\s+/);
            if (cl.some(function (c) { return GROUPES[groupe].test(c); })) deballer(x);
        });
        var span = document.createElement(balise || 'span');
        if (classe) span.className = classe;
        span.appendChild(frag);
        r.insertNode(span);
        sel.removeAllRanges();
        var nr = document.createRange(); nr.selectNodeContents(span); sel.addRange(nr);
        return true;
    }

    function effacerFormat(zone) {
        document.execCommand('removeFormat');
        document.execCommand('unlink');
        var sel = window.getSelection();
        Array.prototype.forEach.call(zone.querySelectorAll('span,mark,sup,sub,b,i,u,s,strong,em'), function (x) {
            if (!sel.rangeCount || sel.containsNode(x, true)) deballer(x);
        });
    }

    /* ---------- Un champ de texte riche (zone éditable) ---------- */
    function champRiche(editeur, valeur, onInput, opts) {
        opts = opts || {};
        var d = h('div', { class: 'zone-riche ' + (opts.classe || ''), contenteditable: 'true', 'data-ph': opts.ph || 'Écris ici…', spellcheck: 'true', role: 'textbox', 'aria-multiline': 'true' });
        d.innerHTML = Riche.nettoyer(valeur);
        d.addEventListener('input', function () { onInput(Riche.nettoyer(d.innerHTML)); });
        d.addEventListener('focus', function () { editeur.cible = d; editeur.majBarre(); });
        d.addEventListener('paste', function (ev) {                 // on colle du texte simple : pas de mise en forme venue d'ailleurs
            ev.preventDefault();
            var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, t);
        });
        d.addEventListener('keydown', function (ev) {
            if (opts.entree && ev.key === 'Enter' && !ev.shiftKey && !ev.ctrlKey) { ev.preventDefault(); opts.entree(d); }
        });
        return d;
    }

    /* ---------- L'éditeur ---------- */
    function creer(blocs, onChange, options) {
        options = options || {};
        var editeur = { cible: null };
        var racine = h('div', { class: 'editeur' });
        var barre = h('div', { class: 'editeur-barre', role: 'toolbar', 'aria-label': 'Mise en forme du texte' });
        var liste = h('div', { class: 'editeur-blocs' });
        var ajout = h('div', { class: 'editeur-ajout' });
        var haut = h('div', { class: 'editeur-haut' });
        var outils = h('div', { class: 'editeur-outils' }, [haut, barre]);
        racine.appendChild(outils); racine.appendChild(liste); racine.appendChild(ajout);

        function change() { if (onChange) onChange(); }

        /* --- Barre d'outils --- */
        var boutons = {};
        function bouton(id, html, titre, action) {
            var b = h('button', { type: 'button', class: 'eb-' + id, title: titre, 'aria-label': titre, html: html });
            b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });      // garde la sélection dans le texte
            b.addEventListener('click', function () { if (!editeur.cible) return; editeur.cible.focus(); action(editeur.cible); editeur.cible.dispatchEvent(new Event('input', { bubbles: true })); editeur.majBarre(); });
            boutons[id] = b;
            return b;
        }
        function menu(id, libelle, titre, choix, appliquer) {
            var conteneur = h('span', { class: 'eb-menu' });
            var b = h('button', { type: 'button', class: 'eb-' + id, title: titre, 'aria-label': titre, 'aria-haspopup': 'true', html: libelle });
            var pop = h('div', { class: 'eb-pop', hidden: '' });
            choix.forEach(function (c) {
                var o = h('button', { type: 'button', class: 'eb-puce', title: c[1], 'aria-label': c[1], html: c[2] || '' });
                if (c[3]) o.style.cssText = c[3];
                o.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
                o.addEventListener('click', function () {
                    pop.hidden = true;
                    if (!editeur.cible) return;
                    editeur.cible.focus(); appliquer(editeur.cible, c[0]); editeur.cible.dispatchEvent(new Event('input', { bubbles: true }));
                });
                pop.appendChild(o);
            });
            b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
            b.addEventListener('click', function () {
                var ouvert = !pop.hidden;
                Array.prototype.forEach.call(racine.querySelectorAll('.eb-pop'), function (p) { p.hidden = true; });
                pop.hidden = ouvert;
            });
            conteneur.appendChild(b); conteneur.appendChild(pop);
            return conteneur;
        }
        var SURLIGNAGES = [['m-miel', 'Surligner en miel', 'A', 'background:linear-gradient(transparent 50%,#F1C27C 50%)'], ['m-azur', 'Surligner en bleu', 'A', 'background:linear-gradient(transparent 50%,#A9DDEF 50%)'],
                           ['m-mauve', 'Surligner en mauve', 'A', 'background:linear-gradient(transparent 50%,#E2BEDA 50%)'], ['m-mousse', 'Surligner en vert', 'A', 'background:linear-gradient(transparent 50%,#C5D6AE 50%)']];
        var COULEURS = [['c-mauve', 'Texte mauve', 'A', 'color:#9A5A8C'], ['c-azur', 'Texte bleu', 'A', 'color:#17728F'], ['c-or', 'Texte doré', 'A', 'color:#8A4A12'],
                        ['c-mousse', 'Texte vert', 'A', 'color:#6A8450'], ['c-gris', 'Texte gris', 'A', 'color:#6F5546'], ['c-brique', 'Texte rouge brique', 'A', 'color:#B4533C']];
        barre.appendChild(bouton('gras', '<b>G</b>', 'Gras (Ctrl+B)', function () { document.execCommand('bold'); }));
        barre.appendChild(bouton('italique', '<i>I</i>', 'Italique (Ctrl+I)', function () { document.execCommand('italic'); }));
        barre.appendChild(bouton('souligne', '<u>S</u>', 'Souligné (Ctrl+U)', function () { document.execCommand('underline'); }));
        barre.appendChild(bouton('barre', '<s>B</s>', 'Barré', function () { document.execCommand('strikeThrough'); }));
        barre.appendChild(h('span', { class: 'eb-sep' }));
        barre.appendChild(menu('surligne', '<span class="eb-marqueur">Surligné</span>', 'Surligner', SURLIGNAGES.concat([['', 'Retirer le surlignage', '×']]), function (z, c) {
            if (!c) { Array.prototype.forEach.call(z.querySelectorAll('mark'), function (x) { if (window.getSelection().containsNode(x, true)) deballer(x); }); return; }
            basculerClasse(z, c, 'm', 'mark');
        }));
        barre.appendChild(menu('couleur', '<span style="color:#9A5A8C">Couleur</span>', 'Couleur du texte', COULEURS.concat([['', 'Couleur normale', '×']]), function (z, c) {
            if (!c) { Array.prototype.forEach.call(z.querySelectorAll('span'), function (x) { if (/(^| )c-/.test(x.className) && window.getSelection().containsNode(x, true)) deballer(x); }); return; }
            basculerClasse(z, c, 'c', 'span');
        }));
        barre.appendChild(bouton('pc', '<span style="font-variant:small-caps">Pc</span>', 'Petites capitales', function (z) { basculerClasse(z, 'pc', null, 'span'); }));
        barre.appendChild(bouton('sup', 'x<sup>2</sup>', 'Exposant', function () { document.execCommand('superscript'); }));
        barre.appendChild(h('span', { class: 'eb-sep' }));
        barre.appendChild(bouton('lien', 'Lien', 'Ajouter un lien', function () {
            var url = window.prompt('Adresse du lien (https://…) :', 'https://');
            if (url && url !== 'https://') document.execCommand('createLink', false, url);
        }));
        barre.appendChild(bouton('effacer', 'Effacer la mise en forme', 'Effacer la mise en forme', function (z) { effacerFormat(z); }));
        barre.appendChild(h('span', { class: 'eb-sep' }));
        barre.appendChild(bouton('annuler', '↶', 'Annuler', function () { document.execCommand('undo'); }));
        barre.appendChild(bouton('refaire', '↷', 'Rétablir', function () { document.execCommand('redo'); }));
        barre.appendChild(h('span', { class: 'eb-aide', text: 'Sélectionne du texte puis choisis une mise en forme.' }));

        editeur.majBarre = function () {
            var actif = !!editeur.cible;
            Array.prototype.forEach.call(barre.querySelectorAll('button'), function (b) { b.disabled = !actif; });
            barre.classList.toggle('actif', actif);
        };
        editeur.majBarre();
        document.addEventListener('click', function (ev) {
            if (!racine.contains(ev.target) || !ev.target.closest('.eb-menu')) Array.prototype.forEach.call(racine.querySelectorAll('.eb-pop'), function (p) { p.hidden = true; });
        });

        /* --- Les blocs --- */
        function selecteur(options, valeur, onChange2, titre) {
            var s = h('select', { 'aria-label': titre }, options.map(function (o) { return h('option', { value: String(o[0]), text: o[1] }); }));
            s.value = String(valeur == null ? options[0][0] : valeur);
            s.addEventListener('change', function () { onChange2(s.value); });
            return s;
        }
        function champ(libelle, el) { return h('label', { class: 'eb-champ' }, [h('span', { text: libelle }), el]); }
        function texte(valeur, onInput, ph) {
            var i = h('input', { type: 'text', placeholder: ph || '' }); i.value = valeur == null ? '' : valeur;
            i.addEventListener('input', function () { onInput(i.value); }); return i;
        }
        function focusSurZone(el) { if (el) { el.focus(); } }

        function corpsBloc(b, i) {
            var corps = h('div', { class: 'eb-corps' });
            switch (b.t) {
                case 'p': {
                    var z = champRiche(editeur, b.html, function (v) { b.html = v; change(); }, {
                        classe: 'p' + (b.lettrine ? ' lettrine' : '') + (b.taille === 'grand' ? ' grand' : b.taille === 'petit' ? ' petit' : '') + (b.align === 'centre' ? ' al-centre' : b.align === 'droite' ? ' al-droite' : ''),
                        ph: 'Écris ton paragraphe… (Entrée : nouveau paragraphe, Maj+Entrée : retour à la ligne)',
                        entree: function (d) { couper(i, d); }
                    });
                    var opts = h('div', { class: 'eb-options' });
                    opts.appendChild(champ('Taille', selecteur([['', 'Normale'], ['grand', 'Grande (chapeau)'], ['petit', 'Petite']], b.taille || '', function (v) { if (v) b.taille = v; else delete b.taille; change(); rendre(i); }, 'Taille')));
                    opts.appendChild(champ('Alignement', selecteur([['', 'À gauche'], ['centre', 'Centré'], ['droite', 'À droite']], b.align || '', function (v) { if (v) b.align = v; else delete b.align; change(); rendre(i); }, 'Alignement')));
                    var l = h('label', { class: 'eb-case' }, [h('input', { type: 'checkbox' }), h('span', { text: 'Lettrine (grande première lettre)' })]);
                    l.firstChild.checked = !!b.lettrine;
                    l.firstChild.addEventListener('change', function () { if (l.firstChild.checked) b.lettrine = true; else delete b.lettrine; change(); rendre(i); });
                    opts.appendChild(l);
                    corps.appendChild(z); corps.appendChild(opts);
                    break;
                }
                case 'titre': {
                    corps.appendChild(champ('Petit texte au-dessus (facultatif)', texte(b.surtitre, function (v) { if (v) b.surtitre = v; else delete b.surtitre; change(); }, 'Ex. Ce qui le porte')));
                    corps.appendChild(champ('Titre', texte(b.texte, function (v) { b.texte = v; change(); }, 'Le titre')));
                    corps.appendChild(champ('Taille', selecteur([[2, 'Grand'], [3, 'Moyen'], [4, 'Petit (étiquette)']], b.niveau || 3, function (v) { b.niveau = parseInt(v, 10); change(); }, 'Taille du titre')));
                    break;
                }
                case 'citation': {
                    corps.appendChild(champRiche(editeur, b.html, function (v) { b.html = v; change(); }, { classe: 'citation-edit', ph: 'La citation…' }));
                    corps.appendChild(h('div', { class: 'eb-options' }, [
                        champ('Auteur (facultatif)', texte(b.auteur, function (v) { b.auteur = v; change(); }, 'Qui parle ?')),
                        champ('Style', selecteur([['grande', 'Grande, centrée'], ['', 'Discrète, à gauche']], b.style || '', function (v) { if (v) b.style = v; else delete b.style; change(); }, 'Style'))
                    ]));
                    break;
                }
                case 'sep': {
                    var aper = h('div', { class: 'sep sep-' + (b.motif || 'etoile') });
                    corps.appendChild(champ('Motif', selecteur([['etoile', 'Étoile'], ['freesia', 'Freesia'], ['pattes', 'Pattes'], ['lune', 'Lune'], ['vague', 'Vague'], ['ligne', 'Simple ligne']], b.motif || 'etoile', function (v) { b.motif = v; aper.className = 'sep sep-' + v; change(); }, 'Motif du séparateur')));
                    corps.appendChild(aper);
                    break;
                }
                case 'liste': {
                    var items = h('div', { class: 'eb-items' });
                    function dessinerItems() {
                        items.textContent = '';
                        (b.items || []).forEach(function (it, k) {
                            var ligne = h('div', { class: 'eb-item' });
                            ligne.appendChild(champRiche(editeur, it, function (v) { b.items[k] = v; change(); }, { classe: 'item-edit', ph: 'Un élément de la liste' }));
                            var x = h('button', { type: 'button', class: 'eb-mini', title: 'Retirer cet élément', 'aria-label': 'Retirer cet élément', text: '×' });
                            x.addEventListener('click', function () { b.items.splice(k, 1); if (!b.items.length) b.items.push(''); change(); dessinerItems(); });
                            ligne.appendChild(x); items.appendChild(ligne);
                        });
                    }
                    dessinerItems();
                    var plus = h('button', { type: 'button', class: 'bouton-ajout', text: '+ Ajouter un élément' });
                    plus.addEventListener('click', function () { b.items.push(''); change(); dessinerItems(); var z2 = items.querySelectorAll('.zone-riche'); focusSurZone(z2[z2.length - 1]); });
                    corps.appendChild(items); corps.appendChild(plus);
                    corps.appendChild(h('div', { class: 'eb-options' }, [
                        champ('Puces', selecteur([['etoiles', 'Étoiles'], ['pattes', 'Pattes'], ['', 'Points']], b.style || '', function (v) { if (v) b.style = v; else delete b.style; change(); }, 'Puces')),
                        h('label', { class: 'eb-case' }, [(function () { var c = h('input', { type: 'checkbox' }); c.checked = !!b.ordre; c.addEventListener('change', function () { if (c.checked) b.ordre = true; else delete b.ordre; change(); }); return c; })(), h('span', { text: 'Liste numérotée' })])
                    ]));
                    break;
                }
                case 'encadre': {
                    corps.appendChild(h('div', { class: 'eb-options' }, [
                        champ('Ton', selecteur([['note', 'Note (bleu)'], ['souvenir', 'Souvenir (doré)'], ['joie', 'Joie (vert)'], ['secret', 'Secret (mauve)'], ['danger', 'Attention (brique)']], b.ton || 'note', function (v) { b.ton = v; change(); rendre(i); }, 'Ton')),
                        champ('Titre (facultatif)', texte(b.titre, function (v) { b.titre = v; change(); }, 'Ex. À retenir'))
                    ]));
                    corps.appendChild(champRiche(editeur, b.html, function (v) { b.html = v; change(); }, { classe: 'encadre-edit ton-' + (b.ton || 'note'), ph: 'Le contenu de l’encadré…' }));
                    break;
                }
                case 'image': {
                    var apercu = h('img', { class: 'eb-apercu', alt: '' });
                    function majApercu() { if (b.src) apercu.src = b.src; else apercu.removeAttribute('src'); apercu.hidden = !b.src; }
                    majApercu();
                    var url = texte(b.src, function (v) { b.src = v.trim(); majApercu(); change(); }, 'Adresse de l’image (ou bouton ci-dessous)');
                    var envoyer = h('button', { type: 'button', class: 'bouton bouton-clair bouton-petit', text: 'Envoyer une image' });
                    var fichier = h('input', { type: 'file', accept: 'image/*', hidden: '' });
                    envoyer.addEventListener('click', function () { fichier.click(); });
                    fichier.addEventListener('change', function () {
                        var f = fichier.files[0]; if (!f || !options.envoyerImage) return;
                        envoyer.disabled = true; envoyer.textContent = 'Envoi…';
                        options.envoyerImage(f).then(function (u) { b.src = u; url.value = u; majApercu(); change(); })
                            .catch(function (e) { window.alert('Envoi impossible : ' + (e && e.message ? e.message : e)); })
                            .then(function () { envoyer.disabled = false; envoyer.textContent = 'Envoyer une image'; fichier.value = ''; });
                    });
                    corps.appendChild(champ('Image', url)); corps.appendChild(h('div', { class: 'eb-ligne' }, [envoyer, fichier])); corps.appendChild(apercu);
                    corps.appendChild(h('div', { class: 'eb-options' }, [
                        champ('Légende (facultatif)', texte(b.legende, function (v) { b.legende = v; change(); }, 'Qui l’a dessinée ? Que voit-on ?')),
                        champ('Taille', selecteur([['petite', 'Petite'], ['moyenne', 'Moyenne'], ['large', 'Pleine largeur']], b.taille || 'moyenne', function (v) { b.taille = v; change(); }, 'Taille')),
                        champ('Alignement', selecteur([['', 'À gauche'], ['centre', 'Centrée']], b.align || '', function (v) { if (v) b.align = v; else delete b.align; change(); }, 'Alignement'))
                    ]));
                    break;
                }
                case 'lien': {
                    corps.appendChild(champ('Texte du bouton', texte(b.texte, function (v) { b.texte = v; change(); }, 'Voir le dossier de soins')));
                    corps.appendChild(champ('Adresse', texte(b.href, function (v) { b.href = v.trim(); change(); }, 'soins.html ou https://…')));
                    corps.appendChild(champ('Petite phrase (facultatif)', texte(b.desc, function (v) { b.desc = v; change(); }, 'Ex. Ses blessures et les soins reçus.')));
                    break;
                }
            }
            return corps;
        }

        // Entrée dans un paragraphe : on coupe là où est le curseur
        function couper(i, zone) {
            var sel = window.getSelection(), b = blocs[i];
            if (!sel.rangeCount) return;
            var r = sel.getRangeAt(0).cloneRange();
            r.deleteContents();
            var reste = document.createRange();
            reste.selectNodeContents(zone);
            reste.setStart(r.endContainer, r.endOffset);
            var tmp = h('div'); tmp.appendChild(reste.extractContents());
            b.html = Riche.nettoyer(zone.innerHTML);
            var nouveau = neuf('p'); nouveau.html = Riche.nettoyer(tmp.innerHTML);
            ['taille', 'align'].forEach(function (k) { if (b[k]) nouveau[k] = b[k]; });
            blocs.splice(i + 1, 0, nouveau);
            change(); rendre(i + 1, true);
        }

        function choixType(apres) {
            var pop = h('div', { class: 'eb-types' });
            TYPES.forEach(function (t) {
                var b = h('button', { type: 'button', text: t[1] });
                b.addEventListener('click', function () { blocs.splice(apres, 0, neuf(t[0])); change(); rendre(apres, true); });
                pop.appendChild(b);
            });
            return pop;
        }

        function rendre(focus, positionnerCurseur) {
            liste.textContent = '';
            editeur.cible = null; editeur.majBarre();
            blocs.forEach(function (b, i) {
                var carte = h('div', { class: 'eb-bloc eb-' + b.t });
                var tete = h('div', { class: 'eb-tete' });
                tete.appendChild(h('span', { class: 'eb-type', text: NOMS[b.t] || b.t }));
                var outils = h('span', { class: 'eb-outils' });
                function mini(sym, titre, fait, off) {
                    var m = h('button', { type: 'button', class: 'eb-mini', title: titre, 'aria-label': titre, text: sym });
                    m.disabled = !!off; m.addEventListener('click', fait); return m;
                }
                outils.appendChild(mini('↑', 'Monter', function () { var x = blocs.splice(i, 1)[0]; blocs.splice(i - 1, 0, x); change(); rendre(i - 1); }, i === 0));
                outils.appendChild(mini('↓', 'Descendre', function () { var x = blocs.splice(i, 1)[0]; blocs.splice(i + 1, 0, x); change(); rendre(i + 1); }, i === blocs.length - 1));
                outils.appendChild(mini('⧉', 'Dupliquer', function () { blocs.splice(i + 1, 0, JSON.parse(JSON.stringify(b))); change(); rendre(i + 1); }));
                outils.appendChild(mini('✕', 'Supprimer ce bloc', function () { if (!window.confirm('Supprimer ce bloc ?')) return; blocs.splice(i, 1); change(); rendre(); }));
                tete.appendChild(outils);
                carte.appendChild(tete);
                carte.appendChild(corpsBloc(b, i));
                var plus = h('button', { type: 'button', class: 'eb-plus', text: '+ Ajouter un bloc ici' });
                var zoneTypes = null;
                plus.addEventListener('click', function () {
                    if (zoneTypes) { zoneTypes.remove(); zoneTypes = null; return; }
                    zoneTypes = choixType(i + 1); carte.appendChild(zoneTypes);
                });
                carte.appendChild(plus);
                liste.appendChild(carte);
            });
            if (focus != null && liste.children[focus]) {
                var cible = liste.children[focus];
                var z = cible.querySelector('.zone-riche, input[type="text"]');
                if (z) {
                    z.focus();
                    if (positionnerCurseur && z.isContentEditable) { var r = document.createRange(); r.selectNodeContents(z); r.collapse(true); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
                }
            }
            if (!blocs.length) liste.appendChild(h('p', { class: 'eb-vide', text: 'Cette section est vide. Ajoute un premier bloc ci-dessous.' }));
        }

        // barre du haut : ajoute un bloc juste après celui où l'on écrit (ou à la fin)
        haut.appendChild(h('span', { class: 'eb-ajout-titre', text: 'Ajouter :' }));
        TYPES.forEach(function (t) {
            var b = h('button', { type: 'button', class: 'eb-ajouter', text: t[1] });
            b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
            b.addEventListener('click', function () {
                var pos = blocs.length, c = editeur.cible && editeur.cible.closest ? editeur.cible.closest('.eb-bloc') : null;
                if (c) pos = Array.prototype.indexOf.call(liste.children, c) + 1;
                blocs.splice(pos, 0, neuf(t[0])); change(); rendre(pos, true);
            });
            haut.appendChild(b);
        });
        ajout.appendChild(h('span', { class: 'eb-ajout-titre', text: 'Ajouter à la fin :' }));
        TYPES.forEach(function (t) {
            var b = h('button', { type: 'button', class: 'bouton bouton-clair bouton-petit', text: '+ ' + t[1] });
            b.addEventListener('click', function () { blocs.push(neuf(t[0])); change(); rendre(blocs.length - 1, true); });
            ajout.appendChild(b);
        });

        rendre();
        return racine;
    }

    window.Editeur = { creer: creer };
})();
