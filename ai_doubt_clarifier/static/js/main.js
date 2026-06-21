/* =========================================================
   main.js — shared utilities: navbar, scroll reveal, hamburger
   ========================================================= */

// ── Navbar scroll effect ─────────────────────────────────
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 20
      ? 'rgba(10,10,15,0.96)'
      : 'rgba(10,10,15,0.82)';
  }, { passive: true });
}

// ── Hamburger / mobile menu ──────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    // Animate the three bars
    const spans = hamburger.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  // Close on link click
  mobileMenu.querySelectorAll('.mobile-link').forEach(l => {
    l.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
    });
  });
}

// ── Scroll-reveal (IntersectionObserver) ────────────────
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}

// ── Animate stat/progress bars on visibility ─────────────
const fills = document.querySelectorAll('.stat-card-fill, .subject-progress-fill, .demo-fill');
if (fills.length) {
  const fillIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const pct = el.style.getPropertyValue('--pct') || el.style.width || '0%';
        // Temporarily zero out, then apply target width to trigger CSS transition
        el.style.width = '0%';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { el.style.width = pct; });
        });
        fillIO.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  fills.forEach(f => fillIO.observe(f));
}
