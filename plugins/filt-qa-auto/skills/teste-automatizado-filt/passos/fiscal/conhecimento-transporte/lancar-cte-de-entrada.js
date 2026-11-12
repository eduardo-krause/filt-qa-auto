// Tela: Movimentações Fiscais › Conhecimento de Transportes (/fiscal/conhecimento-de-transporte)

module.exports = {
  // args: { notas:[NUMERO_DOCUMENTO], pessoa (fornecedor das notas = remetente), emitente, cidade, valor, natureza?,
  //         duplicata?: { conta, parcelamento, vencs? } (acerto em Duplicata; sem ele o acerto é Dinheiro) }
  // → { id } (ID_CONHECIMENTO_TRANSPORTE lido do banco)
  async entrada(t, a) {
    const { p, tela } = t;
    tela.exigirDfe();
    const antes = Number(await t.banco.valor('select coalesce(max(ID_CONHECIMENTO_TRANSPORTE),0) from CONHECIMENTO_TRANSPORTE')) || 0;
    await tela.abrir(p, '/fiscal/conhecimento-de-transporte');
    await tela.botao(p, 'Novo', { noDialogo: false });
    await tela.semLoader(p);
    await tela.autocompleteRotulo(p, p, 'Natureza de Operação', 'CT-E ENTRADA', a.natureza || 'CT-E ENTRADA');
    // documentos
    await tela.botao(p, 'Adicionar Documento', { noDialogo: false });
    const dlg = await tela.dialogo(p);
    await tela.autocompleteRotulo(p, dlg, 'Pessoa', a.pessoa.slice(0, 12), a.pessoa);
    await dlg.locator('button.btn-filtrar-default').click(); await tela.pronto(p, 2000);
    for (const n of a.notas) {
      const row = dlg.locator('tbody tr', { hasText: String(n) }).first();
      if (!(await row.count())) throw new Error(`nota ${n} não aparece em Adicionar Documento`);
      await row.locator('.p-checkbox-box, .p-radiobutton-box').first().click(); await tela.esperar(p, 400);
    }
    await tela.botao(p, 'Finalizar', { escopo: dlg }); await tela.pronto(p, 1500);
    const numero = Number(String(Date.now()).slice(-6));
    await tela.digitar(p, p.locator('input#numeroCte'), String(numero));
    await tela.digitar(p, p.locator('input#serie'), String(a.serie || 712));
    await tela.autocomplete(p, p.locator('input#pessoaEmitente').first(), a.emitente.slice(0, 12), a.emitente);
    await p.locator('#pessoaRemetente button').first().click(); await tela.pronto(p, 1500);
    await p.locator('li[role=option]:visible', { hasText: a.pessoa }).first().click(); await tela.pronto(p, 1200);
    for (const id of ['cidadeColeta', 'cidadeEntrega', 'cidadeServicos']) await tela.autocomplete(p, p.locator(`input#${id}`).first(), a.cidade.slice(0, 12), a.cidade);
    await tela.autocomplete(p, p.locator('input#operacaoFiscal').first(), '1353', '1353');
    await tela.autocomplete(p, p.locator('input#cstIcms').first(), '00', '00');
    const linhaFrete = p.locator('tr', { hasText: 'Frete' }).last();
    await tela.digitar(p, linhaFrete.locator('input').last(), tela.moeda(a.valor));
    let s = await tela.salvar(p);
    if (s.status === 'acerto_financeiro' && a.duplicata) {
      // acerto em Duplicata (gera duplicata a pagar do CT-e): a.duplicata = { conta, parcelamento, vencs? }
      await require('../../financeiro/acerto-financeiro/acertar-em-duplicata').duplicata(t, a.duplicata);
      s = await tela.salvar(p);
    } else if (s.status === 'acerto_financeiro') {
      const d = await tela.dialogo(p);
      await d.locator('text=Dinheiro').first().click(); await tela.pronto(p, 800);
      await d.locator('button:has-text("Salvar")').first().click(); await tela.pronto(p, 800);
      await d.locator('button:has-text("Concluir")').first().click(); await tela.pronto(p, 1500);
      s = await tela.salvar(p);
    }
    const id = await t.banco.valor('select max(ID_CONHECIMENTO_TRANSPORTE) from CONHECIMENTO_TRANSPORTE where ID_CONHECIMENTO_TRANSPORTE > ?', [antes]);
    if (!id) {
      const corpo = tela.limpo(await p.locator('body').innerText()); const i = corpo.indexOf('Campos obrigatórios');
      throw new Error(`CT-e não foi gravado (status ${s.status}; ${[...s.toasts, ...s.dialogos].join(' | ').slice(0, 300)}${i >= 0 ? '; ' + corpo.slice(i, i + 250) : ''})`);
    }
    return { id: Number(id), numero };
  },
};
