// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)
const { limpo, observar } = require('../../_comum');

module.exports = {
  // Texto da tela como evidência curta (ex.: conferir uma mensagem que ficou fixa).
  async textoTela(t) { return limpo(await t.p.locator('body').innerText()).slice(0, 2000); },
};
