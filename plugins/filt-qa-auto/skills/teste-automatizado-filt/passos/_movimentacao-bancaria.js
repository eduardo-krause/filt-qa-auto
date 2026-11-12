// Diálogo "Movimentação Bancária" (app-movimentacao-bancaria), aberto pela Conciliação (⋮ da linha OFX) ou pela Gestão Caixa e Bancos.
// Ajudante de várias telas (não vira passo).
const { limpo, observar } = require('./_comum');

const dlg = (p) => p.locator('.p-dialog:visible').filter({ hasText: 'Movimentação Bancária' }).last();

async function acDialogo(t, d, id, texto) {
  const { p, tela } = t;
  const inp = d.locator(`input#${id}`).first();
  await inp.scrollIntoViewIfNeeded(); await inp.click(); await inp.fill('');
  await p.keyboard.type(String(texto), { delay: 40 });
  await tela.pronto(p, 900);
  const ops = p.locator('.p-autocomplete-panel:visible li');
  await ops.first().waitFor({ timeout: 6000 }).catch(() => {});
  const textos = (await ops.allInnerTexts()).map(limpo);
  const i = textos.findIndex((x) => x.includes(texto));
  if (i < 0) return { ok: false, opcoes: textos };
  await ops.nth(i).click(); await tela.pronto(p, 400);
  return { ok: true, opcoes: textos };
}

async function lerDialogo(d) {
  return d.evaluate((dl) => {
    const v = (sel) => { const e = dl.querySelector(sel); return e ? e.value : null; };
    return {
      conta: v('input#contaBancariaCaixa'), tipo: [...dl.querySelectorAll('p-radiobutton')].filter((r) => r.querySelector('.p-highlight')).map((r) => r.innerText.trim()).join(',') || null,
      classificacao: v('input#classificacaoFinanceira'), numeroDocumento: v('input#numeroDocumento'), descricao: v('input#descricao'), valor: v('input#valor'),
      pessoa: v('input#filtro-pessoa'), data: v('input[name=dataConciliacao]'), centro: v('input#centroResultadoDetalhe'),
      centroDesabilitado: !!(dl.querySelector('input#centroResultadoDetalhe') || {}).disabled, historico: v('input#historico'),
      conciliado: !!dl.querySelector('#conciliado .p-highlight'), conciliadoDesabilitado: !!dl.querySelector('#conciliado .p-disabled'),
    };
  });
}

// Preenche (só o que vier) e Confirmar. args: { conta, tipo:'D'|'C', classificacao, documento, descricao, valor (número), data, centro, historicoContabil, pessoa, conciliado }
// → { antes (como o diálogo abriu), preenchido, naoAchados:{campo:[opções]}, toasts, eventos, errosApi, obrigatorios, dialogoAberto }
async function preencherEConfirmar(t, a) {
  const { p, tela } = t;
  const d = dlg(p);
  await d.waitFor({ timeout: 15000 });
  const antes = await lerDialogo(d);
  const naoAchados = {};
  const ac = async (campo, id, txt) => { if (txt == null || txt === '') return; const r = await acDialogo(t, d, id, txt); if (!r.ok) naoAchados[campo] = r.opcoes; };
  await ac('conta', 'contaBancariaCaixa', a.conta);
  if (a.tipo) { await d.locator('p-radiobutton').nth(a.tipo === 'C' ? 0 : 1).locator('.p-radiobutton-box').click(); await tela.pronto(p, 400); }
  await ac('classificacao', 'classificacaoFinanceira', a.classificacao);
  if (a.documento != null) await d.locator('input#numeroDocumento').fill(String(a.documento));
  if (a.descricao != null) await d.locator('input#descricao').fill(String(a.descricao));
  if (a.valor != null) await tela.digitar(p, d.locator('input#valor'), tela.moeda(a.valor), { tab: false });
  if (a.data) await tela.data(p, d.locator('input[name=dataConciliacao]'), a.data);
  await ac('pessoa', 'filtro-pessoa', a.pessoa);
  if (a.centro && !(await d.locator('input#centroResultadoDetalhe').isDisabled())) await ac('centro', 'centroResultadoDetalhe', a.centro);
  await ac('historicoContabil', 'historico', a.historicoContabil);
  if (a.conciliado != null && (await lerDialogo(d)).conciliado !== !!a.conciliado) { await d.locator('#conciliado .p-checkbox-box').click(); await tela.pronto(p, 300); }
  const preenchido = await lerDialogo(d);
  const r = await observar(t, d.getByRole('button', { name: 'Confirmar', exact: true }), { minimo: 2500 });
  const obrigatorios = await p.evaluate(() => {
    const tit = [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && /Campos? obrigat[oó]rios?/i.test((e.textContent || '').trim()) && (e.textContent || '').trim().length < 40 && e.getClientRects().length);
    if (!tit) return null;
    let b = tit; for (let i = 0; i < 4 && b.parentElement; i++) { b = b.parentElement; if (b.innerText.replace(tit.textContent, '').trim()) break; }
    return b.innerText.split(/\n/).map((x) => x.trim()).filter((x) => x && x !== tit.textContent.trim());
  });
  return {
    antes, preenchido, naoAchados, toasts: r.eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)), eventos: r.eventos,
    errosApi: r.errosApi, obrigatorios, dialogoAberto: (await dlg(p).count()) > 0,
  };
}

async function cancelar(t) { const d = dlg(t.p); if (await d.count()) { await d.getByRole('button', { name: 'Cancelar', exact: true }).click(); await t.tela.pronto(t.p, 500); } }

module.exports = { dlg, lerDialogo, preencherEConfirmar, cancelar };
