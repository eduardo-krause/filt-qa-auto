---
name: teste-automatizado-filt
description: Valida uma tarefa do Jira (NMTZ-XXXX) do ERP Filt/Nimitz de ponta a ponta executando os testes por uma suíte automatizada — lê a tarefa, monta o plano (com casos de limite/negativos), monta ou reaproveita a suíte da tarefa, roda no AT da própria tarefa (tela com Playwright + conferência no banco), analisa cada resultado e gera o PDF com parecer. Só roda quando a pessoa digita /teste-automatizado-filt.
disable-model-invocation: true
---

# Validar tarefa do Filt com testes automatizados

Chamar esta skill = **validar a tarefa que a pessoa passar**, do começo ao fim, sem menu de opções. A diferença para o `/validar-tarefa-filt` é **como os testes são executados**: aqui cada caso vira código numa suíte da tarefa, que roda sozinha e pode ser repetida em todo reteste (reprovação que volta, deploy no meio).
Usa o mesmo `~/.claude/filt-qa/config.json` do validador (só lê), mas tem sessão, navegador e porta próprios.

## O que é cada coisa
| Peça | Onde fica | O que é |
|---|---|---|
| **Motor** | `motor/` (nesta skill) | roda a suíte: login no AT, conferência do DF-e, executa os casos, grava o resultado |
| **App mobile** | `passos/mobile/app-*.js` + `passos/_adb.js` | app Android (emulador/celular) comandado por adb: login, atualizar dados, novo pedido, item defensivo, enviar. Usuário do app diferente do usuário do motor (um login por usuário) |
| **Passos** | `passos/<área>/<tela-fluxo>.js` (nesta skill) | ações prontas, uma pasta por área e **um arquivo por tela/fluxo específico**, com nome que diz o que faz: `fiscal/nota-entrada-compra.js`, `fiscal/nota-venda.js`, `vendas/pedido-criar.js`, `vendas/pedido-ordem-entrega.js`, `mobile/app-item-defensivo.js`. Nada de arquivo genérico com tudo dentro (`nota.js` e `pedido.js` ficaram só como atalho para suítes antigas). Na suíte: `t.passos.fiscal.notaEntradaCompra.entradaTerceiros(...)` (o nome com hífen também responde em camelCase). Arquivos de apoio (`_comum.js`, `_nota.js`, `_pedido.js`, `_adb.js`) ficam na raiz de `passos/` e não viram passo. Mudou a tela num deploy → conserta aqui e vale para todas as suítes |
| **Suíte** | `~/.claude/historico-validacoes/<NMTZ>/automacao/suite.js` | os casos de UMA tarefa: dados, passos e resultado esperado. Fica fora do plugin porque tem base/cliente da pessoa |
| **Nome dos casos** | na suíte | `id` em kebab-case com tela + ação + dado (`caso-04-calculo-simples-qtd-10-20`, `faturar-pedido-app-407-receituario`), título em frase completa. Nada de sigla (`ESTQ`, `P407`) |
| **Resultado** | `.../<NMTZ>/automacao/resultados/` | `ultimo.md` (legível), `.json` completo e `casos-para-dados-json.json` (formato do relatório) |
| **Índice por tela** | `~/.claude/historico-validacoes/indice-testes-automatizados.md` | todos os casos automatizados de todas as tarefas, agrupados pela tela que usam |

Guia para escrever suíte e passo: `referencias/escrever-suite.md` (ler ao montar ou alterar uma suíte).
**Scripts do validador** (relatório, produção, consultas avulsas): pasta `skills/validar-tarefa-filt/scripts` da versão mais nova do plugin `filt-qa` instalado (`~/.claude/plugins/cache/filt-qa/filt-qa/<versão>/...`).

## Conhecimento do sistema e critérios — vêm do plugin `filt-qa` (não copiar para cá)
Esta skill **não tem regras próprias do sistema**: usa as que a equipe já mantém no plugin `filt-qa` (precisa estar instalado).
- **Como o sistema funciona** (fluxos de tela, rotas, componentes, onde cada dado fica no banco, regras de negócio confirmadas): skill **`regras-sistema-filt`** — carregada no Passo 1; reler a referência da rotina antes de escrever ou consertar um passo.
- **O que é e o que não é bug** e as regras invioláveis: seções "Regras invioláveis" e "Critérios de julgamento" do `SKILL.md` da skill **`validar-tarefa-filt`**. Valem para analisar todo caso que não der OK.
- **Fluxo novo descoberto** (botão, painel, máscara, rota, tabela): anotar em `~/.claude/filt-qa/fluxos-novos.md` com a data e o tipo — `[fato]` sozinho; `[regra]` (regra de negócio) **só depois de perguntar à pessoa**; `[critério]` quando a pessoa decide o que é ou não bug. Nunca escrever regra de sistema nesta skill.

