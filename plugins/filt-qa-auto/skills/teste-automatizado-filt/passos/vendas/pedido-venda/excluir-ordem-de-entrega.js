// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { abrirCarrinho } = require('../../_pedido');

module.exports = {
  // Seção Ordem de Entrega do carrinho: ícone "Menu" (ph-dots-three-outline-vertical) da linha › Excluir → confirmação "Excluir".
  // Só aparece para ordem sem nota. linha = posição na tabela de ordens (padrão: a última).
  // args: { pedido, ordem?: ID_PEDIDO_SOLICITACAO_ENTREGA (para conferir), linha? } → { opcoes, toasts, dialogos, excluiu }
  async excluirOrdem(t, { pedido, ordem, linha }) {
    const { p, tela } = t;
    await abrirCarrinho(t, pedido);
    const secao = p.locator('form#formEntrega');
    const linhas = secao.locator('tr.table-body-line');
    await linhas.first().waitFor({ timeout: 30000 });
    const n = await linhas.count();
    const tr = linhas.nth(linha === undefined ? n - 1 : linha);
    await tr.locator('.ph-dots-three-outline-vertical').first().click(); await tela.pronto(p, 500);
    const itens = p.locator('.mat-mdc-menu-panel button, .mat-menu-panel button, [role=menuitem]');
    const opcoes = (await itens.allInnerTexts()).map(tela.limpo).filter(Boolean);
    const ex = itens.filter({ hasText: /^\s*Excluir\s*$/ }).first();
    if (!(await ex.count())) { await p.keyboard.press('Escape'); throw new Error('opção Excluir não está no menu da ordem (tem: ' + opcoes.join(' | ') + ')'); }
    await ex.click(); await tela.pronto(p, 500);
    const dialogos = await tela.textoDialogos(p);
    await tela.confirmar(p, ['Excluir', 'Sim']); await tela.pronto(p, 1500);
    const toasts = await tela.toasts(p);
    const excluiu = ordem ? !Number(await t.banco.valor('select count(*) from PEDIDO_SOLICITACAO_ENTREGA where ID_PEDIDO_SOLICITACAO_ENTREGA = ?', [ordem])) : null;
    return { opcoes, toasts, dialogos, excluiu };
  },
};
