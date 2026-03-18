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

/* ─── Blob Parallax ─────────────────────────────────────── */
const blobs = document.querySelectorAll('.blob');

if (blobs.length) {
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - 0.5);
    const y = (e.clientY / window.innerHeight - 0.5);

    blobs.forEach((blob, i) => {
      const depth = (i + 1) * 22;
      blob.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
  });
}

/* ─── Scroll Reveal ─────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const delay = (i % 2) * 100;
      setTimeout(() => entry.target.classList.add('in-view'), delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.07,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
