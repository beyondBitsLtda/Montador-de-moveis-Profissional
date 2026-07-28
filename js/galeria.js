/* ============================================================
   galeria.js — Galerias de fotos por serviço (Cozinha/Quarto/Sala)
   ------------------------------------------------------------
   Layout: masonry (estilo Unsplash/Pinterest) via CSS columns —
   cada foto mantém a proporção original, sem corte em quadrado.
   Performance:
   - As FOTOS não carregam junto com a página. No load, só um JSON
     minúsculo (galeria-manifest.json) é buscado em idle — zero
     imagem baixada até a galeria abrir.
   - Ao abrir, o grid usa loading="lazy": só as miniaturas visíveis
     baixam; o resto vem conforme rola.
   - Cada <img> recebe width/height do manifesto: o navegador reserva
     o espaço exato e o masonry não "pula" enquanto carrega (CLS baixo).
   - O lightbox baixa a foto ampliada sob demanda e faz preload
     apenas da anterior e da próxima.
   O manifesto é gerado no build varrendo as pastas do repo, então
   qualquer foto nova entra sozinha no próximo deploy.
   Vanilla, sem dependências.
   ============================================================ */
(function () {
  "use strict";

  const MANIFEST_URL = "/galeria-manifest.json";
  let manifest = null;          // cache em memória
  let manifestPromise = null;   // dedup de fetch concorrente

  // Estado do lightbox
  let fotosAtuais = [];         // array de { src, w?, h? }
  let idxAtual = 0;
  let ultimoFoco = null;        // devolve o foco ao fechar (a11y)

  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const galeria = $("#galeria");
  if (!galeria) return;         // markup ausente → não faz nada

  const grid       = $("[data-galeria-grid]", galeria);
  const tituloEl   = $("#galeria-titulo", galeria);
  const lightbox   = $("[data-lightbox]", galeria);
  const lbImg      = $("[data-lightbox-img]", galeria);
  const lbPalco    = $(".lightbox__palco", galeria);
  const lbContador = $("[data-lightbox-contador]", galeria);

  // Aceita tanto o formato novo ({src,w,h}) quanto string legada.
  function normalizar(item) {
    return typeof item === "string" ? { src: item } : item;
  }

  /* ---------- manifesto ---------- */
  function carregarManifesto() {
    if (manifest) return Promise.resolve(manifest);
    if (manifestPromise) return manifestPromise;
    manifestPromise = fetch(MANIFEST_URL, { cache: "default" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((data) => { manifest = data; return data; })
      .catch((err) => { manifestPromise = null; throw err; });
    return manifestPromise;
  }

  // Preenche "(N)" nos cards. Só lê o JSON — nenhuma imagem baixa.
  function preencherContagens() {
    carregarManifesto().then((m) => {
      document.querySelectorAll("[data-galeria]").forEach((card) => {
        const info = m[card.dataset.galeria];
        const countEl = card.querySelector(".showcase-card__count");
        if (info && countEl) {
          countEl.textContent = info.fotos.length ? "(" + info.fotos.length + ")" : "";
        }
      });
    }).catch(() => { /* silencioso: cards seguem sem contagem */ });
  }

  /* ---------- grid (masonry) ---------- */
  function montarGrid(key) {
    const info = manifest[key];
    tituloEl.textContent = (info && info.titulo) || "Galeria";
    grid.innerHTML = "";

    if (!info || !info.fotos.length) {
      grid.innerHTML = '<p class="galeria__vazia">Nenhuma foto por aqui ainda.</p>';
      fotosAtuais = [];
      return;
    }

    fotosAtuais = info.fotos.map(normalizar);
    const frag = document.createDocumentFragment();
    fotosAtuais.forEach((foto, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "galeria__item";
      btn.setAttribute("aria-label", "Ampliar foto " + (i + 1) + " de " + fotosAtuais.length);
      const img = document.createElement("img");
      img.src = foto.src;
      img.alt = info.titulo + " — foto " + (i + 1);
      img.loading = "lazy";
      img.decoding = "async";
      // width/height reservam o espaço exato → masonry não "pula".
      if (foto.w && foto.h) { img.width = foto.w; img.height = foto.h; }
      btn.appendChild(img);
      btn.addEventListener("click", () => abrirLightbox(i));
      frag.appendChild(btn);
    });
    grid.appendChild(frag);
    grid.scrollTop = 0;
  }

  /* ---------- abrir/fechar galeria ---------- */
  function abrirGaleria(key) {
    ultimoFoco = document.activeElement;
    carregarManifesto().then(() => {
      montarGrid(key);
      galeria.hidden = false;
      document.body.style.overflow = "hidden";
      // history: o botão "voltar" do celular fecha a galeria.
      history.pushState({ galeria: true }, "");
      requestAnimationFrame(() => galeria.classList.add("is-aberta"));
      const fechar = galeria.querySelector(".galeria__fechar");
      if (fechar) fechar.focus();
    }).catch(() => {
      window.location.reload(); // deploy antigo sem manifesto: recarrega
    });
  }

  function fecharGaleria(viaPopstate) {
    if (galeria.hidden) return;
    fecharLightbox();
    galeria.classList.remove("is-aberta");
    document.body.style.overflow = "";
    setTimeout(() => { galeria.hidden = true; }, 200);
    if (!viaPopstate && history.state && history.state.galeria) history.back();
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  /* ---------- lightbox ---------- */
  function preload(i) {
    if (i < 0 || i >= fotosAtuais.length) return;
    const im = new Image();
    im.src = fotosAtuais[i].src;
  }

  function mostrarFoto(i) {
    if (!fotosAtuais.length) return;
    idxAtual = (i + fotosAtuais.length) % fotosAtuais.length; // circular
    lbImg.src = fotosAtuais[idxAtual].src;
    lbImg.alt = tituloEl.textContent + " — foto " + (idxAtual + 1);
    lbContador.textContent = (idxAtual + 1) + " / " + fotosAtuais.length;
    preload(idxAtual + 1);
    preload(idxAtual - 1);
  }

  function abrirLightbox(i) {
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add("is-aberto"));
    mostrarFoto(i);
  }

  function fecharLightbox() {
    if (lightbox.hidden) return;
    lightbox.classList.remove("is-aberto");
    setTimeout(() => { lightbox.hidden = true; lbImg.removeAttribute("src"); }, 180);
  }

  const proxima  = () => mostrarFoto(idxAtual + 1);
  const anterior = () => mostrarFoto(idxAtual - 1);

  /* ---------- swipe (mobile) ---------- */
  let tX = 0, tY = 0;
  lightbox.addEventListener("touchstart", (e) => {
    tX = e.changedTouches[0].clientX; tY = e.changedTouches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tX;
    const dy = e.changedTouches[0].clientY - tY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) proxima(); else anterior();
    }
  }, { passive: true });

  /* ---------- eventos globais ---------- */
  document.addEventListener("click", (e) => {
    const abrir = e.target.closest("[data-galeria-open]");
    if (abrir) { e.preventDefault(); abrirGaleria(abrir.dataset.galeriaOpen); return; }
    if (e.target.closest("[data-lightbox-close]")) { fecharLightbox(); return; }
    if (e.target.closest("[data-lightbox-prev]"))  { anterior(); return; }
    if (e.target.closest("[data-lightbox-next]"))  { proxima(); return; }
    // Clique na área vazia do lightbox (fora da foto) fecha o lightbox.
    if (!lightbox.hidden && (e.target === lbPalco || e.target === lightbox)) { fecharLightbox(); return; }
    // Clique no backdrop/fora do painel fecha a galeria.
    if (e.target.closest("[data-galeria-close]")) { fecharGaleria(); return; }
  });

  document.addEventListener("keydown", (e) => {
    if (galeria.hidden) return;
    if (e.key === "Escape") { if (lightbox.hidden) fecharGaleria(); else fecharLightbox(); }
    else if (!lightbox.hidden && e.key === "ArrowRight") proxima();
    else if (!lightbox.hidden && e.key === "ArrowLeft")  anterior();
  });

  // Botão "voltar" do navegador/Android fecha em vez de sair da página.
  window.addEventListener("popstate", () => {
    if (!galeria.hidden) fecharGaleria(true);
  });

  /* ---------- init ---------- */
  // Prefetch do manifesto (JSON minúsculo, zero imagem) em idle:
  // deixa o primeiro clique instantâneo e preenche as contagens.
  const idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1200); };
  idle(preencherContagens);
})();
