// Tela: Processos › Financeiro › Consulta DDA (/financeiro/consulta-dda)
// Abre a rotina pela rota (ou pelo menu lateral com { peloMenu: true }). devolve { url, titulo, painelAberto, filtros, itemMenu }
const { ROTA, estadoFiltros, limpo } = require('./_apoio');

module.exports = {
  async abrirConsultaDda(t, { peloMenu = false } = {}) {
    const { p, tela } = t;
    let itemMenu = null;
    if (peloMenu) {
      await tela.abrir(p, '/');
      // clica só em itens visíveis do menu ("Financeiro" também existe recolhido dentro de Cadastros)
      const item = (txt) => p.locator('a:visible, span:visible').filter({ hasText: new RegExp('^\\s*' + txt + '\\s*$') }).first();
      const dda = () => p.locator('a:visible, span:visible').filter({ hasText: /^\s*Consulta DDA\s*$/ });
      if (!(await dda().count())) {
        const fin = () => p.locator('span:visible').filter({ hasText: /^\s*Financeiro\s*$/ });
        if (!(await fin().count())) { await item('Processos').click(); await tela.pronto(p, 600); }
        if (!(await dda().count()) && (await fin().count())) { await fin().first().click(); await tela.pronto(p, 600); }
      }
      itemMenu = await dda().count();
      if (itemMenu) { await dda().first().click(); await tela.pronto(p, 800); }
    } else await tela.abrir(p, ROTA);
    await tela.pronto(p, 800);
    const titulo = limpo(await p.evaluate(() => {
      const h = [...document.querySelectorAll('h1, h2, h3, h4, span, div')].find((e) => e.offsetParent && e.children.length === 0 && !e.closest('.p-sidebar, nav, .layout-sidebar') && /^Consulta DDA/.test(e.textContent.trim()));
      return h ? h.textContent : '';
    }));
    const f = await estadoFiltros(p);
    return { url: p.url(), titulo, painelAberto: !!f.aberto, filtros: f, itemMenu };
  },
};
