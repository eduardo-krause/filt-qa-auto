// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)
const { duplicatasSql } = require('./_apoio');

module.exports = {
  async titulosDesde(t, { desde, pessoaId }) { return t.banco.consultar(duplicatasSql, [desde, pessoaId]); },

  // Novo lançamento com acerto em Duplicata numa conta bancária.
  // args: { natureza, pessoa, pessoaId, contaContabil, valor, conta, parcelamento, emitirBoletos?: false, pastaPdf? }
  // devolve { eventos (toasts/diálogos do Salvar), errosApi, titulos: [duplicatas + boleto], pdfs },
};
