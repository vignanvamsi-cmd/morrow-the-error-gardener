/* ═══════════════════════════════════════════════════════════════════
   MORROW — THE ERROR GARDENER  ·  script.js
   Plain vanilla JavaScript · No frameworks · No external APIs
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════════
// UTILITY: Safe DOM helpers
// ══════════════════════════════════════════════════════════════════

/**
 * Returns element by ID, or null if not found.
 * @param {string} id
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Set visible text content safely (never injects HTML).
 * @param {HTMLElement} el
 * @param {string} text
 */
function setText(el, text) {
  if (el) el.textContent = text;
}

/**
 * Show or hide an element using the hidden attribute.
 * @param {HTMLElement} el
 * @param {boolean} visible
 */
function setVisible(el, visible) {
  if (!el) return;
  if (visible) {
    el.removeAttribute('hidden');
  } else {
    el.setAttribute('hidden', '');
  }
}


// ══════════════════════════════════════════════════════════════════
// 1. DAY / NIGHT THEME TOGGLE
//    Persists to localStorage. Updates aria-pressed and label.
// ══════════════════════════════════════════════════════════════════

(function initThemeToggle() {
  const btn   = $('theme-toggle');
  const icon  = btn ? btn.querySelector('.theme-icon') : null;
  const label = btn ? btn.querySelector('.theme-label') : null;

  // Check if user already set a preference
  const saved = localStorage.getItem('morrow-theme');
  if (saved === 'night') applyNight(true);

  function applyNight(night) {
    document.body.classList.toggle('night', night);
    if (btn) {
      btn.setAttribute('aria-pressed', String(night));
      btn.setAttribute('aria-label', night ? 'Switch to day mode' : 'Switch to night mode');
    }
    if (icon)  icon.textContent = night ? '☀️' : '🌙';
    if (label) label.textContent = night ? 'Day' : 'Night';
  }

  if (!btn) return;
  btn.addEventListener('click', function () {
    const isNight = document.body.classList.contains('night');
    applyNight(!isNight);
    localStorage.setItem('morrow-theme', !isNight ? 'night' : 'day');
  });
})();


// ══════════════════════════════════════════════════════════════════
// 2. SCROLL REVEAL — observe .reveal-on-scroll elements
// ══════════════════════════════════════════════════════════════════

(function initScrollReveal() {
  // Graceful fallback if IntersectionObserver is not supported
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
      el.classList.add('revealed');
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);  // reveal once
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
    observer.observe(el);
  });
})();


// ══════════════════════════════════════════════════════════════════
// 3. CHARACTER EYE TRACKING
//    Morrow's pupils follow the mouse pointer on desktop.
//    Clamped to remain inside the eye sockets.
//    Disabled for reduced-motion and coarse-pointer devices.
// ══════════════════════════════════════════════════════════════════

