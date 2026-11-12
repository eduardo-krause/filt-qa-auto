// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard)
const { lerFiltro } = require('./_apoio');

module.exports = {
  // Só lê o filtro lateral aberto (campos visíveis, valores, desabilitados, obrigatórios, links, Filtrar/Limpar).
  async lerFiltro(t) { return lerFiltro(t.p); },
};
