/* ============================================================
   api/reviews.js — VERSÃO TEMPORÁRIA DE DEBUG
   ------------------------------------------------------------
   ⚠️  Esta versão expõe a resposta crua do Google no endpoint
   /api/reviews para diagnosticar o erro 502. NÃO deixe em
   produção — depois de descobrir o problema, volte para a
   versão normal (a primeira que eu entreguei).

   O que ela mostra:
   - Status HTTP que o Google devolveu (403, 404, 400 etc.)
   - Mensagem de erro completa do Google
   - Confirmação de que as env vars chegaram (prefixo/sufixo
     da chave, Place ID inteiro)
   ============================================================ */

export default async function handler(req, res) {
  const apiKey  = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // Garante que o navegador mostre como JSON formatado
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (!apiKey || !placeId) {
    return res.status(200).json({
      debug: true,
      problema: "Faltando env var",
      temChave:   !!apiKey,
      temPlaceId: !!placeId,
    });
  }

  try {
    const url =
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
      `?languageCode=pt-BR&regionCode=BR`;

    const googleRes = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews",
      },
    });

    // Lê o corpo como texto e tenta parsear como JSON (Google às vezes
    // devolve texto puro em casos de erro grave)
    const bodyText = await googleRes.text();
    let googleBody;
    try { googleBody = JSON.parse(bodyText); } catch { googleBody = bodyText; }

    return res.status(200).json({
      debug: true,
      urlChamada: url,
      googleStatus:     googleRes.status,
      googleStatusText: googleRes.statusText,
      placeIdEnviado:   placeId,
      // Mostra só pedaços da chave, pra confirmar que chegou sem
      // expor o valor completo se alguém estiver olhando.
      chavePrefixo: apiKey.slice(0, 6),
      chaveSufixo:  apiKey.slice(-4),
      chaveTamanho: apiKey.length,
      googleBody,
    });
  } catch (err) {
    return res.status(200).json({
      debug: true,
      problema: "Exceção no fetch",
      erro: err.message,
      stack: err.stack,
    });
  }
}
