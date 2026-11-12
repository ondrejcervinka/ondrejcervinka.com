/* Homepage video controls (Ondrej 2026-11-12): the main video of every slide and the
   lightbox video get the same controls as the project pages (NEVA hero): play/pause,
   replay, clickable timeline. Shown on hover (mouse), on tap (touch) and on keyboard
   focus. The overlay is a sibling of the <video> (the homepage sizes the video itself
   in several layouts), kept on top of it with a ResizeObserver.
   - pause is per video; home-a2.js still plays the main video when its slide becomes
     active again
   - controls never switch the project: taps / drags inside stop the swipe, and
     ArrowLeft / ArrowRight are not handled here (they still switch projects) */
(function () {
  'use strict';

  var PAUSE = '<svg class="icon-pause" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  var PLAY = '<svg class="icon-play" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:none"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  var REPLAY = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
  var HIDE_AFTER = 3000; // touch: hide again after 3 s without interaction

  function attach(video) {
    var host = video.parentElement;
    var ov = document.createElement('div');
    ov.className = 'video-overlay a2-vctrl';
    ov.innerHTML =
      '<div class="video-controls">' +
        '<button class="video-ctrl-btn video-toggle" type="button" aria-label="Pause video">' + PAUSE + PLAY + '</button>' +
        '<button class="video-ctrl-btn video-replay" type="button" aria-label="Replay video" style="opacity:0;pointer-events:none">' + REPLAY + '</button>' +
      '</div>' +
      '<div class="video-timeline" role="slider" aria-label="Video progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
        '<div class="video-timeline-track"><div class="video-timeline-progress"></div></div>' +
      '</div>';
    video.insertAdjacentElement('afterend', ov);

    var toggle = ov.querySelector('.video-toggle');
    var replay = ov.querySelector('.video-replay');
    var tl = ov.querySelector('.video-timeline');
    var track = ov.querySelector('.video-timeline-track');
    var progress = ov.querySelector('.video-timeline-progress');

    // keep the overlay exactly on the video (same offsetParent)
    function place() {
      ov.style.left = video.offsetLeft + 'px';
      ov.style.top = video.offsetTop + 'px';
      ov.style.width = video.offsetWidth + 'px';
      ov.style.height = video.offsetHeight + 'px';
    }
    if (window.ResizeObserver) {
      // the video can also move without resizing (e.g. centred / bottom-aligned)
      var ro = new ResizeObserver(place);
      ro.observe(video);
      ro.observe(host);
    }
    window.addEventListener('resize', place);
    place();

    function setPaused(paused) {
      toggle.querySelector('.icon-play').style.display = paused ? '' : 'none';
      toggle.querySelector('.icon-pause').style.display = paused ? 'none' : '';
      replay.style.opacity = paused ? '1' : '0';
      replay.style.pointerEvents = paused ? 'auto' : 'none';
      toggle.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    }
    video.addEventListener('pause', function () { setPaused(true); });
    video.addEventListener('ended', function () { setPaused(true); });
    video.addEventListener('play', function () { setPaused(false); });
    setPaused(video.paused);

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (video.paused) video.play().catch(function () {}); else video.pause();
      poke();
    });
    replay.addEventListener('click', function (e) {
      e.stopPropagation();
      video.currentTime = 0;
      video.play().catch(function () {});
      poke();
    });

    video.addEventListener('timeupdate', function () {
      if (!video.duration) return;
      var pct = video.currentTime / video.duration * 100;
      progress.style.width = pct + '%';
      tl.setAttribute('aria-valuenow', String(Math.round(pct)));
    });

    // timeline: click / drag (mouse, pen, touch)
    function seek(e) {
      if (!video.duration) return;
      var r = track.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      video.currentTime = pct * video.duration;
      progress.style.width = pct * 100 + '%';
    }
    var scrubbing = false;
    tl.addEventListener('pointerdown', function (e) {
      scrubbing = true;
      if (tl.setPointerCapture) tl.setPointerCapture(e.pointerId);
      seek(e);
      poke();
    });
    tl.addEventListener('pointermove', function (e) { if (scrubbing) seek(e); });
    tl.addEventListener('pointerup', function () { scrubbing = false; });
    tl.addEventListener('pointercancel', function () { scrubbing = false; });
    tl.addEventListener('click', function (e) { e.stopPropagation(); });

    // no project swipe from inside the controls (home-a2.js listens on main.a2)
    ['touchstart', 'touchend'].forEach(function (t) {
      ov.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true });
    });

    // visibility: hover (mouse), tap (touch), keyboard focus
    var hideTimer = 0;
    function show(on) {
      ov.classList.toggle('is-shown', on);
      video.classList.toggle('a2-vdim', on);
    }
    function poke() { // touch: keep shown a while after an interaction
      if (!ov.matches(':hover') || touchMode) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
          if (!ov.contains(document.activeElement)) show(false);
        }, HIDE_AFTER);
      }
    }
    var touchMode = false;
    function enter(e) { if (e.pointerType === 'mouse') show(true); }
    function leave(e) {
      if (e.pointerType !== 'mouse') return;
      var to = e.relatedTarget;
      if (to && (to === video || ov.contains(to))) return;
      if (!ov.contains(document.activeElement)) show(false);
    }
    video.addEventListener('pointerenter', enter);
    ov.addEventListener('pointerenter', enter);
    video.addEventListener('pointerleave', leave);
    ov.addEventListener('pointerleave', leave);
    // a tap on the video (or on the empty overlay) shows / hides the controls
    function tap(e) {
      if (e.pointerType === 'mouse') return;
      touchMode = true;
      if (e.target.closest && e.target.closest('.video-ctrl-btn, .video-timeline')) return;
      var on = !ov.classList.contains('is-shown');
      show(on);
      if (on) poke();
    }
    video.addEventListener('pointerup', tap);
    ov.addEventListener('pointerup', tap);
    ov.addEventListener('focusin', function () { show(true); });
    ov.addEventListener('focusout', function (e) {
      if (!ov.contains(e.relatedTarget) && !ov.matches(':hover')) show(false);
    });

    return { place: place, show: show };
  }

  var ctrls = [];
  document.querySelectorAll('.a2-group > video.a2-media').forEach(function (v) {
    ctrls.push(attach(v));
  });
  var lbv = document.getElementById('lightbox-video');
  if (lbv) ctrls.push(attach(lbv));

  // re-place when a slide or the lightbox becomes visible (sizes were 0 while hidden)
  function replaceAll() { ctrls.forEach(function (c) { c.place(); }); }
  document.querySelectorAll('.a2-slide').forEach(function (s) {
    new MutationObserver(function () {
      replaceAll();
      if (!s.classList.contains('is-active')) {
        var ov = s.querySelector('.a2-vctrl');
        if (ov) {
          ov.classList.remove('is-shown');
          // focus must not stay on a control inside a hidden slide
          if (ov.contains(document.activeElement)) document.activeElement.blur();
        }
        var v = s.querySelector('video.a2-media');
        if (v) v.classList.remove('a2-vdim');
      }
    }).observe(s, { attributes: true, attributeFilter: ['class'] });
  });
  new MutationObserver(replaceAll).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
