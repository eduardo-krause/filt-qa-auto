// Tela: Cadastros › Financeiro › Movimentação automática OFX — Novo, escolhe a conta bancária e alterna o Tipo lendo as contas sugeridas.
const { ROTA, ac, clicarTipo, lerForm } = require('./_apoio');

module.exports = {
  // args: { conta, sequencia:['D','C','D'], debito, credito (opcional: informa antes da sequência) }
  // → { inicial:{credito,debito}, passos:[{ tipo, marcado, credito, debito }] }  (não salva)
  async sugerir(t, { conta, sequencia = [], debito, credito }) {
    const { p, tela } = t;
    await tela.abrir(p, ROTA);
    await p.getByText('Novo', { exact: true }).first().click(); await tela.pronto(p, 800);
    await p.locator('input#descricao').waitFor({ timeout: 20000 });
    await ac(t, 'configuracaoPortador', conta);
    if (debito) await ac(t, 'planoContaAnaliticaDebito', debito);
    if (credito) await ac(t, 'planoContaAnaliticaCredito', credito);
    const f0 = await lerForm(p);
    const passos = [];
    for (const tp of sequencia) { await clicarTipo(t, tp); const f = await lerForm(p); passos.push({ tipo: tp, marcado: f.tipo, credito: f.credito, debito: f.debito }); }
    return { inicial: { credito: f0.credito, debito: f0.debito }, passos };
  },
};
