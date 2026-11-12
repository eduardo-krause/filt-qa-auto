// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard) — filtro lateral aberto
const { sidebar, lerPainel, corpo } = require('./_apoio');

module.exports = {
  // Clica em Filtrar. → { painel, corpo (JSON enviado a find-metas-dashboard), status, filtroAberto, toasts }
  async filtrar(t) {
    const { p, tela } = t;
    const b = sidebar(p).locator('button').filter({ hasText: /^\s*Filtrar\s*$/ }).first();
    if (await b.isDisabled()) throw new Error('botão Filtrar está desabilitado');
    const req = p.waitForRequest((r) => /meta\/find-metas-dashboard/.test(r.url()), { timeout: 20000 }).catch(() => null);
    await b.click();
    const r = await req;
    const resp = r ? await r.response().catch(() => null) : null;
    await tela.pronto(p, 1200);
    return {
      painel: await lerPainel(p), corpo: corpo(r), status: resp ? resp.status() : null,
      filtroAberto: (await p.locator('.p-sidebar.p-sidebar-active').count()) > 0, toasts: await tela.toasts(p),
    };
  },
};
