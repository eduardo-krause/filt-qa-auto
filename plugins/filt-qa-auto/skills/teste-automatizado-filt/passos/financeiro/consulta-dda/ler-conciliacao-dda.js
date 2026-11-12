// Tela: Processos › Financeiro › Consulta DDA — lê a área de conciliação: título da tela, cabeçalho (conta), abas,
// e as duas áreas (.area: DDA e Contas a Pagar) com posição, colunas, linhas, detalhes expandidos, mensagem sem registros,
// filtros de coluna, rolagem e rodapé. Não altera.
module.exports = {
  async conciliacaoDda(t) {
    const { p } = t;
    await t.tela.pronto(p, 300);
    return p.evaluate(() => {
      const vis = (e) => !!(e && e.offsetParent);
      const txt = (e) => (e && e.innerText ? e.innerText : '').replace(/\s*\n\s*/g, ' | ').replace(/ /g, ' ').trim();
      const titulo = [...document.querySelectorAll('h1,h2,h3,span,div')].find((e) => vis(e) && e.children.length === 0 && /^Consulta DDA/.test(e.textContent.trim()) && !e.closest('nav, .layout-sidebar, .p-sidebar'));
      const cab = [...document.querySelectorAll('*')].find((e) => vis(e) && e.children.length === 0 && e.textContent.trim() === 'Conciliação DDA');
      const cabLinha = cab ? txt(cab.parentElement) : null;
      const cabImg = cab ? [...cab.parentElement.querySelectorAll('img, svg, i, em')].map((i) => i.getAttribute('src') || i.getAttribute('alt') || i.className || 'svg').join(',') : null;
      const abas = [...document.querySelectorAll('.p-tabview-nav li, [role=tab], .p-selectbutton .p-button, .abas button, .abas a, .tabs button')].filter(vis)
        .map((e) => ({ texto: txt(e), ativa: /p-highlight|active|ativo|selecionad/.test(e.className) || e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-pressed') === 'true' }));
      const areas = [...document.querySelectorAll('.area')].filter(vis).map((a) => {
        const r = a.getBoundingClientRect();
        const sc = a.querySelector('.area-scroll');
        const thead = a.querySelectorAll('thead tr');
        const filtrosColuna = thead[1] ? [...thead[1].querySelectorAll('th')].map((th) => (th.querySelector('input') ? 'input' : '')).slice(1) : [];
        const linhas = [...a.querySelectorAll('tbody tr.linha')].filter(vis);
        const detalhes = [...a.querySelectorAll('tbody tr.linha-detalhe')].filter(vis);
        return {
          titulo: txt(a.querySelector('.area-titulo .titulo')),
          expandirTexto: txt(a.querySelector('a.expandir-retrair')),
          x: Math.round(r.x), y: Math.round(r.y), largura: Math.round(r.width),
          colunas: [...(thead[0] ? thead[0].querySelectorAll('th') : [])].map(txt).filter(Boolean),
          filtroColunaAtivo: !!a.querySelector('button.btn-filtro-coluna.ativo'), temBotaoFiltro: !!a.querySelector('button.btn-filtro-coluna'), filtrosColuna,
          qtdLinhas: linhas.length, linhas: linhas.slice(0, 40).map(txt),
          checkboxPorLinha: linhas.every((l) => l.querySelector('p-checkbox')), expandirPorLinha: linhas.every((l) => l.querySelector('a .fa-chevron-right, a .fa-chevron-down')),
          qtdDetalhes: detalhes.length, detalhes: detalhes.slice(0, 10).map(txt),
          semRegistros: txt(a.querySelector('.sem-registros')) || null,
          carregando: !!a.querySelector('.p-progress-spinner, .carregando, .loading, .spinner'),
          rolagem: sc ? { altura: sc.clientHeight, total: sc.scrollHeight, topo: sc.scrollTop, infinita: sc.hasAttribute('infinite-scroll') } : null,
          paginador: !!a.querySelector('.p-paginator, .paginacao, pagination'),
          rodape: txt(a.querySelector('.rodape')),
        };
      });
      const b = document.getElementById('confirmarDda');
      const mensagemInicial = [...document.querySelectorAll('p, span, div')].filter((e) => vis(e) && e.children.length === 0 && /Informe os filtros/i.test(e.textContent)).map(txt)[0] || null;
      return { titulo: titulo ? titulo.textContent.trim() : null, cabecalho: cabLinha, cabecalhoIcone: cabImg, abas, areas, mensagemInicial, confirmarHabilitado: b ? !b.disabled : null };
    });
  },
};
