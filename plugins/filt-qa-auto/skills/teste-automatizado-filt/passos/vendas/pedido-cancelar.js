// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=) — CANCELAMENTO (⋮ › Cancelar)
// Quantidades: informe `casas` = casas decimais da unidade do item (o campo tem máscara).
const { situacaoSql, abrirCarrinho, incluirItem } = require('../_pedido');

module.exports = {
  // Menu ⋮ → Cancelar: cancela quantidades por linha ou "Cancelar Todos". args: { pedido, qtds?:[1], casas, todos?:false, motivo? }
  async cancelar(t, { pedido, qtds = [], casas = 0, todos = false, motivo = 'TESTE AUTOMATIZADO' }) {
    const { p, tela } = t;
    await abrirCarrinho(t, pedido);
    await tela.menuKebab(p, 'Cancelar');
    const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Cancelamento Pedido' }).last();
    await dlg.waitFor({ timeout: 15000 });
    const m = dlg.locator('textarea').first(); await m.click(); await p.keyboard.type(motivo, { delay: 15 });
    // o nome acessível do botão inclui o ícone: procurar pelo texto
    // no código o texto é "Cancelar todos" (a tela mostra "Cancelar Todos" só por CSS): comparar sem caixa
    if (todos) { await p.getByRole('button', { name: /^\s*Cancelar todos\s*$/i }).last().click(); await tela.pronto(p); }
    else {
      const inps = dlg.locator('tbody input');
      for (let k = 0; k < qtds.length; k++) if (qtds[k]) await tela.digitar(p, inps.nth(k), tela.qtd(qtds[k], casas));
      await tela.botao(p, 'Processar', { noDialogo: false });
    }
    await tela.confirmar(p, ['Sim', 'Confirmar']);
    return tela.toasts(p);
  },
};
