// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  async abrir(t, { id }) { await t.tela.abrir(t.p, '/fiscal/configuracao-portador/form?id=' + id); return limpo(await t.p.locator('h1, h2, .titulo').first().innerText().catch(() => '')); },

  // Estado de um dropdown do form (abre, lê as opções e fecha). args: { rotulo }  devolve { valor, opcoes },
};
