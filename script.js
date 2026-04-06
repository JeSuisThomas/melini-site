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
})();
