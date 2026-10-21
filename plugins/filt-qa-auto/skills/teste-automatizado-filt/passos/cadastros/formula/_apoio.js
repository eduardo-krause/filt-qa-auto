// Tela: Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form) — ajudantes dos cenários desta tela (não é cenário)

const opcoesVisiveis = (p) => p.locator('.p-autocomplete-panel:visible li, li[role=option]:visible');

async function abrirNovo(t, tipo) {
  const { p, tela } = t;
  await tela.abrir(p, '/fiscal/formula');
  await tela.botao(p, 'Novo', { noDialogo: false });
  const dlg = await tela.dialogo(p);
  if (!dlg || !/Selecione o Tipo/.test(await dlg.innerText())) throw new Error('Novo não abriu o modal "Selecione o Tipo"');
  const tipos = (await dlg.locator('p-radiobutton').allInnerTexts()).map(tela.limpo).filter(Boolean);
  if (tipo) {
    await dlg.locator('p-radiobutton').filter({ hasText: new RegExp(`^\\s*${tipo}\\s*$`) }).first().locator('.p-radiobutton-box').click();
    await tela.botao(p, 'Confirmar', { escopo: dlg });
    await tela.pronto(p, 800);
  }
  return tipos;
}

module.exports = { opcoesVisiveis, abrirNovo };
