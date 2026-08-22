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
      // read the fade length from CSS so the two never drift apart
      var fadeMs = parseFloat(getComputedStyle(root).getPropertyValue('--fade')) || 900;
      var settle;

      tog.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';

        // only transition while the theme is actually changing
        root.classList.add('theming');
        clearTimeout(settle);
        settle = setTimeout(function () { root.classList.remove('theming'); }, fadeMs + 80);

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
      // EDIT: Tayyab's real date of birth. Local time, month is 0-indexed.
      var BORN = new Date(2006, 0, 1, 0, 0, 0);

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
