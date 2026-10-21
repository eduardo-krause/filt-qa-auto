// Tela: Cadastros › Empresas › Matriz/Filial (/fiscal/filial/form?id=<ID_FILIAL>)
// A configuração da filial (card Precificação, fórmulas) fica na mesma página (grava em CONFIGURACAO_FILIAL).

module.exports = {
  async abrir(t, { id }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/filial/form?id=' + id);
    if (!(await tela.semLoader(p))) { t.anotar('ATENÇÃO: loader da tela travado ao abrir — automação recarregou a página'); await p.reload(); await tela.pronto(p, 1000); }
    await tela.pronto(p, 1000);
  },

  // Texto do card Precificação (a partir do título), para conferir a ordem dos campos.
  async rotulosPrecificacao(t) {
    const { p, tela } = t;
    const card = p.locator('p-accordiontab, p-card, .p-card').filter({ has: p.locator('input#formulaValorAquisicao') }).last();
    return (await card.locator('label:visible').allInnerTexts()).map(tela.limpo).filter(Boolean);
  },

  async salvar(t) { const { p, tela } = t; return tela.salvar(p); },
};
