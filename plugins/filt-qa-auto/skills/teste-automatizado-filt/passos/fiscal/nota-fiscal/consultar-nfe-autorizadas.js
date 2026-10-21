// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)

module.exports = {
  async autorizadas(t, ids) {
    if (!ids.length) return 0;
    return Number(await t.banco.valor(`select count(*) from NOTA_FISCAL_ELETRONICA where STATUS = 100 and ID_NOTA_FISCAL in (${ids.map(() => '?').join(',')})`, ids)) || 0;
  },
};
