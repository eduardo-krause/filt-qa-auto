// Consulta Estoque/Movimentação: pesquisa, abre o detalhe do item e lê os cards em texto (sem print).
// args: {busca, item (descrição exata da linha), olho?: true (clica no olho do card "Última compra": devolve o texto
//        antes, após 1º e após 2º clique), manterAberto?: true (deixa o valor visível no fim), tudo?: true (texto da tela),
//        print?: "nome" (só se a pessoa pedir)}
// O 1º input visível da tela é a busca do MENU — o campo de pesquisa do item é o input.busca-input.
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0, 3).join('/');
  await p.goto(base + '/vendas/consulta-estoque-movimentacao'); await lib.esperar(p, 3000);
  const inp = p.locator('input.busca-input:visible').first();
  await inp.fill(a.busca); await lib.esperar(p, 3500);
  await p.locator('tbody tr', { hasText: a.item }).first().click(); await lib.esperar(p, 4000);
  const card = () => p.locator('h6', { hasText: 'Última compra' }).first().locator('xpath=..');
  const ler = async () => (await card().innerText().catch(() => '')).replace(/\n+/g, ' | ');
  const out = { url: p.url(), ultima: await ler() };
  if (a.olho) {
    const eye = card().locator('[class*=eye]').first();
    out.olhos = await card().locator('[class*=eye]').count();
    if (out.olhos) {
      await eye.click(); await lib.esperar(p, 800); out.clique1 = await ler();
      await eye.click(); await lib.esperar(p, 800); out.clique2 = await ler();
      if (a.manterAberto) { await eye.click(); await lib.esperar(p, 800); }
    }
  }
  out.pendente = (await p.locator('.card-transito').first().innerText().catch(() => '')).replace(/\n+/g, ' | ');
  if (a.tudo) out.tela = (await p.innerText('main, .content, body')).replace(/\n+/g, ' | ').slice(0, 2500);
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), a.print + '.png'), fullPage: true });
  return out;
};
