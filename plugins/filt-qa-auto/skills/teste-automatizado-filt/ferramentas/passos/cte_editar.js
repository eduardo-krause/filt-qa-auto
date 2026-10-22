// args: {numero, removerNota?:<número>, valor?:<valor>}
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  const log = [];
  await p.goto(base + '/fiscal/conhecimento-de-transporte'); await lib.esperar(p, 2500); await p.reload(); await lib.esperar(p, 4000);
  await p.getByText(`${a.numero}/`, { exact: false }).first().click(); await lib.esperar(p, 5000);
  if (a.removerNota) {
    const row = p.locator('tr', { hasText: String(a.removerNota) }).first();
    await row.locator('.ph-trash, [class*=trash]').first().click(); await lib.esperar(p, 2000);
    const conf = p.locator('.p-dialog:visible button, .p-confirm-dialog button').filter({ hasText: /Excluir|Confirmar|Sim/ });
    if (await conf.count()) { log.push(['confirm', (await lib.dialogos(p)).map(x => x.slice(0, 120))]); await conf.last().click(); await lib.esperar(p, 2500); }
    log.push(['docs', (await p.locator('tr', { hasText: 'COMPRA' }).allInnerTexts()).map(s => s.replace(/\s+/g, ' '))]);
  }
  if (a.valor) {
    const row = p.locator('tr', { hasText: 'Frete' }).last();
    await lib.digitar(p, row.locator('input').last(), Math.round(a.valor * 100)); await lib.esperar(p, 1500);
  }
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), `cte-${a.numero}-editado-antes.png`) });
  let s = await lib.salvar(p); log.push(['salvar1', s.status, s.obrigatorios, s.toasts, s.dialogos.map(x => x.slice(0, 150))]);
  if (s.status === 'acerto_financeiro') { log.push(['acerto', await lib.acerto(p, 'Dinheiro')]); s = await lib.salvar(p); log.push(['salvar2', s.status, s.obrigatorios, s.toasts, s.dialogos.map(x => x.slice(0, 150))]); }
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), `cte-${a.numero}-editado.png`) });
  return log;
};
