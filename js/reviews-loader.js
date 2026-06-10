/* ============================================================
   js/reviews-loader.js — Carrega e renderiza avaliações reais
   ------------------------------------------------------------
   Chama o backend em /api/google-places (proxy para a Google
   Places API) e, em caso de sucesso, substitui as 3 reviews
   hardcoded no HTML por até 5 reviews reais + nota agregada
   verdadeira.

   Progressive enhancement: se a API cair, env vars sumirem ou
   o usuário estiver offline, o HTML original permanece visível.
   Nunca mostra "loading vazio" ou tela quebrada.
   ============================================================ */

(function () {
  "use strict";

  // Endpoint do nosso proxy serverless. Se renomear api/google-places.js,
  // tem que atualizar esta string também — o nome do arquivo VIRA o path.
  const API_URL = "/api/google-places";
  const AVATAR_VARIANTS = ["A", "B", "C", "D", "E", "F"];

  /* -------- Utilitários -------- */

  // Hash leve para mapear nome → cor de avatar de forma estável
  // (mesma pessoa sempre cai na mesma cor entre carregamentos).
  function pickAvatarVariant(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) | 0;
    }
    return AVATAR_VARIANTS[Math.abs(h) % AVATAR_VARIANTS.length];
  }

  // Escape contra XSS — texto de review é UGC (user-generated content).
  // O Google modera, mas confiança zero é o padrão correto.
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

  // Trunca reviews longas pra não quebrar o layout dos cards.
  function truncate(text, max = 280) {
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  /* -------- Renderização -------- */

  function renderReviewCard(r, mapsUri) {
    const initial = (r.author[0] || "C").toUpperCase();
    const variant = pickAvatarVariant(r.author);

    // Foto do Google se houver; senão letra inicial em fundo colorido.
    // onerror garante fallback se a URL da foto quebrar (Google muda CDN às vezes).
    const avatarInner = r.photo
      ? `<img src="${escapeHtml(r.photo)}" alt="" loading="lazy"
              referrerpolicy="no-referrer"
              onerror="this.replaceWith(Object.assign(document.createTextNode('${escapeHtml(initial)}'),{}))"
              style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
      : escapeHtml(initial);

    // Nome → link pro perfil do autor no Google (se houver authorUri)
    const nameHtml = r.authorUri
      ? `<a class="review-card__name review-card__name--link"
            href="${escapeHtml(r.authorUri)}"
            target="_blank" rel="noopener nofollow">${escapeHtml(r.author)}</a>`
      : `<div class="review-card__name">${escapeHtml(r.author)}</div>`;

    // "via Google" → link pro perfil do negócio no Maps (todas as reviews)
    const sourceHtml = mapsUri
      ? `<a class="review-card__source review-card__source--link"
            href="${escapeHtml(mapsUri)}"
            target="_blank" rel="noopener">
           <span class="google-g"></span> via Google
         </a>`
      : `<span class="review-card__source">
           <span class="google-g"></span> via Google
         </span>`;

    return `
      <article class="review-card">
        <div class="review-card__head">
          <div class="review-card__avatar avatar--${variant}">${avatarInner}</div>
          <div>
            ${nameHtml}
            <div class="review-card__meta">${escapeHtml(r.relativeTime)}</div>
          </div>
        </div>
        <div class="review-card__stars" aria-label="${r.rating} estrelas">${starsString(r.rating)}</div>
        <p class="review-card__text">"${escapeHtml(truncate(r.text))}"</p>
        ${sourceHtml}
      </article>
    `;
  }

  function updateSummary(data) {
    const scoreEl = document.querySelector(".reviews__summary-score");
    const textEl  = document.querySelector(".reviews__summary-text");
    if (scoreEl && data.rating) {
      scoreEl.textContent = data.rating.toFixed(1).replace(".", ",");
    }
    if (textEl && data.total) {
      textEl.textContent = `${data.total} avaliações · Google`;
    }
  }

  // Preenche TODOS os <a data-google-link> da página com a URL real do
  // perfil do negócio no Maps. Usado no botão "Ver todas no Google" do
  // header de reviews e no "Abrir no Google Maps" da seção do mapa.
  function updateGoogleLinks(mapsUri) {
    if (!mapsUri) return;
    document.querySelectorAll("[data-google-link]").forEach((el) => {
      el.setAttribute("href", mapsUri);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });
  }

  function updateReviewsGrid(reviews, mapsUri) {
    const grid = document.querySelector(".reviews__grid");
    if (!grid || !reviews.length) return;
    grid.innerHTML = reviews.map((r) => renderReviewCard(r, mapsUri)).join("");
  }

  /* -------- Fluxo principal -------- */

  async function loadReviews() {
    try {
      const r = await fetch(API_URL, { cache: "default" });
      if (!r.ok) {
        console.warn("[reviews-loader] API respondeu", r.status, "- mantendo fallback");
        return;
      }

      const data = await r.json();
      if (!data.reviews || !data.reviews.length) {
        console.warn("[reviews-loader] resposta sem reviews - mantendo fallback");
        return;
      }

      updateSummary(data);
      updateGoogleLinks(data.googleMapsUri);
      updateReviewsGrid(data.reviews, data.googleMapsUri);
    } catch (err) {
      console.warn("[reviews-loader] falha ao carregar:", err.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadReviews);
  } else {
    loadReviews();
  }
})();
