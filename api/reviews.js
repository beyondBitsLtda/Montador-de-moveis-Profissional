/* ============================================================
   api/reviews.js — Vercel Serverless Function
   ------------------------------------------------------------
   Proxy seguro entre o frontend e a Google Places API (New).

   POR QUE existe:
   - A chave da API NÃO PODE ficar no frontend (qualquer um copiaria
     do DevTools e usaria pra gastar a sua cota).
   - O Google bloqueia chamadas diretas do browser por CORS.
   - Esta function roda no servidor da Vercel, lê a chave de uma
     variável de ambiente, fala com o Google, e devolve só os dados
     necessários para o frontend renderizar.

   COMO funciona o cache:
   - s-maxage=21600  → CDN da Vercel guarda 6 horas (a function
                       só roda 4x por dia)
   - stale-while-revalidate=86400 → por mais 24h, devolve o cache
                       antigo enquanto busca um novo em background
   - Resultado: dezenas de milhares de visitas/mês, ~120 chamadas
     reais ao Google → ~$2-4/mês mesmo no SKU Enterprise

   COMO trocar de lugar/local:
   - Só mudar o PLACE_ID nas env vars da Vercel.
   - Não precisa redeployar código.
   ============================================================ */

const PLACES_API_BASE = "https://places.googleapis.com/v1/places";

// Mantém o body do response leve — devolve só o que o frontend usa.
// (Princípio: API não vaza dados desnecessários, frontend não recebe lixo.)
function shapeResponse(data) {
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];

  return {
    name: data.displayName?.text || "",
    rating: typeof data.rating === "number" ? data.rating : 0,
    total: typeof data.userRatingCount === "number" ? data.userRatingCount : 0,
    reviews: reviews.map((r) => ({
      // authorAttribution traz displayName, uri (link pro Google Maps
      // do autor) e photoUri (foto do avatar do Google)
      author: r.authorAttribution?.displayName || "Cliente",
      authorUri: r.authorAttribution?.uri || null,
      photo: r.authorAttribution?.photoUri || null,
      rating: typeof r.rating === "number" ? r.rating : 5,
      relativeTime: r.relativePublishTimeDescription || "",
      // Quando pedimos languageCode=pt-BR, o Google entrega:
      //   - text.text          → traduzido para PT (se não estava)
      //   - originalText.text  → texto original do cliente
      // Preferimos a tradução; se não existir, usamos o original.
      text: r.text?.text || r.originalText?.text || "",
      language: r.text?.languageCode || r.originalText?.languageCode || "pt",
    })),
  };
}

module.exports = async function handler(req, res) {
  // Só aceitamos GET — nada de mutações por esta porta.
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  const PLACE_ID = process.env.GOOGLE_PLACE_ID;

  if (!API_KEY || !PLACE_ID) {
    // Não vazamos qual está faltando — só registramos no log.
    console.error(
      "Missing env vars:",
      !API_KEY && "GOOGLE_PLACES_API_KEY",
      !PLACE_ID && "GOOGLE_PLACE_ID"
    );
    return res
      .status(500)
      .json({ error: "Configuração do servidor incompleta." });
  }

  // languageCode + regionCode garantem que reviews em outros idiomas
  // venham traduzidas para PT-BR, e que datas/formatação sigam o
  // padrão brasileiro.
  const url =
    `${PLACES_API_BASE}/${encodeURIComponent(PLACE_ID)}` +
    `?languageCode=pt-BR&regionCode=BR`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": API_KEY,
        // Field mask é OBRIGATÓRIO na Places API (New) — sem ela, erro 400.
        // Pedindo só o estritamente necessário pra ficar no SKU mais barato
        // possível que comporta reviews.
        "X-Goog-FieldMask":
          "displayName,rating,userRatingCount,reviews",
      },
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("Google Places API error:", upstream.status, detail);
      return res
        .status(502)
        .json({ error: "Falha ao consultar avaliações no Google." });
    }

    const data = await upstream.json();
    const shaped = shapeResponse(data);

    // CDN cacheia 6h, depois serve "stale" enquanto revalida por 24h.
    // O browser do usuário NÃO cacheia (max-age=0) — sempre pega a
    // versão fresca do CDN, então uma review nova aparece em até 6h.
    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400"
    );

    return res.status(200).json(shaped);
  } catch (err) {
    console.error("Unexpected error in /api/reviews:", err);
    return res
      .status(500)
      .json({ error: "Erro inesperado ao buscar avaliações." });
  }
};
