/* ==========================================================================
   Aluminio Velázquez AVF · Comportamiento de la landing
   Vanilla JS, sin librerías externas. Todo lo visual tiene respaldo:
   si algo falla, el contenido se ve completo (los estados ocultos solo existen con la clase .js).
   ========================================================================== */
(() => {
  'use strict';
  window.__avfOk = true; // avisa al script del <head> de que el JS cargó

  /* ───────── Configuración: ÚNICO lugar donde vive el número de WhatsApp ─────────
     Formato internacional sin "+" ni espacios (52 + 10 dígitos). Si queda vacío,
     los botones de WhatsApp y el envío del formulario se ocultan con elegancia. */
  const WHATSAPP_NUMERO = '522291188544';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const waUrl = (texto) => `https://wa.me/${String(WHATSAPP_NUMERO).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
  /** Ejecuta cada módulo de forma aislada: si uno falla, los demás siguen. */
  const safe = (fn) => { try { fn(); } catch (err) { if (window.console) console.warn('[landing]', err); } };

  /* ───────── 1. WhatsApp: enlaces, botón flotante, formulario ───────── */
  function initWhatsApp() {
    if (!String(WHATSAPP_NUMERO).replace(/\D/g, '')) { root.classList.add('no-wa'); return; }
    $$('[data-wa]').forEach((a) => {
      a.href = waUrl(a.dataset.wa);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  /* ───────── 2. Cargador ───────── */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    const num = $('#ldNum');
    const t0 = performance.now();
    const dur = 1300;
    (function tick(now) {
      const t = clamp(((now || performance.now()) - t0) / dur, 0, 1);
      if (num) num.textContent = Math.round(t * 100);
      if (t < 1) requestAnimationFrame(tick);
    })();
    setTimeout(() => { loader.remove(); }, 2400);
  }

  /* ───────── 3. Encabezado y menú móvil ───────── */
  function initHeader() {
    const burger = $('#burger');
    const nav = $('#nav');
    const hdr = $('#hdr');
    if (!burger || !nav || !hdr) return;
    const setMenu = (open) => {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (open) hdr.classList.remove('hide');
    };
    burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth >= 960) setMenu(false); });
  }

  /* ───────── 4. Revelado al hacer scroll (con respaldo por geometría) ───────── */
  let revealGeometry = () => {};
  function initReveal() {
    const els = $$('.rv, .rv-l, .rv-r, .rvm');
    // Retraso escalonado entre hermanos
    $$('[data-stagger]').forEach((p) => {
      $$(':scope > .rv, :scope > .rv-l, :scope > .rv-r', p).forEach((el, i) => el.style.setProperty('--d', (i * 0.09).toFixed(2) + 's'));
    });
    if (reduce || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    els.forEach((el) => io.observe(el));

    // Respaldo: revela todo lo que ya esté dentro de la ventana según su geometría
    revealGeometry = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach((el) => {
        if (el.classList.contains('in')) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (r.top < vh * 0.96 && r.bottom > 0) { el.classList.add('in'); io.unobserve(el); }
      });
    };
    let queued = false;
    const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; revealGeometry(); }); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', () => { schedule(); setTimeout(revealGeometry, 2000); });
    setTimeout(revealGeometry, 2000);
    setTimeout(revealGeometry, 4000);
    schedule();
  }

  /* ───────── 5. Manifiesto: palabras que se encienden con el scroll ───────── */
  function initManifesto() {
    const el = $('#mfText');
    if (!el) return null;
    const keys = new Set(['luz', 'casa', 'impecable', 'medida', 'aluminio', 'cristal']);
    const words = [];
    const wrap = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = tok;
            if (keys.has(tok.toLowerCase().replace(/[^a-záéíóúñ]/g, ''))) s.classList.add('key');
            words.push(s);
            frag.appendChild(s);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) { wrap(ch); }
      });
    };
    wrap(el);
    if (reduce) words.forEach((w) => w.classList.add('lit'));
    return { el, words };
  }

  /* ───────── 6. Bucle de scroll: progreso, encabezado, imagen que se abre, proceso, parallax ───────── */
  function initScroll() {
    const hdr = $('#hdr');
    const progress = $('.progress');
    const mf = initManifesto();
    const expand = $('#expand');
    const pin = expand ? $('.expand-pin', expand) : null;
    const steps = $('#steps');
    const stepEls = $$('.step');
    const stage = $('#stage');
    const pars = $$('[data-par]');
    const navLinks = $$('#nav a[href^="#"]:not(.btn)');
    const secs = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);

    // Marquee: se acelera con la velocidad del scroll
    const mqTrack = $('#mqTrack');
    const mqAnim = mqTrack && mqTrack.getAnimations ? mqTrack.getAnimations()[0] : null;
    let mqRate = 1, mqTarget = 1, mqRaf = 0;
    const mqTick = () => {
      mqRate += (mqTarget - mqRate) * 0.1;
      mqTarget += (1 - mqTarget) * 0.05;
      if (mqAnim) mqAnim.playbackRate = mqRate;
      if (Math.abs(mqRate - 1) > 0.02 || Math.abs(mqTarget - 1) > 0.02) { mqRaf = requestAnimationFrame(mqTick); }
      else { mqRaf = 0; if (mqAnim) mqAnim.playbackRate = 1; }
    };

    let lastY = window.scrollY;
    let queued = false;

    function update() {
      queued = false;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;

      if (progress) progress.style.setProperty('--sp', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : '0');

      if (hdr) {
        hdr.classList.toggle('scrolled', y > 24);
        if (!body.classList.contains('menu-open')) {
          if (y > lastY + 3 && y > 520) hdr.classList.add('hide');
          else if (y < lastY - 3 || y <= 520) hdr.classList.remove('hide');
        }
      }

      const speed = Math.abs(y - lastY);
      if (!reduce && mqAnim && speed > 2) { mqTarget = Math.min(1 + speed * 0.22, 7); if (!mqRaf) mqRaf = requestAnimationFrame(mqTick); }
      lastY = y;

      // Manifiesto
      if (mf && !reduce) {
        const r = mf.el.getBoundingClientRect();
        const p = clamp((vh * 0.86 - r.top) / (r.height + vh * 0.42), 0, 1);
        const n = Math.round(p * mf.words.length * 1.06);
        mf.words.forEach((w, i) => w.classList.toggle('lit', i < n));
      }

      // Imagen que se abre en grande
      if (expand && pin && !reduce) {
        const r = expand.getBoundingClientRect();
        if (r.bottom > -vh && r.top < vh * 2) {
          const total = Math.max(1, r.height - pin.offsetHeight);
          let p = clamp(-r.top / total / 0.56, 0, 1);
          p = p * p * (3 - 2 * p);
          expand.style.setProperty('--p', p.toFixed(4));
        }
      }

      // Línea del proceso
      if (steps) {
        const r = steps.getBoundingClientRect();
        steps.style.setProperty('--lp', clamp((vh * 0.62 - r.top) / r.height, 0, 1).toFixed(4));
        stepEls.forEach((s) => s.classList.toggle('done', s.getBoundingClientRect().top + 36 < vh * 0.62));
      }

      // Parallax suave del hero (propiedad "translate", no choca con las animaciones)
      if (stage && pars.length && !reduce) {
        const r = stage.getBoundingClientRect();
        if (r.bottom > -120 && r.top < vh + 120) {
          const c = r.top + r.height / 2 - vh / 2;
          pars.forEach((el) => { el.style.translate = '0 ' + (c * parseFloat(el.dataset.par || '0')).toFixed(1) + 'px'; });
        }
      }

      // Enlace activo del menú
      if (secs.length) {
        let current = null;
        secs.forEach((s) => { const r = s.getBoundingClientRect(); if (r.top <= vh * 0.35 && r.bottom > vh * 0.35) current = s.id; });
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }
    }
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    update();
  }

  /* ───────── 7. Hero: inclinación 3D con el puntero ───────── */
  function initTilt() {
    const stage = $('#stage');
    const arch = $('#arch');
    if (!stage || !arch || reduce || !finePointer) return;
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      arch.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      arch.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      // Profundidad: miniaturas y chips se desplazan en sentido contrario/proporcional al puntero
      stage.style.setProperty('--px', x.toFixed(3));
      stage.style.setProperty('--py', y.toFixed(3));
    });
    stage.addEventListener('pointerleave', () => {
      arch.style.setProperty('--ry', '0deg');
      arch.style.setProperty('--rx', '0deg');
      stage.style.setProperty('--px', '0');
      stage.style.setProperty('--py', '0');
    });
  }

  /* ───────── 8. Hero: partículas y red de puntos (canvas) ───────── */
  function initParticles() {
    const canvas = $('#fx');
    if (!canvas || reduce) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const hero = canvas.parentElement;
    let w = 0, h = 0, parts = [], raf = 0, running = false, mx = -9999, my = -9999;

    const make = (anywhere) => {
      const t = Math.random();
      return {
        x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10,
        r: Math.random() * 2.2 + 0.7, vx: (Math.random() - 0.5) * 0.28, vy: -(Math.random() * 0.38 + 0.12),
        a: Math.random() * 0.45 + 0.2, c: t < 0.55 ? '12,125,175' : (t < 0.85 ? '19,138,143' : '53,198,228'),
      };
    };
    const size = () => {
      const r = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp((w * h) / 24000, 16, 50));
      parts = Array.from({ length: n }, () => make(true));
    };
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10 || p.x < -10 || p.x > w + 10) { parts[i] = make(false); continue; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
        for (let j = i + 1; j < parts.length; j++) {
          const q = parts[j];
          const dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < 10000) {
            ctx.strokeStyle = `rgba(12,125,175,${(0.17 * (1 - d2 / 10000)).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        const ex = p.x - mx, ey = p.y - my, e2 = ex * ex + ey * ey;
        if (e2 < 22500) {
          ctx.strokeStyle = `rgba(53,198,228,${(0.4 * (1 - e2 / 22500)).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    size();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 200); });
    if (finePointer) {
      hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      hero.addEventListener('pointerleave', () => { mx = my = -9999; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { en[0].isIntersecting ? start() : stop(); }).observe(hero);
    } else { start(); }
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  }

  /* ───────── 9. Portón animado ───────── */
  function initGate() {
    const scene = $('#gateScene');
    if (!scene) return;
    const btn = $('#gateToggle');
    const label = $('#gateStatus');
    let open = false, auto = true, visible = false, timer = 0;
    const set = (v) => {
      open = v;
      scene.classList.toggle('is-open', v);
      scene.classList.remove('signal');
      void scene.offsetWidth;
      scene.classList.add('signal');
      if (label) label.textContent = v ? 'Portón abierto' : 'Portón cerrado';
      if (btn) btn.setAttribute('aria-pressed', String(v));
    };
    const loop = () => {
      clearInterval(timer);
      if (!auto || reduce) return;
      timer = setInterval(() => { if (visible) set(!open); }, 4800);
    };
    if (btn) btn.addEventListener('click', () => { auto = false; clearInterval(timer); set(!open); });
    if ('IntersectionObserver' in window) {
      let first = true;
      new IntersectionObserver((en) => {
        visible = en[0].isIntersecting;
        if (visible && first) { first = false; if (!reduce) setTimeout(() => { if (auto) set(true); }, 1000); loop(); }
      }, { threshold: 0.35 }).observe(scene);
    }
  }

  /* ───────── 10. Galería: filtros y visor ───────── */
  function initGallery() {
    const masonry = $('#masonry');
    const filters = $('#filters');
    if (!masonry || !filters) return;
    const tiles = $$('.tile', masonry);
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('.fbtn');
      if (!b) return;
      $$('.fbtn', filters).forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      const f = b.dataset.f;
      let k = 0;
      tiles.forEach((t) => {
        const show = f === 'all' || t.dataset.cat.split(' ').includes(f);
        t.classList.toggle('off', !show);
        if (show) { t.classList.remove('pop'); void t.offsetWidth; t.style.setProperty('--k', k++); t.classList.add('pop'); }
      });
      revealGeometry();
    });

    const lb = $('#lb');
    const img = $('#lbImg');
    const cap = $('#lbCap');
    const cnt = $('#lbCount');
    if (!lb || !img) return;
    let list = [], cur = 0, last = null, sx = 0;
    const show = (i) => {
      cur = (i + list.length) % list.length;
      const b = list[cur];
      const im = $('img', b);
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      img.src = im.getAttribute('src');
      img.alt = im.alt;
      cap.textContent = b.dataset.cap || im.alt;
      cnt.textContent = (cur + 1) + ' / ' + list.length;
    };
    const openLb = (btn) => {
      list = $$('.tile:not(.off) .tile-btn', masonry);
      last = document.activeElement;
      show(Math.max(0, list.indexOf(btn)));
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      body.classList.add('lock');
      $('.lb-close', lb).focus();
    };
    const closeLb = () => {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      body.classList.remove('lock');
      if (last && last.focus) last.focus();
    };
    masonry.addEventListener('click', (e) => { const b = e.target.closest('.tile-btn'); if (b) openLb(b); });
    lb.addEventListener('click', (e) => {
      if (e.target.closest('.lb-close') || e.target === lb) closeLb();
      else if (e.target.closest('.lb-prev')) show(cur - 1);
      else if (e.target.closest('.lb-next')) show(cur + 1);
    });
    window.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
      else if (e.key === 'Tab') {
        const f = $$('button', lb);
        const first = f[0], lastB = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
        else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
      }
    });
    lb.addEventListener('touchstart', (e) => { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ───────── 11. Configurador de puerta ───────── */
  function initConfigurator() {
    const form = $('#cfgForm');
    const art = $('#cfgArt');
    const sum = $('#cfgSum');
    const cta = $('#cfgCta');
    if (!form || !art) return;

    const FIN = {
      blanco: { n: 'blanco', frame: '#DDE6EB', leaf: '#F8FAFB', groove: '#C3CFD6', edge: '#AEBDC7', handle: '#97A7B2', grain: null },
      negro: { n: 'negro', frame: '#0C131A', leaf: '#1C262E', groove: '#06090C', edge: '#04070A', handle: '#8FA1AD', grain: null },
      nogal: { n: 'imitación madera', frame: '#4F2D17', leaf: '#7B4B2B', groove: '#46260F', edge: '#391E0C', handle: '#BCC3C9', grain: '#A26A3E' },
    };
    const TIPO = { puerta: 'Puerta con vidrios', doble: 'Puerta doble con cuadrícula', cancel: 'Cancel corredizo' };
    const VID = { claro: 'vidrio transparente', esmerilado: 'vidrio esmerilado' };

    const pane = (x, y, w, h, v) => {
      let s = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${v === 'claro' ? 'url(#gClear)' : 'url(#gFrost)'}"/>`;
      if (v === 'esmerilado') s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="url(#gTex)"/>`;
      return s;
    };

    const drawPuerta = (c, v) => {
      let s = `<rect x="58" y="26" width="204" height="410" rx="4" fill="${c.frame}" stroke="${c.edge}" stroke-width="1.5"/>`;
      s += `<rect x="70" y="38" width="180" height="398" rx="2" fill="${c.leaf}"/>`;
      for (let y = 62, i = 0; y < 430; y += 36, i++) {
        s += `<line x1="78" x2="242" y1="${y}" y2="${y}" stroke="${c.groove}" stroke-opacity=".5" stroke-width="1.5"/>`;
        if (c.grain) s += `<line x1="${84 + (i * 37) % 40}" x2="${190 + (i * 23) % 44}" y1="${y + 14}" y2="${y + 14}" stroke="${c.grain}" stroke-opacity=".38" stroke-width="1"/>`;
      }
      [86, 186, 286].forEach((y) => {
        s += `<rect x="120" y="${y}" width="92" height="72" rx="2" fill="${c.frame}" stroke="${c.edge}"/>` + pane(126, y + 6, 80, 60, v);
      });
      s += `<rect x="86" y="244" width="46" height="8" rx="4" fill="${c.handle}"/><circle cx="96" cy="272" r="7" fill="${c.handle}"/>`;
      return s;
    };

    const drawDoble = (c, v) => {
      let s = `<rect x="26" y="26" width="268" height="410" rx="4" fill="${c.frame}" stroke="${c.edge}" stroke-width="1.5"/>`;
      [38, 162].forEach((x, k) => {
        s += `<rect x="${x}" y="38" width="120" height="398" rx="2" fill="${c.leaf}" stroke="${c.edge}"/>`;
        const cols = 3, rows = 7, gap = 5, ix = x + 12, iy = 52, iw = 96, ih = 372;
        const pw = (iw - gap * (cols - 1)) / cols, ph = (ih - gap * (rows - 1)) / rows;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) s += pane(ix + q * (pw + gap), iy + r * (ph + gap), pw, ph, v);
        s += `<rect x="${k ? x + 4 : x + 110}" y="224" width="6" height="56" rx="3" fill="${c.handle}"/>`;
      });
      return s;
    };

    const drawCancel = (c, v) => {
      let s = `<rect x="22" y="70" width="276" height="350" rx="4" fill="${c.frame}" stroke="${c.edge}" stroke-width="1.5"/>`;
      s += `<rect x="32" y="80" width="134" height="330" fill="${c.frame}" stroke="${c.edge}"/>` + pane(41, 89, 116, 312, v);
      s += `<rect x="154" y="80" width="134" height="330" fill="${c.frame}" stroke="${c.edge}"/>` + pane(163, 89, 116, 312, v);
      s += `<rect x="146" y="190" width="5" height="92" rx="2.5" fill="${c.handle}"/><rect x="169" y="190" width="5" height="92" rx="2.5" fill="${c.handle}"/>`;
      s += `<rect x="22" y="404" width="276" height="10" fill="${c.edge}"/>`;
      return s;
    };

    const val = (n) => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.value : ''; };
    let first = true;
    function render() {
      const tipo = val('tipo'), acabado = val('acabado'), vidrio = val('vidrio');
      const c = FIN[acabado] || FIN.blanco;
      art.innerHTML = tipo === 'doble' ? drawDoble(c, vidrio) : tipo === 'cancel' ? drawCancel(c, vidrio) : drawPuerta(c, vidrio);
      if (!first && !reduce) { art.classList.remove('pop'); void art.getBoundingClientRect(); art.classList.add('pop'); }
      first = false;
      const nombre = TIPO[tipo] || TIPO.puerta;
      if (sum) sum.innerHTML = `<b>${nombre}</b> · acabado ${c.n} · ${VID[vidrio] || ''}`;
      if (cta) {
        const msg = `Hola, estoy listo para cotizar: ${nombre.toLowerCase()}, acabado ${c.n}, ${VID[vidrio] || 'vidrio a definir'}. La armé en el configurador de su página; las medidas te las paso por aquí.`;
        cta.dataset.wa = msg;
        if (String(WHATSAPP_NUMERO).replace(/\D/g, '')) cta.href = waUrl(msg);
      }
    }
    form.addEventListener('change', render);
    render();
  }

  /* ───────── 12. Formulario de contacto → WhatsApp ───────── */
  function initForm() {
    const f = $('#contactForm');
    if (!f) return;
    const note = $('#formNote');
    f.addEventListener('input', (e) => {
      const box = e.target.closest('.field');
      if (box && box.classList.contains('invalid') && String(e.target.value).trim()) box.classList.remove('invalid');
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      ['nombre', 'servicio'].forEach((name) => {
        const el = f.elements[name];
        const bad = !String(el.value || '').trim();
        el.closest('.field').classList.toggle('invalid', bad);
        el.setAttribute('aria-invalid', String(bad));
        if (bad) ok = false;
      });
      if (!ok) { const bad = f.querySelector('.invalid input, .invalid select'); if (bad) bad.focus(); return; }
      if (!String(WHATSAPP_NUMERO).replace(/\D/g, '')) return;

      const nombre = f.elements.nombre.value.trim();
      const tel = f.elements.telefono.value.trim();
      const servicio = f.elements.servicio.value.trim();
      const detalle = f.elements.mensaje.value.trim();
      const lineas = [`Hola, soy ${nombre}. Quiero cotizar: ${servicio}.`];
      if (detalle) lineas.push(`Medidas o detalles: ${detalle}`);
      if (tel) lineas.push(`Mi teléfono: ${tel}`);
      lineas.push('(Mensaje enviado desde la página web)');
      const url = waUrl(lineas.join('\n'));
      const w = window.open(url, '_blank');
      if (w) { try { w.opener = null; } catch (err) { /* sin acción */ } } else { window.location.href = url; }
      if (note) { note.textContent = '¡Listo! Se abrió WhatsApp con tu mensaje. Si no ves la ventana, revisa que el navegador permita ventanas emergentes.'; note.setAttribute('role', 'status'); }
    });
  }

  /* ───────── 13. Detalles: spotlight, botones magnéticos, año ───────── */
  function initDetails() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
    if (!finePointer || reduce) return;
    $$('[data-spot]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    $$('[data-magnet]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.translate = (x * 0.18).toFixed(1) + 'px ' + (y * 0.28).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  /* ───────── Arranque ───────── */
  [initWhatsApp, initLoader, initHeader, initReveal, initScroll, initTilt, initParticles, initGate, initGallery, initConfigurator, initForm, initDetails].forEach(safe);
})();
