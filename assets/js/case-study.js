/* case study interactions. Every effect moves one element, never the page,
   and everything degrades to the plain static layout: without JS, or with
   reduced motion on, the chips sit in their column, the type is already
   branded, the clips show their posters and the guide pages just sit there.

   One scroll check drives all of it, reading real element positions.
   IntersectionObserver and requestAnimationFrame both ride the rendering
   cycle, and where that is throttled they simply never fire -- which here
   would have left the clips and guide pages hidden for good. Scroll events
   arrive about once a frame anyway, so nothing is lost by doing it directly. */
(function () {
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var arr = function (q, root) { return Array.prototype.slice.call((root || document).querySelectorAll(q)); };

  document.addEventListener('DOMContentLoaded', function () {
    var jobs = [];

    /* ---- the step pills jump to their step ---- */
    arr('.strip a').forEach(function (a) {
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
      var chips = arr('.chip', room);
      var rings = chips.map(function () {
        var r = document.createElement('span');
        r.className = 'pick';
        room.appendChild(r);
        return r;
      });
      jobs.push(function (vh) {
        var top = room.getBoundingClientRect().top;
        if (top > vh * 1.4 || top < -vh * 1.4) return;
        // the room already sits ~two thirds down the first screen on desktop,
        // so the scrub starts there: on arrival every colour is still a dot on
        // the photo, and the first bit of scrolling starts lifting them out
        var p = clamp((vh * 0.62 - top) / (vh * 0.42));
        var pw = photo.offsetWidth, ph = photo.offsetHeight;
        chips.forEach(function (c, i) {
          var t = ease(clamp((p - i * 0.12) / 0.5));
          var w = c.offsetWidth, h = c.offsetHeight, k = 1 - t;
          var sx = photo.offsetLeft + parseFloat(c.dataset.x) / 100 * pw;
          var sy = photo.offsetTop + parseFloat(c.dataset.y) / 100 * ph;
          var cx = c.offsetLeft + w / 2, cy = c.offsetTop + h / 2;
          // starts as a 22px dot sitting on the colour, ends as the swatch
          var scx = 22 / w + (1 - 22 / w) * t, scy = 22 / h + (1 - 22 / h) * t;
          c.style.transform = 'translate(' + (sx - cx) * k + 'px,' + (sy - cy) * k + 'px) scale(' + scx + ',' + scy + ')';
          c.style.borderRadius = (w / 2 * k) + 'px / ' + (h / 2 * k) + 'px';
          c.style.color = t > 0.75 ? '' : 'transparent';
          var ring = rings[i];
          ring.style.left = sx + 'px';
          ring.style.top = sy + 'px';
          // rings mark all five colours on arrival -- a peony dot on peonies is
          // otherwise invisible -- and fade as each chip lifts away
          ring.style.opacity = t < 0.08 ? 1 : Math.max(0, 1 - (t - 0.08) / 0.4);
        });
      });
    }

    /* ---- 02: each line starts plain and becomes her type as it crosses
       the lower third of the screen -- in both directions ---- */
    var rows = arr('.trow');
    if (calm) {
      rows.forEach(function (r) { r.classList.add('on'); });
    } else if (rows.length) {
      jobs.push(function (vh) {
        rows.forEach(function (r) { r.classList.toggle('on', r.getBoundingClientRect().top < vh * 0.72); });
      });
    }

    /* ---- 03: pieces rise in, load late, and play only while seen ---- */
    var grid = document.querySelector('.pieces');
    if (grid) {
      var pieces = arr('.piece', grid);
      if (!calm) grid.classList.add('armed');
      jobs.push(function (vh) {
        pieces.forEach(function (p, i) {
          var r = p.getBoundingClientRect();
          var v = p.querySelector('video');
          if (!calm && !p.classList.contains('in') && r.top < vh * 0.92) {
            p.style.transitionDelay = (i % 3) * 90 + 'ms';
            p.classList.add('in');
          }
          if (!v) return;
          if (v.dataset.src && r.top < vh + 300) { v.src = v.dataset.src; v.removeAttribute('data-src'); }
          // play while at least a third of it is on screen
          var seen = r.height > 0 && Math.min(r.bottom, vh) - Math.max(r.top, 0) > r.height * 0.35;
          if (seen && !calm && v.paused && v.getAttribute('src')) { var q = v.play(); if (q && q.catch) q.catch(function () {}); }
          else if (!seen && !v.paused) v.pause();
        });
      });
    }

    /* ---- 05: the guide pages deal in, and a mouse can drag the strip ---- */
    var strip = document.querySelector('.pages');
    if (strip) {
      var imgs = arr('img', strip), dealt = false;
      if (!calm) {
        strip.classList.add('armed');
        jobs.push(function (vh) {
          if (dealt || strip.getBoundingClientRect().top > vh * 0.85) return;
          dealt = true;
          imgs.forEach(function (im, i) { im.style.transitionDelay = i * 80 + 'ms'; im.classList.add('in'); });
        });
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

    var run = function () {
      var vh = window.innerHeight;
      for (var i = 0; i < jobs.length; i++) jobs[i](vh);
    };
    window.addEventListener('scroll', run, { passive: true });
    window.addEventListener('resize', run);
    window.addEventListener('load', run);
    run();
  });
})();