(function initEyeTracking() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  const eyeLeft  = $('eye-left');
  const eyeRight = $('eye-right');
  const morrowEl = $('morrow-character');

  if (!eyeLeft || !eyeRight || !morrowEl) return;

  // Base positions (from SVG viewBox coordinates)
  const eyes = [
    { el: eyeLeft,  cx: 84, cy: 88 },
    { el: eyeRight, cx: 116, cy: 88 }
  ];
  const maxTravel = 4;  // max px travel in SVG units

  function movePupils(mouseX, mouseY) {
    const rect = morrowEl.getBoundingClientRect();
    // Centre of Morrow on screen
    const charCx = rect.left + rect.width  / 2;
    const charCy = rect.top  + rect.height * 0.37; // eye-level

    eyes.forEach(function (eye) {
      // Map mouse direction relative to character centre
      const dx = mouseX - charCx;
      const dy = mouseY - charCy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const factor = Math.min(1, dist / 400);  // dampening

      const offsetX = (dx / dist) * maxTravel * factor;
      const offsetY = (dy / dist) * maxTravel * factor;

      // Clamp to circular boundary
      const length = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
      const clampedX = length > maxTravel ? (offsetX / length) * maxTravel : offsetX;
      const clampedY = length > maxTravel ? (offsetY / length) * maxTravel : offsetY;

      // Apply transform on the pupil group
      eye.el.setAttribute('transform',
        'translate(' + clampedX.toFixed(2) + ',' + clampedY.toFixed(2) + ')');
    });
  }

  function resetPupils() {
    eyes.forEach(function (eye) {
      eye.el.setAttribute('transform', 'translate(0,0)');
    });
  }

  if (!reducedMotion && !coarsePointer) {
    // Desktop: follow mouse
    document.addEventListener('mousemove', function (e) {
      movePupils(e.clientX, e.clientY);
    });
    morrowEl.addEventListener('mouseleave', resetPupils);
  }

  // Touch / tap on Morrow: wiggle eyes as friendly reaction
  morrowEl.addEventListener('click', function () {
    eyes.forEach(function (eye) {
      eye.el.setAttribute('transform', 'translate(3,3)');
    });
    setTimeout(function () { resetPupils(); }, 300);
  });
  morrowEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      morrowEl.click();
    }
  });
  morrowEl.setAttribute('tabindex', '0');
  morrowEl.setAttribute('role', 'button');
  morrowEl.setAttribute('aria-label', 'Pet Morrow — click to say hello');
})();


// ══════════════════════════════════════════════════════════════════
// 4. PROJECT 01: ALMOST ARCHIVE — Lost Fragment Revealer
//    Shows a different fragment each click.
// ══════════════════════════════════════════════════════════════════

(function initAlmostArchive() {
  const btn      = $('archive-btn');
  const fragment = $('archive-fragment');
  if (!btn || !fragment) return;

  const fragments = [
    '"…and maybe that\'s why I never finished it. The idea was too important to get wrong."',
    '"draft #47 — almost. So close. Delete."',
    '"a melody in D minor that I heard once and nearly wrote down"',
    '"the name of the girl who gave me a book in 2003 and vanished"',
    '"— todo: finish this before it becomes irrelevant. (it became irrelevant)"',
    '"a whole novel, twelve chapters, abandoned on a Tuesday"',
    '"the apology I meant to send three years ago"',
    '"an untitled folder: 23 items. Last opened: never."',
    '"sketch #2 of the thing I was going to draw every day"',
    '"\'you know what, let\'s just start fresh\' — the final entry"',
  ];
  let index = 0;

  btn.addEventListener('click', function () {
    setText(fragment, fragments[index % fragments.length]);
    setVisible(fragment, true);
    index++;
  });
})();


// ══════════════════════════════════════════════════════════════════
// 5. PROJECT 02: GLITCHBLOOM — Glitch Flower Bloomer
//    Animates a row of random glitch flower emojis.
// ══════════════════════════════════════════════════════════════════

(function initGlitchBloom() {
  const btn  = $('glitch-btn');
  const area = $('glitch-bloom-area');
  if (!btn || !area) return;

  const glitchFlowers = ['✿', '❀', '✾', '❃', '✻', '❋', '✽', '✼', '❁', '❊', '✦', '★'];
  const glitchColors  = ['#a34063', '#7fb3e8', '#f5c842', '#6aad5e', '#c87da0', '#e8a0b8', '#a5c4f0'];

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  btn.addEventListener('click', function () {
    // Clear area
    area.textContent = '';

    const count = 6 + Math.floor(Math.random() * 6); // 6–11 flowers
    for (let i = 0; i < count; i++) {
      (function (delay) {
        setTimeout(function () {
          const span = document.createElement('span');
          span.className = 'glitch-flower-emoji';
          span.textContent = randomItem(glitchFlowers);
          span.style.color = randomItem(glitchColors);
          span.style.fontSize = (1 + Math.random() * 0.8).toFixed(2) + 'rem';
          span.setAttribute('aria-hidden', 'true');
          area.appendChild(span);
        }, delay);
      })(i * 100);
    }

    // Announce to screen readers
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
    sr.textContent = 'A cluster of glitch flowers has bloomed.';
    area.appendChild(sr);
  });
})();


