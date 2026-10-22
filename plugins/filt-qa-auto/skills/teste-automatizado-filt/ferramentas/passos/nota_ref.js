// Nota própria com documento referenciado. args: {natureza, pessoa, numeroRef, itens:[{texto, qtd}], infoCompl?, acerto?}
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  const log = [];
  await p.goto(base + '/nota/nota-fiscal'); await lib.esperar(p, 2500); await p.reload(); await lib.esperar(p, 3500);
  await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4000);
  log.push(['nat', (await lib.ac(p, 'Natureza de Operação', a.natureza.replace(/^\d+/, ''), a.natureza)).opcoes]);
  await lib.esperar(p, 3000);
  if (a.pessoaNota) log.push(['pessoa', (await lib.ac(p, '=Pessoa', a.pessoa).catch(e => ({ ok: e.message.slice(0, 60) }))).ok]);
  log.push(['docRef', await lib.docRef(p, { pessoa: a.pessoa, numero: String(a.numeroRef), itens: a.itens }).catch(e => 'erro ' + e.message.slice(0, 200))]);
  await lib.esperar(p, 2000);
  log.push(['frete', await lib.dd(p, 'Tipo do Frete', 'Sem Ocorr').catch(e => 'frete ' + e.message.slice(0, 60))]);
  if (a.infoCompl) log.push(['info', (await lib.ac(p, '=Informação Complementar', '', '').catch(e => ({ ok: e.message.slice(0, 60) }))).ok]);
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), `ref-${a.numeroRef}-antes.png`) });
  let s = await lib.salvar(p); log.push(['salvar1', s.status, s.obrigatorios, s.toasts, s.dialogos.map(x => x.slice(0, 200))]);
  if (s.status === 'acerto_financeiro') { log.push(['acerto', await lib.acerto(p, a.acerto)]); s = await lib.salvar(p); log.push(['salvar2', s.status, s.obrigatorios, s.toasts, s.dialogos.map(x => x.slice(0, 300))]); }
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), `ref-${a.numeroRef}-salvo.png`) });
  return { log, url: p.url(), status: s.status };
};
