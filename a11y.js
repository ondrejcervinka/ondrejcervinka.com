/* Shared accessibility fixes (UX review 2026-11-12), loaded with defer on every page,
   after the page scripts (timelines exist by then: inline scripts on the project
   pages, home-a2-video.js on the homepage).
   1. Video timeline (role="slider"): focusable, ArrowLeft / ArrowRight = -/+ 5 s,
      Home / End; aria-valuenow follows, aria-valuetext = "0:06 / 1:00". The keys never reach the homepage project
      switch (stopPropagation on the slider itself).
   2. Lightbox: on close, focus goes back to the element that opened it (or, if that
      element cannot take focus, focus leaves the hidden lightbox). */
(function () {
  'use strict';

  // ── 1. Timeline keyboard ──────────────────────────────────────────────────
  var STEP = 5;

  function videoFor(tl) {
    var wrap = tl.closest('.video-wrap');
    if (wrap) return wrap.querySelector('video');
    var ov = tl.closest('.a2-vctrl'); // homepage: overlay is the video's next sibling
    var prev = ov && ov.previousElementSibling;
    return prev && prev.tagName === 'VIDEO' ? prev : null;
  }

  function clock(t) {
    t = Math.max(0, Math.floor(t || 0));
    var s = t % 60;
    return Math.floor(t / 60) + ':' + (s < 10 ? '0' : '') + s;
  }

  function setText(tl, video) {
    if (!video.duration) return;
    tl.setAttribute('aria-valuetext', clock(video.currentTime) + ' / ' + clock(video.duration));
  }

  function setNow(tl, video) {
    if (!video.duration) return;
    var pct = video.currentTime / video.duration * 100;
    tl.setAttribute('aria-valuenow', String(Math.round(pct)));
    setText(tl, video);
    var bar = tl.querySelector('.video-timeline-progress');
    if (bar) bar.style.width = pct + '%';
  }

  function enhance(tl) {
    if (tl.dataset.kbd) return;
    tl.dataset.kbd = '1';
    tl.setAttribute('tabindex', '0');
    var v0 = videoFor(tl);
    if (v0) {
      // time as text for screen readers ("0:06 / 1:00"), kept current while playing
      ['timeupdate', 'loadedmetadata', 'seeked'].forEach(function (ev) {
        v0.addEventListener(ev, function () { setText(tl, v0); });
      });
      setText(tl, v0);
    }
    tl.addEventListener('keydown', function (e) {
      var video = videoFor(tl);
      if (!video || !video.duration) return;
      var t = video.currentTime;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t = Math.min(video.duration, t + STEP);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t = Math.max(0, t - STEP);
      else if (e.key === 'Home') t = 0;
      else if (e.key === 'End') t = Math.max(0, video.duration - 0.05);
      else return;
      e.preventDefault();
      e.stopPropagation(); // homepage: arrows on the slider must not switch the project
      video.currentTime = t;
      setNow(tl, video);
    });
  }

  document.querySelectorAll('.video-timeline').forEach(enhance);

  // ── 2. Lightbox focus return ─────────────────────────────────────────────
  var lastActivated = null;
  var opener = null;
  var OPENER = 'a, button, [tabindex], [role="button"], video, img, figure, .fig-img-wrap';

  function remember(e) {
    var t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest('.lightbox')) return; // clicks inside the lightbox do not open it
    lastActivated = t.closest(OPENER) || t;
  }
  document.addEventListener('click', remember, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') remember(e);
  }, true);

  function focusable(el) {
    if (!el || !document.contains(el)) return false;
    if (el.tabIndex >= 0) return true;
    return el.matches('a[href], button, input, select, textarea');
  }

  var wasOpen = document.body.classList.contains('lightbox-open');
  new MutationObserver(function () {
    var open = document.body.classList.contains('lightbox-open');
    if (open === wasOpen) return;
    wasOpen = open;
    if (open) {
      opener = lastActivated;
      return;
    }
    var target = opener && (focusable(opener) ? opener : opener.closest('a[href], button, [tabindex]'));
    if (target && focusable(target)) {
      target.focus({ preventScroll: true });
    } else {
      var a = document.activeElement;
      if (a && a.closest && a.closest('.lightbox')) a.blur();
    }
    opener = null;
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
