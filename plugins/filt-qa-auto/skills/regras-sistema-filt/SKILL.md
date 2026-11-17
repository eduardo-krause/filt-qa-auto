---
name: regras-sistema-filt
description: Regras e fluxos do ERP Filt/Nimitz já confirmados em teste — passos de tela (login, nota fiscal, venda futura, CT-e, item, consultas, permissões, etiquetas, pedido de venda, PDV, financeiro, lote e XML, agro, produção, jobs), componentes de tela e onde cada dado fica no banco (custo/valor médio do item, nota fiscal, cartão a receber, certificado digital). Use ao validar uma tarefa, montar cenário de teste ou conferir dado no banco do Filt.
---

# Regras do sistema Filt

Conhecimento **confirmado funcionando** no sistema (executado pela tela e conferido no banco). Nada de hipótese.

Carregue só a referência da rotina que precisa:

| Referência | Conteúdo |
|---|---|
| `referencias/fluxos-de-tela.md` | Acesso/AT, componentes de tela (moeda, autocomplete, dropdown, obrigatórios), cadastro de item, nota de entrada, venda NF-e, venda futura, CT-e, consultas, grupo de usuários/permissões, etiquetas, onde conferir no banco |
| `referencias/custo-e-valores-do-item.md` | Tabelas de custo/valor do item, fórmula do valor de aquisição, rateio de CT-e (uma e várias notas), regras do valor aquisição médio |
| `referencias/nota-fiscal.md` | Entrada/saída em `NOTA_FISCAL` |
| `referencias/cartao-a-receber.md` | Onde ficam os títulos de cartão a receber |
| `referencias/certificado-digital.md` | Onde fica a configuração real de certificado |
| `referencias/apontamento-producao.md` | Produção Interna: rotas e menu, relatório (filtros obrigatórios, listagem/matérias-primas, export PDF/CSV), form do processo, casas decimais por unidade e cálculo do custo total, ordem de produção |
| `referencias/vendas-e-pdv.md` | Pedido de venda (condições, carrinho, aprovação, status, cancelamento), estoque reservado e recálculo, ordem de entrega e faturamento, venda futura, antecipação, relatórios de vendas/clientes, PDV e pré-venda |
| `referencias/financeiro.md` | Formas do acerto (duplicata, cartão, cheque, adiantamento), baixa de duplicatas, recebimento de cartões, estorno, lançamento financeiro, moeda indexadora, contas a pagar/receber, contábil (notas explicativas, saldo inicial, CIAP) |
| `referencias/lote-nota-e-xml.md` | Cadastro/filtro/manutenção de lote, nota de entrada e saída com lote, importação de XML, cancelamento de NF-e |
| `referencias/cadastros.md` | Natureza de operação, parâmetro de preço, pessoa e gestão de clientes, cultivar, tipos de item/serviço, complemento de etiquetas |
| `referencias/agro.md` | Receituário agronômico, SIAGRO (PR), produtor rural (atividades, planejamento, recomendação), regra de cobrança de cereais |
| `referencias/sistema-e-jobs.md` | Login e troca de filial, permissões pela API, relatórios e agendamento, jobs e notificações |

## Quem pode alterar
Estas referências são **só leitura** no plugin instalado (nunca editar em `~/.claude/plugins/...`). Fluxo novo confirmado numa validação: anotar em `~/.claude/filt-qa/fluxos-novos.md`; o mantenedor integra nestas referências no repositório `filt-qa-auto` e publica uma versão nova.
