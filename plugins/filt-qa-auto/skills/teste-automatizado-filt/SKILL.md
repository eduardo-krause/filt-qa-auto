---
name: teste-tarefa
description: Valida uma tarefa do Jira (NMTZ-XXXX) do ERP Filt/Nimitz de ponta a ponta executando os testes por uma suíte automatizada — lê a tarefa, monta o plano (com casos de limite/negativos), monta ou reaproveita a suíte da tarefa, roda no AT da própria tarefa (tela com Playwright + conferência no banco), analisa cada resultado e gera o PDF com parecer. Só roda quando a pessoa digita /teste-tarefa (ou /filt-qa-auto:teste-tarefa).
disable-model-invocation: true
---

# Validar tarefa do Filt com testes automatizados

Chamar esta skill = **validar a tarefa que a pessoa passar**, do começo ao fim, sem menu de opções. Cada caso vira código numa suíte da tarefa, que roda sozinha e pode ser repetida em todo reteste (reprovação que volta, deploy no meio). O que não dá para automatizar é feito pela tela com as ferramentas desta skill.
O plugin é **independente**: regras do sistema, critérios, ferramentas e relatório estão todos nele. Os dados pessoais ficam em `~/.claude/filt-qa/config.json` (só lido; criado por `ferramentas/configurar.py`).

## O que é cada coisa
| Peça | Onde fica | O que é |
|---|---|---|
| **Motor** | `motor/` (nesta skill) | roda a suíte: login no AT, conferência do DF-e, executa os casos, grava o resultado |
| **App mobile** | `passos/mobile/app-pedido-venda/*.js` + `passos/_adb.js` | app Android (emulador/celular) comandado por adb: login, atualizar dados, novo pedido, item defensivo, enviar. Usuário do app diferente do usuário do motor (um login por usuário). **APK da tarefa:** `python ferramentas/apk.py <NMTZ>` (Jenkins: decide BRANCH/FLAVOR pelos repositórios da tarefa, DESTINO sempre `apk`, baixa e instala) |
| **Passos** | `passos/<área>/<tela>/<cenário>.js` (nesta skill) | **uma pasta por tela** (item do menu) e **um arquivo por cenário**, com o nome da ação: `vendas/pedido-venda/criar-pedido.js`, `fiscal/nota-fiscal/excluir-nota.js`, `mobile/app-pedido-venda/trocar-receituario-padrao.js`. Na suíte: `t.passos.vendas.pedidoVenda.criar(...)`. Ajudantes em `<tela>/_apoio.js` e `passos/_*.js` (não viram passo); nomes antigos por `passos/_atalhos.js`. Regras completas em `referencias/escrever-suite.md`. Mudou a tela num deploy → conserta aqui e vale para todas as suítes |
| **Suíte** | `~/.claude/historico-validacoes/<NMTZ>/automacao/suite.js` | os casos de UMA tarefa: dados, passos e resultado esperado. Fica fora do plugin porque tem base/cliente da pessoa |
| **Nome dos casos** | na suíte | `id` em kebab-case com tela + ação + dado (`caso-04-calculo-simples-qtd-10-20`, `faturar-pedido-app-407-receituario`), título em frase completa. Nada de sigla (`ESTQ`, `P407`) |
| **Resultado** | `.../<NMTZ>/automacao/resultados/` | `ultimo.md` (legível), `.json` completo e `casos-para-dados-json.json` (formato do relatório) |
| **Ferramentas** | `ferramentas/` (nesta skill) | scripts para o que a suíte não cobre: `run.js`/`browser.js` (tela, casos manuais, produção), `db.py` (consulta), `jira.py` (tarefa pela API, só leitura), `apk.py` (APK do app), `checar_dfe.py`, `gravar.js` (vídeo, só se pedido), `relatorio.py` (PDF), `configurar.py`/`checar_config.py`/`migrar_filt_qa.py` (preparar a máquina e tirar o filt-qa antigo). Uso em `referencias/ferramentas.md` |
| **Índice por tela** | `~/.claude/historico-validacoes/indice-testes-automatizados.md` | todos os casos automatizados de todas as tarefas, agrupados pela tela que usam |

