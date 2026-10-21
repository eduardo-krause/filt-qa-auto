// Tela: Financeiro › Estorno (/financeiro/estorno)

module.exports = {
  // Estorno da baixa de um título. args: { pessoa, titulo: '01000000482-2/2', dataBaixa: 'dd/mm/aaaa' }
  async estornar(t, { pessoa, titulo, dataBaixa }) {
    const { p, tela } = t;
    await tela.abrir(p, '/financeiro/estorno');
    await tela.autocompleteRotulo(p, p, 'Pessoa', pessoa);
    for (const r of ['Data Baixa', 'até']) await tela.data(p, tela.campo(p, r), dataBaixa);
    await tela.digitar(p, tela.campo(p, 'Número Duplicata'), titulo, { tab: false });
    await tela.botao(p, 'Filtrar', { noDialogo: false });
    const linha = p.locator('tbody tr').first();
    if (!(await linha.count())) throw new Error(`baixa do título ${titulo} não aparece no Estorno`);
    await linha.locator('.p-checkbox-box, button, i').first().click(); await tela.pronto(p);
    await tela.botao(p, 'Estornar', { noDialogo: false });
    const dlg = await tela.dialogo(p);
    const di = dlg && dlg.locator('input').first();
    if (di && (await di.count())) await tela.data(p, di, dataBaixa);
    for (const b of ['Estornar', 'Sim', 'Confirmar']) { const d = await tela.dialogo(p); if (d && (await tela.temBotao(p, b, d))) await tela.botao(p, b, { escopo: d }); }
    await tela.confirmar(p, ['Sim']);
    const st = await t.banco.linha('select STATUS from DOCUMENTO_FINANCEIRO where NUMERO_DOCUMENTO = ?', [titulo]);
    return st;
  },
};
