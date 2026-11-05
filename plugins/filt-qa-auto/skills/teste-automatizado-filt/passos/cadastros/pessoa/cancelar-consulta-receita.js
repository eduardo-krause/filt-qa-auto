// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) → modal "Consulta CPF/CNPJ - Receita Federal" aberta
const ap = require('./_apoio');

module.exports = {
  // Clica "Cancelar" da modal e devolve se ela fechou, os avisos e o estado do cadastro (pessoa + aba visível de cada complemento).
  // args: { esperaAvisos?: 2000 }  devolve { modalFechou, url, avisos, pessoa: [{rotulo, valor, desabilitado}], complementos: [[...]] }
  async cancelarConsultaReceita(t, { esperaAvisos = 2000 }) {
    const { p, tela } = t;
    const m = ap.modal(p);
    if (!(await m.count())) throw new Error(`modal "${ap.TITULO}" não está aberta`);
    const col = ap.coletor(p);
    await m.getByRole('button', { name: 'Cancelar', exact: true }).click();
    const ini = Date.now();
    while (Date.now() - ini < esperaAvisos) { await col.coletar(); await p.waitForTimeout(300); }
    await tela.pronto(p, 300); await col.coletar();
    const r = { modalFechou: !(await ap.modal(p).count()), url: p.url().replace(/^https?:\/\/[^/]+/, ''), avisos: col.lista };
    r.pessoa = await ap.lerRotulos(p.locator('p-accordiontab.accordion-pessoa').first());
    const tvs = p.locator('p-tabview[id^="dadosAdicionais-"]'); const n = await tvs.count(); r.complementos = [];
    for (let i = 0; i < n; i++) r.complementos.push(await ap.lerRotulos(tvs.nth(i).locator('.p-tabview-panel:not([hidden])').first()));
    r.focoEm = await p.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName));
    return r;
  },
};
