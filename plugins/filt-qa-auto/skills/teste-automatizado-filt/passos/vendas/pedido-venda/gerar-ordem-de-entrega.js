// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { situacaoSql, abrirCarrinho, incluirItem } = require('../../_pedido');

module.exports = {
  // Ordem de entrega: quantidades por linha do carrinho (ex.: [2] = 2 un na 1ª linha). args: { pedido, quantidades:[2], casas } (casas pode ser um array, uma por linha)
  async ordemEntrega(t, { pedido, quantidades, casas = 0 }) {
    const { p, tela } = t;
    await abrirCarrinho(t, pedido);
    await tela.botao(p, 'Adicionar', { noDialogo: false, qual: 0 });
    for (let k = 0; k < quantidades.length; k++) if (quantidades[k]) await tela.digitar(p, p.locator('#quantidadeEntrega-' + k), tela.qtd(quantidades[k], Array.isArray(casas) ? casas[k] : casas));
    await tela.botao(p, 'Adicionar', { noDialogo: false, qual: 1 });
    return tela.toasts(p);
  },
};
