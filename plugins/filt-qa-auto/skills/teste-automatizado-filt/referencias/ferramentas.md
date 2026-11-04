# Ferramentas de tela, banco e relatório (casos manuais, produção, vídeo, PDF)

Ficam em `ferramentas/` desta skill (rodar com Bash a partir dela). Servem para o que a suíte não cobre: casos manuais (layout, conferência visual), consultas avulsas no banco, comparação com produção, vídeo quando pedido e o PDF. O motor (`motor/`) não depende delas.

## Sessão por tarefa
Comece **todo** comando com a variável da tarefa: `export FILT_QA_TAREFA=NMTZ-XXXX && node run.js ...` (ou `FILT_QA_TAREFA=NMTZ-XXXX python db.py ...`).
Cada tarefa tem **sessão, porta do navegador e perfil próprios** (`~/.claude/filt-qa/sessoes/<tarefa>.json`), então duas validações ao mesmo tempo não se misturam. O `login` recusa se a tarefa do argumento for diferente da variável. Sem a variável, os scripts usam a sessão "padrao" — só para teste rápido.

## Credenciais
Cada pessoa tem o **próprio** `~/.claude/filt-qa/config.json` (modelo: `config.example.json` na raiz do plugin; nunca vai para o repositório). Usuários em `erp.usuarios`:

| Usuário | Quando usar |
|---|---|
| `principal` | padrão, todas as validações |
| `secundario` | tarefas de **controle de acesso/permissões**: validar o que o usuário com perfil diferente vê/não vê e comparar com o principal |

```bash
node run.js login '{"tarefa":"NMTZ-XXXX","url":"<URL do AT>","base":"<base informada>"}'                           # principal
node run.js login '{"tarefa":"NMTZ-XXXX","url":"<URL do AT>","base":"<base informada>","usuario":"secundario"}'    # secundário (troca de sessão no mesmo navegador)
```
Banco de homologação: `config.json` → `db` (acesso via `db.py`, sempre no banco do AT da tarefa).

## Navegador e tela
```bash
node browser.js start
node run.js login '{"tarefa":"NMTZ-XXXX","url":"<URL do AT informada pela pessoa>","base":"<base informada pela pessoa>"}'     # grava a sessão da tarefa (base, banco CLIENTE_x)
```
Se retornar `PROBLEMA NO AT DA TAREFA`, parar e reportar (regra 2).
**Reaproveitar** itens, pessoas e demais cadastros que já existem na base (procurar no banco/tela os que servem ao cenário). Criar cadastro novo só se for realmente necessário (regra 8).
Antes da primeira emissão de documento fiscal: `python checar_dfe.py` (lê `CONFIGURACAO_DOCUMENTO_FISCAL_ELETRONICO`: NFE/NFCE/CTE/MDFE_AMBIENTE) ou, em base sem banco liberado, `node run.js checar_dfe_tela '{}'` (lê as abas da tela `/fiscal/configuracao-dfe`). Só emite se nenhum estiver em Produção. **A trava fica dentro do `salvar`**: qualquer passo que salve em rotina fiscal é bloqueado sem essa conferência, inclusive os passos próprios. Nunca alterar essa configuração.
Passos genéricos (valem para qualquer tela):
```bash
node run.js abrir   '{"rota":"/nota/nota-fiscal","novo":true}'        # rotas: menus-by-user / regras-sistema-filt
node run.js retrato '{}'                                               # campos+valores, botões, diálogos, obrigatórios, tabelas (texto)
node run.js acoes   '{"acoes":[{"ac":["Natureza de Operação","COMPRA DE MERCADORIA"]},{"moeda":["Valor Unitário",100]},{"salvar":true}]}'
```
Ações de `acoes`: `ac`, `dd`, `texto`, `moeda` (casas 2; desconto unitário 5), `moedaId`, `clicar`, `clicarXY`, `tecla`, `salvar`, `acerto`, `docRef`, `menu`, `confirmar`, `esperar`, `print` (detalhes no topo de `steps/acoes.js`).
- Tela desconhecida: `retrato` primeiro, depois agir. Para fluxos longos/repetitivos, escrever um passo próprio `.js` (exporta `async (p, args, lib, ctx)`) e rodar `node run.js caminho/passo.js '{...}'`.
- `salvar` devolve `status`: `salvo`, `acerto_financeiro` (→ ação `acerto`), `campos_obrigatorios` (lista do que falta).
- `dados.json` (e prints/vídeos, quando pedidos) ficam na pasta de trabalho da tarefa: `config.json` → `pastaTrabalho` (padrão `~/.claude/historico-validacoes/<tarefa>/`), **fora do skill**.
- Passos prontos e reutilizáveis em `ferramentas/passos/` (nota de entrada/saída, nota com documento referenciado, CT-e, editar/excluir CT-e, menu da nota, cadastro de item, consulta estoque, API com token, `v.py` para conferir médio). Rodar com `node run.js passos/js.js '{"file":"<caminho absoluto do passo>", ...}'`. Script específico de uma tarefa vai para a pasta de trabalho dela, não para o skill. **Antes de escrever um passo novo, conferir se já existe um aqui** (os argumentos estão no topo de cada arquivo):
  | Passo | Para quê |
  |---|---|
  | `nota_data.js` | nota pela tela com data de entrada retroativa + acerto (espera o Adicionar habilitar; fecha a confirmação Sefaz sem enviar) |
  | `duplicata.js` | acerto em Duplicata: forma de parcelamento, vencimentos de cada parcela, concluir |
  | `compra_futura.js` | compra para recebimento futuro (terceiros) com duplicata |
  | `nota_terceiro_ref.js` | nota de terceiros com documento referenciado (remessa de compra futura, devolução de terceiros) |
  | `chave.js` | chave de acesso fictícia com DV válido |
  | `pedido_compra.js` / `solicitacao_entrega.js` | pedido de compra; solicitação de entrega e aprovação |
  | `estoque_detalhe.js` / `estoque_lupa.js` | Consulta Estoque/Movimentação: cards do detalhe (olho) e lupas dos saldos pendentes |
  | `link_nova_aba.js` | clicar num hyperlink e conferir a nova aba |
  | `pessoa_cnpj.js` | cadastro de Pessoa pelo CNPJ (Receita) |
  | `exportar_xml.js` / `importacao_xml.js` | exportar XML de nota própria; importar XML real (com vínculo a pedido) até salvar |
  | `grupo_permissao.js` | ligar/desligar ações de um menu no Grupo de Usuários |
  | `tela_texto.js` | texto da tela a partir de um marcador (onde um assistente parou), sem imagem |

