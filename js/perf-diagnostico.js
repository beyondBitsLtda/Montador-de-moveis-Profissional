/**
 * perf-diagnostico.js
 * ─────────────────────────────────────────────────────────────
 * Diagnóstico completo de performance — roda no console do browser.
 *
 * COMO USAR:
 *   1. Abra o site no Chrome/Edge
 *   2. F12 → aba "Console"
 *   3. Cole todo este arquivo e pressione Enter
 *   4. O relatório aparece abaixo com emojis e sugestões concretas
 * ─────────────────────────────────────────────────────────────
 */

(async function diagnostico() {

  /* ── utilidades ───────────────────────────────────────────── */
  const kb  = b  => `${(b / 1024).toFixed(1)} KB`;
  const ms  = n  => `${Math.round(n)} ms`;
  const pct = n  => `${Math.round(n)}%`;

  const STATUS = { ok: '✅', warn: '⚠️ ', crit: '🔴' };

  function nota(val, limOk, limWarn) {
    if (val <= limOk)   return STATUS.ok;
    if (val <= limWarn) return STATUS.warn;
    return STATUS.crit;
  }

  const linha  = () => console.log('%c' + '─'.repeat(60), 'color:#555');
  const titulo = (t) => console.log(`\n%c${t}`, 'font-weight:bold;font-size:13px;color:#f6c324');
  const item   = (label, valor, icone, dica) => {
    console.log(`  ${icone}  ${label}: %c${valor}`, 'font-weight:bold', dica ? `\n      💡 ${dica}` : '');
    if (dica) console.log(`      %c💡 ${dica}`, 'color:#999;font-size:11px');
  };

  /* ── 1. NAVIGATION TIMING ────────────────────────────────── */
  titulo('1 · TEMPO DE CARREGAMENTO (Navigation Timing)');
  linha();

  const [nav] = performance.getEntriesByType('navigation');
  if (nav) {
    const ttfb    = nav.responseStart - nav.requestStart;
    const domReady= nav.domContentLoadedEventEnd - nav.startTime;
    const load    = nav.loadEventEnd - nav.startTime;
    const dns     = nav.domainLookupEnd - nav.domainLookupStart;
    const tcp     = nav.connectEnd - nav.connectStart;
    const tls     = nav.secureConnectionStart > 0
                    ? nav.connectEnd - nav.secureConnectionStart : 0;

    item('TTFB (tempo até 1º byte)',   ms(ttfb),    nota(ttfb, 200, 500),
      ttfb > 500 ? 'Alto para Vercel. Verifique região do deploy e cache headers.' : 'Dentro do esperado para Vercel.');

    item('DNS lookup',                 ms(dns),     nota(dns, 30, 100),
      dns > 100 ? 'DNS lento — considere preconnect ou DNS prefetch para domínios externos.' : null);

    item('TLS handshake',              ms(tls),     tls < 150 ? STATUS.ok : STATUS.warn, null);

    item('DOMContentLoaded',           ms(domReady),nota(domReady, 800, 1800),
      domReady > 1800 ? 'Muito alto. CSS ou JS render-blocking provavelmente é o culpado.' : null);

    item('Load total',                 ms(load),    nota(load, 1500, 3000),
      load > 3000 ? 'Imagens sem lazy-load ou recursos pesados estão atrasando o onload.' : null);
  } else {
    console.log('  ℹ️  Navigation Timing não disponível (SPA ou iframe).');
  }

  /* ── 2. WEB VITALS (via PerformanceObserver snapshot) ────── */
  titulo('2 · WEB VITALS (métricas reais do usuário)');
  linha();

  // LCP via PerformanceObserver (já coletado se a página carregou)
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  if (lcpEntries.length) {
    const lcp = lcpEntries.at(-1).startTime;
    item('LCP (Largest Contentful Paint)', ms(lcp), nota(lcp, 2500, 4000),
      lcp > 2500
        ? 'LCP alto. O elemento maior provavelmente é a imagem hero — ela precisa de: preload, formato WebP e srcset.'
        : 'LCP bom! Imagem hero carregando rápido.');
    const lcpEl = lcpEntries.at(-1).element;
    if (lcpEl) console.log(`      🎯 Elemento LCP:`, lcpEl);
  } else {
    console.log('  ℹ️  LCP não disponível ainda (recarregue e rode novamente).');
  }

  // CLS
  let clsValue = 0;
  const clsEntries = performance.getEntriesByType('layout-shift');
  clsEntries.forEach(e => { if (!e.hadRecentInput) clsValue += e.value; });
  item('CLS (Cumulative Layout Shift)', clsValue.toFixed(4), nota(clsValue, 0.1, 0.25),
    clsValue > 0.1
      ? 'Layout instável. Defina width/height em todas as imagens e evite injetar conteúdo acima do fold.'
      : null);

  // FID / INP (se disponível)
  const fidEntries = performance.getEntriesByType('first-input');
  if (fidEntries.length) {
    const fid = fidEntries[0].processingStart - fidEntries[0].startTime;
    item('FID (First Input Delay)', ms(fid), nota(fid, 100, 300),
      fid > 100 ? 'JS pesado no main thread. Verifique scripts síncronos.' : null);
  }

  /* ── 3. RECURSOS — IMAGENS ───────────────────────────────── */
  titulo('3 · IMAGENS');
  linha();

  const imgs = [...document.querySelectorAll('img')];
  const entries = performance.getEntriesByType('resource');

  let imgProblemas = 0;

  imgs.forEach(img => {
    const src = img.src || img.currentSrc || '';
    if (!src) return;

    const entry  = entries.find(e => e.name === src);
    const size   = entry ? entry.transferSize : null;
    const isWebP = src.includes('.webp') || src.includes('format=webp') || src.includes('auto=format');
    const hasAlt = img.hasAttribute('alt');
    const lazy   = img.loading === 'lazy';
    const aboveFold = img.getBoundingClientRect().top < window.innerHeight;
    const hasDims= img.hasAttribute('width') && img.hasAttribute('height');

    const problemas = [];
    if (!isWebP)         problemas.push('sem WebP');
    if (!hasAlt)         problemas.push('sem alt');
    if (!lazy && !aboveFold) problemas.push('sem lazy-load (abaixo do fold)');
    if (!hasDims)        problemas.push('sem width/height (causa CLS)');
    if (size > 300_000)  problemas.push(`pesada (${kb(size)})`);

    if (problemas.length) {
      imgProblemas++;
      const nome = src.split('/').pop().split('?')[0].slice(0, 40);
      console.log(`  🔴  ${nome}`);
      problemas.forEach(p => console.log(`%c        → ${p}`, 'color:#ff6b6b'));
    }
  });

  if (imgProblemas === 0) {
    console.log('  ✅  Todas as imagens estão OK!');
  } else {
    console.log(`\n  %c💡 Solução rápida: converta para WebP (use squoosh.app ou sharp no build),`, 'color:#999');
    console.log(`  %c   adicione width/height nos <img> e loading="lazy" nos que estão abaixo do fold.`, 'color:#999');
  }

  /* ── 4. FONTES ───────────────────────────────────────────── */
  titulo('4 · FONTES');
  linha();

  const fontEntries = entries.filter(e =>
    e.initiatorType === 'css' && e.name.includes('fonts.google') ||
    e.name.includes('.woff') || e.name.includes('.woff2') || e.name.includes('fonts.gstatic')
  );

  const googleCss = entries.find(e => e.name.includes('fonts.googleapis.com'));
  if (googleCss) {
    item('Google Fonts CSS', ms(googleCss.duration), nota(googleCss.duration, 100, 300),
      'Está bloqueando render. Adicione display=swap na URL (já tem?) e considere self-host com fontsource.');
  }

  const woffFiles = entries.filter(e => e.name.includes('.woff'));
  if (woffFiles.length) {
    woffFiles.forEach(f => {
      const nome = f.name.split('/').pop().split('?')[0];
      item(`Fonte: ${nome}`, kb(f.transferSize), nota(f.transferSize, 30_000, 80_000), null);
    });
  } else {
    console.log('  ℹ️  Arquivos .woff não capturados (podem ter sido cached ou CORS bloqueou o timing).');
  }

  // Verifica se display=swap está sendo usado
  const links = [...document.querySelectorAll('link[href*="fonts.google"]')];
  links.forEach(l => {
    const temSwap = l.href.includes('display=swap');
    item('font-display: swap', temSwap ? 'presente' : 'AUSENTE', temSwap ? STATUS.ok : STATUS.crit,
      !temSwap ? 'Adicione &display=swap na URL do Google Fonts para evitar FOIT (texto invisível).' : null);
  });

  /* ── 5. CSS / JS ─────────────────────────────────────────── */
  titulo('5 · CSS E JAVASCRIPT');
  linha();

  const cssEntries = entries.filter(e => e.initiatorType === 'link' && e.name.endsWith('.css'));
  const jsEntries  = entries.filter(e => e.initiatorType === 'script' || e.name.endsWith('.js'));

  let totalCss = 0, totalJs = 0;

  cssEntries.forEach(e => {
    totalCss += e.transferSize;
    const nome = e.name.split('/').pop();
    item(`CSS: ${nome}`, kb(e.transferSize), nota(e.transferSize, 10_000, 30_000), null);
  });

  jsEntries.forEach(e => {
    totalJs += e.transferSize;
    const nome = e.name.split('/').pop();
    const scripts = document.querySelectorAll(`script[src*="${nome}"]`);
    const temDefer = [...scripts].some(s => s.defer || s.async);
    const dica = !temDefer && e.transferSize > 5000
      ? 'Script sem defer/async pode bloquear o render.' : null;
    item(`JS: ${nome}`, kb(e.transferSize), nota(e.transferSize, 30_000, 80_000), dica);
  });

  console.log('');
  item('Total CSS', kb(totalCss), nota(totalCss, 30_000, 60_000),
    totalCss > 60_000 ? 'Considere purgar CSS não usado com PurgeCSS.' : null);
  item('Total JS',  kb(totalJs),  nota(totalJs,  80_000, 150_000),
    totalJs > 150_000 ? 'JS pesado. Verifique se todos os scripts são necessários.' : null);

  /* ── 6. CACHE ────────────────────────────────────────────── */
  titulo('6 · CACHE E HEADERS');
  linha();

  // Verifica recursos sem cache (transferSize > 0 = foi à rede)
  const semCache = entries.filter(e =>
    e.transferSize > 0 &&
    (e.name.endsWith('.css') || e.name.endsWith('.js') || e.name.endsWith('.png') ||
     e.name.endsWith('.jpg') || e.name.endsWith('.webp') || e.name.endsWith('.woff2'))
  );

  if (semCache.length) {
    console.log(`  ⚠️   ${semCache.length} recurso(s) foram à rede (não estavam em cache):`);
    semCache.slice(0, 6).forEach(e => {
      const nome = e.name.split('/').pop().split('?')[0].slice(0, 45);
      console.log(`        → ${nome} (${kb(e.transferSize)})`);
    });
    console.log(`\n  %c💡 No Vercel, adicione um vercel.json com Cache-Control para assets estáticos:`, 'color:#999');
    console.log(`  %c   { "headers": [{ "source": "/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }] }`, 'color:#666;font-size:10px');
  } else {
    console.log('  ✅  Recursos carregando do cache do browser. Cache funcionando!');
  }

  /* ── 7. RENDER BLOCKING ──────────────────────────────────── */
  titulo('7 · RECURSOS QUE BLOQUEIAM RENDER');
  linha();

  const scriptsSincronos = [...document.querySelectorAll('script[src]')]
    .filter(s => !s.defer && !s.async);

  const cssSync = [...document.querySelectorAll('link[rel="stylesheet"]')];

  if (scriptsSincronos.length) {
    console.log(`  🔴  ${scriptsSincronos.length} script(s) SÍNCRONOS (sem defer/async):`);
    scriptsSincronos.forEach(s => console.log(`       → ${s.src.split('/').pop()}`));
    console.log(`  %c💡 Adicione defer em todos os <script src="..."> que não precisam rodar antes do DOM.`, 'color:#999');
  } else {
    console.log('  ✅  Nenhum script síncrono encontrado.');
  }

  item('CSS files (sempre bloqueiam render)', `${cssSync.length} arquivo(s)`,
    cssSync.length <= 2 ? STATUS.ok : STATUS.warn,
    cssSync.length > 2 ? `Você tem ${cssSync.length} CSS separados. Considere fazer bundle em 1 único arquivo no build.` : null);

  /* ── 8. PRELOAD / PREFETCH ───────────────────────────────── */
  titulo('8 · PRELOADS E HINTS');
  linha();

  const preloads  = [...document.querySelectorAll('link[rel="preload"]')];
  const preconns  = [...document.querySelectorAll('link[rel="preconnect"]')];
  const prefetch  = [...document.querySelectorAll('link[rel="prefetch"]')];

  item('Preloads declarados', preloads.length, preloads.length >= 1 ? STATUS.ok : STATUS.warn,
    preloads.length === 0 ? 'Sem preload. A imagem hero deveria ter <link rel="preload" as="image">.' : null);

  preloads.forEach(p => console.log(`       → ${p.href.split('/').pop()} (${p.as})`));

  item('Preconnects', preconns.length, STATUS.ok, null);
  preconns.forEach(p => console.log(`       → ${p.href}`));

  const faltaPreconn = [];
  if (!preconns.some(p => p.href.includes('fonts.googleapis'))) faltaPreconn.push('fonts.googleapis.com');
  if (!preconns.some(p => p.href.includes('fonts.gstatic')))   faltaPreconn.push('fonts.gstatic.com');
  if (faltaPreconn.length) {
    console.log(`  %c💡 Faltando preconnect para: ${faltaPreconn.join(', ')}`, 'color:#999');
  }

  /* ── 9. RESUMO FINAL ─────────────────────────────────────── */
  titulo('9 · RESUMO & PRIORIDADES');
  linha();

  console.log('%c  Prioridade ALTA (maior impacto no usuário real):', 'color:#ff6b6b;font-weight:bold');
  console.log('  1. Converter imagem hero para WebP + confirmar que o preload está correto');
  console.log('  2. Adicionar width/height em TODOS os <img> para eliminar CLS');
  console.log('  3. Fazer bundle dos 5 CSS em 1 arquivo só (economiza 4 requests)');
  console.log('');
  console.log('%c  Prioridade MÉDIA:', 'color:#f6c324;font-weight:bold');
  console.log('  4. Adicionar vercel.json com Cache-Control para assets estáticos');
  console.log('  5. Confirmar display=swap nas fontes do Google');
  console.log('  6. Lazy-load em imagens do carousel (abaixo do fold)');
  console.log('');
  console.log('%c  Prioridade BAIXA (polimento):', 'color:#6bcb77;font-weight:bold');
  console.log('  7. Considerar self-host das fontes (elimina round-trip ao Google)');
  console.log('  8. Adicionar loading="eager" fetchpriority="high" na imagem hero');
  console.log('  9. Avaliar se JetBrains Mono é necessária (3 famílias = 3x requests de fonte)');

  linha();
  console.log('%c  🚀 Script de diagnóstico finalizado.', 'color:#f6c324;font-weight:bold');
  console.log('%c  Cole os resultados e compartilhe para análise detalhada!', 'color:#999;font-size:11px');
  linha();

})();
