// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
const { limpo } = require('../../_comum');
const { escopo, lerGrid, lerRodape } = require('./_apoio');

module.exports = {
  // Clica no cabeçalho da coluna `vezes` vezes (grade já pesquisada) e, a cada clique, lê a ordem da coluna (página atual),
  // o aria-sort e o ícone de ordenação. args: { coluna: 'Valor pago', vezes?: 1 }
  // devolve { coluna, ordenavel, inicial: {valores, ariaSort, icone}, cliques: [{ ariaSort, icone, valores }], paginacao }
  async ordenarColuna(t, { coluna, vezes = 1 }) {
    const { p, tela } = t;
    const e = escopo(p);
    const th = e.locator('table thead th').filter({ hasText: new RegExp(`^\\s*${coluna.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\s*$`) }).first();
    if (!(await th.count())) throw new Error(`coluna "${coluna}" não existe na grade (tem: ${(await e.locator('table thead th').allInnerTexts()).map(limpo).join(' | ')})`);
    const estado = async () => ({
      ariaSort: await th.getAttribute('aria-sort'),
      icone: await th.locator('p-sorticon i, .p-sortable-column-icon').first().getAttribute('class').catch(() => null),
      valores: (await lerGrid(p)).linhas.map((l) => l[coluna]),
    });
    const ordenavel = /p-sortable-column/.test((await th.getAttribute('class')) || '');
    const inicial = await estado();
    const cliques = [];
    for (let i = 0; i < vezes; i++) { await th.click(); await tela.pronto(p, 400); cliques.push(await estado()); }
    return { coluna, ordenavel, inicial, cliques, paginacao: (await lerRodape(p)).paginacao };
  },
};
