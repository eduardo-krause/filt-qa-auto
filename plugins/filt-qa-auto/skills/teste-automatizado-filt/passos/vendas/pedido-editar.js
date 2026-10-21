// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=) — EDIÇÃO do pedido: entrar em edição, incluir/remover item, observação, validade
// Quantidades: informe `casas` = casas decimais da unidade do item (o campo tem máscara).
const { situacaoSql, abrirCarrinho, incluirItem } = require('../_pedido');

module.exports = {
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
};
