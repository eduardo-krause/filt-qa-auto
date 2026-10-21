// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal) — nota própria com DOCUMENTO REFERENCIADO (devolução, remessa de venda futura...)
// Emitir só com o DF-e do AT em homologação (o motor confere no início; tela.salvar trava se não conferiu).

module.exports = {
  // Nota própria com documento referenciado (devolução de venda futura, remessa, devolução de remessa...).
  // args: { natureza, pessoa, numeroRef, itens:[{ texto: 'CORDA', qtd: '3000' }], acerto?: 'Duplicata' }
  //   qtd do item vai como a tela espera ("Quantidade a Baixar", com a máscara: 3 un com 3 casas = "3000")
  async comReferencia(t, a) {
    const { p, tela } = t;
    tela.exigirDfe();
    await tela.abrir(p, '/nota/nota-fiscal');
    await tela.botao(p, 'Novo', { noDialogo: false, qual: 0 });
    await tela.autocompleteRotulo(p, p, 'Natureza de Operação', a.natureza.slice(0, 12), a.natureza);
    // ao escolher a natureza abre "Documentos Referenciados": Pessoa + Número → Pesquisar → nota → Próximo → itens → Finalizar
    let dlg = await tela.dialogo(p);
    if (!dlg || !/Documentos Referenciados/.test(await dlg.innerText())) { await tela.botao(p, 'Adicionar Documento', { noDialogo: false }); dlg = await tela.dialogo(p); }
    await tela.autocompleteRotulo(p, dlg, 'Pessoa', a.pessoa);
    await tela.digitar(p, dlg.locator('label:text-is("Número")').first().locator('xpath=following::input[1]'), String(a.numeroRef));
    if (await tela.temBotao(p, 'Pesquisar', dlg)) await tela.botao(p, 'Pesquisar', { escopo: dlg }); else await dlg.locator('[class*=filter]').first().click();
    await tela.pronto(p, 800);
    const linha = dlg.locator(`tr:has-text("${a.numeroRef}")`).first();
    if (!(await linha.count())) throw new Error(`nota ${a.numeroRef} não apareceu em Documentos Referenciados`);
    await linha.locator('.p-checkbox-box, .p-radiobutton-box, td').first().click();
    if (await tela.temBotao(p, 'Próximo', dlg)) {
      await tela.botao(p, 'Próximo', { escopo: dlg });
      for (const it of a.itens || []) {
        const row = dlg.locator(`tr:has-text("${it.texto}")`).first();
        const cb = row.locator('.p-checkbox-box').first();
        if (!(await cb.evaluate((e) => e.classList.contains('p-highlight')))) await cb.click();
        if (it.qtd !== undefined) await tela.digitar(p, row.locator('input[type=text]').first(), it.qtd);
      }
    }
    await tela.botao(p, 'Finalizar', { escopo: dlg });
    await tela.dropdown(p, p, 'Tipo do Frete', 'Sem Ocorr').catch((e) => t.anotar('Tipo do Frete não preenchido: ' + e.message.slice(0, 120)));
    // naturezas de devolução exigem "Informação Complementar": abre pela seta e escolhe a primeira (como no validador)
    if (a.infoCompl !== false) {
      const lab = p.locator('label:visible').filter({ hasText: /^\s*Informação Complementar\s*\*?\s*$/ }).first();
      if (await lab.count()) {
        const cont = lab.locator('xpath=ancestor::*[.//input][1]');
        if (!(await cont.locator('input').first().inputValue().catch(() => ''))) {
          await cont.locator('button:visible, .p-autocomplete-dropdown:visible').last().click(); await tela.pronto(p, 600);
          await p.locator('.p-autocomplete-panel:visible li, li[role=option]:visible').first().click(); await tela.pronto(p, 400);
        }
      }
    }
    let s = await tela.salvar(p);
    if (s.status === 'acerto_financeiro') {
      const d = await tela.dialogo(p);
      if (a.acerto) { await d.locator('text=' + a.acerto).first().click(); await tela.pronto(p); }
      await d.locator('button:has-text("Salvar")').first().click().catch(() => {}); await tela.pronto(p);
      await d.locator('button:has-text("Concluir")').first().click(); await tela.pronto(p, 1000);
      s = await tela.salvar(p);
    }
    const sef = p.locator('.p-dialog:visible', { hasText: 'Confirmação da operação' });
    if (await sef.count()) { await sef.getByRole('button', { name: 'Fechar' }).first().click(); await tela.pronto(p); }
    if (s.status !== 'salvo') {
      const corpo = tela.limpo(await p.locator('body').innerText());
      const i = corpo.indexOf('Campos obrigatórios');
      throw new Error(`nota com referência não foi salva (status ${s.status}); avisos: ${[...s.toasts, ...s.dialogos].join(' | ').slice(0, 300) || 'nenhum'}${i >= 0 ? '; ' + corpo.slice(i, i + 250) : ''}`);
    }
    const numero = await t.banco.valor('select NUMERO_DOCUMENTO from NOTA_FISCAL order by ID_NOTA_FISCAL desc limit 1');
    return { status: s.status, numero };
  },
};
