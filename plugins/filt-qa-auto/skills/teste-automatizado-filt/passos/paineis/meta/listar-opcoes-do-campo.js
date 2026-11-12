// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard) — filtro lateral aberto
const { sidebar, idCampo, limpo } = require('./_apoio');

module.exports = {
  // Abre a lista do campo (botão de seta do autocomplete ou o dropdown) e devolve as opções. args: { campo } → [textos]
  async listarOpcoes(t, { campo }) {
    const { p, tela } = t;
    const host = sidebar(p).locator(`#${idCampo(campo)}`).first();
    const seta = host.locator('.p-autocomplete-dropdown, .p-dropdown-trigger').first();
    if (await seta.count()) await seta.click(); else await host.click();
    await tela.pronto(p, 800);
    const ops = (await p.locator('.p-autocomplete-panel:visible li, .p-dropdown-panel:visible li').allInnerTexts()).map(limpo).filter(Boolean);
    await p.keyboard.press('Escape');
    await tela.esperar(p, 300);
    return ops;
  },
};
