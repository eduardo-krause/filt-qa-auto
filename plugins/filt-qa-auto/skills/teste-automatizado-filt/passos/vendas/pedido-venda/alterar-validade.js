// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { situacaoSql, abrirCarrinho, incluirItem } = require('../../_pedido');

module.exports = {
  // Menu ⋮ → Alterar Validade do Pedido → data → Confirmar. Devolve se o diálogo continuou aberto depois do Confirmar.
  // args: { pedido?, data: 'dd/mm/aaaa' }  (se `pedido` vier, abre o carrinho; para o pedido em edição, não passe)
  async alterarValidade(t, { pedido, data }) {
    const { p, tela } = t;
    if (pedido) await abrirCarrinho(t, pedido);
    await tela.menuKebab(p, /Alterar Validade/);
    const dlg = await tela.dialogo(p);
    await tela.data(p, dlg.locator('input').first(), data);
    await tela.botao(p, 'Confirmar', { escopo: dlg });
    const aberto = !!(await p.locator('.p-dialog:visible').filter({ hasText: /Validade/ }).count());
    const toasts = await tela.toasts(p);
    if (aberto) await tela.botao(p, 'Cancelar', { escopo: await tela.dialogo(p) }).catch(() => {});
    return { dialogoContinuouAberto: aberto, toasts };
  },
};
