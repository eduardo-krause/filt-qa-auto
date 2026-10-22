// CT-e de entrada pela tela. args: {numero, serie, notas:[<número da nota>,...], valor:<valor>, pessoa:"<remetente/fornecedor>", emitente:"<transportadora>", cidade:"<cidade coleta/entrega/origem>", continuar?:bool}
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  const log = [];
  const shot = (n) => a.print && p.screenshot({ path: require('path').join(lib.pastaPrints(), `cte-${a.numero}-${n}.png`) });
  if (!a.continuar) {
    await p.goto(base + '/fiscal/conhecimento-de-transporte'); await lib.esperar(p, 2500); await p.reload(); await lib.esperar(p, 3500);
    await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4000);
    log.push(['nat', (await lib.ac(p, 'Natureza de Operação', a.natureza || 'CT-E ENTRADA', a.natureza || 'CT-E ENTRADA')).ok]);
    await lib.esperar(p, 2500);
  }
  // documentos
  await p.getByRole('button', { name: /Adicionar Documento/i }).click(); await lib.esperar(p, 3000);
  let dlg = p.locator('.p-dialog:visible').last();
  await lib.ac(p, '=Pessoa', a.pessoa, '', dlg); await lib.esperar(p, 1200);
  await dlg.locator('button.btn-filtrar-default').click(); await lib.esperar(p, 4000);
  for (const n of a.notas) {
    const row = dlg.locator('tbody tr', { hasText: String(n) }).first();
    if (!(await row.count())) { log.push(['nota-nao-achada', n]); continue; }
    await row.locator('.p-checkbox-box, .p-radiobutton-box').first().click(); await lib.esperar(p, 600);
    log.push(['nota', n]);
  }
  await shot('docs');
  await dlg.getByRole('button', { name: 'Finalizar' }).click(); await lib.esperar(p, 3000);
  if (a.continuar) return { log };
  await lib.texto(p, 'Número CT-e', a.numero);
  await lib.texto(p, '=Série', a.serie || 599);
  log.push(['emit', (await lib.ac(p, '=Emitente', a.emitente).catch(e => ({ ok: e.message.slice(0, 80) }))).ok]);
  // Remetente: digitar+escolher não fixa o valor (ver relatório) → abrir pela seta
  await p.locator('#pessoaRemetente button').click(); await lib.esperar(p, 2500);
  await p.locator('li[role=option]:visible', { hasText: a.pessoa }).first().click(); await lib.esperar(p, 2500);
  log.push(['rem', await p.locator('#pessoaRemetente input').first().inputValue()]);
  for (const l of ['Cidade Coleta', 'Cidade Entrega', 'Cidade de Origem dos Serviços']) {
    const r = await lib.ac(p, '=' + l, a.cidade).catch(e => ({ ok: e.message.slice(0, 60) })); log.push([l, r.ok]);
  }
  log.push(['cfop', (await lib.ac(p, '=Operação Fiscal', '1353').catch(e => ({ ok: e.message.slice(0, 60) }))).ok]);
  log.push(['cst', (await lib.ac(p, '=CST/CSOSN ICMS', '00').catch(e => ({ ok: e.message.slice(0, 60) }))).ok]);
  // componente Frete: valor na grade
  const row = p.locator('tr', { hasText: 'Frete' }).last();
  const inp = row.locator('input').last();
  await lib.digitar(p, inp, Math.round(a.valor * 100));
  await lib.esperar(p, 1500);
  await shot('antes');
  let s = await lib.salvar(p); log.push(['salvar1', s.status, s.obrigatorios, s.toasts, s.dialogos]);
  if (s.status === 'acerto_financeiro') { log.push(['acerto', await lib.acerto(p, 'Dinheiro')]); s = await lib.salvar(p); log.push(['salvar2', s.status, s.obrigatorios, s.toasts, s.dialogos]); }
  await shot('salvo');
  return { log, url: p.url(), status: s.status };
};
