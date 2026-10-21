// Tela: Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)
const { opcoesVisiveis } = require('./_apoio');

module.exports = {
  // Campo autocomplete de fórmula na tela aberta (ex.: input#formulaValorAquisicao no Item/Grupo/Filial).
  // Lista as opções pela seta, lê o link de cadastro rápido, escolhe `escolher` (texto) ou limpa (`limpar: true`).
  // → { rotulo, obrigatorio, opcoes:[...], linkAntes, linkDepois, valor }
  async campo(t, { campo, escolher, limpar }) {
    const { p, tela } = t;
    const inp = p.locator(`input#${campo}`).first();
    await inp.waitFor({ state: 'visible', timeout: 30000 });
    await inp.scrollIntoViewIfNeeded();
    const grupo = inp.locator('xpath=ancestor::div[contains(@class,"form-group")][1]');
    const rotulo = tela.limpo(await grupo.locator('label').first().innerText());
    const obrigatorio = (await grupo.locator('.campo-obrigatorio').count()) > 0 || /\*/.test(rotulo);
    const link = grupo.locator('a.link-cadastroRapido');
    const linkAntes = (await link.count()) ? await link.getAttribute('href') : null;
    await grupo.locator('button.p-autocomplete-dropdown').click(); await tela.pronto(p, 800);
    const opcoes = (await opcoesVisiveis(p).allInnerTexts()).map(tela.limpo);
    await p.keyboard.press('Escape'); await tela.esperar(p, 300);
    if (limpar) { await inp.click(); await inp.fill(''); await p.keyboard.press('Tab'); await tela.pronto(p, 400); }
    else if (escolher) await tela.autocomplete(p, inp, escolher.slice(0, 12), escolher);
    const linkDepois = (await link.count()) ? await link.getAttribute('href') : null;
    return { rotulo, obrigatorio, opcoes, linkAntes, linkDepois, valor: await inp.inputValue() };
  },
};
