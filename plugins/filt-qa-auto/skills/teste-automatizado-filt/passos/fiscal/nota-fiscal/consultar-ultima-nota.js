// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)

module.exports = {
  // Maior ID_NOTA_FISCAL atual (para achar as notas criadas depois de uma ação).
  async ultimoId(t) { return Number(await t.banco.valor('select coalesce(max(ID_NOTA_FISCAL),0) from NOTA_FISCAL')) || 0; },

  // Quantas destas notas já têm a NF-e autorizada (NOTA_FISCAL_ELETRONICA.STATUS = 100).,
};
