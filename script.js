/* ═══════════════════════════════════════════
   MELINI — Script
   Nav, scroll reveals, mobile menu
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── NAV SCROLL ─── */
  var nav = document.getElementById('nav');
  var lastScroll = 0;

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 60);
    lastScroll = y;
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
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
  // Escape closes the menu
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });

  /* ─── SCROLL REVEAL (IntersectionObserver) ─── */
  var reveals = document.querySelectorAll('.reveal');
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach(function (el) { observer.observe(el); });

  /* ─── CAROUSEL ───
     - Pause au hover (desktop seulement)
     - Skeleton loader → fade-in à la fin du chargement de chaque image */
  var carousel = document.querySelector('.carousel');
  if (carousel && window.matchMedia('(hover: hover)').matches) {
    carousel.addEventListener('mouseenter', function () {
      carousel.classList.add('paused');
    });
    carousel.addEventListener('mouseleave', function () {
      carousel.classList.remove('paused');
    });
  }

  function bindImageFade(img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', function () { img.classList.add('loaded'); }, { once: true });
      img.addEventListener('error', function () { img.classList.add('loaded'); }, { once: true });
    }
  }
  document.querySelectorAll('.carousel-img img').forEach(bindImageFade);

  var heroImg = document.getElementById('cms-hero-img');
  if (heroImg) bindImageFade(heroImg);

  var histImg = document.getElementById('cms-histoire-img');
  if (histImg) bindImageFade(histImg);

  /* ─── CMS CONTENT LOADER ─── */
  function safeURL(value) {
    if (typeof value !== 'string') return '';
    var s = value.trim();
    // Allow only http(s) absolute URLs and root-relative paths
    if (/^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === '/' && s.charAt(1) !== '/') return s;
    return '';
  }

  fetch('/content/site.json?v=' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.hero && data.hero.image) {
        var heroImg = document.getElementById('cms-hero-img');
        if (heroImg) {
          var safeHero = safeURL(data.hero.image);
          if (safeHero) heroImg.src = safeHero;
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
        var histImg = document.getElementById('cms-histoire-img');
        if (histImg) {
          var safeHist = safeURL(data.histoire.image);
          if (safeHist) histImg.src = safeHist;
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
        var carouselEl = document.getElementById('cms-carousel');
        if (carouselEl) {
          // Build DOM safely (no innerHTML with user data)
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
          // Original items
          data.collection.photos.forEach(function (p) {
            var el = makeItem(p);
            if (el) frag.appendChild(el);
          });
          // Duplicate for infinite scroll
          data.collection.photos.forEach(function (p) {
            var el = makeItem(p);
            if (el) frag.appendChild(el);
          });
          carouselEl.innerHTML = '';
          carouselEl.appendChild(frag);
        }
      }
    })
    .catch(function () {});
})();
