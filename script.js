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

  /* ─── CAROUSEL — JS-driven avec drag manuel ───
     Animation par requestAnimationFrame + pointer events unifiés (souris/touch/stylet).
     - Auto-scroll constant en px/s
     - Drag manuel avec momentum à l'inertie au relâchement
     - Pause hover réservée à la souris (pas de faux-tap sur Android)
     - touch-action: pan-y → le scroll vertical de la page reste fluide */
  var carouselEl = document.querySelector('.carousel');
  var carouselWrap = document.querySelector('.carousel-wrap');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var carouselState = {
    pos: 0,
    halfWidth: 0,
    visible: true,
    hoverPaused: false,
    lastTime: 0,
    rafId: null
  };

  var dragState = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    startPos: 0,
    velocity: 0,
    direction: null,
    momentum: 0
  };

  function carouselSpeed() {
    return window.matchMedia('(max-width: 900px)').matches ? 22 : 28;
  }

  function wrapPosition() {
    if (carouselState.halfWidth <= 0) return;
    while (carouselState.pos <= -carouselState.halfWidth) carouselState.pos += carouselState.halfWidth;
    while (carouselState.pos > 0) carouselState.pos -= carouselState.halfWidth;
  }

  function applyTransform() {
    carouselEl.style.transform = 'translate3d(' + carouselState.pos.toFixed(2) + 'px, 0, 0)';
  }

  function carouselRecalc() {
    if (!carouselEl) return;
    // Mesure exacte de la période : offsetLeft du 1er item de la 2e copie.
    // Plus fiable que scrollWidth/2 (qui peut ignorer la marge du dernier item
    // et créer un décalage sous-pixel qui se cumule au wrap → flash blanc).
    var children = carouselEl.children;
    var total = children.length;
    var period = 0;
    if (total >= 2 && total % 2 === 0) {
      period = children[total / 2].offsetLeft;
    }
    if (period <= 0) period = carouselEl.scrollWidth / 2;
    carouselState.halfWidth = period;
    wrapPosition();
  }

  function carouselTick(time) {
    if (carouselState.lastTime === 0) carouselState.lastTime = time;
    var dt = (time - carouselState.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    carouselState.lastTime = time;

    if (carouselState.visible && carouselState.halfWidth > 0) {
      if (dragState.active) {
        // position contrôlée par les pointer events
      } else if (Math.abs(dragState.momentum) > 5) {
        carouselState.pos += dragState.momentum * dt;
        dragState.momentum *= 0.92;
        if (Math.abs(dragState.momentum) < 5) dragState.momentum = 0;
        wrapPosition();
        applyTransform();
      } else if (!carouselState.hoverPaused) {
        carouselState.pos -= carouselSpeed() * dt;
        wrapPosition();
        applyTransform();
      }
    }
    carouselState.rafId = requestAnimationFrame(carouselTick);
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragState.pointerId = e.pointerId;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.lastX = e.clientX;
    dragState.lastTime = performance.now();
    dragState.direction = null;
    dragState.active = false;
    dragState.velocity = 0;
  }

  function onPointerMove(e) {
    if (dragState.pointerId === null || e.pointerId !== dragState.pointerId) return;

    if (dragState.direction === null) {
      var dx0 = e.clientX - dragState.startX;
      var dy0 = e.clientY - dragState.startY;
      if (Math.abs(dx0) > 6 || Math.abs(dy0) > 6) {
        dragState.direction = Math.abs(dx0) > Math.abs(dy0) ? 'horizontal' : 'vertical';
        if (dragState.direction === 'horizontal') {
          dragState.active = true;
          dragState.startPos = carouselState.pos;
          dragState.momentum = 0;
          try { carouselWrap.setPointerCapture(e.pointerId); } catch (_) {}
          carouselWrap.classList.add('dragging');
        }
      }
    }

    if (dragState.active) {
      if (e.cancelable) e.preventDefault();
      var dx = e.clientX - dragState.startX;
      var rawPos = dragState.startPos + dx;
      carouselState.pos = rawPos;
      wrapPosition();
      // Si le wrap a déplacé pos, on recale la référence de drag pour que
      // le doigt continue de tracker le contenu sans saut au franchissement.
      var wrapShift = rawPos - carouselState.pos;
      if (wrapShift !== 0) {
        dragState.startPos -= wrapShift;
      }
      applyTransform();

      var now = performance.now();
      var ddt = (now - dragState.lastTime) / 1000;
      if (ddt > 0) {
        dragState.velocity = (e.clientX - dragState.lastX) / ddt;
      }
      dragState.lastX = e.clientX;
      dragState.lastTime = now;
    }
  }

  function onPointerEnd(e) {
    if (dragState.pointerId === null || e.pointerId !== dragState.pointerId) return;
    if (dragState.active) {
      var timeSinceMove = performance.now() - dragState.lastTime;
      if (timeSinceMove > 80) {
        dragState.momentum = 0;
      } else {
        dragState.momentum = Math.max(-2500, Math.min(2500, dragState.velocity));
      }
      try { carouselWrap.releasePointerCapture(e.pointerId); } catch (_) {}
      carouselWrap.classList.remove('dragging');
    }
    dragState.active = false;
    dragState.pointerId = null;
    dragState.direction = null;
  }

  function onPointerEnter(e) {
    if (e.pointerType === 'mouse') carouselState.hoverPaused = true;
  }

  function onPointerLeave(e) {
    if (e.pointerType === 'mouse') carouselState.hoverPaused = false;
  }

  function carouselStart() {
    if (!carouselEl) return;
    carouselRecalc();
    if (carouselState.rafId) cancelAnimationFrame(carouselState.rafId);
    carouselState.lastTime = 0;
    if (!prefersReduced) carouselState.rafId = requestAnimationFrame(carouselTick);
  }

  if (carouselEl && carouselWrap && !prefersReduced) {
    carouselWrap.addEventListener('pointerdown', onPointerDown);
    carouselWrap.addEventListener('pointermove', onPointerMove);
    carouselWrap.addEventListener('pointerup', onPointerEnd);
    carouselWrap.addEventListener('pointercancel', onPointerEnd);
    carouselWrap.addEventListener('pointerenter', onPointerEnter);
    carouselWrap.addEventListener('pointerleave', onPointerLeave);
    carouselWrap.addEventListener('dragstart', function (e) { e.preventDefault(); });

    var visObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        carouselState.visible = e.isIntersecting;
        if (e.isIntersecting) carouselState.lastTime = 0;
      });
    }, { threshold: 0 });
    visObs.observe(carouselWrap);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) carouselState.lastTime = 0;
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

  function safePosition(value) {
    if (typeof value !== 'string') return '';
    var s = value.trim();
    // Accept "X% Y%" with X,Y ∈ 0..100, or keyword combos (center/top/bottom/left/right)
    if (/^(\d{1,3}%|center|left|right|top|bottom)(\s+(\d{1,3}%|center|left|right|top|bottom))?$/.test(s)) return s;
    return '';
  }

  fetch('/content/site.json?v=' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.hero) {
        if (data.hero.image) {
          var hi = document.getElementById('cms-hero-img');
          if (hi) {
            var safeHero = safeURL(data.hero.image);
            if (safeHero) hi.src = safeHero;
          }
        }
        if (data.hero.position_desktop) {
          var pd = safePosition(data.hero.position_desktop);
          if (pd) document.documentElement.style.setProperty('--hero-pos-desktop', pd);
        }
        if (data.hero.position_mobile) {
          var pm = safePosition(data.hero.position_mobile);
          if (pm) document.documentElement.style.setProperty('--hero-pos-mobile', pm);
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