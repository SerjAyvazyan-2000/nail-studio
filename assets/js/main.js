/* =========================================================
   Студия маникюра · Бийск — интерактив
   Без библиотек: прелоадер, меню, параллакс, горизонтальный
   скролл, счётчики, слайдер отзывов, курсор, магнитные кнопки
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesktop = () => window.innerWidth > 960;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Прелоадер ---------- */
  const preloader = $('.preloader');
  const countEl = $('[data-count]');
  let loaded = false;
  let progress = 0;
  window.addEventListener('load', () => { loaded = true; });
  setTimeout(() => { loaded = true; }, 3500); // страховка

  const tickLoader = () => {
    const target = loaded ? 100 : 86;
    progress = lerp(progress, target, loaded ? 0.16 : 0.04);
    countEl.textContent = Math.round(progress);
    if (progress > 99.4) {
      countEl.textContent = 100;
      preloader.classList.add('is-done');
      body.classList.remove('is-loading');
      setTimeout(() => body.classList.add('is-ready'), 250);
      setTimeout(() => preloader.remove(), 1300);
      return;
    }
    requestAnimationFrame(tickLoader);
  };
  reduce ? (preloader.remove(), body.classList.remove('is-loading'), body.classList.add('is-ready')) : requestAnimationFrame(tickLoader);

  /* ---------- Год ---------- */
  const y = $('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Мобильное меню ---------- */
  const burger = $('[data-burger]');
  const menu = $('[data-menu]');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.setAttribute('aria-hidden', String(!open));
  };
  burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1200) setMenu(false); });

  /* ---------- Появление по скроллу ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal-up'));
      el.style.transitionDelay = `${siblings.indexOf(el) * 90}ms`;
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal-up').forEach(el => io.observe(el));

  /* ---------- Фото раскрываются «занавесом» ---------- */
  const imgIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      imgIO.unobserve(en.target);
    });
  }, { threshold: 0.2 });
  $$('[data-reveal-img]').forEach(el => imgIO.observe(el));

  /* ---------- Счётчики ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const to = parseFloat(el.dataset.counter);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const start = performance.now();
      const dur = 1800;
      const step = (t) => {
        const p = clamp((t - start) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (to * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-counter]').forEach(el => countIO.observe(el));

  /* ---------- Цены «набегают» при появлении строки ---------- */
  const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const priceEls = $$('[data-price]');
  // фиксируем ширину по итоговому числу, чтобы цифры не прыгали
  const hiddenPanels = $$('[data-panel][hidden]');
  hiddenPanels.forEach(p => { p.hidden = false; });
  priceEls.forEach(el => {
    el.textContent = fmt(parseFloat(el.dataset.price));
    el.style.minWidth = `${Math.ceil(el.getBoundingClientRect().width)}px`;
    if (!reduce) el.textContent = '0';
  });
  hiddenPanels.forEach(p => { p.hidden = true; });
  const runPrice = (el, delay) => {
    const to = parseFloat(el.dataset.price);
    const dur = 1300;
    let start = null;
    const step = (t) => {
      if (start === null) start = t + delay;
      const p = clamp((t - start) / dur, 0, 1);
      el.textContent = fmt(to * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
      if (p < 1) requestAnimationFrame(step);
      else el.closest('.price-row').classList.add('is-counted');
    };
    requestAnimationFrame(step);
  };
  const animatePanel = (panel) => {
    if (reduce || !panel) return;
    $$('.price-row', panel).forEach((row, i) => {
      row.classList.remove('is-counted');
      const el = $('[data-price]', row);
      if (el) { el.textContent = '0'; runPrice(el, 120 + i * 120); }
    });
  };
  let pricesSeen = false;
  const priceIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      priceIO.unobserve(en.target);
      pricesSeen = true;
      animatePanel($('.price-list.is-active'));
    });
  }, { threshold: 0.25 });
  const pricePanels = $('.price-panels');
  if (pricePanels) priceIO.observe(pricePanels);

  /* Вкладки прайса */
  const priceImg = $('[data-price-img]');
  $$('[data-tab]').forEach(tab => tab.addEventListener('click', () => {
    if (tab.classList.contains('is-active')) return;
    $$('[data-tab]').forEach(t => { const on = t === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); });
    $$('[data-panel]').forEach(p => {
      const on = p.dataset.panel === tab.dataset.tab;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
      if (on && pricesSeen) animatePanel(p);
    });
    if (priceImg && tab.dataset.img) {
      priceImg.classList.add('is-swapping');
      const pre = new Image();
      pre.onload = () => { priceImg.src = tab.dataset.img; priceImg.alt = tab.dataset.alt || ''; requestAnimationFrame(() => priceImg.classList.remove('is-swapping')); };
      pre.src = tab.dataset.img;
    }
  }));

  /* ---------- Манифест: слова подсвечиваются по скроллу ---------- */
  const manifest = $('[data-split]');
  let words = [];
  if (manifest) {
    const accents = ['ухоженные', 'руки', 'уверенность'];
    const raw = manifest.innerHTML.replace(/&nbsp;/g, ' ').trim().split(/[ \n\t\r]+/);
    manifest.innerHTML = raw.map(w => {
      const clean = w.toLowerCase().replace(/ /g, ' ');
      const acc = accents.some(a => clean.includes(a)) ? ' is-accent' : '';
      return `<span class="w${acc}">${w}</span>`;
    }).join(' ');
    words = $$('.w', manifest);
  }

  /* ---------- Шапка, активный пункт, мобильная кнопка ---------- */
  const header = $('[data-header]');
  const mobileCta = $('[data-mobile-cta]');
  const sections = $$('main section[id]');
  const navLinks = $$('.nav__link');
  let lastY = 0;

  /* ---------- Элементы для параллакса ---------- */
  const hero = $('[data-hero]');
  const heroDepth = $$('[data-depth]', hero);
  const heroTitle = $('.hero__title', hero);
  const tickerTrack = $('[data-ticker]');
  const worksCols = $$('[data-speed]');
  const whyDancer = $('[data-rotate]');
  const finale = $('[data-finale]');
  const finaleCircle = $('[data-finale-circle]');
  const parallaxImgs = $$('[data-parallax-img]');
  const floats = $$('[data-float]');
  const bgWord = $('[data-bgword]');

  /* Горизонтальный скролл услуг */
  const hSection = $('[data-hscroll]');
  const hTrack = $('[data-htrack]');
  const hProgress = $('[data-hprogress]');
  let hDistance = 0;
  const setupHScroll = () => {
    if (!isDesktop() || reduce) { hSection.style.height = ''; hTrack.style.transform = ''; return; }
    hDistance = Math.max(0, hTrack.scrollWidth - window.innerWidth);
    hSection.style.height = `${window.innerHeight + hDistance}px`;
  };

  /* Мышь для героя */
  let mx = 0, my = 0, cmx = 0, cmy = 0;
  if (finePointer) {
    window.addEventListener('mousemove', e => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  /* ---------- Замеры: делаем редко (resize / загрузка), а не каждый кадр ---------- */
  const docTop = el => el.getBoundingClientRect().top + window.scrollY;
  let M = null;
  const measure = () => {
    M = {
      vh: window.innerHeight,
      desk: isDesktop(),
      tickerHalf: tickerTrack.scrollWidth / 2,
      manifest: manifest ? { top: docTop(manifest), h: manifest.offsetHeight } : null,
      hTop: docTop(hSection),
      works: worksCols.map(col => ({ col, k: parseFloat(col.dataset.speed), top: docTop(col.parentElement), h: col.parentElement.offsetHeight })),
      why: whyDancer ? docTop(whyDancer.parentElement) + whyDancer.parentElement.offsetHeight : 0,
      imgs: parallaxImgs.map(img => ({ img, top: docTop(img.parentElement), h: img.parentElement.offsetHeight })),
      bg: bgWord ? { top: docTop(bgWord.parentElement), h: bgWord.parentElement.offsetHeight } : null,
      finale: finale ? { top: docTop(finale), h: finale.offsetHeight } : null,
      sections: sections.map(sec => ({ id: sec.id, top: docTop(sec) })),
    };
  };
  let measureT;
  const remeasure = () => { clearTimeout(measureT); measureT = setTimeout(() => { setupHScroll(); measure(); force = true; }, 120); };

  let tickerX = 0, velocity = 0, prevScroll = window.scrollY;
  let lastSy = -1, lastMx = 99, wordsOn = -1, activeId = null, scrolledState = null, ctaState = null, force = true;

  const loop = () => {
    if (!M) measure();
    const sy = window.scrollY;
    const vh = M.vh;
    velocity = lerp(velocity, sy - prevScroll, 0.1);
    prevScroll = sy;

    if (!reduce) {
      // бегущая строка — единственное, что меняется каждый кадр (только transform)
      tickerX -= 0.6 + Math.abs(velocity) * 0.35;
      if (-tickerX >= M.tickerHalf) tickerX += M.tickerHalf;
      tickerTrack.style.transform = `translate3d(${tickerX.toFixed(1)}px,0,0) skewX(${clamp(-velocity * 0.4, -12, 12).toFixed(2)}deg)`;
      cmx = lerp(cmx, mx, 0.06);
      cmy = lerp(cmy, my, 0.06);
    }

    const mouseMoving = Math.abs(cmx - lastMx) > 0.0005;
    const scrolled = Math.abs(sy - lastSy) > 0.5;

    if (scrolled || mouseMoving || force) {
      lastSy = sy; lastMx = cmx; force = false;
      const inView = (top, h, pad = 100) => top + h > sy - pad && top < sy + vh + pad;

      const sc = sy > 40;
      if (sc !== scrolledState) { header.classList.toggle('is-scrolled', sc); scrolledState = sc; }

      if (mobileCta && M.finale) {
        const overFinale = inView(M.finale.top, M.finale.h, 0);
        const v = sy > vh * 0.7 && !overFinale;
        if (v !== ctaState) { mobileCta.classList.toggle('is-visible', v); ctaState = v; }
      }

      if (!reduce) {
        if (sy < vh * 1.2) {
          heroDepth.forEach(el => {
            const d = parseFloat(el.dataset.depth);
            const syv = M.desk ? sy * d * 0.5 : 0;
            el.style.transform = `translate3d(${(cmx * d * -40).toFixed(1)}px, ${(cmy * d * -30 + syv).toFixed(1)}px, 0) rotate(${(cmx * d * 6).toFixed(2)}deg)`;
          });
          if (M.desk) {
            heroTitle.style.transform = `translate3d(0, ${(sy * 0.18).toFixed(1)}px, 0)`;
            heroTitle.style.opacity = clamp(1 - sy / (vh * 0.9), 0, 1).toFixed(3);
          }
        }

        if (M.manifest && inView(M.manifest.top, M.manifest.h, vh)) {
          const rTop = M.manifest.top - sy;
          const p = clamp((vh * 0.85 - rTop) / (M.manifest.h + vh * 0.35), 0, 1);
          const on = Math.floor(p * words.length);
          if (on !== wordsOn) { words.forEach((w, i) => w.classList.toggle('is-on', i < on)); wordsOn = on; }
        }

        if (M.desk && hDistance > 0) {
          const p = clamp((sy - M.hTop) / hDistance, 0, 1);
          hTrack.style.transform = `translate3d(${(-p * hDistance).toFixed(1)}px,0,0)`;
          hProgress.style.transform = `scaleX(${p.toFixed(4)})`;
        }

        M.works.forEach(w => {
          if (!M.desk) { if (w.col.style.transform) w.col.style.transform = ''; return; } // на мобильных без сдвига
          if (!inView(w.top, w.h)) return;
          // колонки только «отстают» вниз (0…90px) — не наезжают на заголовок и кнопки
          const passed = clamp((sy + vh - w.top) / (w.h + vh), 0, 1);
          w.col.style.transform = `translate3d(0, ${(passed * w.k * 900).toFixed(1)}px, 0)`;
        });

        if (whyDancer) {
          const off = (M.why - sy - vh / 2) / vh;
          if (off > -1.5 && off < 1.5) whyDancer.style.transform = `rotate(${(off * -24).toFixed(2)}deg) translateY(${(off * 30).toFixed(1)}px)`;
        }

        M.imgs.forEach(o => {
          if (!inView(o.top, o.h)) return;
          const p = (o.top - sy + o.h / 2 - vh / 2) / vh;
          o.img.style.translate = `0 ${(-8 + p * -10).toFixed(2)}%`;
        });

        if (M.bg && inView(M.bg.top, M.bg.h, 0)) {
          bgWord.style.transform = `translate3d(${((M.bg.top - sy - vh / 2) * 0.35).toFixed(1)}px,0,0)`;
        }

        if (M.finale && inView(M.finale.top, M.finale.h)) {
          const fTop = M.finale.top - sy;
          floats.forEach(f => {
            const k = parseFloat(f.dataset.float);
            f.style.translate = M.desk ? `${(cmx * k * 40).toFixed(1)}px ${(fTop * k).toFixed(1)}px` : '0 0';
            f.style.rotate = `${(k * 20 + cmx * 4).toFixed(2)}deg`;
          });
          const p = clamp((vh - fTop) / (vh * 1.1), 0, 1);
          finaleCircle.style.transform = `translate(-50%, -50%) scale(${(0.08 + p * 0.92).toFixed(4)})`;
        }
      }

      let current = '';
      M.sections.forEach(o => { if (o.top - sy < vh * 0.4) current = o.id; });
      if (current !== activeId) {
        navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${current}`));
        activeId = current;
      }
    }

    requestAnimationFrame(loop);
  };

  if (reduce) { words.forEach(w => w.classList.add('is-on')); finaleCircle.style.transform = 'translate(-50%,-50%) scale(1)'; }

  /* ---------- Бегущие ряды отзывов: дублируем карточки для бесконечной ленты ---------- */
  $$('[data-marquee] .rmarquee__track').forEach(track => {
    [...track.children].forEach(card => {
      const c = card.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });
  });
  const barIO = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); barIO.unobserve(en.target); } });
  }, { threshold: 0.6 });
  $$('[data-bar]').forEach(el => barIO.observe(el));

  /* ---------- Лайтбокс галереи ---------- */
  const lb = $('[data-lightbox]');
  const lbImg = $('[data-lb-img]');
  const lbCap = $('[data-lb-cap]');
  const shots = $$('[data-gallery] .shot');
  let lbIndex = 0;
  const lbShow = (i) => {
    lbIndex = (i + shots.length) % shots.length;
    const img = $('img', shots[lbIndex]);
    lbImg.style.opacity = '0';
    const next = new Image();
    next.onload = () => { lbImg.src = img.src; lbImg.alt = img.alt; lbImg.style.opacity = '1'; };
    next.src = img.src;
    lbCap.textContent = $('.shot__label', shots[lbIndex]).textContent;
  };
  const lbOpen = (i) => {
    lbShow(i);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open-lock');
    body.style.overflow = 'hidden';
    $('[data-lb-close]').focus({ preventScroll: true });
  };
  const lbClose = () => {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    shots[lbIndex].focus({ preventScroll: true });
  };
  shots.forEach((s, i) => s.addEventListener('click', () => lbOpen(i)));
  $('[data-lb-close]').addEventListener('click', lbClose);
  $('[data-lb-prev]').addEventListener('click', () => lbShow(lbIndex - 1));
  $('[data-lb-next]').addEventListener('click', () => lbShow(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
    if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
  });
  let lbX = null;
  lb.addEventListener('touchstart', e => { lbX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (lbX === null) return;
    const dx = e.changedTouches[0].clientX - lbX;
    if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    lbX = null;
  });

  /* ---------- Cookie-согласие и карта Яндекса ---------- */
  const KEY = 'cookie-consent';
  const getConsent = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const setConsent = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  const cookieBox = $('[data-cookie]');
  const mapBox = $('.contacts__map');
  const loadMap = () => {
    const f = mapBox && $('iframe[data-src]', mapBox);
    if (!f) return;
    f.src = f.dataset.src;
    f.removeAttribute('data-src');
    mapBox.classList.add('is-loaded');
  };
  const showCookie = () => {
    cookieBox.hidden = false;
    body.classList.add('cookie-open');
    requestAnimationFrame(() => cookieBox.classList.add('is-visible'));
  };
  const hideCookie = () => {
    cookieBox.classList.remove('is-visible');
    body.classList.remove('cookie-open');
    setTimeout(() => { cookieBox.hidden = true; }, 600);
  };
  if (cookieBox) {
    const c = getConsent();
    if (c === 'all') loadMap();
    else if (!c) setTimeout(showCookie, reduce ? 0 : 2200);
    $('[data-cookie-accept]').addEventListener('click', () => { setConsent('all'); loadMap(); hideCookie(); });
    $('[data-cookie-decline]').addEventListener('click', () => { setConsent('necessary'); hideCookie(); });
    const st = $('[data-cookie-settings]');
    if (st) st.addEventListener('click', showCookie);
  }
  const mapBtn = $('[data-map-load]');
  if (mapBtn) mapBtn.addEventListener('click', () => { setConsent('all'); loadMap(); if (cookieBox && !cookieBox.hidden) hideCookie(); });

  /* ---------- Старт ---------- */
  setupHScroll();
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.querySelector('main'));
  requestAnimationFrame(loop);
})();
