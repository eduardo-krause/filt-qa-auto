// Consulta Estoque/Movimentação: abre o detalhe e a lupa de um saldo do card "Estoque pendente consolidado".
// args: {busca, item, saldo?: "A receber" | "A entregar" | "Em trânsito - a receber" | "Em trânsito - a entregar",
//        abrir?: ["NF", "207", ...] (clica no link da 1ª coluna que contém o texto e confere a nova aba), print?}
// Devolve o valor do card, cabeçalho e linhas da lupa (a soma das quantidades deve bater com o card).
module.exports = async (p, lib, a) => {
  await require('./estoque_detalhe.js')(p, lib, { busca: a.busca, item: a.item });
  const saldo = a.saldo || 'A receber';
  const box = p.locator('.card-transito .bloco').filter({ has: p.locator('.rotulo-card', { hasText: new RegExp('^\\s*' + saldo + '\\s*$', 'i') }) }).first();
  const out = { card: (await box.innerText()).replace(/\n+/g, ' ') };
  await box.locator('i.lupa').click(); await lib.esperar(p, 3500);
  const dlg = p.locator('.p-dialog:visible').last();
  out.titulo = (await dlg.locator('.p-dialog-header').innerText().catch(() => '')).trim();
  out.cab = (await dlg.locator('thead tr').first().innerText()).replace(/\s+/g, ' ');
  out.linhas = (await dlg.locator('tbody tr').allInnerTexts()).map((x) => x.replace(/\s+/g, ' ').trim());
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), a.print + '.png') });
  for (const t of [].concat(a.abrir || [])) {
    const alvo = dlg.locator('tbody td:first-child', { hasText: t }).first().locator('a, span, button').first();
    const [nova] = await Promise.all([p.context().waitForEvent('page', { timeout: 15000 }).catch(() => null), alvo.click().catch(() => null)]);
    if (nova) { await nova.waitForLoadState('networkidle').catch(() => {}); await lib.esperar(nova, 3000); out['abriu ' + t] = nova.url(); await nova.close(); }
    else out['abriu ' + t] = 'nenhuma nova aba; url=' + p.url();
  }
  out.abaOriginal = p.url();
  await dlg.locator('button:has-text("Fechar")').first().click().catch(() => {});
  return out;
};
