// Tela: Processos › Financeiro › Gestão Caixa e Bancos — ⋮ do extrato › "Nova Transferência" (diálogo Transferência Bancária).
const { observar, limpo } = require('../../_comum');
const { abrirConta } = require('./_apoio');

async function ac(t, inp, texto) {
  const { p, tela } = t;
  await inp.scrollIntoViewIfNeeded(); await inp.click(); await inp.fill('');
  await p.keyboard.type(String(texto), { delay: 40 }); await tela.pronto(p, 900);
  const ops = p.locator('.p-autocomplete-panel:visible li');
  await ops.first().waitFor({ timeout: 6000 }).catch(() => {});
  const textos = (await ops.allInnerTexts()).map(limpo);
  const i = textos.findIndex((x) => x.includes(texto));
  if (i < 0) return textos;
  await ops.nth(i).click(); await tela.pronto(p, 400);
  return null;
}

module.exports = {
  // args: { contaOrigem, contaDestino, data, valor (número), historico (mín. 10 letras; vai para origem e destino), documento, centro (padrão: mantém o sugerido) }
  // → { antes, preenchido, naoAchados, toasts, eventos, errosApi, obrigatorios, dialogoAberto, idLancamento (banco), idsNovos }
  async novaTransferencia(t, { contaOrigem, contaDestino, data, valor, historico, documento, centro }) {
    const { p, tela } = t;
    await abrirConta(t, { conta: contaOrigem });
    await p.locator('#movBancaria').locator('xpath=following-sibling::button[1]').click(); await tela.pronto(p, 400);
    await p.locator('.dropdown-menu.show button').filter({ hasText: 'Nova Transferência' }).first().click(); await tela.pronto(p, 800);
    const d = p.locator('.p-dialog:visible').filter({ hasText: 'Transferência Bancária' }).last();
    await d.waitFor({ timeout: 15000 });
    const ler = () => d.evaluate((dl) => {
      const vs = (sel) => [...dl.querySelectorAll(sel)].map((e) => e.value);
      return { contas: vs('input#contaBancariaCaixa'), centroOrigem: (dl.querySelector('input#centroResultadoDetalheOrigem') || {}).value, centroDestino: (dl.querySelector('input#centroResultadoDetalheDestino') || {}).value,
        historicoOrigem: (dl.querySelector('#historicoOrigem') || {}).value, historicoDestino: (dl.querySelector('#historicoDestino') || {}).value, documento: (dl.querySelector('#numeroDocumento') || {}).value,
        data: (dl.querySelector('#dataLancamento input, input#dataLancamento') || {}).value, valor: (dl.querySelector('input#valor') || {}).value };
    });
    const antes = await ler();
    const naoAchados = {};
    const contas = d.locator('input#contaBancariaCaixa');
    if (contaOrigem && !String(antes.contas[0] || '').includes(contaOrigem)) { const r = await ac(t, contas.nth(0), contaOrigem); if (r) naoAchados.contaOrigem = r; }
    if (contaDestino) { const r = await ac(t, contas.nth(1), contaDestino); if (r) naoAchados.contaDestino = r; }
    if (centro) { for (const id of ['centroResultadoDetalheOrigem', 'centroResultadoDetalheDestino']) { const r = await ac(t, d.locator(`input#${id}`), centro); if (r) naoAchados[id] = r; } }
    if (historico) { await d.locator('#historicoOrigem').fill(historico); await d.locator('#historicoDestino').fill(historico); }
    if (documento != null) await d.locator('#numeroDocumento').fill(String(documento));
    if (data) await tela.data(p, d.locator('#dataLancamento input, input#dataLancamento').first(), data);
    if (valor != null) await tela.digitar(p, d.locator('input#valor'), tela.moeda(valor), { tab: false });
    const preenchido = await ler();
    const idAntes = Number(await t.banco.valor('SELECT COALESCE(MAX(ID_LANCAMENTO),0) FROM LANCAMENTO')) || 0;
    const r = await observar(t, d.getByRole('button', { name: 'Confirmar', exact: true }), { minimo: 2500 });
    const aberto = (await p.locator('.p-dialog:visible').filter({ hasText: 'Transferência Bancária' }).count()) > 0;
    const obrigatorios = aberto ? await p.evaluate(() => [...document.querySelectorAll('.p-dialog *')].filter((e) => e.children.length === 0 && e.textContent.trim() === 'Obrigatório' && e.getClientRects().length).map((e) => { const g = e.closest('.form-group'); const l = g && g.querySelector('label'); return l ? l.textContent.trim() : '?'; })) : null;
    if (aberto) { await d.getByRole('button', { name: 'Cancelar', exact: true }).click(); await tela.pronto(p, 500); }
    const novos = aberto ? [] : (await t.banco.consultar('SELECT ID_LANCAMENTO ID FROM LANCAMENTO WHERE ID_LANCAMENTO > ? ORDER BY 1', [idAntes])).map((x) => Number(x.ID));
    return { antes, preenchido, naoAchados, toasts: r.eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)), eventos: r.eventos, errosApi: r.errosApi, obrigatorios, dialogoAberto: aberto, idLancamento: novos.length ? novos[novos.length - 1] : null, idsNovos: novos };
  },
};
