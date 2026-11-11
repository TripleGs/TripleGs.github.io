/* ==========================================================================
   Joseph Goss — interactive bits
   - hero:    drifting colour blobs that lean toward the cursor; the name's
              letters swell (weight, width) as the cursor passes, and fill
              with photos of Joseph & Natalie as they do
   - roam:    live topographic contours with a hill under the cursor and
              ripples on click; the map-layer stack fans apart on hover/tap
   - Natalie's Journal's bubbles & scissors live in njl.js (shared with
     her Shopify links page)
   Everything runs off one requestAnimationFrame loop, and each section only
   ticks while it's on screen.
   ========================================================================== */
(() => {
    'use strict';

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(pointer: fine)').matches;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rgba = (hex, a) => {
        const n = parseInt(hex.slice(1), 16);
        return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
    };

    /* ------------------------------------------------------------ pointer */
    const OFF = -99999;
    const pointer = { x: OFF, y: OFF, type: 'mouse', moved: 0 };
    const track = e => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.type = e.pointerType || 'mouse';
        pointer.moved = performance.now();
    };
    addEventListener('pointermove', track, { passive: true });
    addEventListener('pointerdown', track, { passive: true });
    const release = e => {
        if (e.pointerType !== 'mouse') { pointer.x = OFF; pointer.y = OFF; }
    };
    addEventListener('pointerup', release, { passive: true });
    addEventListener('pointercancel', release, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { pointer.x = OFF; pointer.y = OFF; });

    /* ------------------------------------------------- Perlin noise (3D) */
    const perm = new Uint8Array(512);
    {
        const p = Array.from({ length: 256 }, (_, i) => i);
        for (let i = 255; i > 0; i--) {
            const j = (Math.random() * (i + 1)) | 0;
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    }
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (h, x, y, z) => {
        h &= 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    };
    function noise3(x, y, z) {
        const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
        const X = fx & 255, Y = fy & 255, Z = fz & 255;
        x -= fx; y -= fy; z -= fz;
        const u = fade(x), v = fade(y), w = fade(z);
        const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
        const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
        return lerp(
            lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
                lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
            lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
                lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
            w);
    }

    /* ----------------------------------------------------- module runner */
    const modules = [];
    function register(root, mod, onFirstView) {
        const m = { ...mod, active: false, seen: false };
        modules.push(m);
        new IntersectionObserver(([e]) => {
            m.active = e.isIntersecting;
            if (m.active && !m.seen) { m.seen = true; onFirstView && onFirstView(); }
        }, { rootMargin: '80px' }).observe(root);
        new ResizeObserver(() => m.resize()).observe(root);
    }

    /* ================================================================ HERO */
    function hero() {
        const root = $('.hero');
        const canvas = $('.hero-canvas', root);
        const ctx = canvas.getContext('2d');
        const name = $('.name', root);
        const palette = ['#5b8cff', '#3fbf6a', '#ec5f9f', '#f2a541', '#a07bff'];

        // Photos that fill the letters as they swell — a different one in each
        // letter, and a letter takes the next photo each time it heats up again.
        const photos = ['rock', 'falls', 'beach', 'lake', 'wedding', 'crew', 'tree']
            .map(f => `url(assets/me/${f}.webp)`);
        photos.forEach(u => { const im = new Image(); im.src = u.slice(4, -1); });
        let photoI = 0;

        // Split the name into letters (the h1 keeps its aria-label).
        const chars = [];
        let n = 0;
        $$('.word', name).forEach(word => {
            const text = word.textContent;
            word.textContent = '';
            for (const c of text) {
                const s = document.createElement('span');
                s.className = 'ch';
                s.textContent = c;
                s.setAttribute('aria-hidden', 'true');
                s.style.setProperty('--n', n);
                s.style.setProperty('--img', photos[photoI++ % photos.length]);
                word.appendChild(s);
                chars.push({ el: s, cx: 0, cy: 0, h: 0, shown: -1, hot: false });
                n++;
            }
        });

        let fontSize = 100;
        const box = { l: 0, r: 0, cy: 0 };
        function measure() {
            fontSize = parseFloat(getComputedStyle(name).fontSize) || 100;
            const nb = name.getBoundingClientRect();
            box.l = nb.left + scrollX;
            box.r = nb.right + scrollX;
            box.cy = nb.top + nb.height / 2 + scrollY;
            chars.forEach(c => {
                const r = c.el.getBoundingClientRect();
                c.cx = r.left + r.width / 2 + scrollX;
                c.cy = r.top + r.height / 2 + scrollY;
            });
        }
        document.fonts && document.fonts.ready.then(measure);
        setTimeout(measure, 1800); // after the letters' entrance animation

        const S = 0.5; // the blobs are soft, so half resolution is plenty
        const blobs = palette.map((c, i) => ({
            c0: rgba(c, 0.42), c1: rgba(c, 0.14), c2: rgba(c, 0),
            x: 0, y: 0, vx: 0, vy: 0, r: 0, seed: i * 1.91,
        }));
        let W = 0, H = 0;
        const probe = { x: 0, y: 0, init: false };

        function resize() {
            W = root.clientWidth;
            H = root.clientHeight;
            canvas.width = Math.ceil(W * S);
            canvas.height = Math.ceil(H * S);
            blobs.forEach((b, i) => {
                b.r = Math.max(W, H) * (0.26 + (i % 3) * 0.06);
                if (!b.x) { b.x = W / 2; b.y = H / 2; }
            });
            measure();
        }

        function tick(now, dt) {
            const rect = root.getBoundingClientRect();
            const px = pointer.x - rect.left, py = pointer.y - rect.top;
            const inside = px >= 0 && py >= 0 && px <= W && py <= H;

            // blobs
            const t = reduce ? 0 : now * 0.00018;
            ctx.setTransform(S, 0, 0, S, 0, 0);
            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'lighter';
            const damp = Math.pow(0.93, dt);
            blobs.forEach((b, i) => {
                let tx = W / 2 + Math.cos(t * (1 + i * 0.17) + b.seed) * W * 0.32;
                let ty = H / 2 + Math.sin(t * (1.3 + i * 0.11) + b.seed * 1.7) * H * 0.3;
                if (inside) {
                    const k = i % 2 ? 0.5 : 0.22;
                    tx = lerp(tx, px, k);
                    ty = lerp(ty, py, k);
                }
                b.vx = (b.vx + (tx - b.x) * 0.0022 * dt) * damp;
                b.vy = (b.vy + (ty - b.y) * 0.0022 * dt) * damp;
                b.x += b.vx * dt;
                b.y += b.vy * dt;
                const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
                g.addColorStop(0, b.c0);
                g.addColorStop(0.5, b.c1);
                g.addColorStop(1, b.c2);
                ctx.fillStyle = g;
                ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
            });

            // letters: follow the real cursor, or sweep on their own when idle
            const idle = now - pointer.moved > 2500 || pointer.type !== 'mouse' || !inside;
            let qx, qy;
            if (idle) {
                if (reduce) { qx = OFF; qy = OFF; } else {
                    const span = box.r - box.l + fontSize * 2;
                    qx = box.l - fontSize + span * (0.5 + 0.5 * Math.sin(now * 0.0009));
                    qy = box.cy + Math.sin(now * 0.0021) * fontSize * 0.5;
                }
            } else {
                qx = pointer.x + scrollX;
                qy = pointer.y + scrollY;
            }
            if (!probe.init || qx === OFF) { probe.x = qx; probe.y = qy; probe.init = true; }
            probe.x = lerp(probe.x, qx, clamp(0.16 * dt, 0, 1));
            probe.y = lerp(probe.y, qy, clamp(0.16 * dt, 0, 1));

            const R = fontSize * 1.15;
            for (const c of chars) {
                const d = Math.hypot(c.cx - probe.x, (c.cy - probe.y) * 1.2);
                let target = clamp(1 - d / R, 0, 1);
                target = target * target * (3 - 2 * target);
                // a cold letter that starts heating up picks up the next photo
                if (!c.hot && target > 0.12) {
                    c.hot = true;
                    if (c.h < 0.02) c.el.style.setProperty('--img', photos[photoI++ % photos.length]);
                } else if (c.hot && target < 0.02 && c.h < 0.02) {
                    c.hot = false;
                }
                c.h = lerp(c.h, target, clamp(0.2 * dt, 0, 1));
                if (Math.abs(c.h - c.shown) > 0.003) {
                    c.shown = c.h;
                    c.el.style.fontVariationSettings = `"wght" ${Math.round(500 + 220 * c.h)}, "wdth" ${(100 - 10 * c.h).toFixed(1)}`;
                    c.el.style.setProperty('--h', c.h.toFixed(3));
                }
            }
        }

        register(root, { tick, resize });
    }

    /* ================================================================ ROAM */
    function roam() {
        const root = $('#roam');
        const canvas = $('.topo', root);
        const ctx = canvas.getContext('2d');
        const stage = $('.stage', root);
        const stack = $('.stack', root);
        const tag = $('.layer-tag', root);
        const tagName = $('.lt-name', tag);
        const tagDesc = $('.lt-desc', tag);
        const layers = $$('.layer', stack);

        // The layer under the cursor lights up and the label names it. A layer
        // has to be rested on for a moment before it takes over, so sweeping
        // down to the label's link doesn't switch layers on the way.
        let hot = null, intent = 0, idle = 0;
        function setHot(layer) {
            if (hot === layer) return;
            if (hot) hot.classList.remove('is-hot');
            hot = layer;
            stack.classList.toggle('has-hot', !!layer);
            if (layer) {
                layer.classList.add('is-hot');
                tagName.textContent = layer.dataset.name;
                tagDesc.textContent = layer.dataset.desc;
                tag.setAttribute('aria-label', `${layer.dataset.name} on Roam Community`);
            }
            tag.classList.toggle('show', !!layer);
        }
        // fold everything back up
        function collapse() {
            clearTimeout(intent);
            clearTimeout(idle);
            st.open = false;
            st.hover = false;
            setHot(null);
        }
        // on a touch screen, fold up again after a while with no taps
        function touchIdle() {
            clearTimeout(idle);
            idle = setTimeout(collapse, 6000);
        }
        layers.forEach(layer => {
            layer.addEventListener('pointerenter', e => {
                if (e.pointerType !== 'mouse') return;
                clearTimeout(intent);
                intent = setTimeout(() => setHot(layer), hot ? 140 : 40);
            });
            layer.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') clearTimeout(intent); });
            layer.addEventListener('pointerdown', e => {
                if (e.pointerType === 'mouse' || !st.open) return;
                setHot(layer);
                touchIdle();
            });
        });
        tag.addEventListener('pointerenter', () => clearTimeout(intent));

        const STEP = 0.085, BASE = -3, NLEV = Math.ceil(7.5 / STEP);
        const pts = new Float32Array(8);
        let minor = [], major = [];
        let W = 0, H = 0, dpr = 1, cell = 14, cols = 0, rows = 0;
        let field = new Float32Array(0);
        let mx = OFF, my = OFF, amp = 0, zt = Math.random() * 50;
        const ripples = [];
        const RIPPLE_MS = 3200;
        const st = { rx: 58, rz: -34, gap: 20, open: false, hover: false };
        let stackW = 400;

        // a mouse spreads the stack while it's over it, and leaving folds it up
        stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') st.hover = true; });
        stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') collapse(); });
        // a tap spreads it (later taps name the layer tapped); tapping anywhere
        // else in the section, or leaving it alone for a bit, folds it up
        stage.addEventListener('click', e => {
            if (pointer.type === 'mouse' || e.target.closest('.layer-tag')) return;
            st.open = true;
            touchIdle();
        });
        root.addEventListener('click', e => {
            if (e.target.closest('a, .stage')) return;
            collapse();
            const r = root.getBoundingClientRect();
            ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
            if (ripples.length > 5) ripples.shift();
        });

        function resize() {
            W = root.clientWidth;
            H = root.clientHeight;
            dpr = Math.min(devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            cell = clamp(Math.round(Math.sqrt((W * H) / 6500)), 11, 18);
            cols = Math.ceil(W / cell) + 1;
            rows = Math.ceil(H / cell) + 1;
            field = new Float32Array(cols * rows);
            stackW = stack.offsetWidth;
        }

        function tick(now, dt) {
            const r = root.getBoundingClientRect();
            const px = pointer.x - r.left, py = pointer.y - r.top;
            const inside = px >= 0 && py >= 0 && px <= W && py <= H;
            if (inside) {
                if (mx === OFF) { mx = px; my = py; }
                const k = clamp(0.14 * dt, 0, 1);
                mx = lerp(mx, px, k);
                my = lerp(my, py, k);
            }
            amp = lerp(amp, inside ? 1 : 0, clamp(0.05 * dt, 0, 1));
            if (!reduce) zt += 0.0016 * dt;

            while (ripples.length && now - ripples[0].t > RIPPLE_MS) ripples.shift();

            // --- height field: two octaves of noise + a hill under the cursor + click ripples
            const s1 = 1 / 280, s2 = s1 * 2.2;
            const HILL = 2 * 150 * 150, HILL_CUT = HILL * 4.5;
            for (let j = 0; j < rows; j++) {
                const y = j * cell;
                for (let i = 0; i < cols; i++) {
                    const x = i * cell;
                    let v = noise3(x * s1, y * s1, zt) + 0.42 * noise3(x * s2 + 40, y * s2 + 17, zt * 1.6);
                    if (amp > 0.01) {
                        const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
                        if (d2 < HILL_CUT) v += amp * 1.25 * Math.exp(-d2 / HILL);
                    }
                    for (let q = 0; q < ripples.length; q++) {
                        const rp = ripples[q];
                        const age = (now - rp.t) / RIPPLE_MS;
                        const rad = age * 760;
                        const d = Math.hypot(x - rp.x, y - rp.y) - rad;
                        if (d > -150 && d < 150) v += (1 - age) * 0.95 * Math.exp(-(d * d) / 2400);
                    }
                    field[j * cols + i] = v;
                }
            }

            // --- marching squares, only for the levels each cell actually spans
            minor.length = 0;
            major.length = 0;
            for (let j = 0; j < rows - 1; j++) {
                const y0 = j * cell, y1 = y0 + cell;
                for (let i = 0; i < cols - 1; i++) {
                    const x0 = i * cell, x1 = x0 + cell;
                    const a = field[j * cols + i], b = field[j * cols + i + 1];
                    const c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
                    const lo = Math.min(a, b, c, d), hi = Math.max(a, b, c, d);
                    const k0 = Math.max(0, Math.ceil((lo - BASE) / STEP));
                    const k1 = Math.min(NLEV - 1, Math.floor((hi - BASE) / STEP));
                    for (let k = k0; k <= k1; k++) {
                        const L = BASE + k * STEP;
                        let n = 0;
                        if ((a < L) !== (b < L)) { pts[n++] = x0 + ((L - a) / (b - a)) * cell; pts[n++] = y0; }
                        if ((b < L) !== (c < L)) { pts[n++] = x1; pts[n++] = y0 + ((L - b) / (c - b)) * cell; }
                        if ((d < L) !== (c < L)) { pts[n++] = x0 + ((L - d) / (c - d)) * cell; pts[n++] = y1; }
                        if ((a < L) !== (d < L)) { pts[n++] = x0; pts[n++] = y0 + ((L - a) / (d - a)) * cell; }
                        const out = k % 5 === 0 ? major : minor;
                        if (n >= 4) out.push(pts[0], pts[1], pts[2], pts[3]);
                        if (n === 8) out.push(pts[4], pts[5], pts[6], pts[7]);
                    }
                }
            }

            // --- draw: lines glow where the cursor is
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            const gx = mx === OFF ? W / 2 : mx, gy = mx === OFF ? H / 2 : my;
            const gMinor = ctx.createRadialGradient(gx, gy, 0, gx, gy, 360);
            gMinor.addColorStop(0, `rgba(140,200,255,${(0.08 + 0.6 * amp).toFixed(3)})`);
            gMinor.addColorStop(1, 'rgba(255,255,255,0.06)');
            const gMajor = ctx.createRadialGradient(gx, gy, 0, gx, gy, 360);
            gMajor.addColorStop(0, `rgba(95,224,143,${(0.18 + 0.75 * amp).toFixed(3)})`);
            gMajor.addColorStop(1, 'rgba(255,255,255,0.14)');
            const stroke = (arr, style, width) => {
                if (!arr.length) return;
                ctx.beginPath();
                for (let q = 0; q < arr.length; q += 4) {
                    ctx.moveTo(arr[q], arr[q + 1]);
                    ctx.lineTo(arr[q + 2], arr[q + 3]);
                }
                ctx.strokeStyle = style;
                ctx.lineWidth = width;
                ctx.stroke();
            };
            stroke(minor, gMinor, 0.9);
            stroke(major, gMajor, 1.4);

            // --- the 3D layer stack
            // the stack tilts toward a mouse; a finger shouldn't swing it mid-tap
            const tilt = inside && pointer.type === 'mouse';
            const nx = tilt ? clamp((px / W) * 2 - 1, -1, 1) : 0;
            const ny = tilt ? clamp((py / H) * 2 - 1, -1, 1) : 0;
            const open = st.open || st.hover || !!hot;
            const breathe = reduce ? 0 : Math.sin(now * 0.0012) * 0.25;
            const k = clamp(0.08 * dt, 0, 1);
            // sixteen layers: a tight deck at rest, fanned out when in use
            st.gap = lerp(st.gap, stackW * (open ? 0.05 : 0.011 * (1 + breathe)), k);
            st.rz = lerp(st.rz, -34 + nx * 16 + (open ? 10 : 0), k);
            st.rx = lerp(st.rx, 58 - ny * 8 - (open ? 6 : 0), k);
            stack.style.setProperty('--gap', `${st.gap.toFixed(2)}px`);
            stack.style.setProperty('--rz', `${st.rz.toFixed(2)}deg`);
            stack.style.setProperty('--rx', `${st.rx.toFixed(2)}deg`);
        }

        register(root, { tick, resize });
    }

    /* ================================================== top bar (mini logo) */
    function topbar() {
        const bar = $('.topbar');
        new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting))
            .observe($('.hero .name'));
        const icons = $$('.tb-icon', bar);
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                icons.forEach(i => i.setAttribute('aria-current', String(i.dataset.section === e.target.id)));
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        ['roam', 'natalie'].forEach(id => io.observe(document.getElementById(id)));
    }

    /* ======================================================== small things */
    function magnets() {
        if (!finePointer || reduce) return;
        $$('.mag').forEach(el => {
            const k = el.classList.contains('btn') ? 0.18 : 0.32;
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - (r.left + r.width / 2)) * k;
                const y = (e.clientY - (r.top + r.height / 2)) * k;
                el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
            });
            el.addEventListener('pointerleave', () => { el.style.translate = ''; });
        });
    }

    function reveals() {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.15 });
        $$('.reveal').forEach(el => io.observe(el));
    }

    hero();
    roam();
    topbar();
    magnets();
    reveals();

    let last = performance.now();
    function frame(now) {
        const dt = clamp((now - last) / 16.667, 0.25, 3);
        last = now;
        for (const m of modules) if (m.active) m.tick(now, dt);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
