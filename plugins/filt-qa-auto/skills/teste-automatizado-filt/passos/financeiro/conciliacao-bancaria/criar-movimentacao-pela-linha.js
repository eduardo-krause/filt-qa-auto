// Tela: Processos › Financeiro › Conciliação de Contas — "Nova Mov. Bancária" pelo ⋮ de uma linha OFX (diálogo Movimentação Bancária).
const { limpo, irAba, lista, expandirTodos, lerRegistros, casa } = require('./_apoio');
const mov = require('../../_movimentacao-bancaria');

module.exports = {
  // args: { linha:{ valor:'3,33', data:'13/08/2026', fitid, descricao(regex) }, classificacao, contaContabil (sinônimo de classificacao: o diálogo não tem conta contábil),
  //   historico (texto livre → campo Descrição), historicoContabil (autocomplete Histórico), centro, conciliado, documento }
  // → { menu, dialogo:{antes, preenchido, naoAchados, toasts, errosApi, obrigatorios, dialogoAberto}, idLancamento (banco), idsNovos,
  //     apareceNoSistemaSemRecarregar, linhaSistema, linhaOfxDepois, ofxConciliadaAuto (OFX marcada/Pendente Salvar/fora dos Não Conciliados), dataConciliacaoBanco }
  async novaMov(t, { linha, classificacao, contaContabil, historico, historicoContabil, centro, conciliado, documento }) {
    const { p, tela } = t;
    await irAba(t, 'Não Conciliados');
    await expandirTodos(t);
    const lOfx = await lista(t, 'OFX');
    const regs = (await lerRegistros(lOfx)).filter((r) => casa(r, linha));
    if (!regs.length) throw new Error(`linha OFX não encontrada (${JSON.stringify(linha)})`);
    const alvo = regs[0];
    if (!alvo.temMenu) return { menu: [], dialogo: null, erro: 'linha sem menu ⋮', linhaOfx: alvo };
    await lOfx.locator('tbody > tr.line1').nth(alvo.idx).locator('xpath=following-sibling::tr[1]').locator('.header-buttons button').first().click();
    await tela.pronto(p, 400);
    const menu = (await p.locator('.mat-menu-panel:visible button').allInnerTexts()).map(limpo);
    await p.locator('.mat-menu-panel:visible button').filter({ hasText: 'Nova Mov. Bancária' }).first().click();
    await tela.pronto(p, 1000);
    const idAntes = Number(await t.banco.valor('SELECT COALESCE(MAX(ID_LANCAMENTO),0) FROM LANCAMENTO')) || 0;
    const dialogo = await mov.preencherEConfirmar(t, { classificacao: classificacao || contaContabil, descricao: historico, historicoContabil, centro, conciliado, documento });
    if (dialogo.dialogoAberto) {
      await mov.cancelar(t); // não gravou (validação): fecha o diálogo pelo Cancelar
      return { menu, dialogo, idLancamento: null, idsNovos: [], apareceNoSistemaSemRecarregar: null, linhaOfx: alvo };
    }
    const novos = (await t.banco.consultar('SELECT ID_LANCAMENTO ID FROM LANCAMENTO WHERE ID_LANCAMENTO > ? ORDER BY 1', [idAntes])).map((x) => Number(x.ID));
    // sem recarregar: lê o lado Sistema e o OFX como estão
    const sis = await lerRegistros(await lista(t, 'Sistema'));
    const valorTxt = String(linha.valor || '').replace(/[^\d,]/g, '');
    const linhaSistema = sis.find((r) => (!linha.data || r.data === linha.data) && (!valorTxt || r.valor.replace(/[^\d,]/g, '') === valorTxt) && (!historico || `${r.descricao} ${r.title}`.includes(historico))) || null;
    const ofxDepois = (await lerRegistros(await lista(t, 'OFX'))).filter((r) => casa(r, linha));
    const linhaOfxDepois = ofxDepois[0] || null;
    const fitid = alvo.detalhes.FITID || linha.fitid;
    const dc = fitid ? await t.banco.valor('SELECT MAX(DATA_CONCILIACAO) FROM CONCILIACAO_EXTRATO WHERE FITID = ?', [fitid]) : null;
    return {
      menu, dialogo, idLancamento: novos.length ? novos[novos.length - 1] : null, idsNovos: novos,
      apareceNoSistemaSemRecarregar: !!linhaSistema, linhaSistema, linhaOfx: alvo, linhaOfxDepois,
      ofxConciliadaAuto: !linhaOfxDepois || !!(linhaOfxDepois.pendenteSalvar || linhaOfxDepois.marcado) || !!(linhaSistema && (linhaSistema.pendenteSalvar || linhaSistema.marcado)),
      dataConciliacaoBanco: dc ? String(dc) : null,
    };
  },
};
