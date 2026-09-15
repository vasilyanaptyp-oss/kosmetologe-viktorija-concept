/* Viktorija — registracija be animacijų: SMS žinutė, išvalymas, kopijavimas, „Įtraukti į žinutę“, telefono juosta.
   Įkeliama iškart po i18n.js ir nelaukia GSAP iš CDN, todėl žinutė ir skambinimo juosta veikia nuo pirmos akimirkos. */
(function () {
  'use strict';
  var VK = window.VK;
  if (!VK) return;
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = q('#smsForm'), out = q('#msgOut'), nameInput = q('#nm'), copyBtn = q('#copyBtn'), clearBtn = q('#clearBtn');
  var state = { topic: '', when: '', time: '', name: '' };
  var still = !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function readState() {
    ['topic', 'when', 'time'].forEach(function (k) {
      var c = q('input[name="' + k + '"]:checked', form); state[k] = c ? c.value : '';
    });
    state.name = nameInput.value;
  }
  function emit(kind) {
    var ev;
    try { ev = new CustomEvent('vk:state', { detail: { state: state, kind: kind } }); } catch (e) { return; }
    document.dispatchEvent(ev);
  }
  function render(kind) {
    var text = VK.build(state, VK.lang()), href = VK.smsHref(text);
    qa('.js-sms').forEach(function (a) { a.setAttribute('href', href); });
    if (out.textContent !== text) out.textContent = text;
    clearBtn.disabled = !(state.topic || state.when || state.time);
    /* be GSAP ar sumažinus judesį lempos blizgesys vis tiek atsisuka į pasirinktą dienos metą */
    if (still || !window.gsap) {
      var rot = state.time === 'am' ? -62 : state.time === 'pm' ? 62 : 0;
      qa('.glint').forEach(function (g) { g.setAttribute('transform', 'rotate(' + rot + ')'); g.style.opacity = state.time === 'any' ? 0 : 1; });
    }
    emit(kind || 'change');
  }

  /* pažymėtą mygtuką paspaudus pele ar pirštu dar kartą — pasirinkimas nuimamas (klaviatūrai yra „Išvalyti“) */
  var wasChecked = null, checkedAt = 0;
  qa('.chips input', form).forEach(function (inp) {
    var lab = inp.parentNode;
    lab.addEventListener('pointerdown', function () { wasChecked = inp.checked ? inp : null; });
    lab.addEventListener('click', function (e) {
      if (wasChecked === inp && e.detail === 1 && e.timeStamp - checkedAt > 450) {
        e.preventDefault();
        inp.checked = false; wasChecked = null;
        readState(); render('change');
      }
    });
  });
  form.addEventListener('change', function (e) {
    if (e.target.type !== 'radio') return;
    checkedAt = e.timeStamp;
    readState(); render('change');
  });
  /* vardą rašant ekrano skaitytuvas neperskaito visos žinutės po kiekvienos raidės */
  var nameTimer;
  nameInput.addEventListener('input', function () {
    out.setAttribute('aria-live', 'off');
    readState(); render('name');
    clearTimeout(nameTimer);
    nameTimer = setTimeout(function () { out.setAttribute('aria-live', 'polite'); }, 900);
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  clearBtn.addEventListener('click', function () {
    var inputs = qa('.chips input', form);
    inputs.forEach(function (i) { i.checked = false; });
    readState(); render('change');
    inputs[0].focus();
  });

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      ok ? res() : rej();
    });
  }
  copyBtn.hidden = false;
  var copyTimer;
  copyBtn.addEventListener('click', function () {
    var s = q('span', copyBtn);
    copyText(out.textContent).then(function () {
      s.textContent = VK.t('copied');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () { s.textContent = VK.t('copy'); }, 2000);
    }, function () {
      var r = document.createRange(); r.selectNodeContents(out);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    });
  });

  qa('.js-topic').forEach(function (a) {
    a.addEventListener('click', function () {
      var inp = q('input[name="topic"][value="' + a.getAttribute('data-topic') + '"]', form);
      if (!inp) return;
      inp.checked = true; readState(); render('topic');
      setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }, 650);
    });
  });

  VK.onLang(function () {
    var s = q('span', copyBtn); if (s) s.textContent = VK.t('copy');
    render('lang');
  });
  readState(); render('init');

  /* telefono juosta: rodoma, kai ekrane nesimato kitų skambinimo mygtukų */
  var bar = q('#bar');
  if (bar && 'IntersectionObserver' in window) {
    var seen = [];
    var targets = [q('#heroCta'), q('#registracija .reg'), q('.ftr')].filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[targets.indexOf(en.target)] = en.isIntersecting; });
      var any = seen.some(Boolean);
      bar.classList.toggle('away', any);
      bar.classList.toggle('show', !any);
    }, { threshold: 0, rootMargin: '-56px 0px 0px 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else if (bar) bar.classList.add('show');

  window.VKui = { state: function () { return state; } };
})();
