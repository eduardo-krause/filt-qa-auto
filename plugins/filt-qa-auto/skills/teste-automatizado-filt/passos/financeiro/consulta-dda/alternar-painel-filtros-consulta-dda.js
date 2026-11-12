// Tela: Processos › Financeiro › Consulta DDA — fecha o painel de filtros pelo X ou reabre pelo botão Filtros (funil do cabeçalho).
// args: { acao: 'fechar'|'abrir' }  devolve o estado dos filtros ({ aberto, ... })
const { estadoFiltros } = require('./_apoio');

module.exports = {
  async painelFiltrosDda(t, { acao }) {
    const { p, tela } = t;
    if (acao === 'fechar') await p.locator('.p-sidebar .p-sidebar-close').first().click();
    else await p.locator('button.vs-btn-symbol-stroke:has(.ph-funnel)').first().click();
    await tela.pronto(p, 900);
    return estadoFiltros(p);
  },
};
