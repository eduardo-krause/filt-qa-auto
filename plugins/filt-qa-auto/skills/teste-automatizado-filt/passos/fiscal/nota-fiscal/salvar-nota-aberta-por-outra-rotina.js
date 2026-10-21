// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)

module.exports = {
  async salvarAberta(t) {
    const { p, tela } = t;
    tela.exigirDfe();
    const ok = p.locator('.p-dialog:visible').getByRole('button', { name: 'Ok', exact: true });
    if (await ok.count()) { await ok.last().click(); await tela.pronto(p); }
    const acerto = p.locator('.p-dialog:visible').filter({ hasText: 'Acerto Financeiro' });
    if (await acerto.count()) { await acerto.last().getByRole('button', { name: 'Concluir', exact: true }).click({ force: true }); await tela.pronto(p, 1000); }
    const s = await tela.salvar(p);
    const sef = p.locator('.p-dialog:visible', { hasText: 'Confirmação da operação' });
    if (await sef.count()) { await sef.getByRole('button', { name: 'Fechar' }).first().click(); await tela.pronto(p); }
    return s;
  },
};
