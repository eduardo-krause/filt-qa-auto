// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
const { notasSql } = require('../../_nota');

module.exports = {
  // Venda futura: GERAR NOTA no carrinho abre a nota em outra aba; conclui o acerto proposto, salva e espera o resultado da
  // transmissão ANTES de fechar a aba (sair antes interrompe o envio).
  // args: { pedido, espera = 180000 }
  // → { status: 'salvo' (NF-e autorizada) | 'falha' | <status do salvar>, mensagem, nota: { id, numero, statusNfe, descricao }, toasts, dialogos }
  //   'falha' = modal "Falha ao Gerar NF-e", toast de erro de API ou NF-e com status diferente de 100 (rejeição 204/206/539...): `mensagem` traz o texto exato.
  async gerarNotaVendaFutura(t, { pedido, espera = 180000 }) {
    const { p, tela } = t;
    tela.exigirDfe();
    const desde = Number(await t.banco.valor('select coalesce(max(ID_NOTA_FISCAL),0) from NOTA_FISCAL')) || 0;
    await tela.abrir(p, '/vendas/carrinho?id=' + pedido);
    const nova = p.context().waitForEvent('page', { timeout: 60000 });
    nova.catch(() => {});   // se o clique falhar antes, a espera não pode derrubar o motor
    await tela.botao(p, 'GERAR NOTA', { noDialogo: false });
    const q = await nova.catch(() => { throw new Error('GERAR NOTA não abriu a nota em outra aba em 60 s'); });
    await q.waitForLoadState('domcontentloaded');
    require('../../../motor/lib/rede').instalar(q);
    try {
      await tela.pronto(q, 1500);
      // a nota abre já preenchida: mesmo passo de "salvar nota aberta", rodando na aba nova
      let s;
      try { s = await require('../../fiscal/nota-fiscal/salvar-nota-aberta-por-outra-rotina').salvarAberta({ ...t, p: q }, {}); }
      catch (e) {
        // a evidência do motor é da aba do carrinho: junta aqui o que a aba da nota mostrava
        const dl = await tela.textoDialogos(q).catch(() => []); const ts = await tela.toasts(q).catch(() => []);
        const cobre = await q.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Salvar/.test(x.innerText) && x.offsetParent);
          if (!b) return 'Salvar não visível'; const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return el ? (el.className || el.tagName) + ' ' + (el.innerText || '').slice(0, 120) : 'nada'; }).catch(() => '');
        throw new Error(`aba da nota (${q.url()}): ${e.message.split('\n')[0]} | diálogos: ${dl.join(' | ') || 'nenhum'} | toasts: ${ts.join(' | ') || 'nenhum'} | por cima do Salvar: ${cobre}`);
      }
      const textos = () => tela.textoDialogos(q).catch(() => []);
      let nota = null; let mensagem = '';
      for (const t0 = Date.now(); Date.now() - t0 < espera; await q.waitForTimeout(3000)) {
        const dl = [...s.dialogos, ...(await textos())].join(' | ');
        const falha = dl.match(/Falha ao Gerar NF-e[^|]*/);
        const n = (await t.banco.consultar(notasSql, [desde, pedido]))[0];
        if (n) {
          const e = await t.banco.linha('select STATUS, DESCRICAO_STATUS from NOTA_FISCAL_ELETRONICA where ID_NOTA_FISCAL = ?', [n.ID_NOTA_FISCAL]);
          nota = { id: n.ID_NOTA_FISCAL, numero: n.NUMERO_DOCUMENTO, statusNfe: e && e.STATUS !== null && e.STATUS !== '' ? Number(e.STATUS) : null, descricao: e && e.DESCRICAO_STATUS };
          if (nota.statusNfe === 100) return { ...s, status: 'salvo', mensagem: nota.descricao, nota };
          if (nota.statusNfe) { mensagem = `${nota.statusNfe} - ${nota.descricao}`; break; }
        }
        if (falha) { mensagem = tela.limpo(falha[0]); break; }
        // erro de API ao salvar/gerar (ex.: "TituloNumeroDocumento - Tamanho máximo do campo é 10 caracteres; [400 - Bad Request]")
        const erroApi = [...s.toasts, ...(await tela.toasts(q).catch(() => []))].find((x) => /\[\d{3} - |Bad Request|^Erro/i.test(x));
        if (erroApi && !(nota && nota.statusNfe)) { mensagem = erroApi; break; }
      }
      if (!mensagem) mensagem = 'NF-e sem retorno em ' + espera / 1000 + ' s (diálogos: ' + (await textos()).join(' | ') + ')';
      t.anotar(`ATENÇÃO: NF-e de venda futura do pedido ${pedido} não autorizada: ${mensagem}`);
      return { ...s, status: 'falha', mensagem, nota, dialogos: [...s.dialogos, ...(await textos())] };
    } finally { await q.close().catch(() => {}); await p.bringToFront(); }
  },
};
