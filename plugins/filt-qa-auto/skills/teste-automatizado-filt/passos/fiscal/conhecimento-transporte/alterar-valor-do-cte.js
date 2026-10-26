// Tela: Movimentações Fiscais › Conhecimento de Transportes (/fiscal/conhecimento-de-transporte)
module.exports = {
  // Muda o valor do componente Frete de um CT-e salvo e refaz o acerto em Dinheiro.
  // Fluxo: Salvar → toast rápido "O valor total do acerto não pode ser diferente do valor total do CT-e" (PUT 400) →
  // seção "Acerto Financeiro" do form → Adicionar → lixeira da forma antiga → Dinheiro (Valor = restante) → Salvar → Concluir → Salvar.
  // args: { id, valor } → { valor (soma de VALOR_COMPONENTE gravada), avisos }
  async alterarValor(t, { id, valor }) {
    const { p, tela } = t;
    tela.exigirDfe();
    await tela.abrir(p, '/fiscal/conhecimento-de-transporte/form?id=' + id);
    await tela.semLoader(p);
    await tela.pronto(p, 1500);
    const linhaFrete = p.locator('tr', { hasText: 'Frete' }).last();
    await tela.digitar(p, linhaFrete.locator('input').last(), tela.moeda(valor));
    const avisos = [];
    const salvarVendo = async () => {
      const vistos = new Set();
      await p.locator('button:has-text("Salvar")').first().click();
      for (let i = 0; i < 24; i++) { (await p.locator('.p-toast-message, .p-dialog:visible').allInnerTexts()).forEach((x) => vistos.add(tela.limpo(x).slice(0, 200))); await tela.esperar(p, 250); }
      await tela.pronto(p, 800);
      return [...vistos];
    };
    let r = await salvarVendo(); avisos.push(...r);
    if (r.some((x) => /valor total do acerto/i.test(x))) {
      const sec = p.locator('.header-principal:visible', { hasText: 'Acerto Financeiro' }).first()
        .locator('xpath=ancestor::*[contains(@class,"card") or contains(@class,"accordion") or self::p-accordiontab or self::section][1]');
      await sec.getByRole('button', { name: 'Adicionar' }).click(); await tela.pronto(p, 1500);
      const d = p.locator('.p-dialog:visible', { hasText: 'Formas de Pagamento' }).last();
      const lixo = d.locator('.ph-trash, .pi-trash, [class*=trash]');
      for (let k = (await lixo.count()) - 1; k >= 0; k--) { await lixo.nth(k).click(); await tela.pronto(p, 800); }
      await d.locator('text=Dinheiro').first().click(); await tela.pronto(p, 1000);
      const conta = d.locator('label:has-text("Conta Bancária/Caixa")').first().locator('xpath=following::input[1]');
      if (!(await conta.inputValue())) {
        await conta.locator('xpath=ancestor::p-autocomplete[1]').locator('button').first().click(); await tela.pronto(p, 800);
        await p.locator('.p-autocomplete-panel:visible li, li[role=option]:visible').first().click(); await tela.pronto(p, 600);
      }
      await d.getByRole('button', { name: 'Salvar' }).click(); await tela.pronto(p, 1200);
      await d.getByRole('button', { name: 'Concluir' }).click(); await tela.pronto(p, 1500);
      r = await salvarVendo(); avisos.push(...r);
    }
    const dl = p.locator('.p-dialog:visible', { hasText: 'Imprimir Recibo' });
    if (await dl.count()) { await dl.getByRole('button', { name: 'Fechar' }).first().click(); await tela.pronto(p); }
    const v = await t.banco.valor('select sum(VALOR_COMPONENTE) from CONHECIMENTO_TRANSPORTE_COMPONENTE where ID_CONHECIMENTO_TRANSPORTE = ?', [id]);
    return { valor: Number(v), avisos };
  },
};
