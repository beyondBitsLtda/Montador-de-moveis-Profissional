/* ============================================================
   api/reviews.js — Função serverless (Vercel)
   ------------------------------------------------------------
   Chamada pela URL pública /api/reviews.

   Fluxo:
     1. Lê as env vars GOOGLE_PLACES_API_KEY e GOOGLE_PLACE_ID
        (configuradas em Vercel → Settings → Environment Variables).
     2. Chama a Google Places API (New) pedindo só os campos que o
        frontend usa — o FieldMask determina o SKU/preço.
     3. Normaliza a resposta no formato que js/reviews.js espera:
        { name, rating, total, reviews: [{author, photo, rating, text, relativeTime}] }
     4. Devolve com Cache-Control de 6h no CDN (s-maxage=21600),
        então o Google é chamado ~4x por dia — independente do tráfego.

   Erros nunca quebram o site: o frontend mantém o fallback hardcoded
   sempre que esta function não responder 200.

   ⚠️  A chave da API precisa ter "Restrições de aplicativo" = Nenhum
   no Google Cloud Console (não use HTTP referrers — esta function
   chama o Google do servidor, sem Referer).
   ============================================================ */

export default async function handler(req, res) {
  // Aceita só GET — bloqueia POST/PUT/etc.
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey  = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.error("[api/reviews] Faltando env var(s): GOOGLE_PLACES_API_KEY e/ou GOOGLE_PLACE_ID");
    return res.status(500).json({ error: "Configuração do servidor incompleta" });
  }

  try {
    // Places API (New) — endpoint "Get Place Details"
    // languageCode + regionCode garantem reviews em PT-BR quando disponíveis
    // e descrições de tempo relativas no formato BR ("há 2 semanas").
    const url =
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
      `?languageCode=pt-BR&regionCode=BR`;

    const googleRes = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        // O FieldMask define EXATAMENTE quais campos virão de volta.
        // Pedir só o necessário diminui a fatura e o tempo de resposta.
        "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews",
      },
    });

    if (!googleRes.ok) {
      const bodyText = await googleRes.text().catch(() => "");
      console.error("[api/reviews] Google respondeu", googleRes.status, bodyText);
      return res.status(502).json({ error: "Falha ao consultar avaliações" });
    }

    const place = await googleRes.json();

    // Normalização — adapta o formato cru do Google ao formato do frontend.
    // Campos defensivos (?.) porque review individual pode vir sem foto, sem
    // texto traduzido, etc.
    const normalized = {
      name:   place.displayName?.text || "",
      rating: typeof place.rating === "number" ? place.rating : 0,
      total:  typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
      reviews: Array.isArray(place.reviews)
        ? place.reviews.map((r) => ({
            author:       r.authorAttribution?.displayName || "Cliente",
            photo:        r.authorAttribution?.photoUri || "",
            rating:       typeof r.rating === "number" ? r.rating : 5,
            // text.text vem com tradução PT-BR; originalText é o original
            // (pode ser em outro idioma). Preferimos a versão traduzida.
            text:         r.text?.text || r.originalText?.text || "",
            relativeTime: r.relativePublishTimeDescription || "",
          }))
        : [],
    };

    // Cache de 6h no CDN da Vercel:
    //   s-maxage=21600          → CDN guarda por 6h
    //   stale-while-revalidate  → serve versão velha enquanto renova em background,
    //                             então o visitante nunca espera o Google.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=21600, stale-while-revalidate=86400"
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    return res.status(200).json(normalized);
  } catch (err) {
    console.error("[api/reviews] erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
