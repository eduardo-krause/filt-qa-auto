// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { abrirCarrinho } = require('../../_pedido');

module.exports = {
  // Botão Salvar do carrinho (grava sem concluir). Com `pedido` abre o carrinho antes; sem, usa o carrinho aberto. Devolve os avisos (toasts).
  async salvarPedido(t, { pedido } = {}) {
    if (pedido) await abrirCarrinho(t, pedido);
    await t.tela.botao(t.p, 'Salvar', { noDialogo: false });
    return t.tela.toasts(t.p);
  },
};
