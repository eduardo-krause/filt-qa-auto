# Apontamento de Produção (Produção Interna)

## Rotas e menu
- Rotas (menus-by-user): relatório `/producao-interna/relatorios/apontamento-producao`; processo (criar/editar) `/producao-interna/apontamento-producao`; fórmula de produção `/producao-interna/formula-producao`; ordem de produção `/producao-interna/ordem-producao`.
- Caminho real do relatório no menu: **Relatórios » Produção Interna » Apontamento de Produção** (o processo fica em **Processos » Produção Interna » Apontamento de Produção**).

## Relatório de Apontamento de Produção
- Filtros num painel lateral; **Data inicial** e **Data final** são obrigatórias (`input[name=dataInicial]` / `input[name=dataFinal]`, p-calendar) — sem elas o relatório não gera (painel "Campos obrigatórios"). As datas só vêm pré-preenchidas na 1ª abertura da rota na sessão; ao reabrir ficam vazias.
- No painel, o botão verde **"Filtrar"** e o **"Limpar"** têm ambos `form="formFiltro"` e `type=submit` — `querySelector('button[form=formFiltro]')` pega o Limpar; para filtrar, escolher o `button[form=formFiltro]` cujo texto é "Filtrar" (há outro "Filtrar" com `form=null` no estado vazio central).
- Campo de data p-calendar: digitar pelo teclado (ex.: `01012015`) e confirmar com **Tab** atualiza o modelo; **Escape limpa** o que foi digitado; setar `input.value` nativo + eventos **não** atualiza o modelo do Angular (o campo fica preenchido mas o filtro gera vazio).
- Listagem agrupa por apontamento: Cód, Item, Unidade de medida, Lote, Local de estoque, Data emissão, Quantidade, Custo de produção (R$). Expandir a linha (seta à esquerda) abre as matérias-primas: Matéria-prima, Unidade de medida, Lote, Local de estoque, Quantidade utilizada, Custo total (R$).
- Exportar pelo ícone **⋮** do topo direito (ícone `vs vs-navigation-menu-vertical topo-icone`) → **"Download em PDF"** / **"Download CSV"**. O CSV sai em pt-BR (vírgula decimal, ponto de milhar); o PDF em en-US (ponto decimal, vírgula de milhar).

## Apontamento de Produção (processo)
- Form com seção **Configuração** (Setor; Natureza de operação, preenchida pelo setor; Item produzido; Local de estoque; Quantidade produzida; Data) + botão **"Carregar"** → seção **Produção**.
- Subseção **Item produzido**: Custo produção (R$) (unitário) e Custo total (R$).
- Subseção **Matérias-primas**: Quantidade composição, Quantidade à baixar, Custo médio (R$), Custo total (R$). O **Custo total do item produzido = soma dos Custo total das matérias-primas**.

## Casas decimais e cálculo de custo
- As casas decimais de **quantidade** seguem a unidade de medida cadastrada em **Atualização Automática » Estoque » Unidade de Medida** (`/viasoft/unidade-medida-produto`; coluna "Decimais"; API `POST /api/viasoft/unidade-medida-produto/page` com `{unidade, decimais, descricao}`). Confirmado: KG=3, LT=3, UN=0 decimais. Valores **monetários** permanecem com 2 casas.
- O **Custo de produção total** soma os valores **brutos** das matérias-primas (precisão total) **antes** de arredondar — o resíduo de sub-centavo entra na soma e só o resultado final é arredondado para 2 casas. Com isso, a soma das linhas exibidas bate com o total exibido em todas as camadas (listagem em tela, formulário do processo, PDF e CSV), sem o R$ 0,01 a menos. As casas decimais da Quantidade utilizada seguem a unidade nas quatro camadas.

## Ordem de Produção (`/producao-interna/ordem-producao`)
- Menu 1217 (Processos › Produção Interna). Novo do grid → `/form`; clicar na linha abre `form?id=<id>`. Lixeira `app-remover a i.ph-trash`.
- Tabelas: `PRODUCAO_INTERNA_ORDEM_PRODUCAO` (STATUS ABERTA/FECHADA/CANCELADA), `PRODUCAO_INTERNA_ORDEM_MATERIA_PRIMA`; movimentos em `ESTOQUE_MOVIMENTO_ORDEM_PRODUCAO_MATERIA_PRIMA` e `..._ITEM_PRODUZIDO` → `ESTOQUE_MOVIMENTO`; setor `PRODUCAO_INTERNA_SETOR_PRODUCAO`; apontamento `PRODUCAO_INTERNA_APONTAMENTO_PRODUCAO` (PK com typo `ID_PRODUCAO_INTERNA_PONTAMENTO_PRODUCAO`).
- Gerar monta a Produção; só grava no Salvar (`button[title=Salvar]`). Salvar já gera ESTOQUE_MOVIMENTO: saída das matérias-primas e entrada do produto (tipos 1 e 2). Re-salvar apaga e refaz (não duplica).
- Menu ⋮ `.btn-menu-header` → `.dropdown-menu.show a.dropdown-item`. Lápis da fórmula `.editar-fomula`.
- Cancelar/Excluir estornam o estoque; Editar pede confirmação. Excluir só ordem aberta (apaga matérias-primas e desfaz movimentos); Fechada/Cancelada: "Somente ordens de produção abertas podem ser excluídas."; com apontamento: 400 "...possui apontamentos vinculados." e Editar/Cancelar barrados.
- Setor: "Natureza de operação para ordem de produção" preenche e trava a natureza. Natureza sem "Natureza de operação para baixar matéria-prima" → toast ao salvar.
- Local de estoque da matéria-prima só lista locais com saldo do item.
- Filtro: painel sempre no DOM fora da tela (`:visible` não serve; usar boundingBox). Esc fecha. `#filtro-id`, `#filtro-dataInicial input` (>=), `#filtro-dataFinal input` (<=), `#filtro-status .p-multiselect`, `#filtro-item`, `#filtro-setor`. Filtrar e Limpar fecham o painel.
- Apontamento vinculado: Apontamento de Produção › Ordem de produção › Buscar → quantidade + `input[name=dataProducao]` → Carregar → Salvar.
