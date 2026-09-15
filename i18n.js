/* Viktorija — kalbos (LT/RU) ir SMS žinutės sudarymas.
   Lietuvių tekstas yra HTML, jį įsimename paleidę; rusų — žodyne. ?lang= stipresnis už localStorage „vk-lang“. */
(function () {
  'use strict';
  var d = document.documentElement;
  var PHONE = '+37061261703';

  var RU = {
    skip: 'Перейти к записи',
    brandAria: 'Виктория, медицинский косметолог',
    role: 'медицинский косметолог',
    navAria: 'Разделы страницы',
    navProc: 'Процедуры', navReg: 'Запись', navCont: 'Контакты',
    callAria: 'Позвонить +370 612 61703',
    name: 'Виктория',
    eyeRole: 'Медицинский косметолог', eyeCity: 'Висагинас',
    h1a: 'Уход за кожей',
    h1b: 'в светлом кабинете.',
    photoAlt: 'Медицинский косметолог Виктория в своём кабинете в Висагинасе',
    capL: 'Кабинет',
    capD: 'Светлый кабинет в Висагинасе',
    sub: 'Виктория, медицинский косметолог, принимает в кабинете в Висагинасе. Запишитесь по телефону или напишите SMS.',
    call: 'Позвонить',
    writeSms: 'Написать SMS',
    specCab: 'Кабинет', specReg: 'Запись', specRegV: 'по телефону или SMS', specTel: 'Телефон',
    procKicker: 'Чем можем помочь',
    procTitle: 'Процедуры',
    procLead: 'Подробный список процедур скоро дополним. Если сомневаетесь, с чего начать, выберите консультацию.',
    p1t: 'Консультация',
    p1d: 'Разговор в кабинете: обсудите, что для вас важно и с чего начать.',
    p2t: 'Уход за кожей лица',
    p2d: 'Уход подбирается индивидуально.',
    p3t: 'Список процедур дополним',
    p3d: 'Пока о процедурах спрашивайте по телефону.',
    soon: 'Готовится',
    addToMsg: 'Добавить в сообщение',
    regKicker: 'Запись',
    regTitle: 'Запишитесь по телефону или SMS',
    lensLbl: 'Звоните',
    lensNote: 'Tarybų g. 6, Висагинас',
    panelTitle: 'Подготовим SMS',
    panelHint: 'Отметьте, что вам подходит. Если ничего не выбрать, сообщение всё равно будет готово.',
    lgTopic: 'Что интересует?', tConsult: 'Консультация', tFace: 'Уход за кожей лица', tUnsure: 'Пока не знаю',
    lgWhen: 'Когда?', wAsap: 'Как можно скорее', wThis: 'На этой неделе', wNext: 'На следующей неделе',
    lgTime: 'Время дня', tmAm: 'До обеда', tmPm: 'После обеда', tmAny: 'Неважно',
    nameLbl: 'Имя (необязательно)',
    msgLbl: 'Ваше сообщение',
    sendSms: 'Отправить SMS',
    copy: 'Скопировать текст', copied: 'Скопировано',
    smsNote: 'Сообщение откроется в вашем телефоне, отправите его сами. Точное время согласуете с Викторией.',
    contKicker: 'Контакты', contTitle: 'Контакты и адрес',
    mailDt: 'Эл. почта', mailA: 'Написать письмо',
    fbA: 'Страница в Facebook',
    routeDt: 'Маршрут', routeA: 'Открыть на карте',
    concept: 'Концепция — неофициальный сайт',
    title: 'Виктория, медицинский косметолог. Висагинас',
    desc: 'Медицинский косметолог Виктория, Tarybų g. 6, Висагинас. Запись по телефону +370 612 61703 или SMS.'
  };
  var LT = { copied: 'Nukopijuota', copy: 'Kopijuoti tekstą' };

  /* SMS tekstas: kalba = puslapio kalba; nieko nepažymėjus — konsultacija be laiko */
  var SMS = {
    lt: {
      hi: 'Laba diena, Viktorija!',
      topic: { consult: 'Norėčiau užsiregistruoti konsultacijai.', face: 'Norėčiau užsiregistruoti veido odos priežiūros procedūrai.', unsure: 'Norėčiau pasitarti, nuo ko pradėti.' },
      when: { asap: 'kuo greičiau', 'this': 'šią savaitę', next: 'kitą savaitę' },
      time: { am: 'iki pietų', pm: 'po pietų' },
      pref: 'Man patogiausia', asapPref: 'Norėčiau atvykti',
      ask: 'Ar būtų laisvo laiko?',
      name: 'Mano vardas'
    },
    ru: {
      hi: 'Здравствуйте, Виктория!',
      topic: { consult: 'Хочу записаться на консультацию.', face: 'Хочу записаться на уход за кожей лица.', unsure: 'Хочу посоветоваться, с чего начать.' },
      when: { asap: 'как можно скорее', 'this': 'на этой неделе', next: 'на следующей неделе' },
      time: { am: 'до обеда', pm: 'после обеда' },
      pref: 'Мне удобнее', asapPref: 'Хотелось бы прийти',
      ask: 'Будет ли свободное время?',
      name: 'Меня зовут'
    }
  };

  function build(state, lang) {
    var t = SMS[lang] || SMS.lt, parts = [t.hi, t.topic[state.topic] || t.topic.consult];
    var w = t.when[state.when], tm = t.time[state.time];
    if (w || tm) {
      var lead = state.when === 'asap' ? t.asapPref : t.pref;
      parts.push(lead + ' ' + [w, tm].filter(Boolean).join(', ') + '.');
    }
    parts.push(t.ask);
    var text = parts.join(' ');
    var nm = (state.name || '').trim();
    if (nm) text += '\n' + t.name + ': ' + nm + '.';
    return text;
  }
  function smsHref(text) { return 'sms:' + PHONE + '?&body=' + encodeURIComponent(text); }

  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
  var attrNodes = Array.prototype.slice.call(document.querySelectorAll('[data-i18n-attr]'));
  nodes.forEach(function (n) { var k = n.getAttribute('data-i18n'); if (!(k in LT)) LT[k] = n.textContent; });
  attrNodes.forEach(function (n) {
    n.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
      var p = pair.split(':'); if (!(p[1] in LT)) LT[p[1]] = n.getAttribute(p[0]);
    });
  });
  LT.title = document.title;
  var metaDesc = document.querySelector('meta[name="description"]');
  LT.desc = metaDesc ? metaDesc.content : '';

  var lang = d.lang === 'ru' ? 'ru' : 'lt';
  var listeners = [];

  function apply(l, opts) {
    lang = l === 'ru' ? 'ru' : 'lt';
    var dict = lang === 'ru' ? RU : LT;
    d.lang = lang;
    nodes.forEach(function (n) { var v = dict[n.getAttribute('data-i18n')]; if (v != null) n.textContent = v; });
    attrNodes.forEach(function (n) {
      n.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'), v = dict[p[1]]; if (v != null) n.setAttribute(p[0], v);
      });
    });
    document.title = dict.title;
    if (metaDesc) metaDesc.content = dict.desc;
    Array.prototype.forEach.call(document.querySelectorAll('.lang a'), function (a) {
      a.setAttribute('aria-current', a.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    if (opts && opts.save) {
      try { localStorage.setItem('vk-lang', lang); } catch (e) {}
      try {
        var u = new URL(location.href); u.searchParams.set('lang', lang);
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) {}
    }
    d.classList.remove('i18n-wait');
    listeners.forEach(function (fn) { fn(lang); });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.lang a'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      apply(a.getAttribute('data-lang'), { save: true });
    });
  });

  window.VK = {
    lang: function () { return lang; },
    t: function (k) { return (lang === 'ru' ? RU : LT)[k]; },
    build: build,
    smsHref: smsHref,
    onLang: function (fn) { listeners.push(fn); }
  };

  if (lang === 'ru') apply('ru');
  else d.classList.remove('i18n-wait');
})();
