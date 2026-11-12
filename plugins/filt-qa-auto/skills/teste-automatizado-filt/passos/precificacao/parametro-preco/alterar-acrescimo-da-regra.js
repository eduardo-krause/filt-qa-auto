// Tela: Cadastros › Precificação › Parâmetro de Preço (/precificacao/parametro-preco/form?id=<ID_PARAMETRO_VENDA>)

module.exports = {
  // Troca o "% Acréscimo" da regra de variação do parâmetro (input#acrescimo) e Salva.
  // args: { parametro: ID_PARAMETRO_VENDA, percentual: 10 }  → { antes, depois, toasts }
  //   antes/depois = PERCENTUAL_ACRESCIMO da regra do parâmetro, lido do banco
  async alterarAcrescimo(t, { parametro, percentual }) {
    const { p, tela } = t;
    const sql = 'select PERCENTUAL_ACRESCIMO from PARAMETRO_VENDA_REGRA where ID_PARAMETRO_VENDA = ? order by ID_PARAMETRO_VENDA_REGRA limit 1';
    const antes = Number(await t.banco.valor(sql, [parametro]));
    await tela.abrir(p, '/precificacao/parametro-preco/form?id=' + parametro);
    await tela.pronto(p, 1500);
    const inp = p.locator('input#acrescimo');
    await inp.waitFor({ timeout: 30000 });
    await tela.digitar(p, inp, tela.moeda(percentual));
    const r = await tela.salvar(p);
    const depois = Number(await t.banco.valor(sql, [parametro]));
    return { antes, depois, toasts: r.toasts, dialogos: r.dialogos };
  },
};
