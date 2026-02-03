// Audio controls for THE MEME $BOOK
(function () {
  const carousel = document.querySelector('.carousel');
  const bgmEl = document.getElementById('bgm');
  const paperEl = document.getElementById('paper');
  const infoTip = document.getElementById('info-tip');

  if (bgmEl) {
    bgmEl.volume = 0.35;
  }
  if (paperEl) {
    paperEl.volume = 0.5;
  }

  let bgmStarted = false;
  let audioCtx = null;

  function ensureAudioContext() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {
        audioCtx = null;
      }
    }
    return audioCtx;
  }

  function startBgm() {
    if (bgmStarted || !bgmEl) return;
    bgmStarted = true;
    const play = () => bgmEl.play().catch(() => {});
    // Attempt resume context first (iOS/Safari quirks)
    const ctx = ensureAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().finally(play);
    } else {
      play();
    }
    removeGestureListeners();
  }

  function addGestureListeners() {
    ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((evt) => {
      window.addEventListener(evt, startBgm, { once: true, passive: true });
    });
  }

  function removeGestureListeners() {
    ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((evt) => {
      window.removeEventListener(evt, startBgm, { passive: true });
    });
  }

  addGestureListeners();

  // Hide info tip after 15 seconds with a fade-out
  if (infoTip) {
    setTimeout(() => {
      infoTip.style.transition = 'opacity 500ms ease';
      infoTip.style.opacity = '0';
      setTimeout(() => {
        infoTip.style.display = 'none';
      }, 600);
    }, 15000);
  }

  function playPaperSound() {
    // Try using provided audio element first
    if (paperEl) {
      try {
        paperEl.currentTime = 0;
        paperEl.play().catch(() => synthPaper());
        return;
      } catch (_) {
        // fallback to synth
      }
    }
    synthPaper();
  }

  function synthPaper() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const duration = 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      1200,
      ctx.currentTime + duration
    );
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  if (carousel) {
    // Immediate page change detection: compute index from scrollLeft
    let lastIndex = Math.round(
      carousel.scrollLeft / Math.max(1, carousel.clientWidth)
    );
    const onScrollImmediate = () => {
      const width = Math.max(1, carousel.clientWidth);
      const curIndex = Math.round(carousel.scrollLeft / width);
      if (curIndex !== lastIndex) {
        lastIndex = curIndex;
        playPaperSound();
      }
    };

    carousel.addEventListener('scroll', onScrollImmediate, { passive: true });
    // Also bind to scrollend as a safety for browsers that don't align perfectly
    carousel.addEventListener?.('scrollend', () => {
      onScrollImmediate();
    });
  }
})();
