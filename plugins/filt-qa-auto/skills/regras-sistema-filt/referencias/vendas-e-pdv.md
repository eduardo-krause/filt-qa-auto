# Vendas: pedido, ordem de entrega, faturamento e PDV

## Pedido de Venda — abertura (`/vendas/pedido` → Novo)
- Diálogo **Condições de Venda**: Natureza (ex.: 76 PEDIDO DE VENDA / 103 PEDIDO DE VENDA FUTURA), Cliente, Vendedor (autocomplete por digitação; a seta não filtra), Parâmetro de Preço, Data Pagamento → Confirmar cria o pedido e abre `/vendas/busca?id=<pedido>`.
- Os campos variam por base (Configuração de Venda). Ex.: na Barraca só Natureza, Cliente, Complemento (obrigatório, escolher pela seta) e Vendedor; em outras há Parâmetro de Preço e Data Pagamento obrigatórios. Em produção (PDV NÃO EXCLUIR) o Vendedor só é cobrado no Salvar/Concluir.
- Cliente com duplicata vencida abre "Aviso" → Fechar. Lançamento para pessoa sem limite abre "Limite de crédito" (Sim).
- Forma de pagamento só aparece depois de uma natureza que gera financeiro. Duplicata/Boleto/Cartão mostram Forma de parcelamento* e o campo vira "Data último pagamento" (mesmo `#dataPagamento`); se a data não bate com o parcelamento, o Confirmar não faz nada. Venda futura aceita só Duplicata/Cartão/Cheque.
- Confirmar sem obrigatórios: "Obrigatório" embaixo do campo + painel "Campos obrigatórios".
- Configuração: `/vendas/configuracao-venda`, accordion "Abertura do Pedido" com tabela Opção/Exibe/Obrigatório (`.p-checkbox-box`, 2 por linha) → Salvar. API `GET /api/vendas/configuracao-venda/first` → `configuracaoVendaAberturaPedidoList` (NATUREZA_OPERACAO, CLIENTE, PARAMETRO_VENDA, FORMA_PAGAMENTO, DATA_PAGAMENTO, DATA_PREVISAO_ENTREGA, VENDEDOR, SAFRA).

## Itens, carrinho e conclusão
- Busca de item `input[placeholder*="Pesquise o item"]` + Enter; só aparecem itens com `ITEM_FILIAL_VALORES.VALOR_PRECO_VENDA`. Digitar a quantidade no card e clicar **"ADICIONAR"** (texto, não botão) → painel lateral "Adicionar Item ao carrinho" (defensivo pede Equipamento de Aplicação* e Busca de Receituário Padrão*, que lista só padrões do registro MA do item) → Confirmar → "Carrinho" abre `/vendas/carrinho?id=<id>` (o id é o da API `POST /api/vendas/pedido/abertos/<pessoaId>`, nem sempre igual ao número).
- Carrinho: seções em accordion `span.title` (Frete, Totais…); o card Frete pode vir fechado. `p-dropdown#tipoDoFrete`, valor `#valorFrete`, total `#valorTotalFrete`; "Sem Ocorrência de Transporte" desabilita o valor. Responsável Técnico* para defensivo.
- **Concluir Pedido** exige Tipo do Frete e Faturamento (ex.: Duplicata → Forma Parcelamento, ou `#acerto-duplicata`); sem eles o botão não faz nada nem avisa. Salvar/Concluir deixam um toast fixo em cima do botão Concluir — fechar no X antes.
- Concluir chama `POST /vendas/pedido/recalcular-situacao-pago` + `/finalizar`. Pedido sem pendência de crédito vai direto a APROVADO; senão ANALISE.
- Receituário do item no pedido: botão `title=Receituário` na linha abre o modal "Defensivo" (o lápis abre o modal "Item"). Grava `PEDIDO_ITEM_RECEITUARIO.ID_REAG_RECEITUARIO_PADRAO`.
- Editar pedido aprovado: "Ao editar o pedido, ele passará por todas as etapas de aprovação..." (Sim) → PENDENTE; ordem de entrega já criada continua APROVADO e é faturada com os valores novos. Parcialmente entregue: item entregue não tem lápis/lixeira (para mudar valor, incluir item novo pelo botão "Item"); grava por `/concluir-edicao-parcial`.

