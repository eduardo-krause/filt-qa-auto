// Tela: Processos › Financeiro › Consulta DDA — clica "Desfazer seleção" e lê a seleção da área depois.
// O botão fica em .acoes-selecao (aba ativa), fora da .area. args: { area: 'Contas a Pagar'|'DDA' }  devolve o mesmo de selecionarDda
const { lerSelecao } = require('./_apoio');

module.exports = {
  async desfazerSelecaoDda(t, { area = 'Contas a Pagar' } = {}) {
    const { p, tela } = t;
    const d = p.locator('.acoes-selecao button').filter({ hasText: 'Desfazer seleção' }).filter({ visible: true }).first();
    if (!(await d.count())) throw new Error('"Desfazer seleção" não aparece na tela');
    await d.click(); await tela.pronto(p, 400);
    return lerSelecao(p, area);
  },
};
