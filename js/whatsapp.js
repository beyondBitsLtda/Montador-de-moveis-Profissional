/* ============================================================
   whatsapp.js — Roteamento e mensagens pré-programadas
   ------------------------------------------------------------
   Único ponto de mudança para o número/telefone.
   Para trocar o número:
     1. Altere a constante WHATSAPP_NUMBER abaixo
        (formato internacional, somente dígitos: 55 + DDD + número)
     2. (Opcional) Ajuste os templates de mensagem.
   ============================================================ */

const WHATSAPP_NUMBER = "5531991277892"; // (31) 99127-7892

const WA_MESSAGES = {
  // Botão padrão (hero, header, FAB) — mensagem curta
  default:
    "Olá! Vim pelo site e gostaria de um orçamento de montagem de móveis.",

  // Botão dentro da seção de pré-qualificação — gera o template
  // com os 4 tópicos que o cliente precisa preencher.
  prequalification:
`Olá! Vim pelo site e gostaria de um orçamento.

Segue minhas informações:

*1. Móvel novo ou usado?*
(ex: novo, comprado na loja X)

*2. Bairro / cidade*
(ex: Justinópolis, Ribeirão das Neves)

*3. Tipo de serviço*
(montagem, desmontagem, ambos)

*4. Imagem do modelo e medidas do móvel*
(envie a foto do móvel ou o link da loja, com as medidas)

Aguardo retorno, obrigado!`
};

/**
 * Monta a URL wa.me com mensagem codificada.
 */
function buildWaUrl(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

/**
 * Inicializa todos os botões com data-wa.
 * Os botões com data-wa="prequalification" usam o template longo.
 * Os demais com data-wa (ou data-wa="default") usam a mensagem curta.
 */
function initWhatsApp() {
  const links = document.querySelectorAll("[data-wa]");
  links.forEach((el) => {
    const key = el.dataset.wa || "default";
    const message = WA_MESSAGES[key] || WA_MESSAGES.default;
    const url = buildWaUrl(message);
    if (el.tagName === "A") {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    } else {
      el.addEventListener("click", () => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
    }
  });

  // Atualiza qualquer elemento que mostra o número formatado
  document.querySelectorAll("[data-wa-display]").forEach((el) => {
    el.textContent = "(31) 99127-7892";
  });
}

document.addEventListener("DOMContentLoaded", initWhatsApp);
