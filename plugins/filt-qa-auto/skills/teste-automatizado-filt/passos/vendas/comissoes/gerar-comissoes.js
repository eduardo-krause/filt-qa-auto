// Tela: Processos › Vendas › Comissões (/vendas/gerar-comissoes/form)

module.exports = {
  // Filtro (funil): Data inicial/final + Vendedor → Filtrar; marca o vendedor, informa a Data de Vencimento, Gerar e Salvar.
  // args: { inicial: 'dd/mm/aaaa', final, vendedor: 'NOME', vencimento: 'dd/mm/aaaa', recalcular?: true (responde Sim se o período já tem comissão) }
  // → { listagem: texto da linha do vendedor antes de gerar, toasts, comissao: última linha de COMISSAO }
  async gerarComissoes(t, { inicial, final, vendedor, vencimento, recalcular = false }) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/gerar-comissoes/form');
    await tela.pronto(p, 1500);
    await p.locator('button[data-title="Filtrar"]:visible').first().click(); await tela.pronto(p, 1000);
    await tela.data(p, p.locator('#filtro input#dataInicial'), inicial);
    await tela.data(p, p.locator('#filtro input#dataFinal'), final || inicial);
    await tela.autocomplete(p, p.locator('#filtro input#vendedor'), vendedor);
    await p.keyboard.press('Escape');
    await p.getByRole('button', { name: 'Filtrar', exact: true }).click(); await tela.pronto(p, 2500);
    // período que já tem comissão: "Já existe comissão calculada neste período. Deseja recalcular?" [Não] [Sim]
    let recalculou = false;
    const aviso = p.locator('.p-dialog:visible').filter({ hasText: 'Já existe comissão calculada' });
    if (await aviso.count()) {
      if (!recalcular) throw new Error('já existe comissão calculada no período (passe recalcular: true para recalcular)');
      await aviso.last().getByRole('button', { name: 'Sim', exact: true }).click(); await tela.pronto(p, 2500); recalculou = true;
    }
    // a linha do vendedor é a que tem a caixa de seleção (a tabela do aviso de recálculo também cita o vendedor)
    const linha = p.locator('tbody tr:visible').filter({ hasText: vendedor }).filter({ has: p.locator('.p-checkbox-box') }).first();
    await linha.waitFor({ timeout: 30000 }).catch(() => {});
    if (!(await linha.count())) throw new Error(`vendedor ${vendedor} sem comissão a gerar no período ${inicial} a ${final || inicial} (tela: ${(await p.locator('body').innerText()).match(/Nenhum Registro\.?/) || ''})`);
    const listagem = tela.limpo(await linha.innerText());
    await linha.locator('.p-checkbox-box').first().click(); await tela.pronto(p, 500);
    await tela.data(p, p.locator('#dataVencimento input, input#dataVencimento').first(), vencimento);
    await p.locator('button#gerarComissoes').click(); await tela.pronto(p, 2500);
    const toasts = await tela.toasts(p);
    const dialogos = await tela.textoDialogos(p);
    let salvar = null;
    // o aviso de erro do Gerar ("Necessário configurar a conta contábil...") fica por cima do Salvar: fecha os avisos antes
    await tela.fecharToasts(p);
    if (await p.locator('button:has-text("Salvar"):enabled').count()) salvar = await tela.salvar(p);
    const comissao = await t.banco.linha('select * from COMISSAO order by ID_COMISSAO desc limit 1');
    return { recalculou, listagem, toasts: [...toasts, ...((salvar && salvar.toasts) || [])], dialogos: [...dialogos, ...((salvar && salvar.dialogos) || [])], comissao };
  },
};
