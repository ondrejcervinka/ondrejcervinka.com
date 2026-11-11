/* Custom cursor, shared by every page (loaded with defer).
   The system cursor is hidden ONLY while this script runs on a device with a mouse:
   it adds html.has-cursor, and style.css hides the system cursor under that class.
   Without JS, on touch devices, or if this file fails, the normal cursor stays. */
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var cursor = document.getElementById('cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.id = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
  }
  cursor.style.opacity = '0'; // until the first mouse move
  document.documentElement.classList.add('has-cursor');

  // Elements that enlarge the cursor (event delegation: works for elements added
  // or changed later - lightbox, homepage slides, strips, thumbnails).
  var HOVER = 'a, button, [role="button"], .fig-img-wrap, .a2-sub-media, .a2-thumb, video, label, input, select, textarea';

  document.addEventListener('mousemove', function (e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursor.style.opacity = '';
  }, { passive: true });

  document.addEventListener('mouseover', function (e) {
    var t = e.target && e.target.closest ? e.target.closest(HOVER) : null;
    cursor.classList.toggle('expanded', !!t);
  }, { passive: true });

  // Hide when the mouse leaves the window, show again when it comes back.
  document.documentElement.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
  document.documentElement.addEventListener('mouseenter', function () { cursor.style.opacity = ''; });

  // Lightbox styling of the cursor follows body.lightbox-open (set by every lightbox).
  function syncLightbox() {
    cursor.classList.toggle('in-lightbox', document.body.classList.contains('lightbox-open'));
  }
  new MutationObserver(syncLightbox).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  syncLightbox();
})();
