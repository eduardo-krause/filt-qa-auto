// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — aba Geral de um complemento (p-tabview#dadosAdicionais-N)
const ap = require('./_apoio');

module.exports = {
  // Digita (ou limpa, com fantasia '') o campo "Fantasia" do complemento de índice N (0 = primeiro card).
  // args: { complemento: 0, fantasia: 'TEXTO' }  devolve { antes, valor }
  async informarFantasiaDoComplemento(t, { complemento = 0, fantasia = '' }) {
    const { p, tela } = t;
    const tv = p.locator('p-tabview[id^="dadosAdicionais-"]').nth(complemento);
    if (!(await tv.count())) throw new Error(`complemento ${complemento} não existe no cadastro`);
    await tv.locator('.p-tabview-nav li').filter({ hasText: /^\s*Geral\s*$/i }).first().click(); await p.waitForTimeout(300);
    const painel = tv.locator('.p-tabview-panel:not([hidden])').first();
    const lab = painel.locator('label:visible').filter({ hasText: /^\s*Fantasia\s*\*?\s*$/ }).first();
    if (!(await lab.count())) throw new Error(`campo "Fantasia" não encontrado no complemento ${complemento}`);
    const id = await lab.getAttribute('for');
    const inp = id ? painel.locator(`[id="${id}"]`).first() : lab.locator('xpath=following::input[1]');
    const r = { antes: await inp.inputValue() };
    if (fantasia) await tela.digitar(p, inp, fantasia);
    else { await inp.click(); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await p.keyboard.press('Tab'); await p.waitForTimeout(300); }
    r.valor = await inp.inputValue();
    return r;
  },
};
