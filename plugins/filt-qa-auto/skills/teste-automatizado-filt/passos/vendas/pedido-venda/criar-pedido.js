// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { situacaoSql, abrirCarrinho, incluirItem } = require('../../_pedido');

module.exports = {
  // Novo pedido completo: condições de venda → itens → (cartão) → Concluir Pedido.
  // args: { natureza, cliente, vendedor?, parametro?, forma, parcelamento?, dataPagamento?, itens:[{item, qtd, casas, desconto?}],
  //         cartao?: { parcelamento: '3X' }, concluir?: true }
  // devolve { pedido, status } (status do banco depois de concluir: APROVADO, ANALISE...)
  async criar(t, a) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/pedido');
    await tela.botao(p, 'Novo', { noDialogo: false });
    const dlg = await tela.dialogo(p);
    await tela.autocompleteRotulo(p, dlg, 'Natureza de operação', a.natureza);
    await tela.autocompleteRotulo(p, dlg, 'Cliente', a.cliente);
    // Vendedor é obrigatório e só vem preenchido quando o usuário logado tem vendedor vinculado
    if (a.vendedor) await tela.autocompleteRotulo(p, dlg, 'Vendedor', a.vendedor);
    // as formas de pagamento podem vir do parâmetro de preço (sem ele a lista fica vazia)
    if (a.parametro) await tela.autocompleteRotulo(p, dlg, 'Parâmetro de preço', a.parametro);
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
    if (a.cartao) await require('./escolher-cartao-de-credito').cartaoCredito(t, a.cartao);
    if (a.concluir !== false) await tela.botao(p, 'Concluir Pedido', { noDialogo: false });
    const s = await t.banco.linha(situacaoSql, [pedido]);
    return { pedido, status: s && s.STATUS_PEDIDO };
  },
};
