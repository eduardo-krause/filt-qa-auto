// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  // Salvar do form, juntando avisos.
  async salvar(t) { const r = await observar(t, t.p.getByRole('button', { name: 'Salvar', exact: true }).first(), { minimo: 2500 }); return r; },
};
