// Tela: Cadastros › Precificação › Tabela de Preço (/precificacao/tabela-preco/form?id=<ID_TABELA_PRECO>)

module.exports = {
  // Altera o "Preço tabela" (input #precoSugerido-<ID_ITEM_FILIAL>) de um item já listado na tabela e Salva.
  // args: { tabela: ID_TABELA_PRECO, itemFilial: ID_ITEM_FILIAL (filial do usuário), valor: 120 }
  // → { antes, depois, toasts }  (antes/depois = { VALOR_VENDA_SUGERIDO, VALOR_VENDA } lidos do banco da filial do item)
  async alterarPrecoDoItem(t, { tabela, itemFilial, valor }) {
    const { p, tela } = t;
    const sql = 'select VALOR_VENDA_SUGERIDO, VALOR_VENDA from TABELA_PRECO_ITEM_FILIAL where ID_TABELA_PRECO = ? and ID_ITEM_FILIAL = ?';
    const antes = await t.banco.linha(sql, [tabela, itemFilial]);
    await tela.abrir(p, '/precificacao/tabela-preco/form?id=' + tabela);
    await tela.pronto(p, 1500);
    const inp = p.locator('input#precoSugerido-' + itemFilial);
    await inp.waitFor({ timeout: 30000 });
    await tela.digitar(p, inp, tela.moeda(valor));
    const r = await tela.salvar(p);
    // depois do Salvar o sistema pergunta se replica para as demais filiais: não replica (mexe só na filial do item)
    const rep = p.locator('.p-dialog:visible').filter({ hasText: 'Replicar alterações' });
    if (await rep.count()) { await rep.last().getByRole('button', { name: 'Não replicar' }).click(); await tela.pronto(p, 1000); }
    const depois = await t.banco.linha(sql, [tabela, itemFilial]);
    return { antes, depois, toasts: r.toasts, dialogos: r.dialogos };
  },
};
