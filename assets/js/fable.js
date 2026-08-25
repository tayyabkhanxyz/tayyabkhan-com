/* the hare and the tortoise on the footer rule -- homepage only. */
/* pixel sprites, authored as ascii maps so the art stays editable.
   '#' is a filled pixel. every sprite renders to an <svg> of square rects
   at PIXEL css px each, filled with currentColor -- so they flip with the
   theme and stay crisp at any zoom. */
window.SPRITES = (function () {
  var PIXEL = 2;

  var maps = {
    // ---- tortoise, two-frame plod (facing right).
    //      the gaps inside the dome are shell segments -- without them it
    //      renders as a featureless blob at this size.
    tortoiseA: [
      '...#####.....',
      '..#######....',
      '.#########...',
      '.#.##.##.#...',
      '.#########...',
      '.########.###',
      '.##...##.....'
    ],
    tortoiseB: [
      '...#####.....',
      '..#######....',
      '.#########...',
      '.#.##.##.#...',
      '.#########...',
      '.########.###',
      '..##.##......'
    ],
    // ---- hare sitting upright, asleep. ears stay UP so it still reads
    //      as a rabbit; the sleeping is carried by the z's, not by the pose.
    hareSit: [
      '.#...#.',
      '.#...#.',
      '.##.##.',
      '.#####.',
      '#######',
      '#######',
      '.#####.'
    ],
    // ---- hare running, two frames (facing right) ----
    hareRunA: [
      '......#..#',
      '.....##.##',
      '......####',
      '.#########',
      '.########.',
      '#..##..##.'
    ],
    hareRunB: [
      '......#..#',
      '.....##.##',
      '......####',
      '.#########',
      '.########.',
      '.##..##...'
    ],
    // ---- hare mid-punch, turned to face back down the track. the fist
    //      is a detached block so it still reads as a punch at 2px pixels.
    harePunch: [
      '...#...#.',
      '...#...#.',
      '...##.##.',
      '....###..',
      '##.######',
      '...######',
      '...######',
      '....####.'
    ],
    // ---- tortoise mid-kick: same silhouette, still facing the flag,
    //      one hind leg thrown out behind it.
    tortoiseKick: [
      '....#####....',
      '...#######...',
      '..#########..',
      '..#.##.##.#..',
      '..#########..',
      '##.#######.##',
      '..##...##....'
    ],
    // ---- hare awake and upright, having just worked out what happened ----
    hareAlert: [
      '.#...#.',
      '.#...#.',
      '.##.##.',
      '..###..',
      '.#####.',
      '#######',
      '#######',
      '.#.#.#.'
    ],
    // ---- the tortoise rears up and settles this properly.
    //      facing LEFT. taller than the walking sprite on purpose: it is
    //      meant to be a moment, and the extra height sells standing up.
    tortoiseStand: [
      '....###.....',
      '...#####....',
      '....###.....',
      '.....##.....',
      '....######..',
      '...###.####.',
      '...###.####.',
      '...###.####.',
      '....######..',
      '.....#..#...',
      '....##..##..'
    ],
    tortoisePunch: [
      '....###.....',
      '...#####....',
      '....###.....',
      '.....##.....',
      '....######..',
      '...###.####.',
      '##.###.####.',
      '############',
      '##.###.####.',
      '....######..',
      '.....#..#...',
      '....##..##..'
    ],
    // ---- flags: plain pennant to start, chequered to finish ----
    flagStart: [
      '#####...',
      '#######.',
      '#####...',
      '#.......',
      '#.......',
      '#.......',
      '#.......',
      '#.......'
    ],
    flagEnd: [
      '#.##.##.',
      '#.##.##.',
      '#####.##',
      '#.##.##.',
      '#.......',
      '#.......',
      '#.......',
      '#.......'
    ],
    zed: [
      '###',
      '..#',
      '.#.',
      '###'
    ]
  };

  function render(name, pixel, flip) {
    var m = maps[name], p = pixel || PIXEL;
    if (flip) m = m.map(function (row) { return row.split('').reverse().join(''); });
    var w = m[0].length, h = m.length, out = '';
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < m[y].length; x++) {
        if (m[y][x] === '.') continue;
        out += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
    }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + (w * p) + '" height="' + (h * p) +
           '" shape-rendering="crispEdges" fill="currentColor">' + out + '</svg>';
  }

  return { maps: maps, render: render, PIXEL: PIXEL };
})();

