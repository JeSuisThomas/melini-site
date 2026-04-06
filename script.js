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

  function toggleMenu() { mobileMenu.classList.toggle('open'); }
  function closeMenu() { mobileMenu.classList.remove('open'); }

  hamburger.addEventListener('click', toggleMenu);
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
      if (data.hero && data.hero.image) {
        var heroImg = document.getElementById('cms-hero-img');
        if (heroImg) heroImg.src = data.hero.image;
      }
      if (data.bandeau && data.bandeau.texte) {
        var bandeau = document.getElementById('cms-bandeau');
        if (bandeau) bandeau.textContent = data.bandeau.texte;
      }
      if (data.histoire && data.histoire.image) {
        var histImg = document.getElementById('cms-histoire-img');
        if (histImg) histImg.src = data.histoire.image;
      }
      if (data.horaires) {
        var hL = document.getElementById('cms-h-lundi');
        var hM = document.getElementById('cms-h-mardi');
        var hD = document.getElementById('cms-h-dimanche');
        if (hL && data.horaires.lundi) hL.textContent = data.horaires.lundi;
        if (hM && data.horaires.mardi_samedi) hM.textContent = data.horaires.mardi_samedi;
        if (hD && data.horaires.dimanche) hD.textContent = data.horaires.dimanche;
      }
      if (data.collection && data.collection.photos && data.collection.photos.length > 0) {
        var carouselEl = document.getElementById('cms-carousel');
        if (carouselEl) {
          var html = '';
          data.collection.photos.forEach(function (p) {
            html += '<div class="carousel-item"><div class="carousel-img"><img src="' + p.image + '" alt="' + (p.alt || '') + '"></div></div>';
          });
          html += html;
          carouselEl.innerHTML = html;
        }
      }
    })
    .catch(function () {});
})();
