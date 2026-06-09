/* ============================================================
   js/reviews.js — Carrega avaliações reais do Google
   ------------------------------------------------------------
   Estratégia de progressive enhancement:
   - O HTML já vem com 3 reviews hardcoded (fallback de SEO e
     resiliência a falhas).
   - Este script TENTA buscar /api/reviews. Se obtiver sucesso,
     substitui o conteúdo (até 5 reviews + nota agregada real).
   - Se falhar (sem internet, API caiu, env vars erradas), o
     fallback hardcoded permanece — o usuário nunca vê "loading
     vazio" ou tela quebrada.

   Roda só depois do DOMContentLoaded e usa fetch nativo — sem
   dependências.
   ============================================================ */

(function () {
  "use strict";

  const API_URL = "/api/reviews";
  const AVATAR_VARIANTS = ["A", "B", "C", "D", "E", "F"];

  /* -------- Utilitários -------- */

  // Hash leve para mapear o nome do autor a uma das 6 cores de avatar
  // de forma estável (mesma pessoa → mesma cor entre cargas de página).
  function pickAvatarVariant(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) | 0;
    }
    return AVATAR_VARIANTS[Math.abs(h) % AVATAR_VARIANTS.length];
  }

  // Escape para evitar XSS — texto de review é UGC (user-generated
  // content). O Google modera, mas confiança zero é o padrão.
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }

  function starsString(n) {
    const filled = Math.max(0, Math.min(5, Math.round(n)));
    return "★".repeat(filled) + "☆".repeat(5 - filled);
  }

  // Trunca reviews muito longas pra não quebrar o layout dos cards.
  // 280 caracteres é o limite do "primeiro parágrafo" que faz sentido
  // em um card — quem quiser mais clica no Google.
  function truncate(text, max = 280) {
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  /* -------- Renderização -------- */

  function renderReviewCard(r) {
    const initial = (r.author[0] || "C").toUpperCase();
    const variant = pickAvatarVariant(r.author);

    // Foto do Google se existir, senão letra inicial em fundo colorido.
    // O atributo onerror garante que se a URL da foto quebrar (Google
    // muda CDN às vezes), o avatar volta pro padrão de letra.
    const avatarInner = r.photo
      ? `<img src="${escapeHtml(r.photo)}" alt="" loading="lazy"
              referrerpolicy="no-referrer"
              onerror="this.replaceWith(Object.assign(document.createTextNode('${escapeHtml(initial)}'),{}))"
              style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
      : escapeHtml(initial);

    return `
      <article class="review-card">
        <div class="review-card__head">
          <div class="review-card__avatar avatar--${variant}">${avatarInner}</div>
          <div>
            <div class="review-card__name">${escapeHtml(r.author)}</div>
            <div class="review-card__meta">${escapeHtml(r.relativeTime)}</div>
          </div>
        </div>
        <div class="review-card__stars" aria-label="${r.rating} estrelas">${starsString(r.rating)}</div>
        <p class="review-card__text">"${escapeHtml(truncate(r.text))}"</p>
        <span class="review-card__source"><span class="google-g"></span> via Google</span>
      </article>
    `;
  }

  function updateSummary(data) {
    const scoreEl = document.querySelector(".reviews__summary-score");
    const textEl = document.querySelector(".reviews__summary-text");
    if (scoreEl && data.rating) {
      // toFixed(1) com vírgula no padrão BR
      scoreEl.textContent = data.rating.toFixed(1).replace(".", ",");
    }
    if (textEl && data.total) {
      textEl.textContent = `${data.total} avaliações · Google`;
    }
  }

  function updateReviewsGrid(reviews) {
    const grid = document.querySelector(".reviews__grid");
    if (!grid || !reviews.length) return;
    // O Google retorna no MÁXIMO 5 reviews — limite oficial da API.
    // Pegamos todas que vieram.
    grid.innerHTML = reviews.map(renderReviewCard).join("");
  }

  /* -------- Fluxo principal -------- */

  async function loadReviews() {
    try {
      const r = await fetch(API_URL, {
        // O CDN da Vercel já cuida do cache — o browser não precisa
        // adicionar nada por cima. "default" deixa o navegador
        // respeitar o que o servidor mandar via Cache-Control.
        cache: "default",
      });

      if (!r.ok) {
        // 5xx ou 4xx — silenciamos no console em vez de console.error
        // pra não poluir logs em produção. Fallback HTML segue intacto.
        console.warn("[reviews] API respondeu", r.status, "- mantendo fallback");
        return;
      }

      const data = await r.json();

      if (!data.reviews || !data.reviews.length) {
        console.warn("[reviews] resposta sem reviews - mantendo fallback");
        return;
      }

      updateSummary(data);
      updateReviewsGrid(data.reviews);
    } catch (err) {
      // Network error, JSON parse error, etc. Fallback HTML segue.
      console.warn("[reviews] falha ao carregar:", err.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadReviews);
  } else {
    loadReviews();
  }
})();
