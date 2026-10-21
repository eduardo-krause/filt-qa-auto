// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

module.exports = {
  // Rótulos do card "Preço e custo variáveis" na ordem e estado de campos pedidos pelo id.
  // args: { ids: ['valorUnitarioAquisicao', ...] } → { rotulos:[...], campos: { id: { valor, desabilitado } } }
  async precoCusto(t, { ids = [] }) {
    const { p, tela } = t;
    const card = p.locator('p-accordiontab, p-card, .p-card').filter({ hasText: 'Preço e custo variáveis' }).filter({ has: p.locator('#valorUnitarioAquisicao') }).last();
    const rotulos = (await card.locator('label:visible').allInnerTexts()).map(tela.limpo).filter(Boolean);
    const campos = {};
    for (const id of ids) {
      const e = p.locator(`input#${id}`).first();
      if (!(await e.count())) { campos[id] = null; continue; }
      campos[id] = { valor: await e.inputValue(), desabilitado: await e.isDisabled(), somenteLeitura: await e.evaluate((x) => x.readOnly) };
    }
    return { rotulos, campos };
  },
};