## Aprovação, status e menu do pedido
- Aprovação: `/vendas/aprovacao-pedidos`, pedidos agrupados por motivo (accordion, ex.: "limite de crédito", "Vencimento Financeiro") → `title=Aprovar` → diálogo CPF (`#pedidoUsuarioAprovar input`), Senha (`#senhaAprovar input`), Motivo (`#motivoAprovacao`).
- Faixa de status: `app-status-bar-pedido .status`. Cores (pedido e grid da Consulta Pedido): Pendente/Aprovado azul #1E88E5; Análise/Parcialmente entregue roxo #6F42C1; Reprovado/Negado amarelo #FDD835 (legenda usa #FFC107); Faturado/Totalmente entregue/Parc. entregue-cancelado verde #43A047; Cancelado vermelho #E53935. O grid de Abertos não tem cor.
- Consulta Pedido (`/vendas/consulta-pedido`): `POST /api/vendas/pedido/getResultList?page&size&order=codigoPedido&asc` (aceita size=1000); botão "Legendas"; "Tipo do status" Aberto=[2,7,3,8,9,11], Fechado=[5,6,10,4]; Ações só imprimir.
- Grid do Pedido de Venda agrupa por cliente; expandir pela seta (≈14 px à esquerda do nome).
- Menu ⋮ do pedido = dropdown Bootstrap `#dropdown-help`: Alterar Validade, Condições de Venda (só abre com todos os obrigatórios preenchidos, senão toast "Para alterar as Condições de Venda é necessário informar os campos obrigatórios"), Copiar, Excluir, Cancelar, Histórico Cancelamentos, Histórico de Aprovações, Imprimir, Auditoria.

## Cancelamento do pedido
- ⋮ › Cancelar → "Cancelamento Pedido" (Item, Quantidade, Saldo, `#quantidadeCancelar-<n>`, `textarea#motivoCancelamento`).
- Parcial: quantidade com as casas do item (3 casas: "2000" = 2,000) + motivo → Processar. Grava `PEDIDO_ITEM.QUANTIDADE_CANCELADA` e `PEDIDO_ITEM_CANCELADO`.
- Total: preencher o motivo **antes** e clicar "Cancelar Todos" → "Sim" (já processa; `POST /api/vendas/pedido-item-cancelamento/cancelar/<id>`) → CANCELADO.
- Saldo comprometido em ordem de entrega aprovada aparece como Saldo 0 e bloqueado. Cancelar o saldo de parcialmente entregue → PARCIALMENTE_ENTREGUE_CANCELADO.
- Com antecipação vinculada é bloqueado: "Desvincule a antecipação para continuar".

## Estoque reservado pelo pedido
- Pedido aprovado (venda futura ou direto) reserva: tipo 2 (disponível) saída + tipo 6 (a entregar) entrada em `ESTOQUE_MOVIMENTO` (ligado por `ESTOQUE_MOVIMENTO_PEDIDO_ITEM`).
- Recálculo dos Saldos de Estoque (`/fiscal/recalculo-saldo-estoque`): Filtros (Itens; o autocomplete pega o 1º parecido, buscar por trecho exclusivo) → Filtrar → marcar o checkbox da linha → PRÓXIMO → Sim → Data Inicial → RECALCULAR → Sim → tabela antes/depois por tipo de saldo.
- Regra confirmada (06/10/2026): no recálculo, pedido de COMPRA pendente lança em A receber (tipo 5) e soma no Disponível (tipo 2). Ex.: físico 145 + compra 400 → disponível 545.

## Ordem de entrega e faturamento (pedido normal)
- Ordem de Entrega › Adicionar: `input#quantidadeEntrega-<n>` (3 casas em KG: "1000" = 1,000) + "Selecionar Lotes" por linha (inputs `#quantidade-N`, já sugeridos pelo vencimento) → Confirmar → Adicionar. Abre o PDF "Ordem de Entrega" em outra aba.
- ⋮ da linha da ordem (`a[data-title=Menu]`): só Imprimir e Excluir (sem cancelar). Excluir → "Tem certeza que deseja excluir?" → some de `PEDIDO_SOLICITACAO_ENTREGA`.
- Faturar: ícone `i.ph-currency-circle-dollar` da linha → Itens (Assinatura digital do receituário; dá para desmarcar "Assinar todos") › Próximo › Faturamento (Valor Frete + Financeiro) › **Gerar Nota** (~20 s; `POST fiscal/faturamento/faturar-pedido-venda`) → "Notas Geradas" (nota + receituários) → Finalizar. Também pela aba FATURAMENTO de `/vendas/pedido` → expandir cliente → marcar a ordem → Faturar.
- Em entrega parcial o frete inteiro vai na 1ª nota.
- Faturamento com cartão: o card Financeiro vem vermelho; abrir, excluir a linha do Resumo e lançar Manual + Crédito + Parcelado (`#valor`, `#numeroParcelas`, Operadora/Bandeira pela seta, `#nsu`, `#codigoAutorizacao`) → Adicionar → Salvar → Concluir. Cartão crédito parcelado conta como Pago (regra NMTZ-11727).
- Cancelar a NF da ordem: ordem volta a APROVADO sem nota, lote continua reservado (`ESTOQUE_MOVIMENTO_LOTE` origem P) e o pedido volta a APROVADO/PARCIALMENTE_ENTREGUE.

