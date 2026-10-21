// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

module.exports = {
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
