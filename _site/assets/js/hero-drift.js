/**
 * hero-drift.js — Pixel-mosaic image slideshow
 *
 * The hero background shows the current galaxy image as a grid of
 * coloured pixel blocks — pixelated but recognisable. Every few seconds
 * it transitions to the next image: each block independently dissolves
 * to the new colour in a random scatter order, creating a cinematic
 * pixel-dissolve effect.
 *
 * Hover: a soft "flashlight" glow follows the cursor, gently illuminating
 * the pixels beneath it.
 *
 * Images: window.HERO_IMAGES — injected by Jekyll/Liquid at build time.
 * Adding any image to assets/images/hero/ is all you need.
 */
(function () {
  'use strict';

  /* ── Tunables ──────────────────────────────────────────────────────────── */
  const BLOCK         = 6;     // pixel block size in px — smaller = more pixels
  const HOLD_MS       = 6000;  // ms each image is fully shown before transitioning
  const SCATTER_MS    = 1600;  // ms spread over which blocks START transitioning
  const BLOCK_DUR_MS  = 550;   // ms each individual block takes to change colour
  const HOVER_RADIUS  = 70;    // px radius of the flashlight glow
  const HOVER_ALPHA   = 0.10;  // max brightness boost under cursor

  /* ── Canvas ────────────────────────────────────────────────────────────── */
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, cols = 0, rows = 0;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width  = rect.width  || 800;
    H = canvas.height = rect.height || 260;
    if (ready) { buildGrid(); }
  }
  window.addEventListener('resize', resize);

  /* ── Mouse ─────────────────────────────────────────────────────────────── */
  let mouseX = -9999, mouseY = -9999;
  canvas.parentElement.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('mouseleave', () => {
    mouseX = -9999; mouseY = -9999;
  });

  /* ── Image loading & colour sampling ───────────────────────────────────── */
  const srcs       = window.HERO_IMAGES || [];
  const loadedImgs = [];   // HTMLImageElement[]
  const colorGrids = [];   // colorGrids[i] = Uint8Array of [r,g,b, r,g,b, ...] per block

  /**
   * For image i, sample the average colour of each block region and store
   * it in colorGrids[i] as a flat Uint8Array: [r0,g0,b0, r1,g1,b1, …].
   */
  function sampleGrid(imgEl, imgIdx) {
    // Draw image to a temp canvas at exactly the right size
    const sc = document.createElement('canvas');
    sc.width  = W || 800;
    sc.height = H || 260;
    const sc2 = sc.getContext('2d');

    // --- object-fit: cover logic ---
    // Scale the image so it completely fills the canvas, then centre-crop.
    const imgAspect    = imgEl.naturalWidth / imgEl.naturalHeight;
    const canvasAspect = sc.width / sc.height;
    let drawW, drawH, drawX, drawY;
    if (imgAspect > canvasAspect) {
      // Image is wider relative to canvas → fit height, crop width
      drawH = sc.height;
      drawW = drawH * imgAspect;
    } else {
      // Image is taller relative to canvas → fit width, crop height
      drawW = sc.width;
      drawH = drawW / imgAspect;
    }
    drawX = (sc.width  - drawW) / 2;
    drawY = (sc.height - drawH) / 2;
    sc2.drawImage(imgEl, drawX, drawY, drawW, drawH);


    const n = cols * rows;
    const arr = new Uint8Array(n * 3);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const bx = col * BLOCK;
        const by = row * BLOCK;
        const bw = Math.min(BLOCK, sc.width  - bx);
        const bh = Math.min(BLOCK, sc.height - by);

        let r = 0, g = 0, b = 0;
        try {
          const d = sc2.getImageData(bx, by, bw, bh).data;
          const px = d.length / 4;
          for (let p = 0; p < d.length; p += 4) {
            r += d[p]; g += d[p+1]; b += d[p+2];
          }
          r = r / px | 0;
          g = g / px | 0;
          b = b / px | 0;
        } catch (_) { r = 30; g = 30; b = 50; }

        const base = (row * cols + col) * 3;
        arr[base]   = r;
        arr[base+1] = g;
        arr[base+2] = b;
      }
    }
    colorGrids[imgIdx] = arr;
  }

  function preload(cb) {
    if (!srcs.length) { cb(); return; }
    let done = 0;
    srcs.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImgs[i] = img;
        if (++done === srcs.length) cb();
      };
      img.onerror = () => { if (++done === srcs.length) cb(); };
      img.src = src;
    });
  }

  /* ── Grid state ─────────────────────────────────────────────────────────── */
  /**
   * Each block: { fromR, fromG, fromB, curR, curG, curB, delay }
   * delay = random offset (ms) for when this block starts its transition.
   */
  let blocks = [];
  let curImg  = 0;
  let ready   = false;

  function buildGrid() {
    cols = Math.ceil(W / BLOCK);
    rows = Math.ceil(H / BLOCK);

    // Re-sample all loaded images for the new grid dimensions
    loadedImgs.forEach((img, i) => {
      if (img) sampleGrid(img, i);
    });

    const n = cols * rows;
    const grid = colorGrids[curImg] || new Uint8Array(n * 3);

    blocks = [];
    for (let i = 0; i < n; i++) {
      const base = i * 3;
      const r = grid[base], g = grid[base+1], b = grid[base+2];
      blocks.push({ fromR: r, fromG: g, fromB: b,
                    curR:  r, curG:  g, curB:  b,
                    delay: 0 });
    }
    updateTextColor();
  }

  /* ── Dynamic text colour ────────────────────────────────────────────────── */
  /**
   * Sample the average colour of blocks in the centre of the canvas
   * (where the name sits). Set --hero-text / --hero-tagline CSS vars
   * so the text automatically contrasts with the mosaic.
   */
  function updateTextColor() {
    if (!blocks.length) return;
    // Sample the middle 50% of the grid
    const cx0 = Math.floor(cols * 0.25);
    const cx1 = Math.floor(cols * 0.75);
    const ry0 = Math.floor(rows * 0.15);
    const ry1 = Math.floor(rows * 0.85);

    let r = 0, g = 0, b = 0, n = 0;
    for (let row = ry0; row < ry1; row++) {
      for (let col = cx0; col < cx1; col++) {
        const blk = blocks[row * cols + col];
        if (!blk) continue;
        r += blk.curR; g += blk.curG; b += blk.curB; n++;
      }
    }
    if (!n) return;
    r = r / n; g = g / n; b = b / n;

    // Relative luminance of the raw mosaic
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // Account for the ~20% white overlay on top of the mosaic
    const effective = lum * 0.80 + 255 * 0.20;

    const isDark = effective < 148;   // mosaic is predominantly dark
    const el = document.documentElement;
    el.style.setProperty('--hero-text',    isDark ? '#f0f4ff'              : '#1a1a2e');
    el.style.setProperty('--hero-tagline', isDark ? 'rgba(200,215,255,0.82)' : '#777');
  }

  /* ── Transition ─────────────────────────────────────────────────────────── */
  let transitioning  = false;
  let transitionStart = 0;
  let nextImg         = 0;

  function startTransition() {
    if (!colorGrids.length || loadedImgs.length < 2) return;
    transitioning   = true;
    transitionStart = performance.now();
    nextImg = (curImg + 1) % loadedImgs.length;

    const toGrid = colorGrids[nextImg];
    blocks.forEach((blk, i) => {
      // Current colour becomes the "from"
      blk.fromR = blk.curR;
      blk.fromG = blk.curG;
      blk.fromB = blk.curB;
      // Random delay so blocks scatter asynchronously
      blk.delay = Math.random() * SCATTER_MS;
      // Store target
      const base = i * 3;
      blk.toR = toGrid[base];
      blk.toG = toGrid[base+1];
      blk.toB = toGrid[base+2];
    });
  }

  function updateTransition(now) {
    const elapsed = now - transitionStart;
    let allDone = true;

    blocks.forEach(blk => {
      const t = Math.max(0, Math.min(1,
        (elapsed - blk.delay) / BLOCK_DUR_MS
      ));
      // Ease in-out
      const e = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;

      blk.curR = blk.fromR + (blk.toR - blk.fromR) * e | 0;
      blk.curG = blk.fromG + (blk.toG - blk.fromG) * e | 0;
      blk.curB = blk.fromB + (blk.toB - blk.fromB) * e | 0;

      if (t < 1) allDone = false;
    });

    if (allDone) {
      transitioning = false;
      curImg = nextImg;
      updateTextColor();   // refresh text colour for the new image
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  function drawBlocks() {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const blk = blocks[row * cols + col];
        if (!blk) continue;
        ctx.fillStyle = `rgb(${blk.curR},${blk.curG},${blk.curB})`;
        ctx.fillRect(col * BLOCK, row * BLOCK, BLOCK, BLOCK);
      }
    }
  }

  function drawFlashlight() {
    if (mouseX < 0 || mouseX > W) return;
    // Soft radial gradient "glow" at cursor — subtle brightness reveal
    const grd = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, HOVER_RADIUS);
    grd.addColorStop(0, `rgba(255,255,255,${HOVER_ALPHA})`);
    grd.addColorStop(1,  'rgba(255,255,255,0)');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /* ── Main loop ──────────────────────────────────────────────────────────── */
  let lastTransitionEnd = 0;

  function loop(now) {
    ctx.clearRect(0, 0, W, H);

    if (transitioning) {
      updateTransition(now);
    } else {
      // Wait HOLD_MS after last transition, then kick off next
      if (loadedImgs.length > 1 &&
          now - lastTransitionEnd > HOLD_MS) {
        lastTransitionEnd = now + SCATTER_MS + BLOCK_DUR_MS; // approximate end
        startTransition();
      }
    }

    drawBlocks();
    drawFlashlight();

    requestAnimationFrame(loop);
  }

  /* ── Bootstrap ──────────────────────────────────────────────────────────── */
  preload(() => {
    ready = true;                          // MUST be true before resize calls buildGrid
    resize();                              // sets W, H → buildGrid() → sampleGrid()
    lastTransitionEnd = performance.now(); // start hold timer from now
    requestAnimationFrame(loop);
  });

})();
