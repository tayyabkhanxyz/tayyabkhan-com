/* case study interactions. Every effect here moves one element, never the
   page, and everything degrades to the plain static layout: without JS, or
   with reduced motion on, the chips sit in their column, the type is already
   branded, and the clips simply show their posters. */
(function () {
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  document.addEventListener('DOMContentLoaded', function () {

    /* ---- the step pills jump to their step ---- */
    document.querySelectorAll('.strip a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.querySelector(a.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
      });
    });

    /* ---- 01: each colour is picked out of the photo as you scroll ----
       scrubbed, not triggered: scroll back up and the chips return to the
       spot in the room they came from. */
    var room = document.querySelector('.room');
    if (room && !calm) {
      var photo = room.querySelector('.photo');
      var chips = Array.prototype.slice.call(room.querySelectorAll('.chip'));
      var rings = chips.map(function (c) {
        var r = document.createElement('span');
        r.className = 'pick';
        room.appendChild(r);
        return r;
      });
      var painting = false, near = false;

      var paint = function () {
        painting = false;
        var vh = window.innerHeight;
        var top = room.getBoundingClientRect().top;
        // 0 when the room's top is low on screen, 1 once it has risen to ~30%
        var p = clamp((vh * 0.88 - top) / (vh * 0.58));
        var pw = photo.offsetWidth, ph = photo.offsetHeight;
        chips.forEach(function (c, i) {
          var t = ease(clamp((p - i * 0.12) / 0.5));
          var w = c.offsetWidth, h = c.offsetHeight;
          var sx = photo.offsetLeft + parseFloat(c.dataset.x) / 100 * pw;
          var sy = photo.offsetTop + parseFloat(c.dataset.y) / 100 * ph;
          var cx = c.offsetLeft + w / 2, cy = c.offsetTop + h / 2;
          var k = 1 - t;
          // starts as a 22px dot sitting on the colour, ends as the swatch
          var scx = 22 / w + (1 - 22 / w) * t, scy = 22 / h + (1 - 22 / h) * t;
          c.style.transform = 'translate(' + (sx - cx) * k + 'px,' + (sy - cy) * k + 'px) scale(' + scx + ',' + scy + ')';
          c.style.borderRadius = (w / 2 * k) + 'px / ' + (h / 2 * k) + 'px';
          c.style.color = t > 0.75 ? '' : 'transparent';
          var ring = rings[i];
          ring.style.left = sx + 'px';
          ring.style.top = sy + 'px';
          ring.style.opacity = t <= 0 ? 0 : t < 0.08 ? t / 0.08 : Math.max(0, 1 - (t - 0.08) / 0.4);
        });
      };
      var ask = function () { if (near && !painting) { painting = true; requestAnimationFrame(paint); } };
      new IntersectionObserver(function (es) {
        near = es[0].isIntersecting;
        ask();
      }, { rootMargin: '25% 0px 25% 0px' }).observe(room);
      window.addEventListener('scroll', ask, { passive: true });
      window.addEventListener('resize', function () { painting = false; paint(); });
      paint();
    }

    /* ---- 02: each line starts plain and becomes her type as it crosses
       the lower third of the screen -- in both directions ---- */
    var rows = Array.prototype.slice.call(document.querySelectorAll('.trow'));
    if (rows.length) {
      if (calm) {
        rows.forEach(function (r) { r.classList.add('on'); });
      } else {
        var tick = false;
        var flip = function () {
          tick = false;
          var line = window.innerHeight * 0.72;
          rows.forEach(function (r) { r.classList.toggle('on', r.getBoundingClientRect().top < line); });
        };
        window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(flip); } }, { passive: true });
        window.addEventListener('resize', flip);
        flip();
      }
    }

    /* ---- 03: pieces rise in, load late, and play only while seen ---- */
    var grid = document.querySelector('.pieces');
    if (grid) {
      var pieces = Array.prototype.slice.call(grid.querySelectorAll('.piece'));
      if (!calm) {
        grid.classList.add('armed');
        var rise = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            var i = pieces.indexOf(e.target);
            e.target.style.transitionDelay = (i % 3) * 90 + 'ms';
            e.target.classList.add('in');
            rise.unobserve(e.target);
          });
        }, { threshold: 0.15 });
        pieces.forEach(function (p) { rise.observe(p); });
      }
      var load = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var v = e.target;
          if (v.dataset.src) { v.src = v.dataset.src; v.removeAttribute('data-src'); }
          load.unobserve(v);
        });
      }, { rootMargin: '300px 0px' });
      var play = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting && !calm) {
            var p = v.play(); if (p && p.catch) p.catch(function () {});
          } else {
            v.pause();
          }
        });
      }, { threshold: 0.35 });
      grid.querySelectorAll('video').forEach(function (v) { load.observe(v); play.observe(v); });
    }

    /* ---- 05: the guide pages deal in, and a mouse can drag the strip ---- */
    var strip = document.querySelector('.pages');
    if (strip) {
      var imgs = Array.prototype.slice.call(strip.querySelectorAll('img'));
      if (!calm) {
        strip.classList.add('armed');
        new IntersectionObserver(function (es, o) {
          if (!es[0].isIntersecting) return;
          imgs.forEach(function (im, i) { im.style.transitionDelay = i * 80 + 'ms'; im.classList.add('in'); });
          o.disconnect();
        }, { threshold: 0.2 }).observe(strip);
      }
      var down = false, sx0 = 0, sl0 = 0, moved = false;
      strip.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;      // touch already scrolls natively
        down = true; moved = false; sx0 = e.clientX; sl0 = strip.scrollLeft;
        strip.classList.add('dragging');
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - sx0;
        if (Math.abs(dx) > 3) moved = true;
        strip.scrollLeft = sl0 - dx;
      });
      window.addEventListener('pointerup', function () {
        if (!down) return;
        down = false;
        strip.classList.remove('dragging');
      });
      strip.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    }
  });
})();
