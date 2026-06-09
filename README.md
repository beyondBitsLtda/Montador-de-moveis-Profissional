# Montador.Pro — Landing Page

Landing page de alta conversão para serviço de **Montagem e Desmontagem de Móveis** em Justinópolis, Ribeirão das Neves e região metropolitana de Belo Horizonte.

Projeto construído com **HTML5, CSS3 e JavaScript Vanilla** (sem frameworks, sem build step, sem dependências). Basta abrir o `index.html` no navegador.

---

## ✦ Sumário

1. [Estrutura de pastas](#estrutura-de-pastas)
2. [Como rodar](#como-rodar)
3. [Arquitetura do CSS](#arquitetura-do-css)
4. [Arquitetura do JavaScript](#arquitetura-do-javascript)
5. [Guia de manutenção rápida](#guia-de-manutenção-rápida)
   - [Trocar o número do WhatsApp](#1-trocar-o-número-do-whatsapp)
   - [Editar a mensagem pré-programada do WhatsApp](#2-editar-a-mensagem-pré-programada)
   - [Mudar cores da marca](#3-mudar-cores-da-marca)
   - [Alterar tipografia](#4-alterar-tipografia)
   - [Trocar textos / copy](#5-trocar-textos-da-página)
   - [Editar avaliações do Google](#6-editar-avaliações-do-google)
   - [Adicionar / remover bairros atendidos](#7-adicionar-ou-remover-bairros)
6. [Decisões de design](#decisões-de-design)
7. [Performance & SEO](#performance--seo)
8. [Compatibilidade](#compatibilidade)
9. [Créditos](#créditos)

---

## Estrutura de pastas

```
.
├── index.html              ← marcação semântica completa
├── css/
│   ├── variables.css       ← TOKENS (cores, fontes, espaçamentos)
│   ├── reset.css           ← reset minimalista moderno
│   ├── layout.css          ← grids, header, hero, seções
│   └── components.css      ← botões, cards, chips, FAB, mock WA
├── js/
│   ├── whatsapp.js         ← roteamento e mensagens pré-preenchidas
│   └── animations.js       ← reveal on scroll, contadores, smooth scroll
└── README.md               ← este arquivo
```

> Os arquivos CSS são carregados **na ordem** acima dentro do `<head>`. A ordem importa: `variables` define os tokens que `layout` e `components` consomem.

---

## Como rodar

Por ser estático, há 3 opções:

| Opção | Como fazer |
|---|---|
| **Local — duplo clique** | Abrir `index.html` no navegador (Chrome, Firefox, Safari). |
| **Local — servidor estático** | No terminal, dentro da pasta do projeto: `python3 -m http.server 8080` e acesse `http://localhost:8080`. |
| **Produção** | Subir todo o conteúdo da pasta em qualquer hosting estático: Hostinger, Netlify, Vercel, GitHub Pages, KingHost, etc. Não precisa de banco de dados, PHP nem Node. |

---

## Arquitetura do CSS

O CSS segue a filosofia **ITCS leve** (Inverted Triangle CSS), do mais genérico para o mais específico:

### 1. `variables.css` — TOKENS

Centraliza **tudo** que pode mudar visualmente:

- **Cores** (`--color-bg`, `--color-accent`, etc.)
- **Tipografia** (`--font-display`, `--font-body`, `--fs-hero`, …)
- **Espaçamentos** em escala (`--space-1` … `--space-10`)
- **Raios** (`--radius-sm` … `--radius-pill`)
- **Animação** (`--ease-out`, `--dur-base`)
- **Sombras**

> **Mudou aqui = mudou no site inteiro.** Nunca escreva valores fixos (hex/px) fora deste arquivo — sempre use as variáveis.

### 2. `reset.css` — Normalizador

Remove margens default, define box-sizing, antialiasing, smooth scroll, e respeita `prefers-reduced-motion`.

### 3. `layout.css` — Estrutura

Container, grids responsivos, cabeçalho fixo, hero, ticker, seções (`authority`, `services`, `reviews`, `howto`, `coverage`, `footer`) e animações globais (`@keyframes`, `[data-reveal]`).

Mobile-first: as media queries crescem para cima (`@media (min-width: 768px) { … }`).

### 4. `components.css` — Componentes reutilizáveis

- `.btn` — botão base + modificadores (`--lg`, `--ghost`, `--dark`, `--wa`)
- `.fab-wa` — botão flutuante WhatsApp com pulso
- `.svc-card` — card de serviço (+ `--feature` destacado)
- `.review-card` — card de avaliação do Google
- `.step` — passo do funil de pré-qualificação
- `.wa-preview` — mock visual da conversa do WhatsApp
- `.chip` — pílula de bairro

**Convenção BEM-light**: `.bloco__elemento--modificador`.

---

## Arquitetura do JavaScript

Dois módulos independentes, cada um com **uma responsabilidade**. Carregados com `defer` para não bloquear o render.

### `js/whatsapp.js`

Único ponto de contato com o WhatsApp.

- Constante `WHATSAPP_NUMBER` (formato internacional só com dígitos)
- Objeto `WA_MESSAGES` com 2 templates: `default` (curto) e `prequalification` (com os 4 tópicos)
- `buildWaUrl(message)` — monta a URL `wa.me/...?text=...`
- `initWhatsApp()` — varre o DOM atrás de elementos com `data-wa="…"` e injeta o `href` correto

Qualquer botão da página vira um botão de WhatsApp simplesmente colocando o atributo:

```html
<a href="#" data-wa="default">Falar agora</a>
<a href="#" data-wa="prequalification">Enviar orçamento</a>
```

### `js/animations.js`

- `initReveal()` — usa `IntersectionObserver` para revelar elementos com `[data-reveal]` quando entram na viewport. Suporta `data-reveal-delay="120"` (ms) para efeito cascata.
- `initCounters()` — anima contagem dos números do hero (`[data-counter="20"]`).
- `initSmoothLinks()` — rolagem suave para âncoras internas, respeitando o offset do header sticky.
- `initReviewsHighlight()` — gancho opcional para destacar avaliações em rotação.

Tudo é **progressivo**: se o JS falhar, a página continua 100% legível e funcional.

---

## Guia de manutenção rápida

### 1. Trocar o número do WhatsApp

📁 `js/whatsapp.js`, linha 11.

```js
const WHATSAPP_NUMBER = "5531991277892"; // 55 + DDD + número
```

Formato: `55` (Brasil) + DDD sem zero + número, **somente dígitos**.

**Também atualize o número exibido** na seção de footer e em outros pontos com atributo `data-wa-display`:
- procure por `data-wa-display` em `index.html` (já é populado automaticamente — pode editar direto a string `"(31) 99127-7892"` em `whatsapp.js` na função `initWhatsApp`).

### 2. Editar a mensagem pré-programada

📁 `js/whatsapp.js`, objeto `WA_MESSAGES`.

```js
const WA_MESSAGES = {
  default: "...",
  prequalification: "..."
};
```

Use `\n` para quebra de linha. Asteriscos `*texto*` viram **negrito** no WhatsApp.

### 3. Mudar cores da marca

📁 `css/variables.css`, bloco `Cores principais`.

```css
--color-accent: #f6c324;      /* amarelo principal */
--color-accent-dark: #d9a800; /* hover */
--color-bg: #0a0a0a;          /* fundo escuro */
```

Mude essas variáveis e **todo o site reage**. Não precisa procurar cor por cor.

### 4. Alterar tipografia

📁 `css/variables.css`:

```css
--font-display: "Archivo Black", ...;
--font-body:    "Inter", ...;
```

📁 `index.html`, no `<head>`: ajuste o `link` do Google Fonts para baixar as novas fontes.

### 5. Trocar textos da página

Todos os textos visíveis estão em `index.html`. Use o sumário abaixo para localizar cada seção:

| Seção | Comentário no HTML | O que tem lá |
|---|---|---|
| Hero | `<!-- HERO -->` | Headline, subheadline, CTA, números |
| Autoridade | `<!-- AUTHORITY -->` | Lista de empresas (Casas Bahia, etc.) |
| Serviços | `<!-- SERVIÇOS -->` | Os 3 cards de serviço |
| Cobertura | `<!-- COVERAGE -->` | Chips de bairros atendidos |
| Avaliações | `<!-- REVIEWS -->` | Resumo (4.9 ★) + 6 reviews |
| Funil | `<!-- HOW-TO / FUNIL -->` | Os 4 passos + mock do WhatsApp |
| Rodapé | `<!-- FOOTER -->` | Contato, áreas, créditos |

### 6. Editar avaliações do Google

Cada review é um `<article class="review-card">` dentro de `<!-- REVIEWS -->`.

Para adicionar uma nova:

```html
<article class="review-card" data-reveal>
  <div class="review-card__head">
    <div class="review-card__avatar avatar--A">J</div>
    <div>
      <div class="review-card__name">Nome do Cliente</div>
      <div class="review-card__meta">há 2 semanas · Bairro</div>
    </div>
  </div>
  <div class="review-card__stars">★★★★★</div>
  <p class="review-card__text">“Texto da avaliação...”</p>
  <span class="review-card__source"><span class="google-g"></span> via Google</span>
</article>
```

As classes `avatar--A` até `avatar--F` aplicam cores diferentes ao círculo do avatar. Crie novas em `components.css` se precisar (`.avatar--G { background: #cor; }`).

### 7. Adicionar ou remover bairros

📁 `index.html`, seção `<!-- COVERAGE -->`.

```html
<li class="chip">Nome do bairro</li>
<li class="chip chip--accent">Bairro em destaque</li>
```

---

## Decisões de design

- **Paleta preto + amarelo** extraída da identidade da marca (placa/papelaria existentes).
- **Tipografia bold-display** (Archivo Black) faz contraste com Inter no corpo — reforça posicionamento "ofício/trabalho manual qualificado".
- **Mobile-first**: 90% do tráfego vem do celular, então tudo foi desenhado primeiro para 360–414px e depois ampliado.
- **Mock do WhatsApp** na seção de funil: o cliente *vê* a mensagem que vai aparecer no app dele antes de clicar. Reduz fricção.
- **FAB flutuante** no canto inferior direito acompanha o usuário em toda a página.
- **Sem pop-ups** — nada de modal de cookies fake, nada de "espere! antes de sair…", nada de cadastro de e-mail. Foco total no CTA de WhatsApp.
- **Sem imagens externas** na primeira versão para garantir LCP rápido — placeholder geométrico no hero pode ser substituído por foto real do oficial em ação.

---

## Performance & SEO

- Fontes carregadas com `preconnect` + `display=swap`.
- CSS dividido para que o navegador cacheie em mudanças incrementais.
- Imagens: **substituir o placeholder do hero** por `<img>` real com `loading="lazy"` e `width`/`height` definidos.
- `<title>`, `<meta description>` e `lang="pt-BR"` configurados.
- HTML semântico (`<main>`, `<section>`, `<article>`, `<header>`, `<footer>`).
- Áreas atendidas e nomes de bairros como texto puro — bom para SEO local.

### Próximos passos sugeridos
1. Adicionar JSON-LD `LocalBusiness` no `<head>` para Rich Results do Google.
2. Trocar placeholder do hero por foto real do profissional.
3. Adicionar `og:image` para preview no WhatsApp/Facebook quando o link for compartilhado.
4. Configurar Google Analytics 4 ou Plausible para medir conversão dos CTAs.

---

## Compatibilidade

- ✅ Chrome / Edge (últimas 2 versões)
- ✅ Safari 14+ (iOS 14+)
- ✅ Firefox (últimas 2 versões)
- ✅ Samsung Internet
- ⚠️ Backdrop-filter no header tem fallback de cor sólida para navegadores antigos.

---

## Créditos

- **Design & código**: Beyond Bits
- **Tipografia**: Archivo Black, Inter, JetBrains Mono — via Google Fonts
- **Cliente**: Montador.Pro — Justinópolis / Ribeirão das Neves
