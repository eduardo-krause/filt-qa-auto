---
name: teste-automatizado-filt
description: Testes automatizados do ERP Filt/Nimitz — transforma os casos de uma tarefa NMTZ já validada em uma suíte que roda sozinha no AT (tela com Playwright + conferência no banco), para retestar a cada deploy sem refazer tudo à mão. Monta a suíte, roda, lê o resultado e gera o índice por tela. Só roda quando a pessoa digita /teste-automatizado-filt.
disable-model-invocation: true
---

# Teste automatizado do Filt

Skill **separada do validador** (`/validar-tarefa-filt`): o validador descobre e julga; esta skill **repete** o que já foi descoberto.
Usa o mesmo `~/.claude/filt-qa/config.json` do validador (só lê), mas tem sessão, navegador e porta próprios — os dois podem rodar juntos.

## O que é cada coisa
| Peça | Onde fica | O que é |
|---|---|---|
| **Motor** | `motor/` (nesta skill) | roda a suíte: login no AT, conferência do DF-e, executa os casos, grava o resultado |
| **Passos** | `passos/<área>/<tela>.js` (nesta skill) | ações prontas, uma pasta por área e um arquivo por tela (`vendas/pedido.js`, `financeiro/baixa.js`...). Mudou a tela num deploy → conserta aqui e vale para todas as suítes |
| **Suíte** | `~/.claude/historico-validacoes/<NMTZ>/automacao/suite.js` | os casos de UMA tarefa: dados, passos e resultado esperado. Fica fora do plugin porque tem base/cliente da pessoa |
| **Resultado** | `.../<NMTZ>/automacao/resultados/` | `ultimo.md` (legível), `.json` completo e `casos-para-dados-json.json` (formato do relatório do validador) |
| **Índice por tela** | `~/.claude/historico-validacoes/indice-testes-automatizados.md` | todos os casos automatizados de todas as tarefas, agrupados pela tela que usam |

Guia para escrever suíte e passo: `referencias/escrever-suite.md` (ler ao montar ou alterar uma suíte).

## Conhecimento do sistema e critérios — vêm do plugin `filt-qa` (não copiar para cá)
Esta skill **não tem regras próprias do sistema**: usa as que a equipe já mantém no plugin `filt-qa` (precisa estar instalado).
- **Como o sistema funciona** (fluxos de tela, rotas, componentes, onde cada dado fica no banco, regras de negócio confirmadas): skill **`regras-sistema-filt`** — carregada no Passo 1; reler a referência da rotina antes de escrever ou consertar um passo.
- **O que é e o que não é bug** e as regras invioláveis: seções "Regras invioláveis" e "Critérios de julgamento" do `SKILL.md` da skill **`validar-tarefa-filt`**. Valem para analisar todo caso que não der OK (ex.: estado intermediário não é bug; conferir nova aba antes de reprovar; permissão se valida pela tela).
- **Fluxo novo descoberto** ao montar ou consertar um passo (botão, painel, máscara, rota, tabela): anotar em `~/.claude/filt-qa/fluxos-novos.md` com a data e o tipo, como manda o validador — `[fato]` sozinho; `[regra]` (regra de negócio) **só depois de perguntar à pessoa**; `[critério]` quando a pessoa decide o que é ou não bug. Dali vai para a equipe pelo `/compartilhar-regras`. Nunca escrever regra de sistema nesta skill.
- Os passos (`passos/`) guardam só **como operar** a tela; o **porquê** (regra) fica nas referências do `filt-qa`.

## Passo inicial — preparar
1. `~/.claude/filt-qa/config.json` precisa existir (é criado pelo validador). Se não existir, mandar a pessoa rodar `/validar-tarefa-filt` uma vez.
2. Na pasta `motor/`: se não houver `node_modules`, rodar `npm install` (instala só o `mysql2`; o Playwright é o do validador).

## Passo 0 — Antes de começar, SEMPRE pedir à pessoa
Logo ao iniciar a skill, mesmo que o comando venha com argumento, pedir **numa pergunta só** e **não começar sem as quatro**:
1. **A tarefa no Jira** (link ou chave `NMTZ-XXXX`).
2. **A URL do AT** da tarefa (ex.: `https://erp-homologacao-nmtz-<N>.viasoftcloud.com.br`). Não deduzir pelo número da tarefa.
3. **A base** (empresa do login) nesse AT. Não deduzir; usar exatamente a informada.
4. **O que fazer** (perguntar com estas palavras, sem letras):
   - **Montar a suíte** — a tarefa já foi validada à mão; transformar os casos dela em suíte automatizada (fluxo "Montar" abaixo).
   - **Rodar a suíte** — a suíte já existe; retestar tudo ou só alguns casos (dizer quais). Depois de rodar, sempre analisar o resultado.
   - **Ver o índice** — só listar os casos automatizados de todas as tarefas, por tela.

