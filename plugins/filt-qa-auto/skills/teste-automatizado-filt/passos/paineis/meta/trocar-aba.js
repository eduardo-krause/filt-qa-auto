// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard)
const { lerPainel, corpo } = require('./_apoio');

module.exports = {
  // args: { aba: 'Abertas' | 'Fechadas' } → { ...lerPainel, corpo (busca disparada pela troca, se houve) }
  async trocarAba(t, { aba }) {
    const { p, tela } = t;
    const b = p.locator('app-select-options button.opcao').filter({ hasText: new RegExp(`^\\s*${aba}\\s*$`, 'i') }).first();
    const req = p.waitForRequest((r) => /meta\/find-metas-dashboard/.test(r.url()), { timeout: 8000 }).catch(() => null);
    await b.click();
    const r = await req;
    await tela.pronto(p, 1200);
    const painel = await lerPainel(p);
    painel.corpo = corpo(r);
    return painel;
  },
};
