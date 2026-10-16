// Telas: Financeiro › Acerto Financeiro/Baixa (/financeiro/acerto-financeiro-baixa) e Estorno (/financeiro/estorno)

module.exports = {
  // Baixa (quitação) em Dinheiro de títulos a receber. args: { pessoa, titulos:['01000000482-1/2', ...] }
  // Filtra pelo número da nota do título (input#numeroDuplicata) para a lista não paginar; títulos de notas
  // diferentes são baixados em grupos.
  async quitar(t, { pessoa, titulos }) {
    const { p, tela } = t;
    const grupos = {};
    for (const tit of titulos) (grupos[tit.split('-')[0]] = grupos[tit.split('-')[0]] || []).push(tit);
    for (const [prefixo, lista] of Object.entries(grupos)) {
      await tela.abrir(p, '/financeiro/acerto-financeiro-baixa');
      await tela.autocompleteRotulo(p, p, 'Pessoa', pessoa);
      const nd = p.locator('input#numeroDuplicata');
      if (await nd.count()) await tela.digitar(p, nd, prefixo, { tab: false });
      await tela.botao(p, 'Filtrar', { noDialogo: false, qual: 'last' });
      await tela.confirmar(p, ['Sim']);
      await tela.pronto(p, 800);
      for (const tit of lista) {
        const linha = p.locator('tbody tr').filter({ hasText: tit }).first();
        await linha.waitFor({ timeout: 20000 }).catch(() => {});
        if (!(await linha.count())) throw new Error(`título ${tit} não aparece na baixa de ${pessoa}`);
        await linha.scrollIntoViewIfNeeded(); await linha.locator('.p-checkbox-box').first().click(); await tela.pronto(p);
      }
      await tela.botao(p, 'Baixar', { noDialogo: false });
      const dlg = await tela.dialogo(p);
      await dlg.getByText('Dinheiro', { exact: true }).first().click(); await tela.pronto(p);
      await dlg.getByRole('button', { name: 'Salvar', exact: true }).first().click().catch(() => {}); await tela.pronto(p);
      await dlg.getByRole('button', { name: 'Concluir', exact: true }).click();
      await tela.pronto(p, 1500, { limite: 180000 });
    }
    const st = await t.banco.consultar(`select NUMERO_DOCUMENTO, STATUS from DOCUMENTO_FINANCEIRO where NUMERO_DOCUMENTO in (${titulos.map(() => '?').join(',')})`, titulos);
    const abertos = st.filter((x) => x.STATUS !== 'QUITADO').map((x) => x.NUMERO_DOCUMENTO);
    if (abertos.length) throw new Error('títulos não ficaram QUITADO depois da baixa: ' + abertos.join(', '));
    return st;
  },

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