Guia para escrever suíte e passo: `referencias/escrever-suite.md` (ler ao montar ou alterar uma suíte).
Referências em `referencias/` (ler quando a situação aparecer): `criterios-de-julgamento.md` (regras invioláveis e o que é/não é bug), `ferramentas.md`, `relatorio.md` (formato do `dados.json`), `producao.md` (comparar com produção), `layout-e-design-system.md` (tarefa de tela/componente), `primeira-vez.md` (máquina ainda não preparada), `mapa-telas.md` (onde fica cada coisa em cada tela — gerado por `node motor/mapa.js`).

## Conhecimento do sistema e critérios
- **Como o sistema funciona** (fluxos de tela, rotas, componentes, onde cada dado fica no banco, regras de negócio confirmadas): skill **`regras-sistema-filt`** deste plugin — carregada no Passo 1; reler a referência da rotina antes de escrever ou consertar um passo.
- **O que é e o que não é bug** e as regras invioláveis: `referencias/criterios-de-julgamento.md`. Vale para analisar todo caso que não der OK.
- **Fluxo novo descoberto** (botão, painel, máscara, rota, tabela): anotar em `~/.claude/filt-qa/fluxos-novos.md` com a data e o tipo — `[fato]` sozinho; `[regra]` (regra de negócio) **só depois de perguntar à pessoa**; `[critério]` quando a pessoa decide o que é ou não bug. Escrever genérico, sem id de tarefa, base, CPF ou nome de pessoa. O mantenedor integra essas linhas na `regras-sistema-filt` do repositório e publica.

## Preparar (sem perguntar nada)
1. Na pasta `ferramentas/`: `python checar_config.py` (no Linux/WSL, `python3`). Se não der `ok: true`, ler `referencias/primeira-vez.md` e preparar a máquina e os dados da pessoa antes de tudo. Se `opcionais_faltando` trouxer `jira.token` ou `jenkins.token`, pedir à pessoa (junto com o Passo 0, uma vez só) as chaves de API, com o passo a passo de `primeira-vez.md` — elas poupam os tokens dela; se recusar, seguir pelo conector MCP.
   Se vier `migrar: true`, rodar `python migrar_filt_qa.py` (mesma pasta) **antes de tudo**: tira o plugin antigo `filt-qa` e as tarefas agendadas dele e agenda a atualização semanal do `filt-qa-auto`, mantendo `config.json`, `fluxos-novos.md` e o histórico. Dizer à pessoa em uma linha o que foi removido; se `reiniciar_claude: true`, pedir que feche e abra o Claude Code depois desta validação.
2. Na pasta `motor/`: se não houver `node_modules`, rodar `npm install` (instala só o `mysql2`; o Playwright é o do `config.json` → `playwright.nodeModules`).

## Passo 0 — Antes de começar, SEMPRE pedir à pessoa
Logo ao iniciar, mesmo que o comando venha com argumento, pedir **numa pergunta só** e **não começar sem as três**:
1. **A tarefa no Jira** (link ou chave `NMTZ-XXXX`).
2. **A URL do AT** da tarefa. Não deduzir pelo número da tarefa.
3. **A base** (empresa do login) nesse AT. Não deduzir; usar exatamente a informada.

Se a URL citar outra demanda (número `nmtz-` diferente da tarefa), não usar: avisar e pedir a URL certa.

## Passo 1 — Carregar as regras (sempre, logo depois do Passo 0)
1. **Regras de negócio e fluxos:** invocar a skill **`filt-qa-auto:regras-sistema-filt`** (ferramenta Skill) e ler as referências das rotinas que a tarefa toca.
2. **Regras ainda não publicadas:** `~/.claude/filt-qa/fluxos-novos.md` (`[regra]` = regra confirmada; `[critério]` = critério de julgamento).
3. **Critérios de julgamento e regras invioláveis:** `referencias/criterios-de-julgamento.md`.
4. **O que já se sabe da tarefa:** `~/.claude/historico-validacoes/<NMTZ>/` — `dados.json`, `progresso-*.md`, relatórios anteriores e a suíte, se já existir.

Regra de negócio que **não** estiver nessas fontes não é deduzida da tela: parar e perguntar à pessoa antes de escrever o `esperado`.

