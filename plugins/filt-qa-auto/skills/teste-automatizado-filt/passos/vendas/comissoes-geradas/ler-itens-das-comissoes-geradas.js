// Tela: Relatórios › Vendas › Comissões (/vendas/relatorios/comissoes-geradas) — "Comissões Geradas"

module.exports = {
  // Filtro (funil): Data Inicial/Final + Vendedor → Filtrar; expande o vendedor e os documentos e lê a tabela de itens
  // (Nota, Data, Cliente, Item, Quantidade, Valor Unitário, Desconto, Valor Tabela, Rentabilidade do item, Valor Base, % Comissão, Valor Comissão).
  // args: { inicial: 'dd/mm/aaaa', final?, vendedor: 'NOME' } → { cabecalho, itens: [{ coluna: texto }] }
  async lerItensComissoes(t, { inicial, final, vendedor }) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/relatorios/comissoes-geradas');
    await tela.pronto(p, 1500);
    const ini = p.locator('#formFiltro #dataInicial input, #formFiltro input#dataInicial').first();
    if (!(await ini.isVisible())) { await p.locator('button[data-title="Filtrar"]:visible').first().click(); await tela.pronto(p, 1000); }
    await tela.data(p, ini, inicial);
    await tela.data(p, p.locator('#formFiltro #dataFinal input, #formFiltro input#dataFinal').first(), final || inicial);
    await tela.autocomplete(p, p.locator('#formFiltro input#vendedor'), vendedor);
    await p.keyboard.press('Escape');
    await p.getByRole('button', { name: 'Filtrar', exact: true }).last().click(); await tela.pronto(p, 2500);
    const vend = p.locator('tbody tr').filter({ hasText: vendedor }).first();
    await vend.waitFor({ timeout: 30000 }).catch(() => {});
    if (!(await vend.count())) throw new Error(`relatório sem o vendedor ${vendedor} no período (avisos: ${(await tela.toasts(p)).join(' | ')})`);
    await vend.locator('a[href="#"], .pi-chevron-right').first().click(); await tela.pronto(p, 1000);
    // documentos: expande todos os que ainda estão fechados
    for (let k = 0; k < 20; k++) {
      const fechado = p.locator('table table tbody tr a:has(.pi-chevron-right)').first();
      if (!(await fechado.count())) break;
      await fechado.click(); await tela.pronto(p, 800);
    }
    const tab = p.locator('table').filter({ has: p.locator('th', { hasText: 'Valor Tabela' }) }).last();
    await tab.waitFor({ timeout: 15000 });
    const todas = p.locator('table').filter({ has: p.locator('th', { hasText: 'Valor Tabela' }) });
    const cabecalho = (await tab.locator('thead th').allInnerTexts()).map(tela.limpo);
    const itens = [];
    for (let i = 0; i < (await todas.count()); i++) {
      for (const r of await todas.nth(i).locator(':scope > tbody > tr, tbody tr').all()) {
        const c = (await r.locator('td').allInnerTexts()).map(tela.limpo);
        // só as linhas de item (as tabelas são aninhadas: a 1ª coluna de um item é "<nota> - <série>")
        if (c.length === cabecalho.length && /^\d+\s*-\s*\d+$/.test(c[0])) itens.push(Object.fromEntries(cabecalho.map((h, k) => [h, c[k]])));
      }
    }
    const vistos = new Set();
    return { cabecalho, itens: itens.filter((x) => { const k = JSON.stringify(x); if (vistos.has(k)) return false; vistos.add(k); return true; }) };
  },
};
