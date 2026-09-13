#!/usr/bin/env node
/**
 * fetch-reviews.js
 * Localização: js/scripts/fetch-reviews.js
 *
 * Chama a Google Places API (New) UMA vez e congela o resultado em
 * reviews.json na raiz do repo. Esse arquivo é commitado e servido
 * como estático — o GitHub Pages não roda função serverless, então
 * a antiga api/google-places.js não tem como executar lá.
 *
 * Rodar manualmente (não entra no `npm run build`, pra não gastar
 * cota do Google a cada deploy):
 *
 *   npm run reviews
 *
 * As credenciais vêm, nesta ordem de precedência:
 *   1. argumentos  --key=AIza... --place=ChIJ...
 *   2. variáveis de ambiente GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID
 *   3. arquivo .env na raiz (KEY=valor por linha) — ignorado pelo Git
 *
 * Além do reviews.json, o script sincroniza dois trechos do index.html
 * que são estáticos e envelhecem junto: o aggregateRating e o array
 * "review" do JSON-LD. Se eles divergirem do que a página mostra, o
 * Google trata como dado estruturado inconsistente e pode parar de
 * exibir as estrelas no resultado de busca.
 *
 * A chave NUNCA entra no reviews.json: só os dados públicos das
 * avaliações, exatamente no formato que js/reviews-loader.js consome.
 */

const fs   = require('fs');
const path = require('path');

// js/scripts/ → sobe 2 níveis → raiz do projeto (mesmo padrão do build-galeria)
const ROOT        = path.resolve(__dirname, '../..');
const OUTPUT_FILE = 'reviews.json';
const INDEX_FILE  = 'index.html';

// O index.html usa CRLF. Montar os blocos do JSON-LD com a mesma quebra
// evita um diff gigante de fim de linha a cada execução.
const NL = String.fromCharCode(13) + String.fromCharCode(10);
const j2 = (arr) => arr.join(NL);

// Quantas reviews gravar. O Google devolve no máximo 5 nesse endpoint;
// o grid do site mostra confortavelmente até esse número.
const MAX_REVIEWS = 5;

const c = { reset:'\x1b[0m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', cyan:'\x1b[36m', dim:'\x1b[2m', bold:'\x1b[1m' };
const log = {
  ok:  (m)=>console.log(`${c.green}  \u2714${c.reset}  ${m}`),
  warn:(m)=>console.log(`${c.yellow}  \u26A0${c.reset}  ${m}`),
  err: (m)=>console.log(`${c.red}  \u2718${c.reset}  ${m}`),
  info:(m)=>console.log(`${c.cyan}  \u2192${c.reset}  ${m}`),
};

/* -------- Credenciais -------- */

