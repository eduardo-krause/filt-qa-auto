// Tela: Cadastros › Precificação › Parâmetro de Preço (/precificacao/parametro-preco/form?id=<ID_PARAMETRO_VENDA>)

module.exports = {
  // Inclui a tabela no campo "Tabelas de Preço" (multi) do parâmetro e Salva. Se já estiver vinculada, não mexe.
  // args: { parametro: ID_PARAMETRO_VENDA, tabela: 'DESCRIÇÃO', idTabela: ID_TABELA_PRECO } → { vinculado, jaEstava, toasts }
  async vincularTabelaNoParametro(t, { parametro, tabela, idTabela }) {
    const { p, tela } = t;
    const sql = 'select count(*) as N from PARAMETRO_VENDA_TABELA_PRECO where ID_PARAMETRO_VENDA = ? and ID_TABELA_PRECO = ?';
    if (Number((await t.banco.linha(sql, [parametro, idTabela])).N) > 0) return { vinculado: true, jaEstava: true, toasts: [] };
    await tela.abrir(p, '/precificacao/parametro-preco/form?id=' + parametro);
    await tela.pronto(p, 1500);
    await tela.autocomplete(p, p.locator('input#tabelasPreco'), tabela);
    await p.keyboard.press('Escape');
    const r = await tela.salvar(p);
    return { vinculado: Number((await t.banco.linha(sql, [parametro, idTabela])).N) > 0, jaEstava: false, toasts: r.toasts };
  },
};