## Jira e APK pelas chaves de API (sempre preferir: poupam tokens)
```bash
python jira.py NMTZ-XXXX                       # tarefa inteira em texto (≈17 mil caracteres contra ≈145 mil do getJiraIssue)
python jira.py NMTZ-XXXX dev                   # branches/PRs: "APP alterado" e "backend alterado"
python jira.py NMTZ-XXXX campo customfield_10050
python jira.py NMTZ-XXXX anexo "<arquivo>" <pasta>
python apk.py NMTZ-XXXX [nimitz_pedido_mobile|produtor_rural_mobile] [--sem-instalar]
```
- `jira.py` só faz GET (regra 5). `apk.py` dispara o job `Nimitz/Mobile/Flutter_Android` com BRANCH = tarefa se o app mudou, senão `master` (o padrão do job, `main`, não existe nos apps); FLAVOR = tarefa se o backend mudou, senão `homolog`; DESTINO **sempre** `apk` (as opções `play_store_*` publicam na loja). Falha de checkout por `ClosedChannelException` é do agente do Jenkins: rodar de novo.
- O build manda o status sozinho ao painel "Desenvolvimento" da tarefa no Jira (é do pipeline, não é comentário).
- Credenciais em `config.json` → `jira` / `jenkins` (como criar: `primeira-vez.md`). Sem token: conector MCP e APK gerado pela pessoa.

## Banco
```bash
python db.py "select ... from ITEM_FILIAL_VALORES where ID_ITEM_FILIAL=<id>"
```
Só o banco do AT da tarefa; bloqueia escrita e outros bancos. Comparar **esperado × obtido** com os valores exatos. Divergência → investigar a causa (dados, regra, bug) antes de concluir.
Scripts auxiliares de uma tarefa (ex.: simulador de um cálculo) ficam na pasta de trabalho da tarefa, não no skill.

## Subagente para tarefas repetitivas
(O subagente do **mesmo modelo** para criar/consertar passo e procurar no código está em "Economia de contexto" no `SKILL.md`; esta seção é a do modelo mais barato, só para repetição.)
Para gastar menos, repetições podem ir para um subagente (ferramenta Agent, `model: "sonnet"`), que devolve só o resultado. **Regras:**
- **Só para trabalho repetitivo:** o mesmo fluxo várias vezes, mudando só os dados (ex.: lançar 6 notas iguais variando valor/quantidade, cadastrar vários itens do mesmo jeito, repetir a mesma consulta para vários registros).
- **A primeira execução é sempre minha**, na conversa principal: vejo a tela, confirmo o fluxo, ajusto o passo e confiro no banco. Só depois de funcionar comigo eu delego as repetições.
- O prompt do subagente leva: `FILT_QA_TAREFA`, a pasta dos scripts, o comando/passo exato que funcionou, a lista de dados de cada repetição, **as regras invioláveis 1, 2, 4 e 5** (só o AT da tarefa, parar se o AT der problema, DF-e, nada no Jira) e o que devolver (ex.: número/id do registro, `status` do salvar, valores lidos no banco). Nada de prints nem saídas completas de volta.
- **Bug nunca passa pelo subagente:** o prompt manda ele **parar na hora e me devolver** qualquer coisa diferente da primeira execução — erro, aviso, toast ou diálogo inesperado, campo obrigatório novo, tela diferente, valor diferente do esperado (passo o esperado de cada repetição) — **mesmo que pareça fora da tarefa ou pouco importante**. Ele não tenta contornar, não repete e não decide se é bug: devolve o passo em que parou, a mensagem exata e o `retrato` da tela naquele momento. Também devolve o que viu de estranho em outras telas pelo caminho.
- Ele usa o mesmo navegador da tarefa: **não rodar nada no navegador em paralelo** enquanto ele trabalha.
- **O julgamento é meu:** confiro no banco o que ele devolveu antes de dar status ao caso. Tudo o que ele relatar eu reproduzo na conversa principal; se for bug, sigo as regras normais (da tarefa/fora da tarefa, comparação com produção, relatório). As repetições que faltaram eu termino eu mesmo ou delego de novo só depois de entender o problema.
- **Não delegar:** primeira vez de qualquer fluxo, tela da tarefa sendo validada, layout, investigação de bug, gravação de vídeo (quando pedida), comparação com produção.

Ao terminar: `node browser.js stop`.
