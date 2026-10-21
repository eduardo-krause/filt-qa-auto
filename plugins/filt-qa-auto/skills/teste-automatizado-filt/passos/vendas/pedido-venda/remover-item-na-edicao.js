// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

module.exports = {
  // Em edição: remove a ÚLTIMA linha do carrinho que contém `texto` (ex.: "CORDA 1,000") e confirma Excluir.
  // Na edição parcial a linha nova aparece "8 CORDA 1,000 - R$ 100,00" ("-" = nada entregue); sem faturamento, "CORDA 1,000 R$ ...".
  async removerItem(t, { texto }) {
    const { p, tela } = t;
    const ok = await p.evaluate((x) => { const trs = [...document.querySelectorAll('tr')].filter((e) => e.innerText.replace(/\s+/g, ' ').includes(x) && e.querySelector('a[data-title=Remover], [title="Remover"], [title="Remover Item"]')); const tr = trs[trs.length - 1]; const a = tr && tr.querySelector('a[data-title=Remover], [title="Remover"], [title="Remover Item"]'); if (a) a.click(); return !!a; }, texto);
    if (!ok) throw new Error(`linha com "${texto}" não encontrada no carrinho`);
    await tela.pronto(p);
    await tela.confirmar(p, ['Excluir', 'Sim']);
  },
};
