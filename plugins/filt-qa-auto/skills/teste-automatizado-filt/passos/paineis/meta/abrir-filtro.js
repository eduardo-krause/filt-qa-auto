// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard)
const { lerFiltro } = require('./_apoio');

module.exports = {
  // Clica no funil. → { botao: { tooltip, posição em relação às abas e à tela }, filtro: lerFiltro }
  async abrirFiltro(t) {
    const { p, tela } = t;
    const b = p.locator('div.botao-filtro button:has(.ph-funnel)').first();
    await b.waitFor({ timeout: 15000 });
    const bb = await b.boundingBox();
    const abas = await p.locator('app-select-options').first().boundingBox();
    const vp = p.viewportSize() || (await p.evaluate(() => ({ width: innerWidth, height: innerHeight })));
    const botao = {
      tooltip: await b.getAttribute('data-title'),
      x: Math.round(bb.x), y: Math.round(bb.y), altura: Math.round(bb.height), centroY: Math.round(bb.y + bb.height / 2),
      distanciaDireita: Math.round(vp.width - (bb.x + bb.width)), larguraTela: vp.width,
      abasY: abas && Math.round(abas.y), abasCentroY: abas && Math.round(abas.y + abas.height / 2), abasDireita: abas && Math.round(abas.x + abas.width),
    };
    await b.click();
    await p.locator('.p-sidebar.p-sidebar-active').first().waitFor({ timeout: 10000 });
    await tela.pronto(p, 600);
    return { botao, filtro: await lerFiltro(p) };
  },
};
