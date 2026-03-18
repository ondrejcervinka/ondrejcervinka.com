/* ─── Custom Cursor ─────────────────────────────────────── */
const cursor = document.getElementById('cursor');

if (cursor) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  document.querySelectorAll('.project-media, a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('expanded'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('expanded'));
  });
}

/* ─── Scroll Reveal ─────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Slight stagger based on position in viewport batch
      const delay = (i % 2) * 80;
      setTimeout(() => {
        entry.target.classList.add('in-view');
      }, delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.07,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal, .intro-text').forEach(el => {
  revealObserver.observe(el);
});
