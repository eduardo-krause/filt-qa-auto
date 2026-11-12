// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard) — filtro lateral aberto
const { sidebar, idCampo, lerFiltro } = require('./_apoio');

module.exports = {
  // Remove pelo X todas as opções escolhidas num campo de multisseleção. args: { campo } → lerFiltro
  async removerSelecao(t, { campo }) {
    const { p, tela } = t;
    const x = sidebar(p).locator(`#${idCampo(campo)} .p-autocomplete-token-icon`);
    while (await x.count()) { await x.first().click(); await tela.esperar(p, 300); }
    await tela.pronto(p, 300);
    return lerFiltro(p);
  },
};
