// Nomes antigos dos passos (t.passos.<área>.<arquivo>, até a v0.3.0) → tela nova (t.passos.<área>.<tela>).
// O motor monta esses atalhos ao carregar; suítes antigas continuam funcionando. Suíte nova usa só o nome da tela.
module.exports = {
  "cadastros.filial": [
    "cadastros.matriz-filial"
  ],
  "cadastros.grupo": [
    "cadastros.grupo-item"
  ],
  "financeiro.acerto": [
    "financeiro.acerto-financeiro"
  ],
  "financeiro.baixa": [
    "financeiro.acerto-financeiro-baixa",
    "financeiro.estorno"
  ],
  "financeiro.duplicata-receber": [
    "financeiro.duplicatas-receber"
  ],
  "financeiro.lancamento": [
    "financeiro.lancamentos-financeiros"
  ],
  "financeiro.remessa": [
    "financeiro.remessa-bancaria"
  ],
  "fiscal.cte": [
    "fiscal.conhecimento-transporte"
  ],
  "fiscal.nota": [
    "fiscal.nota-fiscal"
  ],
  "fiscal.nota-consulta-banco": [
    "fiscal.nota-fiscal"
  ],
  "fiscal.nota-entrada-compra": [
    "fiscal.nota-fiscal"
  ],
  "fiscal.nota-excluir": [
    "fiscal.nota-fiscal"
  ],
  "fiscal.nota-referenciada": [
    "fiscal.nota-fiscal"
  ],
  "fiscal.nota-salvar-aberta": [
    "fiscal.nota-fiscal"
  ],
  "fiscal.nota-venda": [
    "fiscal.nota-fiscal"
  ],
  "mobile.app-item-defensivo": [
    "mobile.app-pedido-venda"
  ],
  "mobile.app-login": [
    "mobile.app-pedido-venda"
  ],
  "mobile.app-pedido-enviar": [
    "mobile.app-pedido-venda"
  ],
  "mobile.app-pedido-novo": [
    "mobile.app-pedido-venda"
  ],
  "mobile.app-sincronizar": [
    "mobile.app-pedido-venda"
  ],
  "reag.configuracao-reag": [
    "reag.configuracao-receituario"
  ],
  "vendas.antecipacao": [
    "vendas.antecipacao-financeira-pedidos"
  ],
  "vendas.aprovacao": [
    "vendas.aprovacao-pedido"
  ],
  "vendas.consulta-estoque": [
    "vendas.consulta-estoque-movimentacao"
  ],
  "vendas.faturamento": [
    "vendas.pedido-venda"
  ],
  "vendas.faturamento-pedido": [
    "vendas.pedido-venda"
  ],
  "vendas.pedido": [
    "vendas.pedido-venda"
  ],
  "vendas.pedido-cancelar": [
    "vendas.pedido-venda"
  ],
  "vendas.pedido-consulta-banco": [
    "vendas.pedido-venda"
  ],
  "vendas.pedido-criar": [
    "vendas.pedido-venda"
  ],
  "vendas.pedido-editar": [
    "vendas.pedido-venda"
  ],
  "vendas.pedido-item-defensivo": [
    "vendas.pedido-venda"
  ],
  "vendas.pedido-ordem-entrega": [
    "vendas.pedido-venda"
  ],
  "vendas.pedido-venda-futura": [
    "vendas.pedido-venda"
  ],
  "vendas.relatorio": [
    "vendas.relatorio-pedido-venda"
  ]
};
