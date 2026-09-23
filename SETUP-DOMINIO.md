# Configurar o domínio próprio — `aluisiomontadordemoveis.com.br`

Guia completo: do Registro.br até o cadeado verde no navegador. Tempo ativo: ~15 minutos. Tempo de espera (propagação de DNS + emissão do certificado): de 10 minutos a algumas horas.

---

## ✦ Situação

| | |
|---|---|
| Domínio | `aluisiomontadordemoveis.com.br` |
| Registrado em | 21/09/2026 (expira 21/09/2027) |
| Titular | CNPJ 57.812.470/0001-77 |
| DNS | `a.auto.dns.br` / `b.auto.dns.br` — o DNS gratuito do próprio Registro.br |
| Repositório | `beyondBitsLtda/Montador-de-moveis-Profissional` |
| Endereço atual | `https://beyondbitsltda.github.io/Montador-de-moveis-Profissional/` |

Como o domínio usa o DNS do Registro.br, você edita a zona direto no painel deles. Não precisa contratar DNS externo nem mexer em nameservers.

**Já está pronto no código** (commitado, aguardando o `git push`):

- `CNAME` na raiz com o domínio
- `index.html` — canonical, og:url, og:image, twitter:image e os 3 blocos JSON-LD
- `robots.txt` e `sitemap.xml`

**Falta fazer:** os passos abaixo.

---

## ⚠️ A ordem importa

Faça o **DNS antes do push**. Motivo: assim que o arquivo `CNAME` chega ao GitHub, o Pages passa a redirecionar `beyondbitsltda.github.io/Montador-de-moveis-Profissional/` para o domínio novo. Se o DNS ainda não estiver respondendo, o site fica inacessível nos dois endereços até a propagação terminar.

Fazendo DNS primeiro, a troca é sem interrupção.

---

## Passo 1 — Criar os registros no Registro.br

1. Acesse <https://registro.br/> e faça login (CNPJ do titular).
2. **Painel** → **Meus Domínios** → clique em `aluisiomontadordemoveis.com.br`.
3. Procure a seção de **DNS** → **Editar Zona**. Ela aparece porque o domínio usa o DNS do Registro.br.
4. Adicione os **9 registros** abaixo.

### Os registros

Os quatro `A` são os IPs do GitHub Pages — confirmados em `api.github.com/meta` no dia 22/09/2026. Os quatro `AAAA` são os equivalentes IPv6. O `CNAME` do `www` faz o endereço com `www.` funcionar também.

| Nome | Tipo | Valor |
|---|---|---|
| *(vazio, ou `@`)* | `A` | `185.199.108.153` |
| *(vazio, ou `@`)* | `A` | `185.199.109.153` |
| *(vazio, ou `@`)* | `A` | `185.199.110.153` |
| *(vazio, ou `@`)* | `A` | `185.199.111.153` |
| *(vazio, ou `@`)* | `AAAA` | `2606:50c0:8000::153` |
| *(vazio, ou `@`)* | `AAAA` | `2606:50c0:8001::153` |
| *(vazio, ou `@`)* | `AAAA` | `2606:50c0:8002::153` |
| *(vazio, ou `@`)* | `AAAA` | `2606:50c0:8003::153` |
| `www` | `CNAME` | `beyondbitsltda.github.io.` |

> **Nome vazio = o domínio raiz** (`aluisiomontadordemoveis.com.br`, sem `www`). Alguns painéis chamam de `@`, outros pedem o campo em branco. É a mesma coisa.

> **O ponto final em `beyondbitsltda.github.io.` não é erro de digitação.** Ele diz ao DNS que o nome é absoluto. Sem o ponto, alguns servidores interpretam como `beyondbitsltda.github.io.aluisiomontadordemoveis.com.br` e o `www` não funciona. Se o painel não aceitar o ponto, pode tirar — ele já trata isso internamente.

### Se o editor estiver em modo avançado

O Registro.br tem um modo onde você cola as linhas da zona diretamente. Se for o seu caso:

```
@    3600  IN  A      185.199.108.153
@    3600  IN  A      185.199.109.153
@    3600  IN  A      185.199.110.153
@    3600  IN  A      185.199.111.153
@    3600  IN  AAAA   2606:50c0:8000::153
@    3600  IN  AAAA   2606:50c0:8001::153
@    3600  IN  AAAA   2606:50c0:8002::153
@    3600  IN  AAAA   2606:50c0:8003::153
www  3600  IN  CNAME  beyondbitsltda.github.io.
```

5. **Salve** a zona.

### Não faça

- **Não crie um `CNAME` no domínio raiz.** Registro `CNAME` não pode coexistir com outros registros na raiz — é proibido pelo padrão do DNS. Na raiz vão só os `A` e `AAAA`.
- **Não use encaminhamento ou redirecionamento de URL** que alguns registradores oferecem. Isso serve o site dentro de um iframe e destrói a indexação no Google.

---

## Passo 2 — Esperar a propagação

Como o domínio é novo e nunca teve registro nenhum, não há cache velho para expirar — costuma resolver em poucos minutos.

Para conferir sem depender do cache do seu navegador, pergunte a um resolvedor público:

```bash
curl -s -H "accept: application/dns-json" \
  "https://dns.google/resolve?name=aluisiomontadordemoveis.com.br&type=A"
```

