/* Viktorija — tik judesys (registracijos logika yra ui.js ir veikia be šio failo).
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

  /* galvenė: plona linija po slinkimo */
  var hdr = q('#hdr'), stuck = false;
  function onScroll() {
    var s = window.scrollY > 8;
    if (s !== stuck) { stuck = s; hdr.classList.toggle('stuck', s); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!(G && ST) || reduce) return;
  G.registerPlugin(ST);
  d.classList.add('gs');
  ST.config({ ignoreMobileResize: true });

  var main = q('#main'), lamp = q('#lamp'), pic = q('.pic'), out = q('#msgOut');
  var a1 = q('#a1'), a2ring = q('#a2 .ring');
  var LX = 0.346, LY = 0.258;                          /* tikros lempos centras nuotraukoje (dalimis nuo pločio) */

  /* 1. Įsijungimas (lanko ženklas ir šviesa palei horizontą) — CSS animacija, kad nepriklausytų nuo to, kada atkeliauja GSAP */

  /* 2. Šviesa atkeliauja po procedūrų eilutėmis — tik toms, kurios dar žemiau ekrano */
  qa('.row .lit').forEach(function (lit) {
    if (lit.parentNode.getBoundingClientRect().top < window.innerHeight * 0.82) return;
    G.set(lit, { xPercent: -101 });
    ST.create({
      trigger: lit.parentNode, start: 'top 82%', once: true, fastScrollEnd: true,
      onEnter: function () { G.to(lit, { xPercent: 0, duration: 1.1, ease: 'power3.out', overwrite: true }); }
    });
  });

  /* 3. Žinutės pakeitimas: tekstas švelniai „nušvinta“, lempos blizgesys pasisuka pagal dienos metą */
  var glints = qa('.glint');
  function glintTo(st) {
    var rot = st.time === 'am' ? -62 : st.time === 'pm' ? 62 : 0;
    G.to(glints, { rotation: rot, opacity: st.time === 'any' ? 0 : 1, svgOrigin: '0 0', duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
  }
  document.addEventListener('vk:state', function (e) {
    var k = e.detail.kind;
    if (k === 'change' || k === 'topic') G.fromTo(out, { opacity: 0.4 }, { opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: true });
    if (k === 'topic') {
      var chip = q('input[name="topic"]:checked + span');
      if (chip) G.fromTo(chip, { scale: 1 }, { scale: 1.05, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', delay: 0.55 });
    }
    glintTo(e.detail.state);
  });
  if (window.VKui) glintTo(window.VKui.state());

  var mm = G.matchMedia();
  mm.add({
    travel: '(min-width: 1080px) and (pointer: fine)',
    compact: '(max-width: 1079.98px), (pointer: coarse)'
  }, function (ctx) {
    return ctx.conditions.travel ? buildTravel() : buildCompact();
  });

  /* 4a. Plačiame ekrane: lempa išeina iš nuotraukos, sustoja virš „Procedūros“ ir apsijuosia aplink numerį */
  function buildTravel() {
    d.classList.add('lamp-on');
    var tl, trig, timer, alive = true, lastW = window.innerWidth, lastH = window.innerHeight;
    function centerOf(el) {
      var r = el.getBoundingClientRect(), m = main.getBoundingClientRect();
      return { x: r.left - m.left + r.width / 2, y: r.top - m.top + r.height / 2, w: r.width, docY: r.top + window.scrollY + r.height / 2 };
    }
    function build() {
      var progress = trig ? trig.progress : 0;
      if (trig) trig.kill();
      if (tl) tl.kill();
      var vh = window.innerHeight;
      var pr = pic.getBoundingClientRect(), mr = main.getBoundingClientRect(), P = pr.width;
      var p0 = { x: pr.left - mr.left + P * LX, y: pr.top - mr.top + P * LY };
      var c1 = centerOf(a1), c2 = centerOf(a2ring), discW = q('#a2 .lens-disc').getBoundingClientRect().width;
      /* žiedo išorinis skersmuo = 0,625 SVG dėžutės; lempos dėžutė 480 px */
      var s0 = (0.048 * P / 0.625) / 480, s1 = c1.w / 480, s2 = c2.w / 480;
      var sHidden = Math.min(s2, discW * 0.92 / (0.625 * 480));   /* žiedas pasislėpęs už disko */
      /* aukštame ekrane y1 gali būti mažesnis už sustojimą — segmentai visada sudaro visą kelią */
      var hold = vh * 0.16;
      var y1 = Math.max(hold + 60, c1.docY - vh * 0.42);
      var y2 = Math.max(y1 + hold + 40, c2.docY - vh * 0.62);
      var e0 = Math.max(0, Math.min(vh * 0.14, (y1 - hold) * 0.3));
      var total = y2;
      var seg1 = Math.max(0, y1 - hold - e0) / total, seg2 = Math.max(0, y2 - y1 - hold) / total;
      var mid1 = { x: (p0.x + c1.x) / 2 - 90, y: (p0.y + c1.y) / 2 };
      var mid2 = { x: (c1.x + c2.x) / 2 + 70, y: (c1.y + c2.y) / 2 };

      /* judėdama lempa prigęsta (nekerta teksto ryškiu žiedu), sustojusi — įsižiebia */
      G.set(lamp, { x: p0.x, y: p0.y, scale: s0, opacity: 0 });
      tl = G.timeline({ paused: true, defaults: { ease: 'none' } });
      tl.to(lamp, { opacity: 0.8, scale: s0 * 3, duration: e0 / total, ease: 'sine.in' }, 0)
        .to(lamp, { x: mid1.x, y: mid1.y, scale: (s0 * 3 + s1) / 2, opacity: 0.3, duration: seg1 / 2, ease: 'sine.in' })
        .to(lamp, { x: c1.x, y: c1.y, scale: s1, duration: seg1 / 2, ease: 'sine.out' })
        .to(lamp, { opacity: 1, duration: seg1 * 0.25, ease: 'sine.out' }, '<' + seg1 * 0.25)
        .addLabel('a1')
        .to(lamp, { duration: 2 * hold / total }, 'a1')
        .to(lamp, { x: mid2.x, y: mid2.y, scale: (s1 + sHidden) / 2, opacity: 0.25, duration: seg2 * 0.45, ease: 'sine.in' })
        .to(lamp, { x: c2.x, y: c2.y, scale: sHidden, duration: seg2 * 0.35, ease: 'sine.out' })
        .to(lamp, { scale: s2, opacity: 1, duration: seg2 * 0.2, ease: 'power2.out' });
      tl.progress(progress);
      trig = ST.create({ trigger: document.body, start: 0, end: total, scrub: 0.7, animation: tl, fastScrollEnd: true });
    }
    build();
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(function () { if (alive) { build(); ST.refresh(); } }, 180);
    }
    function onResize() {
      if (window.innerWidth !== lastW || window.innerHeight !== lastH) { lastW = window.innerWidth; lastH = window.innerHeight; schedule(); }
    }
    window.addEventListener('resize', onResize);
    /* žinutės skydelis auga — perskaičiuojame lempos stoteles */
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { if (alive) schedule(); }) : null;
    if (ro) ro.observe(main);
    if (VK) VK.onLang(function () { if (alive) schedule(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    var img = q('.pic img'); if (img && !img.complete) img.addEventListener('load', schedule, { once: true });
    return function () {
      alive = false;
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
      if (trig) trig.kill(); if (tl) tl.kill();
      trig = tl = null;
      d.classList.remove('lamp-on');
      G.set(lamp, { clearProps: 'all' });
    };
  }

  /* 4b. Telefone ir planšetėje: žiedai įsijungia savo vietose */
  function buildCompact() {
    qa('.anchor-ring').forEach(function (ring) {
      var halo = q('.halo', ring), svg = q('svg', ring);
      if (ring.getBoundingClientRect().top < window.innerHeight * 0.85) return;
      G.set(halo, { opacity: 0, scale: 0.7 });
      G.set(svg, { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' });
      ST.create({
        trigger: ring, start: 'top 85%', once: true, fastScrollEnd: true,
        onEnter: function () {
          G.timeline({ defaults: { ease: 'expo.out' } })
            .to(svg, { opacity: 1, scale: 1, duration: 0.9 }, 0)
            .to(halo, { opacity: 1, scale: 1, duration: 1.4 }, 0.1);
        }
      });
    });
  }
})();
