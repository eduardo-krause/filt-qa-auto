// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)
// Seções da página: Geral, Preço e custo variáveis (abas VALORES/CUSTOS), Tributação, Dados Adicionais, Estoque...
// Valores somente leitura do card "Preço e custo variáveis": input#valorUnitarioAquisicao, #valorUnitarioAquisicaoMedio.

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

  // Rótulos do card "Preço e custo variáveis" na ordem e estado de campos pedidos pelo id.
  // args: { ids: ['valorUnitarioAquisicao', ...] } → { rotulos:[...], campos: { id: { valor, desabilitado } } }
  async precoCusto(t, { ids = [] }) {
    const { p, tela } = t;
    const card = p.locator('p-accordiontab, p-card, .p-card').filter({ hasText: 'Preço e custo variáveis' }).filter({ has: p.locator('#valorUnitarioAquisicao') }).last();
    const rotulos = (await card.locator('label:visible').allInnerTexts()).map(tela.limpo).filter(Boolean);
    const campos = {};
    for (const id of ids) {
      const e = p.locator(`input#${id}`).first();
      if (!(await e.count())) { campos[id] = null; continue; }
      campos[id] = { valor: await e.inputValue(), desabilitado: await e.isDisabled(), somenteLeitura: await e.evaluate((x) => x.readOnly) };
    }
    return { rotulos, campos };
  },

  // Rótulos do card Estoque (ordem), para conferir a posição de campos.
  async rotulosEstoque(t) {
    const { p, tela } = t;
    const card = p.locator('p-accordiontab, p-card, .p-card').filter({ has: p.locator('#formulaCustoPresente') }).last();
    return (await card.locator('label:visible').allInnerTexts()).map(tela.limpo).filter(Boolean);
  },

  async salvar(t) {
    const { p, tela } = t;
    const s = await tela.salvar(p);
    const d = p.locator('.p-dialog:visible', { hasText: /tabela de pre[cç]o|Validação Descrição/i });
    if (await d.count()) { await d.getByRole('button', { name: 'Cancelar' }).first().click().catch(() => {}); await tela.pronto(p); }
    return s;
  },
};
