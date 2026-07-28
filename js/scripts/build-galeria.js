#!/usr/bin/env node
/**
 * build-galeria.js
 * Localização: js/scripts/build-galeria.js
 *
 * Varre as pastas de fotos na raiz do repo e gera galeria-manifest.json.
 * Roda no `npm run build` ANTES do build-css. Assim, toda foto que o
 * cliente subir para Cozinha/ Quarto/ Sala/ entra na galeria no próximo
 * deploy — sem editar código, sem digitar nome de arquivo.
 */

const fs   = require('fs');
const path = require('path');

// js/scripts/ → sobe 2 níveis → raiz do projeto (mesmo padrão do build-css)
const ROOT = path.resolve(__dirname, '../..');

// Pasta física no repo → chave usada no data-galeria e no cliente.
const GALERIAS = [
  { key: 'cozinha', dir: 'Cozinha', titulo: 'Móveis de cozinha' },
  { key: 'quarto',  dir: 'Quarto',  titulo: 'Móveis de quarto'  },
  { key: 'sala',    dir: 'Sala',    titulo: 'Móveis de sala'     },
];

const OUTPUT_FILE = 'galeria-manifest.json';
const IMG_RE = /\.(jpe?g|png|webp|jfif|avif|gif)$/i;

const c = { reset:'\x1b[0m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m', dim:'\x1b[2m', bold:'\x1b[1m' };
const log = {
  ok:  (m)=>console.log(`${c.green}  \u2714${c.reset}  ${m}`),
  warn:(m)=>console.log(`${c.yellow}  \u26A0${c.reset}  ${m}`),
  info:(m)=>console.log(`${c.cyan}  \u2192${c.reset}  ${m}`),
  sep: ()=>console.log(`${c.dim}${'\u2500'.repeat(52)}${c.reset}`),
};

function listar(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return null;
  return fs.readdirSync(abs)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => IMG_RE.test(name))
    .sort((a, b) => a.localeCompare(b, 'pt', { numeric: true }))
    // encodeURI cuida de espaços/acentos; a "/" continua sendo "/".
    .map((name) => encodeURI(`${dir}/${name}`));
}

function build() {
  console.log(`\n${c.bold}${c.cyan}  \uD83D\uDDBC  Galeria Build${c.reset}\n`);
  log.sep();

  const manifest = {};
  let total = 0;

  GALERIAS.forEach(({ key, dir, titulo }) => {
    const fotos = listar(dir);
    if (fotos === null) {
      log.warn(`Pasta "${dir}/" nao encontrada — galeria "${key}" ficara vazia.`);
      manifest[key] = { titulo, fotos: [] };
      return;
    }
    manifest[key] = { titulo, fotos };
    total += fotos.length;
    log.ok(`${(dir + '/').padEnd(12)} ${c.dim}${fotos.length} foto(s)${c.reset}`);
  });

  fs.writeFileSync(path.join(ROOT, OUTPUT_FILE), JSON.stringify(manifest));
  log.sep();
  log.info(`Manifesto: ${c.bold}${OUTPUT_FILE}${c.reset}  (${total} fotos no total)`);
  log.sep();
}

try {
  build();
} catch (err) {
  // Feature secundaria: se algo falhar, NAO derruba o deploy inteiro.
  console.warn(`  \u26A0  Falha ao gerar galeria (build segue): ${err.message}`);
  process.exit(0);
}