// ══════════════════════════════════════════════════════════════════
// 6. PLANT GENERATOR — Tomorrow's Seed / Grow a Glitch Flower
//    Fully local — no API calls.
//    Input validated and sanitised via textContent (never innerHTML).
// ══════════════════════════════════════════════════════════════════

(function initPlantGenerator() {
  const form        = $('garden-form');
  const wordInput   = $('word-input');
  const errorEl     = $('word-error');
  const resultEl    = $('plant-result');
  const svgArea     = $('plant-svg-area');
  const srcWord     = $('plant-source-word');
  const nameEl      = $('plant-name');
  const speciesEl   = $('plant-species');
  const descEl      = $('plant-desc');
  const noteEl      = $('plant-morrow-note');
  const anotherBtn  = $('grow-another-btn');
  const growBtn     = $('grow-btn');

  if (!form || !wordInput) return;

  // ── Plant data tables ──────────────────────────────────────────

  const prefixes = [
    'Glitch', 'Echo', 'Null', 'Void', 'Drift', 'Phantom', 'Ember',
    'Tender', 'Hollow', 'Velvet', 'Coral', 'Amber', 'Indigo',
    'Russet', 'Pale', 'Fading', 'Eternal', 'Half-', 'Almost-', 'Late'
  ];
  const stems = [
    'bloom', 'blossom', 'fern', 'spire', 'vine', 'cap', 'bell',
    'orchid', 'lichen', 'moss', 'thorn', 'reed', 'frond',
    'shoot', 'tendril', 'stalk', 'burr', 'crest', 'petal'
  ];
  const suffixes = [
    '', 'ia', 'us', 'ara', 'elle', 'ose', 'ula', 'ix',
    ' Minor', ' Prime', ' Forgot', ' Recalled', ' Dreamt'
  ];

  const speciesList = [
    'Erroraceae (Glitch Flower Family)',
    'Lacunae (Gap-Bloomer Family)',
    'Fragmentia (Lost Piece Family)',
    'Nullifera (Void-Root Family)',
    'Echoplantae (Memory Vine Family)',
    'Forgottensia (Vanished Word Family)',
    'Driftaceae (Floating Fragment Family)',
    'Staticae (Digital Static Family)',
    'Corruptibilis (Beautiful Ruin Family)',
    'Incompletus (Unfinished Garden Family)',
  ];

  const descTemplates = [
    'Grows in the absence of completed thoughts. Its petals are exactly the colour of an unsaved file, and it gives off a faint warmth whenever something nearby is deleted.',
    'Blooms only in the space between a half-written sentence and the backspace key. Its leaves feel like pressed starlight.',
    'A slow-growing specimen that appears wherever too many browser tabs are left open overnight. Said to hum softly in 404 frequencies.',
    'Emerges from failed upload attempts. The stem is transparent, and inside it you can see the echo of whatever was meant to be sent.',
    'Found exclusively in draft folders and unused documents. Each petal contains a different letter of a word that was never quite right.',
    'Sprouts between undo and redo. Touch it and you briefly remember something you meant to say three years ago.',
    'A climbing vine that grows up old ethernet cables and forgotten power cords. Its blossoms smell like a library nobody visits anymore.',
    'Appears after a signal drops mid-conversation. Its roots are made of interrupted data packets.',
    'Thrives in abandoned creative projects. The more something was loved and then left, the brighter it glows.',
    'Grows at the exact spot where someone changed their mind and closed the window without saving.',
  ];

  const morrowNotes = [
    '"This one grew particularly fast. I think it missed you."',
    '"I almost didn\'t catch this one — it was nearly gone."',
    '"A lovely mistake. One of my favourites."',
    '"This plant hasn\'t stopped glowing since you planted it."',
    '"Something about this word was very much alive already."',
    '"Morrow sat with this one for a long time before it bloomed."',
    '"It smells like old browser history. In a good way."',
    '"This is the third time I\'ve grown one of these. They never look the same twice."',
    '"I had a feeling this word had been waiting to be planted for a while."',
    '"Strange. Even I don\'t know what this plant is. But it seems happy."',
  ];

  // Petal colour palettes (index is derived from word hash)
  const palettes = [
    { stem: '#6aad5e', petals: ['#a34063', '#c87da0', '#e8a0b8'], center: '#f5c842' },
    { stem: '#4a9a3d', petals: ['#7fb3e8', '#a5c4f0', '#dde8f8'], center: '#fff8f1' },
    { stem: '#3d6433', petals: ['#f5c842', '#fad86a', '#fdeea2'], center: '#5c4033' },
    { stem: '#6aad5e', petals: ['#c87da0', '#dda0c0', '#f0c8e0'], center: '#a34063' },
    { stem: '#5a8f4a', petals: ['#a5c4f0', '#7fb3e8', '#5098d0'], center: '#fff8f1' },
    { stem: '#4a9a3d', petals: ['#e8a0b8', '#f5c0d0', '#fde0e8'], center: '#a34063' },
    { stem: '#6aad5e', petals: ['#9a8fd0', '#b8aaee', '#d8d0f8'], center: '#fff8f1' },
    { stem: '#3d6433', petals: ['#f0a060', '#f8c090', '#fde0c0'], center: '#5c4033' },
  ];

  // Plant shapes (SVG generation functions)
  const plantShapes = [
    buildFlowerPlant,
    buildTallPlant,
    buildMushroomPlant,
    buildVinePlant,
    buildTreePlant,
  ];

  // ── Deterministic hash from word ──────────────────────────────

  /**
   * Simple djb2-style string hash to produce deterministic results
   * from the same input word.
   * @param {string} str
   * @returns {number}
   */
  function hashWord(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  // ── Pick from array using seed ────────────────────────────────
  function pick(arr, seed) {
    return arr[seed % arr.length];
  }

  // ── Generate plant data from word ────────────────────────────

  function generatePlant(rawWord) {
    const word  = rawWord.trim().toLowerCase();
    const seed  = hashWord(word);

    const name =
      pick(prefixes, seed)
      + pick(stems, (seed >> 4) & 0xffff)
      + pick(suffixes, (seed >> 8) & 0xffff);

    const species  = pick(speciesList,     (seed >> 2)  & 0xffff);
    const desc     = pick(descTemplates,   (seed >> 3)  & 0xffff);
    const note     = pick(morrowNotes,     (seed >> 5)  & 0xffff);
    const palette  = pick(palettes,        (seed >> 6)  & 0xffff);
    const shape    = pick(plantShapes,     (seed >> 7)  & 0xffff);

    // Extra variety: height modifier from word length
    const heightFactor = 0.7 + (word.length % 8) * 0.05;

    return { name, species, desc, note, palette, shape, heightFactor };
  }

  // ── SVG Plant Builders ────────────────────────────────────────
  // Each returns an SVG element (never uses innerHTML for user data)

  function makeSVG(width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width',   String(width));
    svg.setAttribute('height',  String(height));
    svg.setAttribute('xmlns',   'http://www.w3.org/2000/svg');
    return svg;
  }
  function makeEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(function ([k, v]) { el.setAttribute(k, v); });
    return el;
  }

  function buildFlowerPlant(palette, h) {
    const svg = makeSVG(120, 160);
    const stemH = Math.round(80 * h);
    const stemY = 150 - stemH;
    // Stem
    svg.appendChild(makeEl('rect', { x: 58, y: stemY, width: 4, height: stemH, fill: palette.stem, rx: 2 }));
    // Leaves
    svg.appendChild(makeEl('ellipse', { cx: 52, cy: stemY + stemH * 0.5, rx: 16, ry: 7, fill: palette.stem, transform: 'rotate(-30 52 ' + (stemY + stemH * 0.5) + ')' }));
    svg.appendChild(makeEl('ellipse', { cx: 68, cy: stemY + stemH * 0.35, rx: 16, ry: 7, fill: palette.stem, transform: 'rotate(30 68 ' + (stemY + stemH * 0.35) + ')', opacity: '0.8' }));
    // Petals
    const petY = stemY - 2;
    const petR = 16;
    [[60, petY - petR], [60 + petR, petY], [60, petY + petR], [60 - petR, petY]].forEach(function ([px, py], i) {
      svg.appendChild(makeEl('circle', { cx: px, cy: py, r: petR, fill: palette.petals[i % palette.petals.length], opacity: '0.9' }));
    });
    // Diagonal petals
    [[60 + 11, petY - 11], [60 + 11, petY + 11], [60 - 11, petY + 11], [60 - 11, petY - 11]].forEach(function ([px, py]) {
      svg.appendChild(makeEl('circle', { cx: px, cy: py, r: petR * 0.8, fill: palette.petals[1], opacity: '0.6' }));
    });
    // Center
    svg.appendChild(makeEl('circle', { cx: 60, cy: petY, r: 10, fill: '#fff8f1' }));
    svg.appendChild(makeEl('circle', { cx: 60, cy: petY, r: 5, fill: palette.center }));
    return svg;
  }

  function buildTallPlant(palette, h) {
    const svg = makeSVG(120, 160);
    const stemH = Math.round(110 * h);
    const stemY = 150 - stemH;
    // Stem
    svg.appendChild(makeEl('rect', { x: 57, y: stemY, width: 6, height: stemH, fill: palette.stem, rx: 3 }));
    // Alternating leaves
    for (let i = 0; i < 4; i++) {
      const ly = stemY + stemH * (0.2 + i * 0.22);
      const side = i % 2 === 0 ? -1 : 1;
      svg.appendChild(makeEl('ellipse', { cx: 60 + side * 20, cy: ly, rx: 18, ry: 8,
        fill: palette.stem, transform: 'rotate(' + (side * -30) + ' ' + (60 + side * 20) + ' ' + ly + ')', opacity: '0.85' }));
    }
    // Top bud / flower
    svg.appendChild(makeEl('circle', { cx: 60, cy: stemY - 10, r: 14, fill: palette.petals[0], opacity: '0.9' }));
    svg.appendChild(makeEl('circle', { cx: 60, cy: stemY - 10, r: 8,  fill: palette.petals[2], opacity: '0.9' }));
    svg.appendChild(makeEl('circle', { cx: 60, cy: stemY - 10, r: 4,  fill: palette.center }));
    // Tiny sparkle dots
    svg.appendChild(makeEl('circle', { cx: 48, cy: stemY - 20, r: 3, fill: palette.center, opacity: '0.7' }));
    svg.appendChild(makeEl('circle', { cx: 72, cy: stemY - 16, r: 2, fill: palette.petals[1], opacity: '0.8' }));
    return svg;
  }

  function buildMushroomPlant(palette, h) {
    const svg = makeSVG(120, 160);
    const stemH = Math.round(50 * h);
    const capY  = 150 - stemH - 40;
    // Stem (thick)
    svg.appendChild(makeEl('rect', { x: 50, y: 150 - stemH, width: 20, height: stemH, fill: '#fff8f1', rx: 8 }));
    // Spots on stem
    svg.appendChild(makeEl('circle', { cx: 55, cy: 150 - stemH * 0.4, r: 3, fill: palette.petals[0], opacity: '0.5' }));
    svg.appendChild(makeEl('circle', { cx: 65, cy: 150 - stemH * 0.7, r: 2.5, fill: palette.petals[1], opacity: '0.5' }));
    // Cap
    svg.appendChild(makeEl('ellipse', { cx: 60, cy: capY + 20, rx: 40, ry: 14, fill: palette.petals[2], opacity: '0.8' }));
    svg.appendChild(makeEl('ellipse', { cx: 60, cy: capY + 8, rx: 36, ry: 30, fill: palette.petals[0] }));
    // Spots on cap
    svg.appendChild(makeEl('circle', { cx: 48, cy: capY + 2, r: 7, fill: '#fff8f1', opacity: '0.7' }));
    svg.appendChild(makeEl('circle', { cx: 68, cy: capY + 5, r: 5, fill: '#fff8f1', opacity: '0.7' }));
    svg.appendChild(makeEl('circle', { cx: 40, cy: capY + 14, r: 4, fill: '#fff8f1', opacity: '0.5' }));
    // Glow
    svg.appendChild(makeEl('circle', { cx: 60, cy: capY + 5, r: 12, fill: palette.center, opacity: '0.25' }));
    return svg;
  }

  function buildVinePlant(palette, h) {
    const svg = makeSVG(120, 160);
    // Curvy vine path
    const yBase = 150;
    const path = 'M60,' + yBase + ' Q40,' + Math.round(yBase - 40 * h) + ' 55,' + Math.round(yBase - 70 * h)
               + ' Q70,' + Math.round(yBase - 100 * h) + ' 55,' + Math.round(yBase - 130 * h);
    const vine = makeEl('path', { d: path, stroke: palette.stem, 'stroke-width': '4', fill: 'none', 'stroke-linecap': 'round' });
    svg.appendChild(vine);
    // Flowers along the vine at intervals
    const positions = [[55, yBase - 70 * h * 0.3], [68, yBase - 70 * h * 0.6], [50, yBase - 70 * h * 0.9]];
    positions.forEach(function ([fx, fy], i) {
      svg.appendChild(makeEl('circle', { cx: fx, cy: fy, r: 10, fill: palette.petals[i % palette.petals.length], opacity: '0.85' }));
      svg.appendChild(makeEl('circle', { cx: fx, cy: fy, r: 5, fill: '#fff8f1' }));
      svg.appendChild(makeEl('circle', { cx: fx, cy: fy, r: 2.5, fill: palette.center }));
      // Small leaves
      svg.appendChild(makeEl('ellipse', { cx: fx - 12, cy: fy + 4, rx: 10, ry: 5, fill: palette.stem, opacity: '0.7',
        transform: 'rotate(-20 ' + (fx - 12) + ' ' + (fy + 4) + ')' }));
    });
    return svg;
  }

  function buildTreePlant(palette, h) {
    const svg = makeSVG(120, 160);
    const trunkH = Math.round(60 * h);
    const trunkY = 150 - trunkH;
    // Trunk
    svg.appendChild(makeEl('rect', { x: 54, y: trunkY, width: 12, height: trunkH, fill: '#5c4033', rx: 4 }));
    // Canopy layers (3 circles)
    const canopyY = trunkY - 10;
    svg.appendChild(makeEl('circle', { cx: 60, cy: canopyY + 5, r: 35, fill: palette.stem, opacity: '0.7' }));
    svg.appendChild(makeEl('circle', { cx: 46, cy: canopyY - 5, r: 24, fill: palette.stem, opacity: '0.8' }));
    svg.appendChild(makeEl('circle', { cx: 74, cy: canopyY - 2, r: 22, fill: palette.stem, opacity: '0.8' }));
    svg.appendChild(makeEl('circle', { cx: 60, cy: canopyY - 18, r: 20, fill: palette.petals[0], opacity: '0.75' }));
    // Blossoms dotted in canopy
    [[48, canopyY - 8], [68, canopyY - 12], [56, canopyY - 22], [72, canopyY], [40, canopyY]].forEach(function ([bx, by]) {
      svg.appendChild(makeEl('circle', { cx: bx, cy: by, r: 5, fill: palette.petals[2], opacity: '0.85' }));
      svg.appendChild(makeEl('circle', { cx: bx, cy: by, r: 2.5, fill: palette.center, opacity: '0.9' }));
    });
    return svg;
  }

  // ── Form submission ───────────────────────────────────────────

  function showError(msg) {
    setText(errorEl, msg);
    setVisible(errorEl, true);
    wordInput.classList.add('error-state');
    wordInput.setAttribute('aria-invalid', 'true');
  }
  function clearError() {
    setVisible(errorEl, false);
    wordInput.classList.remove('error-state');
    wordInput.removeAttribute('aria-invalid');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    const raw = wordInput.value;

    // Validation
    if (!raw.trim()) {
      showError('Please enter a word or short phrase first.');
      wordInput.focus();
      return;
    }
    if (raw.trim().length > 40) {
      showError('Please keep your word or phrase to 40 characters or fewer.');
      wordInput.focus();
      return;
    }

    // Generate plant
    const plant = generatePlant(raw);

    // Populate result (all via textContent — never innerHTML for user data)
    setText(srcWord,   raw.trim());
    setText(nameEl,    plant.name);
    setText(speciesEl, plant.species);
    setText(descEl,    plant.desc);
    setText(noteEl,    plant.note);

    // Build SVG illustration
    if (svgArea) {
      svgArea.textContent = ''; // clear previous
      const plantSvg = plant.shape(plant.palette, plant.heightFactor);
      svgArea.appendChild(plantSvg);
    }

    // Show result
    setVisible(resultEl, true);
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Disable grow button temporarily (feedback)
    growBtn.disabled = true;
    growBtn.textContent = 'Growing… 🌱';
    setTimeout(function () {
      growBtn.disabled = false;
      growBtn.textContent = 'Grow a Glitch Flower 🌱';
    }, 800);
  });

  // "Grow another" resets the form
  if (anotherBtn) {
    anotherBtn.addEventListener('click', function () {
      setVisible(resultEl, false);
      wordInput.value = '';
      clearError();
      wordInput.focus();
    });
  }
})();


