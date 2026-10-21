// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { situacaoSql, abrirCarrinho, incluirItem } = require('../../_pedido');

module.exports = {
  // Concluir Pedido no carrinho aberto (novo ou em edição). Devolve os avisos (toasts).
  async concluir(t, { pedido } = {}) {
    if (pedido) await abrirCarrinho(t, pedido);
    await t.tela.botao(t.p, 'Concluir Pedido', { noDialogo: false });
    return t.tela.toasts(t.p);
  },
};
