// Nota de TERCEIROS com documento referenciado (ex.: ENTRADA REMESSA DE COMPRA FUTURA, DEVOLUÇÃO DE VENDA EMISSÃO
// DE TERCEIROS). Para nota PRÓPRIA com documento referenciado use passos/nota_ref.js.
// args: {natureza, pessoa, numeroRef, itens:[{texto, qtd}], numero (da nota nova; vira a chave fictícia), serie?,
//        data?, dataInicial?: "01/09/2026" (filtro da busca — o padrão da tela é o 1º dia do mês atual), infoCompl?, acerto?}
// A busca só traz documentos com saldo (NOTA_FISCAL_ITEM.QUANTIDADE_TOTAL_NAO_REFERENCIADA > 0).
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0, 3).join('/'); const log = [];
  await p.goto(base + '/nota/nota-fiscal'); await lib.esperar(p, 2500); await p.reload(); await lib.esperar(p, 3500);
  await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4000);
  log.push(['nat', (await lib.ac(p, 'Natureza de Operação', a.natureza.replace(/^\d+/, ''), a.natureza)).ok]); await lib.esperar(p, 3000);
  let dlg = p.locator('.p-dialog:visible').last();
  if (!(await dlg.count())) { await p.locator('button:has-text("Adicionar Documento")').first().click(); await lib.esperar(p, 2500); dlg = p.locator('.p-dialog:visible').last(); }
  await lib.ac(p, 'Pessoa', a.pessoa, '', dlg); await lib.esperar(p, 1000);
  await lib.texto(p, 'Data Inicial', a.dataInicial || '01/01/2026', dlg); await lib.esperar(p, 500);
  log.push(['docRef', await lib.docRef(p, { numero: String(a.numeroRef), itens: a.itens })]); await lib.esperar(p, 2000);
  if (a.numero) { await lib.texto(p, 'Chave de Acesso', require('./chave.js')(a.serie || 1, a.numero)); await lib.esperar(p, 1500); }
  if (a.data) { await lib.texto(p, 'Data Emissão', a.data); await lib.texto(p, 'Data Entrada/Saída', a.data); }
  await lib.dd(p, 'Tipo do Frete', 'Sem Ocorr');
  if (a.infoCompl) log.push(['info', (await lib.ac(p, '=Informação Complementar', '', '').catch((e) => ({ ok: e.message.slice(0, 60) }))).ok]);
  let s = await lib.salvar(p); log.push(['salvar1', s.status, s.obrigatorios, s.toasts]);
  if (s.status === 'acerto_financeiro' && a.acerto !== false) { log.push(['acerto', await lib.acerto(p, a.acerto || 'Dinheiro')]); s = await lib.salvar(p); log.push(['salvar2', s.status, s.obrigatorios, s.toasts]); }
  const sef = p.locator('.p-dialog:visible', { hasText: 'Confirmação da operação' });
  if (await sef.count()) { await sef.getByRole('button', { name: 'Fechar' }).first().click(); await lib.esperar(p, 2500); log.push('fechou confirmação Sefaz sem enviar'); }
  return { status: s.status, log };
};
