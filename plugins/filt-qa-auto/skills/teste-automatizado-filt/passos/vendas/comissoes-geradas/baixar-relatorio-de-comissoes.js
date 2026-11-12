// Tela: Relatórios › Vendas › Comissões (/vendas/relatorios/comissoes-geradas) — "Comissões Geradas"
const fs = require('fs');
const path = require('path');

module.exports = {
  // Com o relatório JÁ filtrado na tela (ver lerItensComissoes): menu ⋮ › "Download Analítico PDF" | "Download Analítico CSV"...
  // args: { opcao: 'Download Analítico CSV', pasta } → { arquivo, via: 'download' | 'aba' | 'nenhum', toasts }
  async baixarComissoes(t, { opcao, pasta }) {
    const { p, tela } = t;
    fs.mkdirSync(pasta, { recursive: true });
    const dl = p.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    const aba = p.context().waitForEvent('page', { timeout: 60000 }).catch(() => null);
    await tela.menuKebab(p, opcao);
    const r = await Promise.race([dl.then((d) => d && { d }), aba.then((a) => a && { a }), new Promise((ok) => setTimeout(() => ok(null), 60000))]);
    if (r && r.d) {
      const arq = path.join(pasta, r.d.suggestedFilename());
      await r.d.saveAs(arq);
      return { arquivo: arq, via: 'download', toasts: await tela.toasts(p) };
    }
    if (r && r.a) {
      const q = r.a; await q.waitForLoadState('load').catch(() => {});
      const url = q.url(); let arq = null;
      try {
        const resp = await p.context().request.get(url);
        arq = path.join(pasta, opcao.replace(/\W+/g, '-') + (/csv/i.test(opcao) ? '.csv' : '.pdf'));
        fs.writeFileSync(arq, await resp.body());
      } catch (e) { arq = null; }
      await q.close().catch(() => {}); await p.bringToFront();
      return { arquivo: arq, via: 'aba', url, toasts: await tela.toasts(p) };
    }
    return { arquivo: null, via: 'nenhum', toasts: await tela.toasts(p) };
  },
};