// ══════════════════════════════════════════════════════════════════
// 7. EASTER EGG — Secret Room
//    Trigger: the glowing ✿ button in the footer.
//    Also activatable with keyboard (Enter / Space).
//    Clue: "Something is hidden here…" in the title attribute
//    and the pulsing animation draws attention.
// ══════════════════════════════════════════════════════════════════

(function initEasterEgg() {
  const trigger  = $('secret-trigger');
  const room     = $('secret-room');
  const overlay  = $('secret-overlay');
  const closeBtn = $('secret-close');

  if (!trigger || !room || !overlay) return;

  function openRoom() {
    setVisible(room, true);
    setVisible(overlay, true);
    document.body.style.overflow = 'hidden';
    // Focus the dialog for accessibility
    room.focus();
    // Trap focus inside dialog
    document.addEventListener('keydown', trapFocus);
  }

  function closeRoom() {
    setVisible(room, false);
    setVisible(overlay, false);
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapFocus);
    trigger.focus();
  }

  function trapFocus(e) {
    if (e.key === 'Escape') {
      closeRoom();
      return;
    }
    // Keep Tab focus inside the dialog
    const focusable = room.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  trigger.addEventListener('click', openRoom);
  if (closeBtn) closeBtn.addEventListener('click', closeRoom);
  overlay.addEventListener('click', closeRoom);
})();


