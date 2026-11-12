// Tela: Processos › Financeiro › Consulta DDA — lê o painel de filtros (chips, datas, situação, mensagens). Não altera.
const { estadoFiltros } = require('./_apoio');

module.exports = {
  async filtrosDda(t) { await t.tela.pronto(t.p, 300); return estadoFiltros(t.p); },
};
