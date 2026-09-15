/* Viktorija — judesys ir registracija.
   Vienas šviesos šaltinis: žiedinė lempa iš nuotraukos. Plačiame ekrane ji slenkant keliauja per puslapį
   (GSAP timeline + ScrollTrigger scrub) ir apsijuosia aplink telefono numerį; telefone žiedai įsijungia vietoje.
   Be GSAP arba su prefers-reduced-motion viskas matoma iškart; skambinimo nuorodos niekada neanimuojamos. */
(function () {
  'use strict';
  var d = document.documentElement;
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var G = window.gsap, ST = window.ScrollTrigger, VK = window.VK;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var useG = !!(G && ST) && !reduce;
  if (useG) { G.registerPlugin(ST); d.classList.add('gs'); }

  /* ---------- galvenė: plona linija po slinkimo ---------- */
  var hdr = q('#hdr'), stuck = false;
  function onScroll() {
    var s = window.scrollY > 8;
    if (s !== stuck) { stuck = s; hdr.classList.toggle('stuck', s); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- SMS žinutė ---------- */
  var form = q('#smsForm'), out = q('#msgOut'), nameInput = q('#nm'), copyBtn = q('#copyBtn');
  var state = { topic: '', when: '', time: '', name: '' };
  var glintTargets = qa('.glint');
  var lastText = '';

  function readState() {
    ['topic', 'when', 'time'].forEach(function (k) {
      var c = q('input[name="' + k + '"]:checked', form); state[k] = c ? c.value : '';
    });
    state.name = nameInput.value;
  }
  function render(animate) {
    if (!VK) return;
    var text = VK.build(state, VK.lang()), href = VK.smsHref(text);
    qa('.js-sms').forEach(function (a) { a.setAttribute('href', href); });
    if (text === lastText) return;
    lastText = text;
    out.textContent = text;
    if (animate && useG) G.fromTo(out, { opacity: 0.4 }, { opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: true });
  }
  function setGlint() {
    var rot = state.time === 'am' ? -62 : state.time === 'pm' ? 62 : 0;
    var hide = state.time === 'any';
    glintTargets.forEach(function (g) {
      if (useG) G.to(g, { rotation: rot, opacity: hide ? 0 : 1, svgOrigin: '0 0', duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
      else { g.setAttribute('transform', 'rotate(' + rot + ')'); g.style.opacity = hide ? 0 : 1; }
    });
  }

  /* pažymėtą mygtuką paspaudus dar kartą — pasirinkimas nuimamas */
  var wasChecked = null;
  qa('.chips input', form).forEach(function (inp) {
    var lab = inp.parentNode;
    lab.addEventListener('pointerdown', function () { wasChecked = inp.checked ? inp : null; });
    lab.addEventListener('click', function (e) {
      if (wasChecked === inp && e.detail > 0) {
        e.preventDefault();
        inp.checked = false; wasChecked = null;
        readState(); render(true); setGlint(); syncClear();
      }
    });
  });
  var clearBtn = q('#clearBtn');
  function syncClear() { clearBtn.disabled = !(state.topic || state.when || state.time); }
  clearBtn.addEventListener('click', function () {
    qa('.chips input', form).forEach(function (i) { i.checked = false; });
    readState(); render(true); setGlint(); syncClear();
  });
  form.addEventListener('change', function () { readState(); render(true); setGlint(); syncClear(); });
  nameInput.addEventListener('input', function () { readState(); render(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  if (navigator.clipboard && window.isSecureContext) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(out.textContent).then(function () {
        var s = q('span', copyBtn); s.textContent = VK.t('copied');
        setTimeout(function () { s.textContent = VK.t('copy'); }, 2000);
      });
    });
  }

  /* „Įtraukti į žinutę“ procedūrų eilutėse */
  qa('.js-topic').forEach(function (a) {
    a.addEventListener('click', function () {
      var inp = q('input[name="topic"][value="' + a.getAttribute('data-topic') + '"]', form);
      if (!inp) return;
      inp.checked = true; readState(); render(true); syncClear();
      var chip = inp.nextElementSibling;
      if (useG) G.fromTo(chip, { scale: 1 }, { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', delay: 0.5 });
    });
  });

  if (VK) VK.onLang(function () {
    lastText = ''; render(false);
    var s = q('span', copyBtn); if (s) s.textContent = VK.t('copy');
    if (useG) ST.refresh();
  });
  readState(); render(false); syncClear();

  /* ---------- telefono juosta: rodoma, kai nesimato kitų skambinimo mygtukų ---------- */
  var bar = q('#bar');
  if ('IntersectionObserver' in window && bar) {
    var seen = new Map();
    var targets = [q('#heroCta'), q('.lens-disc'), q('#smsBtn'), q('.ftr')].filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen.set(en.target, en.isIntersecting); });
      var any = false; seen.forEach(function (v) { if (v) any = true; });
      bar.classList.toggle('show', !any);
    }, { threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  if (!useG) return;

  /* ---------- GSAP ---------- */
  ST.config({ ignoreMobileResize: true });
  var main = q('#main'), lamp = q('#lamp'), pic = q('.pic'), arc = q('.origin .arc');
  var a1 = q('#a1'), a2ring = q('#a2 .ring'), rows = qa('.row .lit');
  var mm = G.matchMedia();

  /* 1. Įsijungimas: lemputė nuotraukoje ir šviesa palei horizontą (antraštė ir mygtukai lieka ramūs) */
  var intro = G.timeline({ defaults: { ease: 'power3.out' } });
  intro.fromTo(arc, { opacity: 0, rotation: -70, svgOrigin: '346 258' }, { opacity: 1, rotation: 0, svgOrigin: '346 258', duration: 1.4, ease: 'expo.out' }, 0.15)
       .fromTo('.glints i', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.4, ease: 'expo.inOut', stagger: 0.08 }, 0.3)
       .to('.glints i', { opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 1.8);

  /* 2. Šviesa atkeliauja po procedūrų eilutėmis (tik toms, kurios dar žemiau ekrano) */
  rows.forEach(function (lit) {
    if (lit.getBoundingClientRect().top < window.innerHeight) return;
    G.set(lit, { xPercent: -101 });
    ST.create({
      trigger: lit.parentNode, start: 'top 82%', once: true,
      onEnter: function () { G.to(lit, { xPercent: 0, duration: 1.1, ease: 'power3.out', overwrite: true }); }
    });
  });

  mm.add({
    travel: '(min-width: 1080px) and (pointer: fine)',
    compact: '(max-width: 1079px), (pointer: coarse)'
  }, function (ctx) {
    if (ctx.conditions.travel) return buildTravel();
    return buildCompact();
  });

  /* 3a. Plačiame ekrane: lempa keliauja nuo nuotraukos prie „Procedūros“ ir apsijuosia aplink numerį */
  function buildTravel() {
    d.classList.add('lamp-on');
    var tl, trig, rebuildTimer;
    function centerOf(el) {
      var r = el.getBoundingClientRect(), m = main.getBoundingClientRect();
      return { x: r.left - m.left + r.width / 2, y: r.top - m.top + r.height / 2, w: r.width, docY: r.top + window.scrollY + r.height / 2 };
    }
    function build() {
      if (trig) trig.kill();
      if (tl) tl.kill();
      var vh = window.innerHeight;
      var pr = pic.getBoundingClientRect(), mr = main.getBoundingClientRect(), P = pr.width;
      var p0 = { x: pr.left - mr.left + P * 0.346, y: pr.top - mr.top + P * 0.258 };
      var c1 = centerOf(a1), c2 = centerOf(a2ring);
      /* žiedo išorinis skersmuo = 0,625 SVG dėžutės; lempos dėžutė 480 px */
      var s0 = (0.048 * P / 0.625) / 480, s1 = c1.w / 480, s2 = c2.w / 480;
      var y1 = Math.max(1, c1.docY - vh * 0.42), y2 = Math.max(y1 + 10, c2.docY - vh * 0.5), hold = vh * 0.16;
      var e0 = Math.min(vh * 0.14, y1 * 0.2);
      var total = y2;
      var mid1x = (p0.x + c1.x) / 2 - 90, mid1y = (p0.y + c1.y) / 2;
      var mid2x = (c1.x + c2.x) / 2 + 70, mid2y = (c1.y + c2.y) / 2;

      G.set(lamp, { x: p0.x, y: p0.y, scale: s0, opacity: 0 });
      tl = G.timeline({ paused: true, defaults: { ease: 'none' } });
      tl.to(lamp, { opacity: 1, scale: s0 * 3, duration: e0 / total, ease: 'sine.in' }, 0)
        .to(lamp, { x: mid1x, y: mid1y, scale: (s0 * 3 + s1) / 2, duration: (y1 - hold - e0) / total / 2, ease: 'sine.in' })
        .to(lamp, { x: c1.x, y: c1.y, scale: s1, duration: (y1 - hold - e0) / total / 2, ease: 'sine.out' })
        .to(lamp, { duration: (2 * hold) / total })
        .to(lamp, { x: mid2x, y: mid2y, scale: (s1 + s2) / 2, duration: (y2 - y1 - hold) / total / 2, ease: 'sine.in' })
        .to(lamp, { x: c2.x, y: c2.y, scale: s2, duration: (y2 - y1 - hold) / total / 2, ease: 'sine.out' });
      trig = ST.create({ trigger: document.body, start: 0, end: total, scrub: 0.7, animation: tl, fastScrollEnd: true });
    }
    build();
    function schedule() { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(function () { build(); ST.refresh(); }, 180); }
    window.addEventListener('resize', schedule);
    if (VK) VK.onLang(schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    var img = q('.pic img'); if (img && !img.complete) img.addEventListener('load', schedule, { once: true });
    return function () {
      window.removeEventListener('resize', schedule);
      clearTimeout(rebuildTimer);
      if (trig) trig.kill(); if (tl) tl.kill();
      d.classList.remove('lamp-on');
      G.set(lamp, { clearProps: 'all' });
    };
  }

  /* 3b. Telefone ir planšetėje: žiedai įsijungia savo vietose */
  function buildCompact() {
    qa('.anchor-ring').forEach(function (ring) {
      var halo = q('.halo', ring), svg = q('svg', ring), glint = q('.glint', ring);
      if (ring.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      G.set(halo, { opacity: 0, scale: 0.7 });
      G.set(svg, { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' });
      ST.create({
        trigger: ring, start: 'top 85%', once: true,
        onEnter: function () {
          var t = G.timeline({ defaults: { ease: 'expo.out' } });
          t.to(svg, { opacity: 1, scale: 1, duration: 0.9 }, 0)
           .to(halo, { opacity: 1, scale: 1, duration: 1.4 }, 0.1);
          if (glint) t.fromTo(glint, { rotation: -120, svgOrigin: '0 0' }, { rotation: 0, svgOrigin: '0 0', duration: 1.6, ease: 'power3.inOut' }, 0.15);
        }
      });
    });
  }

  window.VKdebug = { state: function () { return state; }, text: function () { return out.textContent; } };
})();
