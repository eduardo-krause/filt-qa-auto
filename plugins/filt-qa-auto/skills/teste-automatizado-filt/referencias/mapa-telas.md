# Mapa das telas (gerado a partir dos passos)

Gerado em 28/10/2026, 12:51:55 por `node motor/mapa.js` — não editar à mão.
Só tem o que os passos usam e já funcionou. **Faltou campo, botão ou tabela → procurar no código-fonte (Z:)**, como antes; depois de criar/consertar o passo, gerar o mapa de novo.
Regras e fluxos de negócio continuam na skill `regras-sistema-filt`; este mapa é só "onde fica cada coisa".

## Cadastros › Empresas › Matriz/Filial (/fiscal/filial/form?id=<ID_FILIAL>)

Pasta: `passos/cadastros/matriz-filial/`
- **Rotas:** `/fiscal/filial/form`
- **Ids:** `formulaValorAquisicao`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-filial.js` | `abrir` | Abrir filial. |
| `ler-rotulos-de-precificacao.js` | `rotulosPrecificacao` | Ler rotulos de precificacao. |
| `salvar-filial.js` | `salvar` | Salvar filial. |

## Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)

Pasta: `passos/cadastros/conta-bancaria/`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-conta-bancaria.js` | `abrir` | Abrir conta bancaria. |
| `alterar-campo-e-salvar.js` | `alterarCampo` | Alterar campo e salvar. |
| `configurar-conta-bancaria.js` | `configurar` | Configurar conta bancaria. |
| `escolher-opcao-de-lista-do-formulario.js` | `escolher` | Escolher opcao de lista do formulario. |
| `ler-credenciais-visiveis.js` | `credenciaisVisiveis` | Ler credenciais visiveis. |
| `ler-opcoes-de-lista-do-formulario.js` | `dropdownEstado` | Ler opcoes de lista do formulario. |
| `salvar-conta-bancaria.js` | `salvar` | Salvar conta bancaria. |

## Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)

Pasta: `passos/cadastros/formula/`
- **Rotas:** `/fiscal/formula`, `/fiscal/formula/form`
- **Ids:** `center`, `descricao`, `filtro-tipo`, `formulaValorAquisicao`, `tipoCalculo`
- **Botões:** Cancelar · Confirmar · Novo
- **Tabelas no banco:** `FORMULA`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-nova-formula.js` | `formNovo` | Abrir nova formula. |
| `criar-formula.js` | `criar` | Criar formula. |
| `excluir-formula.js` | `excluir` | Excluir formula. |
| `ler-campo-de-formula-no-cadastro.js` | `campo` | Ler campo de formula no cadastro. |
| `ler-formula-montada.js` | `montada` | Ler formula montada. |
| `ler-tipos-de-formula.js` | `tipos` | Ler tipos de formula. |

## Cadastros › Itens › Grupos (/fiscal/grupo-item)

Pasta: `passos/cadastros/grupo-item/`
- **Rotas:** `/fiscal/grupo-item`
- **Ids:** `formulaValorAquisicao`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-grupo.js` | `abrir` | Abrir grupo. |
| `ler-rotulos-de-precificacao.js` | `rotulosPrecificacao` | Ler rotulos de precificacao. |
| `salvar-grupo.js` | `salvar` | Salvar grupo. |

## Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

Pasta: `passos/cadastros/item/`
- **Rotas:** `/fiscal/item`, `/fiscal/item/form`
- **Campos (rótulo):** 1
- **Ids:** `descricao`, `dropdown-help`, `fatorConversao`, `formulaCustoPresente`, `itemSemelhante`, `tipoConversao`, `unidadeMedida`, `valorPrecoVenda`, `valorUnitarioAquisicao`
- **Botões:** Novo
- **Tabelas no banco:** `ITEM`, `ITEM_FILIAL`, `ITEM_FILIAL_VALORES`, `ITEM_SIMILAR`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-item.js` | `abrir` | Abrir item. |
| `alterar-descricao-e-unidade.js` | `alterarDescricaoUnidade` | Alterar descricao e unidade. |
| `alterar-preco-de-venda.js` | `alterarPrecoVenda` | Alterar preco de venda. |
| `copiar-item.js` | `copiar` | ⋮ (#dropdown-help) › Copiar › confirmação: o sistema copia o item (com tributação, grupos, locais) e abre a cópia em outra aba. |
| `ler-campos-de-preco-e-custo.js` | `precoCusto` | Ler campos de preco e custo. |
| `ler-rotulos-de-estoque.js` | `rotulosEstoque` | Ler rotulos de estoque. |
| `salvar-item.js` | `salvar` | Salvar item. |
| `vincular-item-similar.js` | `vincularSimilar` | Vincular item similar. |

## Cadastros › Pessoa (/fiscal/pessoa/form?id=N), aba ENDEREÇOS

Pasta: `passos/cadastros/pessoa/`
- **Rotas:** `/fiscal/pessoa/form`
- **Ids:** `cep`, `cidade`
- **Botões:** Salvar
- **Tabelas no banco:** `PESSOA_COMPLEMENTO`, `PESSOA_ENDERECO`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `trocar-cep-do-endereco.js` | `trocarCep` | Trocar cep do endereco. |

## Configurações › Receituário Agronômico (/reag/configuracao)

Pasta: `passos/reag/configuracao-receituario/`
- **Rotas:** `/reag/configuracao`
- **Ids:** `obrigaEquipamentoAplicacao`
- **Tabelas no banco:** `CONFIGURACAO_REAG`

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-configuracao-do-reag.js` | `alterar` | Alterar configuracao do reag. |

