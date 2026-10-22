// args: {descricao, pl, pb} — cria item copiando o padrão do ANZOL (revenda, UN, NCM 72071110, ICMS/PIS padrão, grupo PRODUTO)
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  await p.goto(base + '/fiscal/item'); await lib.esperar(p, 3000);
  await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4000);
  const log = [];
  await lib.texto(p, '=Descrição', a.descricao); await lib.esperar(p, 2000);
  const v = p.locator('.p-dialog:visible:has-text("Validação Descrição") button:has-text("Cancelar")'); if (await v.count()) { await v.last().click(); await lib.esperar(p, 1000); }
  log.push(await lib.ac(p, 'Tipo do item', 'Revenda').catch(e => 'tipo:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, 'Unidade de medida', 'UN', 'Unidade').catch(e => 'un:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, 'Origem da mercadoria', 'Nacional, exceto').catch(e => 'orig:' + e.message.slice(0,80)));
  if (a.pl) await lib.moeda(p, 'Peso líquido', a.pl, 2);
  if (a.pb) await lib.moeda(p, 'Peso bruto', a.pb, 2);
  log.push(await lib.ac(p, '=NCM', '72071110').catch(e => 'ncm:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, '=ICMS', 'PADR').catch(e => 'icms:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, 'PIS/COFINS', 'PADR').catch(e => 'pis:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, 'GRUPO', 'PRODUTO').catch(e => 'grupo:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, 'Local de estoque padrão – entradas', 'PADR').catch(e => 'le:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, 'Local de estoque padrão – saídas', 'PADR').catch(e => 'ls:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, 'Fórmula e cálculo do custo', 'AQUISI', 'Custo Aquisição').catch(e => 'f:' + e.message.slice(0,80)));
  await p.getByText('IBS CBS', { exact: true }).first().click(); await lib.esperar(p, 1500);
  log.push(await lib.ac(p, 'CST IBS CBS', '000').catch(e => 'cst:' + e.message.slice(0,80)));
  log.push(await lib.ac(p, 'Classificação Tributária IBS CBS', '000001').catch(e => 'cl:' + e.message.slice(0,80)));
  const s = await lib.salvar(p);
  const c = p.locator('.p-dialog:visible button:has-text("Cancelar")'); if (await c.count()) { await c.last().click(); await lib.esperar(p, 2000); }
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), 'item-' + a.descricao.replace(/\W+/g,'_') + '.png') });
  return { log: log.map(x => typeof x === 'object' ? JSON.stringify(x).slice(0,150) : x), salvar: s, url: p.url() };
};
