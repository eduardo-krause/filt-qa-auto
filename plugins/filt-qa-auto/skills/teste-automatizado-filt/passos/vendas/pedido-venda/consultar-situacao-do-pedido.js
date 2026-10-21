// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { situacaoSql, abrirCarrinho, incluirItem } = require('../../_pedido');

module.exports = {
  // Situação no banco: { ID_PEDIDO, STATUS_PEDIDO, PAGO (0/1), VALOR_TOTAL_CONTABIL }
  async situacao(t, { pedido }) { return t.banco.linha(situacaoSql, [pedido]); },

  // Confere a situação no banco. args: { pedido, PAGO?, STATUS_PEDIDO?, VALOR_TOTAL_CONTABIL?, quando: 'após o vínculo' },
};