## Financeiro › Acerto Financeiro/Baixa (/financeiro/acerto-financeiro-baixa)

Pasta: `passos/financeiro/acerto-financeiro-baixa/`
- **Rotas:** `/financeiro/acerto-financeiro-baixa`
- **Campos (rótulo):** Pessoa
- **Ids:** `numeroDuplicata`
- **Botões:** Baixar · Filtrar
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `quitar-titulos-em-dinheiro.js` | `quitar` | Quitar titulos em dinheiro. |

## financeiro › acerto-financeiro

Pasta: `passos/financeiro/acerto-financeiro/`
- **Campos (rótulo):** Conta Bancária/Caixa
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `acertar-em-duplicata.js` | `duplicata` | Acertar em duplicata. |

## Financeiro › Adiantamentos (/financeiro/adiantamentos/form)

Pasta: `passos/financeiro/adiantamento/`
- **Rotas:** `/financeiro/adiantamentos/form`
- **Ids:** `pessoa`, `valor`
- **Botões:** Concluir · Salvar
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `criar-adiantamento.js` | `criar` | Criar adiantamento. |

## Financeiro › Estorno (/financeiro/estorno)

Pasta: `passos/financeiro/estorno/`
- **Rotas:** `/financeiro/estorno`
- **Campos (rótulo):** Número Duplicata · Pessoa
- **Botões:** Estornar · Filtrar
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `estornar-baixa-de-titulo.js` | `estornar` | Estornar baixa de titulo. |

## geral › estabelecimento

Pasta: `passos/geral/estabelecimento/`
- **Rotas:** `/home`

| Arquivo | Passo | O que faz |
|---|---|---|
| `trocar-filial-logada.js` | `trocar` | Trocar filial logada. |

## mobile › app-pedido-venda

Pasta: `passos/mobile/app-pedido-venda/`
- **Ajudantes comuns:** `passos/_adb.js`, `passos/_app-item.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `adicionar-item-defensivo.js` | `adicionar` | Adicionar item defensivo. |
| `alterar-quantidade-do-item.js` | `quantidade` | Alterar quantidade do item. |
| `atualizar-dados-do-app.js` | `atualizarDados` | Atualizar dados do app. |
| `confirmar-ou-salvar-item.js` | `confirmar` | Confirmar ou salvar item. |
| `criar-cabecalho-do-pedido.js` | `criar` | Criar cabecalho do pedido. |
| `escolher-equipamento-de-aplicacao.js` | `equipamento` | Escolher equipamento de aplicacao. |
| `fazer-login-no-app.js` | `entrar` | Fazer login no app. |
| `finalizar-e-enviar-pedido.js` | `finalizarEEnviar` | Finalizar e enviar pedido. |
| `informar-numero-de-aplicacoes.js` | `aplicacoes` | Informar numero de aplicacoes. |
| `ler-card-aplicacoes.js` | `ler` | Ler card aplicacoes. |
| `trocar-receituario-padrao.js` | `receituario` | Trocar receituario padrao. |

## Movimentações Fiscais › Conhecimento de Transportes (/fiscal/conhecimento-de-transporte)

Pasta: `passos/fiscal/conhecimento-transporte/`
- **Rotas:** `/fiscal/conhecimento-de-transporte`, `/fiscal/conhecimento-de-transporte/form`
- **Campos (rótulo):** Natureza de Operação · Pessoa
- **Ids:** `cstIcms`, `numeroCte`, `operacaoFiscal`, `pessoaEmitente`, `pessoaRemetente`, `serie`
- **Botões:** Adicionar Documento · Concluir · Finalizar · Novo · Salvar
- **Menu ⋮:** Excluir
- **Tabelas no banco:** `CONHECIMENTO_TRANSPORTE`, `CONHECIMENTO_TRANSPORTE_COMPONENTE`

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-valor-do-cte.js` | `alterarValor` | Alterar valor do cte. |
| `excluir-cte.js` | `excluirCte` | Excluir cte. |
| `lancar-cte-de-entrada.js` | `entrada` | Lancar cte de entrada. |

## Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)

Pasta: `passos/fiscal/nota-fiscal/`
- **Rotas:** `/nota/nota-fiscal`, `/nota/nota-fiscal/form`
- **Campos (rótulo):** 1 · Natureza de Operação · Pessoa · Tipo do Frete
- **Ids:** `chaveDeAcesso`, `item`, `localEstoque`, `pessoa`, `quantidadeComercial`, `tipoDoFrete`, `valorDesconto`, `valorUnitarioComercial`
- **Botões:** Adicionar · Adicionar Documento · Cancelar · Concluir · Finalizar · Novo · Pesquisar · Próximo · Salvar
- **Menu ⋮:** Excluir
- **Tabelas no banco:** `NOTA_FISCAL`, `NOTA_FISCAL_ELETRONICA`
- **Ajudantes comuns:** `passos/_comum.js`, `passos/_nota.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `cancelar-nota.js` | `cancelar` | Cancelar nota. |
| `consultar-nfe-autorizadas.js` | `autorizadas` | Consultar nfe autorizadas. |
| `consultar-notas-do-pedido.js` | `doPedido` | Consultar notas do pedido. |
| `consultar-titulos-da-nota.js` | `titulos` | Consultar titulos da nota. |
| `consultar-ultima-nota.js` | `ultimoId` | Consultar ultima nota. |
| `emitir-nota-com-documento-referenciado.js` | `comReferencia` | Emitir nota com documento referenciado. |
| `emitir-nota-de-venda-com-duplicata.js` | `vendaComDuplicata` | Emitir nota de venda com duplicata. |
| `excluir-nota.js` | `excluir` | Excluir nota. |
| `inutilizar-nota.js` | `inutilizar` | Inutilizar nota. |
| `lancar-nota-de-entrada-compra.js` | `entradaTerceiros` | Lancar nota de entrada compra. |
| `salvar-nota-aberta-por-outra-rotina.js` | `salvarAberta` | Salvar nota aberta por outra rotina. |

## Processos › Financeiro › Duplicatas a Receber (/financeiro/duplicata-receber/form?id=N)

Pasta: `passos/financeiro/duplicatas-receber/`
- **Rotas:** `/financeiro/duplicata-receber/form`
- **Botões:** Emitir
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `emitir-boleto.js` | `boleto` | Emitir boleto. |
| `ler-opcoes-do-menu-da-duplicata.js` | `opcoes` | Ler opcoes do menu da duplicata. |

## Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)

Pasta: `passos/financeiro/lancamentos-financeiros/`
- **Rotas:** `/financeiro/lancamento-financeiro`
- **Campos (rótulo):** Conta Contábil · Natureza Operação · Pessoa · Valor Lançamento
- **Botões:** Emitir · Emitir Boletos · Novo
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`, `HISTORICO_BOLETO`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `consultar-titulos-criados.js` | `titulosDesde` | Consultar titulos criados. |
| `consultar-ultimo-titulo.js` | `ultimoTitulo` | Consultar ultimo titulo. |
| `criar-lancamento-com-duplicata.js` | `criarComDuplicata` | Criar lancamento com duplicata. |
| `ler-texto-da-tela.js` | `textoTela` | Ler texto da tela. |
| `tratar-dialogo-depois-de-salvar.js` | `posSalvar` | Tratar dialogo depois de salvar. |

## Processos › Financeiro › Remessa Bancária (/financeiro/gerar-remessa)

Pasta: `passos/financeiro/remessa-bancaria/`
- **Rotas:** `/financeiro/gerar-remessa`
- **Ids:** `dataEmissaoFinal`, `dataEmissaoInicial`, `filtro-enviadoBanco`, `portador`, `tipoOcorrencia`
- **Botões:** Adicionar Todos · Gerar arquivo · Transmitir
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `gerar-arquivo-de-remessa.js` | `gerar` | Gerar arquivo de remessa. |
| `pesquisar-titulos-para-remessa.js` | `pesquisar` | Pesquisar titulos para remessa. |

## Processos › Precificação › Formação de Preço (/precificacao/formacao-preco)

Pasta: `passos/precificacao/formacao-preco/`
- **Rotas:** `/precificacao/formacao-preco`

| Arquivo | Passo | O que faz |
|---|---|---|
| `ler-selecao-da-formacao-de-preco.js` | `selecao` | Ler selecao da formacao de preco. |

## Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido)

