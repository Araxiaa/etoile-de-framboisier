/* ==========================================================================
   RICHE — le texte riche : des blocs (paragraphe, titre, citation, séparateur…)
   transformés en HTML propre et sécurisé. Utilisé par le site ET par l'éditeur du dashboard.

   Un bloc :
     { t: 'p',       html, lettrine?, taille?: 'grand'|'petit', align?: 'centre'|'droite' }
     { t: 'titre',   texte, niveau: 2|3|4, surtitre? }
     { t: 'citation',html, auteur?, style?: 'grande' }
     { t: 'sep',     motif: 'etoile'|'freesia'|'pattes'|'vague'|'lune'|'ligne' }
     { t: 'liste',   items: [html…], ordre?: true, style?: 'etoiles'|'pattes' }
     { t: 'encadre', ton: 'note'|'secret'|'danger'|'souvenir'|'joie', titre?, html }
     { t: 'image',   src, legende?, taille?: 'petite'|'large', align? }
     { t: 'lien',    texte, href, desc? }
   Dans le texte (html), seuls ces styles sont gardés : gras, italique, souligné, barré,
   surlignage, couleur, petites capitales, exposant, lien, retour à la ligne.
   ========================================================================== */
(function () {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ---------- Nettoyage du texte riche ---------- */
    var CLASSES = /^(c-(mauve|azur|or|mousse|gris|brique)|m-(miel|azur|mauve|mousse)|pc)$/;
    var BALISES = { B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u', S: 's', STRIKE: 's', DEL: 's', SUB: 'sub', SUP: 'sup', BR: 'br', MARK: 'mark', SPAN: 'span', A: 'a' };

    function urlSure(u) {
        u = String(u || '').trim();
        return /^(https?:|mailto:|#|\/|[a-z0-9_.\-]+\.html)/i.test(u) && !/^\s*javascript:/i.test(u) ? u : '';
    }

    function nettoyerNoeud(noeud, sortie) {
        noeud.childNodes.forEach(function (n) {
            if (n.nodeType === 3) { sortie.appendChild(document.createTextNode(n.nodeValue)); return; }
            if (n.nodeType !== 1) return;
            var tag = BALISES[n.nodeName];
            if (!tag) {
                // balise inconnue : on garde son contenu ; un bloc (div, p) devient un retour à la ligne
                if (/^(DIV|P|LI)$/.test(n.nodeName) && sortie.lastChild && sortie.lastChild.nodeName !== 'BR') sortie.appendChild(document.createElement('br'));
                nettoyerNoeud(n, sortie);
                return;
            }
            if (tag === 'br') { sortie.appendChild(document.createElement('br')); return; }
            var el = document.createElement(tag);
            if (tag === 'a') {
                var href = urlSure(n.getAttribute('href'));
                if (!href) { nettoyerNoeud(n, sortie); return; }
                el.setAttribute('href', href);
                if (/^https?:/i.test(href)) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
            } else if (tag === 'span' || tag === 'mark') {
                var classes = (n.getAttribute('class') || '').split(/\s+/).filter(function (c) { return CLASSES.test(c); });
                if (tag === 'mark' && !classes.some(function (c) { return /^m-/.test(c); })) classes.push('m-miel');
                if (!classes.length) { nettoyerNoeud(n, sortie); return; }
                el.className = classes.join(' ');
            }
            nettoyerNoeud(n, el);
            sortie.appendChild(el);
        });
    }

    function nettoyer(html) {
        var src = document.createElement('div');
        src.innerHTML = String(html == null ? '' : html);
        var out = document.createElement('div');
        nettoyerNoeud(src, out);
        // pas de retours à la ligne en tête ou en queue
        while (out.firstChild && out.firstChild.nodeName === 'BR') out.removeChild(out.firstChild);
        while (out.lastChild && out.lastChild.nodeName === 'BR') out.removeChild(out.lastChild);
        return out.innerHTML;
    }

    function texteBrut(html) {
        var d = document.createElement('div');
        d.innerHTML = nettoyer(html);
        return d.textContent || '';
    }

    /* ---------- Séparateurs : dessinés une fois, réutilisés partout ---------- */
    var MOTIFS = ['etoile', 'freesia', 'pattes', 'vague', 'lune', 'ligne'];

    function classeAlign(a) { return a === 'centre' ? ' al-centre' : a === 'droite' ? ' al-droite' : ''; }

    /* ---------- Rendu d'un bloc ---------- */
    function bloc(b) {
        if (!b || !b.t) return '';
        switch (b.t) {
            case 'p': {
                var c = 'p' + (b.lettrine ? ' lettrine' : '') + (b.taille === 'grand' ? ' grand' : b.taille === 'petit' ? ' petit' : '') + classeAlign(b.align);
                return '<p class="' + c + '">' + nettoyer(b.html) + '</p>';
            }
            case 'titre': {
                var n = b.niveau === 2 ? 2 : b.niveau === 4 ? 4 : 3;
                var tag = 'h' + (n + 1);
                return '<div class="titre-bloc t' + n + classeAlign(b.align) + '">' +
                    (b.surtitre ? '<span class="surtitre">' + esc(b.surtitre) + '</span>' : '') +
                    '<' + tag + '>' + esc(b.texte) + '</' + tag + '></div>';
            }
            case 'citation':
                return '<figure class="citation' + (b.style === 'grande' ? ' grande' : '') + '"><blockquote>' + nettoyer(b.html) + '</blockquote>' +
                    (b.auteur ? '<figcaption>' + esc(b.auteur) + '</figcaption>' : '') + '</figure>';
            case 'sep':
                return '<div class="sep sep-' + (MOTIFS.indexOf(b.motif) >= 0 ? b.motif : 'etoile') + '" role="separator"></div>';
            case 'liste': {
                var tagL = b.ordre ? 'ol' : 'ul';
                var st = b.style === 'pattes' ? ' liste-pattes' : b.style === 'etoiles' ? ' liste-etoiles' : '';
                return '<' + tagL + ' class="liste' + st + '">' + (b.items || []).map(function (i) { return '<li>' + nettoyer(i) + '</li>'; }).join('') + '</' + tagL + '>';
            }
            case 'encadre': {
                var ton = /^(note|secret|danger|souvenir|joie)$/.test(b.ton) ? b.ton : 'note';
                return '<aside class="encadre ton-' + ton + '">' + (b.titre ? '<strong class="encadre-titre">' + esc(b.titre) + '</strong>' : '') +
                    '<div class="encadre-corps">' + nettoyer(b.html) + '</div></aside>';
            }
            case 'image': {
                var src = urlSure(b.src);
                if (!src) return '';
                return '<figure class="image-bloc' + (b.taille === 'petite' ? ' petite' : b.taille === 'large' ? ' large' : '') + classeAlign(b.align) + '"><img src="' + esc(src) + '" alt="' + esc(b.legende || '') + '" loading="lazy">' +
                    (b.legende ? '<figcaption>' + esc(b.legende) + '</figcaption>' : '') + '</figure>';
            }
            case 'lien': {
                var href = urlSure(b.href);
                if (!href) return '';
                return '<a class="lien-carte" href="' + esc(href) + '"' + (/^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '') + '><b>' + esc(b.texte || href) + '</b>' +
                    (b.desc ? '<span>' + esc(b.desc) + '</span>' : '') + '<i aria-hidden="true">→</i></a>';
            }
        }
        return '';
    }

    function blocs(liste) { return (liste || []).map(bloc).join(''); }

    window.Riche = { html: blocs, bloc: bloc, nettoyer: nettoyer, texteBrut: texteBrut, esc: esc, MOTIFS: MOTIFS };
})();
