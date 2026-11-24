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

  /* ---------- Цены «набегают» при появлении ---------- */
  const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const priceIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const to = parseFloat(el.dataset.price);
      const start = performance.now();
      const step = (t) => {
        const p = clamp((t - start) / 1400, 0, 1);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      if (!reduce) requestAnimationFrame(step);
      priceIO.unobserve(el);
    });
  }, { threshold: 0.8 });
  $$('[data-price]').forEach(el => priceIO.observe(el));

  /* ---------- Манифест: слова подсвечиваются по скроллу ---------- */
  const manifest = $('[data-split]');
  let words = [];
  if (manifest) {
    const accents = ['ухоженные', 'руки', 'пластика', 'уверенности.', 'красивыми.'];
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

  let tickerX = 0, velocity = 0, prevScroll = window.scrollY;

  const loop = () => {
    const sy = window.scrollY;
    const vh = window.innerHeight;

    // скорость скролла для бегущей строки
    velocity = lerp(velocity, sy - prevScroll, 0.1);
    prevScroll = sy;

    // шапка
    header.classList.toggle('is-scrolled', sy > 40);
    lastY = sy;

    // мобильная кнопка: после героя и не над финалом
    if (mobileCta && finale) {
      const fr = finale.getBoundingClientRect();
      mobileCta.classList.toggle('is-visible', sy > vh * 0.7 && !(fr.top < vh && fr.bottom > 0));
    }

    if (!reduce) {
      // HERO: мышь + скролл
      cmx = lerp(cmx, mx, 0.06);
      cmy = lerp(cmy, my, 0.06);
      if (sy < vh * 1.2) {
        const desk = isDesktop();
        heroDepth.forEach(el => {
          const d = parseFloat(el.dataset.depth);
          const scrollY = desk ? sy * d * 0.5 : 0;
          el.style.transform = `translate3d(${cmx * d * -40}px, ${cmy * d * -30 + scrollY}px, 0) rotate(${cmx * d * 6}deg)`;
        });
        if (desk) {
          heroTitle.style.transform = `translate3d(0, ${sy * 0.18}px, 0)`;
          heroTitle.style.opacity = String(clamp(1 - sy / (vh * 0.9), 0, 1));
        } else {
          heroTitle.style.transform = '';
          heroTitle.style.opacity = '';
        }
      }

      // бегущая строка
      tickerX -= 0.6 + Math.abs(velocity) * 0.35;
      const half = tickerTrack.scrollWidth / 2;
      if (-tickerX >= half) tickerX += half;
      tickerTrack.style.transform = `translate3d(${tickerX}px,0,0) skewX(${clamp(-velocity * 0.4, -12, 12)}deg)`;

      // манифест
      if (words.length) {
        const r = manifest.getBoundingClientRect();
        const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
        const on = Math.floor(p * words.length);
        words.forEach((w, i) => w.classList.toggle('is-on', i < on));
      }

      // горизонтальные услуги
      if (isDesktop() && hDistance > 0) {
        const r = hSection.getBoundingClientRect();
        const p = clamp(-r.top / hDistance, 0, 1);
        hTrack.style.transform = `translate3d(${-p * hDistance}px,0,0)`;
        hProgress.style.transform = `scaleX(${p})`;
      }

      // колонки работ
      worksCols.forEach(col => {
        const r = col.parentElement.getBoundingClientRect();
        const off = (r.top + r.height / 2 - vh / 2);
        col.style.transform = `translate3d(0, ${off * parseFloat(col.dataset.speed)}px, 0)`;
      });

      // танцовщица в «Почему мы»
      if (whyDancer) {
        const r = whyDancer.getBoundingClientRect();
        const off = (r.top - vh / 2) / vh;
        whyDancer.style.transform = `rotate(${off * -24}deg) translateY(${off * 30}px)`;
      }

      // параллакс фото внутри рамок (свойство translate не мешает transform)
      parallaxImgs.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.translate = `0 ${(-8 + p * -10).toFixed(2)}%`;
      });

      // большое слово «прайс» едет по горизонтали
      if (bgWord) {
        const r = bgWord.parentElement.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) bgWord.style.transform = `translate3d(${(r.top - vh / 2) * 0.35}px,0,0)`;
      }

      // фото в финале
      if (finale) {
        const fr = finale.getBoundingClientRect();
        if (fr.top < vh && fr.bottom > 0) {
          floats.forEach(f => {
            const k = parseFloat(f.dataset.float);
            f.style.translate = `${cmx * k * 40}px ${(fr.top) * k}px`;
            f.style.rotate = `${k * 20 + cmx * 4}deg`;
          });
        }
      }

      // финал: круг раскрывается
      if (finale) {
        const r = finale.getBoundingClientRect();
        const p = clamp((vh - r.top) / (vh * 1.1), 0, 1);
        finaleCircle.style.transform = `translate(-50%, -50%) scale(${0.08 + p * 0.92})`;
      }
    }

    // активный пункт меню
    let current = '';
    sections.forEach(s => { if (s.getBoundingClientRect().top < vh * 0.4) current = s.id; });
    navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${current}`));

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

  /* ---------- Курсор ---------- */
  if (finePointer && !reduce) {
    const cursor = $('.cursor');
    const label = $('.cursor__label', cursor);
    let cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    const cLoop = () => {
      cx = lerp(cx, tx, 0.2); cy = lerp(cy, ty, 0.2);
      const w = cursor.offsetWidth;
      cursor.style.transform = `translate3d(${cx - w / 2}px, ${cy - w / 2}px, 0)`;
      requestAnimationFrame(cLoop);
    };
    cLoop();
    document.addEventListener('mouseover', e => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button');
      cursor.classList.toggle('is-label', !!lab);
      cursor.classList.toggle('is-link', !lab && !!link);
      if (lab) label.textContent = lab.dataset.cursor;
    });
    $('[data-lightbox]').addEventListener('mouseenter', () => cursor.classList.remove('is-label', 'is-link'));

  }

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

  /* ---------- Старт ---------- */
  setupHScroll();
  window.addEventListener('resize', setupHScroll);
  window.addEventListener('load', setupHScroll);
  requestAnimationFrame(loop);
})();
