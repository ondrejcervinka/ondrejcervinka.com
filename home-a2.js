(function () {
  'use strict';

  const slides = document.querySelectorAll('.a2-slide');
  const thumbs = document.querySelectorAll('.a2-thumb');
  const prevBtn = document.querySelector('.a2-prev');
  const nextBtn = document.querySelector('.a2-next');
  const progressBar = document.querySelector('.a2-progress i');
  const dots = document.querySelectorAll('.a2-dots i');
  const thumbsContainer = document.querySelector('.a2-thumbs');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  const N = slides.length;

  function ensureSrc(video, preloadValue = 'auto') {
    if (reduced) return; // reduced motion: poster only, do not download the video
    if (video.dataset.src && !video.src) {
      video.src = video.dataset.src;
      video.preload = preloadValue;
    }
  }

  // Header + strip sit outside the slides: mirror the active slide's themes on <body>.
  const THEME_ATTRS = ['data-head', 'data-cap', 'data-strip', 'data-head-m', 'data-cap-m', 'data-strip-m'];
  function applyTheme(slide) {
    THEME_ATTRS.forEach(a => {
      const v = slide.getAttribute(a);
      if (v) document.body.setAttribute(a, v);
    });
    ['--strip', '--strip-m'].forEach(p => {
      const v = slide.style.getPropertyValue(p);
      if (v) document.body.style.setProperty(p, v);
    });
  }

  // Still images are loading="lazy"; inside a hidden slide they would only load
  // once visible (black flash). Switch the active slide and its neighbours to eager.
  function eagerImg(slide) {
    const img = slide.querySelector('img.a2-media');
    if (img && img.loading === 'lazy') img.loading = 'eager';
  }

  function go(index, opts = {}) {
    const { updateHash = true, focusThumb = false } = opts;
    
    // 1. Wrap around
    let i = (index % N + N) % N;
    if (i === current) {
      const activeSlide = slides[current];
      const media = activeSlide.querySelector('.a2-media');
      if (media && media.tagName === 'VIDEO' && !reduced) {
        media.play().catch(() => {});
      }
      return;
    }

    // 2. Previous slide
    const prevSlide = slides[current];
    prevSlide.classList.remove('is-active');
    prevSlide.setAttribute('aria-hidden', 'true');
    const prevMedia = prevSlide.querySelector('.a2-media');
    if (prevMedia && prevMedia.tagName === 'VIDEO') {
      prevMedia.pause();
    }

    // 3. New slide
    const newSlide = slides[i];
    newSlide.classList.add('is-active');
    newSlide.removeAttribute('aria-hidden');
    applyTheme(newSlide);
    const newMedia = newSlide.querySelector('.a2-media');
    if (newMedia && newMedia.tagName === 'VIDEO') {
      ensureSrc(newMedia);
      if (!reduced) {
        newMedia.play().catch(() => {});
      }
    }

    // 4. Thumbs & Scroll
    thumbs.forEach(t => t.removeAttribute('aria-current'));
    const activeThumb = thumbs[i];
    activeThumb.setAttribute('aria-current', 'true');
    
    if (thumbsContainer) {
      const thumbRect = activeThumb.getBoundingClientRect();
      const containerRect = thumbsContainer.getBoundingClientRect();
      const scrollLeft = thumbsContainer.scrollLeft + (thumbRect.left - containerRect.left) - (containerRect.width / 2) + (thumbRect.width / 2);
      thumbsContainer.scrollTo({
        left: scrollLeft,
        behavior: reduced ? 'auto' : 'smooth'
      });
    }

    // 5. Progress & Dots
    if (progressBar) {
      progressBar.style.width = ((i + 1) / N * 100) + '%';
    }
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === i);
    });

    // 6. Update state
    current = i;

    // 7. Hash
    if (updateHash) {
      history.replaceState(null, '', '#' + slides[i].id);
    }

    // 8. Focus
    if (focusThumb && activeThumb) {
      activeThumb.focus({ preventScroll: true });
    }

    // 9. Preload neighbours: next video metadata, next/previous still images
    const nextIndex = (i + 1) % N;
    const nextSlide = slides[nextIndex];
    const nextMedia = nextSlide.querySelector('.a2-media');
    if (nextMedia && nextMedia.tagName === 'VIDEO') {
      ensureSrc(nextMedia, 'metadata');
    }
    [newSlide, nextSlide, slides[(i - 1 + N) % N]].forEach(eagerImg);
  }

  // Initial State
  function init() {
    const hash = location.hash.slice(1);
    const targetSlide = hash ? document.getElementById(hash) : null;
    const targetIndex = targetSlide && targetSlide.classList.contains('a2-slide') ? Number(targetSlide.dataset.index) : 0;
    if (targetIndex !== 0) {
      go(targetIndex, { updateHash: false });
    } else {
      applyTheme(slides[0]);
      // Slide 0 is active in the markup; only now give its video a source.
      const firstVideo = slides[0].querySelector('video.a2-media');
      if (firstVideo) {
        ensureSrc(firstVideo);
        if (!reduced) firstVideo.play().catch(() => {});
      }
    }

    // Preload neighbour (slide 1) metadata after load
    window.addEventListener('load', () => {
      const nextIndex = (current + 1) % N;
      const nextSlide = slides[nextIndex];
      const nextMedia = nextSlide.querySelector('.a2-media');
      if (nextMedia && nextMedia.tagName === 'VIDEO') {
        ensureSrc(nextMedia, 'metadata');
      }
    });

  }

  // Visibility Change
  document.addEventListener('visibilitychange', () => {
    const activeSlide = slides[current];
    const media = activeSlide.querySelector('.a2-media');
    if (media && media.tagName === 'VIDEO') {
      if (document.hidden) {
        media.pause();
      } else if (!reduced) {
        media.play().catch(() => {});
      }
    }
  });

  // Hash Change
  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1);
    if (hash) {
      const targetSlide = document.getElementById(hash);
      if (targetSlide && targetSlide.classList.contains('a2-slide')) {
        go(Number(targetSlide.dataset.index), { updateHash: false });
      }
    }
  });

  // Controls
  thumbs.forEach(btn => {
    btn.addEventListener('click', () => {
      go(Number(btn.dataset.index));
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => go(current - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => go(current + 1));
  }

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    
    // a synthetic keydown can target document / window (no classList): use <body>
    const target = e.target instanceof Element ? e.target : document.body;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    const isThumbFocused = target.classList.contains('a2-thumb');
    const focusOpt = { focusThumb: isThumbFocused };
    // With a thumbnail focused, arrows move from that thumbnail (roving focus).
    const base = isThumbFocused ? Number(target.dataset.index) : current;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(base - 1, focusOpt);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(base + 1, focusOpt);
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0, focusOpt);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(N - 1, focusOpt);
    }
  });

  // Swipe
  const mainEl = document.querySelector('main.a2');
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let tracking = false;

  if (mainEl) {
    mainEl.addEventListener('touchstart', (e) => {
      // Ignore if starting inside thumbs (the strip scrolls on its own)
      tracking = !e.target.closest('.a2-thumbs');
      if (!tracking) return;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    mainEl.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      
      const dx = endX - touchStartX;
      const dy = endY - touchStartY;
      const duration = endTime - touchStartTime;

      if (duration < 800 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) {
          go(current + 1);
        } else {
          go(current - 1);
        }
      }
    }, { passive: true });
  }

  init();

})();
