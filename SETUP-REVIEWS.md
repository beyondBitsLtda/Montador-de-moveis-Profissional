# Integração Google Reviews — Guia de Setup

Este guia leva você do zero ao **avaliações reais do Google aparecendo no site**, hospedado na Vercel. Tempo total: ~20 minutos.

---

## ✦ Arquitetura

```
[Visitante] ──fetch──▶ [Site estático na Vercel]
                              │
                              ▼ fetch('/api/reviews')
                       [Function /api/reviews.js]
                              │  (chave guardada como env var)
                              ▼
                       [Google Places API]
```

- **Site estático** — `index.html`, `css/`, `js/` — Vercel serve direto do CDN.
- **Function serverless** — `api/reviews.js` — só executa quando alguém pede `/api/reviews`.
- **Cache de 6h no CDN** — a function chama o Google ~4 vezes por dia, independente de quantas visitas o site tiver.

---

## Passo 1 — Pegar o Place ID do seu negócio

Você tem o link `https://share.google/p2xFq1OzNX8wZaKA6`. Esse link **não é o Place ID** — é só um redirecionamento curto. O Place ID é um código tipo `ChIJN1t_tDeuEmsRUsoyG83frY4` que identifica seu negócio na API.

**Como pegar:**

1. Abra: <https://developers.google.com/maps/documentation/places/web-service/place-id>
2. Role até a seção **"Place ID Finder"** (tem um mapa do Google ali).
3. No campo de busca em cima do mapa, digite **o nome do seu negócio** + endereço (ex: "Montador de Móveis Justinópolis").
4. Clique no resultado certo no mapa.
5. Vai aparecer uma caixa com o **Place ID** — copia esse código.

Guarde esse Place ID. Vai usar no Passo 3.

---

## Passo 2 — Criar a chave da Google Places API

### 2.1 — Criar projeto no Google Cloud

1. Acesse <https://console.cloud.google.com/>
2. No topo da tela, clique no seletor de projetos → **"Novo projeto"**
3. Nome: `montador-pro-site` (ou o que preferir)
4. Clique **Criar**

### 2.2 — Ativar faturamento

O Google **exige** faturamento ativo para usar a API, mas tem crédito grátis recorrente. Você só paga se passar da cota.

1. Menu lateral → **Faturamento**
2. **Vincular uma conta de faturamento** → cadastra cartão
3. Não se assuste: o cartão só é cobrado se você passar do crédito grátis. Vamos colocar um teto de segurança no Passo 2.4.

### 2.3 — Ativar a "Places API (New)"

⚠️ **Atenção** — existem duas APIs com nome parecido. **Ative apenas a NEW** (a antiga, "Places API", está sendo descontinuada).

1. Menu lateral → **APIs e Serviços** → **Biblioteca**
2. Pesquise: `Places API (New)`
3. Clique no resultado → **Ativar**

### 2.4 — Definir um teto de gastos (recomendado)

1. Menu lateral → **Faturamento** → **Orçamentos e alertas**
2. **Criar orçamento**
3. Valor: **R$ 25** (mais que suficiente)
4. Marque para receber email aos 50%, 90% e 100%
5. **Salvar**

Se algo der errado e o cache não funcionar, você é avisado antes da conta sair do controle. Na prática esse alerta nunca vai disparar.

### 2.5 — Criar a chave

1. Menu lateral → **APIs e Serviços** → **Credenciais**
2. **Criar credenciais** → **Chave de API**
3. Copie a chave que aparecer (algo tipo `AIzaSyA...`). Guarda — vai pra Vercel no Passo 3.
4. Clique em **Restringir chave** (importante por segurança):
   - **Restrições de aplicativo**: deixe em **Nenhum** (a chave é usada do servidor, não do browser).
   - **Restrições de API**: marque **Restringir chave** → selecione **Places API (New)** → **Salvar**

Pronto. Essa chave só funciona pra Places API, então mesmo se vazar, ninguém usa pra outra coisa.