## Pedido de venda futura até a NF
- Natureza "PEDIDO DE VENDA FUTURA" → itens → Carrinho (Faturamento + Forma Parcelamento) → Salvar → Concluir (ANALISE) → aprovar → o carrinho mostra **GERAR NOTA** na faixa de status.
- GERAR NOTA abre a NF em **nova aba a cada clique** (`/nota/nota-fiscal/form`) com acerto em Duplicata pronto → Concluir → Tipo do Frete → Salvar transmite (VENDA PARA ENTREGA FUTURA). A NF de venda futura sai sem frete; o frete vai na remessa (ordem de entrega), cujo financeiro é "informado na Nota Fiscal de Venda Futura" (igual em produção).
- Faturar a ordem de entrega do pedido de venda futura gera a REMESSA.
- Cancelar a NF de venda futura (⋮ › Cancelar Nota) cancela o pedido sozinho (QUANTIDADE_CANCELADA = total, sem `PEDIDO_ITEM_CANCELADO`) e apaga a duplicata.

## Antecipação financeira do pedido
- `/vendas/antecipacao-financeira-pedido` (Processos › Vendas › Antecipação Financeira Pedidos): Estabelecimento (Adicionar Todos), Data inicial/final, Pessoa → Carregar.
- Linha do pedido aprovado: "Valor a baixar" (moeda) + `ptooltip="Gerar antecipações"` → diálogo com os adiantamentos de CLIENTE (DOCUMENTO_FINANCEIRO RECEBER + EH_ADIANTAMENTO_FINANCEIRO=1). Marcar preenche "Valor a utilizar"; o Salvar só habilita se for igual ao "Valor a baixar" (para parcial, digitar o valor a baixar antes). Grava pedido PAGO=1 e `PEDIDO_FORMA_PAGAMENTO_DOCUMENTO_FINANCEIRO`.
- "Criar Adiantamento" abre `/financeiro/adiantamentos/form` em nova aba (Cliente/Fornecedor, Pessoa, Complemento, Valor → Salvar → acerto Dinheiro → Salvar de novo).
- Desvincular: ícone `ptooltip=Histórico` → lixeira "Desvincular adiantamento" → Desvincular.
- GERAR NOTA com antecipação: aviso "Pedido contém antecipações cadastradas" e acerto já com Adiantamento; gera título filho DINHEIRO quitado e o adiantamento fica QUITADO. Cancelar a NF desfaz (adiantamento ABERTO, vínculo apagado, pedido APROVADO).

