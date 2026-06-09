/* ============================================================
   animations.js — Header sticky, smooth scroll, contadores leves
   ============================================================ */

/* Header fica fixo ao rolar pra baixo */
function initStickyHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const threshold = 80;
  let lastSticky = false;

  const update = () => {
    const isSticky = window.scrollY > threshold;
    if (isSticky !== lastSticky) {
      header.classList.toggle("is-sticky", isSticky);
      lastSticky = isSticky;
    }
  };

  update();
  window.addEventListener("scroll", () => {
    window.requestAnimationFrame(update);
  }, { passive: true });
}

/* Smooth scroll para âncoras internas (compensando header sticky) */
function initSmoothLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = 70;
      const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initStickyHeader();
  initSmoothLinks();
});
