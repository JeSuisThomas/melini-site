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

  function openMenu() { mobileMenu.classList.add('open'); }
  function closeMenu() { mobileMenu.classList.remove('open'); }

  hamburger.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
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

  /* ─── CAROUSEL PAUSE/RESUME ─── */
  var carousel = document.querySelector('.carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', function () {
      carousel.classList.add('paused');
    });
    carousel.addEventListener('mouseleave', function () {
      carousel.classList.remove('paused');
    });
  }

  /* ─── CMS CONTENT LOADER ─── */
  fetch('/content/site.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      // Hero
      if (data.hero) {
        var heroImg = document.getElementById('cms-hero-img');
        if (heroImg && data.hero.image) heroImg.src = data.hero.image;
      }

      // Bandeau
      if (data.bandeau && data.bandeau.texte) {
        var bandeau = document.getElementById('cms-bandeau');
        if (bandeau) bandeau.textContent = data.bandeau.texte;
      }

      // Notre histoire image
      if (data.histoire && data.histoire.image) {
        var histImg = document.getElementById('cms-histoire-img');
        if (histImg) histImg.src = data.histoire.image;
      }

      // Horaires
      if (data.horaires) {
        var hLundi = document.getElementById('cms-h-lundi');
        var hMardi = document.getElementById('cms-h-mardi');
        var hDim = document.getElementById('cms-h-dimanche');
        if (hLundi && data.horaires.lundi) hLundi.textContent = data.horaires.lundi;
        if (hMardi && data.horaires.mardi_samedi) hMardi.textContent = data.horaires.mardi_samedi;
        if (hDim && data.horaires.dimanche) hDim.textContent = data.horaires.dimanche;
      }

      // Collection carousel
      if (data.collection && data.collection.photos && data.collection.photos.length > 0) {
        var carouselEl = document.getElementById('cms-carousel');
        if (carouselEl) {
          var html = '';
          data.collection.photos.forEach(function (p) {
            html += '<div class="carousel-item"><div class="carousel-img"><img src="' + p.image + '" alt="' + (p.alt || '') + '"></div></div>';
          });
          // Duplicate for infinite loop
          html += html;
          carouselEl.innerHTML = html;
        }
      }
    })
    .catch(function () { /* Silently use fallback HTML content */ });
})();
