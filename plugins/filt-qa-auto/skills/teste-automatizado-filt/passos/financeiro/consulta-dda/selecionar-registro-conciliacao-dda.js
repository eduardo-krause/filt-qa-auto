// Tela: Processos › Financeiro › Consulta DDA — marca o checkbox de uma linha da área (DDA ou Contas a Pagar) e lê a seleção.
// args: { area: 'Contas a Pagar'|'DDA', linha?: n (índice), texto?: 'trecho da linha' }
// devolve { marcadas: [índices], destacadas: [índices], linhasMarcadas: [texto], total, confirmarHabilitado, desfazerVisivel }
const { lerSelecao } = require('./_apoio');

module.exports = {
  async selecionarDda(t, { area = 'Contas a Pagar', linha, texto }) {
    const { p, tela } = t;
    const a = p.locator('.area').filter({ has: p.locator('.area-titulo .titulo', { hasText: area }) }).first();
    let l = a.locator('tbody tr.linha');
    l = texto ? l.filter({ hasText: texto }).first() : l.nth(linha || 0);
    if (!(await l.count())) throw new Error(`linha ${texto || linha} não está na área ${area}`);
    await l.locator('.p-checkbox-box').first().click();
    await tela.pronto(p, 400);
    return lerSelecao(p, area);
  },
};
