// Tela: Processos › Financeiro › Consulta DDA — abre a lista de um filtro pela seta (ou digitando) e devolve as opções; fecha sem escolher.
// args: { rotulo: 'Empresa'|'Estabelecimento'|'Pessoa'|'Conta Bancária/Caixa'|'Situação', texto? }
// devolve { opcoes, vazio, controlesDeEdicao, chamadas }
const { grupo, limpo } = require('./_apoio');

module.exports = {
  async opcoesFiltroDda(t, { rotulo, texto }) {
    const { p, tela } = t;
    const g = grupo(p, rotulo);
    const chamadas = [];
    const ouvir = (r) => { if (/\/api\//.test(r.url()) && /complete|contas|pessoa/.test(r.url())) chamadas.push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`); };
    p.on('response', ouvir);
    try {
      if (texto) { await g.locator('input').first().click(); await p.keyboard.type(texto, { delay: 40 }); }
      else if (await g.locator('p-multiselect').count()) await g.locator('.p-multiselect').first().click();
      else await g.locator('.p-autocomplete-dropdown').first().click();
      await tela.pronto(p, 900);
      const opcoes = (await p.locator('.p-autocomplete-panel:visible li, .p-multiselect-panel:visible li.p-multiselect-item').allInnerTexts()).map(limpo).filter(Boolean);
      const vazio = (await p.locator('.p-autocomplete-panel:visible .p-autocomplete-empty-message, .p-multiselect-panel:visible .p-multiselect-empty-message').allInnerTexts()).map(limpo);
      const controlesDeEdicao = await p.locator('.p-multiselect-panel:visible, .p-autocomplete-panel:visible').locator('button, a').filter({ hasText: /adicionar|novo|incluir|editar|excluir/i }).count();
      await p.keyboard.press('Escape'); await tela.pronto(p, 300);
      if (texto) await g.locator('input').first().fill('');
      return { opcoes, vazio, controlesDeEdicao, chamadas };
    } finally { p.off('response', ouvir); }
  },
};
