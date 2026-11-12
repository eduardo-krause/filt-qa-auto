// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard) — filtro lateral aberto
const { sidebar, lerPainel, lerFiltro, corpo } = require('./_apoio');

module.exports = {
  // Clica em Limpar. → { painel, filtro, corpo da busca refeita }
  async limpar(t) {
    const { p, tela } = t;
    const req = p.waitForRequest((r) => /meta\/find-metas-dashboard/.test(r.url()), { timeout: 15000 }).catch(() => null);
    await sidebar(p).locator('button').filter({ hasText: /^\s*Limpar\s*$/ }).first().click();
    const r = await req;
    await tela.pronto(p, 1200);
    return { painel: await lerPainel(p), filtro: await lerFiltro(p), corpo: corpo(r) };
  },
};
