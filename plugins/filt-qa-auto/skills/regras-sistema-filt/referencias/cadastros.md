# Cadastros diversos

## Natureza de Operação (`/fiscal/natureza-operacao`, Cadastros › Operações)
- Form `/fiscal/natureza-operacao/form?id=<ID_NATUREZA_OPERACAO_FILIAL>` — o id **não** é o código (ex.: código 76 = id 581 na filial 6). Abrir pela listagem, que só carrega depois de filtrar (`#filtro-descricao`, `data-title=Filtrar`; `POST /api/fiscal/natureza-operacao-filial/getResultList`).
- Tipo de documento: `p-selectbutton#tipoDocumento` (Documento Fiscal, CT-e, Pedido, Compra, Lançamento Financeiro, Ajuste Local Estoque, Romaneio de Produtor Rural); cada tipo troca o form e limpa o Tipo de operação. Documento Fiscal: `p-autocomplete#tipoOperacao` (seta mostra só 20); Pedido busca só pela descrição; Ajuste Local Estoque fixo em TES.

## Parâmetro de Preço (`/precificacao/parametro-preco`)
- API `POST /api/fiscal/parametro-preco`, `GET .../page`, `GET .../<id>`.
- `input#descricao`; `p-autocomplete#tabelasPreco` (múltiplo; tabela já ligada a outro parâmetro não aparece); `p-dropdown#baseParaVariacao` (Data Base / Número de Dias / Projeção / Margem Aplicada); `p-dropdown#baseParaVariacaoCusto` (Projetado / Última Compra); `p-autocomplete#naturezaOperacaoCompra` (só NOTA_FISCAL de entrada da filial); `p-calendar#dataBase`; `#acrescimo #desconto #acrescimoCusto #descontoCusto`; radio Comercial/Racional; `#variacaoPor`, `#aplicarEm`.
- Amarração: Margem Aplicada ↔ Última Compra e Projeção ↔ Projetado (custo trava); Data Base/Número de Dias deixam o custo "Selecione".
- Banco: PARAMETRO_VENDA, PARAMETRO_VENDA_REGRA, PARAMETRO_VENDA_TABELA_PRECO; margens em ITEM_FILIAL / GRUPO_ITEM_DETALHE_FILIAL / CONFIGURACAO_FILIAL.VALOR_MARGEM_ESPERADA.

## Pessoa e Gestão de Clientes
- Cadastro `/fiscal/pessoa/form?id=<id>`: "Área da propriedade (ha)" `#areaAplicacao` (máscara em centavos) → `PESSOA_COMPLEMENTO.AREA_PROPRIEDADE`. Produção: `PESSOA_PRODUCAO` (AREA_CULTIVADA, TIPO_PRODUTIVIDADE SC_HA/TON_HA, VALOR_PESO, VALOR_ESTIMANDO_PRODUCAO).
- Endereço não tem "Inativo" (só o complemento, no ⋮ do card). Indicador "Isento" grava IE = "ISENTO"; IE vazia = "Não Contribuinte". CEP 89460044 preenche Canoinhas/SC (89460000 não preenche a cidade).
- Anexos de Pessoa vão para S3 com URL pública (`/PESSOA/<id>/<arquivo>`).
- Gestão de Clientes `/fiscal/pessoa/gestao`: busca `input[placeholder*="Pesquisar por"]`; abas Resumo, Dados Financeiros, Dados Comerciais, Saldo do Produtor. Dados Comerciais (`GET /api/fiscal/pessoa/pessoa-potencial/<id>`): cultivo = área cultivada ÷ área × 100 (área 0/NULL → 0); produtividade = VALOR_PESO × área cultivada; insumos = valor estimado × área cultivada.

## Cultivar (`/fiscal/cultivar`)
- Listagem: Código, Descrição, Cultura, Ações (só lixeira); clicar na linha abre `/fiscal/cultivar/form?id=<id>`.
- Filtro: `#filtro-id` (só números, começo do código), `#filtro-descricao` (máx. 50, contém, sem diferenciar maiúsculas), `.p-sidebar input#reagCulturaPlantio`. Enter não filtra; usar o botão Filtrar.
- API `POST /api/fiscal/cultivar/page` `{id, query, idReagCulturaPlantio}`; criar `POST /api/fiscal/cultivar`; culturas `GET /api/reag/reag-cultura-plantio/complete?query=`.
- Filtro de código com número acima do Long (20 dígitos) → 400 com toast técnico do Java (também em Item e produção).

## Item — tipos e serviço
- `ID_TIPO_ITEM` 9 = Ativo Imobilizado (SPED 08), 10 = Serviços (09). `ITEM_FILIAL.INATIVO_PARA`: N Selecione, E Entrada, S Saída, D Devoluções, A Ambos, T Todos.
- Item do tipo Serviços: Tipo, Gênero, PIS/COFINS, ISS, GRUPO SERVIÇOS, aba IBS CBS; em algumas filiais também Código do serviço, Retidos e Natureza de Rendimento Sped Reinf (aba GERAL da Tributação — clicar pelo texto da aba).
- Campo Marca `#itemMarca` (esperar a tela carregar antes de clicar).
- Item aberto em nova aba ("Acessar cadastro do item"): o loader (`img.loader`) pode prender ao rolar; trazer a aba para frente e recarregar.
- Autocompletes de item: `complete-by-tipo-item` (serviços, filial logada), `complete-excluding-servico?excluirImobilizado=true` (insumos; busca por código exata).

## Etiquetas — complemento
- Busca do campo Configuração da etiqueta aceita ID e descrição; opções "<id> | <descrição>" — "PADRÃO" casa com várias, filtrar pelo ID.
- Apagar o texto do campo Configuração desmarca o modelo na hora (coluna Lote e pré-visualização somem); para trocar sem esse efeito, usar a seta.
- `POST .../imprimir` devolve o ID_JOB; `IMPRESSAO_JOB.SITUACAO` vira IMPRESSO em segundos (SPOOLER com Integrador ligado). Impressora TCP inexistente → 400 "ImpressoraFiscalClient#imprimirEtiqueta(...) failed and no fallback available." sem job.
- Largura do SVG na pré-visualização (2 px por módulo): EAN-8 134 px, EAN-13 214 px, ITF-14 270 px; CODE 128 varia.
