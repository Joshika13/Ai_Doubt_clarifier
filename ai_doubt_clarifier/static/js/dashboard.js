/* =========================================================
   dashboard.js — animate progress bars on page load
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Trigger CSS-transition on progress bars after a short delay
  // (main.js IntersectionObserver handles the general .reveal elements,
  //  but dashboard-specific bars need the --pct custom property resolved)
  const fills = document.querySelectorAll('.subject-progress-fill, .stat-card-fill');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        // Read target from inline style property --pct or width
        const pct = getComputedStyle(el).getPropertyValue('--pct').trim()
          || el.getAttribute('style')?.match(/width:\s*([^;]+)/)?.[1]
          || '0%';
        el.style.width = '0%';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { el.style.width = pct; });
        });
        io.unobserve(el);
      }
    });
  }, { threshold: 0.2 });

  fills.forEach(f => io.observe(f));
});
