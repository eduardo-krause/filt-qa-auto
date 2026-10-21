// Tela: Processos › Vendas › Pedido Venda — busca de itens (/vendas/busca) e carrinho (/vendas/carrinho?id=)
// Item DEFENSIVO no pedido web: painel "Adicionar Item ao carrinho" pede "Busca de Receituário Padrão*" (e Equipamento);
// o número de aplicações fica no modal "Defensivo" do carrinho (botão i.vs-task-list-edit-1 da linha).
// Na suíte: await t.passos.vendas['pedido-item-defensivo'].adicionar({...}) e .aplicacoes({...})

async function escolherAutocomplete(t, escopo, rotulo, busca, contem) {
  const { p, tela } = t;
  const inp = escopo.locator(`label:visible:has-text("${rotulo}")`).first().locator('xpath=following::input[1]');
  const ops = p.locator('li.p-autocomplete-item:visible, li[role=option]:visible');
  // a lista às vezes volta vazia na primeira digitação: tenta de novo
  for (let k = 0; k < 3; k++) {
    await inp.click(); await inp.fill(''); await p.keyboard.type(busca, { delay: 60 }); await tela.pronto(p, 1500);
    if (await ops.count()) break;
  }
  const textos = await ops.allInnerTexts();
  const alvo = contem ? ops.filter({ hasText: contem }) : ops;
  if (!(await alvo.count())) throw new Error(`${rotulo}: nenhuma opção com "${contem || busca}". Opções: ${textos.slice(0, 8).join(' | ')}`);
  await alvo.first().click(); await tela.pronto(p, 800);
  return textos;
}

module.exports = {
  // args: { pedido, item, qtd, casas=3, receituario: { busca, contem }, equipamento? } — adiciona o item e confirma o painel
  async adicionar(t, { pedido, item, qtd, casas = 3, receituario, equipamento }) {
    const { p, tela } = t;
    if (!/\/vendas\/busca/.test(p.url())) { await tela.abrir(p, '/vendas/carrinho?id=' + pedido); await tela.botao(p, 'Item', { noDialogo: false }); await tela.pronto(p, 1200); }
    const busca = p.locator('input[placeholder="Pesquise o item"]');
    await busca.click(); await busca.fill(''); await p.keyboard.type(item, { delay: 40 }); await p.keyboard.press('Enter'); await tela.pronto(p, 1500);
    // o card do resultado com o nome do item (a lista pode ainda mostrar o resultado da busca anterior)
    const card = p.locator('div:has(> * input.input-quantidade), div:has(input.input-quantidade)').filter({ hasText: item }).last();
    await card.waitFor({ timeout: 30000 });
    const q = card.locator('input.input-quantidade').first();
    await tela.digitar(p, q, tela.qtd(qtd, casas));
    const lido = Number((await q.inputValue()).replace(/\./g, '').replace(',', '.'));
    if (lido !== qtd) throw new Error(`quantidade do ${item} ficou ${lido} (esperado ${qtd})`);
    await p.getByText('ADICIONAR', { exact: true }).first().click(); await tela.pronto(p, 1500);
    const painel = p.locator('.p-sidebar:visible').filter({ hasText: 'Adicionar Item ao carrinho' }).last();
    await painel.waitFor({ timeout: 15000 });
    if (equipamento) await escolherAutocomplete(t, painel, 'Equipamento de Aplicação', equipamento, equipamento);
    const ops = await escolherAutocomplete(t, painel, 'Busca de Receituário Padrão', receituario.busca, receituario.contem);
    await painel.getByRole('button', { name: /Confirmar/ }).click();
    await painel.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await tela.pronto(p);
    return { opcoesReceituario: ops.slice(0, 5) };
  },

  // args: { pedido, linha (0-based no carrinho), aplicacoes } — abre o modal Defensivo, informa o número de aplicações e confirma.
  // Devolve os campos que o modal mostrou (antes e depois).
  // linha: índice 0-based, ou { item, qtd, dose?, calda? }: acha pela descrição e quantidade e, se houver várias, pela
  // dose/calda que o modal mostra (a ordem do carrinho não é a de inclusão e o receituário não aparece na linha)
  async aplicacoes(t, { pedido, linha, aplicacoes }) {
    const { p, tela } = t;
    if (!/\/vendas\/carrinho/.test(p.url())) { await tela.abrir(p, '/vendas/carrinho?id=' + pedido); await tela.pronto(p, 1200); }
    const linhas = p.locator('tr:has(i.vs-task-list-edit-1)');
    const qtdTela = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    const candidatos = typeof linha === 'number' ? [linhas.nth(linha)] : await (async () => {
      const f = linhas.filter({ hasText: linha.item }).filter({ hasText: qtdTela(linha.qtd) }); const n = await f.count();
      return Array.from({ length: n }, (_, k) => f.nth(k));
    })();
    const num = (v) => Number(String(v || '').replace(/\./g, '').replace(',', '.'));
    for (const tr of candidatos) {
      await tr.scrollIntoViewIfNeeded(); await tr.locator('button:has(i.vs-task-list-edit-1)').click(); await tela.pronto(p, 1500);
      const d = p.locator('.p-dialog:visible').filter({ hasText: 'Defensivo' }).last();
      const ler = () => d.evaluate((el) => [...el.querySelectorAll('label')].map((l) => {
        let c = l.parentElement; for (let i = 0; i < 3 && c && !c.querySelector('input'); i++) c = c.parentElement;
        const i = c && c.querySelector('input'); return [l.textContent.trim(), i ? i.value : ''];
      }).filter(([r]) => /aplica|tratar|dose|calda/i.test(r)));
      const antes = await ler(); const val = (r) => (antes.find(([x]) => x.startsWith(r)) || [])[1];
      const bate = typeof linha === 'number' || ((linha.dose === undefined || num(val('Dose')) === linha.dose) && (linha.calda === undefined || num(val('Calda')) === linha.calda));
      if (!bate) { await d.getByRole('button', { name: 'Cancelar' }).last().click(); await tela.pronto(p, 800); continue; }
      const n = d.locator('label:visible:has-text("Número de aplicações")').first().locator('xpath=following::input[1]');
      await n.click(); await p.keyboard.press('Control+A'); await p.keyboard.type(String(aplicacoes), { delay: 40 }); await p.keyboard.press('Tab'); await tela.pronto(p, 800);
      const depois = await ler();
      await d.getByRole('button', { name: /Confirmar|Salvar/ }).last().click(); await tela.pronto(p, 1200);
      return { antes, depois, toasts: await tela.toasts(p) };
    }
    throw new Error('nenhuma linha do carrinho bate com ' + JSON.stringify(linha));
  },
};
