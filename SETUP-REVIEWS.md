# Integração Google Reviews — Guia de Setup

Este guia leva você do zero às **avaliações reais do Google aparecendo no site**, hospedado no GitHub Pages. Tempo total: ~20 minutos.

---

## ✦ Arquitetura

O GitHub Pages serve **só arquivos estáticos** — não roda função serverless, não tem variável de ambiente, não executa Node no servidor. Então a chave da API nunca vive no site: ela fica na sua máquina, e o que vai pro ar é só o resultado já pronto.

```
   NA SUA MÁQUINA (1x por mês)              NO AR (a cada visita)
   ───────────────────────────              ─────────────────────
   npm run reviews                          [Visitante]
        │  lê .env (chave)                       │
        ▼                                        ▼ fetch('reviews.json')
   [Google Places API]                      [GitHub Pages]
        │                                        │
        ▼                                        │
   reviews.json  ──── git push ─────────────────▶┘
```

- **`.env`** — guarda a chave. Está no `.gitignore`: nunca vai pro repositório.
- **`js/scripts/fetch-reviews.js`** — chama o Google e grava `reviews.json`.
- **`reviews.json`** — só dados públicos das avaliações. Esse sim é commitado.
- **`js/reviews-loader.js`** — no browser, lê `reviews.json` e troca as 3 reviews fixas do HTML pelas reais.
- **`index.html`** — o script também reescreve aqui o `aggregateRating` e o array `review` do JSON-LD. Sem isso, o Google leria dados estruturados (nota, número de avaliações, depoimentos) que contradizem o que a página mostra, e pode deixar de exibir as estrelas no resultado de busca.

Se o `reviews.json` sumir ou vier quebrado, o site não quebra: o HTML mantém as 3 avaliações fixas. É *progressive enhancement*.

---

## Passo 1 — Pegar o Place ID do seu negócio

O Place ID é um código público tipo `ChIJN1t_tDeuEmsRUsoyG83frY4` que identifica seu negócio na API. Um link curto do tipo `share.google/...` **não** serve — é só um redirecionamento.

1. Abra: <https://developers.google.com/maps/documentation/places/web-service/place-id>
2. Role até a seção **"Place ID Finder"** (tem um mapa do Google ali).
3. No campo de busca em cima do mapa, digite **o nome do negócio + cidade**.
4. Clique no resultado certo no mapa.
5. Vai aparecer uma caixa com o **Place ID** — copie esse código.

---

## Passo 2 — Criar a chave da Google Places API

### 2.1 — Criar projeto no Google Cloud

1. Acesse <https://console.cloud.google.com/>
2. No topo da tela, clique no seletor de projetos → **"Novo projeto"**
3. Nome: `montador-pro-site` (ou o que preferir) → **Criar**

### 2.2 — Ativar faturamento

O Google **exige** faturamento ativo para usar a API, mas tem crédito grátis recorrente. Neste modelo estático você chama a API umas poucas vezes por ano, então o custo real é praticamente zero.

1. Menu lateral → **Faturamento** → **Vincular uma conta de faturamento**

### 2.3 — Ativar a "Places API (New)"

⚠️ Existem duas APIs com nome parecido. **Ative apenas a NEW** — a antiga está sendo descontinuada.

1. Menu lateral → **APIs e serviços** → **Biblioteca**
2. Pesquise: `Places API (New)` → **Ativar**

### 2.4 — Definir um teto de gastos (recomendado)

1. Menu lateral → **Faturamento** → **Orçamentos e alertas** → **Criar orçamento**
2. Valor: **R$ 25**, com alerta em 50%, 90% e 100%

### 2.5 — Criar a chave

1. Menu lateral → **APIs e serviços** → **Credenciais**
2. **Criar credenciais** → **Chave de API**
3. Copie a chave (`AIza...`)
4. Clique em **Restringir chave**:
   - **Restrições de aplicativo**: **Nenhum**. A chave é usada da sua máquina, por linha de comando — não existe header `Referer`, então restrição por HTTP referrer bloquearia tudo.
   - **Restrições de API**: **Restringir chave** → **Places API (New)** → **Salvar**

> **Já tinha uma chave e perdeu o valor?** Não precisa criar outra. Diferente de painéis que escondem segredos depois de salvos, o Google **sempre** mostra a chave inteira: **APIs e serviços → Credenciais →** clique no nome da chave **→ Mostrar chave**.

