/* Shared layout: top bar + hamburger sidebar (closed until clicked) */
(function () {
  var b = document.body, base = b.dataset.base || '';
  var ico = function (p) {
    return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  };
  var links = [
    ['MENU', 'landing-page.html#menu', '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22v-8h6v8"/>', 1],
    ['ABOUT US', 'landing-page.html#team', '<circle cx="12" cy="12" r="10"/><path d="M12 11v5M12 8h.01"/>', 0],
    ['CASE STUDY INFORMATION', 'landing-page.html#case', '<path d="M2 4h7a3 3 0 013 3v14a2 2 0 00-2-2H2zM22 4h-7a3 3 0 00-3 3v14a2 2 0 012-2h8z"/>', 0]
  ].map(function (l) {
    return '<a class="d-link' + (l[3] ? ' on' : '') + '" href="' + l[1] + '">' + ico(l[2]) + '<span>' + l[0] + '</span></a>';
  }).join('');

  b.insertAdjacentHTML('afterbegin',
    '<header class="topbar"><button class="burger" id="burger" aria-label="Open menu" aria-expanded="false"><i></i><i></i><i></i></button>' +
    '<a class="brand" href="landing-page.html"><img src="' + base + 'images/logo.png" alt=""><span>DSA-CPE</span></a>' +
    '<nav class="top-links"><a href="landing-page.html#case">Case Study Information</a><a href="landing-page.html#team">About us</a><a class="home-btn" href="landing-page.html">HOME</a></nav></header>' +
    '<div class="scrim" id="scrim"></div>' +
    '<aside class="drawer" id="drawer" aria-label="Menu"><button class="d-close" id="dclose" aria-label="Close menu">×</button>' +
    '<img class="d-logo" src="' + base + 'images/logo.png" alt="DSA-CPE"><div class="d-rule"></div><nav class="d-links">' + links + '</nav>' +
    '<div class="d-foot"><div class="d-rule"></div>DSA-CPE @2026</div></aside>');

  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer'), scrim = document.getElementById('scrim');
  function set(open) {
    drawer.classList.toggle('open', open); scrim.classList.toggle('on', open);
    burger.setAttribute('aria-expanded', open); if (open) document.getElementById('dclose').focus(); else burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { set(true); });
  document.getElementById('dclose').addEventListener('click', function () { set(false); });
  scrim.addEventListener('click', function () { set(false); });
  drawer.addEventListener('click', function (e) { if (e.target.closest('.d-link')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });

  /* Input state: red outline while the output box shows an error, cleared on typing */
  var out = document.getElementById('out');
  if (out && window.MutationObserver) {
    new MutationObserver(function () {
      var f = document.querySelector('#ctl .field');
      if (f) f.setAttribute('aria-invalid', !out.hidden && out.classList.contains('err') ? 'true' : 'false');
    }).observe(out, { attributes: true, attributeFilter: ['class', 'hidden'] });
  }
  document.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('field')) e.target.removeAttribute('aria-invalid');
  });
})();

/*  Polish: sticky-bar state, scroll-spy, reveal-on-scroll  */
(function () {
  var bar = document.querySelector('.topbar');
  function onScroll() {
    bar.classList.toggle('scrolled', window.scrollY > 24);
    if (window.scrollY < 200) [].forEach.call(document.querySelectorAll('.top-links a.active'), function (a) { a.classList.remove('active'); });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* highlight the top-bar link of the section being viewed (landing page only) */
  var links = [].slice.call(document.querySelectorAll('.top-links a:not(.home-btn)'));
  var map = links.map(function (a) { var h = a.getAttribute('href').split('#')[1]; return { a: a, el: h && document.getElementById(h) }; }).filter(function (m) { return m.el; });
  if (map.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) map.forEach(function (m) { m.a.classList.toggle('active', m.el === e.target); }); });
    }, { rootMargin: '-35% 0px -55% 0px' });
    map.forEach(function (m) { spy.observe(m.el); });
  }

  /* gentle fade-up as sections scroll into view (classes are removed afterwards so hover effects stay snappy) */
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target); e.target.classList.add('in');
      setTimeout(function () { e.target.classList.remove('reveal', 'in'); e.target.style.removeProperty('--d'); }, 1000 + 0);
    });
  }, { threshold: .12 });
  [].forEach.call(document.querySelectorAll('.pill-bar,.mcard,.sec-head,.case-box,.member,.module-bar,.info-row,.stage-wrap,.panel'), function (el, i) {
    var sib = [].indexOf.call(el.parentNode.children, el);
    el.style.setProperty('--d', Math.min(sib, 5) * 70 + 'ms'); el.classList.add('reveal'); io.observe(el);
  });
})();
