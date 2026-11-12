// Tela: Processos › Contábil › Fechamento do Período (/contabil/fechamento-periodo/form?id=N) — Abrir (Motivo) → Abrir Todos → Sim → Processar.
const { observar } = require('../../_comum');
const { abrirForm, estado, noBanco, idDaUrl, limpo } = require('./_apoio');

module.exports = {
  // args: { ano, mes, motivo, abrirTodos = true } → { id, antes, dialogos:[...], toasts, eventos, errosApi, depois, banco:{id,situacao,motivo,processos} }
  async abrir(t, { ano, mes, motivo, abrirTodos = true }) {
    const { p, tela } = t;
    await abrirForm(t, ano, mes);
    const id = idDaUrl(p);
    const antes = await estado(p);
    if (!/Fechado/i.test(antes.status || '')) return { id, antes, erro: 'período não está fechado', banco: await noBanco(t, id) };
    const dialogos = []; const eventos = []; let errosApi = [];
    await p.locator('.status-bar button').filter({ hasText: /^\s*Abrir\s*$/ }).first().click(); await tela.pronto(p, 500);
    const d = p.locator('.p-dialog:visible').filter({ hasText: 'Abrir Período Contábil' }).last();
    await d.waitFor({ timeout: 10000 });
    dialogos.push(limpo(await d.innerText()));
    await d.locator('textarea#motivo').fill(String(motivo || ''));
    const r1 = await observar(t, d.getByRole('button', { name: 'Abrir', exact: true }), { minimo: 1500 });
    eventos.push(...r1.eventos); errosApi = errosApi.concat(r1.errosApi);
    if (abrirTodos) {
      const b = p.locator('app-periodoMovimentacaoProcesso-list .header-buttons button').first();
      const rot = limpo(await b.innerText());
      if (/Abrir Todos/i.test(rot)) {
        await b.click(); await tela.pronto(p, 500);
        const c = await tela.dialogo(p);
        if (c) { dialogos.push(limpo(await c.innerText())); const r = await observar(t, c.getByRole('button', { name: 'Sim', exact: true }).first(), { minimo: 1000 }); eventos.push(...r.eventos); }
      } else dialogos.push(`botão do cabeçalho dos processos: "${rot}" (não é Abrir Todos)`);
    }
    const r2 = await observar(t, p.getByRole('button', { name: 'Processar', exact: true }).first(), { minimo: 2500 });
    eventos.push(...r2.eventos); errosApi = errosApi.concat(r2.errosApi);
    const c2 = await tela.dialogo(p);
    if (c2 && (await c2.getByRole('button', { name: 'Sim', exact: true }).count())) {
      dialogos.push(limpo(await c2.innerText()));
      const r = await observar(t, c2.getByRole('button', { name: 'Sim', exact: true }).first(), { minimo: 2500 }); eventos.push(...r.eventos); errosApi = errosApi.concat(r.errosApi);
    }
    return {
      id, antes, dialogos, toasts: [...new Set(eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)))], eventos, errosApi,
      depois: await estado(p), banco: await noBanco(t, id),
    };
  },
};