Quando os quatro IPs `185.199.10x.153` aparecerem na resposta, pode seguir. Se preferir uma tela em vez do terminal: <https://dnschecker.org/>, buscando o domínio no tipo `A`.

---

## Passo 3 — Publicar o `CNAME`

Com o DNS já respondendo, publique as alterações:

```bash
git push
```

O GitHub Pages lê o arquivo `CNAME` da raiz e configura o domínio sozinho — você **não** precisa digitar nada na interface. Em **Settings → Pages**, o campo **Custom domain** aparece preenchido em cerca de um minuto.

---

## Passo 4 — Conferir no GitHub

1. Abra <https://github.com/beyondBitsLtda/Montador-de-moveis-Profissional/settings/pages>
2. Em **Custom domain**, confirme que está `aluisiomontadordemoveis.com.br`.
3. Logo abaixo deve aparecer **DNS check successful**, com um sinal verde.

Se aparecer erro de DNS, clique em **Check again** — a verificação costuma passar na segunda tentativa, depois que a propagação completa.

---

## Passo 5 — Ligar o HTTPS

O GitHub emite um certificado Let's Encrypt automaticamente, mas leva alguns minutos depois que o DNS valida.

1. Na mesma tela, espere a caixa **Enforce HTTPS** deixar de estar acinzentada.
2. Marque a caixa.

> **Não tente forçar antes da hora.** Enquanto o certificado não sai, a opção fica desabilitada. Remover e recolocar o domínio para "acelerar" só reinicia a fila de emissão e atrasa mais. Se passar de uma hora sem liberar, aí sim: remova o domínio do campo, salve, recoloque e salve de novo — isso força uma nova tentativa.

---

## Passo 6 — Avisar o Google

O endereço mudou, então é preciso contar para o Google — senão ele continua indexando o antigo.

### Search Console

1. <https://search.google.com/search-console> → **Adicionar propriedade** → tipo **Domínio** → `aluisiomontadordemoveis.com.br`
2. A verificação pede um registro `TXT` no DNS. Volte ao Registro.br, adicione o `TXT` que o Google mostrar, salve e confirme.
3. Com a propriedade verificada: **Sitemaps** → enviar `sitemap.xml`.

> Agora a linha `Sitemap:` do `robots.txt` finalmente funciona. Enquanto o site estava em `usuario.github.io/repo/`, os crawlers ignoravam esse arquivo, porque só leem o `robots.txt` da raiz do domínio. Com domínio próprio, o site **é** a raiz.

### Google Meu Negócio

Edite o perfil do negócio e troque a URL do site para `https://aluisiomontadordemoveis.com.br`. Isso importa mais do que parece: o Google compara os dados do perfil com o JSON-LD do site, e divergência enfraquece o ranking local.

---

## ✦ Verificação final

```bash
# 1. O domínio responde e serve o site?
curl -s -o /dev/null -w "apex: %{http_code}\n" https://aluisiomontadordemoveis.com.br/

# 2. O www redireciona para o domínio raiz?
curl -s -o /dev/null -w "www: %{http_code} -> %{redirect_url}\n" https://www.aluisiomontadordemoveis.com.br/

# 3. O endereço antigo redireciona para o novo?
curl -s -o /dev/null -w "antigo: %{http_code} -> %{redirect_url}\n" \
  https://beyondbitsltda.github.io/Montador-de-moveis-Profissional/

# 4. O canonical aponta para o domínio novo?
curl -s https://aluisiomontadordemoveis.com.br/ | grep -o 'rel="canonical" href="[^"]*"'

# 5. As avaliações e a galeria continuam no ar?
curl -s -o /dev/null -w "reviews.json: %{http_code}\n" https://aluisiomontadordemoveis.com.br/reviews.json
curl -s -o /dev/null -w "manifest: %{http_code}\n" https://aluisiomontadordemoveis.com.br/galeria-manifest.json
```

O site funciona igual na raiz e em subpasta porque todos os caminhos internos são relativos — foi exatamente por isso que eles foram feitos assim.

---

## ✦ Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| GitHub: *"Domain does not resolve to the GitHub Pages server"* | DNS ainda propagando, ou registro digitado errado | Confira os 4 IPs no Registro.br e clique em **Check again** |
| GitHub: *"Domain is already taken"* | O domínio está configurado em outro repositório | Remova de lá primeiro; um domínio serve um site só |
| **Enforce HTTPS** continua acinzentado | Certificado ainda não emitido | Espere. Passando de 1h, remova e recoloque o domínio |
| Site abre sem estilo, ou galeria vazia | Cache do navegador com a versão antiga | Ctrl+Shift+R, ou janela anônima |
| `www` não abre | Falta o `CNAME` do `www`, ou falta o ponto final no valor | Confira o registro `www` no Registro.br |
| Aviso de certificado inválido | Certificado do endereço anterior ainda em cache | Espere alguns minutos e recarregue |
| Endereço antigo não redireciona | O `CNAME` não chegou ao repositório | Confirme que o `git push` foi feito e que o arquivo está na raiz |

---

## ✦ Se um dia trocar de domínio

Troque a URL em 5 lugares — `CNAME`, `index.html`, `robots.txt`, `sitemap.xml` e `SEO.md` — e refaça os passos 1 a 6. O find/replace do VS Code (Ctrl+Shift+H) resolve em um comando. Detalhes na seção 3.1 do [SEO.md](SEO.md).
