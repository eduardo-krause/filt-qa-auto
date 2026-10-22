// Cadastro de item na base de teste em produção (tributação/locais/grupo escolhidos pela seta: primeira opção). args: {descricao, pl, pb}
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  await p.goto(base + '/fiscal/item'); await lib.esperar(p, 3000); await p.reload(); await lib.esperar(p, 3000);
  await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4000);
  const log = [];
  const q = async (n, f) => { try { log.push([n, await f()]); } catch (e) { log.push([n, 'erro ' + e.message.slice(0, 60)]); } };
  await lib.texto(p, '=Descrição', a.descricao); await lib.esperar(p, 2000);
  const v = p.locator('.p-dialog:visible:has-text("Validação Descrição") button:has-text("Cancelar")'); if (await v.count()) { await v.last().click(); await lib.esperar(p, 1000); }
  await q('tipo', () => lib.ac(p, 'Tipo do item', 'Revenda'));
  await q('un', () => lib.ac(p, 'Unidade de medida', 'UN', 'Unidade'));
  await q('orig', () => lib.ac(p, 'Origem da mercadoria', 'Nacional, exceto'));
  if (a.pl) await lib.moeda(p, 'Peso líquido', a.pl, 2);
  if (a.pb) await lib.moeda(p, 'Peso bruto', a.pb, 2);
  await q('ncm', () => lib.ac(p, '=NCM', '72071110'));
  const geral = p.locator('li, a, span, div').filter({ hasText: /^\s*geral\s*$/i });
  if (await geral.count()) { await geral.last().click(); await lib.esperar(p, 1500); }
  await q('icms', () => lib.ac(p, '=ICMS', '', ''));
  await q('pis', () => lib.ac(p, '=PIS/COFINS', '', ''));
  await p.getByText('IBS CBS', { exact: true }).first().click().catch(() => {}); await lib.esperar(p, 1500);
  await q('cst', () => lib.ac(p, 'CST IBS CBS', '000'));
  await q('cl', () => lib.ac(p, 'Classificação Tributária IBS CBS', '000001'));
  await q('le', () => lib.ac(p, 'Local de estoque padrão – entradas', '', ''));
  await q('ls', () => lib.ac(p, 'Local de estoque padrão – saídas', '', ''));
  const g = p.locator('text=Dados Adicionais').first().locator('xpath=ancestor::*[.//p-autocomplete][1]').locator('p-autocomplete').first();
  await g.locator('button').click().catch(() => {}); await lib.esperar(p, 2000);
  const ops = p.locator('li[role=option]:visible'); if (await ops.count()) { await ops.first().click(); await lib.esperar(p, 1500); }
  const s = await lib.salvar(p);
  const c = p.locator('.p-dialog:visible button:has-text("Cancelar")'); if (await c.count()) { await c.last().click(); await lib.esperar(p, 1500); }
  return { log: log.map(x => JSON.stringify(x).slice(0, 120)), s: [s.status, s.obrigatorios, s.toasts] };
};
