/* ==========================================================================
   ANIMATIONS — pétales, lucioles, apparition des sections.
   Les effets purement visuels sont dans css/animations.css.
   ========================================================================== */
(function () {
    'use strict';
    var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function ambiance() {
        if (reduit) return;
        var c = document.createElement('div');
        c.className = 'ambiance';
        c.setAttribute('aria-hidden', 'true');
        var couleurs = ['#C07AAE', '#FFF3E0', '#E9B8D6', '#F7CF7F'];
        for (var i = 0; i < 8; i++) {
            var p = document.createElement('span');
            p.className = 'petale';
            p.style.cssText = '--x:' + (6 + i * 12) + '%;--t:' + (10 + (i * 7) % 9) + 'px;--d:' + (18 + (i * 5) % 9) + 's;--delai:-' + (i * 2.8).toFixed(1) + 's;--c:' + couleurs[i % 4] + ';';
            c.appendChild(p);
        }
        for (var j = 0; j < 12; j++) {
            var l = document.createElement('span');
            l.className = 'luciole';
            l.style.cssText = '--x:' + ((j * 37) % 96 + 2) + '%;--y:' + ((j * 53) % 80 + 8) + '%;--d:' + (6 + (j * 3) % 7) + 's;--delai:-' + (j * 1.3).toFixed(1) + 's;';
            c.appendChild(l);
        }
        document.body.appendChild(c);
    }

    function reveler() {
        if (reduit || !('IntersectionObserver' in window)) return;
        var obs = new IntersectionObserver(function (entrees) {
            entrees.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.classList.add('vu');
                obs.unobserve(en.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
        Array.prototype.forEach.call(document.querySelectorAll('.bloc-section'), function (el, i) {
            if (i === 0 || el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
            el.classList.add('a-reveler');
            obs.observe(el);
        });
    }

    function init() {
        ambiance();
        if (window.Donnees) window.Donnees.pret(function () { setTimeout(reveler, 80); }); else reveler();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
