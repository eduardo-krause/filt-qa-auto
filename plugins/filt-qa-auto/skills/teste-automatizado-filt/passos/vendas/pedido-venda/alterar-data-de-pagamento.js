// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

module.exports = {
  // Pedido JÁ em edição (Editar → Sim): menu ⋮ › Condições de Venda › troca a Data pagamento › Confirmar. Não salva o pedido.
  // args: { data: 'dd/mm/aaaa' }  → devolve os avisos (toasts)
  async alterarDataPagamento(t, { data }) {
    const { p, tela } = t;
    await tela.menuKebab(p, 'Condições de Venda');
    const dlg = await tela.dialogo(p);
    await tela.data(p, p.locator('input#dataPagamento'), data);
    await tela.botao(p, 'Confirmar', { escopo: dlg });
    await tela.pronto(p, 800);
    return tela.toasts(p);
  },
};
