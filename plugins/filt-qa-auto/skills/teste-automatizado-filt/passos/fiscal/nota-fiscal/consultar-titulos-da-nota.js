// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)
const { notasSql, titulosSql } = require('../../_nota');

module.exports = {
  async titulos(t, { id }) { if (!id) throw new Error('nota.titulos precisa do id (ID_NOTA_FISCAL)'); return t.banco.consultar(titulosSql, [id]); },

  // Na aba de uma nota já preenchida: Ok do aviso, Concluir do acerto proposto, Salvar e fecha a confirmação Sefaz.,
};
