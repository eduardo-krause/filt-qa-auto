// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=) — situação do pedido no banco (sem tela)
// Quantidades: informe `casas` = casas decimais da unidade do item (o campo tem máscara).
const { situacaoSql, abrirCarrinho, incluirItem } = require('../_pedido');

module.exports = {
  // Situação no banco: { ID_PEDIDO, STATUS_PEDIDO, PAGO (0/1), VALOR_TOTAL_CONTABIL }
  async situacao(t, { pedido }) { return t.banco.linha(situacaoSql, [pedido]); },

  // Confere a situação no banco. args: { pedido, PAGO?, STATUS_PEDIDO?, VALOR_TOTAL_CONTABIL?, quando: 'após o vínculo' },

  async confere(t, { pedido, quando = '', ...esperado }) {
    const s = await t.banco.linha(situacaoSql, [pedido]);
    const obtido = s ? Object.fromEntries(Object.keys(esperado).map((k) => [k, s[k]])) : null;
    return t.confere(`pedido ${pedido}${quando ? ' ' + quando : ''}`, obtido, esperado);
  },
};
