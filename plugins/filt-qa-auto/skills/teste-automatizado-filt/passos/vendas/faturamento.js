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
  // o cartão vai para "Cartões Adicionados"; o Salvar da forma leva para o Resumo (Total Pago)
  await dlg.getByRole('button', { name: 'Salvar', exact: true }).first().click(); await tela.pronto(p, 800);
  const resumo = tela.limpo(((await dlg.innerText()).match(/Total Pago[\s\S]{0,60}/) || [''])[0]);
  if (!new RegExp('Total Pago R\$ ' + String(valor.toFixed(2)).replace('.', ',')).test(resumo.replace(/\./g, '').replace(/(\d),(\d{2})/, '$1,$2'))) {
    t.anotar('resumo do acerto com cartão: ' + resumo);
  }
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
    // linhas agrupadas por cliente (recolhidas): o grupo expande pelo link a.mr-2 (ícone ph-caret-right).
    // A ordem aparece como "<ordem> <seq> - <pedido> <data> ..."; no texto da linha o pedido vem colado na data ("0 - 31316/10/2026")
    const reOrdem = new RegExp(`\\d - ${pedido}(\\d{2}/\\d{2}/\\d{4}|\\s*\\d{2}/\\d{2}/|\\D|$)`);
    const linha = p.locator('table tbody tr').filter({ hasText: reOrdem }).last();
    for (let tentativa = 0; tentativa < 3 && !(await linha.count()); tentativa++) {
      const grupo = p.locator('table tbody tr').filter({ hasText: cliente }).first();
      await grupo.waitFor({ timeout: 30000 });
      await grupo.locator('a.mr-2, .expand-icon').first().click(); await tela.pronto(p, 800);
      await linha.waitFor({ timeout: 10000 }).catch(() => {});
    }
    if (!(await linha.count())) throw new Error(`ordem de entrega do pedido ${pedido} não aparece no FATURAMENTO (grupo ${cliente})`);
    await linha.scrollIntoViewIfNeeded(); await linha.locator('.p-checkbox-box').first().click();
    await p.getByText('Faturar', { exact: true }).click(); await tela.pronto(p, 800);
    await tela.botao(p, 'Próximo', { noDialogo: false });
    await tela.pronto(p, 1500);
    // pedido com antecipação: aviso "Existem pedidos com antecipações cadastradas." [Ok] fica por cima do Gerar Nota
    const aviso = p.locator('.p-dialog:visible').filter({ hasText: 'antecipações cadastradas' });
    if (await aviso.count()) { await aviso.last().getByRole('button', { name: 'Ok', exact: true }).click(); await tela.pronto(p, 800); }
    let resumo = '';
    let dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Acerto Financeiro' }).last();
    // na etapa Faturamento o acerto é a seção "Financeiro"; o diálogo "Acerto Financeiro" abre pelo Adicionar dela
    if (cartao && !(await dlg.count())) {
      await p.getByRole('button', { name: 'Adicionar', exact: true }).last().click(); await tela.pronto(p, 800);
      dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Acerto Financeiro' }).last();
      await dlg.waitFor({ timeout: 15000 });
    }
    if (await dlg.count()) {
      if (cartao) await acertoCartao(t, dlg, cartao);
      resumo = tela.limpo(((await dlg.innerText()).match(/Total[\s\S]{0,160}/) || [''])[0]);
      await dlg.getByRole('button', { name: 'Concluir', exact: true }).click({ force: true }); await tela.pronto(p, 1000);
    }
    await tela.botao(p, 'Gerar Nota', { noDialogo: false, qual: 'last' });
    await tela.pronto(p, 2000, { limite: 180000 });
    // a nota nasce no banco antes da transmissão: só segue com a NF-e autorizada (sair da tela antes interrompe o envio)
    let notas = [];
    for (const t0 = Date.now(); Date.now() - t0 < 180000; await p.waitForTimeout(3000)) {
      notas = await nota.doPedido(t, { pedido, desdeId: desde });
      if (notas.length && (await nota.autorizadas(t, notas.map((n) => n.ID_NOTA_FISCAL))) === notas.length) break;
      const erro = (await tela.toasts(p)).find((x) => /erro|rejei|não/i.test(x));
      if (erro && !notas.length) throw new Error('Gerar Nota: ' + erro);
    }
    if (!notas.length) throw new Error('nenhuma nota nova do pedido depois do Gerar Nota (conferir se abriu em outra aba ou deu erro)');
    if ((await nota.autorizadas(t, notas.map((n) => n.ID_NOTA_FISCAL))) < notas.length) {
      throw new Error(`nota ${notas.map((n) => n.NUMERO_DOCUMENTO).join(', ')} criada mas não autorizada em 3 min (avisos: ${(await tela.toasts(p)).join(' | ') || 'nenhum'})`);
    }
    const out = [];
    for (const n of notas) out.push({ id: n.ID_NOTA_FISCAL, numero: n.NUMERO_DOCUMENTO, titulos: await nota.titulos(t, { id: n.ID_NOTA_FISCAL }) });
    return { notas: out, acerto: resumo };
  },
};
