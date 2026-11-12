// Tela: Cadastros › Financeiro › Movimentação automática OFX — abre o Novo, lê o form e alterna o Tipo.
const { ROTA, lerForm, clicarTipo, marcados } = require('./_apoio');

module.exports = {
  // args: { tipos:['D','C'] } → { form (como ler), cliques:[{ tipo, marcados:[rótulos dos rádios marcados] }] }
  async formNovo(t, { tipos = [] } = {}) {
    const { p, tela } = t;
    await tela.abrir(p, ROTA);
    await p.getByText('Novo', { exact: true }).first().click(); await tela.pronto(p, 800);
    await p.locator('input#descricao').waitFor({ timeout: 20000 });
    const form = await lerForm(p);
    const cliques = [];
    for (const tp of tipos) { await clicarTipo(t, tp); cliques.push({ tipo: tp, marcados: await marcados(p) }); }
    return { form, cliques };
  },
};
