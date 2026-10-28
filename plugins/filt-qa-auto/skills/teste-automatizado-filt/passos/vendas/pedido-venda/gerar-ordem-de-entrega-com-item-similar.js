// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { abrirCarrinho } = require('../../_pedido');

// Junta os toasts que aparecem (alguns somem em ~3 s) num array da página — só observa, não age na tela.
async function vigiarToasts(p) {
  await p.evaluate(() => {
    if (window.__vigiaToasts) return;
    window.__toastsVistos = [];
    const ver = () => document.querySelectorAll('.p-toast-message').forEach((m) => {
      const s = m.innerText.replace(/\s+/g, ' ').trim();
      if (s && !m.__visto) { m.__visto = true; window.__toastsVistos.push(s); }
    });
    window.__vigiaToasts = new MutationObserver(ver); window.__vigiaToasts.observe(document.body, { childList: true, subtree: true }); ver();
  });
}
const lerToasts = async (p) => p.evaluate(() => { const r = window.__toastsVistos || []; window.__toastsVistos = []; return r; });

module.exports = {
  // Ordem de entrega trocando o item do pedido por um item SIMILAR: carrinho › Adicionar (seção Ordem de Entrega) → no diálogo
  // "Ordem de Entrega", seta da linha do item do pedido (i.vs-arrow-right-1, pRowToggler) abre a sub-tabela "Item Similar"
  // (outro app-ordem-entrega-list dentro da expansão) → Qtd a Entregar do similar (input quantidadeEntrega-<n> da sub-tabela,
  // máscara com as casas da unidade do SIMILAR) → Tab → Adicionar do diálogo.
  // `qtds` = tentativas no MESMO diálogo (ex.: [10, 5]: digita 10, tenta Adicionar; se não salvar, troca para 5 e tenta de novo).
  // `qtdOriginal` (opcional) = quantidade do próprio item do pedido na mesma ordem.
  // args: { pedido, itemPedido: descrição da linha do pedido, similar: descrição do similar, qtds: [5], qtdOriginal?, adicionar = true }
  // → { tentativas: [{ qtd, campoDepois, toastsQtd, botaoHabilitado, toastsAdicionar, salvou }], salvou, ordem (ID_PEDIDO_SOLICITACAO_ENTREGA),
  //     linhaSimilar (texto da linha do similar ao abrir), linhaPedido (texto da linha do item do pedido no fim) }
  async ordemSimilar(t, { pedido, itemPedido, similar, qtds, qtdOriginal, adicionar = true }) {
    const { p, tela } = t;
    const casasDe = async (desc) => Number(await t.banco.valor(`select u.DECIMAIS from ITEM i join VIASOFT.UNIDADE_MEDIDA u on u.ID_UNIDADE_MEDIDA = i.ID_UNIDADE_MEDIDA
      where i.DESCRICAO = ? order by i.ID_ITEM desc limit 1`, [desc])) || 0;
    const casasSim = await casasDe(similar); const casasOri = await casasDe(itemPedido);
    const ordensAntes = Number(await t.banco.valor('select coalesce(max(ID_PEDIDO_SOLICITACAO_ENTREGA),0) from PEDIDO_SOLICITACAO_ENTREGA where ID_PEDIDO = ?', [pedido]));
    await abrirCarrinho(t, pedido);
    await vigiarToasts(p);
    // o botão da seção chega com o texto depois de uma chamada assíncrona
    const secao = p.locator('button.btn-label-vs-form-section').filter({ hasText: 'Adicionar' }).first();
    await secao.waitFor({ timeout: 30000 }).catch(() => {});
    if (!(await secao.count())) throw new Error('botão "Adicionar" da Ordem de Entrega não apareceu (botões: ' + (await p.locator('button.btn-label-vs-form-section').allInnerTexts()).join(' | ') + ')');
    await secao.click(); await tela.pronto(p, 800);
    const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Ordem de Entrega' }).last();
    await dlg.waitFor({ timeout: 20000 });
    const principal = dlg.locator('app-ordem-entrega-list').first();
    const linhaPed = principal.locator('tr.table-body-line').filter({ hasText: itemPedido }).first();
    await linhaPed.waitFor({ timeout: 20000 });
    if (qtdOriginal !== undefined) {
      await tela.digitar(p, linhaPed.locator('input[id^=quantidadeEntrega-]').first(), tela.qtd(qtdOriginal, casasOri)); await tela.pronto(p, 1000);
    }
    await linhaPed.locator('i.vs-arrow-right-1, i[class*=arrow-right]').first().click(); await tela.pronto(p, 1000);
    const sub = principal.locator('app-ordem-entrega-list').first();
    await sub.waitFor({ timeout: 20000 }).catch(() => {});
    const linhaSim = sub.locator('tr.table-body-line').filter({ hasText: similar }).first();
    if (!(await linhaSim.count())) {
      throw new Error(`similar "${similar}" não aparece na expansão do item "${itemPedido}" (sub-tabela: ${tela.limpo(await sub.innerText().catch(() => '')).slice(0, 300) || 'não abriu'})`);
    }
    const linhaSimilar = tela.limpo(await linhaSim.innerText());
    const inp = linhaSim.locator('input[id^=quantidadeEntrega-]').first();
    const btn = dlg.locator('.p-dialog-footer button, p-footer button').filter({ hasText: /^\s*(Adicionar|Salvar)\s*$/ }).first();
    const tentativas = []; let salvou = false;
    await lerToasts(p);
    for (const q of qtds) {
      const r = { qtd: q };
      if (await inp.isDisabled()) { r.erro = 'campo Qtd a Entregar do similar desabilitado'; tentativas.push(r); break; }
      await tela.digitar(p, inp, tela.qtd(q, casasSim)); await tela.pronto(p, 1200);
      r.campoDepois = await inp.inputValue();
      r.toastsQtd = await lerToasts(p);
      r.botaoHabilitado = await btn.isEnabled();
      if (adicionar && r.botaoHabilitado) {
        await btn.click(); await tela.pronto(p, 1500);
        r.toastsAdicionar = await lerToasts(p);
        r.dialogoAberto = await dlg.isVisible().catch(() => false);
        r.salvou = Number(await t.banco.valor('select coalesce(max(ID_PEDIDO_SOLICITACAO_ENTREGA),0) from PEDIDO_SOLICITACAO_ENTREGA where ID_PEDIDO = ?', [pedido])) > ordensAntes;
        r.toastsAdicionar.push(...(await lerToasts(p)));
      }
      tentativas.push(r);
      if (r.salvou) { salvou = true; break; }
    }
    const linhaPedido = (await linhaPed.isVisible().catch(() => false)) ? tela.limpo(await linhaPed.innerText()) : null;
    const ordem = salvou ? Number(await t.banco.valor('select max(ID_PEDIDO_SOLICITACAO_ENTREGA) from PEDIDO_SOLICITACAO_ENTREGA where ID_PEDIDO = ?', [pedido])) : null;
    // diálogo que ficou aberto (não salvou) é fechado pelo Cancelar para não atrapalhar o próximo passo
    if (await dlg.isVisible().catch(() => false)) { await dlg.locator('.p-dialog-footer button, p-footer button').filter({ hasText: 'Cancelar' }).first().click().catch(() => {}); await tela.pronto(p, 500); }
    return { tentativas, salvou, ordem, linhaSimilar, linhaPedido };
  },
};
