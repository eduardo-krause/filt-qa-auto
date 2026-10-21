// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  async alterarCampo(t, { campo, valor }) {
    const { p, tela } = t;
    const inp = p.locator(`input#${campo}:visible, input[name=${campo}]:visible`).first();
    const antes = await inp.inputValue();
    await tela.digitar(p, inp, String(valor), { tab: true });
    const r = await observar(t, p.getByRole('button', { name: 'Salvar', exact: true }).first(), { minimo: 2500 });
    return { antes, eventos: r.eventos, errosApi: r.errosApi };
  },
};