## Passo 2 — Entender a tarefa
**Sempre primeiro pela chave de API** (poupa tokens): `python ferramentas/jira.py <NMTZ>` (descrição, Casos de testes, Plano de Testes, Motivo Reprovação, comentários, links, anexos, histórico de status) e `python ferramentas/jira.py <NMTZ> dev` (repositórios alterados: app e/ou backend). Só leitura (GET). Se `jira.py` responder `SEM TOKEN`, pedir o token à pessoa como em `referencias/primeira-vez.md`; se ela não quiser, usar o conector: `getJiraIssue` (cloudId `nimitz.atlassian.net`, fields `summary, description, customfield_10050, customfield_10049, status, comment, attachment, issuelinks` — `customfield_10050` = **Casos de testes**, `customfield_10049` = Plano de Testes —, `expand: "changelog"`, `responseContentFormat: "markdown"`), links de Confluence da descrição (`searchConfluenceUsingCql` para a rotina), tarefas ligadas. **Reteste:** levantar **todas** as reprovações anteriores (campo "Motivo Reprovação", comentários, relatórios anteriores) — cada uma vira caso.

## Passo 3 — Plano de casos
- **Primeiro todos os casos do campo "Casos de testes"**, com o número e o título do Jira (regra 3 de `criterios-de-julgamento.md`); conferir que o plano tem a mesma quantidade. Depois o que faltar de descrição/critérios/comentários entra como ADICIONADO.
- Cada caso num checklist numerado com a origem, o cenário com dados concretos e o **esperado calculado** (números exatos).
- **Reprovações anteriores** como casos (`R01`, `R02`...).
- **ADICIONADO — fluxos vizinhos** (cancelamento, exclusão, devolução, venda futura, permissões, telas que mostram o dado).
- **ADICIONADO — limites/negativos** em volta de cada valor/quantidade que a tarefa mexe (reduzir abaixo do lançado, passar do saldo, ordem inversa/repetida, editar depois de faturar/antecipar), conferindo que a validação barra **antes** de gravar.
- O que não dá para automatizar (layout, impressão física, conferência visual) fica no plano como **manual** e é feito pela tela com `ferramentas/run.js` (`referencias/ferramentas.md`; mesmo usuário → não rodar junto com a suíte).
- Mostrar o plano à pessoa e **seguir direto** (não esperar ok), a menos que haja dúvida de regra de negócio.

## Passo 4 — Montar ou atualizar a suíte da tarefa
- **Suíte já existe** (reteste): reaproveitar; conferir `at.url`/`at.base` com o Passo 0 e atualizar se o AT mudou; acrescentar os casos novos (reprovações novas, limites que faltavam).
- **Suíte nova:** `automacao/suite.js` a partir de `modelos/suite-modelo.js` — **um caso para cada item do plano**, com `origem`, `telas` (nome do item no menu), `esperado` e conferências no banco. Função `preparar(t)` para pré-condições (estoque, cadastros).
- **Reaproveitar** os passos de `passos/` (procurar pela pasta da tela e pelo nome da ação). Ação que não existe → **arquivo novo** `passos/<área>/<tela>/<verbo-objeto>.js` (genérico), um cenário por arquivo; tela nova → pasta nova. Nunca juntar várias ações num arquivo genérico. **Passo novo roda primeiro sozinho** (`--casos X`) e só entra na rodada completa depois de funcionar.
- Antes de cadastrar dado, procurar na base o que serve (regra 8 de `criterios-de-julgamento.md`).
- **Onde fica cada coisa:** primeiro `referencias/mapa-telas.md` (rota, campos, ids, botões, ⋮, tabelas e passos prontos de cada tela, gerado dos passos que funcionam). O que não estiver lá → código-fonte (disco Z:), como sempre.

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

Erro de passo **não** vira resultado da tarefa: corrigir o passo e rodar de novo até cada caso ter status real. Bug e alerta que não dependem da tarefa: comparar com produção (`referencias/producao.md`, comandos rodados em `ferramentas/`).

## Passo 7 — Relatório
Montar `<NMTZ>/dados.json` (formato em `referencias/relatorio.md`) a partir de `resultados/casos-para-dados-json.json` + casos manuais + bugs (da tarefa e fora) + pontos para a PO, e gerar o PDF com `python ferramentas/relatorio.py <NMTZ>/dados.json`. Parecer **APROVAR** só com todos os casos da tarefa OK. Responder com parecer, falhas (com números), **todos os bugs** e o caminho do PDF.

