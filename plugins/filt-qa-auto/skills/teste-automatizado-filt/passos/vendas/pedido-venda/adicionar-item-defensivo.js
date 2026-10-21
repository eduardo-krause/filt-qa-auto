// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { escolherAutocomplete } = require('./_apoio');

module.exports = {
  // args: { pedido, item, qtd, casas=3, receituario: { busca, contem }, equipamento? } — adiciona o item e confirma o painel
  async adicionar(t, { pedido, item, qtd, casas = 3, receituario, equipamento }) {
    const { p, tela } = t;
    if (!/\/vendas\/busca/.test(p.url())) { await tela.abrir(p, '/vendas/carrinho?id=' + pedido); await tela.botao(p, 'Item', { noDialogo: false }); await tela.pronto(p, 1200); }
    const busca = p.locator('input[placeholder="Pesquise o item"]');
    await busca.click(); await busca.fill(''); await p.keyboard.type(item, { delay: 40 }); await p.keyboard.press('Enter'); await tela.pronto(p, 1500);
    // o card do resultado com o nome do item (a lista pode ainda mostrar o resultado da busca anterior)
    const card = p.locator('div:has(> * input.input-quantidade), div:has(input.input-quantidade)').filter({ hasText: item }).last();
    await card.waitFor({ timeout: 30000 });
    const q = card.locator('input.input-quantidade').first();
    await tela.digitar(p, q, tela.qtd(qtd, casas));
    const lido = Number((await q.inputValue()).replace(/\./g, '').replace(',', '.'));
    if (lido !== qtd) throw new Error(`quantidade do ${item} ficou ${lido} (esperado ${qtd})`);
    await p.getByText('ADICIONAR', { exact: true }).first().click(); await tela.pronto(p, 1500);
    const painel = p.locator('.p-sidebar:visible').filter({ hasText: 'Adicionar Item ao carrinho' }).last();
    await painel.waitFor({ timeout: 15000 });
    if (equipamento) await escolherAutocomplete(t, painel, 'Equipamento de Aplicação', equipamento, equipamento);
    const ops = await escolherAutocomplete(t, painel, 'Busca de Receituário Padrão', receituario.busca, receituario.contem);
    await painel.getByRole('button', { name: /Confirmar/ }).click();
    await painel.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await tela.pronto(p);
    return { opcoesReceituario: ops.slice(0, 5) };
  },
};
