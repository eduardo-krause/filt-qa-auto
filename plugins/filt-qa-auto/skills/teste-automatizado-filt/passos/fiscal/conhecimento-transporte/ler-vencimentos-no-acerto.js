// Tela: Movimentações Fiscais › Conhecimento de Transportes (/fiscal/conhecimento-de-transporte)
const { lerVencimentos } = require('../../_acerto');

module.exports = {
  // Lê, sem gravar, as parcelas da forma Duplicata no acerto do documento (sai pelo Voltar).
  // args: { id } → [{ parcela: '1/1', duplicata, vencimento: 'dd/mm/aaaa', editavel, linha }]
  async lerVencimentosNoAcerto(t, { id }) {
    return lerVencimentos(t, '/fiscal/conhecimento-de-transporte/form?id=' + id);
  },
};
