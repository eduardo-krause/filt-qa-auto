// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard)
module.exports = {
  // Fecha o filtro lateral pelo X, se estiver aberto.
  async fecharFiltro(t) {
    const { p, tela } = t;
    const x = p.locator('.p-sidebar.p-sidebar-active .p-sidebar-close, .p-sidebar.p-sidebar-active .p-sidebar-icon').first();
    if (await x.count()) { await x.click(); await tela.pronto(p, 500); }
  },
};