// ══════════════════════════════════════════════════════════════════
// 8. SPARKLE CURSOR TRAIL (Side Quest — optional)
//    Only on fine-pointer (mouse) devices.
//    Disabled if prefers-reduced-motion is set.
//    Uses a canvas overlay to avoid cluttering the DOM.
//    Max 60 active sparkles at once to keep it lightweight.
// ══════════════════════════════════════════════════════════════════

(function initSparkleCursor() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (reducedMotion || coarsePointer) return;

  const canvas = $('sparkle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sparkleColors = [
    'rgba(163, 64, 99, ',
    'rgba(200, 125, 160, ',
    'rgba(245, 200, 66, ',
    'rgba(127, 179, 232, ',
    'rgba(106, 173, 94, ',
    'rgba(165, 196, 240, ',
  ];

  let sparkles = [];
  let mouseX = -100;
  let mouseY = -100;
  let animFrame = null;

  // Resize canvas to fill window
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Track mouse position
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Add sparkle on move (limit to 60 max)
    if (sparkles.length < 60) {
      sparkles.push({
        x:       mouseX + (Math.random() - 0.5) * 12,
        y:       mouseY + (Math.random() - 0.5) * 12,
        r:       2 + Math.random() * 4,
        alpha:   0.8 + Math.random() * 0.2,
        vx:      (Math.random() - 0.5) * 1.5,
        vy:      -1.5 - Math.random() * 2,
        color:   sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        char:    Math.random() > 0.5 ? '✦' : '✿',
        useChar: Math.random() > 0.6,
      });
    }
  });

  // Animation loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sparkles = sparkles.filter(function (s) {
      s.x     += s.vx;
      s.y     += s.vy;
      s.alpha -= 0.025;
      s.r     *= 0.97;

      if (s.alpha <= 0) return false;

      if (s.useChar) {
        ctx.font = Math.round(s.r * 3) + 'px serif';
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color + s.alpha + ')';
        ctx.fillText(s.char, s.x, s.y);
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color + s.alpha + ')';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return true;
    });

    animFrame = requestAnimationFrame(draw);
  }
  draw();
})();


