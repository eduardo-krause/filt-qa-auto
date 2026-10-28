// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

module.exports = {
  // Preço venda (input#valorPrecoVenda, máscara R$ com 2 casas) e Salvar. Item sem preço de venda
  // (ITEM_FILIAL_VALORES.VALOR_PRECO_VENDA nulo, ex.: item copiado) não aparece na busca de itens do Pedido Venda.
  // args: { id: ID_ITEM_FILIAL, preco: 100, replicar?: false (resposta do diálogo "Replicar alterações") } → { status, toasts, dialogos, replicar (texto do diálogo), precoBanco }
  async alterarPrecoVenda(t, { id, preco, replicar = false }) {
    const { p, tela } = t;
    await require('./abrir-item').abrir(t, { id });
    await tela.digitar(p, p.locator('input#valorPrecoVenda').first(), tela.moeda(preco));
    let r = await require('./salvar-item').salvar(t);
    // item em várias filiais: "Replicar alterações — O campo abaixo foi alterado: Preço venda ... [Não Replicar] [Replicar]"
    const rep = p.locator('.p-dialog:visible').filter({ hasText: 'Replicar alterações' }).last();
    if (await rep.count()) {
      const aviso = tela.limpo(await rep.innerText());
      const bts = rep.locator('button:visible'); const nomes = (await bts.allInnerTexts()).map(tela.limpo);
      const i = nomes.findIndex((x) => x === (replicar ? 'Replicar' : 'Não Replicar'));
      if (i < 0) throw new Error('botão de resposta do "Replicar alterações" não achado (botões: ' + nomes.join(' | ') + ')');
      await bts.nth(i).click(); await tela.pronto(p, 1500);
      r = { ...r, replicar: aviso, toasts: [...r.toasts, ...(await tela.toasts(p))] };
    }
    const precoBanco = await t.banco.valor('select VALOR_PRECO_VENDA from ITEM_FILIAL_VALORES where ID_ITEM_FILIAL = ?', [id]);
    return { ...r, precoBanco: precoBanco === null ? null : Number(precoBanco) };
  },
};
