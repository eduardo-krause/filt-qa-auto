// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  async dropdownEstado(t, { rotulo }) {
    const { p, tela } = t;
    const lab = p.locator('label:visible').filter({ hasText: new RegExp(`^\\s*${rotulo}\\s*\\*?\\s*$`, 'i') }).first();
    if (!(await lab.count())) return { valor: null, opcoes: [], visivel: false };
    const d = lab.locator('xpath=ancestor::*[.//p-dropdown][1]').locator('.p-dropdown').first();
    const valor = limpo(await d.locator('.p-dropdown-label').innerText());
    let opcoes = [];
    for (let i = 0; i < 3 && !opcoes.length; i++) { await d.click(); await tela.pronto(p, 600); opcoes = (await p.locator('.p-dropdown-panel:visible li[role=option]').allInnerTexts()).map(limpo); }
    await p.keyboard.press('Escape'); await tela.pronto(p, 300);
    return { valor, opcoes, visivel: true };
  },
};
