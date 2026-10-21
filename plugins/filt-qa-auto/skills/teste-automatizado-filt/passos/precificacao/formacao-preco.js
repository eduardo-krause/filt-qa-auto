// Tela: Processos › Precificação › Formação de Preço (/precificacao/formacao-preco)
// Assistente 1 Seleção dos Itens → 2 Simular Valores → 3 Aplicar Valores. Filtros: rádio "Por Período de Compra" /
// "Por Produto", Filial (chips), Fornecedor, Nota Fiscal, Nível do Grupo, Grupo, Período de Compra Inicial*/Final
// (só no modo período), Produto (autocomplete múltiplo, input#produto). O funil aplica o filtro e a grade aparece em
// "Produtos": Filial, Código, Descrição, UN, Valor Aquisição, Custo Aquisição, % Markup, Valor PMZ, Preço Vigente.

module.exports = {
  // args: { modo: 'Por Produto' | 'Por Período de Compra', codigo, busca, inicial?: 'dd/mm/aaaa', final? }
  // → { cabecalho:[...], linha:{ coluna: valor } | null, todas:[...] }
  async selecao(t, { modo = 'Por Produto', codigo, busca, inicial, final }) {
    const { p, tela } = t;
    await tela.abrir(p, '/precificacao/formacao-preco');
    await tela.semLoader(p);
    await p.getByText(modo, { exact: true }).click(); await tela.pronto(p, 800);
    if (inicial) await tela.data(p, p.locator('label:text-is("Período de Compra Inicial")').locator('xpath=following::input[1]'), inicial);
    if (final) await tela.data(p, p.locator('label:text-is("Período de Compra Final")').locator('xpath=following::input[1]'), final);
    if (codigo) {
      const inp = p.locator('label:text-is("Produto")').locator('xpath=following::input[1]');
      await inp.click(); await inp.fill(''); await p.keyboard.type(String(busca || codigo).slice(0, 12), { delay: 40 }); await tela.pronto(p, 1200);
      const ops = p.locator('.p-autocomplete-panel:visible li, li[role=option]:visible');
      const textos = (await ops.allInnerTexts()).map(tela.limpo);
      // opções vêm como "<código> - <descrição>" (ou com o código colado): escolher pelo código exato
      const i = textos.findIndex((x) => new RegExp(`^${codigo}(\\s*-|\\D)`).test(x));
      if (i < 0) throw new Error(`produto de código ${codigo} não está nas opções (${textos.slice(0, 8).join(' | ')})`);
      await ops.nth(i).click(); await tela.pronto(p, 600);
      await p.keyboard.press('Escape');
    }
    await p.locator('button:has(.ph-funnel), button[data-title="Filtrar"]').first().click();
    await tela.pronto(p, 2500);
    const cabecalho = (await p.locator('thead tr').first().locator('th').allInnerTexts()).map(tela.limpo);
    const todas = [];
    for (const r of await p.locator('tbody tr').all()) {
      const c = (await r.locator('td').allInnerTexts()).map(tela.limpo);
      todas.push(Object.fromEntries(cabecalho.map((h, k) => [h, c[k]]).filter(([h]) => h)));
    }
    const linha = codigo ? todas.find((l) => l['Código'] === String(codigo)) || null : null;
    return { cabecalho, linha, todas };
  },
};
