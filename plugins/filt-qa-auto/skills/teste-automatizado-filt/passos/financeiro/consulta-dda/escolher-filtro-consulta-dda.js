// Tela: Processos › Financeiro › Consulta DDA — escolhe (ou remove) uma opção de filtro multiselect/autocomplete.
// args: { rotulo, opcao: 'trecho do texto', remover?: true, texto?: 'digitar para buscar' }  devolve o estado dos filtros
const { grupo, estadoFiltros, limpo } = require('./_apoio');

module.exports = {
  async escolherFiltroDda(t, { rotulo, opcao, remover = false, texto }) {
    const { p, tela } = t;
    const g = grupo(p, rotulo);
    if (remover) {
      const tok = g.locator('.p-autocomplete-token, .p-multiselect-token').filter({ hasText: opcao }).first();
      if (!(await tok.count())) throw new Error(`"${opcao}" não está selecionado em ${rotulo}`);
      await tok.locator('.p-autocomplete-token-icon, .p-multiselect-token-icon, .pi-times, .pi-times-circle').first().click();
      await tela.pronto(p, 600);
      return estadoFiltros(p);
    }
    if (texto) { await g.locator('input').first().click(); await p.keyboard.type(texto, { delay: 40 }); }
    else if (await g.locator('p-multiselect').count()) await g.locator('.p-multiselect').first().click();
    else await g.locator('.p-autocomplete-dropdown').first().click();
    await tela.pronto(p, 900);
    const ops = p.locator('.p-autocomplete-panel:visible li, .p-multiselect-panel:visible li.p-multiselect-item');
    const textos = (await ops.allInnerTexts()).map(limpo);
    const i = textos.findIndex((x) => x.includes(opcao));
    if (i < 0) { await p.keyboard.press('Escape'); throw new Error(`opção "${opcao}" não está em ${rotulo} (tem: ${textos.join(' | ') || 'nenhuma'})`); }
    await ops.nth(i).click(); await tela.pronto(p, 600);
    if (await p.locator('.p-multiselect-panel:visible').count()) { await p.keyboard.press('Escape'); await tela.pronto(p, 300); }
    return estadoFiltros(p);
  },
};
