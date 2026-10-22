// Nota de entrada de terceiros pela tela.
// args: {natureza:"14COMPRA", numero:<número>, serie:599, pessoa:"<fornecedor/cliente>",
//        itens:[{item:"<item>", qtd:10, vu:100, desc?:2, extras?:{valorFrete:50,...}}], tipoFrete?:"Sem Ocorr", salvar?:true}
// chave fictícia (CNPJ de teste) para nota de terceiros — a Sefaz não conhece essa chave (não serve para devolução de compra)
function chave(serie, numero, cnpj) {
  const b = '41' + '2609' + (cnpj || '12345678000195') + '55' + String(serie).padStart(3, '0') + String(numero).padStart(9, '0') + '1' + String(numero).slice(-8).padStart(8, '0');
  let s = 0, w = 2; for (let i = b.length - 1; i >= 0; i--) { s += Number(b[i]) * w; w = w === 9 ? 2 : w + 1; }
  const r = s % 11; return b + (r < 2 ? 0 : 11 - r);
}
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  const log = [];
  await p.goto(base + '/nota/nota-fiscal'); await lib.esperar(p, 2500); await p.reload(); await lib.esperar(p, 3500);
  await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4000);
  log.push(['nat', await lib.ac(p, 'Natureza de Operação', a.natureza.replace(/^\d+/, ''), a.natureza)]);
  await lib.esperar(p, 2000);
  const ch = chave(a.serie || 599, a.numero, a.cnpjEmitente);
  if (!a.propria) { await lib.texto(p, 'Chave de Acesso', ch); await lib.esperar(p, 1500); }
  log.push(['pessoa', await lib.ac(p, '=Pessoa', a.pessoa)]);
  for (const it of a.itens) {
    if (!(await p.locator('.p-dialog:visible').count())) { await p.getByRole('button', { name: 'Adicionar', exact: true }).first().click(); await lib.esperar(p, 2500); }
    const dlg = p.locator('.p-dialog:visible').last();
    log.push(['item', it.item, await lib.ac(p, '=Item', it.item, it.item, dlg)]);
    await lib.esperar(p, 3000);
    if (a.local !== false) { const li = await dlg.locator('p-autocomplete#localEstoque').count(); if (li) log.push(['local', await require('./local_item.js')(p, lib)]); }
    const lento = async (sel, txt) => { const e = dlg.locator(sel); await e.click(); await p.keyboard.press('Control+A'); await p.keyboard.type(String(txt), { delay: 150 }); await p.keyboard.press('Tab'); await lib.esperar(p, 1000); };
    await lento('input#quantidadeComercial', String(it.qtd).replace('.', ','));
    await lento('input#valorUnitarioComercial', Math.round(it.vu * 10 ** (a.casasVu || 2)));
    if (it.desc) await lib.moedaId(p, 'valorDesconto', it.desc, 5, dlg);
    const bAdd = dlg.getByRole('button', { name: 'Adicionar', exact: true });
    for (let k = 0; k < 10 && await bAdd.isDisabled(); k++) await lib.esperar(p, 700);
    if (await bAdd.isDisabled()) {
      const inv = await dlg.locator('.ng-invalid').evaluateAll(a => [...new Set(a.map(e => e.tagName + '#' + (e.id || e.getAttribute('name') || '')))].slice(0, 20));
      if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), 'nf-add-desabilitado.png') });
      return { erro: 'Adicionar desabilitado', item: it.item, invalidos: inv, log };
    }
    await bAdd.click(); await lib.esperar(p, 2500);
  }
  const c = p.locator('.p-dialog:visible button:has-text("Cancelar")'); if (await c.count()) { await c.last().click(); await lib.esperar(p, 1500); }
  // extras por item (frete, seguro, despesas, frete gerencial): lápis da linha
  for (const [idx, it] of a.itens.entries()) {
    if (!it.extras) continue;
    const row = p.locator('tbody tr', { hasText: it.item }).first();
    await row.locator('.ph-pencil, .ph-pencil-simple, [class*=pencil]').first().click(); await lib.esperar(p, 2500);
    const dlg = p.locator('.p-dialog:visible').last();
    for (const [id, v] of Object.entries(it.extras)) { await lib.moedaId(p, id, v, 2, dlg).catch(e => log.push(['extra-erro', id, e.message.slice(0, 80)])); }
    const btn = dlg.locator('button:has-text("Salvar"), button:has-text("Alterar"), button:has-text("Adicionar")').first();
    log.push(['extra-btn', await btn.innerText()]); await btn.click(); await lib.esperar(p, 2500);
    const c2 = p.locator('.p-dialog:visible button:has-text("Cancelar")'); if (await c2.count()) { await c2.last().click(); await lib.esperar(p, 1500); }
  }
  log.push(['frete', await lib.dd(p, 'Tipo do Frete', a.tipoFrete || 'Sem Ocorr').catch(e => 'frete:' + e.message.slice(0, 80))]);
  if (a.infoCompl) log.push(['info', (await lib.ac(p, '=Informação Complementar', '', '').catch(e => ({ ok: e.message.slice(0, 60) }))).ok]);
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), 'nf-' + a.numero + '-antes.png') });
  if (a.salvar === false) return { log, chave: ch };
  let s = await lib.salvar(p); log.push(['salvar1', s.status, s.obrigatorios, s.toasts]);
  if (s.status === 'acerto_financeiro') {
    log.push(['acerto', await lib.acerto(p, a.acerto || 'Dinheiro')]);
    s = await lib.salvar(p); log.push(['salvar2', s.status, s.obrigatorios, s.toasts, s.dialogos]);
  }
  await lib.esperar(p, 2000);
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), 'nf-' + a.numero + '-salva.png') });
  return { log, chave: ch, url: p.url(), status: s.status };
};
