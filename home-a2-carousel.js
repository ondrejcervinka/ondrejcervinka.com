(function () {
  'use strict';

  var reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  var CAROUSEL_INTERVAL = 4000;

  function initCarousel(group) {
    var carousel = group.querySelector('.a2-carousel');
    var track = group.querySelector('.a2-car-track');
    var items = track ? track.querySelectorAll('li') : [];
    var countEl = group.querySelector('.a2-car-count');
    var prevBtn = group.querySelector('.a2-car-prev');
    var nextBtn = group.querySelector('.a2-car-next');

    if (!track || !items.length || !countEl) return;

    var n = items.length;
    var index = 0;
    var timerId = null;
    var isPointerOver = false;
    var hasFocusInside = false;
    var touchStartX = 0;
    var touchStartY = 0;
    var touchStartTime = 0;

    function show(i) {
      index = (i % n + n) % n;

      for (var k = 0; k < n; k++) {
        if (items[k]) {
          items[k].classList.remove('is-current');
        }
      }

      if (items[index]) {
        items[index].classList.add('is-current');
      }

      var textNode = document.createTextNode((index + 1) + ' / ' + n);
      while (countEl.firstChild) {
        countEl.removeChild(countEl.firstChild);
      }
      countEl.appendChild(textNode);
    }

    function tick() {
      if (reducedMotionQuery.matches) return;

      var slide = group.closest('.a2-slide');
      if (!slide || !slide.classList.contains('is-active')) return;
      if (document.visibilityState !== 'visible') return;
      if (document.body.classList.contains('lightbox-open')) return;
      if (isPointerOver) return;
      if (hasFocusInside) return;

      show(index + 1);
    }

    function startTimer() {
      stopTimer();
      timerId = setInterval(tick, CAROUSEL_INTERVAL);
    }

    function stopTimer() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    // Button clicks
    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        show(index - 1);
        startTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        show(index + 1);
        startTimer();
      });
    }

    // Touch swipe on carousel container
    if (carousel) {
      carousel.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        e.stopPropagation();
      }, { passive: true });

      carousel.addEventListener('touchend', function (e) {
        var endX = e.changedTouches[0].clientX;
        var endY = e.changedTouches[0].clientY;
        var dx = endX - touchStartX;
        var dy = endY - touchStartY;
        var duration = Date.now() - touchStartTime;

        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5 && duration < 800) {
          if (dx < 0) {
            show(index + 1);
          } else {
            show(index - 1);
          }
          startTimer();
        }
        e.stopPropagation();
      }, { passive: true });
    }

    // Pointer hover detection
    group.addEventListener('mouseenter', function () {
      isPointerOver = true;
    });
    group.addEventListener('mouseleave', function () {
      isPointerOver = false;
    });

    // Focus detection inside group
    group.addEventListener('focusin', function () {
      hasFocusInside = true;
    });
    group.addEventListener('focusout', function () {
      hasFocusInside = false;
    });

    // Reduced motion change
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', function () {
        if (reducedMotionQuery.matches) {
          stopTimer();
        } else {
          startTimer();
        }
      });
    } else if (reducedMotionQuery.addListener) {
      reducedMotionQuery.addListener(function () {
        if (reducedMotionQuery.matches) {
          stopTimer();
        } else {
          startTimer();
        }
      });
    }

    // Watch slide activation
    var slide = group.closest('.a2-slide');
    if (slide) {
      var observer = new MutationObserver(function () {
        if (slide.classList.contains('is-active')) {
          startTimer();
        } else {
          stopTimer();
        }
      });

      observer.observe(slide, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // Initial setup
    show(0);
    if (!reducedMotionQuery.matches) {
      startTimer();
    }
  }

  var carousels = document.querySelectorAll('.a2-group--carousel');
  for (var i = 0; i < carousels.length; i++) {
    initCarousel(carousels[i]);
  }

})();
