// Tela: Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)
const { abrirNovo } = require('./_apoio');

module.exports = {
  // Opções do modal "Selecione o Tipo" (na ordem) e do filtro Tipo da listagem. → { modal:[...], filtro:[...] }
  async tipos(t) {
    const { p, tela } = t;
    const modal = await abrirNovo(t);
    await tela.botao(p, 'Cancelar');
    await tela.abrir(p, '/fiscal/formula');
    // o filtro fica num painel lateral (p-sidebar) aberto pelo funil
    await p.locator('button[data-title="Filtrar"], button:has(.ph-funnel)').first().click(); await tela.pronto(p, 800);
    await p.locator('p-dropdown#filtro-tipo .p-dropdown').click(); await tela.esperar(p, 500);
    const filtro = (await p.locator('li.p-dropdown-item:visible').allInnerTexts()).map(tela.limpo);
    await p.keyboard.press('Escape');
    return { modal, filtro };
  },
};
