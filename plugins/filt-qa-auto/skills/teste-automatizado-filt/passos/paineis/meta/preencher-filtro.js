// Tela: ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard) — filtro lateral já aberto
const { sidebar, lerFiltro } = require('./_apoio');

async function multi(t, s, id, valores) {
  for (const v of valores) await t.tela.autocomplete(t.p, s.locator(`p-autocomplete#${id} input`).first(), v);
}

async function dd(t, s, id, opcao) {
  const { p, tela } = t;
  await s.locator(`p-dropdown#${id} .p-dropdown`).first().click();
  await tela.esperar(p, 500);
  const op = p.locator('li.p-dropdown-item:visible, li[role=option]:visible').filter({ hasText: new RegExp(`^\\s*${opcao}\\s*$`, 'i') }).first();
  if (!(await op.count())) {
    const vistas = (await p.locator('li.p-dropdown-item:visible').allInnerTexts()).map((x) => x.trim());
    throw new Error(`opção "${opcao}" não existe no dropdown ${id} (opções: ${vistas.join(' | ')})`);
  }
  await op.click();
  await tela.pronto(p, 500);
}

module.exports = {
  // args (todos opcionais): { descricao, responsaveis:[], meta:'Selecione'|'Grupo'|'Marca'|'Item', nivel, grupos:[], marcas:[], itens:[],
  //   dataInicial:'dd/mm/aaaa', dataFinal:'dd/mm/aaaa' } → lerFiltro depois de preencher
  async preencherFiltro(t, a = {}) {
    const { p, tela } = t;
    const s = sidebar(p);
    if (a.descricao !== undefined) await tela.digitar(p, s.locator('input#filtro-descricao').first(), a.descricao, { tab: false });
    if (a.responsaveis) await multi(t, s, 'filtro-responsavel', a.responsaveis);
    if (a.meta) await dd(t, s, 'filtro-tipo-meta-item', a.meta);
    if (a.nivel) await dd(t, s, 'filtro-nivel-grupo', a.nivel);
    if (a.grupos) await multi(t, s, 'filtro-grupos', a.grupos);
    if (a.marcas) await multi(t, s, 'filtro-marca', a.marcas);
    if (a.itens) await multi(t, s, 'filtro-item', a.itens);
    // data: digita e sai do campo clicando no rótulo Descrição (como a pessoa faz; o Esc deixava o texto na tela sem valor no modelo)
    const sair = () => s.locator('label', { hasText: 'Descrição' }).first().click().then(() => tela.esperar(p, 500));
    const ordem = a.ordemDatas === 'final-primeiro' ? ['dataFinal', 'dataInicial'] : ['dataInicial', 'dataFinal'];
    for (const k of ordem) {
      if (!a[k]) continue;
      await tela.data(p, s.locator(`p-calendar#${k === 'dataInicial' ? 'filtro-data-inicial' : 'filtro-data-final'} input`).first(), a[k]);
      await sair();
    }
    await tela.pronto(p, 300);
    return lerFiltro(p);
  },
};
