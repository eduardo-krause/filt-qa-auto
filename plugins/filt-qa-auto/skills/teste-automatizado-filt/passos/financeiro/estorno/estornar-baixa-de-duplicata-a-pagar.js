// Tela: Financeiro › Estorno (/financeiro/estorno) — Duplicatas a Pagar.

module.exports = {
  // Estorna a(s) baixa(s) de uma duplicata a pagar feitas na data. args: { titulo: '06542654345-5/5', dataBaixa: 'dd/mm/aaaa' }
  // Marca a 1ª linha → Estornar → "Tem certeza que deseja estornar?" (Data do estorno vem preenchida) → Sim.
  // → { linhas (texto das baixas listadas), confirmacao, toasts }
  async estornarPagar(t, { titulo, dataBaixa }) {
    const { p, tela } = t;
    await tela.abrir(p, '/financeiro/estorno');
    await p.locator('label:visible', { hasText: 'Duplicatas a Pagar' }).first().click(); await tela.pronto(p, 500);
    for (const id of ['dataBaixaInicial', 'dataBaixaFinal']) await tela.data(p, p.locator('input#' + id), dataBaixa);
    await tela.digitar(p, p.locator('input#filtro-numeroDocumento'), titulo, { tab: false });
    await tela.botao(p, 'Filtrar', { noDialogo: false, qual: 'last' });
    await tela.pronto(p, 800);
    const linhas = (await p.locator('tbody tr').allInnerTexts()).map(tela.limpo).filter(Boolean);
    if (!linhas.length) throw new Error(`nenhuma baixa de ${titulo} em ${dataBaixa} no Estorno`);
    await p.locator('tbody tr').first().locator('.p-checkbox-box').first().click(); await tela.pronto(p);
    await tela.botao(p, 'Estornar', { noDialogo: false });
    const d = await tela.dialogo(p);
    const confirmacao = d ? tela.limpo(await d.innerText()) : null;
    await tela.botao(p, 'Sim', { escopo: d });
    await tela.pronto(p, 1500, { limite: 120000 });
    return { linhas, confirmacao, toasts: await tela.toasts(p) };
  },
};
