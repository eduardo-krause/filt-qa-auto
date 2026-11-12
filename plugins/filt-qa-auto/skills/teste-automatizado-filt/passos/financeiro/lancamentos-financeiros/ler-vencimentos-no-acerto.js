// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)
const { lerVencimentos } = require('../../_acerto');

module.exports = {
  // Lê, sem gravar, as parcelas da forma Duplicata no acerto do documento (sai pelo Voltar).
  // args: { id } → [{ parcela: '1/1', duplicata, vencimento: 'dd/mm/aaaa', editavel, linha }]
  async lerVencimentosNoAcerto(t, { id }) {
    return lerVencimentos(t, '/financeiro/lancamento-financeiro/form?id=' + id);
  },
};
