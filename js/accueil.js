/* Accueil — le portrait, le nom, l'âge et les neuf vies (une couronne d'étoiles).
   Données : ACCUEIL (dashboard, rubrique « Accueil ») et VIES. */
window.Donnees.pret(function () {
    'use strict';
    var O = window.Outils;
    var e = O.esc;
    var A = window.ACCUEIL || {};
    var vies = window.VIES || [];

    function poser(id, t) { var el = document.getElementById(id); if (el && t) el.textContent = t; }
    poser('h-fonction', A.fonction);
    poser('h-devise', A.devise ? '« ' + A.devise + ' »' : '');
    var nom = String(A.nom || 'Étoile de Framboisier');
    var h1 = document.getElementById('h-nom');
    if (h1) {
        var mots = nom.split(' ');
        var dernier = mots.pop();
        h1.innerHTML = '<span class="nom-petit">' + e(mots.join(' ')) + '</span><span class="nom-grand">' + e(dernier) + '</span>';
    }
    var img = document.getElementById('h-portrait');
    if (img && A.portrait) img.src = O.urlPhoto(A.portrait);
    if (img) img.addEventListener('error', function () { img.remove(); });

    // La couronne : une étoile par vie ; une vie perdue est une étoile vide, en pointillés
    var couronne = document.getElementById('couronne');
    if (couronne) {
        var n = vies.length || 9, W = 520, H = 150, cx = W / 2, cy = 232, R = 214, svg = '';
        for (var i = 0; i < n; i++) {
            var t = n === 1 ? 0.5 : i / (n - 1);
            var ang = Math.PI * (1.17 + 0.66 * t);
            var x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
            var r = 11 + 15 * (1 - Math.abs(t - 0.5) * 2);
            var pts = [];
            for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? r * 0.46 : r; pts.push((x + q * Math.cos(a)).toFixed(1) + ',' + (y + q * Math.sin(a)).toFixed(1)); }
            var perdue = vies[i] && vies[i].statut === 'perdue';
            svg += '<polygon class="astre' + (perdue ? ' perdue' : '') + '" style="animation-delay:' + (i * 0.28).toFixed(2) + 's" points="' + pts.join(' ') + '"/>';
        }
        couronne.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + vies.filter(function (v) { return v.statut !== 'perdue'; }).length + ' vies sur ' + n + '">' + svg + '</svg>';
    }

    // L'âge et les vies, en deux mots
    var actives = vies.filter(function (v) { return v.statut !== 'perdue'; }).length;
    var faits = document.getElementById('h-faits');
    if (faits) {
        faits.innerHTML =
            '<li><span class="fait-icone" aria-hidden="true">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg></span><span class="etiquette">Âge</span><strong>' + e(A.age || '') + '</strong></li>' +
            '<li><span class="fait-icone" aria-hidden="true">' + O.icone('etoile') + '</span><span class="etiquette">Vies</span><strong>' + actives + ' sur ' + (vies.length || 9) + '</strong></li>';
    }
});
