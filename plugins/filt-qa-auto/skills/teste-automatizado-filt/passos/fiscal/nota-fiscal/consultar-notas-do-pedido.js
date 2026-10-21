// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)
const { notasSql, titulosSql } = require('../../_nota');

module.exports = {
  // Notas do pedido criadas depois de `desdeId`: [{ ID_NOTA_FISCAL, NUMERO_DOCUMENTO }]
  async doPedido(t, { pedido, desdeId = 0 }) { return t.banco.consultar(notasSql, [desdeId, pedido]); },

  // Títulos (duplicatas, dinheiro, cartão) de uma nota pelo ID_NOTA_FISCAL (o número da nota se repete entre séries/modelos):
  // [{ NUMERO_DOCUMENTO: '01000000482-1/2', TIPO_DOCUMENTO_FINANCEIRO, STATUS, VALOR_DOCUMENTO_FINANCEIRO }],
};