Pasta: `passos/vendas/antecipacao-financeira-pedidos/`
- **Rotas:** `/vendas/antecipacao-financeira-pedido`
- **Campos (rótulo):** Pessoa
- **Botões:** Cancelar · Carregar
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`, `PEDIDO_FORMA_PAGAMENTO`, `PEDIDO_FORMA_PAGAMENTO_DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `desvincular-adiantamento.js` | `desvincular` | Desvincular adiantamento. |
| `ler-pedido-e-valor-a-baixar.js` | `ler` | Ler pedido e valor a baixar. |
| `listar-adiantamentos-disponiveis.js` | `disponiveis` | Listar adiantamentos disponiveis. |
| `vincular-adiantamento.js` | `vincular` | Vincular adiantamento. |

## Processos › Vendas › Aprovação Pedido (/vendas/aprovacao-pedidos)

Pasta: `passos/vendas/aprovacao-pedido/`
- **Rotas:** `/vendas/aprovacao-pedidos`

| Arquivo | Passo | O que faz |
|---|---|---|
| `aprovar-pedido.js` | `aprovar` | Aprovar pedido. |

## Processos › Vendas › Consulta Estoque/Movimentação (/vendas/consulta-estoque-movimentacao)

Pasta: `passos/vendas/consulta-estoque-movimentacao/`
- **Rotas:** `/vendas/consulta-estoque-movimentacao`

| Arquivo | Passo | O que faz |
|---|---|---|
| `ler-detalhe-do-item.js` | `item` | Ler detalhe do item. |

## Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

Pasta: `passos/vendas/pedido-venda/`
- **Rotas:** `/vendas/carrinho`, `/vendas/pedido`
- **Campos (rótulo):** Bandeira · Cliente · Forma de pagamento · Forma Parcelamento · Natureza de operação · Operadora · Parâmetro de preço · Vendedor
- **Ids:** `dataPagamento`, `formaParcelamento`, `formEntrega`, `observacoesPedido`, `quantidadeEntrega-<n> (prefixo)`
- **Botões:** Adicionar · Cancelar · Carrinho · Cartão · Concluir Pedido · Confirmar · Editar · Gerar Nota · GERAR NOTA · Item · Novo · Processar · Próximo
- **Menu ⋮:** Cancelar
- **Tabelas no banco:** `ITEM`, `NOTA_FISCAL`, `NOTA_FISCAL_ELETRONICA`, `PEDIDO_SOLICITACAO_ENTREGA`, `VIASOFT`
- **Ajudantes comuns:** `passos/_nota.js`, `passos/_pedido.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `adicionar-item-defensivo.js` | `adicionar` | Adicionar item defensivo. |
| `adicionar-item-na-edicao.js` | `adicionarItem` | Adicionar item na edicao. |
| `alterar-validade.js` | `alterarValidade` | Alterar validade. |
| `cancelar-pedido.js` | `cancelar` | Cancelar pedido. |
| `concluir-pedido.js` | `concluir` | Concluir pedido. |
| `conferir-situacao-do-pedido.js` | `confere` | Conferir situacao do pedido. |
| `consultar-situacao-do-pedido.js` | `situacao` | Consultar situacao do pedido. |
| `criar-pedido.js` | `criar` | Criar pedido. |
| `entrar-em-edicao.js` | `editar` | Entrar em edicao. |
| `escolher-cartao-de-credito.js` | `cartaoCredito` | Escolher cartao de credito. |
| `escrever-observacao.js` | `observacao` | Escrever observacao. |
| `excluir-ordem-de-entrega.js` | `excluirOrdem` | Seção Ordem de Entrega do carrinho: ícone "Menu" (ph-dots-three-outline-vertical) da linha › Excluir → confirmação "Excluir". |
| `faturar-ordem-de-entrega.js` | `faturar` | Faturar ordem de entrega. |
| `gerar-nota-de-venda-futura.js` | `gerarNotaVendaFutura` | Gerar nota de venda futura. |
| `gerar-ordem-de-entrega-com-item-similar.js` | `ordemSimilar` | Ordem de entrega trocando o item do pedido por um item SIMILAR: carrinho › Adicionar (seção Ordem de Entrega) → no diálogo |
| `gerar-ordem-de-entrega-linha-a-linha.js` | `porLinha` | Gerar ordem de entrega linha a linha. |
| `gerar-ordem-de-entrega.js` | `ordemEntrega` | Gerar ordem de entrega. |
| `informar-aplicacoes-no-modal-defensivo.js` | `aplicacoes` | Informar aplicacoes no modal defensivo. |
| `remover-item-na-edicao.js` | `removerItem` | Remover item na edicao. |

## Relatórios › Pedido de Venda (/vendas/relatorios/pedido-venda)

Pasta: `passos/vendas/relatorio-pedido-venda/`
- **Rotas:** `/vendas/relatorios/pedido-venda`
- **Botões:** Filtrar

| Arquivo | Passo | O que faz |
|---|---|---|
| `ler-situacoes-dos-pedidos.js` | `situacoes` | Ler situacoes dos pedidos. |
