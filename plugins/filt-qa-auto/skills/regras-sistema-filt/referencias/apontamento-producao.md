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
