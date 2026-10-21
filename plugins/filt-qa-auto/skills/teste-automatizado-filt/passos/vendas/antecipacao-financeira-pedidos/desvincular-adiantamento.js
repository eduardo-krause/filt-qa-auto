// Tela: Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido)
const { carregar } = require('./_apoio');

module.exports = {
  // Desvincula um adiantamento pelo Histórico do pedido. args: { pessoa, pedido, adiantamento: '50087' }
  async desvincular(t, { pessoa, pedido, adiantamento }) {
    const { p, tela } = t;
    const linha = await carregar(t, { pessoa, pedido });
    await linha.locator('button[ptooltip="Histórico"]').click(); await tela.pronto(p, 800);
    const dlg = await tela.dialogo(p);
    const l = dlg.locator('tr').filter({ hasText: adiantamento }).first();
    if (!(await l.count())) throw new Error(`adiantamento ${adiantamento} não está no Histórico do pedido ${pedido}`);
    await l.locator('button[ptooltip="Desvincular adiantamento"]').click(); await tela.pronto(p, 800);
    const conf = await tela.textoDialogos(p);
    await tela.confirmar(p, ['Sim', 'Confirmar', 'Desvincular', 'Continuar', 'Ok']);
    await tela.pronto(p, 800);
    // confere no banco: o vínculo tem que ficar cancelado
    const v = await t.banco.linha(`select x.VALOR_SELECIONADO, x.VALOR_CANCELADO from PEDIDO_FORMA_PAGAMENTO f
      join PEDIDO_FORMA_PAGAMENTO_DOCUMENTO_FINANCEIRO x on x.ID_PEDIDO_FORMA_PAGAMENTO = f.ID_PEDIDO_FORMA_PAGAMENTO
      join DOCUMENTO_FINANCEIRO d on d.ID_DOCUMENTO_FINANCEIRO = x.ID_DOCUMENTO_FINANCEIRO
      where f.ID_PEDIDO = ? and d.NUMERO_DOCUMENTO = ? order by x.ID_PEDIDO_FORMA_PAGAMENTO_DOCUMENTO_FINANCEIRO desc limit 1`, [pedido, adiantamento]);
    return { confirmacao: conf, toasts: await tela.toasts(p), vinculo: v };
  },
};