---

## Passo 3 — Deployar na Vercel

### 3.1 — Subir o projeto para o GitHub

Se já está no Git, pule. Senão:

```bash
cd /caminho/do/projeto
git init
git add .
git commit -m "feat: integração google reviews"
# cria repo no github.com/new, depois:
git remote add origin git@github.com:SEU_USUARIO/montador-pro.git
git push -u origin main
```

### 3.2 — Importar na Vercel

1. Acesse <https://vercel.com/new>
2. Conecte sua conta GitHub
3. Selecione o repositório do site
4. **Antes de clicar em Deploy**, abra a seção **Environment Variables** e adicione duas variáveis:

| Nome | Valor |
|---|---|
| `GOOGLE_PLACES_API_KEY` | a chave copiada no Passo 2.5 |
| `GOOGLE_PLACE_ID` | o Place ID copiado no Passo 1 |

5. Clique **Deploy**.

Em ~30 segundos, seu site está no ar em `algum-nome.vercel.app`. Depois você pluga seu domínio próprio em **Settings → Domains**.

### 3.3 — Verificar se funcionou

1. Abra `https://seu-site.vercel.app/api/reviews` direto no navegador.
2. Deve aparecer um JSON tipo:

```json
{
  "name": "Montador de Móveis...",
  "rating": 4.9,
  "total": 87,
  "reviews": [
    { "author": "...", "rating": 5, "text": "...", ... }
  ]
}
```

3. Se aparecer erro:
   - **`"Configuração do servidor incompleta"`** → falta env var. Vercel → Settings → Environment Variables → confira os nomes (case-sensitive).
   - **`"Falha ao consultar avaliações"`** → o Place ID ou a chave estão errados, ou a Places API (New) não foi ativada.
   - Veja o log detalhado em **Vercel → seu projeto → Logs → Functions**.

4. Abra `https://seu-site.vercel.app/` e role até a seção "O que dizem os clientes". As avaliações devem ser as reais.

---

## ✦ Manutenção

**Reviews novas aparecem em até 6h** — esse é o cache do CDN. Se quiser forçar atualização imediata:

- Vercel → seu projeto → **Settings → Data Cache** → **Purge Everything**

**Para mudar o número do WhatsApp, cores, etc.**: nada muda. Continua tudo no `js/whatsapp.js` e `css/variables.css` como antes.

**Para mudar o Place ID** (ex: novo endereço com nova ficha no Google): só atualize a env var `GOOGLE_PLACE_ID` na Vercel e force um redeploy (Deployments → ⋯ → Redeploy).

---

## ✦ Custos esperados

Com cache de 6h e ~10k visitas/mês:

- Function executa ~120 vezes/mês (4x ao dia)
- Cada chamada é cobrada no SKU **Enterprise** (porque pede `rating` + `reviews`) = ~US$ 0,02
- **Custo mensal**: ~US$ 2,40 (≈ R$ 12)

Google Cloud oferece créditos grátis ao se cadastrar — na prática você não paga nada nos primeiros meses. O alerta de orçamento do Passo 2.4 te avisa muito antes de qualquer coisa furar o teto.

---

## ✦ Estrutura final dos arquivos

```
.
├── index.html              ← já existia, com 1 script novo
├── vercel.json             ← NOVO — config mínima da Vercel
├── api/
│   └── reviews.js          ← NOVO — function serverless
├── css/
│   ├── variables.css
│   ├── reset.css
│   ├── layout.css
│   └── components.css
├── js/
│   ├── whatsapp.js
│   ├── animations.js
│   ├── carousel.js
│   └── reviews.js          ← NOVO — fetch e renderização
└── images/
    └── hero-cozinha.png
```

Os arquivos antigos continuam intocados — a integração é puramente aditiva. Se você decidir tirar (improvável), basta remover `api/reviews.js`, `js/reviews.js` e a tag `<script>` correspondente do `index.html` — o site volta a funcionar com as 3 reviews hardcoded.
