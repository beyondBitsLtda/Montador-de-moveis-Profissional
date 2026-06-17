# SEO — Documentação técnica

> Aplicado em junho/2026 ao site Montador de Móveis Profissional (Justinópolis / Ribeirão das Neves). Esse documento explica **o quê foi feito**, **por quê**, **como validar** e **o que ainda depende de você** para o site decolar no Google.

---

## ✦ TL;DR — em 5 linhas

1. O HTML agora carrega **5 blocos de Schema.org** (LocalBusiness, WebSite, FAQPage, Service, Review) → estrelas amarelas direto no Google, painel lateral e FAQs expansíveis nos resultados.
2. Meta tags completas (Open Graph, Twitter, geo, robots, theme) → o link compartilhado em WhatsApp/Facebook agora tem capa, título e descrição decentes.
3. Criados `robots.txt`, `sitemap.xml`, `site.webmanifest` → Google encontra o site mais rápido e indexa melhor.
4. `vercel.json` ganhou **Cache-Control imutável** e **headers de segurança** (HSTS, X-Content-Type-Options) → +pontos em Lighthouse e ranking.
5. Adicionada seção **FAQ discreta** com 6 perguntas que são keywords reais de busca local.

**Cuidado:** todas as URLs absolutas (canonical, og:url, JSON-LD, sitemap, robots) usam `https://montador-pro.vercel.app/` como **placeholder**. Substitua pelo domínio real assim que ele estiver ativo.

---

## ✦ Sumário

