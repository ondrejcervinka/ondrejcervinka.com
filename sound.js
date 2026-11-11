(function () {
  'use strict';

  var STORAGE_KEY = 'oc-sound';
  var stateOn = false;
  var interacted = (navigator.userActivation && navigator.userActivation.hasBeenActive) || false;

  // --- Storage Helpers ---

  function saveState(val) {
    try {
      localStorage.setItem(STORAGE_KEY, val);
    } catch (e) {
      // Storage blocked or unavailable
    }
  }

  function loadState() {
    try {
      var val = localStorage.getItem(STORAGE_KEY);
      if (val === 'on') return true;
      if (val === 'off') return false;
    } catch (e) {
      // Storage blocked or unavailable
    }
    return false; // Default off
  }

  // --- Core Logic ---

  function toggleSound() {
    stateOn = !stateOn;
    interacted = true; // The click itself counts as interaction
    saveState(stateOn ? 'on' : 'off');
    render();
    applyAll();
  }

  function hasAudio(video) {
    if (video.mozHasAudio === true) return true;
    if (video.mozHasAudio === false) return false;

    if (typeof video.webkitAudioDecodedByteCount !== 'undefined' && video.currentTime > 0) {
      if (video.webkitAudioDecodedByteCount > 0) return true;
      return false;
    }

    if (video.audioTracks && video.audioTracks.length > 0) return true;
    if (video.audioTracks && video.audioTracks.length === 0) return false;

    // Unknown
    return null;
  }

  function applyTo(video) {
    if (stateOn === false) {
      video.muted = true;
      return;
    }

    // Sound is ON
    // Only unmute if playing, not ended, and after a user gesture
    // (browsers refuse unmuted playback before the first interaction)
    if (interacted && !video.paused && !video.ended) {
      var audioCheck = hasAudio(video);
      
      // If we know it has no audio, leave muted. 
      // If unknown (null) or true, try to unmute.
      if (audioCheck !== false) {
        video.muted = false;

        // Check if browser paused it because of unmute policy
        setTimeout(function () {
          if (video.paused) {
            video.muted = true;
            video.play().catch(function () { /* ignore */ });
          }
        }, 0);
      }
    }
  }

  function applyAll() {
    var videos = document.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) {
      applyTo(videos[i]);
    }
  }

  function render() {
    var buttons = document.querySelectorAll('.sound-toggle');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var iconOff = btn.querySelector('.icon-sound-off');
      var iconOn = btn.querySelector('.icon-sound-on');

      if (stateOn) {
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Sound on');
        if (iconOff) iconOff.style.display = 'none';
        if (iconOn) iconOn.style.display = '';
      } else {
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Sound off');
        if (iconOff) iconOff.style.display = '';
        if (iconOn) iconOn.style.display = 'none';
      }
    }
  }

  // --- Initialization & Events ---

  function init() {
    stateOn = loadState();
    render();
    applyAll();

    // Button Clicks
    var buttons = document.querySelectorAll('.sound-toggle');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', toggleSound);
    }

    // Video Events (Capture phase)
    document.addEventListener('play', function (e) {
      if (e.target instanceof HTMLVideoElement) {
        applyTo(e.target);
      }
    }, true);

    document.addEventListener('playing', function (e) {
      if (e.target instanceof HTMLVideoElement) {
        applyTo(e.target);
      }
    }, true);

    document.addEventListener('loadedmetadata', function (e) {
      if (e.target instanceof HTMLVideoElement) {
        applyTo(e.target);
      }
    }, true);

    // Audio info is often unknown when playback starts (Chrome reports decoded
    // audio bytes only after a few frames). Once it is known that a video has no
    // audio track, keep it muted.
    document.addEventListener('timeupdate', function (e) {
      var v = e.target;
      if (stateOn && v instanceof HTMLVideoElement && !v.muted && hasAudio(v) === false) {
        v.muted = true;
      }
    }, true);

    // User Interaction Gate
    var interactionHandler = function () {
      interacted = true;
      applyAll();
    };

    document.addEventListener('pointerdown', interactionHandler, { capture: true, passive: true, once: true });
    document.addEventListener('keydown', interactionHandler, { capture: true, passive: true, once: true });
    document.addEventListener('touchstart', interactionHandler, { capture: true, passive: true, once: true });

    // Cross-tab sync
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) {
        stateOn = (e.newValue === 'on');
        render();
        applyAll();
      }
    });
  }

  // Run immediately since script is deferred
  init();

  // Expose API
  window.ocSound = {
    isOn: function () { return stateOn; },
    apply: applyAll
  };

})();
