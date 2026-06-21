/* =========================================================
   home.js — particle canvas for hero background
   ========================================================= */

(function () {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles;

  // Respect reduced-motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { canvas.style.display = 'none'; return; }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x:   Math.random() * W,
      y:   Math.random() * H,
      r:   Math.random() * 1.4 + 0.4,
      dx:  (Math.random() - 0.5) * 0.35,
      dy:  (Math.random() - 0.5) * 0.35,
      // Pick from the accent palette
      hue: [250, 170, 320][Math.floor(Math.random() * 3)],
      opacity: Math.random() * 0.5 + 0.15,
    };
  }

  function initParticles() {
    const count = Math.min(Math.floor((W * H) / 14000), 90);
    particles = Array.from({ length: count }, makeParticle);
  }

  // Connection lines between close particles
  function drawConnections() {
    const threshold = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < threshold) {
          const alpha = (1 - dist / threshold) * 0.15;
          ctx.beginPath();
          ctx.strokeStyle = `hsla(250, 70%, 70%, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();

    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      // Wrap around edges
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 72%, ${p.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(tick);
  }

  resize();
  initParticles();
  tick();

  window.addEventListener('resize', () => { resize(); initParticles(); }, { passive: true });
})();

// ── Smooth-scroll for anchor links ────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