## Preparar (sem perguntar nada)
1. `~/.claude/filt-qa/config.json` precisa existir (é criado pelo validador). Se não existir, mandar a pessoa rodar `/validar-tarefa-filt` uma vez.
2. Na pasta `motor/`: se não houver `node_modules`, rodar `npm install` (instala só o `mysql2`; o Playwright é o do validador).

## Passo 0 — Antes de começar, SEMPRE pedir à pessoa
Logo ao iniciar, mesmo que o comando venha com argumento, pedir **numa pergunta só** e **não começar sem as três**:
1. **A tarefa no Jira** (link ou chave `NMTZ-XXXX`).
2. **A URL do AT** da tarefa. Não deduzir pelo número da tarefa.
3. **A base** (empresa do login) nesse AT. Não deduzir; usar exatamente a informada.

Se a URL citar outra demanda (número `nmtz-` diferente da tarefa), não usar: avisar e pedir a URL certa.

## Passo 1 — Carregar as regras (sempre, logo depois do Passo 0)
1. **Regras de negócio e fluxos:** invocar a skill **`filt-qa:regras-sistema-filt`** (ferramenta Skill) e ler as referências das rotinas que a tarefa toca.
2. **Regras ainda não publicadas:** `~/.claude/filt-qa/fluxos-novos.md` (`[regra]` = regra confirmada; `[critério]` = critério de julgamento).
3. **Critérios de julgamento e regras invioláveis:** `SKILL.md` da `validar-tarefa-filt`.
4. **O que já se sabe da tarefa:** `~/.claude/historico-validacoes/<NMTZ>/` — `dados.json`, `progresso-*.md`, relatórios anteriores e a suíte, se já existir.

Regra de negócio que **não** estiver nessas fontes não é deduzida da tela: parar e perguntar à pessoa antes de escrever o `esperado`.

## Passo 2 — Entender a tarefa
Igual ao Passo 1 do validador: `getJiraIssue` (cloudId `nimitz.atlassian.net`, fields `summary, description, status, comment, attachment, issuelinks`, `expand: "changelog"`, markdown), links de Confluence da descrição, tarefas ligadas. **Reteste:** levantar **todas** as reprovações anteriores (campo "Motivo Reprovação", comentários, relatórios anteriores) — cada uma vira caso.

## Passo 3 — Plano de casos
- Cada critério/caso da tarefa num checklist numerado com a origem, o cenário com dados concretos e o **esperado calculado** (números exatos).
- **Reprovações anteriores** como casos (`R01`, `R02`...).
- **ADICIONADO — fluxos vizinhos** (cancelamento, exclusão, devolução, venda futura, permissões, telas que mostram o dado).
- **ADICIONADO — limites/negativos** em volta de cada valor/quantidade que a tarefa mexe (reduzir abaixo do lançado, passar do saldo, ordem inversa/repetida, editar depois de faturar/antecipar), conferindo que a validação barra **antes** de gravar.
- O que não dá para automatizar (layout, impressão física, conferência visual) fica no plano como **manual** e é feito pela tela na própria sessão.
- Mostrar o plano à pessoa e **seguir direto** (não esperar ok), a menos que haja dúvida de regra de negócio.

## Passo 4 — Montar ou atualizar a suíte da tarefa
- **Suíte já existe** (reteste): reaproveitar; conferir `at.url`/`at.base` com o Passo 0 e atualizar se o AT mudou; acrescentar os casos novos (reprovações novas, limites que faltavam).
- **Suíte nova:** `automacao/suite.js` a partir de `modelos/suite-modelo.js` — **um caso para cada item do plano**, com `origem`, `telas` (nome do item no menu), `esperado` e conferências no banco. Função `preparar(t)` para pré-condições (estoque, cadastros).
- **Reaproveitar** os passos de `passos/`. Ação que não existe → criar no arquivo da tela (genérico). **Passo novo roda primeiro sozinho** (`--casos X`) e só entra na rodada completa depois de funcionar.
- Antes de cadastrar dado, procurar na base o que serve (regra 8 do validador); conferir rotas e ids de campo no código-fonte (disco Z:).

