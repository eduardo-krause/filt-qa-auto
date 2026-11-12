// Tela: Processos › Financeiro › Duplicatas a Receber (/financeiro/duplicata-receber/form?id=N)
const { abrirForm, vencimento } = require('./_apoio');

module.exports = {
  // Abre a duplicata a receber e lê o campo Data de Vencimento. args: { id } → { editavel, vencimento }
  async abrirReceber(t, { id }) {
    await abrirForm(t.p, id);
    const v = await vencimento(t.p);
    return { editavel: v.editavel, vencimento: v.valor };
  },
};
