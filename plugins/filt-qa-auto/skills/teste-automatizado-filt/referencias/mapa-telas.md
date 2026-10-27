# Mapa das telas (gerado a partir dos passos)

Gerado em 27/10/2026, 10:19:39 por `node motor/mapa.js` — não editar à mão.
Só tem o que os passos usam e já funcionou. **Faltou campo, botão ou tabela → procurar no código-fonte (Z:)**, como antes; depois de criar/consertar o passo, gerar o mapa de novo.
Regras e fluxos de negócio continuam na skill `regras-sistema-filt`; este mapa é só "onde fica cada coisa".

## Cadastros › Empresas › Matriz/Filial (/fiscal/filial/form?id=<ID_FILIAL>)

Pasta: `passos/cadastros/matriz-filial/`
- **Rotas:** `/fiscal/filial/form`
- **Ids:** `formulaValorAquisicao`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-filial.js` | `abrir` | Abrir filial. |
| `ler-rotulos-de-precificacao.js` | `rotulosPrecificacao` | Texto do card Precificação (a partir do título), para conferir a ordem dos campos. |
| `salvar-filial.js` | `salvar` | Salvar filial. |

## Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)

Pasta: `passos/cadastros/conta-bancaria/`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-conta-bancaria.js` | `abrir` | Abrir conta bancaria. |
| `alterar-campo-e-salvar.js` | `alterarCampo` | Alterar campo e salvar. |
| `configurar-conta-bancaria.js` | `configurar` | Abre a conta, ajusta provedor/tipo/credenciais e salva. Confirma o aviso de limpar credenciais quando sai do Híbrido. |
| `escolher-opcao-de-lista-do-formulario.js` | `escolher` | Escolhe a opção do dropdown e devolve os diálogos que abriram (ex.: aviso de limpar credenciais). args: { rotulo, opcao } |
| `ler-credenciais-visiveis.js` | `credenciaisVisiveis` | Rótulos de credenciais visíveis (card de credenciais do híbrido). |
| `ler-opcoes-de-lista-do-formulario.js` | `dropdownEstado` | Ler opcoes de lista do formulario. |
| `salvar-conta-bancaria.js` | `salvar` | Salvar do form, juntando avisos. |

## Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)

Pasta: `passos/cadastros/formula/`
- **Rotas:** `/fiscal/formula`, `/fiscal/formula/form`
- **Ids:** `center`, `descricao`, `filtro-tipo`, `formulaValorAquisicao`, `tipoCalculo`
- **Botões:** Cancelar · Confirmar · Novo
- **Tabelas no banco:** `FORMULA`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-nova-formula.js` | `formNovo` | Abre Novo no tipo pedido e devolve o que o form mostra. → { tipo, acordeoes: { 'Variáveis da Nota de Entrada': [...] } } |
| `criar-formula.js` | `criar` | Cria a fórmula pela tela. termos: rótulos de variável ("Valor Total Item - NF Entrada") e operadores ("(", "+", "/", "1"...), |
| `excluir-formula.js` | `excluir` | Exclui pelo ⋮ › Excluir do form. Fórmula com vínculo: o sistema responde com o diálogo |
| `ler-campo-de-formula-no-cadastro.js` | `campo` | Campo autocomplete de fórmula na tela aberta (ex.: input#formulaValorAquisicao no Item/Grupo/Filial). |
| `ler-formula-montada.js` | `montada` | Fórmula montada na tela de um cadastro existente (espera os termos carregarem). → [termos] |
| `ler-tipos-de-formula.js` | `tipos` | Opções do modal "Selecione o Tipo" (na ordem) e do filtro Tipo da listagem. → { modal:[...], filtro:[...] } |

## Cadastros › Itens › Grupos (/fiscal/grupo-item)

Pasta: `passos/cadastros/grupo-item/`
- **Rotas:** `/fiscal/grupo-item`
- **Ids:** `formulaValorAquisicao`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-grupo.js` | `abrir` | Abrir grupo. |
| `ler-rotulos-de-precificacao.js` | `rotulosPrecificacao` | Rótulos do card Precificação na ordem. |
| `salvar-grupo.js` | `salvar` | Salvar grupo. |

## Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

Pasta: `passos/cadastros/item/`
- **Rotas:** `/fiscal/item`, `/fiscal/item/form`
- **Ids:** `formulaCustoPresente`, `valorUnitarioAquisicao`
- **Botões:** Novo

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-item.js` | `abrir` | Abre o item (form?id=ID_ITEM_FILIAL) ou um item novo (novo: true). |
| `ler-campos-de-preco-e-custo.js` | `precoCusto` | Rótulos do card "Preço e custo variáveis" na ordem e estado de campos pedidos pelo id. |
| `ler-rotulos-de-estoque.js` | `rotulosEstoque` | Rótulos do card Estoque (ordem), para conferir a posição de campos. |
| `salvar-item.js` | `salvar` | Salvar item. |

## Cadastros › Pessoa (/fiscal/pessoa/form?id=N), aba ENDEREÇOS

Pasta: `passos/cadastros/pessoa/`
- **Rotas:** `/fiscal/pessoa/form`
- **Ids:** `cep`, `cidade`
- **Botões:** Salvar
- **Tabelas no banco:** `PESSOA_COMPLEMENTO`, `PESSOA_ENDERECO`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `trocar-cep-do-endereco.js` | `trocarCep` | Troca o CEP do endereço Principal pelo lápis da aba Endereços e salva a pessoa. |

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
| `quitar-titulos-em-dinheiro.js` | `quitar` | Baixa (quitação) em Dinheiro de títulos a receber. args: { pessoa, titulos:['01000000482-1/2', ...] } |

## financeiro › acerto-financeiro

Pasta: `passos/financeiro/acerto-financeiro/`
- **Campos (rótulo):** Conta Bancária/Caixa
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `acertar-em-duplicata.js` | `duplicata` | Acerto aberto: forma Duplicata numa conta bancária, com a forma de parcelamento (texto exato: "30 DIAS", "30/60/90"). |

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
| `estornar-baixa-de-titulo.js` | `estornar` | Estorno da baixa de um título. args: { pessoa, titulo: '01000000482-2/2', dataBaixa: 'dd/mm/aaaa' } |

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
| `adicionar-item-defensivo.js` | `adicionar` | Na busca de itens: pesquisa, abre o carrinho do card, preenche e confirma. |
| `alterar-quantidade-do-item.js` | `quantidade` | Alterar quantidade do item. |
| `atualizar-dados-do-app.js` | `atualizarDados` | → texto do aviso de conclusão |
| `confirmar-ou-salvar-item.js` | `confirmar` | Confirmar ou salvar item. |
| `criar-cabecalho-do-pedido.js` | `criar` | Criar cabecalho do pedido. |
| `escolher-equipamento-de-aplicacao.js` | `equipamento` | Escolher equipamento de aplicacao. |
| `fazer-login-no-app.js` | `entrar` | Fazer login no app. |
| `finalizar-e-enviar-pedido.js` | `finalizarEEnviar` | → { status, pedido } (pedido = ID_PEDIDO no ERP) |
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
| `alterar-valor-do-cte.js` | `alterarValor` | Muda o valor do componente Frete de um CT-e salvo e refaz o acerto em Dinheiro. |
| `excluir-cte.js` | `excluirCte` | Exclui o CT-e pelo ⋮ › Excluir do formulário (CT-e de entrada não tem Cancelar). args: { id } → { existe, avisos } |
| `lancar-cte-de-entrada.js` | `entrada` | → { id } (ID_CONHECIMENTO_TRANSPORTE lido do banco) |

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
| `consultar-notas-do-pedido.js` | `doPedido` | Notas do pedido criadas depois de `desdeId`: [{ ID_NOTA_FISCAL, NUMERO_DOCUMENTO }] |
| `consultar-titulos-da-nota.js` | `titulos` | Consultar titulos da nota. |
| `consultar-ultima-nota.js` | `ultimoId` | Maior ID_NOTA_FISCAL atual (para achar as notas criadas depois de uma ação). |
| `emitir-nota-com-documento-referenciado.js` | `comReferencia` | Emitir nota com documento referenciado. |
| `emitir-nota-de-venda-com-duplicata.js` | `vendaComDuplicata` | NF-e de venda própria com 1 item e acerto em Duplicata numa conta bancária. |
| `excluir-nota.js` | `excluir` | Exclui a nota pelo ⋮ › Excluir (confirmação "Excluir"). → { toasts, dialogos } |
| `inutilizar-nota.js` | `inutilizar` | NF-e própria salva e NÃO autorizada (rejeitada): ⋮ › Inutilizar Documento → justificativa → confirmar. |
| `lancar-nota-de-entrada-compra.js` | `entradaTerceiros` | Nota de ENTRADA de terceiros pela tela (ex.: COMPRA DE MERCADORIA), com acerto em Dinheiro. |
| `salvar-nota-aberta-por-outra-rotina.js` | `salvarAberta` | Salvar nota aberta por outra rotina. |

## Processos › Financeiro › Duplicatas a Receber (/financeiro/duplicata-receber/form?id=N)

Pasta: `passos/financeiro/duplicatas-receber/`
- **Rotas:** `/financeiro/duplicata-receber/form`
- **Botões:** Emitir
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `emitir-boleto.js` | `boleto` | ⋮ → Gerar Boleto / Reimprimir Boleto → (conta) → desmarca e-mail → Emitir, juntando avisos e PDFs. |
| `ler-opcoes-do-menu-da-duplicata.js` | `opcoes` | Opções do menu ⋮ do form da duplicata. args: { id } |

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
| `consultar-ultimo-titulo.js` | `ultimoTitulo` | Maior ID_DOCUMENTO_FINANCEIRO (para achar os títulos criados por uma ação). |
| `criar-lancamento-com-duplicata.js` | `criarComDuplicata` | Criar lancamento com duplicata. |
| `ler-texto-da-tela.js` | `textoTela` | Texto da tela como evidência curta (ex.: conferir uma mensagem que ficou fixa). |
| `tratar-dialogo-depois-de-salvar.js` | `posSalvar` | Diálogo depois do Salvar ("Salvo com sucesso" com Emitir Boletos): emite (capturando o PDF) ou fecha. |

## Processos › Financeiro › Remessa Bancária (/financeiro/gerar-remessa)

Pasta: `passos/financeiro/remessa-bancaria/`
- **Rotas:** `/financeiro/gerar-remessa`
- **Ids:** `dataEmissaoFinal`, `dataEmissaoInicial`, `filtro-enviadoBanco`, `portador`, `tipoOcorrencia`
- **Botões:** Adicionar Todos · Gerar arquivo · Transmitir
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `gerar-arquivo-de-remessa.js` | `gerar` | Marca as linhas (índices ou textos contidos) e clica Gerar arquivo; salva o .REM em `pasta`. |
| `pesquisar-titulos-para-remessa.js` | `pesquisar` | Pesquisa os boletos de um portador. args: { portador: '12345', estabelecimento?, de: 'dd/mm/aaaa', ate } |

## Processos › Precificação › Formação de Preço (/precificacao/formacao-preco)

Pasta: `passos/precificacao/formacao-preco/`
- **Rotas:** `/precificacao/formacao-preco`

| Arquivo | Passo | O que faz |
|---|---|---|
| `ler-selecao-da-formacao-de-preco.js` | `selecao` | → { cabecalho:[...], linha:{ coluna: valor } / null, todas:[...] } |

## Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido)

Pasta: `passos/vendas/antecipacao-financeira-pedidos/`
- **Rotas:** `/vendas/antecipacao-financeira-pedido`
- **Campos (rótulo):** Pessoa
- **Botões:** Cancelar · Carregar
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`, `PEDIDO_FORMA_PAGAMENTO`, `PEDIDO_FORMA_PAGAMENTO_DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `desvincular-adiantamento.js` | `desvincular` | Desvincula um adiantamento pelo Histórico do pedido. args: { pessoa, pedido, adiantamento: '50087' } |
| `ler-pedido-e-valor-a-baixar.js` | `ler` | Linha do pedido na tela + "Valor a baixar" oferecido. args: { pessoa, pedido }  → { linha, valorOferecido } |
| `listar-adiantamentos-disponiveis.js` | `disponiveis` | Adiantamentos listados na janela "Gerar antecipações" do pedido (fecha sem salvar). → [ 'código ... saldo', ... ] |
| `vincular-adiantamento.js` | `vincular` | Vincula adiantamentos ao pedido. args: { pessoa, pedido, adiantamentos:['50087'], valorBaixar? } |

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
- **Ids:** `dataPagamento`, `formaParcelamento`, `observacoesPedido`, `quantidadeEntrega-<n> (prefixo)`
- **Botões:** Adicionar · Cancelar · Carrinho · Cartão · Concluir Pedido · Confirmar · Editar · Gerar Nota · GERAR NOTA · Item · Novo · Processar · Próximo
- **Menu ⋮:** Cancelar
- **Ajudantes comuns:** `passos/_pedido.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `adicionar-item-defensivo.js` | `adicionar` | Adicionar item defensivo. |
| `adicionar-item-na-edicao.js` | `adicionarItem` | Em edição: inclui mais um item (botão Item → busca → ADICIONAR → Carrinho). args: { item, qtd, casas, desconto? } |
| `alterar-validade.js` | `alterarValidade` | Menu ⋮ → Alterar Validade do Pedido → data → Confirmar. Devolve se o diálogo continuou aberto depois do Confirmar. |
| `cancelar-pedido.js` | `cancelar` | Menu ⋮ → Cancelar: cancela quantidades por linha ou "Cancelar Todos". args: { pedido, qtds?:[1], casas, todos?:false, motivo? } |
| `concluir-pedido.js` | `concluir` | Concluir Pedido no carrinho aberto (novo ou em edição). Devolve os avisos (toasts). |
| `conferir-situacao-do-pedido.js` | `confere` | Conferir situacao do pedido. |
| `consultar-situacao-do-pedido.js` | `situacao` | Situação no banco: { ID_PEDIDO, STATUS_PEDIDO, PAGO (0/1), VALOR_TOTAL_CONTABIL } |
| `criar-pedido.js` | `criar` | Novo pedido completo: condições de venda → itens → (cartão) → Concluir Pedido. |
| `entrar-em-edicao.js` | `editar` | Entra na edição do pedido (Editar → Sim). Pedido parcialmente entregue abre a "edição parcial". |
| `escolher-cartao-de-credito.js` | `cartaoCredito` | Carrinho com forma Cartão: marca Crédito e escolhe a Forma Parcelamento. args: { parcelamento: '3X' } |
| `escrever-observacao.js` | `observacao` | Em edição: escreve a observação do pedido (textarea#observacoesPedido). |
| `faturar-ordem-de-entrega.js` | `faturar` | Faturar ordem de entrega. |
| `gerar-nota-de-venda-futura.js` | `gerarNotaVendaFutura` | Venda futura: GERAR NOTA no carrinho abre a nota em outra aba; conclui o acerto proposto, salva e fecha a aba. |
| `gerar-ordem-de-entrega-linha-a-linha.js` | `porLinha` | Ordem de entrega digitando linha a linha e esperando o recálculo de cada uma: a tela redesenha a tabela a cada quantidade |
| `gerar-ordem-de-entrega.js` | `ordemEntrega` | Ordem de entrega: quantidades por linha do carrinho (ex.: [2] = 2 un na 1ª linha). args: { pedido, quantidades:[2], casas } |
| `informar-aplicacoes-no-modal-defensivo.js` | `aplicacoes` | Devolve os campos que o modal mostrou (antes e depois). |
| `remover-item-na-edicao.js` | `removerItem` | Em edição: remove a ÚLTIMA linha do carrinho que contém `texto` (ex.: "CORDA 1,000") e confirma Excluir. |

## Relatórios › Pedido de Venda (/vendas/relatorios/pedido-venda)

Pasta: `passos/vendas/relatorio-pedido-venda/`
- **Rotas:** `/vendas/relatorios/pedido-venda`
- **Botões:** Filtrar

| Arquivo | Passo | O que faz |
|---|---|---|
| `ler-situacoes-dos-pedidos.js` | `situacoes` | Ler situacoes dos pedidos. |