Se a URL citar outra demanda (número `nmtz-` diferente da tarefa), não usar: avisar e pedir a URL certa.

## Passo 1 — Carregar as regras logo depois do Passo 0 (sempre, antes de montar ou rodar)
1. **Regras de negócio e fluxos do sistema:** invocar a skill **`filt-qa:regras-sistema-filt`** (ferramenta Skill) e ler as referências das rotinas que a tarefa toca (pedido, nota, financeiro, estoque...). É de lá que saem o `esperado` dos casos, as consultas de conferência e como cada tela se comporta.
2. **Regras ainda não publicadas:** ler `~/.claude/filt-qa/fluxos-novos.md` — regras e fluxos confirmados que ainda não foram para o plugin (`[regra]` vale como regra de negócio confirmada; `[critério]` vale como critério de julgamento).
3. **Critérios de julgamento e regras invioláveis:** seções "Regras invioláveis" e "Critérios de julgamento" do `SKILL.md` da skill `validar-tarefa-filt` (no plugin `filt-qa` instalado).
4. **O que já se sabe da tarefa:** `~/.claude/historico-validacoes/<NMTZ>/` — `dados.json` (casos, esperado, reprovações, pontos para a PO), `progresso-*.md` e a suíte, se já existir.

Regra de negócio que **não** estiver em nenhuma dessas fontes não é deduzida do comportamento da tela: parar e perguntar à pessoa (regra 10 do validador) antes de escrever o `esperado`.
Se a suíte da tarefa já existe, conferir que `at.url` e `at.base` dela batem com o que a pessoa informou agora (o AT pode ter sido recriado); se não baterem, atualizar a suíte com o que a pessoa disse antes de rodar.

## Fluxo
### Montar a suíte de uma tarefa (depois da validação manual)
1. Usar a tarefa, a URL e a base do Passo 0 (mesmas regras do validador: nunca deduzir; AT de outra demanda = parar).
2. Reaproveitar o que a validação manual já deixou em `~/.claude/historico-validacoes/<NMTZ>/`: `dados.json` (casos, esperado, origem), `progresso-*.md` (ordem e dados que funcionaram), scripts da tarefa (fluxos que funcionaram) e o banco do AT (naturezas, formas, clientes, itens usados). **Não redescobrir o fluxo pela tela.**
3. Escrever `automacao/suite.js` a partir de `modelos/suite-modelo.js`: **um caso para cada caso da tarefa e cada reprovação**, com `origem`, `telas` (nome do item no menu), `esperado` em texto e as conferências com o valor exato. Nenhum caso da tarefa fica de fora; o que não dá para automatizar vai como caso com `manual: 'motivo'` (aparece como PULADO com o motivo).
4. Ação que ainda não existe em `passos/` → criar no arquivo da tela (genérico, sem dado de tarefa). Ação que só serve à tarefa → `automacao/passos/<área>/<arquivo>.js` da suíte.
5. `node motor/executar.js <suite.js> --listar` e mostrar a lista à pessoa.

### Rodar a suíte
```bash
node motor/executar.js <suite.js>                 # tudo
node motor/executar.js <suite.js> --casos R01     # só esse (e o que ele precisa)
node motor/executar.js <suite.js> --de 7 --parar  # a partir do 7, parando no 1º problema
```
- Demora (cria pedidos, emite notas): rodar em segundo plano (`run_in_background`) e esperar o aviso — **não ficar consultando**.
- O terminal mostra uma linha por caso; o detalhe está em `resultados/ultimo.md`. Ler só o trecho dos casos que não deram OK.

### Analisar o resultado (sempre depois de rodar — o julgamento é sempre meu)
| Status | Quer dizer | O que fazer |
|---|---|---|
| ✅ OK | todas as conferências bateram | nada |
| ❌ FALHOU | valor diferente do esperado | **possível bug**: reproduzir pela tela (com o validador), conferir no banco e no código; se confirmar, vira reprovação (numeração do Jira) |
| ⚠️ ERRO | o passo não conseguiu agir (botão sumiu, tela mudou, tempo) | olhar a evidência; se a tela mudou, consertar o **passo**; se é comportamento novo do sistema, investigar como bug |
| ⛔ BLOQUEADO | AT travado, DF-e em produção, regra violada | parar e avisar a pessoa (regra 2 do validador) |
| ⏭️ PULADO | dependia de um caso que não deu OK / caso manual | resolver o anterior e rodar de novo |

**Nunca** marcar um caso como OK no relatório só porque o motor deu OK se a pessoa pediu conferência de tela/layout — isso continua manual.
Para o relatório (PDF do validador): `resultados/casos-para-dados-json.json` tem os casos no formato do `dados.json`; juntar com bugs, pontos para a PO e comparação com produção, que continuam sendo feitos à mão.

### Ver o índice por tela
`node motor/indice.js` — regrava `indice-testes-automatizados.md` com todas as suítes da máquina. Rodar depois de criar uma suíte ou de uma execução.

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