## Relatórios de vendas
- **Pedido de Venda** (`/vendas/relatorios/pedido-venda`): Empresa já vem; "Adicionar Todos" põe todas as filiais; Tipo Sintético/Analítico/Antecipação (radio). Antecipação mostra antes "Data Acerto" e "% Antecipação/Mês" — achar as datas pelo rótulo. Status = `p-autocomplete#status` múltiplo. Agrupar por Pessoa/Data de Emissão (padrão)/Vendedor (+ Item no Sintético). Filtro "Pago/A Pagar"; datas de emissão obrigatórias. Limpar apaga o Estabelecimento. API `POST /api/relatorio/pedido-venda` (modoRelatorio SINTETICO|ANALITICO|ANTECIPACAO, agrupador DATA_EMISSAO|ITEM|PESSOA|VENDEDOR; devolve `pedidoPago`). Vários estabelecimentos = uma aba por estabelecimento; exportar Analítico leva todos, Sintético/Antecipação só um. Exportar no ⋮ › "Download em PDF/CSV".
- **Ordem de Entrega** (`/vendas/relatorios/ordem-entrega`): filtro lateral (`data-title="Filtrar"`); autocompletes estabelecimento (múltiplo), cliente, vendedor, marca, grupoItens, item, naturezaOperacao, grupoCredito (Marca/Grupo limitam o Item); datas `input[name=dataEmissaoInicialPedido|dataEmissaoFinalPedido|dataEmissaoInicialOrdem|dataEmissaoFinalOrdem]`; `#filtro-numero-pedido`; Situação "Todos/Pendente/Entregue". API `POST /api/relatorio/ordem-entrega` (resposta `estabelecimento[].pedidos[].ordensEntrega[].itens[]`). ⋮ `button#dropdown-help` → "Download PDF" (`.../imprimir`) / "Download em CSV" (`.../csv`), arquivos "Ordens de entrega.*". A tela não tem totalizadores (Total Entregue, Pendente, Sem Ordem e Geral só no PDF). Banco: `PEDIDO_SOLICITACAO_ENTREGA` + `_ITEM` + `PEDIDO`.
- **Clientes** (`/vendas/relatorios/clientes`; Carteira de Clientes = `/vendas/relatorios/carteira-cliente`): filtro abre sozinho e cobre o menu e o botão da filial (fechar `.p-sidebar-active .p-sidebar-close` antes). Download PDF/XLSX no ⋮, desabilitados antes de filtrar. API `POST /api/relatorio/clientes` (pessoas[], inativo, tipoEndereco, tipoPessoa, exibir{}, diaMesAniversarioInicial/Final, ordenarPor). Campo Pessoa só oferece ativas; "Inativo = Somente" só traz inativos sem Pessoa informada. Campos dia/mês (dd/mm) embaralham com digitação rápida: digitar uma tecla por vez (~250 ms) e conferir o valor.

## PDV
- Entrar: ERP `/pdv` (Abrir/Fechar caixa) → "Acessar PDV" na linha do caixa → `/ponto-de-venda/app/venda`. Abrir a URL direto cai num layout sem menu e o Alt+C não funciona. Caixa e pré-vendas ficam no estabelecimento do `TERMINAL_PDV` (trocar a filial antes).
- O usuário precisa ter em Usuário › Pessoa uma pessoa com atribuição Vendedor ("Nenhuma pessoa com o tipo 'Vendedor' está associada ao usuário"). Uma pessoa só pode estar em um usuário (API 400 "Registro duplicado", sem mensagem na tela).
- Venda: "Pesquisar item..." → clicar no item; Shift+Enter vai ao pagamento. Formas `.botoes-pagamentos` (Dinheiro Shift+F1, Cartão F2, Pix F4, Cheque F7, Duplicata F8); bloqueada = classe `disabled` + tooltip. Escolher a forma → "Adicionar pagamento" → modal `input#valor` (já com o restante) → "Incluir pagamento"; valor maior vira troco. "Finalizar venda" (Shift+Espaço) → `POST /api/fiscal/pdv/save` → NFC-e (modelo 35); troco = título PAGAR.
- Cliente no pagamento: autocomplete e `#cpf-cliente` (editável só com Consumidor Final); com Restante 0 somem. Alt+C = Condições de venda (troca o cliente ao escolher; Cancelar não desfaz).
- Formas do cliente: Pessoa › `p-autocomplete#formaPagamentoCliente` → `PESSOA_FORMA_PAGAMENTO`; formas da natureza: `NATUREZA_OPERACAO_FORMA_PAGAMENTO`.
- Cartão: "Cobrança via cartão" TEF/Manual (`#cobranca button`, ativo = `active`); Manual pede Operadora, Bandeira, NSU, Código de autorização, Conta contábil.
- Pré-venda: F2 ou Alt+P → `/ponto-de-venda/app/pre-venda`; Shift+N = nova (Pessoa, Vendedor, `#pesquisaItem`) → Salvar. Faturar: marcar a linha → Shift+Enter (cliente bloqueado). Sair sem concluir deixa `PRE_VENDA.STATUS = EM_FATURAMENTO` e ela some da lista. Sem PERMITE_FATURAR_PRE_VENDA o Faturar fica desabilitado e Shift+Enter mostra "Acesso negado".
- Barraca: terminais só nas filiais 3–10 (filial 3 = CAIXA/VENDAS - SLG); SiTef em 127.0.0.1 (TEF não testável).
