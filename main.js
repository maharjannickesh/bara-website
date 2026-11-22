(function () {
  'use strict';

  // Mobile menu
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
  });

  // Scroll engine. Everything below reads scroll position and writes transforms.
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var parallax = document.querySelectorAll('[data-px]');
  var reveals = document.querySelectorAll('[data-reveal]');
  var stages = document.querySelectorAll('[data-stage]');
  var marquees = document.querySelectorAll('[data-marquee]');
  if (!parallax.length && !reveals.length && !stages.length && !marquees.length) return;

  function frameAt(k, p) {
    if (p >= k[k.length - 1][0]) return k[k.length - 1];
    if (p <= k[0][0]) return k[0];
    for (var i = 0; i < k.length - 1; i++) {
      if (p >= k[i][0] && p <= k[i + 1][0]) {
        var a = k[i], b = k[i + 1];
        var t = ease((p - a[0]) / ((b[0] - a[0]) || 1));
        var len = Math.max(a.length, b.length), out = [];
        for (var j = 0; j < len; j++) {
          var from = a[j] || 0, to = b[j] || 0;
          out.push(from + (to - from) * t);
        }
        return out;
      }
    }
    return k[0];
  }

  function drawStage(sec, vh, still) {
    var r = sec.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) return;
    var inner = sec.querySelector('[data-stage-inner]');
    var W = inner.clientWidth, H = inner.clientHeight;
    var p = clamp(-r.top / (r.height - vh));
    sec.querySelectorAll('[data-kf]').forEach(function (el) {
      var k = el._kf || (el._kf = JSON.parse(el.dataset.kf));
      var v = frameAt(k, p);
      var x = v[1], y = v[2], s = v[3], rx = v[4], ry = v[5], rz = v[6], o = v[7], xp = v[8] || 0;
      if (el.hasAttribute('data-flip')) {
        // Swap faces by hand: browsers mirror the back face when they flatten 3D.
        var a = ((ry % 360) + 360) % 360, back = a > 90 && a < 270;
        if (back) ry -= 180;
        el.querySelector('[data-face=front]').style.opacity = back ? 0 : 1;
        el.querySelector('[data-face=back]').style.opacity = back ? 1 : 0;
      }
      var base = el.dataset.kfBase === 't' ? 'translate(-50%,0)' : 'translate(-50%,-50%)';
      el.style.transform = base +
        ' translate3d(' + (x * W + xp * el.offsetWidth * s).toFixed(1) + 'px,' + (y * H).toFixed(1) + 'px,0)' +
        (still ? '' : ' rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg)') +
        ' scale(' + s.toFixed(3) + ')';
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    });
  }

  var ticking = false;
  function tick() {
    ticking = false;
    var vh = window.innerHeight, still = reduce.matches;
    parallax.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      var off = (r.top + r.height / 2) - vh / 2;
      el.style.transform = still ? '' :
        'translate3d(' + (off * parseFloat(el.dataset.pxx || 0)).toFixed(1) + 'px,' +
        (off * -parseFloat(el.dataset.px)).toFixed(1) + 'px,0) rotate(' +
        (off * parseFloat(el.dataset.rot || 0)).toFixed(2) + 'deg)';
    });
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = still ? 1 : clamp((vh * 0.8 - r.top) / (r.height + vh * 0.25));
      var ws = el.querySelectorAll('[data-word]');
      ws.forEach(function (w, i) { w.style.opacity = (i / ws.length) < p ? 1 : 0.16; });
    });
    stages.forEach(function (sec) { drawStage(sec, vh, still); });
    marquees.forEach(function (el) {
      var r = el.getBoundingClientRect();
      el.style.transform = still ? '' :
        'translate3d(' + ((r.top - vh) * 0.5 * parseFloat(el.dataset.marquee)).toFixed(1) + 'px,0,0)';
    });
  }
  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  reduce.addEventListener('change', request);
  tick();
})();
