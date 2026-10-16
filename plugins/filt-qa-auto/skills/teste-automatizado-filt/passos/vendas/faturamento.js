// Tela: Processos › Vendas › Pedido Venda, aba FATURAMENTO (/vendas/pedido)
// Faturar a ordem de entrega do pedido: Faturar → Próximo → Acerto Financeiro → Gerar Nota.

const nota = require('../fiscal/nota');

// Acerto Financeiro com Cartão de crédito manual (o que vem proposto é trocado pelo cartão informado).
async function acertoCartao(t, dlg, { valor, parcelas = 1, operadora = 'ACCORD', bandeira = 'AMERICAN', contaContabil = 'CARTOES A RECEBER' }) {
  const { p, tela } = t;
  const lixo = dlg.locator('.pi-trash, [class*=trash]');
  if (await lixo.count()) { await lixo.first().click(); await tela.pronto(p); await tela.confirmar(p, ['Sim']); }
  if (!(await dlg.getByText('Cobrança').count())) await tela.clicarTexto(p, 'Cartão', dlg);
  for (const r of ['Manual', 'Crédito', parcelas > 1 ? 'Parcelado' : 'À Vista']) await tela.clicarTexto(p, r, dlg);
  await tela.digitar(p, tela.campo(dlg, 'Valor'), tela.moeda(valor));
  if (parcelas > 1) await tela.digitar(p, tela.campo(dlg, 'Número de Parcelas'), parcelas);
  await tela.autocompleteRotulo(p, dlg, 'Operadora', operadora);
  await tela.autocompleteRotulo(p, dlg, 'Bandeira', bandeira);
  await tela.digitar(p, tela.campo(dlg, 'NSU'), '12345');
  await tela.digitar(p, tela.campo(dlg, 'Código Autorização'), '12345');
  const cc = tela.campo(dlg, 'Conta Contábil');
  if ((await cc.count()) && !(await cc.inputValue())) await tela.autocomplete(p, cc, contaContabil.slice(0, 8), contaContabil);
  await tela.botao(p, 'Adicionar', { escopo: dlg });
}

module.exports = {
  // args: { pedido, cliente, cartao?: { valor, parcelas } }
  //   sem `cartao`: conclui o acerto que o sistema propõe (forma do pedido + adiantamentos reservados).
  // devolve { notas: [{ numero, titulos:[...] }], acerto: texto do resumo do acerto }
  async faturar(t, { pedido, cliente, cartao }) {
    const { p, tela } = t;
    tela.exigirDfe();
    const desde = await nota.ultimoId(t);
    await tela.abrir(p, '/vendas/pedido');
    await p.getByText('FATURAMENTO').first().click(); await tela.pronto(p, 800);
    // a ordem aparece como "<ordem> - <pedido>"; se o cliente estiver recolhido, expande o grupo
    const reOrdem = new RegExp(`\\d - ${pedido}(\\D|$)`);
    if (!(await p.locator('table tbody tr').filter({ hasText: reOrdem }).count())) {
      await p.locator('table tbody tr').filter({ hasText: cliente }).first().locator('button, i').first().click();
      await tela.pronto(p, 600);
    }
    const linha = p.locator('table tbody tr').filter({ hasText: reOrdem }).last();
    if (!(await linha.count())) throw new Error(`ordem de entrega do pedido ${pedido} não aparece no FATURAMENTO`);
    await linha.scrollIntoViewIfNeeded(); await linha.locator('.p-checkbox-box').first().click();
    await p.getByText('Faturar', { exact: true }).click(); await tela.pronto(p, 800);
    await tela.botao(p, 'Próximo', { noDialogo: false });
    await tela.pronto(p, 1500);
    let resumo = '';
    const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Acerto Financeiro' }).last();
    if (await dlg.count()) {
      if (cartao) await acertoCartao(t, dlg, cartao);
      resumo = tela.limpo(((await dlg.innerText()).match(/Total[\s\S]{0,160}/) || [''])[0]);
      await dlg.getByRole('button', { name: 'Concluir', exact: true }).click({ force: true }); await tela.pronto(p, 1000);
    }
    await tela.botao(p, 'Gerar Nota', { noDialogo: false, qual: 'last' });
    await tela.pronto(p, 2000, { limite: 180000 });
    const notas = await nota.doPedido(t, { pedido, desdeId: desde });
    if (!notas.length) throw new Error('nenhuma nota nova do pedido depois do Gerar Nota (conferir se abriu em outra aba ou deu erro)');
    const out = [];
    for (const n of notas) out.push({ numero: n.NUMERO_DOCUMENTO, titulos: await nota.titulos(t, { numero: n.NUMERO_DOCUMENTO }) });
    return { notas: out, acerto: resumo };
  },
};
