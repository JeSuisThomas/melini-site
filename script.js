/* ═══════════════════════════════════════════
   MELINI — Script
   Nav, scroll reveals, mobile menu, carousel
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── NAV SCROLL ─── */
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ─── MOBILE MENU ─── */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  var menuClose = document.getElementById('menu-close');
  var mobileLinks = document.querySelectorAll('.mobile-link');

  function syncMenuState() {
    var open = mobileMenu.classList.contains('open');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  function toggleMenu() { mobileMenu.classList.toggle('open'); syncMenuState(); }
  function closeMenu() { mobileMenu.classList.remove('open'); syncMenuState(); }

  hamburger.addEventListener('click', toggleMenu);
  menuClose.addEventListener('click', closeMenu);
  mobileLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });

  /* ─── SCROLL REVEAL ─── */
  var reveals = document.querySelectorAll('.reveal');
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(function (el) { revealObs.observe(el); });

  /* ─── IMAGE FADE-IN ─── */
  function bindImageFade(img) {
    function markLoaded() {
      img.classList.add('loaded');
      var parent = img.parentElement;
      if (parent && parent.classList.contains('carousel-img')) {
        parent.classList.add('img-loaded');
      }
    }
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true });
    }
  }
  document.querySelectorAll('.carousel-img img').forEach(bindImageFade);
  var heroImg = document.getElementById('cms-hero-img');
  if (heroImg) bindImageFade(heroImg);
  var histImg = document.getElementById('cms-histoire-img');
  if (histImg) bindImageFade(histImg);

  /* ─── CAROUSEL — JS-driven ───
     Animation pilotée par requestAnimationFrame pour fluidité maximale,
     particulièrement sur mobile. Vitesse constante en px/s, indépendante
     du nombre d'items, sans saut au remplacement par le CMS. */
  var carouselEl = document.querySelector('.carousel');
  var carouselWrap = document.querySelector('.carousel-wrap');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var carouselState = {
    pos: 0,
    halfWidth: 0,
    paused: false,
    visible: true,
    lastTime: 0,
    rafId: null
  };

  function carouselSpeed() {
    return window.matchMedia('(max-width: 900px)').matches ? 22 : 28;
  }

  function carouselRecalc() {
    if (!carouselEl) return;
    var total = carouselEl.scrollWidth;
    carouselState.halfWidth = total / 2;
    if (carouselState.halfWidth > 0) {
      while (carouselState.pos <= -carouselState.halfWidth) {
        carouselState.pos += carouselState.halfWidth;
      }
      if (carouselState.pos > 0) carouselState.pos = 0;
    }
  }

  function carouselTick(time) {
    if (carouselState.lastTime === 0) carouselState.lastTime = time;
    var dt = (time - carouselState.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    carouselState.lastTime = time;

    if (!carouselState.paused && carouselState.visible && carouselState.halfWidth > 0) {
      carouselState.pos -= carouselSpeed() * dt;
      if (carouselState.pos <= -carouselState.halfWidth) {
        carouselState.pos += carouselState.halfWidth;
      }
      carouselEl.style.transform = 'translate3d(' + carouselState.pos.toFixed(2) + 'px, 0, 0)';
    }
    carouselState.rafId = requestAnimationFrame(carouselTick);
  }

  function carouselStart() {
    if (!carouselEl) return;
    carouselRecalc();
    if (carouselState.rafId) cancelAnimationFrame(carouselState.rafId);
    carouselState.lastTime = 0;
    if (!prefersReduced) carouselState.rafId = requestAnimationFrame(carouselTick);
  }

  if (carouselEl && carouselWrap && !prefersReduced) {
    if (window.matchMedia('(hover: hover)').matches) {
      carouselWrap.addEventListener('mouseenter', function () { carouselState.paused = true; });
      carouselWrap.addEventListener('mouseleave', function () { carouselState.paused = false; });
    }

    var visObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        carouselState.visible = e.isIntersecting;
        if (e.isIntersecting) carouselState.lastTime = 0;
      });
    }, { threshold: 0 });
    visObs.observe(carouselWrap);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        carouselState.paused = true;
      } else {
        carouselState.paused = false;
        carouselState.lastTime = 0;
      }
    });

    var resizeT = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(carouselRecalc, 150);
    });

    carouselStart();
    window.addEventListener('load', carouselRecalc);
  }

  /* ─── CMS CONTENT LOADER ─── */
  function safeURL(value) {
    if (typeof value !== 'string') return '';
    var s = value.trim();
    if (/^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === '/' && s.charAt(1) !== '/') return s;
    return '';
  }

  fetch('/content/site.json?v=' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.hero && data.hero.image) {
        var hi = document.getElementById('cms-hero-img');
        if (hi) {
          var safeHero = safeURL(data.hero.image);
          if (safeHero) hi.src = safeHero;
        }
      }
      if (data.hero && data.hero.sous_titre) {
        var heroSub = document.getElementById('cms-hero-sub');
        if (heroSub) heroSub.textContent = data.hero.sous_titre;
      }
      if (data.bandeau && data.bandeau.texte) {
        var bandeau = document.getElementById('cms-bandeau');
        if (bandeau) bandeau.textContent = data.bandeau.texte;
      }
      if (data.histoire && data.histoire.image) {
        var hImg = document.getElementById('cms-histoire-img');
        if (hImg) {
          var safeHist = safeURL(data.histoire.image);
          if (safeHist) hImg.src = safeHist;
        }
      }
      if (data.horaires) {
        var hL = document.getElementById('cms-h-lundi');
        var hM = document.getElementById('cms-h-mardi');
        var hD = document.getElementById('cms-h-dimanche');
        if (hL && data.horaires.lundi) hL.textContent = data.horaires.lundi;
        if (hM && data.horaires.mardi_samedi) hM.textContent = data.horaires.mardi_samedi;
        if (hD && data.horaires.dimanche) hD.textContent = data.horaires.dimanche;
      }
      if (data.collection && Array.isArray(data.collection.photos) && data.collection.photos.length > 0) {
        var carEl = document.getElementById('cms-carousel');
        if (carEl) {
          var frag = document.createDocumentFragment();
          function makeItem(photo) {
            var safe = safeURL(photo.image);
            if (!safe) return null;
            var item = document.createElement('div');
            item.className = 'carousel-item';
            var wrap = document.createElement('div');
            wrap.className = 'carousel-img';
            var img = document.createElement('img');
            img.src = safe;
            img.alt = (typeof photo.alt === 'string' ? photo.alt : '').slice(0, 200);
            bindImageFade(img);
            wrap.appendChild(img);
            item.appendChild(wrap);
            return item;
          }
          data.collection.photos.forEach(function (p) {
            var el = makeItem(p);
            if (el) frag.appendChild(el);
          });
          data.collection.photos.forEach(function (p) {
            var el = makeItem(p);
            if (el) frag.appendChild(el);
          });
          carEl.innerHTML = '';
          carEl.appendChild(frag);
          carouselState.pos = 0;
          carEl.style.transform = 'translate3d(0, 0, 0)';
          carouselRecalc();
        }
      }
    })
    .catch(function () {});
})();
