// Tela: Processos › Financeiro › Conciliação de Contas — lê as linhas da conciliação aberta (depois de importar ou reabrir). Não altera.
const { limpo, irAba, lista, expandirTodos, lerRegistros } = require('./_apoio');

module.exports = {
  // args: { aba:'Não Conciliados'|'Conciliados', lado:'OFX'|'Sistema', filtroTexto (regex no histórico/title/linha), expandir:true, max, menu (lê o ⋮; padrão = expandir) }
  // Com filtroTexto a tela é expandida (o histórico/MEMO só aparece no detalhe "Histórico:").
  // → [{ idx, data, tipoDocumento, documento, descricao (Histórico do detalhe), valor, negativo, marcador, marcadorTitle, title, titles,
  //      pendenteSalvar, marcado, expandido, detalhes:{Histórico, Configuração, FITID, Lançamento, Geração, Motivo, Data Conciliação...}, linkLancamento, temMenu, menu:[...], texto }]
  async linhas(t, { aba = 'Não Conciliados', lado = 'OFX', filtroTexto, expandir = true, max, menu } = {}) {
    const { p, tela } = t;
    if (!(await p.locator('.p-tabview-nav li').count())) throw new Error('nenhuma conciliação aberta na tela (importe o OFX ou reabra antes)');
    await irAba(t, aba);
    if (expandir || filtroTexto) await expandirTodos(t);
    const lst = await lista(t, lado);
    let regs = await lerRegistros(lst);
    if (filtroTexto) { const re = new RegExp(filtroTexto, 'i'); regs = regs.filter((r) => re.test(`${r.descricao || ''} ${r.title || ''} ${r.texto} ${JSON.stringify(r.detalhes)}`)); }
    if (max) regs = regs.slice(0, max);
    if (menu ?? expandir) {
      for (const r of regs) {
        r.menu = [];
        if (!r.temMenu) continue;
        const btn = lst.locator('tbody > tr.line1').nth(r.idx).locator('xpath=following-sibling::tr[1]').locator('.header-buttons button').first();
        await btn.scrollIntoViewIfNeeded(); await btn.click(); await tela.pronto(p, 400);
        r.menu = (await p.locator('.mat-menu-panel:visible button').allInnerTexts()).map(limpo).filter(Boolean);
        await p.locator('.cdk-overlay-backdrop').last().click(); await tela.pronto(p, 300);
      }
    }
    return regs;
  },
};
