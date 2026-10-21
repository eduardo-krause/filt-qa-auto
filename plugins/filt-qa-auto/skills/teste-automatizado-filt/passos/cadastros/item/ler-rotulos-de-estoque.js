// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

module.exports = {
  // Rótulos do card Estoque (ordem), para conferir a posição de campos.
  async rotulosEstoque(t) {
    const { p, tela } = t;
    const card = p.locator('p-accordiontab, p-card, .p-card').filter({ has: p.locator('#formulaCustoPresente') }).last();
    return (await card.locator('label:visible').allInnerTexts()).map(tela.limpo).filter(Boolean);
  },
};