## Passo 5 — Rodar
```bash
node motor/executar.js <suite.js> --listar        # conferir a lista
node motor/executar.js <suite.js>                 # tudo (em segundo plano: run_in_background, sem ficar consultando)
node motor/executar.js <suite.js> --casos R01     # só esse (e o que ele precisa)
node motor/executar.js <suite.js> --de 7 --parar  # a partir do 7, parando no 1º problema
```
O terminal mostra uma linha por caso; o detalhe está em `resultados/ultimo.md`. Ler só o trecho dos casos que não deram OK.

## Passo 6 — Analisar cada resultado (o julgamento é sempre meu)
| Status | Quer dizer | O que fazer |
|---|---|---|
| ✅ OK | todas as conferências bateram | conferir que o caso testou o que devia (o próprio teste pode estar errado) |
| ❌ FALHOU | valor diferente do esperado | **possível bug**: conferir no banco, na tela e no código; reproduzir antes de afirmar; se confirmar, vira reprovação (numeração do Jira) ou bug fora da tarefa |
| ⚠️ ERRO | o passo não conseguiu agir | olhar a evidência; tela mudou → consertar o **passo** e rodar o caso de novo; comportamento novo do sistema → investigar como bug |
| ⛔ BLOQUEADO | AT travado, sessão derrubada, DF-e em produção, estoque | parar e avisar a pessoa (ou preparar o dado, se for pré-condição) |
| ⏭️ PULADO | dependia de um caso que não deu OK / caso manual | resolver o anterior e rodar de novo |

Erro de passo **não** vira resultado da tarefa: corrigir o passo e rodar de novo até cada caso ter status real. Bug e alerta que não dependem da tarefa: comparar com produção como manda o validador (`referencias/producao.md` dele).

## Passo 7 — Relatório
Montar `<NMTZ>/dados.json` (formato em `referencias/relatorio.md` do validador) a partir de `resultados/casos-para-dados-json.json` + casos manuais + bugs (da tarefa e fora) + pontos para a PO, e gerar o PDF com o `relatorio.py` do validador. Parecer **APROVAR** só com todos os casos da tarefa OK. Responder com parecer, falhas (com números), **todos os bugs** e o caminho do PDF.

## Passo 8 — Encerramento
- Fluxos novos em `~/.claude/filt-qa/fluxos-novos.md` (tipos acima); `node motor/indice.js` para atualizar o índice por tela.
- Passo genérico criado ou corrigido fica nesta skill — avisar a pessoa (publicar no GitHub só com ok dela).

## Convivência com o validador
- Portas, navegador, perfil e sessão são separados; as duas skills só **leem** o `config.json` e o banco. Podem estar instaladas e abertas juntas.
- **Único conflito:** o mesmo usuário logado nas duas ao mesmo tempo derruba a sessão da outra (o sistema aceita um login por usuário). Enquanto a suíte roda, não fazer login pelo validador com o mesmo usuário (nem pelo navegador da pessoa com o mesmo CPF). Se acontecer, o motor para com "SESSÃO DERRUBADA" e diz de qual caso continuar (`--de <caso>`).
- As duas escrevem em `~/.claude/filt-qa/fluxos-novos.md` só acrescentando linhas (nunca reescrevem).

## Regras invioláveis (as mesmas do validador)
1. **Só o AT da própria tarefa** — o login recusa URL de outra demanda ou de produção.
2. **AT com problema → parar e avisar** — o motor faz isso sozinho (⛔ BLOQUEADO) quando uma chamada fica sem resposta por mais de 60 s.
3. **DF-e**: o motor confere no início; com qualquer documento em PRODUÇÃO não roda. Nunca alterar a configuração de DF-e.
4. **Banco só leitura** — o motor bloqueia escrita e outro banco. Mudança de dado é sempre pela tela.
5. **Nada no Jira** — nem comentário, anexo, status ou worklog.
6. **Regra de negócio passa pela pessoa** — o `esperado` de cada caso vem do que já foi confirmado (tarefa, PO, validação manual). Divergência nova vira pergunta, não regra.
7. **Sem vídeo e sem print** por padrão; a evidência de falha é texto (tela, avisos, chamadas com erro).
