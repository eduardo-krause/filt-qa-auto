// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

module.exports = {
  // Entra na edição do pedido (Editar → Sim). Pedido parcialmente entregue abre a "edição parcial".
  async editar(t, { pedido }) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/carrinho?id=' + pedido);
    await tela.fecharToasts(p);
    await tela.botao(p, 'Editar', { noDialogo: false });
    await tela.confirmar(p, ['Sim']);
  },
};
