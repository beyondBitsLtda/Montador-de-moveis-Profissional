/* ============================================================
   carousel.js — Controle dos dots do showcase
   ------------------------------------------------------------
   v2 (junho/2026): refeito com IntersectionObserver pra eliminar
   o "reflow forçado" que o PageSpeed acusava.

   Versão antiga: a cada evento de scroll, fazia
   getBoundingClientRect() do track + de cada card (6 leituras
   sincronizadas por frame) → forçava layout reflow.

   Versão nova: o IntersectionObserver dispara só quando um card
   cruza um limiar definido (50% visível no track). Sem leitura
   de layout, sem reflow, sem bloqueio da main thread.
   ============================================================ */

function initCarousel() {
  const tracks = document.querySelectorAll("[data-carousel]");

  tracks.forEach((track) => {
    const dotsContainer = document.querySelector(
      `[data-carousel-dots="${track.dataset.carousel}"]`
    );
    const cards = Array.from(track.children);
    if (!dotsContainer || cards.length === 0) return;

    // ---------- Gera os dots ----------
    dotsContainer.innerHTML = "";
    const dots = cards.map((_, i) => {
      const btn = document.createElement("button");
      btn.className = "showcase__dot";
      btn.setAttribute("aria-label", `Ir para item ${i + 1}`);
      btn.addEventListener("click", () => {
        const card = cards[i];
        // scrollIntoView com inline:'center' centraliza no track,
        // sem mexer no scroll vertical da página.
        card.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      });
      dotsContainer.appendChild(btn);
      return btn;
    });

    // Estado inicial: o primeiro card é o ativo.
    let currentIdx = 0;
    dots[0].classList.add("is-active");

    // ---------- IntersectionObserver ----------
    // Dispara quando um card cruza ≥60% da área do track. O card
    // mais visível "vence" e vira o ativo. Sem getBoundingClientRect,
    // sem reflow forçado.
    const observer = new IntersectionObserver(
      (entries) => {
        let bestRatio = 0;
        let bestIdx = currentIdx;
        // Combina entries com estado anterior — o ratio das entries
        // sem disparo recente fica em cache implícito pelo browser.
        entries.forEach((entry) => {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIdx = cards.indexOf(entry.target);
          }
        });
        if (bestIdx !== currentIdx && bestRatio > 0.5) {
          dots[currentIdx].classList.remove("is-active");
          dots[bestIdx].classList.add("is-active");
          currentIdx = bestIdx;
        }
      },
      {
        root: track,
        threshold: [0.25, 0.5, 0.75, 1.0],
      }
    );

    cards.forEach((card) => observer.observe(card));
  });
}

document.addEventListener("DOMContentLoaded", initCarousel);
