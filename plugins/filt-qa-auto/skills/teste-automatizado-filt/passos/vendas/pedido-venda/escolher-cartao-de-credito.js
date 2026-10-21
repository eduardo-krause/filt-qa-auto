// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

module.exports = {
  // Carrinho com forma Cartão: marca Crédito e escolhe a Forma Parcelamento. args: { parcelamento: '3X' }
  async cartaoCredito(t, { parcelamento }) {
    const { p, tela } = t;
    await p.locator('label:has-text("Crédito")').first().click(); await tela.pronto(p);
    await tela.autocomplete(p, tela.campo(p, 'Forma Parcelamento'), parcelamento);
  },
};
