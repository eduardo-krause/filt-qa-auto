// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

module.exports = {
  // Em edição: escreve a observação do pedido (textarea#observacoesPedido).
  async observacao(t, { texto }) {
    const c = t.p.locator('textarea#observacoesPedido');
    await c.scrollIntoViewIfNeeded(); await c.fill(texto); await c.dispatchEvent('input'); await c.dispatchEvent('blur');
    await t.tela.pronto(t.p);
  },
};
