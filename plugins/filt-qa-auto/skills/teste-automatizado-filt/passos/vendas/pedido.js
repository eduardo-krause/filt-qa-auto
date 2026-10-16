// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
// Cada função recebe (t, args). Na suíte: await t.passos.vendas.pedido.criar({...})
//
// Quantidades: informe `casas` = casas decimais da unidade do item (ex.: CORDA = 3), porque o campo tem máscara.

const situacaoSql = 'select ID_PEDIDO, STATUS_PEDIDO, PAGO, VALOR_TOTAL_CONTABIL from PEDIDO where ID_PEDIDO = ?';

// Sempre recarrega o carrinho: depois de outra aba (GERAR NOTA) ou de outra tela, a página aberta pode estar desatualizada.
async function abrirCarrinho(t, pedido) { await t.tela.abrir(t.p, '/vendas/carrinho?id=' + pedido); }

// Pesquisa o item na tela de busca, informa a quantidade e ADICIONAR (+ desconto unitário opcional) → volta ao Carrinho.
async function incluirItem(t, { item, qtd, casas = 0, desconto }) {
  const { p, tela } = t;
  const busca = p.locator('input[placeholder="Pesquise o item"]');
  await busca.waitFor({ timeout: 60000 });
  await busca.click(); await busca.fill(''); await p.keyboard.type(item, { delay: 40 }); await p.keyboard.press('Enter');
  await tela.pronto(p, 800);
  const q = p.locator('input.input-quantidade').first();
  await q.waitFor({ timeout: 30000 });
  await tela.digitar(p, q, tela.qtd(qtd, casas));
  await p.getByText('ADICIONAR', { exact: true }).first().click();
  await tela.pronto(p, 800);
  // ADICIONAR abre o painel lateral "Adicionar Item ao carrinho" (desconto unitário + Confirmar).
  // Tudo DENTRO do painel: na página há outros "Confirmar" escondidos (diálogo de condições de venda).
  const painel = p.locator('.p-sidebar:visible').filter({ hasText: 'Adicionar Item ao carrinho' }).last();
  await painel.waitFor({ timeout: 15000 }).catch(() => {});
  if (await painel.count()) {
    if (desconto) {
      // "Desconto Unitário" em R$ = input#valorDesconto2 (máscara com 5 casas)
      await tela.digitar(p, painel.locator('input#valorDesconto2'), tela.moeda(desconto, 5));
      await tela.pronto(p, 500);
    }
    await painel.getByRole('button', { name: /Confirmar/ }).click();
    await painel.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await tela.pronto(p);
  } else if (desconto) throw new Error('o painel "Adicionar Item ao carrinho" não abriu — não deu para informar o desconto');
}

