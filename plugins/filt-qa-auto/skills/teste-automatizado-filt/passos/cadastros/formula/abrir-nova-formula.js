// Tela: Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)
const { abrirNovo } = require('./_apoio');

module.exports = {
  // Abre Novo no tipo pedido e devolve o que o form mostra. → { tipo, acordeoes: { 'Variáveis da Nota de Entrada': [...] } }
  async formNovo(t, { tipo }) {
    const { p, tela } = t;
    await abrirNovo(t, tipo);
    const acordeoes = {};
    for (const tab of await p.locator('app-montagem-de-formula p-accordiontab').all()) {
      if (!(await tab.isVisible())) continue;
      const titulo = tela.limpo(await tab.locator('.header-title').first().innerText().catch(() => ''));
      if (!titulo) continue;
      acordeoes[titulo] = (await tab.locator('li.formula-variavel').allInnerTexts()).map(tela.limpo);
    }
    const tipoTela = tela.limpo(await p.locator('p-dropdown#tipoCalculo').innerText());
    return { tipo: tipoTela, acordeoes };
  },
};