---

## Passo 3 — Gerar o `reviews.json`

Na raiz do projeto:

```bash
cp .env.example .env
```

Abra o `.env` e preencha com os dois valores dos passos anteriores:

```
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_PLACE_ID=ChIJ...
```

Depois:

```bash
npm install      # só na primeira vez
npm run reviews
```

Saída esperada:

```
  →  Consultando place ChIJ...
  ✔  NOME DO NEGÓCIO — nota 5 de 311 avaliações
  ✔  5 review(s) gravada(s) em reviews.json
  ✔  index.html sincronizado (JSON-LD + fallback visível)
```

Se preferir não criar arquivo, dá pra passar direto:

```bash
npm run reviews -- --key=AIza... --place=ChIJ...
```

**O `.env` nunca é commitado** — o `.gitignore` cuida disso. Uma chave do Google num repositório público é raspada por bots em minutos e vira cobrança na sua conta.

---

## Passo 4 — Publicar

```bash
npm run build                    # gera galeria-manifest.json e css/bundle.min.css
git add reviews.json index.html galeria-manifest.json css/bundle.min.css
git commit -m "chore: atualiza avaliacoes do Google"
git push
```

O GitHub Pages publica em ~1 minuto. Abra o site e role até "O que dizem os clientes" — as avaliações devem ser as reais, e a nota do cabeçalho deve bater com a do seu perfil no Google.

---

## ✦ Manutenção

**As avaliações não se atualizam sozinhas.** Elas são um retrato do momento em que você rodou o script. Para atualizar, rode o Passo 3 + Passo 4 de novo.

**Com que frequência?** Uma vez por mês. Não é só estética: os termos de uso da Places API limitam por quanto tempo você pode reter o conteúdo das avaliações (o Place ID pode guardar indefinidamente, o resto não). Rodar mensalmente mantém você em dia e as reviews frescas.

**As fotos dos autores podem expirar.** As URLs apontam pro CDN do Google e mudam de tempos em tempos. Quando isso acontece, o loader troca a foto pela inicial do nome num círculo colorido — não quebra nada, mas é mais um motivo pra regerar o arquivo de vez em quando.

**Mudou de endereço / abriu ficha nova no Google?** Atualize `GOOGLE_PLACE_ID` no `.env` e rode o Passo 3 de novo.

**O script é idempotente.** Rodar duas vezes seguidas não duplica nada nem corrompe o HTML — na segunda vez ele avisa que o `index.html` já estava sincronizado.

---

## ✦ Custos esperados

Uma chamada por mês, no SKU **Enterprise** (porque pede `rating` + `reviews`): cerca de **US$ 0,02/mês**. Na prática, dentro do crédito grátis — você não paga nada.

Isso é bem mais barato que o modelo serverless anterior, que chamava o Google 4x por dia (~US$ 2,40/mês).

---

## ✦ Estrutura dos arquivos envolvidos

```
.
├── .env                     ← chave (LOCAL, nunca commitado)
├── .env.example             ← modelo, sem valores
├── .gitignore               ← garante que o .env não vaze
├── reviews.json             ← snapshot das avaliações (commitado)
├── index.html               ← JSON-LD sincronizado pelo script
├── js/
│   ├── reviews-loader.js    ← lê reviews.json no browser
│   └── scripts/
│       └── fetch-reviews.js ← gera reviews.json
└── package.json             ← script "reviews"
```

---

## ✦ Solução de problemas

| Sintoma | Causa provável |
|---|---|
| `Faltando credenciais` | O `.env` não existe, está fora da raiz, ou os nomes das variáveis estão diferentes (é *case-sensitive*) |
| `Google respondeu 400 — API key not valid` | Chave errada ou incompleta na cópia |
| `Google respondeu 403` | A "Places API (New)" não foi ativada, ou a chave está restrita a outra API |
| `Google respondeu 404` | Place ID errado |
| `O Google não devolveu nenhuma review` | Place ID aponta pra uma ficha sem avaliações — confira no Place ID Finder |
| O site mostra as 3 reviews antigas | O `reviews.json` não chegou ao ar. Confirme que ele foi commitado e que abre em `<url-do-site>/reviews.json` |

O script mostra a mensagem de erro do Google na íntegra — ela costuma dizer exatamente o que está errado.
