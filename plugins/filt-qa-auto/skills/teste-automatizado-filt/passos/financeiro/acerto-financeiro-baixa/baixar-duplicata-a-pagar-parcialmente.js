// Tela: Financeiro › Acerto Financeiro/Baixa (/financeiro/acerto-financeiro-baixa) — Duplicatas a Pagar.

module.exports = {
  // Baixa parcial em Dinheiro de UMA duplicata a pagar. args: { titulo: '06542654345-5/5', valor: 50 }
  // Filtra pelo número (prefixo antes do "-"), confirma "Nenhuma data ... filtrar mesmo assim?" (Sim), marca a linha,
  // digita o Valor a Pagar (input#valorAcertar<id>), Baixar → Dinheiro → Salvar → Concluir → Recibo "Não".
  // → { id, VALOR_BAIXADO, STATUS, recibo } (lido do banco)
  async baixarPagarParcial(t, { titulo, valor }) {
    const { p, tela } = t;
    await tela.abrir(p, '/financeiro/acerto-financeiro-baixa');
    await p.locator('label:visible', { hasText: 'Duplicatas a Pagar' }).first().click(); await tela.pronto(p, 500);
    await tela.digitar(p, p.locator('input#numeroDuplicata'), titulo.split('-')[0], { tab: false });
    await tela.botao(p, 'Filtrar', { noDialogo: false, qual: 'last' });
    await tela.confirmar(p, ['Sim']);
    await tela.pronto(p, 800);
    const linha = p.locator('tbody tr').filter({ hasText: titulo }).first();
    await linha.waitFor({ timeout: 20000 }).catch(() => {});
    if (!(await linha.count())) throw new Error(`duplicata ${titulo} não aparece na Baixa (Duplicatas a Pagar)`);
    const id = Number((await linha.locator('a[href*="duplicata-pagar/form?id="]').first().getAttribute('href')).split('id=')[1]);
    await linha.locator('.p-checkbox-box').first().click(); await tela.pronto(p);
    await tela.digitar(p, linha.locator('input[id^=valorAcertar]'), tela.moeda(valor));
    await tela.botao(p, 'Baixar', { noDialogo: false });
    const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Acerto Financeiro' }).last();
    await dlg.waitFor({ timeout: 20000 });
    await dlg.getByText('Dinheiro', { exact: true }).first().click(); await tela.pronto(p, 800);
    await dlg.getByRole('button', { name: 'Salvar', exact: true }).first().click(); await tela.pronto(p, 800);
    await dlg.getByRole('button', { name: 'Concluir', exact: true }).click();
    await tela.pronto(p, 1500, { limite: 180000 });
    const rec = p.locator('.p-dialog:visible, [role=alertdialog]:visible').filter({ hasText: 'Deseja imprimir o recibo' });
    await rec.first().waitFor({ timeout: 60000 }).catch(() => {});
    let recibo = null;
    if (await rec.count()) { recibo = tela.limpo(await rec.first().innerText()); await rec.first().getByRole('button', { name: 'Não', exact: true }).click(); await tela.pronto(p); }
    const l = await t.banco.linha('select STATUS, VALOR_BAIXADO from DOCUMENTO_FINANCEIRO where ID_DOCUMENTO_FINANCEIRO = ?', [id]);
    return { id, ...l, recibo };
  },
};
