# Financeiro: acertos, baixa, estorno, lançamentos e moeda indexadora

## Acerto financeiro (nota, pedido, lançamento)
- As formas dependem da natureza (`NATUREZA_OPERACAO_FORMA_PAGAMENTO`). Ícones Adiantamento/Crédito Devolução só aparecem se a pessoa tiver saldo (faixa "X disponível da pessoa").
- **Duplicata**: Forma Parcelamento → Gerar → Salvar → Concluir. Dá para mudar o vencimento na grade de Parcelas (1º input da linha) depois do Gerar. Forma de data fixa no passado faz a API devolver 400 "Data vencimento anterior a data de emissão" **sem mensagem na tela** — usar data fixa futura.
- **Cartão**: Cobrança Manual, Crédito/Débito (label), À Vista/Parcelado, Operadora e Bandeira (pela seta), NSU, Código Autorização → Adicionar → Salvar → Concluir. Gera título CARTAO quitado + recebível DUPLICATA da operadora (`ID_DOCUMENTO_FINANCEIRO_PAI`, número `<lanc>-1/1`).
- **Cheque**: Novo → `input#banco` (digitar "001" e escolher), `#numeroAgencia #digitoAgencia #numeroConta #digitoConta #numeroCheque`; terceiro: checkbox "Cheque Terceiros" libera `#nome` e `#identificacao`. O Adicionar do diálogo só responde por clique de mouse. Cheque cancelado recadastrado: "Este cheque foi cancelado em outra operação, deseja utilizá-lo?" (reaproveita o título).
- **Adiantamento/Crédito Devolução**: clicar no ícone → seleção (checkbox sugere o valor) → Confirmar → Salvar da seção → Concluir.
- Valor unitário da nota própria tem 5 casas.

## Baixa de Duplicatas (`/financeiro/acerto-financeiro-baixa`)
- Filtro no funil (Pessoa, Data Emissão/Entrada, "Número Duplicata"); sem datas pede confirmação "Sim". Marcar o checkbox da linha → Baixar → Acerto (Dinheiro/Renegociar/Abatimento Duplicatas/Cartão/PIX/Cheque/Bens e Ativos; sem Adiantamento) → Concluir → "Deseja imprimir o recibo?". `DOCUMENTO_FINANCEIRO.STATUS = QUITADO`.
- Não lista recebível de cartão (esse vai em Recebimento Cartões).
- **Recebimento Cartões** (Processos › Financeiro): "Acertar Cartões" → Administradora (libera as datas) → Data Vencimento (preencher a final antes) → marcar o cartão → Filtrar → marcar a linha → Baixar → Sim.

## Estorno (`/financeiro/estorno`)
- Funil com Data Baixa obrigatória (`input#dataBaixaInicial/#dataBaixaFinal`) → marcar a linha → `title=Estornar` → "Tem certeza que deseja estornar?" (Data do estorno) Sim → STATUS volta PENDENTE.
- As linhas aparecem pelo GRUPO_BAIXA (`DOCUMENTO_FINANCEIRO_BAIXA.GRUPO_BAIXA`), não pelo número da duplicata.

## Lançamento Financeiro (`/financeiro/lancamento-financeiro/form`)
- Natureza (ex.: OUTROS RECEBIMENTOS), Pessoa (→ "Limite de crédito" Sim), Conta Contábil (autocomplete do plano), Valor → Salvar → Acerto (Duplicata) → Concluir → **Salvar de novo** no lançamento. Grava `LANCAMENTO_OUTRA_NATUREZA` + `_DOCUMENTO_FINANCEIRO`.
- Lançamento Programado: Data Base (não aceita passado), Qtd, Dia Fixo, Gerar; complemento é textarea.

## Moeda indexadora
- Natureza (Cadastros › Natureza de Operação, abrir pela listagem) › checkbox "Utiliza moeda indexadora" (`name=utilizaMoedaIndexadora`) → `CONFIGURACAO_NATUREZA_OPERACAO_LANCAMENTO_FINANCEIRO.UTILIZA_MOEDA_INDEXADORA`. Ex.: 90 OUTROS RECEBIMENTOS para o lançamento a receber indexado.
- Moeda Diária (`/fiscal/moeda-diaria/form`): Moeda, Data de cotação, Valor da cotação (6 casas) → `MOEDA_DIARIA`.
- Lançamento indexado: com a natureza marcada aparece o bloco "Moeda indexadora" (Moeda, Data Cotação, Valor Cotação puxado da Moeda Diária). Digita-se o "Valor Lançamento Indexado" e o Valor em R$ fica calculado e bloqueado. Grava `DOCUMENTO_FINANCEIRO_MOEDA_INDEXADORA` (VALOR_COTACAO com 2 casas).
- Baixa indexada: Baixa de Duplicatas tem "Data Cotação"; grade com Valor a Pagar/Receber (R$) e Indexado (Receber: td 16; Pagar: td 20). "Saldo Indexado" = saldo em R$ ÷ cotação da Data Cotação (não o indexado original do título). Quitar acima do saldo → "O valor a pagar/receber é maior que o valor do saldo disponível, a diferença deve ser adicionada aos juros". Aviso "Existem títulos em moeda estrangeira sem cotação cadastrada para a data da cotação" se algum listado não tem cotação.
- Concluir a baixa exige contas de Variação Cambial Positiva/Negativa na Configuração da Contabilização (Financeira › Baixa), senão toast "Analítica de Variação Cambial Positiva não informada...". Grava `DOCUMENTO_FINANCEIRO_BAIXA_MOEDA_INDEXADORA` e `DOCUMENTO_FINANCEIRO.VARIACAO_CAMBIAL_POSITIVA/NEGATIVA`.
- Duplicatas a Pagar não têm "Data Base de Cálculo".

## Relatórios e gestão de títulos
- **Contas a Pagar**: filtro Moeda Indexadora (múltiplo) + Data de Cotação (`name=dataCotacao`, desabilitada sem moeda, sem datas futuras). Posição retroativa filtra pela Data de Entrada do título. Não tem "Data para Cobrança" (só o Contas a Receber). Cotação faltando → API 400 com a mensagem.
- **Contas a Receber**: `?pessoaId=<id>` já preenche a pessoa (caminho do Gestão de Clientes › Dados Financeiros › A Receber › Detalhes, em nova aba). API `POST /api/relatorio/contas-receber` com idMoeda, valorNaMoeda, cotacaoEmissao, cotacaoUtilizada, saldoIndexado, variacao, baixasMoeda[].
- **Gestão de Títulos a Receber**: títulos de cada pessoa recolhidos (expandir pelo toggler). Erro "Não há cotação cadastrada para X em dd/mm/aaaa." também vira toast. CSV com Moeda;Valor_na_Moeda;Cotacao_Emissao;Cotacao_Utilizada;Saldo_Indexado;Variacao.

## Contábil / fiscal
- Notas Explicativas: Data é seletor MÊS/ANO (clicar no input e no mês); descrição em editor Quill (`.ql-editor`).
- Saldo Inicial contábil: Parâmetros → Buscar; valores na coluna Saldo (analíticas) → Salvar → "Realmente deseja salvar o Saldo Contábil?" Sim; zerar e salvar remove o saldo.
- Apuração CIAP: `p-dropdown#mes` + `input#ano` → Calcular → Salvar. Configurador CIAP exige as duas fórmulas de base de cálculo.
