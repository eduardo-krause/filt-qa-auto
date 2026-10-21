// Tela: Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido)
const { carregar, moedaTela } = require('./_apoio');

module.exports = {
  // Vincula adiantamentos ao pedido. args: { pessoa, pedido, adiantamentos:['50087'], valorBaixar? }
  // devolve { valorOferecido, marcados, toasts }
  async vincular(t, { pessoa, pedido, adiantamentos, valorBaixar }) {
    const { p, tela } = t;
    const linha = await carregar(t, { pessoa, pedido });
    const res = { valorOferecido: moedaTela(await linha.locator('input').last().inputValue().catch(() => '')) };
    if (valorBaixar !== undefined) await tela.digitar(p, linha.locator('input').last(), tela.moeda(valorBaixar));
    const btn = linha.locator('button[ptooltip="Gerar antecipações"]');
    if (await btn.isDisabled()) throw new Error('botão "Gerar antecipações" desabilitado para o pedido ' + pedido);
    await btn.click(); await tela.pronto(p, 800);
    const dlg = await tela.dialogo(p);
    res.marcados = [];
    for (const a of adiantamentos) {
      const alvo = dlg.locator('tr').filter({ hasText: new RegExp(`^\\s*${a}\\b`) }).first();
      if (!(await alvo.count())) throw new Error(`adiantamento ${a} não está na janela Gerar antecipações`);
      res.marcados.push(tela.limpo(await alvo.innerText()));
      await alvo.locator('.p-checkbox-box').first().click(); await tela.pronto(p);
    }
    const salvar = dlg.getByRole('button', { name: 'Salvar', exact: true });
    if (await salvar.isDisabled()) throw new Error('Salvar desabilitado na janela Gerar antecipações');
    await salvar.click(); await tela.pronto(p, 800);
    res.toasts = await tela.toasts(p);
    return res;
  },
};