## Passo 8 — Encerramento
- Fluxos novos em `~/.claude/filt-qa/fluxos-novos.md` (tipos acima); `node motor/indice.js` para atualizar o índice por tela; `node motor/mapa.js` para atualizar o mapa das telas (sempre que criar ou consertar passo).
- Passo genérico criado ou corrigido fica nesta skill — avisar a pessoa (publicar no GitHub só com ok dela).

## Navegador do motor × ferramentas
- O motor e as `ferramentas/` têm portas, navegador, perfil e sessão separados; os dois só **leem** o `config.json` e o banco.
- **Único conflito:** o mesmo usuário logado nos dois ao mesmo tempo derruba a sessão do outro (o sistema aceita um login por usuário). Enquanto a suíte roda, não fazer login pelo `run.js` com o mesmo usuário (nem pelo navegador da pessoa com o mesmo CPF). Se acontecer, o motor para com "SESSÃO DERRUBADA" e diz de qual caso continuar (`--de <caso>`).

## Economia de contexto (sem trocar qualidade por economia)
Medido nas validações: ~75% do custo é a conversa inteira sendo relida a cada chamada — sessões longas chegam a 400–800 mil tokens de contexto e 150–480 chamadas. O que encarece é **contexto grande × muitas chamadas**, não as regras. Por isso:
1. **Ciclo de "fazer funcionar" vai para um subagente do mesmo modelo** (ferramenta Agent **sem** `model`, herda o meu): criar ou consertar um passo até o caso rodar (`--casos X`), achar no código do Z: a rota/id de campo/tabela que não está no `mapa-telas.md`, montar o `preparar(t)`. O prompt leva: `FILT_QA_TAREFA`, caminho da suíte e do passo, o que o caso precisa fazer, as regras invioláveis 1–5 e o que devolver — arquivos alterados, comando que passou, uma linha por caso e **tudo o que viu de diferente** (erro, aviso, toast, valor inesperado, tela estranha) com a mensagem exata. Ele **não decide se é bug** e **para e devolve** em vez de contornar (teclado no lugar do clique, `force`, repetir até passar, JS) — contorno é achado (ver `criterios-de-julgamento.md`). Enquanto ele usa o navegador/motor, não rodar nada com o mesmo usuário.
   **Fica comigo, na conversa principal:** plano e `esperado`, análise de todo ❌ FALHOU e ⚠️ ERRO que não seja "tela mudou", reproduzir reprovação, layout, comparação com produção, pergunta de regra de negócio, relatório. Conferir no banco/código o que o subagente devolveu antes de usar.
2. **Menos chamadas:** chamadas independentes na mesma resposta; várias ações num único `acoes`; várias conferências numa só consulta do `db.py`.
3. **Saída curta:** arquivo grande por trecho (`grep -n` + `sed -n`), nunca `cat` de suíte/passo/resultado inteiro; saídas longas com `| tail`/`| head`; do `ultimo.md` só os casos que não deram OK.
4. **Pausa entre fases:** ao fechar uma fase (plano, suíte rodando, análise), atualizar `<NMTZ>/progresso-<data>.md` com o estado (casos e status, o que falta, achados ainda sem conclusão). Se a conversa já estiver longa, sugerir à pessoa `/clear` e chamar a skill de novo — o Passo 1 retoma pelo progresso.
Consumo por sessão para comparar antes/depois: `python ferramentas/medir_consumo.py [NMTZ-XXXX]`.

## Regras invioláveis (resumo — completas em `referencias/criterios-de-julgamento.md`)
1. **Só o AT da própria tarefa** — o login recusa URL de outra demanda ou de produção.
2. **AT com problema → parar e avisar** — o motor faz isso sozinho (⛔ BLOQUEADO) quando uma chamada fica sem resposta por mais de 60 s.
3. **DF-e**: o motor confere no início; com qualquer documento em PRODUÇÃO não roda. Nunca alterar a configuração de DF-e.
4. **Banco só leitura** — o motor bloqueia escrita e outro banco. Mudança de dado é sempre pela tela.
5. **Nada no Jira** — nem comentário, anexo, status ou worklog.
6. **Regra de negócio passa pela pessoa** — o `esperado` de cada caso vem do que já foi confirmado (tarefa, PO, validação manual). Divergência nova vira pergunta, não regra.
7. **Sem vídeo e sem print** por padrão; a evidência de falha é texto (tela, avisos, chamadas com erro).
