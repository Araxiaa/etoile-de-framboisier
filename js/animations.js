/* ==========================================================================
   ANIMATIONS — la partie qui demande un peu de code.
   Les effets purement visuels sont dans css/animations.css.
   ========================================================================== */
(function () {
    'use strict';

    var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* ---------- Pétales de freesia (jour) et lucioles (nuit) ---------- */
    function ambiance() {
        if (reduit) return;
        var conteneur = document.createElement('div');
        conteneur.className = 'ambiance';
        conteneur.setAttribute('aria-hidden', 'true');

        var couleurs = ['#C07AAE', '#FFF3E0', '#E9B8D6', '#F7CF7F'];   // freesias mauves, crème, miel
        for (var i = 0; i < 9; i++) {
            var p = document.createElement('span');
            p.className = 'petale';
            p.style.cssText =
                '--x:' + (6 + i * 10.5) + '%;' +
                '--t:' + (10 + (i * 7) % 9) + 'px;' +
                '--d:' + (16 + (i * 5) % 9) + 's;' +
                '--delai:-' + (i * 2.6).toFixed(1) + 's;' +
                '--c:' + couleurs[i % 4] + ';';
            conteneur.appendChild(p);
        }
        for (var j = 0; j < 14; j++) {
            var l = document.createElement('span');
            l.className = 'luciole';
            l.style.cssText =
                '--x:' + ((j * 37) % 96 + 2) + '%;' +
                '--y:' + ((j * 53) % 80 + 8) + '%;' +
                '--d:' + (6 + (j * 3) % 7) + 's;' +
                '--delai:-' + (j * 1.3).toFixed(1) + 's;';
            conteneur.appendChild(l);
        }
        document.body.appendChild(conteneur);
    }

    /* ---------- Le portrait suit la souris, très légèrement ---------- */
    function portrait() {
        var img = document.querySelector('.portrait-cadre img');
        var survol = window.matchMedia && window.matchMedia('(hover: hover)').matches;
        if (!img || reduit || !survol) return;
        var attente = false, x = 0, y = 0;
        document.addEventListener('pointermove', function (e) {
            x = e.clientX / window.innerWidth - 0.5;
            y = e.clientY / window.innerHeight - 0.5;
            if (attente) return;
            attente = true;
            window.requestAnimationFrame(function () {
                img.style.transform = 'translate(' + (x * -12).toFixed(1) + 'px,' + (y * -9).toFixed(1) + 'px) scale(1.08)';
                attente = false;
            });
        });
    }

    /* ---------- Apparition des blocs au défilement ---------- */
    var observateur = null;
    function reveler() {
        if (reduit || !('IntersectionObserver' in window)) return;
        var cibles = '.revele, .carte-nav, .article, .periode, .sujet, .relation, .fiche-chat, .oeuvre, .trait, .lune-groupe, .action, .souvenir, .blessure';

        if (!observateur) {
            observateur = new IntersectionObserver(function (entrees) {
                var rang = 0;
                entrees.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    var el = e.target;
                    el.style.transitionDelay = Math.min(rang, 5) * 70 + 'ms';
                    rang++;
                    el.classList.add('vu');
                    observateur.unobserve(el);
                    el.addEventListener('transitionend', function nettoyer() {
                        el.style.transitionDelay = '';
                        el.removeEventListener('transitionend', nettoyer);
                    });
                });
            }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
        }
        Array.prototype.forEach.call(document.querySelectorAll(cibles), function (el) {
            if (el.classList.contains('a-reveler') || el.closest('[hidden]')) return;
            if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
            el.classList.add('a-reveler');
            observateur.observe(el);
        });
    }

    function init() {
        ambiance();
        portrait();
        // les listes venues de la base sont construites avant l'apparition au défilement
        if (window.Donnees) window.Donnees.pret(reveler); else reveler();
        // un onglet qui s'ouvre révèle ses blocs visibles
        window.addEventListener('onglet-change', function () { setTimeout(reveler, 60); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
