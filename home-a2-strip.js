(function () {
  'use strict';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var lightbox = document.getElementById('lightbox');
  var lightboxVideo = document.getElementById('lightbox-video');
  var lightboxClose = document.getElementById('lightbox-close');
  var lightboxPrev = document.getElementById('lightbox-prev');
  var lightboxNext = document.getElementById('lightbox-next');

  var activeSlide = null;
  var lbIndex = 0; // index of the item shown in the lightbox
  var wasPlaying = [];
  var previousFocus = null;

  function activate(slide) {
    var items = slide.querySelectorAll('.a2-sub-media');
    items.forEach(function (video) {
      if (reduced) return; // posters only
      if (video.dataset.src && !video.hasAttribute('src')) {
        video.src = video.dataset.src;
      }
      video.play().catch(function () {}); // also when coming back to the slide
    });
  }

  function deactivate(slide) {
    var items = slide.querySelectorAll('.a2-sub-media');
    items.forEach(function (video) {
      video.pause();
    });
  }

  var states = new WeakMap();

  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      var slide = record.target;
      var isActive = slide.classList.contains('is-active');
      var wasActive = states.get(slide);

      if (isActive !== wasActive) {
        states.set(slide, isActive);
        if (isActive) {
          activeSlide = slide;
          activate(slide);
        } else {
          deactivate(slide);
        }
      }
    });
  });

  var slides = document.querySelectorAll('.a2-slide');
  slides.forEach(function (slide) {
    states.set(slide, slide.classList.contains('is-active'));
    observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
  });

  requestAnimationFrame(function () {
    activeSlide = document.querySelector('.a2-slide.is-active');
    if (activeSlide) activate(activeSlide);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (activeSlide) deactivate(activeSlide);
    } else {
      if (!reduced && !lightbox.classList.contains('is-open') && activeSlide) {
        activate(activeSlide);
      }
    }
  });

  var stripItems = document.querySelectorAll('.a2-sub-media');
  stripItems.forEach(function (item) {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('click', function () {
      open(item);
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(item);
      }
    });
  });

  function open(item) {
    var slide = item.closest('.a2-slide');
    activeSlide = slide;
    var items = Array.prototype.slice.call(slide.querySelectorAll('.a2-sub-media'));
    lbIndex = Math.max(0, items.indexOf(item));

    lightboxVideo.src = item.dataset.src || item.currentSrc;
    lightboxVideo.load();
    if (!reduced) lightboxVideo.play().catch(function () {});

    lightbox.classList.add('is-open');
    document.body.classList.add('lightbox-open');

    wasPlaying = [];
    items.forEach(function (v) {
      wasPlaying.push(!v.paused);
      v.pause();
    });

    var mainMedia = slide.querySelector('.a2-media');
    if (mainMedia && mainMedia.tagName === 'VIDEO') {
      wasPlaying.main = !mainMedia.paused;
      mainMedia.pause();
    }

    previousFocus = document.activeElement;
    lightboxClose.focus();

    if (items.length > 1) {
      lightboxPrev.style.display = '';
      lightboxNext.style.display = '';
    } else {
      lightboxPrev.style.display = 'none';
      lightboxNext.style.display = 'none';
    }
  }

  function close() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.load();

    if (activeSlide) {
      var items = activeSlide.querySelectorAll('.a2-sub-media');
      items.forEach(function (v, i) {
        if (!reduced && wasPlaying[i]) v.play().catch(function () {});
      });
      var mainMedia = activeSlide.querySelector('.a2-media');
      if (mainMedia && mainMedia.tagName === 'VIDEO' && wasPlaying.main) {
        if (!reduced) mainMedia.play().catch(function () {});
      }
    }

    if (previousFocus) previousFocus.focus();
  }

  function navigate(dir) {
    if (!activeSlide) return;
    var items = Array.prototype.slice.call(activeSlide.querySelectorAll('.a2-sub-media'));
    if (items.length <= 1) return;
    lbIndex = (lbIndex + dir + items.length) % items.length;
    lightboxVideo.src = items[lbIndex].dataset.src || items[lbIndex].currentSrc;
    lightboxVideo.load();
    if (!reduced) lightboxVideo.play().catch(function () {});
  }

  lightboxClose.addEventListener('click', close);
  lightboxPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    navigate(-1);
  });
  lightboxNext.addEventListener('click', function (e) {
    e.stopPropagation();
    navigate(1);
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  window.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    var focusable = [lightboxClose, lightboxPrev, lightboxNext].filter(function (el) {
      return el.style.display !== 'none';
    });
    var idx = focusable.indexOf(document.activeElement);

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopImmediatePropagation();
      navigate(-1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopImmediatePropagation();
      navigate(1);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (idx === -1) focusable[0].focus();
      else if (e.shiftKey) focusable[(idx + focusable.length - 1) % focusable.length].focus();
      else focusable[(idx + 1) % focusable.length].focus();
    }
  }, true);

})();
