/* tayyabkhan.com */
(function () {
  'use strict';

  var root = document.documentElement;
  try { var saved = localStorage.getItem('theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}

  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches;
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ---- theme ---- */
    var tog = document.querySelector('.tog');
    if (tog) {
      var paint = function () { tog.setAttribute('aria-pressed', isDark() ? 'true' : 'false'); };
      paint();
      tog.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        paint();
      });
    }

    /* ---- lahore, in the corner ---- */
    var clock = document.getElementById('clock');
    if (clock) {
      var tick = function () {
        var now = new Date();
        var lhr = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5 * 3600000);
        var h = lhr.getHours();
        var hhmm = String(h).padStart(2, '0') + ':' + String(lhr.getMinutes()).padStart(2, '0');
        var says =
          h < 5  ? 'should be asleep' :
          h < 9  ? 'slow morning' :
          h < 12 ? 'first coffee' :
          h < 17 ? 'mid-timeline' :
          h < 20 ? 'golden hour' :
          h < 23 ? 'actually working now' :
                   'third coffee, bad idea';
        clock.innerHTML = '<b><i class="dot"></i>' + hhmm + ' LHE</b>' + says;
      };
      tick();
      setInterval(tick, 15000);
    }

    /* ---- live subscriber count ---- */
    var subs = document.getElementById('subs');
    if (subs) {
      var n = subs.querySelector('.num');
      // full count, grouped -- no K/M abbreviation
      var fmt = function (v) { return Number(v).toLocaleString('en-US'); };
      var pull = function () {
        fetch('/api/subscribers')
          .then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (d) {
            if (!d || d.subscribers == null) throw 0;
            n.textContent = fmt(d.subscribers);
            subs.setAttribute('data-live', 'true');
          })
          .catch(function () { subs.setAttribute('data-live', 'false'); });
      };
      pull();
      setInterval(pull, 60000);
    }

    /* ---- how old he is, to the second ---- */
    var ageEl = document.getElementById('age');
    if (ageEl) {
      // 9 August 2006. Local time; month is 0-indexed. Time of day unknown,
      // so the clock counts from midnight.
      var BORN = new Date(2006, 7, 9, 0, 0, 0);

      var plural = function (n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); };

      var tickAge = function () {
        var now = new Date();

        // walk the calendar so months and days are real, not averaged
        var y = now.getFullYear() - BORN.getFullYear();
        var mo = now.getMonth() - BORN.getMonth();
        var d = now.getDate() - BORN.getDate();
        var h = now.getHours() - BORN.getHours();
        var mi = now.getMinutes() - BORN.getMinutes();
        var sec = now.getSeconds() - BORN.getSeconds();

        if (sec < 0) { sec += 60; mi--; }
        if (mi < 0) { mi += 60; h--; }
        if (h < 0) { h += 24; d--; }
        if (d < 0) {
          // borrow the length of the month that just ended
          var prev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
          d += prev; mo--;
        }
        if (mo < 0) { mo += 12; y--; }

        ageEl.textContent =
          plural(y, 'year') + ', ' + plural(mo, 'month') + ', ' + plural(d, 'day') + ', ' +
          plural(h, 'hour') + ', ' + plural(mi, 'minute') + ' and ' + plural(sec, 'second') + ' old';
      };

      tickAge();
      setInterval(tickAge, 1000);
    }

    /* ---- client reviews ----
       Native controls give Safari's picture-in-picture and fullscreen buttons,
       and fullscreen letterboxes a 9:16 clip badly. So the player is built
       here instead, and the captions are parsed and rendered into the quote
       slot rather than burned over the speaker's face. */
    var esc = function (t) {
      return t.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
    };

    // one line of transcript, every word wrapped so it can light up on cue.
    // whole words arrive from the data now, punctuation included.
    var buildLine = function (line) {
      return line.w.map(function (word, i) {
        var w = word.w;
        var num = /\d/.test(w) ? ' num' : '';
        return (i ? ' ' : '') + '<w class="' + num.trim() + '" data-t="' + word.t + '">' + esc(w) + '</w>';
      }).join('');
    };

    // renamed from `clock`: it shared a function scope with the header
    // clock element above, and overwrote it -- which froze the clock.
    var fmtTime = function (n) {
      if (!isFinite(n)) return '0:00';
      var m = Math.floor(n / 60), s = Math.floor(n % 60);
      return m + ':' + String(s).padStart(2, '0');
    };

    var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
    var PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>';

    document.querySelectorAll('.player').forEach(function (box) {
      var card = box.closest('.rev');
      var live = card && card.querySelector('.live');

      box.addEventListener('click', function (e) {
        var v = box.querySelector('video');

        if (!v) {
          v = document.createElement('video');
          v.src = box.dataset.src;
          v.playsInline = true;
          v.preload = 'metadata';
          v.disablePictureInPicture = true;
          v.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');

          // stop anything else that is already running
          document.querySelectorAll('.player video').forEach(function (o) { o.pause(); });
          document.querySelectorAll('.rev').forEach(function (r) { r.classList.remove('playing'); });

          box.innerHTML = '';
          box.appendChild(v);

          var ctl = document.createElement('div');
          ctl.className = 'vctl';
          ctl.innerHTML = '<button class="pp" type="button" aria-label="Pause">' + PAUSE +
                          '</button><div class="bar"><i></i></div><span class="vtime">0:00</span>';
          box.appendChild(ctl);

          var fill = ctl.querySelector('.bar i');
          var bar = ctl.querySelector('.bar');
          var pp = ctl.querySelector('.pp');
          var time = ctl.querySelector('.vtime');

          ctl.addEventListener('click', function (ev) { ev.stopPropagation(); });
          pp.addEventListener('click', function () { v.paused ? v.play() : v.pause(); });
          bar.addEventListener('click', function (ev) {
            var r = bar.getBoundingClientRect();
            if (v.duration) v.currentTime = ((ev.clientX - r.left) / r.width) * v.duration;
          });

          v.addEventListener('play', function () {
            pp.innerHTML = PAUSE; pp.setAttribute('aria-label', 'Pause');
            box.classList.remove('paused'); if (card) card.classList.add('playing');
          });
          v.addEventListener('pause', function () {
            pp.innerHTML = PLAY; pp.setAttribute('aria-label', 'Play');
            box.classList.add('paused');
          });
          v.addEventListener('ended', function () {
            stopLoop();
            if (card) card.classList.remove('playing');
            if (live) live.innerHTML = '';
          });

          var cues = [];
          if (box.dataset.words) {
            fetch(box.dataset.words).then(function (r) { return r.ok ? r.json() : []; })
              .then(function (d) { cues = d || []; }).catch(function () {});
          }

          var shown = -1;
          var raf = null;
          // timeupdate only fires about 4x a second, so a word could land up to
          // ~260ms late. Drive it from the frame loop instead.
          var LEAD = 0.05;   // seconds of head start, covers render + paint

          var paint = function () {
            if (v.duration) {
              fill.style.width = (v.currentTime / v.duration) * 100 + '%';
              time.textContent = fmtTime(v.currentTime);
            }
            if (live && cues.length) {
              var at = v.currentTime + LEAD;
              var i = cues.findIndex(function (c) { return at >= c.a && at < c.b; });
              if (i < 0 && shown >= 0 && at > cues[shown].b) i = shown;   // hold the last line
              if (i !== shown) {
                shown = i;
                live.innerHTML = i < 0 ? '' : buildLine(cues[i]);
              }
              if (i >= 0) {
                live.querySelectorAll('w').forEach(function (el) {
                  var said = at >= parseFloat(el.dataset.t);
                  if (said !== el.classList.contains('said')) el.classList.toggle('said', said);
                });
              }
            }
            if (!v.paused && !v.ended) raf = requestAnimationFrame(paint);
            else { clearInterval(tick); tick = null; }
          };

          // rAF is smooth but stops dead whenever the document is hidden, and a
          // frozen caption is worse than a late one. A timer runs alongside it
          // as a floor; paint() is idempotent so running twice costs nothing.
          var tick = null;
          var startLoop = function () {
            cancelAnimationFrame(raf); raf = requestAnimationFrame(paint);
            clearInterval(tick); tick = setInterval(paint, 50);
          };
          var stopLoop = function () {
            cancelAnimationFrame(raf); clearInterval(tick); tick = null; paint();
          };

          v.addEventListener('play', startLoop);
          v.addEventListener('pause', stopLoop);
          v.addEventListener('seeked', paint);
          v.addEventListener('timeupdate', function () { if (v.paused) paint(); });

          v.play();
          return;
        }

        v.paused ? v.play() : v.pause();
      });
    });

    /* ---- photography lightbox ---- */
    var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
    if (shots.length) {
      var lb = document.createElement('div');
      lb.id = 'lb';
      lb.innerHTML = '<button class="ctl x" aria-label="close">close</button>' +
                     '<button class="ctl p" aria-label="previous">‹</button><img alt="">' +
                     '<button class="ctl n" aria-label="next">›</button>';
      document.body.appendChild(lb);
      var lbImg = lb.querySelector('img'), at = 0;
      function show(i) {
        at = (i + shots.length) % shots.length;
        lbImg.src = shots[at].getAttribute('data-full');
        lb.classList.add('on');
        document.body.style.overflow = 'hidden';
      }
      function hide() { lb.classList.remove('on'); document.body.style.overflow = ''; }
      shots.forEach(function (s, i) { s.addEventListener('click', function (e) { e.preventDefault(); show(i); }); });
      lb.querySelector('.x').addEventListener('click', hide);
      lb.querySelector('.p').addEventListener('click', function (e) { e.stopPropagation(); show(at - 1); });
      lb.querySelector('.n').addEventListener('click', function (e) { e.stopPropagation(); show(at + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) hide(); });
      document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('on')) return;
        if (e.key === 'Escape') hide();
        if (e.key === 'ArrowRight') show(at + 1);
        if (e.key === 'ArrowLeft') show(at - 1);
      });
    }

    /* ---- contact form ---- */
    var form = document.getElementById('contact');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = form.querySelector('.form-msg'), b = form.querySelector('.submit');
        b.disabled = true; msg.textContent = 'sending…';
        fetch('/api/contact', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        }).then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          msg.textContent = 'got it. i’ll reply in a couple of days — sooner if the coffee works.';
        }).catch(function () {
          msg.innerHTML = 'the form isn’t wired up yet — email me at ' +
            '<a href="mailto:tayyabkhanwork@gmail.com">tayyabkhanwork@gmail.com</a>.';
        }).finally(function () { b.disabled = false; });
      });
    }
  });

  try {
    console.log('%cyou opened the console. respect.', 'font:600 13px ui-monospace,monospace');
    console.log('%cbuilt by hand in lahore · tayyabkhanwork@gmail.com', 'font:12px ui-monospace,monospace');
  } catch (e) {}
})();

/* ---- the /about square ----
   it is decorative and silent, so it autoplays. but a looping face is
   exactly the kind of motion the reduced-motion setting exists for --
   for those visitors it holds on the poster frame and reads as a photo,
   which is what it was meant to look like anyway. */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var v = document.querySelector('.me-vid');
    if (!v) return;
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (calm && calm.matches) { v.removeAttribute('autoplay'); v.pause(); return; }
    // autoplay is refused while the document is hidden -- so a visitor who
    // opens the link in a background tab would otherwise find a frozen frame
    // waiting for them. retry whenever the page can actually be seen.
    var nudge = function () {
      if (!v.paused || document.hidden) return;
      var t = v.play();
      if (t && t.catch) t.catch(function () {});
    };
    v.addEventListener('canplay', nudge);
    document.addEventListener('visibilitychange', nudge);
    window.addEventListener('pageshow', nudge);
  });
})();
