// Tela: Configurações › Vendas › Regras Comissão (/vendas/regras-comissao/form?id=<ID_REGRA_COMISSAO>)

module.exports = {
  // Inclui o vendedor no campo "Vendedor" (multi) da regra e Salva. Se já estiver vinculado, não mexe.
  // args: { regra: ID_REGRA_COMISSAO, vendedor: 'NOME', idVendedor: ID_PESSOA_VENDEDOR } → { vinculado, jaEstava, toasts }
  async vincularVendedor(t, { regra, vendedor, idVendedor }) {
    const { p, tela } = t;
    const sql = 'select count(*) as N from REGRA_COMISSAO_PESSOA_VENDEDOR where ID_REGRA_COMISSAO = ? and ID_PESSOA_VENDEDOR = ?';
    if (Number((await t.banco.linha(sql, [regra, idVendedor])).N) > 0) return { vinculado: true, jaEstava: true, toasts: [] };
    await tela.abrir(p, '/vendas/regras-comissao/form?id=' + regra);
    await tela.pronto(p, 1500);
    await tela.autocomplete(p, p.locator('input#pessoaVendedor'), vendedor);
    await p.keyboard.press('Escape');
    const r = await tela.salvar(p);
    return { vinculado: Number((await t.banco.linha(sql, [regra, idVendedor])).N) > 0, jaEstava: false, toasts: r.toasts };
  },
};
