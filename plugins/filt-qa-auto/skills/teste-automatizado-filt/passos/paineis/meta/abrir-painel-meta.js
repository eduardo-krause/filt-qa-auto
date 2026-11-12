// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard)
const { lerPainel } = require('./_apoio');

module.exports = {
  // Abre o painel (aba Abertas é a padrão). → { aba, metas[], selecionada, semRegistros, gráficos..., erros[], toasts[] }
  async abrirPainel(t) {
    const { p, tela } = t;
    const erros = [];
    const ouvir = (r) => { if (/\/meta\//.test(r.url()) && r.status() >= 400) erros.push(`${r.status()} ${r.request().method()} ${r.url()}`); };
    p.on('response', ouvir);
    await tela.abrir(p, '/fiscal/meta-dashboard');
    await p.locator('app-select-options button.opcao').first().waitFor({ timeout: 30000 });
    await tela.pronto(p, 1500);
    p.off('response', ouvir);
    const r = await lerPainel(p);
    r.erros = erros; r.toasts = await tela.toasts(p);
    return r;
  },
};
