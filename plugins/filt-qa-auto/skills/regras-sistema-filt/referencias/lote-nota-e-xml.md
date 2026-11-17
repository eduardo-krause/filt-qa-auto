# Lote, nota com lote, importação de XML e cancelamento de NF-e

## Cadastro de Lote (`/fiscal/lotes`)
- Listagem (título "Lote"; menu Cadastros › Itens › Lote) e form `/fiscal/lotes/form[?id=N]` (título "Lotes"). "Código" = `LOTE.ID_LOTE`. O filtro fica no DOM com os mesmos names do form: usar seletores `:visible`.
- Form: `input#lote` (máx. 19), `p-autocomplete[name=item]`, `p-dropdown[name=origem]` (Própria/Terceiro/Consignado), `p-calendar[name=dataFabricacao|dataValidade]`, `#fabricante #registroFabricante #registroProduto #numeroFci #garantia #codigoAgregado`; `#quantidadeSaldo` sempre bloqueado; Tipo (`p-dropdown[name=tipoLote]`) bloqueado, vem de `ITEM_FILIAL.TIPO_LOTE`.
- Semente: `p-dropdown[name=categoria]`, `p-autocomplete[name=cultivar|controleSafra]` (safra casa pelo começo: "SAFRA 2024"), `#especie #renasem`, `#pesoPorEmbalagem` (4 casas), `#percentualPureza/#percentualGerminacao` (2 casas), `p-dropdown#tipoLaudo`, `p-calendar[name=dataLaudo]`, `#numeroLaudo #numeroBoletim`. Grava `LOTE` + `LOTE_SEMENTE`.
- Lote com movimentação (ESTOQUE_MOVIMENTO_LOTE, NOTA_FISCAL_ITEM_LOTE, MANUTENCAO_LOTE_*, PRE_VENDA_ITEM_LOTE, INVENTARIO_CONTAGEM_LOTE, PEDIDO_SOLICITACAO_ENTREGA_ITEM_LOTE): tudo bloqueado, sem Salvar, faixa "Este lote possui movimentação e não pode ser alterado".
- Repetição (filial + número + item + fabricação + validade): "Aviso" com link `/fiscal/lotes/form?id=<id>` em nova aba. Vale na edição.
- Excluir: lixeira → "Tem certeza que deseja excluir?" → "Registro removido com sucesso" (apaga LOTE_SEMENTE junto).
- Filtro (funil → `.p-sidebar` "Filtros"; Esc fecha): `#filtro-id`, `#filtro-lote`, Tipo Lote, `input#marca` / `#grupoItens` / `#item` / `#fabricante` (múltiplos; Item depende de Marca/Grupo), Origem, `input[name=dataFabricacaoInicial|Final]`, `input[name=filtro-dataValidadeInicial|Final]`, `apenasLoteComSaldo`. API `POST /api/fiscal/lotes/page` (só a filial logada).
- Banco: marca = `LOTE.ID_ITEM_FILIAL → ITEM_FILIAL.ID_ITEM → ITEM.ID_MARCA_ITEM`; grupo = `ITEM_FILIAL.ID_GRUPO_ITEM_DETALHE` (hierarquia `ID_GRUPO_ITEM_DETALHE_PAI`).

## Manutenção de Lotes (`/fiscal/manutencao-lotes` › Novo)
- Item, Lote (só com saldo), Justificativa → Adicionar abre "Seleção de Lotes de Destino" (`#quantidade-<ID_LOTE>`, lista também lote com 0) → Adicionar → Salvar. Gera saída na origem e entrada no destino.

## Nota com lote
- **Entrada manual**: depois do Valor Unitário (4 casas), digitar a Quantidade → abrem "Lotes" e "Lote". `input#lote` texto livre, Origem, datas, `input#nfItemLotequantidade` → Salvar. Se número + item + datas batem com lote da filial: toast "Carregado lotes existentes" e usa esse lote (sem diferenciar maiúsculas). Mesmo lote duas vezes → "Esse Lote já foi adicionado.". Fechar "Lotes" → Adicionar do item.
- **Saída**: depois da Quantidade abre "Seleção de Lotes" (`#quantidade-N`) → Confirmar. Cada linha mostra o saldo cheio mesmo já usado em outra linha e aceita quantidade maior; o Salvar devolve 400 "Saldo insuficiente para o item X com o lote Y".
- Excluir nota de compra cujo lote já teve saída → "Saldo insuficiente ... não será possível realizar a ação". Excluir nota apaga os lotes que ficam sem movimentação, inclusive os cadastrados pela rotina (aceito).

## Importação de XML (`/nota/nota-fiscal-importacao-xml`, Processos › Movimentações Fiscais)
- Etapas: `input[type=file]` → Natureza (digitar em `#naturezaDeOperacao` e clicar a 1ª opção no mesmo passo; data e hora vêm preenchidas) → Fornecedor (casado pelo CNPJ) → Item ("Item Sistema" usa `/api/fiscal/item-filial/completeComOperacao`; "Dados Lote" por linha com o rastro do XML) → Impostos → Financeiro → **Finalizar abre a nota em NOVA ABA** (`/nota/nota-fiscal/form?load-storage=true`) com o Acerto aberto → Concluir → Salvar. `TIPO_INCLUSAO = AUTOMATICA`.
- Dados Lote › Cancelar: "Todos os dados editados serão substituídos pelos dados trazidos no XML" (Sim restaura).
- Na nota aberta, `i.btn-dados-lote` da linha mostra os lotes. Item sem peso no cadastro bloqueia o salvamento ("Itens sem peso no cadastro").
- XML de nota própria autorizada: ⋮ › "Exportar XML". Nota de terceiro não exporta (o XML é do fornecedor).

## Cancelamento de NF-e
- ⋮ › Cancelar Nota → "Cancelar Nota Fiscal Eletrônica" → motivo → Salvar → "NF-e Cancelada com sucesso" (`ID_SITUACAO_DOCUMENTO = 3`).
- O lote volta o saldo e continua ligado à nota cancelada (`NOTA_FISCAL_ITEM_LOTE`). Receituários da nota vão para `REAG_RECEITUARIO_EXCLUIDO`.
