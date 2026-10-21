// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

module.exports = {
  // Abre o item (form?id=ID_ITEM_FILIAL) ou um item novo (novo: true).
  async abrir(t, { id, novo }) {
    const { p, tela } = t;
    if (novo) { await tela.abrir(p, '/fiscal/item'); await tela.botao(p, 'Novo', { noDialogo: false }); }
    else await tela.abrir(p, '/fiscal/item/form?id=' + id);
    await tela.pronto(p, 1000);
    // o loader da página às vezes fica travado por cima do form (cliques não passam): recarrega uma vez e ANOTA
    if (!(await tela.semLoader(p))) {
      t.anotar(`ATENÇÃO: loader da tela travado ao abrir ${novo ? 'item novo' : 'o item ' + id} (APIs 200; console "Cannot set properties of undefined (setting 'selectedTabIndex')") — automação recarregou a página`);
      await p.reload(); await tela.pronto(p, 1000);
      if (!(await tela.semLoader(p))) throw new Error('loader da tela do item continua travado depois de recarregar');
    }
    const tut = p.locator('.p-dialog:visible', { hasText: 'seja bem-vindo' });
    if (await tut.count()) { await tut.locator('button').first().click().catch(() => {}); await tela.pronto(p); }
  },
};
