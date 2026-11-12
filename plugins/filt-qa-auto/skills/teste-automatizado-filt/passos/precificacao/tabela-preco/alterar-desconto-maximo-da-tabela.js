// Tela: Cadastros › Precificação › Tabela de Preço (/precificacao/tabela-preco/form?id=<ID_TABELA_PRECO>)

module.exports = {
  // Troca o "% Desconto máximo" da tabela (input#percentualDescontoComercial) e Salva (não replica para outras filiais).
  // args: { tabela: ID_TABELA_PRECO, percentual: 5 }  → { antes, depois, toasts }  (PERCENTUAL_DESCONTO_COMERCIAL lido do banco)
  async alterarDescontoMaximo(t, { tabela, percentual }) {
    const { p, tela } = t;
    const sql = 'select PERCENTUAL_DESCONTO_COMERCIAL from TABELA_PRECO where ID_TABELA_PRECO = ?';
    const antes = Number(await t.banco.valor(sql, [tabela]));
    await tela.abrir(p, '/precificacao/tabela-preco/form?id=' + tabela);
    await tela.pronto(p, 1500);
    const inp = p.locator('input#percentualDescontoComercial');
    await inp.waitFor({ timeout: 30000 });
    await tela.digitar(p, inp, tela.moeda(percentual));
    const r = await tela.salvar(p);
    const rep = p.locator('.p-dialog:visible').filter({ hasText: 'Replicar alterações' });
    if (await rep.count()) { await rep.last().getByRole('button', { name: 'Não replicar' }).click(); await tela.pronto(p, 1000); }
    const depois = Number(await t.banco.valor(sql, [tabela]));
    return { antes, depois, toasts: r.toasts, dialogos: r.dialogos };
  },
};
