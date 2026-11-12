// Tela: Processos › Financeiro › Gestão Caixa e Bancos — botão "Movimentação" do extrato (diálogo Movimentação Bancária).
const { abrirConta } = require('./_apoio');
const mov = require('../../_movimentacao-bancaria');

module.exports = {
  // args: { conta, tipo:'D'|'C', data, valor (número), classificacao | contaContabil (sinônimo: o diálogo não tem conta contábil, tem Classificação Financeira),
  //   historico (texto livre → Descrição), historicoContabil (autocomplete Histórico), documento, centro, conciliado }
  // → { dialogo:{antes, preenchido, naoAchados, toasts, errosApi, obrigatorios, dialogoAberto}, toasts, errosApi, idLancamento (banco), idsNovos }
  async novaMov(t, { conta, tipo, data, valor, classificacao, contaContabil, historico, historicoContabil, documento, centro, conciliado }) {
    const { p, tela } = t;
    await abrirConta(t, { conta });
    await p.locator('#movBancaria').click(); await tela.pronto(p, 800);
    const idAntes = Number(await t.banco.valor('SELECT COALESCE(MAX(ID_LANCAMENTO),0) FROM LANCAMENTO')) || 0;
    const dialogo = await mov.preencherEConfirmar(t, { tipo, data, valor, classificacao: classificacao || contaContabil, descricao: historico, historicoContabil, documento, centro, conciliado });
    if (dialogo.dialogoAberto) await mov.cancelar(t);
    const novos = dialogo.dialogoAberto ? [] : (await t.banco.consultar('SELECT ID_LANCAMENTO ID FROM LANCAMENTO WHERE ID_LANCAMENTO > ? ORDER BY 1', [idAntes])).map((x) => Number(x.ID));
    return { dialogo, toasts: dialogo.toasts, errosApi: dialogo.errosApi, idLancamento: novos.length ? novos[novos.length - 1] : null, idsNovos: novos };
  },
};
