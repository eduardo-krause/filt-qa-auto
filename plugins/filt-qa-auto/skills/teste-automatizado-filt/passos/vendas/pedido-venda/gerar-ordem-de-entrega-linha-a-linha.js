// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { situacaoSql, abrirCarrinho, incluirItem } = require('../../_pedido');

module.exports = {
  // Ordem de entrega digitando linha a linha e esperando o recálculo de cada uma: a tela redesenha a tabela a cada quantidade
  // ("A quantidade restante foi recalculada") e o ordemEntrega acima perde o campo. Item sem saldo deixa o campo desabilitado.
  // args: { pedido, quantidades:[100, 20], casas = 3 } → toasts
  async porLinha(t, { pedido, quantidades, casas = 3 }) {
    const { p, tela } = t;
    await abrirCarrinho(t, pedido);
    await tela.botao(p, 'Adicionar', { noDialogo: false, qual: 0 });
    const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Ordem de Entrega' }).last();
    for (let k = 0; k < quantidades.length; k++) {
      for (let tentativa = 0; tentativa < 3; tentativa++) {
        try {
          const inp = p.locator('#quantidadeEntrega-' + k);
          if (await inp.isDisabled()) throw new Error(`linha ${k + 1} da ordem de entrega desabilitada (item sem saldo?)`);
          await inp.click({ timeout: 10000 }); await p.keyboard.press('Control+A');
          await p.keyboard.type(tela.qtd(quantidades[k], casas), { delay: 30 }); await p.keyboard.press('Tab');
          await tela.pronto(p, 1200); break;
        } catch (e) { if (tentativa === 2 || /desabilitada/.test(e.message)) throw e; await tela.pronto(p, 1000); }
      }
    }
    await tela.botao(p, 'Adicionar', { escopo: dlg }); await tela.pronto(p, 1500);
    return tela.toasts(p);
  },
};