// ══════════════════════════════════════════════════════════════════
// 9. MOBILE NAV — show/hide nav links on small screens
//    (The nav is hidden at ≤600px via CSS; this adds a toggle)
// ══════════════════════════════════════════════════════════════════

(function initMobileNav() {
  const nav = document.querySelector('.site-nav nav');
  if (!nav) return;

  // Only add toggle if nav is hidden (mobile)
  function checkAndSetupToggle() {
    if (window.innerWidth <= 600) {
      if (!$('mobile-nav-toggle')) {
        const btn = document.createElement('button');
        btn.id = 'mobile-nav-toggle';
        btn.textContent = '☰';
        btn.setAttribute('aria-label', 'Toggle navigation menu');
        btn.setAttribute('aria-expanded', 'false');
        btn.style.cssText =
          'background:var(--berry);color:#fff;border:none;border-radius:8px;'
          + 'padding:0.4rem 0.7rem;font-size:1.1rem;cursor:pointer;flex-shrink:0;';
        nav.parentNode.insertBefore(btn, nav);

        btn.addEventListener('click', function () {
          const open = nav.style.display === 'flex';
          nav.style.display = open ? '' : 'flex';
          nav.style.flexDirection = 'column';
          nav.style.position = 'absolute';
          nav.style.top = '60px';
          nav.style.left = '0';
          nav.style.right = '0';
          nav.style.background = 'var(--nav-bg)';
          nav.style.padding = '1rem 1.5rem';
          nav.style.borderBottom = '1.5px solid var(--panel-border)';
          nav.style.zIndex = '99';
          btn.setAttribute('aria-expanded', String(!open));
          btn.textContent = open ? '☰' : '✕';
        });
      }
    }
  }
  checkAndSetupToggle();
  window.addEventListener('resize', checkAndSetupToggle);
})();


// ══════════════════════════════════════════════════════════════════
// 10. SMOOTH ANCHOR SCROLLING (for older browsers)
// ══════════════════════════════════════════════════════════════════

document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


// ══════════════════════════════════════════════════════════════════
// END OF SCRIPT
// ══════════════════════════════════════════════════════════════════
