// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — seção Pessoa, campo "Regime Tributário" (p-dropdown#regimeTributario)
const { limpo } = require('../../_comum');

module.exports = {
  // Abre o dropdown "Regime Tributário" pelo clique e escolhe a opção pedida (ou a primeira depois de "Selecione").
  // Só pelo mouse: se o clique não trocar o valor, devolve via 'falhou' e anota ATENÇÃO (não contorna pelo teclado).
  // args: { opcao?: 'Simples Nacional' }  devolve { antes, opcoes, escolhida, valor, via }
  async escolherRegimeTributario(t, { opcao }) {
    const { p, tela } = t;
    const d = p.locator('p-dropdown#regimeTributario .p-dropdown').first();
    if (!(await d.count())) throw new Error('campo "Regime Tributário" não encontrado');
    const valor = async () => limpo(await d.locator('.p-dropdown-label').innerText().catch(() => ''));
    const r = { antes: await valor() };
    await d.scrollIntoViewIfNeeded(); await d.click(); await tela.pronto(p, 500);
    const ops = p.locator('li.p-dropdown-item:visible, li[role=option]:visible');
    r.opcoes = (await ops.allInnerTexts()).map(limpo);
    const i = opcao ? r.opcoes.findIndex((o) => o === opcao) : r.opcoes.findIndex((o) => o && !/^Selecione$/i.test(o));
    if (i < 0) { await p.keyboard.press('Escape'); throw new Error(`opção "${opcao || '(primeira)'}" não está no Regime Tributário (tem: ${r.opcoes.join(' | ')})`); }
    await ops.nth(i).click(); await tela.pronto(p, 300);
    r.escolhida = r.opcoes[i]; r.valor = await valor();
    r.via = r.valor === r.escolhida ? 'mouse' : 'falhou';
    if (r.via !== 'mouse') t.anotar(`ATENÇÃO: o clique em "${r.escolhida}" não trocou o Regime Tributário (ficou "${r.valor}")`);
    return r;
  },
};
