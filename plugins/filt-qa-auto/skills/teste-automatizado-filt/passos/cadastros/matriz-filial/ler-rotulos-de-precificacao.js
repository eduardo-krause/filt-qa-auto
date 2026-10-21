// Tela: Cadastros › Empresas › Matriz/Filial (/fiscal/filial/form?id=<ID_FILIAL>)

module.exports = {
  // Texto do card Precificação (a partir do título), para conferir a ordem dos campos.
  async rotulosPrecificacao(t) {
    const { p, tela } = t;
    const card = p.locator('p-accordiontab, p-card, .p-card').filter({ has: p.locator('input#formulaValorAquisicao') }).last();
    return (await card.locator('label:visible').allInnerTexts()).map(tela.limpo).filter(Boolean);
  },
};
