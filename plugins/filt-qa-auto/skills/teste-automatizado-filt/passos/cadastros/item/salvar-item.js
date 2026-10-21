// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

module.exports = {
  async salvar(t) {
    const { p, tela } = t;
    const s = await tela.salvar(p);
    const d = p.locator('.p-dialog:visible', { hasText: /tabela de pre[cç]o|Validação Descrição/i });
    if (await d.count()) { await d.getByRole('button', { name: 'Cancelar' }).first().click().catch(() => {}); await tela.pronto(p); }
    return s;
  },
};
