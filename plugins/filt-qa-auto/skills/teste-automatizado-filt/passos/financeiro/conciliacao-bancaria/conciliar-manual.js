// Tela: Processos › Financeiro › Conciliação de Contas — concilia na mão: marca a linha OFX e a do Sistema → Confirmar → (Salvar).
const { observar } = require('../../_comum');
const { irAba, lista, expandirTodos, lerRegistros, casa, juntarToasts } = require('./_apoio');

async function marcar(t, lado, filtro) {
  const { p, tela } = t;
  const lst = await lista(t, lado);
  const regs = await lerRegistros(lst);
  const achados = regs.filter((r) => casa(r, filtro));
  if (!achados.length) throw new Error(`linha ${lado} não encontrada (${JSON.stringify(filtro)})`);
  const r = achados[0];
  await lst.locator('tbody > tr.line1').nth(r.idx).locator('.p-checkbox-box').first().click(); await tela.pronto(p, 400);
  return { linha: r, candidatas: achados.length };
}

module.exports = {
  // args: { ofx:{ fitid | valor:'1,28', data:'03/08/2026', descricao(regex) }, sistema:{ valor, data, descricao, fitid }, salvar:true }
  // → { ofx:{linha,candidatas}, sistema:{linha,candidatas}, confirmarHabilitado, toastsConfirmar, salvar:{toasts,errosApi} | null, conciliadoBanco (DATA_CONCILIACAO do extrato pelo FITID, se houver) }
  async conciliar(t, { ofx, sistema, salvar = true }) {
    const { p, tela } = t;
    await irAba(t, 'Não Conciliados');
    await expandirTodos(t);
    const o = await marcar(t, 'OFX', ofx);
    const s = await marcar(t, 'Sistema', sistema);
    const conf = p.locator('app-conciliacao-bancaria-totalizador button').filter({ hasText: 'Confirmar' }).first();
    const confirmarHabilitado = await conf.isEnabled();
    if (!confirmarHabilitado) return { ofx: o, sistema: s, confirmarHabilitado, toastsConfirmar: [], salvar: null, conciliadoBanco: null };
    await conf.click(); await tela.pronto(p, 600);
    const toastsConfirmar = await juntarToasts(p, 1500);
    let sv = null;
    if (salvar) {
      const r = await observar(t, p.getByRole('button', { name: 'Salvar', exact: true }).first(), { minimo: 2500 });
      sv = { toasts: r.eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)), errosApi: r.errosApi };
    }
    const fitid = o.linha.detalhes.FITID || (ofx && ofx.fitid);
    const dc = fitid ? await t.banco.valor('SELECT MAX(DATA_CONCILIACAO) FROM CONCILIACAO_EXTRATO WHERE FITID = ?', [fitid]) : null;
    return { ofx: o, sistema: s, confirmarHabilitado, toastsConfirmar, salvar: sv, conciliadoBanco: dc ? String(dc) : null, fitid: fitid || null };
  },
};