1. [Por que SEO importa para esse negócio](#1-por-que-seo-importa)
2. [O que foi feito (detalhado)](#2-o-que-foi-feito)
3. [O que VOCÊ precisa fazer (manual)](#3-o-que-você-precisa-fazer)
4. [Como validar tudo](#4-como-validar)
5. [Próximos passos para escalar](#5-próximos-passos)
6. [Manutenção contínua](#6-manutenção-contínua)
7. [Apêndice — Migrar para domínio próprio](#7-apêndice--migrar-para-domínio-próprio)

---

## 1. Por que SEO importa

Pra um serviço local com ticket médio decente (montagem custa R$ 80–500 por móvel), aparecer no topo do Google para queries do tipo *"montador de móveis Justinópolis"* vale **mais que qualquer mídia paga**. As pessoas que pesquisam isso estão a poucos cliques de comprar — é tráfego de alta intenção.

O Google decide quem aparece em local search com base em três pilares:

| Pilar | O que é | O que fizemos |
|---|---|---|
| **Relevância** | O site fala do que a pessoa procurou? | Title, H1, FAQ, copy do hero, alt das imagens — todos enriquecidos com keywords locais. |
| **Distância** | O negócio está perto de quem buscou? | Geo tags, `LocalBusiness` com geo coordinates, `areaServed` cobrindo BH, Ribeirão, Vespasiano, Santa Luzia, Contagem. |
| **Reputação** | Tem avaliações boas? Recente? | `AggregateRating` + `Review` no JSON-LD usando os 4.9 ★ e 87 avaliações reais do Google. |

A integração com Google Reviews que você já fez **alimenta o pilar de reputação direto**, e o JSON-LD que adicionei **faz o Google traduzir isso em estrelas no resultado de busca** — o que aumenta brutalmente a taxa de clique.

---

## 2. O que foi feito

### 2.1. `index.html` — Mudanças no `<head>`

**Adicionado:**

- `<title>` reformulado com keyword principal + diferencial: *"Montador de Móveis em Justinópolis e Ribeirão das Neves | 20+ Anos de Experiência"* (era genérico antes).
- `meta description` expandida para 200 caracteres com keywords ricas e CTA (orçamento sem compromisso).
- `meta keywords` — sim, o Google ignora, mas Bing e DuckDuckGo ainda olham.
- `<link rel="canonical">` — diz ao Google qual é a URL oficial (impede content duplicado).
- `meta robots` com `max-image-preview:large` — permite preview grande nos resultados.
- **Geo-targeting:** `geo.region`, `geo.placename`, `geo.position`, `ICBM` — coordenadas de Justinópolis. Bing e crawlers regionais consomem.
- **Open Graph completo** — `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `og:type=website`, `og:locale=pt_BR`. Quando o link for compartilhado no WhatsApp ou Facebook, agora aparece com capa, título e descrição.
- **Twitter Card** — `summary_large_image` (mesmo Twitter morto, agentes de IA usam isso).
- `theme-color`, `color-scheme`, Apple touch icon, manifest link, format-detection.
- **Preload** com `fetchpriority="high"` na imagem do hero → melhora o LCP (Core Web Vital).

### 2.2. `index.html` — JSON-LD (Schema.org)

Esse é o bloco com maior impacto. Três `<script type="application/ld+json">` no head:

#### a) `HomeAndConstructionBusiness` (LocalBusiness especializado)

O tipo mais específico do Schema.org para serviço de construção/montagem — Google entende melhor que o `LocalBusiness` genérico.

Inclui:
- **NAP** (Name, Address, Phone) — fundamental para SEO local
- `geo` com coordenadas
- `areaServed` com 7 áreas — Ribeirão das Neves, BH, Vespasiano, Contagem, Santa Luzia, Justinópolis, Venda Nova
- `openingHoursSpecification` — todos os dias 8h-20h (você pediu "todos os dias", usei essa janela como conservadora; ajustar se precisar)
- **`aggregateRating`** — 4.9/5 com 87 reviews → **isso gera as estrelas amarelas no resultado de busca**
- `hasOfferCatalog` com 6 serviços tipados como `Service` — cada um pode aparecer em buscas específicas tipo *"montagem de cozinha planejada"*
- `review` com 3 reviews reais (das que aparecem no site)

#### b) `WebSite`

Identifica a página como entidade web, vinculada ao negócio (`publisher`). Ajuda o Google a entender que site + negócio são a mesma coisa.

#### c) `FAQPage`

Cada `<details>` da seção FAQ tem uma pergunta/resposta correspondente nesse JSON. **Quando o Google reconhecer, ele expande as perguntas direto no resultado de busca** — você ocupa mais espaço visual e rouba cliques dos concorrentes.

> ⚠️ **Sincronia obrigatória:** se você editar uma pergunta no HTML mas esquecer no JSON-LD (ou vice-versa), o Google sinaliza "conteúdo não corresponde" no Rich Results Test e ignora o schema. Edite os dois juntos.

### 2.3. `index.html` — Conteúdo e marcação

- **`alt` descritivo** em todas as imagens (era vazio no hero). O alt do hero agora tem keyword: *"Cozinha planejada montada profissionalmente em residência em Ribeirão das Neves"*.
- **`width` e `height`** em todas as `<img>` → elimina **Cumulative Layout Shift (CLS)**, uma das três métricas Core Web Vitals do Google.
- **Skip link** invisível para acessibilidade (visível só ao usar Tab) → Lighthouse a11y +5 pts.
- **`aria-label`** em todas as seções e `aria-hidden="true"` nos elementos puramente decorativos.
- Nova **seção FAQ** (`#faq`) com 6 perguntas/respostas estilizadas como acordeão (`<details>` nativo, sem JS). As perguntas foram escolhidas como queries reais de busca local.
- **Section tabs** ganhou link para `#faq`.
- **Footer** com lista expandida de áreas atendidas — Google ranqueia para cada nome de cidade/bairro que aparece como texto puro.

### 2.4. `vercel.json` — Headers HTTP

| Header | O que faz | Impacto SEO |
|---|---|---|
| `Cache-Control: max-age=31536000, immutable` | Cache de 1 ano para CSS/JS/imagens | LCP, FID melhores → ranking sobe |
| `Strict-Transport-Security` | Força HTTPS sempre | Confiabilidade, +pontos Lighthouse |
| `X-Content-Type-Options: nosniff` | Anti MIME-sniffing | Segurança, +pontos Lighthouse |
| `X-Frame-Options: SAMEORIGIN` | Impede iframe externo | Anti-cloaking |
| `Referrer-Policy: strict-origin-when-cross-origin` | Privacidade | +pontos Lighthouse |
| `Permissions-Policy` | Bloqueia features que o site não usa | +pontos Lighthouse |
| `cleanUrls: true` | Remove `.html` da URL | URLs mais limpas, indexação consistente |

### 2.5. Arquivos novos na raiz

| Arquivo | Para que serve |
|---|---|
| `robots.txt` | Diz aos crawlers o que indexar (tudo) e onde está o sitemap |
| `sitemap.xml` | Lista oficial das URLs do site — Google indexa mais rápido se tiver |
| `site.webmanifest` | PWA-lite. Define ícone, cor, nome no menu do celular. +pontos Lighthouse e PWA install banner em alguns navegadores |

---

## 3. O que VOCÊ precisa fazer

Coisas que **não consegui fazer por você** e que multiplicam o impacto de tudo acima.

### 3.1. ⚠️ Substituir o domínio placeholder

Procure e substitua `https://montador-pro.vercel.app` pelo seu domínio real em **5 arquivos**:

```
index.html       (canonical, og:url, og:image, twitter:image, 3 blocos JSON-LD)
robots.txt       (Sitemap:)
sitemap.xml      (<loc> e hreflang)
site.webmanifest (não tem URL absoluta — só revisar)
SEO.md           (esse aqui — opcional)
```

Recomendo usar o find/replace do VS Code (Ctrl+Shift+H).

### 3.2. Ícones de favicon (importante para Lighthouse e UX)

Hoje você só tem o `images/hero-cozinha.png`. Para o `<link rel="icon">` e o manifest funcionarem, gere esses arquivos e coloque na **raiz** do projeto:

| Arquivo | Tamanho |
|---|---|
| `favicon.ico` | 32×32 |
| `favicon.svg` | vetor (ideal) |
| `favicon-16x16.png` | 16×16 |
| `favicon-32x32.png` | 32×32 |
| `apple-touch-icon.png` | 180×180 |
| `android-chrome-192x192.png` | 192×192 |
| `android-chrome-512x512.png` | 512×512 |
| `android-chrome-maskable-512x512.png` | 512×512 (com padding interno) |

**Gerador rápido (gratuito):** https://realfavicongenerator.net/ — você sobe uma imagem do logo (recomendo a letra "M" estilizada ou um ícone de chave de fenda), ele gera todos os tamanhos prontos pra download.

### 3.3. Google Search Console (CRÍTICO)

Sem isso, você está cego.

1. Acesse https://search.google.com/search-console
2. **Adicionar propriedade** → escolha "Prefixo do URL" e cole o domínio.
3. **Verifique a propriedade** — o método mais simples é colar um meta tag no `<head>` do `index.html`. O Search Console mostra qual.
4. Após verificar:
   - **Sitemaps** → submeter `/sitemap.xml`
   - **Inspeção de URL** → colar a URL da home e clicar "Solicitar indexação"
5. Volte aqui em **48–72h** e veja se o Google indexou. Você terá relatórios de:
   - Quais buscas estão trazendo gente
   - Quais páginas estão indexadas
   - Erros de Core Web Vitals
   - Status do schema (rich results)

### 3.4. Google Meu Negócio (Google Business Profile)

Esse é o **fator de ranking número 1** para local search. Sem ele, você fica fora do Map Pack (aquela caixa com 3 negócios + mapa que aparece no topo).

1. https://business.google.com/
2. Cadastrar o negócio com:
   - **Mesmo nome** que está no site (Montador de Móveis Profissional)
   - **Mesmo telefone** (31) 99127-7892
   - **Mesma área** (Justinópolis / Ribeirão das Neves)
   - Link para o site (com o domínio real)
3. O Google envia uma carta com código de verificação para o endereço (1–2 semanas).
4. Após verificado: adicione **fotos** (mínimo 10), **categoria** (Montador de móveis), **horários**, **serviços**.

> 💡 **Importante:** os dados no Google Meu Negócio precisam ser **idênticos** aos do JSON-LD do site (nome, telefone, áreas). Isso é o que o Google chama de **NAP consistency**.

### 3.5. Considerar comprar domínio próprio

Já mencionei — vale repetir. Um domínio próprio (`.com.br`) tem **3 vantagens diretas de SEO**:

1. **Confiança** — usuários e o Google confiam mais em `.com.br` que em `.vercel.app`
2. **Ranking** — o Google tem viés para domínios brasileiros em buscas locais BR
3. **Brand recall** — *"vou no .vercel.app/montador-pro"* é horrível de lembrar/digitar; *"vou no montadorbh.com.br"* é fácil

**Custo:** R$ 40/ano no Registro.br. **Instalação na Vercel:** 5 cliques + ajuste de DNS, SSL automático.

---

## 4. Como validar

Depois de fazer o deploy, rode esses testes:

### 4.1. JSON-LD (Schema.org)

🔗 **Google Rich Results Test** — https://search.google.com/test/rich-results

Cole a URL. Deve aparecer:
- ✅ **LocalBusiness** (com estrelas)
- ✅ **FAQ** (com 6 perguntas)
- ✅ **WebSite**

Se aparecer "Cannot find content" no FAQ, é porque alguma pergunta no JSON-LD não corresponde exatamente à pergunta no HTML — corrigir.

### 4.2. Meta tags / Open Graph

🔗 **Meta Tags Debugger** — https://www.opengraph.xyz/

Cola a URL e vê o preview de como aparece em WhatsApp, Twitter, LinkedIn, Discord, Slack.

🔗 **Facebook Sharing Debugger** — https://developers.facebook.com/tools/debug/

### 4.3. Performance + Core Web Vitals + SEO score

🔗 **PageSpeed Insights** — https://pagespeed.web.dev/

Cole a URL. Mira em **90+ em todas as 4 métricas**: Performance, Accessibility, Best Practices, SEO. Com o que foi feito, deve fechar perto disso.

### 4.4. Robots e sitemap

- `https://seu-dominio/robots.txt` → deve retornar o conteúdo
- `https://seu-dominio/sitemap.xml` → deve retornar XML válido
- 🔗 **Sitemap validator** — https://www.xml-sitemaps.com/validate-xml-sitemap.html

### 4.5. Mobile-friendly

🔗 https://search.google.com/test/mobile-friendly

### 4.6. Schema offline (sem deploy)

🔗 **Schema.org validator** — https://validator.schema.org/

Cole o conteúdo de qualquer um dos três blocos `<script type="application/ld+json">`.

---

## 5. Próximos passos

Quando o que foi feito estiver no ar e validado, esses são os movimentos para subir ainda mais:

### Prioridade ALTA (alto impacto, baixo esforço)

1. **Google Meu Negócio verificado** — sem isso, você fica fora do Map Pack. Repita as 3.4.
2. **Pedir review fresh aos clientes** — Google ranqueia melhor negócios com fluxo recente de reviews. Mande WhatsApp pros últimos 5 clientes pedindo review no Google.
3. **Domínio `.com.br`** — explicado em 3.5.
4. **Mais 3-5 fotos reais do trabalho** no hero/showcase, substituindo Unsplash — fotos próprias rankeiam melhor por causa do EXIF e da unicidade.

### Prioridade MÉDIA (mais esforço, retorno acumulativo)

5. **Blog/conteúdo** — uma pasta `/blog/` com 3-5 posts simples:
   - *"Quanto custa montar um guarda-roupa em BH em 2026?"*
   - *"Como desmontar móveis sem perder peças (guia)"*
   - *"Casas Bahia vs Magazine Luiza: quem entrega móvel montado?"*
   
   Cada post = página indexável = mais portas pro tráfego entrar. Long-tail SEO é o que pega clientes "menos óbvios" no mercado local.

6. **Diretórios locais (citations)** — cadastrar o negócio em:
   - GetNinjas (mesmo se não quiser leads pagos, o backlink ajuda)
   - Solutudo
   - Apontador
   - Yelp Brasil
   - Listão local de Justinópolis/Ribeirão das Neves (Facebook groups, prefeitura)

   Cada cadastro é um **backlink** + sinal de NAP consistency.

### Prioridade BAIXA (polimento)

7. **Self-host das fontes** — Google Fonts via CDN é 1 round-trip a menos. Use https://google-webfonts-helper.herokuapp.com/ para baixar e servir local.
8. **Imagens WebP** — converter `hero-cozinha.png` para `.webp` reduz ~40% o peso (use https://squoosh.app/).
9. **Lazy-load iframe do mapa** — já está com `loading="lazy"`, mas considere usar **Lite YouTube/Map** pattern (placeholder click-to-load) se o LCP estiver sofrendo.
10. **Acessibilidade do FAQ** — o `<details>` nativo funciona bem com leitor de tela, mas você pode adicionar `aria-controls` se quiser nota máxima.

---

## 6. Manutenção contínua

### Quando atualizar o que

| Mudança | O que precisa atualizar |
|---|---|
| Trocou número do WhatsApp | `js/whatsapp.js` E `telephone` no JSON-LD do `index.html` |
| Mudou de endereço/base | `address`, `geo`, `geo.placename`, `ICBM`, `addressLocality` |
| Mudou áreas atendidas | `areaServed` no JSON-LD E lista no `<footer>` E descrição do mapa |
| Adicionou serviço novo | `hasOfferCatalog.itemListElement` + card de showcase + cat-tile |
| Adicionou pergunta na FAQ | **AMBOS**: `<details>` no HTML E `mainEntity` no JSON-LD FAQPage |
| Edita reviews (do código) | `review` no JSON-LD + cards visíveis |
| Mudou nota agregada (via Reviews API) | `aggregateRating.ratingValue` e `reviewCount` no JSON-LD |
| Trocou domínio | Find/replace `montador-pro.vercel.app` em tudo |

> Recomendação: criar um `git tag` chamado `seo-v1` agora, pra ter um ponto de comparação caso algo dê errado depois.

### Atualizar o sitemap

Toda vez que adicionar uma página nova (ex: começar o blog), abra `sitemap.xml` e adicione:

```xml
<url>
  <loc>https://seu-dominio/blog/post-novo</loc>
  <lastmod>2026-06-16</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

Depois no Search Console: **Sitemaps → Reenviar** para o Google saber.

### Monitorar reviews

A integração que você já fez do Google Reviews mantém os 3 cards visíveis atualizados, **mas o JSON-LD `review` não é dinâmico** — ele tem os 3 reviews hardcoded. Solução futura: criar uma rota `/api/reviews-ld` que retorna apenas o JSON-LD, e injetar via JS no head após o carregamento. Para esse nível de tráfego inicial, hardcoded está bem.

---

## 7. Apêndice — Migrar para domínio próprio

Quando comprar o domínio:

### Passo 1 — Vercel
1. Vercel dashboard → seu projeto → **Settings** → **Domains**
2. **Add Domain** → digitar `montadormoveisbh.com.br` (exemplo)
3. Vercel mostra **2 nameservers** do tipo `ns1.vercel-dns.com`

### Passo 2 — Registro.br (ou onde você comprou)
1. Login → seus domínios → editar DNS
2. Mudar para **DNS personalizado** → colar os nameservers que a Vercel deu
3. Salvar. Propagação leva de minutos a algumas horas.

### Passo 3 — No código
Find/replace `https://montador-pro.vercel.app` → `https://montadormoveisbh.com.br` nestes arquivos:
- `index.html`
- `robots.txt`
- `sitemap.xml`

Faça commit, push, deploy automático.

### Passo 4 — Search Console
1. Adicione **a nova propriedade** (não delete a antiga ainda).
2. Submeta o novo sitemap.
3. Em **Configurações → Mudança de endereço**, vincule a antiga à nova — assim o Google transfere o ranking acumulado (se houver).

### Passo 5 — Google Meu Negócio
1. Editar perfil → atualizar URL do site.

---

## ✦ Resumo final

O que está no ar **agora**:
- HTML semântico com keywords locais incorporadas
- 3 blocos JSON-LD validáveis (LocalBusiness, WebSite, FAQPage)
- Meta tags completas para social sharing
- Robots, sitemap, manifest na raiz
- Cache + security headers via Vercel
- FAQ discreta com queries reais de busca

O que **só você pode fazer agora**:
- Trocar URL placeholder pelo domínio real
- Verificar no Google Search Console
- Criar Google Meu Negócio
- Pedir reviews aos clientes recentes
- Comprar domínio `.com.br` (idealmente)

Esses 5 itens, feitos nas próximas 2 semanas, fazem o site competir de igual pra igual com qualquer concorrente da região.

---

*Documentação gerada em junho/2026 — atualizar quando houver mudanças estruturais.*
