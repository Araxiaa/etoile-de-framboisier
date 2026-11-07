/* AMBIANCE — le fond vivant : pétales et pollen le jour, étoiles (et filantes) la nuit.
   Un halo de lumière suit le curseur. Tout s'arrête si l'onglet est caché ou si
   l'appareil demande « moins d'animations ». Pour tout couper : retirer ce script. */
(function () {
    'use strict';
    var cv = document.getElementById('ambiance'), halo = document.querySelector('.halo');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, parts = [], filante = null, actif = true, raf = 0, dernier = 0;
    var calme = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function nuit() { return document.documentElement.getAttribute('data-theme') === 'nuit'; }
    function r(a, b) { return a + Math.random() * (b - a); }

    function creer() {
        parts = [];
        var n = Math.round(Math.min(70, Math.max(26, W / 22)));
        for (var i = 0; i < n; i++) parts.push(nuit() ? etoile() : petale(true));
    }
    function etoile() { return { x: r(0, W), y: r(0, H), t: r(.6, 1.9), ph: r(0, 6.28), v: r(.6, 1.8), c: Math.random() < .2 ? '#FFD69A' : '#FFFFFF' }; }
    function petale(init) {
        var pollen = Math.random() < .45;
        return { x: r(0, W), y: init ? r(0, H) : -20, t: pollen ? r(1.2, 2.6) : r(5, 9), vy: r(.15, .5), vx: r(-.15, .3), ph: r(0, 6.28), rot: r(0, 6.28), vr: r(-.01, .01), pollen: pollen };
    }
    function redim() {
        dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
        cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); creer(); if (calme) dessiner(0);
    }
    function dessiner(t) {
        ctx.clearRect(0, 0, W, H);
        var n = nuit();
        parts.forEach(function (p) {
            if (n) {
                ctx.globalAlpha = .25 + .75 * (.5 + .5 * Math.sin(t / 1000 * p.v + p.ph));
                ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.t * .7, 0, 6.28); ctx.fill();
            } else if (p.pollen) {
                ctx.globalAlpha = .55; ctx.fillStyle = '#F5C078'; ctx.beginPath(); ctx.arc(p.x, p.y, p.t, 0, 6.28); ctx.fill();
            } else {
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = .55; ctx.fillStyle = '#E58AA3';
                ctx.beginPath(); ctx.ellipse(0, 0, p.t, p.t * .5, 0, 0, 6.28); ctx.fill(); ctx.restore();
            }
        });
        if (n && filante) {
            var f = filante; ctx.globalAlpha = f.vie; ctx.strokeStyle = '#FFE9A8'; ctx.lineWidth = 1.6; ctx.beginPath();
            ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - f.dx * 14, f.y - f.dy * 14); ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    function pas(t) {
        raf = requestAnimationFrame(pas);
        var dt = Math.min(48, t - dernier); dernier = t; var k = dt / 16;
        var n = nuit();
        if (!n) parts.forEach(function (p, i) {
            if (p.t === undefined || p.vy === undefined) { parts[i] = petale(false); return; }
            p.ph += .01 * k; p.x += (p.vx + Math.sin(p.ph) * .3) * k; p.y += p.vy * k; p.rot += (p.vr || 0) * k;
            if (p.y > H + 20 || p.x > W + 20) { parts[i] = petale(false); parts[i].x = r(-20, W); }
        });
        else {
            parts.forEach(function (p, i) { if (p.v === undefined) parts[i] = etoile(); });
            if (!filante && Math.random() < .004) filante = { x: r(W * .2, W), y: r(0, H * .4), dx: 1, dy: .55, vie: 1 };
            if (filante) { filante.x -= 9 * k; filante.y += 5 * k; filante.vie -= .02 * k; if (filante.vie <= 0) filante = null; }
        }
        dessiner(t);
    }
    function demarrer() { if (calme || raf || !actif) return; dernier = performance.now(); raf = requestAnimationFrame(pas); }
    function arreter() { cancelAnimationFrame(raf); raf = 0; }
    document.addEventListener('visibilitychange', function () { actif = !document.hidden; if (actif) demarrer(); else arreter(); });
    addEventListener('resize', redim);
    new MutationObserver(function () { creer(); if (calme) dessiner(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Le halo de lumière qui suit le curseur (souris uniquement)
    if (halo && window.matchMedia && matchMedia('(pointer: fine)').matches && !calme) {
        var hx = 0, hy = 0, en = false;
        addEventListener('pointermove', function (e) {
            hx = e.clientX; hy = e.clientY; if (!en) { en = true; halo.classList.add('on'); }
            halo.style.transform = 'translate(' + hx + 'px,' + hy + 'px)';
        }, { passive: true });
        document.addEventListener('mouseleave', function () { halo.classList.remove('on'); en = false; });
    }
    redim(); demarrer();
})();
