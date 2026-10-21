// Modal: Acerto Financeiro (abre ao salvar Lançamento Financeiro, Nota Fiscal, Adiantamento...).
const { limpo } = require('../_comum');

module.exports = {
  // Acerto aberto: forma Duplicata numa conta bancária, com a forma de parcelamento (texto exato: "30 DIAS", "30/60/90").
  // args: { conta: '12345', parcelamento: '30/60/90', vencs?: ['dd/mm/aaaa'...], concluir?: true }
  // devolve { parcelas: [linhas da grade], resumo }
  async duplicata(t, { conta, parcelamento, vencs = [], concluir = true }) {
    const { p, tela } = t;
    const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Acerto Financeiro' }).last();
    await dlg.waitFor({ timeout: 30000 });
    await dlg.getByText('Duplicata', { exact: true }).first().click(); await tela.pronto(p, 800);
    await tela.autocompleteRotulo(p, dlg, 'Conta Bancária/Caixa', conta);
    // Forma Parcelamento é p-autocomplete: abre pela seta do próprio componente e escolhe o texto exato
    const id = await dlg.locator('label', { hasText: 'Forma Parcelamento' }).first().getAttribute('for');
    await dlg.locator(`p-autocomplete#${id || 'formaParcelamento'} button`).first().click(); await tela.pronto(p, 800);
    const ops = p.locator('li[role=option]:visible, li.p-autocomplete-item:visible');
    const txt = (await ops.allInnerTexts()).map(limpo);
    const i = txt.indexOf(parcelamento);
    if (i < 0) throw new Error(`forma de parcelamento "${parcelamento}" não existe (tem: ${txt.join(' | ')})`);
    await ops.nth(i).click(); await tela.pronto(p);
    await dlg.getByRole('button', { name: 'Gerar', exact: true }).first().click(); await tela.pronto(p, 800);
    const linhas = dlg.locator('tbody tr');
    for (let k = 0; k < vencs.length; k++) await tela.data(p, linhas.nth(k).locator('input').first(), vencs[k]);
    const parcelas = (await linhas.allInnerTexts()).map(limpo);
    if (!concluir) return { parcelas };
    await dlg.getByRole('button', { name: 'Salvar', exact: true }).first().click(); await tela.pronto(p, 800);
    const resumo = limpo(((await dlg.innerText()).match(/Total Pago[\s\S]{0,80}/) || [''])[0]);
    await dlg.getByRole('button', { name: 'Concluir', exact: true }).first().click(); await tela.pronto(p, 1000);
    return { parcelas, resumo };
  },
};
