// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

module.exports = {
  // Venda futura: GERAR NOTA no carrinho abre a nota em outra aba; conclui o acerto proposto, salva e fecha a aba.
  // args: { pedido }  devolve { toasts, dialogos }
  async gerarNotaVendaFutura(t, { pedido }) {
    const { p, tela } = t;
    tela.exigirDfe();
    await tela.abrir(p, '/vendas/carrinho?id=' + pedido);
    const nova = p.context().waitForEvent('page', { timeout: 60000 });
    nova.catch(() => {});   // se o clique falhar antes, a espera não pode derrubar o motor
    await tela.botao(p, 'GERAR NOTA', { noDialogo: false });
    const q = await nova.catch(() => { throw new Error('GERAR NOTA não abriu a nota em outra aba em 60 s'); });
    await q.waitForLoadState('domcontentloaded');
    require('../../../motor/lib/rede').instalar(q);
    try {
      await tela.pronto(q, 1500);
      // a nota abre já preenchida: mesmo passo de "salvar nota aberta", rodando na aba nova
      return await require('../../fiscal/nota-fiscal/salvar-nota-aberta-por-outra-rotina').salvarAberta({ ...t, p: q }, {});
    } finally { await q.close().catch(() => {}); await p.bringToFront(); }
  },
};
