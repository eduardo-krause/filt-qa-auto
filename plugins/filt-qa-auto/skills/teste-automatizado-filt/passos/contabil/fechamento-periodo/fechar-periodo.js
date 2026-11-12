// Tela: Processos › Contábil › Fechamento do Período (/contabil/fechamento-periodo/form?id=N) — Fechar → Sim → Processar.
const { observar } = require('../../_comum');
const { abrirForm, estado, noBanco, idDaUrl, limpo } = require('./_apoio');

module.exports = {
  // args: { ano, mes } → { id, antes:{status,botoes,processos}, dialogo, toasts, eventos, errosApi, depois, banco:{id,situacao,motivo,processos} }
  async fechar(t, { ano, mes }) {
    const { p, tela } = t;
    await abrirForm(t, ano, mes);
    const id = idDaUrl(p);
    const antes = await estado(p);
    if (!/Aberto/i.test(antes.status || '')) return { id, antes, erro: 'período não está aberto', banco: await noBanco(t, id) };
    await p.locator('.status-bar button').filter({ hasText: /^\s*Fechar\s*$/ }).first().click(); await tela.pronto(p, 500);
    const d = await tela.dialogo(p);
    const dialogo = d ? limpo(await d.innerText()) : null;
    const eventos = []; let errosApi = [];
    if (d) { const r = await observar(t, d.getByRole('button', { name: 'Sim', exact: true }).first(), { minimo: 1500 }); eventos.push(...r.eventos); errosApi.push(...r.errosApi); }
    const meio = await estado(p);
    if (/Fechado/i.test(meio.status || '')) {
      const r = await observar(t, p.getByRole('button', { name: 'Processar', exact: true }).first(), { minimo: 2500 });
      eventos.push(...r.eventos); errosApi = errosApi.concat(r.errosApi);
    }
    return {
      id, antes, dialogo, toasts: [...new Set(eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)))], eventos, errosApi,
      depois: await estado(p), banco: await noBanco(t, id),
    };
  },
};
