// Nota pela tela com data de entrada (retroativa) e acerto. Usa passos/nota.js para cabeçalho e itens.
// args: os de nota.js (natureza, numero, serie, pessoa, itens, propria?, cnpjEmitente?) +
//   data?: "dd/mm/aaaa"  → Data Emissão e Data Entrada/Saída (nota de terceiros; em emissão própria só a
//                           Data Entrada/Saída é editável e não aceita data anterior à emissão)
//   acerto?: "Dinheiro" | false (false = para no acerto, ex.: para duplicata com parcelas → passos/duplicata.js)
//   infoCompl?: true (natureza que exige Informação Complementar)
// O botão Adicionar do item às vezes demora a habilitar: espera até 20 s antes de desistir.
// Se continuar desabilitado, a causa costuma ser tributação (API hasTributacaoDetalhe → "Não foi possível obter
// nenhuma tributação do ICMS"): falta regra para o tipo da natureza na tributação do item.
module.exports = async (p, lib, a) => {
  const r = await require('./nota.js')(p, lib, Object.assign({}, a, { salvar: false }));
  if (r.erro === 'Adicionar desabilitado') {
    const dlg = p.locator('.p-dialog:visible').last(); const b = dlg.getByRole('button', { name: 'Adicionar', exact: true });
    for (let k = 0; k < 20 && await b.isDisabled(); k++) await lib.esperar(p, 1000);
    if (await b.isDisabled()) return r;
    await b.click(); await lib.esperar(p, 2500);
    const c = p.locator('.p-dialog:visible button:has-text("Cancelar")'); if (await c.count()) { await c.last().click(); await lib.esperar(p, 1500); }
  } else if (r.erro) return r;
  if (a.data) {
    if (!a.propria) await lib.texto(p, 'Data Emissão', a.data);
    await lib.texto(p, 'Data Entrada/Saída', a.data);
  }
  await lib.dd(p, 'Tipo do Frete', a.tipoFrete || 'Sem Ocorr');
  if (a.infoCompl) await lib.ac(p, '=Informação Complementar', '', '').catch(() => {});
  let s = await lib.salvar(p); const log = [['salvar1', s.status, s.obrigatorios, s.toasts]];
  if (s.status === 'acerto_financeiro' && a.acerto !== false) {
    log.push(['acerto', await lib.acerto(p, a.acerto || 'Dinheiro')]);
    s = await lib.salvar(p); log.push(['salvar2', s.status, s.obrigatorios, s.toasts]);
  }
  // nota de terceiros pode abrir "Confirmação da operação - Sefaz" (manifestação): fechar sem enviar
  const sef = p.locator('.p-dialog:visible', { hasText: 'Confirmação da operação' });
  if (await sef.count()) { await sef.getByRole('button', { name: 'Fechar' }).first().click(); await lib.esperar(p, 2500); log.push('fechou confirmação Sefaz sem enviar'); }
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), a.print + '.png') });
  return { status: s.status, chave: r.chave, log };
};
