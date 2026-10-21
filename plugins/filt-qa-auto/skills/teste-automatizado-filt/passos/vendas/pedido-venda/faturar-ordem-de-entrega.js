// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const nota = { ...require('../../fiscal/nota-fiscal/consultar-ultima-nota'), ...require('../../fiscal/nota-fiscal/consultar-notas-do-pedido'), ...require('../../fiscal/nota-fiscal/consultar-nfe-autorizadas'), ...require('../../fiscal/nota-fiscal/consultar-titulos-da-nota') };
const { acertoCartao } = require('./_apoio');

module.exports = {
  // args: { pedido, cliente, cartao?: { valor, parcelas } }
  //   sem `cartao`: conclui o acerto que o sistema propõe (forma do pedido + adiantamentos reservados).
  // devolve { notas: [{ numero, titulos:[...] }], acerto: texto do resumo do acerto }
  async faturar(t, { pedido, cliente, cartao, assinar = false }) {
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
    // pedido com defensivo: etapa "Assinatura digital" dos receituários (vem tudo marcado). Por padrão NÃO assina
    // (assinado não pode mais ser editado; dá para assinar depois da autorização da nota). args.assinar = true assina.
    const etapaAssinatura = p.getByText('Os responsáveis técnicos listados abaixo possuem certificado digital', { exact: false });
    if (await etapaAssinatura.count()) {
      if (!assinar) {
        // desmarca a caixa ao lado de "Assinar todos" (a 1ª caixa marcada da página é a da lista de faturamento, atrás do diálogo)
        const caixaTodos = p.locator('xpath=//*[normalize-space(text())="Assinar todos"]/ancestor::*[.//div[contains(@class,"p-checkbox-box")]][1]//div[contains(@class,"p-checkbox-box")]').first();
        if (await caixaTodos.evaluate((e) => e.classList.contains('p-highlight'))) { await caixaTodos.click(); await tela.pronto(p, 600); }
        const individuais = p.locator('xpath=//*[normalize-space(text())="Assinar digitalmente"]/ancestor::*[.//div[contains(@class,"p-checkbox-box")]][1]//div[contains(@class,"p-checkbox-box") and contains(@class,"p-highlight")]');
        for (let i = 0; i < 30 && (await individuais.count()); i++) { await individuais.first().click(); await tela.pronto(p, 400); }
      }
      t.anotar('assinatura digital dos receituários: ' + (assinar ? 'assinados' : 'não assinados') + ` (${await p.locator('xpath=//*[normalize-space(text())="Assinar digitalmente"]/ancestor::*[.//div[contains(@class,"p-checkbox-box")]][1]//div[contains(@class,"p-highlight")]').count()} receituários marcados)`);
      await tela.botao(p, 'Próximo', { noDialogo: false });
      await tela.pronto(p, 1500);
    }
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
