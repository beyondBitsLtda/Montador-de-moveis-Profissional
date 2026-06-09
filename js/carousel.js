/* ============================================================
   carousel.js — Controle dos dots do showcase
   ------------------------------------------------------------
   Funciona em cima de scroll-snap nativo (CSS). O JS apenas:
   - sincroniza qual dot está ativo conforme o usuário rola
   - clicar no dot rola até o respectivo card
   ============================================================ */

function initCarousel() {
  const tracks = document.querySelectorAll("[data-carousel]");
  tracks.forEach((track) => {
    const dotsContainer = document.querySelector(
      `[data-carousel-dots="${track.dataset.carousel}"]`
    );
    const cards = Array.from(track.children);
    if (!dotsContainer || cards.length === 0) return;

    // Gera os dots
    dotsContainer.innerHTML = "";
    const dots = cards.map((_, i) => {
      const btn = document.createElement("button");
      btn.className = "showcase__dot";
      btn.setAttribute("aria-label", `Ir para item ${i + 1}`);
      btn.addEventListener("click", () => {
        const card = cards[i];
        // Centraliza horizontalmente o card dentro do TRACK,
        // SEM rolar a página verticalmente.
        const trackRect = track.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const delta =
          cardRect.left - trackRect.left -
          (trackRect.width - cardRect.width) / 2;
        track.scrollBy({ left: delta, behavior: "smooth" });
      });
      dotsContainer.appendChild(btn);
      return btn;
    });

    // Marca o dot ativo conforme rolagem
    const setActive = () => {
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let closestIdx = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const cardCenter = r.left + r.width / 2;
        const dist = Math.abs(center - cardCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });
      dots.forEach((d, i) => d.classList.toggle("is-active", i === closestIdx));
    };

    setActive();
    track.addEventListener("scroll", () => {
      window.requestAnimationFrame(setActive);
    });
    window.addEventListener("resize", setActive);
  });
}

document.addEventListener("DOMContentLoaded", initCarousel);
