// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)
const { lerVencimentos } = require('../../_acerto');

module.exports = {
  // Lê, sem gravar, as parcelas da forma Duplicata no acerto do documento (sai pelo Voltar).
  // args: { id } → [{ parcela: '1/1', duplicata, vencimento: 'dd/mm/aaaa', editavel, linha }]
  async lerVencimentosNoAcerto(t, { id }) {
    return lerVencimentos(t, '/nota/nota-fiscal/form?id=' + id);
  },
};