/* the hare and the tortoise, on the footer rule.
   the tortoise never stops. the hare sleeps, wakes when overtaken, hops
   ahead, sleeps again -- until the finish, where it oversleeps once too
   often and the tortoise settles it with a glove. */
(function () {
  var S = window.SPRITES;

  document.addEventListener('DOMContentLoaded', function () {
    var box = document.querySelector('.fable');
    if (!box) return;

    var tort = box.querySelector('.tortoise');
    var hare = box.querySelector('.hare');
    var zzz  = box.querySelector('.zzz');
    box.querySelector('.flag-start').innerHTML = S.render('flagStart');
    box.querySelector('.flag-end').innerHTML   = S.render('flagEnd');
    zzz.innerHTML = S.render('zed', 2) + S.render('zed', 2) + S.render('zed', 2);

    var TORT = 1.90, HARE = 15;  // percent of track per second -- a 60s lap
    var HARE_CAP = 86;           // the hare settles here and sleeps through it
    var LEAD     = 5;            // how far past it the tortoise gets first
    // where the tortoise stops is derived from the flag's real position, not
    // a fixed percentage -- the track is narrower on a phone, so a constant
    // would either leave it short of the line or shove it off the page.
    function finishT() {
      var pole = box.clientWidth - 40 - 16;   // finish flag's left edge
      return (pole + 22 - 18) / span() * 100; // fully clear of the flag
    }

    // the whole confrontation, in order. each beat holds for its own ms.
    var BEATS = {
      wake:  520,   // the hare works out what has happened
      turn:  260,   // tortoise comes about
      rear:  320,   // up onto two legs
      punch: 220,   // glove out
      fly:   820,   // hare leaves the premises
      drop:  280,   // back down onto four
      about: 240    // and turns to face the flag again
    };

    var t, h, mode, awake, wakeUntil, phaseAt, flyFrom, frameT, frameH, lastStep;

    function reset() {
      t = 0; h = 42; mode = 'race'; awake = false;
      wakeUntil = 0; phaseAt = 0; flyFrom = 0;
      frameT = 0; frameH = 0; lastStep = 0;
      // .pin carries a .3s opacity transition, so clearing the inline value
      // would fade the hare in while the tortoise snaps back -- and the z's
      // would be hanging over an empty track for those frames. suppress the
      // transition for one frame so the whole scene resets together.
      hare.style.transition = 'none';
      hare.style.opacity = ''; hare.style.transform = '';
      void hare.offsetWidth;
      hare.style.transition = '';
      var s = hare.querySelector('svg'); if (s) s.style.transform = '';
    }
    reset();

    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var still = calm && calm.matches;

    // the flags sit at the very edges (left:0 / right:0), each 16px wide.
    // 100% is defined as the tortoise's left edge reaching the finish pole,
    // so it can then walk PAST it rather than stopping short of the flag.
    function span() {
      // start flag hugs the left edge; the finish flag is inset 40px so the
      // tortoise has somewhere to land after crossing without spilling off
      // the page. 100% puts its left edge level with the finish pole.
      return Math.max(box.clientWidth - 74, 60);
    }

    var walk = function () { return frameT ? 'tortoiseB' : 'tortoiseA'; };

    function poses() {
      switch (mode) {
        case 'turn':  return { t: walk(), tf: 1, h: 'hareAlert' };
        case 'rear':  return { t: 'tortoiseStand', tf: 0, h: 'hareAlert' };
        case 'punch': return { t: 'tortoisePunch', tf: 0, h: 'hareAlert' };
        case 'fly':   return { t: 'tortoisePunch', tf: 0, h: 'hareAlert' };
        case 'gone':
        case 'drop':  return { t: 'tortoiseStand', tf: 0, h: 'hareSit' };
        case 'about': return { t: walk(), tf: 1, h: 'hareSit' };
        case 'home':
        case 'won':   return { t: walk(), tf: 0, h: 'hareSit' };
        case 'wake':  return { t: walk(), tf: 0, h: 'hareAlert' };
        default:
          return { t: walk(), tf: 0,
                   h: awake ? (frameH ? 'hareRunB' : 'hareRunA') : 'hareSit' };
      }
    }

    function paint() {
      var w = span(), p = poses();
      tort.style.transform = 'translateX(' + (18 + t / 100 * w) + 'px)';
      if (mode !== 'fly' && mode !== 'gone') {
        hare.style.transform = 'translateX(' + (18 + h / 100 * w) + 'px)';
        zzz.style.transform  = 'translateX(' + (18 + h / 100 * w + 12) + 'px)';
      }
      tort.innerHTML = S.render(p.t, 2, p.tf);
      hare.innerHTML = S.render(p.h, 2, 0);
      zzz.style.opacity = (mode === 'race' && !awake) ? '1' : '0';
    }

    function wake(ms) {
      if (mode !== 'race') return;
      awake = true;
      wakeUntil = performance.now() + (ms || 900);
    }
    hare.addEventListener('click', function () { wake(1000); });

    function after(name, now, next) {
      if (now - phaseAt > BEATS[name]) { mode = next; phaseAt = now; return true; }
      return false;
    }

    var last = performance.now();
    function step(now) {
      var dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      var flying = null;

      if (mode === 'race') {
        t += TORT * dt;
        if (awake) {
          h += HARE * dt;
          if (h > HARE_CAP) h = HARE_CAP;
          if (now > wakeUntil) awake = false;
        } else if (t > h - 7 && h < HARE_CAP) {
          wake(600 + Math.random() * 500);
        }
        if (h >= HARE_CAP && t > h + LEAD) { mode = 'wake'; awake = false; phaseAt = now; }

      } else if (mode === 'wake')  { after('wake', now, 'turn');
      } else if (mode === 'turn')  { after('turn', now, 'rear');
      } else if (mode === 'rear')  { after('rear', now, 'punch');
      } else if (mode === 'punch') {
        if (after('punch', now, 'fly')) flyFrom = h;

      } else if (mode === 'fly') {
        var k = Math.min((now - phaseAt) / BEATS.fly, 1);
        var w2 = span();
        var x0 = 18 + flyFrom / 100 * w2;
        // hit hard enough to leave: up and to the left, past the corner,
        // spinning, and faded out before it would reach anything of yours.
        // aim past the window's left edge, not just the track's, so it
        // genuinely leaves rather than stopping in the margin. modest rise:
        // a steep climb would sail back across the page while still visible.
        var edge = box.getBoundingClientRect().left;
        var x = x0 - (x0 + edge + 140) * Math.pow(k, 0.85);
        var y = -Math.pow(k, 1.3) * 130;
        hare.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        hare.style.opacity = String(0.5 * Math.max(0, 1 - Math.pow(k, 4)));
        flying = 'rotate(' + (-k * 1080) + 'deg)';
        if (k >= 1) {
          mode = 'gone'; phaseAt = now; flying = null;
          hare.style.opacity = '0';
        }

      } else if (mode === 'gone')  { after('drop', now, 'about');
      } else if (mode === 'about') { after('about', now, 'home');

      } else if (mode === 'home') {
        t += TORT * dt;
        var end = finishT();
        if (t >= end) { t = end; mode = 'won'; phaseAt = now; }

      } else if (mode === 'won') {
        if (now - phaseAt > 2600) reset();
      }

      if (now - lastStep > (awake ? 110 : 320)) {
        lastStep = now; frameT ^= 1; if (awake) frameH ^= 1;
      }

      paint();
      if (flying) {
        var sv = hare.querySelector('svg');
        if (sv) sv.style.transform = flying;
      }
      requestAnimationFrame(step);
    }

    paint();
    if (!still) {
      requestAnimationFrame(step);
      // rAF is frozen while the document is hidden; movement is derived from
      // elapsed time rather than frame counts, so this floor keeps it honest.
      setInterval(function () { step(performance.now()); }, 250);
    }
    window.addEventListener('resize', paint);
  });
})();
