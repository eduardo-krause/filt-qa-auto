// Tela: Cadastros › Precificação › Parâmetro de Preço (/precificacao/parametro-preco/form?id=<ID_PARAMETRO_VENDA>)

module.exports = {
  // Inclui o vendedor no campo "Vendedor" (multi) do parâmetro e Salva. Se já estiver vinculado, não mexe.
  // args: { parametro: ID_PARAMETRO_VENDA, vendedor: 'NOME', idVendedor: ID_PESSOA_VENDEDOR } → { vinculado, jaEstava, toasts }
  async vincularVendedorNoParametro(t, { parametro, vendedor, idVendedor }) {
    const { p, tela } = t;
    const sql = 'select count(*) as N from PARAMETRO_VENDA_PESSOA_VENDEDOR where ID_PARAMETRO_VENDA = ? and ID_PESSOA_VENDEDOR = ?';
    if (Number((await t.banco.linha(sql, [parametro, idVendedor])).N) > 0) return { vinculado: true, jaEstava: true, toasts: [] };
    await tela.abrir(p, '/precificacao/parametro-preco/form?id=' + parametro);
    await tela.pronto(p, 1500);
    await tela.autocomplete(p, p.locator('input#pessoaVendedor'), vendedor);
    await p.keyboard.press('Escape');
    const r = await tela.salvar(p);
    return { vinculado: Number((await t.banco.linha(sql, [parametro, idVendedor])).N) > 0, jaEstava: false, toasts: r.toasts };
  },
};
