// args: {tipo:"SA"|"EN", item, qtd, vu}  — Outras Movimentações: ajuste de estoque
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  const log = [];
  await p.goto(base + '/fiscal/lancamento-outra-natureza'); await lib.esperar(p, 2500); await p.reload(); await lib.esperar(p, 3500);
  await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4000);
  log.push((await lib.ac(p, 'Natureza Operação', 'AJUSTE ESTOQUE - ' + (a.tipo || 'SA'), a.tipo === 'EN' ? '81' : '82')).opcoes);
  await lib.esperar(p, 2000);
  await p.getByRole('button', { name: 'Adicionar', exact: true }).first().click(); await lib.esperar(p, 2500);
  const dlg = p.locator('.p-dialog:visible').last();
  log.push((await lib.ac(p, '=Item', a.item, a.item, dlg)).ok);
  log.push((await lib.ac(p, 'Local de Estoque', 'PADR', '', dlg).catch(e => ({ ok: e.message.slice(0, 60) }))).ok);
  await lib.digitar(p, dlg.locator('input#quantidadeComercial'), String(a.qtd));
  await lib.moedaId(p, 'valorUnitario', a.vu, 2, dlg);
  await dlg.getByRole('button', { name: 'Adicionar', exact: true }).click(); await lib.esperar(p, 2500);
  const c = p.locator('.p-dialog:visible button:has-text("Cancelar")'); if (await c.count()) { await c.last().click(); await lib.esperar(p, 1500); }
  const s = await lib.salvar(p); log.push([s.status, s.obrigatorios, s.toasts, s.dialogos.map(x => x.slice(0, 150))]);
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), `ajuste-${a.item.replace(/\W+/g, '_')}-${a.qtd}.png`) });
  return { log, url: p.url() };
};
