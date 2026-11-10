/* ==========================================================================
   Natalie's Journal — bubbles & scissors
   Shared by josephgoss.com and the Shopify links page (NataliesJournal/
   nj-links.liquid inlines this file — run build.py there after editing it).

   Markup it expects inside a [data-njl] element:
     .njl-bubbles > a.njl-bubble[data-name][data-big?] > .njl-blob > img
     .njl-cuts, canvas.njl-scissors, .njl-card
   ========================================================================== */
(() => {
    'use strict';
    if (window.__njlBoot) return; // one copy of the code, however many sections
    window.__njlBoot = true;

    const OFF = -99999;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;

    const pointer = { x: OFF, y: OFF, type: 'mouse', target: null };
    const track = e => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.type = e.pointerType || 'mouse';
        pointer.target = e.target;
    };
    addEventListener('pointermove', track, { passive: true });
    addEventListener('pointerdown', track, { passive: true });
    const release = e => { if (e.pointerType !== 'mouse') { pointer.x = OFF; pointer.y = OFF; } };
    addEventListener('pointerup', release, { passive: true });
    addEventListener('pointercancel', release, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { pointer.x = OFF; pointer.y = OFF; });

    // where segment AB crosses segment CD (strictly inside both), or null
    function crossing(a, b, c, d) {
        const r1x = b.x - a.x, r1y = b.y - a.y, r2x = d.x - c.x, r2y = d.y - c.y;
        const den = r1x * r2y - r1y * r2x;
        if (Math.abs(den) < 1e-9) return null;
        const qx = c.x - a.x, qy = c.y - a.y;
        const t = (qx * r2y - qy * r2x) / den;
        const u = (qx * r1y - qy * r1x) / den;
        if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null;
        return { x: a.x + t * r1x, y: a.y + t * r1y };
    }

    function polyStats(poly) {
        let area = 0, per = 0;
        for (let i = 0; i < poly.length; i++) {
            const a = poly[i], b = poly[(i + 1) % poly.length];
            area += a.x * b.y - b.x * a.y;
            per += Math.hypot(b.x - a.x, b.y - a.y);
        }
        return { area: Math.abs(area) / 2, per };
    }

    function init(root) {
        if (root.__njl) return;
        root.__njl = true;

        const light = root.classList.contains('njl--blush');
        const card = root.querySelector('.njl-card');
        const cutsEl = root.querySelector('.njl-cuts');
        const canvas = root.querySelector('.njl-scissors');
        const ctx = canvas.getContext('2d');

        const B = [...root.querySelectorAll('.njl-bubble')].map((el, i) => ({
            el, blob: el.querySelector('.njl-blob'), i,
            r: 60, x: 0, y: 0, vx: 0, vy: 0,
            phase: Math.random() * Math.PI * 2,
            sq: 0, sqv: 0, sqa: 0, shownSq: 1,
            drag: null, on: true, placed: false, justDragged: false,
        }));
        B.forEach(b => {
            b.el.style.setProperty('--k', b.i);
            b.blob.style.setProperty('--wob', `${(5 + Math.random() * 3).toFixed(2)}s`);
            b.blob.style.setProperty('--wd', `${(-Math.random() * 6).toFixed(2)}s`);
            b.el.addEventListener('pointerenter', () => jiggle(b, 0.07, Math.random() * Math.PI));
        });
        const products = B.map(b => ({
            href: b.el.href,
            target: b.el.target,
            name: b.el.dataset.name || '',
            img: b.el.dataset.big || (b.el.querySelector('img') || {}).src,
        })).filter(p => p.img);

        let W = 0, H = 0, dpr = 1;
        let rect = { l: 0, t: 0, r: 0, b: 0 };
        let lastPx = OFF, lastPy = OFF;

        function jiggle(b, amount, axis) {
            b.sqa = axis;
            b.sqv -= amount;
        }

        function cardRect() {
            const sr = root.getBoundingClientRect(), cr = card.getBoundingClientRect();
            rect = { l: cr.left - sr.left - 8, t: cr.top - sr.top - 8, r: cr.right - sr.left + 8, b: cr.bottom - sr.top + 8 };
        }

        function place(b) {
            const live = B.filter(q => q.on && q.placed && q !== b);
            let x = 0, y = 0;
            for (let tries = 0; tries < 400; tries++) {
                x = b.r + Math.random() * Math.max(1, W - 2 * b.r);
                y = b.r + Math.random() * Math.max(1, H - 2 * b.r);
                if (x > rect.l - b.r && x < rect.r + b.r && y > rect.t - b.r && y < rect.b + b.r) continue;
                if (live.some(q => Math.hypot(q.x - x, q.y - y) < q.r + b.r + 8)) continue;
                break;
            }
            b.x = x; b.y = y;
            b.vx = (Math.random() - 0.5) * 2;
            b.vy = (Math.random() - 0.5) * 2;
            b.placed = true;
        }

        function render(b) {
            b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0)`;
            if (Math.abs(b.sq - b.shownSq) > 0.002) {
                b.shownSq = b.sq;
                const a = b.sqa.toFixed(3);
                b.blob.style.transform = `rotate(${a}rad) scale(${(1 + b.sq).toFixed(3)}, ${(1 - b.sq).toFixed(3)}) rotate(${-a}rad)`;
            }
        }

        function resize() {
            const oW = W, oH = H;
            W = root.clientWidth;
            H = root.clientHeight;
            if (!W || !H) return;
            dpr = Math.min(devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            const mobile = W < 700;
            const count = mobile ? 8 : W < 1100 ? 10 : B.length;
            const base = mobile ? 40 : clamp(W / 22, 52, 82);
            cardRect();
            B.forEach((b, i) => {
                b.on = i < count;
                b.el.style.display = b.on ? '' : 'none';
                b.r = base * (0.82 + (((i * 37) % 10) / 10) * 0.45);
                b.el.style.setProperty('--d', `${Math.round(b.r * 2)}px`);
                if (!b.on) return;
                if (!b.placed || !oW) place(b);
                else { b.x *= W / oW; b.y *= H / oH; }
                render(b);
            });
            root.classList.add('is-ready');
        }

        // ---- grab & throw; a plain click still opens the product
        B.forEach(b => {
            b.el.addEventListener('pointerdown', e => {
                if (e.button !== 0) return;
                const sr = root.getBoundingClientRect();
                b.justDragged = false;
                b.drag = { ox: e.clientX - sr.left - b.x, oy: e.clientY - sr.top - b.y, sx: e.clientX, sy: e.clientY, moved: false };
                track(e);
                try { b.el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
                b.el.classList.add('is-dragging');
                jiggle(b, 0.12, Math.PI / 2);
                e.preventDefault();
            });
            b.el.addEventListener('pointermove', e => {
                if (b.drag && !b.drag.moved && Math.hypot(e.clientX - b.drag.sx, e.clientY - b.drag.sy) > 6) b.drag.moved = true;
            });
            const end = () => {
                if (!b.drag) return;
                b.justDragged = b.drag.moved;
                b.drag = null;
                b.el.classList.remove('is-dragging');
            };
            b.el.addEventListener('pointerup', end);
            b.el.addEventListener('pointercancel', end);
            b.el.addEventListener('lostpointercapture', end);
            b.el.addEventListener('click', e => { if (b.justDragged) { e.preventDefault(); b.justDragged = false; } });
        });

        // ---- cut-outs: a shape snipped from the fabric reveals a piece
        const cuts = [];
        let lastPick = -1;
        function pick() {
            if (!products.length) return null;
            let k;
            do { k = (Math.random() * products.length) | 0; } while (products.length > 1 && k === lastPick);
            lastPick = k;
            return products[k];
        }

        function removeCut(c) {
            const i = cuts.indexOf(c);
            if (i < 0) return;
            cuts.splice(i, 1);
            c.el.classList.add('is-leaving');
            setTimeout(() => c.el.remove(), 850);
        }

        function makeCut(poly) {
            const prod = pick();
            if (!prod) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of poly) {
                minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
            }
            const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
            const local = poly.map(p => [(p.x - minX).toFixed(1), (p.y - minY).toFixed(1)]);

            const el = document.createElement('a');
            el.className = 'njl-cut';
            el.href = prod.href;
            if (prod.target) { el.target = prod.target; el.rel = 'noopener'; }
            el.setAttribute('aria-label', prod.name);
            el.style.left = `${minX.toFixed(1)}px`;
            el.style.top = `${minY.toFixed(1)}px`;
            el.style.width = `${w.toFixed(1)}px`;
            el.style.height = `${h.toFixed(1)}px`;
            el.style.setProperty('--tilt', `${(Math.random() * 10 - 5).toFixed(1)}deg`);

            const shape = document.createElement('span');
            shape.className = 'njl-cut-shape';
            shape.style.clipPath = `polygon(${local.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
            const img = document.createElement('img');
            img.src = prod.img;
            img.alt = '';
            img.draggable = false;
            shape.appendChild(img);

            const svgNS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('class', 'njl-cut-edge');
            svg.setAttribute('viewBox', `0 0 ${w.toFixed(1)} ${h.toFixed(1)}`);
            svg.setAttribute('aria-hidden', 'true');
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', `M${local.map(([x, y]) => `${x} ${y}`).join('L')}Z`);
            svg.appendChild(path);

            const tag = document.createElement('span');
            tag.className = 'njl-cut-tag';
            tag.textContent = prod.name;

            el.append(shape, svg, tag);
            cutsEl.appendChild(el);

            const c = { el, born: performance.now(), hold: false };
            el.addEventListener('pointerenter', () => { c.hold = true; });
            el.addEventListener('pointerleave', () => { c.hold = false; c.born = performance.now() - 1500; });
            cuts.push(c);
            while (cuts.length > 4) removeCut(cuts[0]);
        }

        // a hand-cut circle around a point (click / tap on the fabric)
        function snip(x, y) {
            const R = (W < 700 ? 58 : 76) * (0.85 + Math.random() * 0.3);
            const f1 = Math.random() * 6.28, f2 = Math.random() * 6.28, N = 30;
            const poly = [];
            for (let i = 0; i < N; i++) {
                const t = (i / N) * Math.PI * 2;
                const r = R * (1 + 0.1 * Math.sin(3 * t + f1) + 0.06 * Math.sin(5 * t + f2));
                poly.push({ x: clamp(x + Math.cos(t) * r, 0, W), y: clamp(y + Math.sin(t) * r, 0, H) });
            }
            makeCut(poly);
        }

        root.addEventListener('click', e => {
            if (e.target.closest('a, .njl-card')) return;
            const sr = root.getBoundingClientRect();
            snip(e.clientX - sr.left, e.clientY - sr.top);
        });

        // ---- the scissors and their dashed cut line
        const LIFE = 3500; // long enough for a slow, careful circle
        let trail = [];       // points of the line still on screen
        let strokeStart = 0;  // index where the current, unbroken stroke begins
        const sc = { x: 0, y: 0, ang: 0, s: 0, vis: 0 };

        function addPoint(x, y, now) {
            const last = trail[trail.length - 1];
            if (last && !last.brk) {
                const seg = Math.hypot(x - last.x, y - last.y);
                if (seg < 4) return;
                sc.s += seg;
                // rotate the scissors toward where they're heading
                const ang = Math.atan2(y - last.y, x - last.x);
                let d = ang - sc.ang;
                d = Math.atan2(Math.sin(d), Math.cos(d));
                sc.ang += d * 0.35;
            }
            const pt = { x, y, t: now, brk: false };
            trail.push(pt);

            // did the newest segment cross the current stroke? then a loop is closed
            const n = trail.length;
            if (n - strokeStart < 6) return;
            const a = trail[n - 2], b = trail[n - 1];
            for (let i = strokeStart; i < n - 4; i++) {
                const hit = crossing(trail[i], trail[i + 1], a, b);
                if (!hit) continue;
                const poly = [hit, ...trail.slice(i + 1, n - 1)];
                const { area, per } = polyStats(poly);
                // big enough, and round-ish rather than a thin back-and-forth sliver
                if (area > 3500 && area / (per * per) > 0.035) {
                    makeCut(poly);
                    trail = [{ x, y, t: now, brk: false }];
                    strokeStart = 0;
                }
                return;
            }
        }

        function breakStroke() {
            const last = trail[trail.length - 1];
            if (last && !last.brk) last.brk = true;
            strokeStart = trail.length;
        }

        function drawScissors(x, y, ang, open, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(x, y);
            ctx.rotate(ang);
            ctx.scale(1.4, 1.4);
            ctx.shadowColor = 'rgba(40,20,30,.35)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = 3;
            for (const side of [1, -1]) {
                ctx.save();
                ctx.rotate(-side * open);
                ctx.scale(1, side);
                // blade, from the pivot forward
                const g = ctx.createLinearGradient(0, -4, 0, 2);
                g.addColorStop(0, '#f4f6f8');
                g.addColorStop(1, '#9aa3ad');
                ctx.fillStyle = g;
                ctx.strokeStyle = 'rgba(60,64,72,.85)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-3, 1.5);
                ctx.quadraticCurveTo(10, -5, 30, -0.6);
                ctx.lineTo(30, 0.4);
                ctx.quadraticCurveTo(14, 1.6, -3, 1.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // handle, behind the pivot on the other side
                ctx.strokeStyle = light ? '#d65f7a' : '#f4b8c6';
                ctx.lineWidth = 3.2;
                ctx.beginPath();
                ctx.moveTo(-2, 1.5);
                ctx.lineTo(-9, 6);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(-16, 8.5, 7.5, 5.5, -0.35, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            // pivot screw
            ctx.fillStyle = '#5b6068';
            ctx.beginPath();
            ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function tick(now, dt) {
            const sr = root.getBoundingClientRect();
            const px = pointer.x - sr.left, py = pointer.y - sr.top;
            const inside = px >= 0 && py >= 0 && px <= W && py <= H;
            const pvx = inside && lastPx !== OFF ? (px - lastPx) / dt : 0;
            const pvy = inside && lastPy !== OFF ? (py - lastPy) / dt : 0;
            lastPx = inside ? px : OFF;
            lastPy = inside ? py : OFF;
            cardRect();

            const live = B.filter(b => b.on);
            const dragging = live.some(b => b.drag);
            const damp = Math.pow(0.986, dt);

            for (const b of live) {
                if (b.drag) {
                    if (pointer.x !== OFF) {
                        const tx = clamp(px - b.drag.ox, b.r, W - b.r);
                        const ty = clamp(py - b.drag.oy, b.r, H - b.r);
                        b.vx = lerp(b.vx, (tx - b.x) / dt, 0.5);
                        b.vy = lerp(b.vy, (ty - b.y) / dt, 0.5);
                        b.x = tx; b.y = ty;
                        // stretch along the direction it's being pulled
                        const sp = Math.hypot(b.vx, b.vy);
                        if (sp > 0.5) {
                            b.sqa = Math.atan2(b.vy, b.vx);
                            b.sqv += (clamp(sp * 0.006, 0, 0.16) - b.sq) * 0.25;
                        }
                    }
                } else {
                    if (!reduce) {
                        b.vx += Math.cos(now * 0.00055 + b.phase) * 0.016 * dt;
                        b.vy += Math.sin(now * 0.00047 + b.phase * 1.7) * 0.016 * dt;
                    }
                    // a fast cursor brushes bubbles aside; a slow one lets you hover and click
                    if (inside && !dragging) {
                        const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy), R = b.r + 40;
                        if (d < b.r) { b.vx *= 0.88; b.vy *= 0.88; }
                        const speed = Math.hypot(pvx, pvy);
                        if (d < R && speed > 3) {
                            const f = (1 - d / R) * 0.22;
                            b.vx += pvx * f;
                            b.vy += pvy * f;
                            jiggle(b, clamp(speed * 0.004, 0, 0.08), Math.atan2(pvy, pvx));
                        }
                    }
                    b.vx *= damp; b.vy *= damp;
                    const sp = Math.hypot(b.vx, b.vy);
                    if (sp > 36) { b.vx *= 36 / sp; b.vy *= 36 / sp; }
                    b.x += b.vx * dt;
                    b.y += b.vy * dt;
                }
            }

            // bubble vs bubble — they squash where they meet
            for (let i = 0; i < live.length; i++) {
                for (let j = i + 1; j < live.length; j++) {
                    const a = live[i], b = live[j];
                    const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r + 6, d2 = dx * dx + dy * dy;
                    if (d2 >= min * min) continue;
                    const d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d, ov = min - d;
                    const wa = a.drag ? 0 : b.drag ? 1 : 0.5, wb = b.drag ? 0 : a.drag ? 1 : 0.5;
                    a.x -= nx * ov * wa; a.y -= ny * ov * wa;
                    b.x += nx * ov * wb; b.y += ny * ov * wb;
                    const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                    if (rv < 0) {
                        const e = 0.7;
                        if (a.drag) { b.vx -= (1 + e) * rv * nx; b.vy -= (1 + e) * rv * ny; }
                        else if (b.drag) { a.vx += (1 + e) * rv * nx; a.vy += (1 + e) * rv * ny; }
                        else {
                            const jj = (-(1 + e) * rv) / 2;
                            a.vx -= jj * nx; a.vy -= jj * ny;
                            b.vx += jj * nx; b.vy += jj * ny;
                        }
                        const amt = clamp(-rv * 0.02, 0, 0.14), axis = Math.atan2(ny, nx);
                        jiggle(a, amt, axis);
                        jiggle(b, amt, axis);
                    }
                }
            }

            // bubble vs card and walls, then the wobble spring
            for (const b of live) {
                if (!b.drag) {
                    const qx = clamp(b.x, rect.l, rect.r), qy = clamp(b.y, rect.t, rect.b);
                    const dx = b.x - qx, dy = b.y - qy, d2 = dx * dx + dy * dy;
                    if (d2 < b.r * b.r) {
                        let nx, ny;
                        if (d2 > 0.0001) {
                            const d = Math.sqrt(d2);
                            nx = dx / d; ny = dy / d;
                            b.x += nx * (b.r - d) * 0.5;
                            b.y += ny * (b.r - d) * 0.5;
                        } else {
                            const dl = b.x - rect.l, dr = rect.r - b.x, du = b.y - rect.t, dd = rect.b - b.y;
                            const m = Math.min(dl, dr, du, dd);
                            nx = m === dl ? -1 : m === dr ? 1 : 0;
                            ny = m === du ? -1 : m === dd ? 1 : 0;
                            if (!nx && !ny) ny = 1;
                            b.vx += nx * 3 * dt;
                            b.vy += ny * 3 * dt;
                        }
                        const vn = b.vx * nx + b.vy * ny;
                        if (vn < 0) {
                            b.vx -= 1.7 * vn * nx; b.vy -= 1.7 * vn * ny;
                            jiggle(b, clamp(-vn * 0.02, 0, 0.12), Math.atan2(ny, nx));
                        }
                    }
                    const wallHit = (v, axis) => jiggle(b, clamp(Math.abs(v) * 0.02, 0, 0.12), axis);
                    if (b.x < b.r) { b.x = b.r; wallHit(b.vx, 0); b.vx = Math.abs(b.vx) * 0.75; }
                    else if (b.x > W - b.r) { b.x = W - b.r; wallHit(b.vx, 0); b.vx = -Math.abs(b.vx) * 0.75; }
                    if (b.y < b.r) { b.y = b.r; wallHit(b.vy, Math.PI / 2); b.vy = Math.abs(b.vy) * 0.75; }
                    else if (b.y > H - b.r) { b.y = H - b.r; wallHit(b.vy, Math.PI / 2); b.vy = -Math.abs(b.vy) * 0.75; }
                }
                // jelly spring: overshoots a few times, then settles
                b.sqv += -b.sq * 0.2 * dt;
                b.sqv *= Math.pow(0.82, dt);
                b.sq = clamp(b.sq + b.sqv * dt, -0.24, 0.24);
                render(b);
            }

            // ---- cut-outs fade away after a while (not while hovered)
            for (const c of [...cuts]) {
                if (!c.hold && now - c.born > 4200) removeCut(c);
            }

            // ---- scissors: only for a mouse. The line keeps going over bubbles
            // and the card (so a bubble drifting into the way doesn't spoil a
            // loop), but the scissors only show over the bare fabric — over a
            // bubble you get the normal grab cursor.
            const overUI = pointer.target && pointer.target.closest &&
                pointer.target.closest('.njl-card, .njl-bubble, .njl-cut');
            const tracing = inside && pointer.type === 'mouse' && !dragging && !reduce;
            const cutting = tracing && !overUI;
            root.classList.toggle('is-cutting', cutting);
            if (tracing) {
                sc.x = px; sc.y = py;
                addPoint(px, py, now);
            } else {
                breakStroke();
            }
            sc.vis = lerp(sc.vis, cutting ? 1 : 0, clamp(0.3 * dt, 0, 1));

            // drop expired points from the front of the line
            let drop = 0;
            while (drop < trail.length && now - trail[drop].t > LIFE) drop++;
            if (drop) {
                trail = trail.slice(drop);
                strokeStart = Math.max(0, strokeStart - drop);
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            if (trail.length > 1) {
                ctx.lineCap = 'round';
                ctx.lineWidth = 1.8;
                ctx.setLineDash([7, 6]);
                ctx.strokeStyle = light ? 'rgba(40,24,30,.8)' : 'rgba(255,244,236,.85)';
                for (let i = 1; i < trail.length; i++) {
                    const a = trail[i - 1], b = trail[i];
                    if (a.brk) continue;
                    const life = 1 - (now - b.t) / LIFE;
                    ctx.globalAlpha = clamp(life, 0, 1);
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }
            if (sc.vis > 0.02) {
                const open = 0.1 + 0.26 * (0.5 + 0.5 * Math.sin(sc.s / 9));
                drawScissors(sc.x, sc.y, sc.ang, open, sc.vis);
            }
        }

        // run only while on screen; stop for good if the section is removed
        let active = false;
        const io = new IntersectionObserver(([e]) => {
            active = e.isIntersecting;
            if (active) root.classList.add('is-in');
        }, { rootMargin: '80px' });
        io.observe(root);
        const ro = new ResizeObserver(resize);
        ro.observe(root);
        let last = performance.now();
        function frame(now) {
            if (!root.isConnected) { io.disconnect(); ro.disconnect(); return; }
            const dt = clamp((now - last) / 16.667, 0.25, 3);
            last = now;
            if (active && W) tick(now, dt);
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    const boot = (scope = document) => scope.querySelectorAll('[data-njl]').forEach(init);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot());
    else boot();
    // the Shopify theme editor re-renders a section when its settings change
    document.addEventListener('shopify:section:load', e => boot(e.target));
})();
