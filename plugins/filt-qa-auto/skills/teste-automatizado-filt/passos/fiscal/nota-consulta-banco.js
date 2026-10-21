// Nota Fiscal — consultas no banco (sem tela): última nota, notas do pedido, NF-e autorizada, títulos da nota
const { notasSql, titulosSql } = require('../_nota');

module.exports = {
  // Maior ID_NOTA_FISCAL atual (para achar as notas criadas depois de uma ação).
  async ultimoId(t) { return Number(await t.banco.valor('select coalesce(max(ID_NOTA_FISCAL),0) from NOTA_FISCAL')) || 0; },

  // Quantas destas notas já têm a NF-e autorizada (NOTA_FISCAL_ELETRONICA.STATUS = 100).,

  async autorizadas(t, ids) {
    if (!ids.length) return 0;
    return Number(await t.banco.valor(`select count(*) from NOTA_FISCAL_ELETRONICA where STATUS = 100 and ID_NOTA_FISCAL in (${ids.map(() => '?').join(',')})`, ids)) || 0;
  },

  // Notas do pedido criadas depois de `desdeId`: [{ ID_NOTA_FISCAL, NUMERO_DOCUMENTO }]
  async doPedido(t, { pedido, desdeId = 0 }) { return t.banco.consultar(notasSql, [desdeId, pedido]); },

  // Títulos (duplicatas, dinheiro, cartão) de uma nota pelo ID_NOTA_FISCAL (o número da nota se repete entre séries/modelos):
  // [{ NUMERO_DOCUMENTO: '01000000482-1/2', TIPO_DOCUMENTO_FINANCEIRO, STATUS, VALOR_DOCUMENTO_FINANCEIRO }],

  async titulos(t, { id }) { if (!id) throw new Error('nota.titulos precisa do id (ID_NOTA_FISCAL)'); return t.banco.consultar(titulosSql, [id]); },

  // Na aba de uma nota já preenchida: Ok do aviso, Concluir do acerto proposto, Salvar e fecha a confirmação Sefaz.,
};
