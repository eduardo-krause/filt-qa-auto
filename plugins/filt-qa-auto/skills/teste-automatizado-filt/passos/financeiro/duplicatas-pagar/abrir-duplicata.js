// Tela: Processos › Financeiro › Duplicatas a Pagar (/financeiro/duplicata-pagar/form?id=N)
const { abrirForm, vencimento, lerCampos } = require('./_apoio');

module.exports = {
  // Abre a duplicata e lê o campo Data de Vencimento. args: { id } → { editavel, vencimento, campos: {Pessoa, 'Data de Emissão', ...} }
  async abrir(t, { id }) {
    const { p } = t;
    await abrirForm(p, id);
    const v = await vencimento(p);
    return { editavel: v.editavel, vencimento: v.valor, campos: await lerCampos(p) };
  },
};
