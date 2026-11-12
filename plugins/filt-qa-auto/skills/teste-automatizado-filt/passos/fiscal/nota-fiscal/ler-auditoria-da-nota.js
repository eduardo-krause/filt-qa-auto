// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal/form?id=N) › menu ⋮ › Auditoria. Só lê.
// args: { id, aba: 'Forma de pagamento' } → { titulo, abas, aba, comparativo, grupos, colunas: [[th...] por tabela], linhas: [[td...]], caixas: [texto],
//   texto (texto inteiro da aba), toasts, errosApi, itensMenu }
module.exports = {
  async lerAuditoriaDaNota(t, { id, aba }) {
    const { p, tela } = t;
    const rede = require('../../../motor/lib/rede');
    const ini = Date.now();
    await tela.abrir(p, '/nota/nota-fiscal/form?id=' + id);
    await tela.semLoader(p); await tela.pronto(p, 1000);
    await p.locator('#dropdown-help').first().click(); await tela.pronto(p, 400);
    const itensMenu = (await p.locator('.dropdown-menu.show a').allInnerTexts()).map(tela.limpo);
    const item = p.locator('.dropdown-menu.show a').filter({ hasText: 'Auditoria' }).first();
    if (!(await item.count())) throw new Error('menu ⋮ da nota sem "Auditoria" (tem: ' + itensMenu.join(' | ') + ')');
    await item.click(); await tela.pronto(p, 1200);
    const d = p.locator('.p-dialog:visible').filter({ hasText: 'Auditoria' }).last();
    await d.waitFor({ timeout: 30000 }); await tela.pronto(p, 1000);
    const abas = (await d.locator('.p-tabview-nav li[role=presentation]').allInnerTexts()).map(tela.limpo);
    if (aba) {
      const li = d.locator('.p-tabview-nav li[role=presentation]').filter({ hasText: aba }).first();
      if (!(await li.count())) throw new Error(`aba "${aba}" não existe na Auditoria da nota (tem: ${abas.join(' | ')})`);
      await li.click(); await tela.pronto(p, 1500);
    }
    const painel = d.locator('.p-tabview-panel:visible').first();
    const alvo = (await painel.count()) ? painel : d;
    const tabelas = alvo.locator('table'); const nt = await tabelas.count();
    const colunas = []; const linhas = [];
    for (let i = 0; i < nt; i++) {
      colunas.push((await tabelas.nth(i).locator('thead th').allInnerTexts()).map(tela.limpo));
      for (const tr of await tabelas.nth(i).locator('tbody tr').all()) linhas.push((await tr.locator('td').allInnerTexts()).map(tela.limpo));
    }
    const out = {
      titulo: tela.limpo(await d.locator('.p-dialog-title').first().innerText().catch(() => '')),
      abas, aba: aba || null,
      comparativo: (await alvo.locator('.header-title').allInnerTexts()).map(tela.limpo),
      grupos: (await alvo.locator('.p-accordion-header-text').allInnerTexts()).map(tela.limpo),
      caixas: (await alvo.locator('app-auditoria-box').allInnerTexts()).map(tela.limpo),
      colunas, linhas,
      texto: tela.limpo(await alvo.innerText()).slice(0, 3000),
      toasts: await tela.toasts(p), itensMenu,
      errosApi: rede.errosDesde(p, ini).slice(-5),
    };
    await tela.botao(p, 'Fechar', { escopo: d }).catch(() => {});
    return out;
  },
};
