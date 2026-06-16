#!/usr/bin/env node
/**
 * build-css.js
 * ─────────────────────────────────────────────────────────────
 * Concatena os CSS na ordem correta, minifica com lightningcss
 * e gera um único bundle com source-map opcional.
 *
 * USO:
 *   node build-css.js              → bundle minificado
 *   node build-css.js --dev        → bundle legível (sem minificar)
 *   node build-css.js --watch      → rebuida ao salvar qualquer CSS
 *
 * RESULTADO:
 *   css/bundle.min.css             → carregue este no HTML
 *   css/bundle.min.css.map         → source-map (opcional, pode apagar)
 *
 * DEPENDÊNCIAS:
 *   npm install lightningcss
 * ─────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

/* ── Configuração ─────────────────────────────────────────── */

// Pasta raiz do projeto (onde fica a pasta css/)
// Ajuste se este script estiver em outro lugar
const ROOT = path.resolve(__dirname, '..');

// Ordem de concatenação — a mesma do <head>
const CSS_FILES = [
  'css/variables.css',
  'css/reset.css',
  'css/layout.css',
  'css/components.css',
  'css/reviews-extras.css',
];

const OUTPUT_FILE = 'css/bundle.min.css';
const MAP_FILE    = 'css/bundle.min.css.map';

/* ── Argumentos ───────────────────────────────────────────── */
const args    = process.argv.slice(2);
const isDev   = args.includes('--dev');
const isWatch = args.includes('--watch');

/* ── Cores no terminal ────────────────────────────────────── */
const c = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
};

const log = {
  ok:   (msg) => console.log(`${c.green}  ✔${c.reset}  ${msg}`),
  warn: (msg) => console.log(`${c.yellow}  ⚠${c.reset}  ${msg}`),
  err:  (msg) => console.log(`${c.red}  ✖${c.reset}  ${msg}`),
  info: (msg) => console.log(`${c.cyan}  →${c.reset}  ${msg}`),
  dim:  (msg) => console.log(`${c.dim}     ${msg}${c.reset}`),
  sep:  ()    => console.log(`${c.dim}${'─'.repeat(52)}${c.reset}`),
};

/* ── Função principal de build ────────────────────────────── */
function build() {
  const startTime = Date.now();

  console.log(`\n${c.bold}${c.cyan}  ⚡ CSS Build${c.reset}  ${isDev ? '[modo dev]' : '[produção]'}\n`);
  log.sep();

  /* 1. Verificar se todos os arquivos existem */
  const missing = CSS_FILES.filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) {
    missing.forEach(f => log.err(`Arquivo não encontrado: ${f}`));
    log.err('Build abortado. Verifique os caminhos em CSS_FILES.');
    process.exit(1);
  }

  /* 2. Concatenar com separador de seção */
  let combined = '';
  let totalOriginal = 0;

  CSS_FILES.forEach((file, i) => {
    const fullPath = path.join(ROOT, file);
    const content  = fs.readFileSync(fullPath, 'utf8');
    const size     = Buffer.byteLength(content, 'utf8');
    totalOriginal += size;

    // Cabeçalho de seção (visível no bundle dev, removido no minificado)
    combined += `\n/* [${ i + 1 }/${ CSS_FILES.length }] ${file} */\n`;
    combined += content + '\n';

    log.ok(`${file.padEnd(32)} ${c.dim}${(size / 1024).toFixed(1)} KB${c.reset}`);
  });

  log.sep();
  log.dim(`Total original: ${(totalOriginal / 1024).toFixed(1)} KB em ${CSS_FILES.length} arquivos`);

  /* 3. Minificar com lightningcss (ou manter legível em --dev) */
  let outputContent;
  let outputSize;

  if (isDev) {
    // Modo dev: apenas concatena, sem minificar
    outputContent = `/* bundle.min.css — DEV (não minificado) — ${new Date().toISOString()} */\n` + combined;
    outputSize    = Buffer.byteLength(outputContent, 'utf8');
  } else {
    // Modo produção: minifica com lightningcss
    let transform;
    try {
      ({ transform } = require('lightningcss'));
    } catch {
      log.err('lightningcss não encontrado. Rode: npm install lightningcss');
      process.exit(1);
    }

    const result = transform({
      filename: OUTPUT_FILE,
      code:     Buffer.from(combined),
      minify:   true,
      sourceMap: true,
      targets: {
        // Suporte a browsers modernos (últimas 2 versões)
        chrome:  95 << 16,
        firefox: 95 << 16,
        safari:  15 << 16,
      },
    });

    outputContent = result.code.toString();
    outputSize    = Buffer.byteLength(outputContent, 'utf8');

    // Salva source-map separado
    if (result.map) {
      const mapPath = path.join(ROOT, MAP_FILE);
      fs.mkdirSync(path.dirname(mapPath), { recursive: true });
      fs.writeFileSync(mapPath, result.map.toString());
      log.dim(`Source-map: ${MAP_FILE}`);
    }
  }

  /* 4. Escrever bundle */
  const outputPath = path.join(ROOT, OUTPUT_FILE);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, outputContent);

  /* 5. Relatório */
  const savings    = ((1 - outputSize / totalOriginal) * 100).toFixed(1);
  const elapsed    = Date.now() - startTime;

  log.sep();
  log.ok(`Bundle gerado: ${c.bold}${OUTPUT_FILE}${c.reset}`);
  log.info(`Tamanho final:  ${c.bold}${(outputSize / 1024).toFixed(1)} KB${c.reset}  (${savings}% menor)`);
  log.info(`Tempo de build: ${elapsed} ms`);
  log.sep();

  /* 6. Dica de uso no HTML */
  console.log(`\n${c.dim}  Substitua os 5 <link> no <head> por este único:${c.reset}`);
  console.log(`${c.yellow}  <link rel="stylesheet" href="${OUTPUT_FILE}" />${c.reset}\n`);
}

/* ── Watch mode ───────────────────────────────────────────── */
if (isWatch) {
  console.log(`\n${c.cyan}  👁  Watch mode ativo. Ctrl+C para sair.${c.reset}\n`);

  // Build inicial
  build();

  // Observa mudanças em qualquer CSS listado
  const debounceMap = {};

  CSS_FILES.forEach(file => {
    const fullPath = path.join(ROOT, file);

    fs.watch(fullPath, (event) => {
      // Debounce: evita builds duplicados em salvamentos rápidos
      clearTimeout(debounceMap[file]);
      debounceMap[file] = setTimeout(() => {
        console.log(`\n${c.yellow}  ↺  ${file} mudou — rebuilding...${c.reset}`);
        try {
          build();
        } catch (err) {
          log.err(`Erro no build: ${err.message}`);
        }
      }, 120);
    });

    log.dim(`Observando: ${file}`);
  });

} else {
  // Build único
  try {
    build();
  } catch (err) {
    log.err(`Erro inesperado: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}
