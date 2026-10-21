// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { situacaoSql, abrirCarrinho, incluirItem } = require('../../_pedido');

module.exports = {
  async confere(t, { pedido, quando = '', ...esperado }) {
    const s = await t.banco.linha(situacaoSql, [pedido]);
    const obtido = s ? Object.fromEntries(Object.keys(esperado).map((k) => [k, s[k]])) : null;
    return t.confere(`pedido ${pedido}${quando ? ' ' + quando : ''}`, obtido, esperado);
  },
};
