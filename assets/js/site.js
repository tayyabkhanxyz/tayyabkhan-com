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
    var btn = document.querySelector('.theme-btn');
    if (btn) {
      btn.textContent = isDark() ? '☀' : '☾';
      btn.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        btn.textContent = next === 'dark' ? '☀' : '☾';
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
        clock.innerHTML = '<b>' + hhmm + ' lhe</b>' + says;
      };
      tick();
      setInterval(tick, 15000);
    }

    /* ---- hand-drawn frames on the video thumbnails ---- */
    document.querySelectorAll('.vid .t').forEach(function (t, i) {
      var d = document.createElement('div');
      // three slightly different rough rectangles; hover cycles them so the line "boils"
      d.innerHTML =
        '<svg class="frame" viewBox="0 0 200 112" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="M4.5 5.2C60 3.4 140 6.3 195.4 4.4c1.6 34 .4 69 .3 103.2C140 109.6 60 106.8 4.6 108.7 3 74 5 39 4.5 5.2Z"/>' +
        '<path d="M5.2 4.3C61 6.2 139 3.5 195 5.6c-1.3 35 1 70 .2 102.4-56-2.2-134 .8-190.4-1.2C6 73 3.8 38 5.2 4.3Z"/>' +
        '<path d="M4.1 5.8C59 4.1 141 7 195.8 3.9c.6 33 -.8 70 .4 103.9-55 1.4-137-1.6-191.6.4C5.4 74 2.9 39 4.1 5.8Z"/>' +
        '</svg>';
      t.appendChild(d.firstChild);
      // stagger each card so a grid of them never boils in unison
      var f = t.querySelector('.frame');
      if (f) f.style.setProperty('--o', (i % 3) * 0.11 + 's');
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
            '<a href="mailto:tayyabkhanfilmz@gmail.com">tayyabkhanfilmz@gmail.com</a>.';
        }).finally(function () { b.disabled = false; });
      });
    }
  });

  try {
    console.log('%cyou opened the console. respect.', 'font:600 13px ui-monospace,monospace');
    console.log('%cbuilt by hand in lahore · tayyabkhanfilmz@gmail.com', 'font:12px ui-monospace,monospace');
  } catch (e) {}
})();
