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
    h1a: 'Уход за кожей',
    h1b: 'в светлом кабинете.',
    photoAlt: 'Медицинский косметолог Виктория в кабинете в Висагинасе',
    sub: 'Виктория, медицинский косметолог, принимает в Висагинасе. Запишитесь по телефону или напишите SMS.',
    call: 'Позвонить',
    writeSms: 'Написать SMS',
    specCab: 'Кабинет', specReg: 'Запись', specRegV: 'по телефону или SMS', specTel: 'Телефон',
    procKicker: 'Процедуры',
    procTitle: 'С чего начать',
    procLead: 'Выберите направление и добавьте его в SMS — или просто позвоните.',
    p1t: 'Консультация',
    p1d: 'Если вы ещё не знаете, с чего начать.',
    p2t: 'Уход за кожей лица',
    p2d: 'Подробнее — по телефону или в SMS.',
    p3t: 'Список процедур дополним',
    p3d: 'О процедурах можно узнать по телефону.',
    soon: 'Готовится',
    addToMsg: 'Добавить в сообщение',
    regKicker: 'Запись',
    regTitle: 'Запишитесь по телефону или SMS',
    lensLbl: 'Звоните',
    panelTitle: 'Подготовим SMS',
    panelHint: 'Отметьте, что вам подходит. Можно ничего не выбирать — сообщение всё равно будет готово.',
    lgTopic: 'Что вас интересует?', tConsult: 'Консультация', tFace: 'Уход за кожей лица', tUnsure: 'Пока не знаю',
    lgWhen: 'Когда?', wAsap: 'Как можно скорее', wThis: 'На этой неделе', wNext: 'На следующей неделе',
    lgTime: 'Время дня', tmAm: 'До обеда', tmPm: 'После обеда', tmAny: 'Неважно',
    nameLbl: 'Имя (необязательно)',
    msgLbl: 'Ваше сообщение', msgTo: 'Кому:',
    clear: 'Сбросить выбор',
    deskNote: 'Если вы за компьютером, скопируйте текст и отправьте его по SMS со своего телефона на номер +370 612 61703. Точное время вы согласуете с Викторией.',
    sendSms: 'Отправить SMS',
    copy: 'Скопировать текст', copied: 'Скопировано',
    smsNote: 'Сообщение откроется в приложении для SMS — останется только отправить его. Точное время вы согласуете с Викторией.',
    contKicker: 'Контакты', contTitle: 'Контакты и адрес',
    mailDt: 'Эл. почта', mailA: 'Написать письмо',
    fbA: 'Страница в Facebook',
    routeDt: 'Маршрут', routeA: 'Открыть на карте',
    concept: 'Концепция — неофициальный сайт',
    title: 'Виктория, медицинский косметолог. Висагинас',
    desc: 'Медицинский косметолог Виктория, Tarybų g. 6, Visaginas. Запись по телефону +370 612 61703 или по SMS.'
  };
  var LT = { copied: 'Nukopijuota' };

  /* SMS tekstas: kalba = puslapio kalba; nieko nepažymėjus — paprastas prašymas užregistruoti */
  var SMS = {
    lt: {
      hi: 'Laba diena, Viktorija.',
      topic: { none: 'Norėčiau užsiregistruoti.', consult: 'Norėčiau užsiregistruoti konsultacijai.', face: 'Norėčiau užsiregistruoti dėl veido odos priežiūros.', unsure: 'Norėčiau pasitarti, nuo ko pradėti.' },
      when: { asap: 'kuo anksčiau', 'this': 'šią savaitę', next: 'kitą savaitę' },
      time: { am: 'iki pietų', pm: 'po pietų' },
      withWhen: { am: 'iki pietų', pm: 'po pietų' },
      whenLead: 'Man tiktų', asapLead: 'Man tiktų', timeLead: 'Man tiktų',
      anyOnly: 'Man tiktų bet kuriuo metu.',
      ask: 'Ar būtų laisvo laiko?'
    },
    ru: {
      hi: 'Здравствуйте, Виктория!',
      topic: { none: 'Хочу записаться на приём.', consult: 'Хочу записаться на консультацию.', face: 'Хочу записаться на уход за кожей лица.', unsure: 'Хочу посоветоваться, с чего начать.' },
      when: { asap: 'как можно скорее', 'this': 'на этой неделе', next: 'на следующей неделе' },
      time: { am: 'до обеда', pm: 'после обеда' },
      withWhen: { am: 'лучше до обеда', pm: 'лучше после обеда' },
      whenLead: 'Мне удобно', asapLead: 'Хотелось бы прийти', timeLead: 'Мне удобнее',
      anyOnly: 'Мне подойдёт любое время.',
      ask: 'Подскажите, пожалуйста, когда вы могли бы меня принять?'
    }
  };

  /* „Nesvarbu“ kartu su savaite nieko neprideda, todėl praleidžiamas */
  function build(state, lang) {
    var t = SMS[lang] || SMS.lt, parts = [t.hi, t.topic[state.topic] || t.topic.none];
    var w = t.when[state.when];
    if (w) {
      var tw = t.withWhen[state.time];
      parts.push((state.when === 'asap' ? t.asapLead : t.whenLead) + ' ' + w + (tw ? ', ' + tw : '') + '.');
    } else if (state.time === 'any') parts.push(t.anyOnly);
    else if (t.time[state.time]) parts.push(t.timeLead + ' ' + t.time[state.time] + '.');
    parts.push(t.ask);
    var text = parts.join(' ');
    var nm = (state.name || '').trim();
    if (nm) text += '\n' + nm;
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
