/* ============================================================
   api/google-places.js — Função serverless (Vercel)
   ------------------------------------------------------------
   Proxy para a Google Places API (New). Recebe GET em
   /api/google-places, chama o Google, normaliza a resposta no
   formato que js/reviews-loader.js consome, e devolve com
   Cache-Control de 6h no CDN.

   Env vars necessárias (definidas em Vercel → Settings → Environment Variables):
   - GOOGLE_PLACES_API_KEY → chave da Places API (New)
   - GOOGLE_PLACE_ID        → ChIJ... do negócio

   ⚠️  A chave precisa ter "Restrições de aplicativo" = Nenhum no
   Google Cloud Console. Esta function chama o Google do servidor,
   sem header Referer — restrição por HTTP referrers BLOQUEIA tudo.
   ============================================================ */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey  = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.error("[api/google-places] Faltando env var(s)");
    return res.status(500).json({ error: "Configuração do servidor incompleta" });
  }

  try {
    const url =
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
      `?languageCode=pt-BR&regionCode=BR`;

    const googleRes = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        // FieldMask define quais campos vêm de volta. Todos os abaixo
        // ficam no mesmo SKU/preço — pedir todos não custa mais que pedir poucos.
        "X-Goog-FieldMask":
          "id,displayName,rating,userRatingCount,reviews,googleMapsUri,location",
      },
    });

    if (!googleRes.ok) {
      const bodyText = await googleRes.text().catch(() => "");
      console.error("[api/google-places] Google respondeu", googleRes.status, bodyText);
      return res.status(502).json({ error: "Falha ao consultar avaliações" });
    }

    const place = await googleRes.json();

    // Normalização — adapta o formato cru do Google ao que o frontend espera.
    const normalized = {
      name:   place.displayName?.text || "",
      rating: typeof place.rating === "number" ? place.rating : 0,
      total:  typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
      googleMapsUri: place.googleMapsUri || "",
      location: place.location
        ? { lat: place.location.latitude, lng: place.location.longitude }
        : null,
      reviews: Array.isArray(place.reviews)
        ? place.reviews.map((r) => ({
            author:       r.authorAttribution?.displayName || "Cliente",
            authorUri:    r.authorAttribution?.uri || "",
            photo:        r.authorAttribution?.photoUri || "",
            rating:       typeof r.rating === "number" ? r.rating : 5,
            text:         r.text?.text || r.originalText?.text || "",
            relativeTime: r.relativePublishTimeDescription || "",
          }))
        : [],
    };

    // Cache de 6h no CDN da Vercel + stale-while-revalidate de 24h.
    // Resultado prático: Google é chamado ~4x ao dia, independente do tráfego,
    // e o visitante NUNCA espera a chamada externa.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=21600, stale-while-revalidate=86400"
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json(normalized);
  } catch (err) {
    console.error("[api/google-places] erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
