// Tela: Processos › Financeiro › Gestão Caixa e Bancos (/financeiro/caixas-contas) — lê o extrato da conta no período. Não altera.
const { abrirConta, lerExtrato } = require('./_apoio');

module.exports = {
  // args: { conta: '1019810', dataInicial, dataFinal } → { contas (lista da esquerda), colunas, linhas:[{ idx, data, situacao, documento, descricao (title), descricaoTela, credito, debito, saldo, negrito, acoes:['editar','remover',...] }] }
  async extrato(t, { conta, dataInicial, dataFinal }) {
    const c = await abrirConta(t, { conta, dataInicial, dataFinal });
    return { contas: c.contas, ...(await lerExtrato(t.p)) };
  },
};
