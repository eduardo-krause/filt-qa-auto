// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard) — filtro lateral aberto
const { sidebar, idCampo } = require('./_apoio');

module.exports = {
  // Clica no hyperlink do rótulo do campo. args: { campo: 'responsavel'|'nivel'|'grupo'|'marca'|'item' }
  // → { url, novaAba, titulo } (a aba nova é fechada; navegação na mesma aba volta para o painel)
  async abrirLink(t, { campo }) {
    const { p, tela } = t;
    const id = idCampo(campo);
    const s = sidebar(p);
    const host = s.locator(`#${id}`).first();
    // o link fica no bloco do rótulo do campo (app-cadastroRapido)
    const link = host.locator('xpath=ancestor::*[.//label][1]').locator('label a, app-cadastrorapido a, a').first();
    if (!(await link.count())) throw new Error(`campo ${campo} sem hyperlink no rótulo`);
    const antes = p.url();
    const popup = p.context().waitForEvent('page', { timeout: 8000 }).catch(() => null);
    await link.click();
    const nova = await popup;
    if (nova) {
      await nova.waitForLoadState('domcontentloaded').catch(() => {});
      await nova.waitForTimeout(2500);
      const r = { url: nova.url(), novaAba: true, titulo: tela.limpo(await nova.locator('h1, .titulo-pagina, .page-title').first().innerText().catch(() => '')) };
      await nova.close();
      return r;
    }
    await tela.pronto(p, 1500);
    const r = { url: p.url(), novaAba: false };
    if (p.url() !== antes) { await p.goBack(); await tela.pronto(p, 1200); }
    return r;
  },
};