// Parser mínimo de .env: KEY=valor, ignora comentários e linhas vazias,
// tira aspas em volta do valor. Não usamos dotenv pra não adicionar
// dependência por causa de um arquivo de 2 linhas.
function readDotEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function readArgs() {
  const out = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--(key|place)=(.+)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function resolveCredentials() {
  const args   = readArgs();
  const dotenv = readDotEnv();
  return {
    apiKey:  args.key   || process.env.GOOGLE_PLACES_API_KEY || dotenv.GOOGLE_PLACES_API_KEY,
    placeId: args.place || process.env.GOOGLE_PLACE_ID       || dotenv.GOOGLE_PLACE_ID,
  };
}

/* -------- Normalização -------- */

// Adapta o formato cru do Google ao que js/reviews-loader.js espera.
// Campos defensivos (?.) porque uma review pode vir sem foto, sem texto
// traduzido ou sem link do autor.
function normalize(place) {
  return {
    name:   place.displayName?.text || '',
    rating: typeof place.rating === 'number' ? place.rating : 0,
    total:  typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
    googleMapsUri: place.googleMapsUri || '',
    location: place.location
      ? { lat: place.location.latitude, lng: place.location.longitude }
      : null,
    reviews: Array.isArray(place.reviews)
      ? place.reviews.slice(0, MAX_REVIEWS).map((r) => ({
          author:       r.authorAttribution?.displayName || 'Cliente',
          authorUri:    r.authorAttribution?.uri || '',
          photo:        r.authorAttribution?.photoUri || '',
          rating:       typeof r.rating === 'number' ? r.rating : 5,
          // text.text vem traduzido pra PT-BR; originalText é o idioma original.
          text:         r.text?.text || r.originalText?.text || '',
          relativeTime: r.relativePublishTimeDescription || '',
        }))
      : [],
    // Carimbo pra saber quando o snapshot foi tirado. O loader ignora este
    // campo — ele existe só pra você (e pro git blame) saberem a idade dos dados.
    generatedAt: new Date().toISOString(),
  };
}

/* -------- Sincronização do index.html -------- */

// Reescreve no HTML os dois pontos que repetem os números do Google.
// Idempotente: roda quantas vezes quiser, sempre parte do valor atual.
function syncIndexHtml(data) {
  const file = path.join(ROOT, INDEX_FILE);

  if (!fs.existsSync(file)) {
    log.warn(INDEX_FILE + " não encontrado — JSON-LD não sincronizado");
    return;
  }
  if (!data.rating || !data.total || !data.reviews.length) {
    log.warn("Dados insuficientes — JSON-LD não sincronizado");
    return;
  }

  const nota   = data.rating.toFixed(1);          // "5.0" — formato do Schema.org
  const notaBr = nota.replace(".", ",");          // "5,0" — formato exibido ao usuário
  const total  = String(data.total);

  const antes = fs.readFileSync(file, "utf8");
  let html = antes;

  // aggregateRating: ancorado no @type para não pegar por engano os
  // "ratingValue" das reviews individuais, que ficam mais abaixo.
  html = html.replace(
    /("@type":\s*"AggregateRating",\s*"ratingValue":\s*")[^"]*(",\s*"reviewCount":\s*")[^"]*(")/,
    "$1" + nota + "$2" + total + "$3"
  );

  // Array "review" do JSON-LD, regerado a partir das reviews reais.
  const blocos = data.reviews.map((r) => j2([
      "      {",
      '        "@type": "Review",',
      '        "author": { "@type": "Person", "name": ' + JSON.stringify(r.author) + " },",
      '        "reviewRating": { "@type": "Rating", "ratingValue": "' + r.rating + '", "bestRating": "5" },',
      '        "reviewBody": ' + JSON.stringify(r.text),
      "      }",
  ])).join("," + NL);
  html = html.replace(/("review": \[)[\s\S]*?(\r?\n    \])/, "$1" + NL + blocos + NL + "    ]");

  // Fallback visível — o que aparece se o JavaScript não rodar.
  html = html.replace(/(class="reviews__summary-score">)[^<]*(<)/, "$1" + notaBr + "$2");
  html = html.replace(/(aria-label=")[^"]*( de 5 estrelas")/, "$1" + notaBr + "$2");
  html = html.replace(/(class="reviews__summary-text">)[^<]*(<)/, "$1" + total + " avaliações · Google$2");

  if (html === antes) {
    // Nada mudou pode significar duas coisas bem diferentes: ou o HTML já
    // estava em dia (caso normal, rodando duas vezes seguidas), ou os
    // marcadores sumiram numa edição e as substituições não pegaram nada.
    const jaSincronizado = antes.indexOf('"reviewCount": "' + total + '"') !== -1;
    if (jaSincronizado) log.info(INDEX_FILE + " já estava sincronizado");
    else log.warn(INDEX_FILE + " não mudou — os marcadores do JSON-LD podem ter sido editados");
    return;
  }
  fs.writeFileSync(file, html, "utf8");
  log.ok(INDEX_FILE + " sincronizado (JSON-LD + fallback visível)");
}

/* -------- Fluxo principal -------- */

async function main() {
  console.log(`\n${c.bold}Congelando avaliações do Google${c.reset}\n`);

  const { apiKey, placeId } = resolveCredentials();

  if (!apiKey || !placeId) {
    log.err('Faltando credenciais.');
    console.log(`
  Informe de uma destas formas:

    ${c.dim}# 1) arquivo .env na raiz (recomendado — já está no .gitignore)${c.reset}
    GOOGLE_PLACES_API_KEY=AIza...
    GOOGLE_PLACE_ID=ChIJ...

    ${c.dim}# 2) direto na linha de comando${c.reset}
    npm run reviews -- --key=AIza... --place=ChIJ...

  Onde achar cada valor:
    ${c.dim}chave    →${c.reset} console.cloud.google.com → APIs e Serviços → Credenciais → Mostrar chave
    ${c.dim}place id →${c.reset} developers.google.com/maps/documentation/places/web-service/place-id
`);
    process.exitCode = 1;
    return;
  }

  const url =
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
    `?languageCode=pt-BR&regionCode=BR`;

  log.info(`Consultando place ${c.dim}${placeId}${c.reset}`);

  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      // O FieldMask define exatamente quais campos voltam — e o SKU cobrado.
      // Todos os abaixo ficam no mesmo SKU: pedir os 7 não custa mais que 3.
      'X-Goog-FieldMask':
        'id,displayName,rating,userRatingCount,reviews,googleMapsUri,location',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    log.err(`Google respondeu ${res.status}`);
    // A mensagem de erro do Google é específica e útil (chave restrita,
    // API não habilitada, place id inválido) — vale mostrar inteira.
    if (body) console.log(`${c.dim}${body.slice(0, 600)}${c.reset}`);
    process.exitCode = 1;
    return;
  }

  const data = normalize(await res.json());

  if (!data.reviews.length) {
    // Sem reviews, o loader mantém o fallback do HTML. Gravar um JSON vazio
    // não quebra nada, mas é quase certo que algo saiu errado — avisa.
    log.warn('O Google não devolveu nenhuma review. Conferir o Place ID.');
  }

  const outPath = path.join(ROOT, OUTPUT_FILE);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  log.ok(`${data.name || '(sem nome)'} — nota ${data.rating} de ${data.total} avaliações`);
  log.ok(`${data.reviews.length} review(s) gravada(s) em ${c.bold}${OUTPUT_FILE}${c.reset}`);

  syncIndexHtml(data);
  console.log(`\n  ${c.dim}Agora: git add ${OUTPUT_FILE} && git commit && git push${c.reset}\n`);
}

main().catch((err) => {
  log.err(`Erro inesperado: ${err.message}`);
  process.exitCode = 1;
});