module.exports = {
  // Novo pedido completo: condições de venda → itens → (cartão) → Concluir Pedido.
  // args: { natureza, cliente, forma, parcelamento?, dataPagamento?, itens:[{item, qtd, casas, desconto?}],
  //         cartao?: { parcelamento: '3X' }, concluir?: true }
  // devolve { pedido, status } (status do banco depois de concluir: APROVADO, ANALISE...)
  async criar(t, a) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/pedido');
    await tela.botao(p, 'Novo', { noDialogo: false });
    const dlg = await tela.dialogo(p);
    await tela.autocompleteRotulo(p, dlg, 'Natureza de operação', a.natureza);
    await tela.autocompleteRotulo(p, dlg, 'Cliente', a.cliente);
    await tela.autocompleteRotulo(p, dlg, 'Forma de pagamento', a.forma);
    if (a.parcelamento) await tela.autocomplete(p, p.locator('input#formaParcelamento'), a.parcelamento);
    await p.keyboard.press('Escape');
    // Data pagamento é obrigatória mesmo à vista (padrão: hoje)
    await tela.data(p, p.locator('input#dataPagamento'), a.dataPagamento || t.hoje());
    await tela.botao(p, 'Confirmar', { escopo: dlg });
    // o Filt troca de tela sem recarregar a página: espera a URL ganhar o id do pedido
    await p.waitForFunction(() => /[?&]id=\d+/.test(location.href), null, { timeout: 60000 }).catch(async () => {
      throw new Error('pedido não foi criado após Confirmar as condições de venda: ' + (await tela.textoDialogos(p)).join(' | '));
    });
    const pedido = Number(new URL(p.url()).searchParams.get('id'));
    t.guardar('pedido', pedido);
    for (const it of a.itens || []) await incluirItem(t, it);
    await tela.botao(p, 'Carrinho', { noDialogo: false });
    if (a.cartao) await module.exports.cartaoCredito(t, a.cartao);
    if (a.concluir !== false) await tela.botao(p, 'Concluir Pedido', { noDialogo: false });
    const s = await t.banco.linha(situacaoSql, [pedido]);
    return { pedido, status: s && s.STATUS_PEDIDO };
  },

  // Carrinho com forma Cartão: marca Crédito e escolhe a Forma Parcelamento. args: { parcelamento: '3X' }
  async cartaoCredito(t, { parcelamento }) {
    const { p, tela } = t;
    await p.locator('label:has-text("Crédito")').first().click(); await tela.pronto(p);
    await tela.autocomplete(p, tela.campo(p, 'Forma Parcelamento'), parcelamento);
  },

  // Concluir Pedido no carrinho aberto (novo ou em edição). Devolve os avisos (toasts).
  async concluir(t, { pedido } = {}) {
    if (pedido) await abrirCarrinho(t, pedido);
    await t.tela.botao(t.p, 'Concluir Pedido', { noDialogo: false });
    return t.tela.toasts(t.p);
  },

  // Ordem de entrega: quantidades por linha do carrinho (ex.: [2] = 2 un na 1ª linha). args: { pedido, quantidades:[2], casas }
  async ordemEntrega(t, { pedido, quantidades, casas = 0 }) {
    const { p, tela } = t;
    await abrirCarrinho(t, pedido);
    await tela.botao(p, 'Adicionar', { noDialogo: false, qual: 0 });
    for (let k = 0; k < quantidades.length; k++) if (quantidades[k]) await tela.digitar(p, p.locator('#quantidadeEntrega-' + k), tela.qtd(quantidades[k], casas));
    await tela.botao(p, 'Adicionar', { noDialogo: false, qual: 1 });
    return tela.toasts(p);
  },

  // Entra na edição do pedido (Editar → Sim). Pedido parcialmente entregue abre a "edição parcial".
  async editar(t, { pedido }) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/carrinho?id=' + pedido);
    await tela.fecharToasts(p);
    await tela.botao(p, 'Editar', { noDialogo: false });
    await tela.confirmar(p, ['Sim']);
  },

  // Em edição: inclui mais um item (botão Item → busca → ADICIONAR → Carrinho). args: { item, qtd, casas, desconto? }
  async adicionarItem(t, a) {
    const { p, tela } = t;
    await tela.botao(p, 'Item', { noDialogo: false });
    await incluirItem(t, a);
    await tela.botao(p, 'Carrinho', { noDialogo: false });
  },

  // Em edição: remove a ÚLTIMA linha do carrinho que contém `texto` (ex.: "CORDA 1,000") e confirma Excluir.
  // Na edição parcial a linha nova aparece "8 CORDA 1,000 - R$ 100,00" ("-" = nada entregue); sem faturamento, "CORDA 1,000 R$ ...".
  async removerItem(t, { texto }) {
    const { p, tela } = t;
    const ok = await p.evaluate((x) => { const trs = [...document.querySelectorAll('tr')].filter((e) => e.innerText.replace(/\s+/g, ' ').includes(x) && e.querySelector('a[data-title=Remover], [title="Remover"], [title="Remover Item"]')); const tr = trs[trs.length - 1]; const a = tr && tr.querySelector('a[data-title=Remover], [title="Remover"], [title="Remover Item"]'); if (a) a.click(); return !!a; }, texto);
    if (!ok) throw new Error(`linha com "${texto}" não encontrada no carrinho`);
    await tela.pronto(p);
    await tela.confirmar(p, ['Excluir', 'Sim']);
  },

  // Em edição: escreve a observação do pedido (textarea#observacoesPedido).
  async observacao(t, { texto }) {
    const c = t.p.locator('textarea#observacoesPedido');
    await c.scrollIntoViewIfNeeded(); await c.fill(texto); await c.dispatchEvent('input'); await c.dispatchEvent('blur');
    await t.tela.pronto(t.p);
  },

  // Menu ⋮ → Alterar Validade do Pedido → data → Confirmar. Devolve se o diálogo continuou aberto depois do Confirmar.
  // args: { pedido?, data: 'dd/mm/aaaa' }  (se `pedido` vier, abre o carrinho; para o pedido em edição, não passe)
  async alterarValidade(t, { pedido, data }) {
    const { p, tela } = t;
    if (pedido) await abrirCarrinho(t, pedido);
    await tela.menuKebab(p, /Alterar Validade/);
    const dlg = await tela.dialogo(p);
    await tela.data(p, dlg.locator('input').first(), data);
    await tela.botao(p, 'Confirmar', { escopo: dlg });
    const aberto = !!(await p.locator('.p-dialog:visible').filter({ hasText: /Validade/ }).count());
    const toasts = await tela.toasts(p);
    if (aberto) await tela.botao(p, 'Cancelar', { escopo: await tela.dialogo(p) }).catch(() => {});
    return { dialogoContinuouAberto: aberto, toasts };
  },

  // Menu ⋮ → Cancelar: cancela quantidades por linha ou "Cancelar Todos". args: { pedido, qtds?:[1], casas, todos?:false, motivo? }
  async cancelar(t, { pedido, qtds = [], casas = 0, todos = false, motivo = 'TESTE AUTOMATIZADO' }) {
    const { p, tela } = t;
    await abrirCarrinho(t, pedido);
    await tela.menuKebab(p, 'Cancelar');
    const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Cancelamento Pedido' }).last();
    await dlg.waitFor({ timeout: 15000 });
    const m = dlg.locator('textarea').first(); await m.click(); await p.keyboard.type(motivo, { delay: 15 });
    // o nome acessível do botão inclui o ícone: procurar pelo texto
    if (todos) { await dlg.getByRole('button', { name: /Cancelar Todos/ }).click(); await tela.pronto(p); }
    else {
      const inps = dlg.locator('tbody input');
      for (let k = 0; k < qtds.length; k++) if (qtds[k]) await tela.digitar(p, inps.nth(k), tela.qtd(qtds[k], casas));
      await tela.botao(p, 'Processar', { escopo: dlg });
    }
    await tela.confirmar(p, ['Sim', 'Confirmar']);
    return tela.toasts(p);
  },

  // Venda futura: GERAR NOTA no carrinho abre a nota em outra aba; conclui o acerto proposto, salva e fecha a aba.
  // args: { pedido }  devolve { toasts, dialogos }
  async gerarNotaVendaFutura(t, { pedido }) {
    const { p, tela } = t;
    tela.exigirDfe();
    await tela.abrir(p, '/vendas/carrinho?id=' + pedido);
    const nova = p.context().waitForEvent('page', { timeout: 60000 });
    nova.catch(() => {});   // se o clique falhar antes, a espera não pode derrubar o motor
    await tela.botao(p, 'GERAR NOTA', { noDialogo: false });
    const q = await nova.catch(() => { throw new Error('GERAR NOTA não abriu a nota em outra aba em 60 s'); });
    await q.waitForLoadState('domcontentloaded');
    require('../../motor/lib/rede').instalar(q);
    try {
      await tela.pronto(q, 1500);
      // a nota abre já preenchida: mesmo passo de "salvar nota aberta", rodando na aba nova
      return await require('../fiscal/nota').salvarAberta({ ...t, p: q }, {});
    } finally { await q.close().catch(() => {}); await p.bringToFront(); }
  },

  // Situação no banco: { ID_PEDIDO, STATUS_PEDIDO, PAGO (0/1), VALOR_TOTAL_CONTABIL }
  async situacao(t, { pedido }) { return t.banco.linha(situacaoSql, [pedido]); },

  // Confere a situação no banco. args: { pedido, PAGO?, STATUS_PEDIDO?, VALOR_TOTAL_CONTABIL?, quando: 'após o vínculo' }
  async confere(t, { pedido, quando = '', ...esperado }) {
    const s = await t.banco.linha(situacaoSql, [pedido]);
    const obtido = s ? Object.fromEntries(Object.keys(esperado).map((k) => [k, s[k]])) : null;
    return t.confere(`pedido ${pedido}${quando ? ' ' + quando : ''}`, obtido, esperado);
  },
};
