// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { situacaoSql, abrirCarrinho, incluirItem } = require('../../_pedido');

module.exports = {
  // Em edição: inclui mais um item (botão Item → busca → ADICIONAR → Carrinho). args: { item, qtd, casas, desconto? }
  async adicionarItem(t, a) {
    const { p, tela } = t;
    await tela.botao(p, 'Item', { noDialogo: false });
    await incluirItem(t, a);
    await tela.botao(p, 'Carrinho', { noDialogo: false });
  },
};
