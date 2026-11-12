// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
// Ajudantes dos cenários desta tela (não é cenário).
// Componente da aba: <vs-retorno-boletos-hibridos>. Ids dos filtros: #estabelecimentoHibrido, #contaBancariaHibrido (só contas BB
// híbridas), #dataInicioHibrido / #dataFimHibrido, p-dropdown#situacaoHibrido, #pessoapessoaHibrido (vs-pessoa-complete),
// #documentoHibrido; botões Limpar / Filtrar; .botao-recolher-filtros (title "Recolher filtros", aria-expanded).
// Grade: p-table com colunas ordenáveis (p-sortable-column), ⋮ por linha (mat-menu), app-grid-paginator-footer.
// API (fiscal): POST /retorno-boleto/pesquisar, GET /retorno-boleto/{id}, POST /{id}/consultar-banco, POST /{id}/reprocessar,
// POST /retorno-boleto/aprovar {ids}.
const { limpo } = require('../../_comum');

const ROTA = '/financeiro/retorno-cobranca-bancaria';
const ABA = /Boletos?\s+h[íi]bridos?/i;

const escopo = (p) => p.locator('vs-retorno-boletos-hibridos').first();

// Abre a tela (se não estiver nela) e a aba Boleto híbrido. devolve { abas: [textos das abas], aba: texto da aba clicada }
async function abrirAba(t, { recarregar = false } = {}) {
  const { p, tela } = t;
  if (recarregar || !p.url().includes(ROTA)) await tela.abrir(p, ROTA);
  const aba = p.locator('.p-tabview-nav li').filter({ hasText: ABA }).first();
  await aba.waitFor({ timeout: 30000 });
  const abas = (await p.locator('.p-tabview-nav li').allInnerTexts()).map(limpo).filter(Boolean);
  if (!(await escopo(p).isVisible().catch(() => false))) { await aba.click(); await tela.pronto(p, 800); }
  await escopo(p).waitFor({ timeout: 30000 });
  return { abas, aba: limpo(await aba.innerText()) };
}

// O card Filtros recolhe sozinho depois do Filtrar (botão .botao-recolher-filtros, title "Expandir filtros", aria-expanded=false).
// Expande pelo clique no botão; devolve { antes, depois } (aria-expanded) — ou null se não houver o botão.
async function expandirFiltros(t) {
  const { p, tela } = t;
  const b = escopo(p).locator('.botao-recolher-filtros').first();
  if (!(await b.count())) return null;
  const antes = await b.getAttribute('aria-expanded');
  if (antes === 'false') { await b.click(); await tela.pronto(p, 500); }
  const depois = await b.getAttribute('aria-expanded');
  if (depois === 'false') throw new Error('o clique em "Expandir filtros" não expandiu o card Filtros');
  return { antes, depois };
}

// Valores atuais dos filtros
async function lerFiltros(p) {
  const e = escopo(p);
  const v = async (sel) => e.locator(sel).first().inputValue().catch(() => null);
  const recolher = e.locator('.botao-recolher-filtros').first();
  return {
    estabelecimento: await v('input#estabelecimentoHibrido'),
    conta: await v('input#contaBancariaHibrido'),
    contaHabilitada: await e.locator('input#contaBancariaHibrido').first().isEnabled().catch(() => null),
    dataIni: await v('input#dataInicioHibrido'),
    dataFim: await v('input#dataFimHibrido'),
    situacao: limpo(await e.locator('p-dropdown#situacaoHibrido .p-dropdown-label, #situacaoHibrido .p-dropdown-label').first().innerText().catch(() => '')),
    pessoa: await v('input#pessoapessoaHibrido'),
    documento: await v('input#documentoHibrido'),
    documentoPlaceholder: await e.locator('input#documentoHibrido').first().getAttribute('placeholder').catch(() => null),
    rotulos: (await e.locator('label').allInnerTexts()).map(limpo).filter(Boolean),
    botaoRecolher: (await recolher.count()) ? { title: await recolher.getAttribute('title'), expandido: await recolher.getAttribute('aria-expanded') } : null,
  };
}

// Mensagens de obrigatório/validação visíveis na aba + campos marcados como inválidos
async function lerObrigatorios(p) {
  const e = escopo(p);
  const msgs = (await e.locator('.p-error:visible, .invalid-feedback:visible, .validation-message:visible, small:visible, .text-danger:visible').allInnerTexts()).map(limpo).filter(Boolean);
  const invalidos = await e.locator('.ng-invalid.ng-dirty, .ng-invalid.ng-touched, .p-invalid').evaluateAll((els) => [...new Set(els.map((x) => x.id || x.getAttribute('name') || x.getAttribute('inputid') || x.tagName.toLowerCase()))]);
  return { mensagens: msgs, invalidos };
}

// Linhas da grade (todas as colunas) + se a seleção da linha está habilitada/marcada
async function lerGrid(p) {
  const e = escopo(p);
  const cab = (await e.locator('table thead th').allInnerTexts()).map(limpo);
  const linhas = await e.locator('table tbody tr').evaluateAll((trs, cab) => trs.map((tr) => {
    const tds = [...tr.querySelectorAll('td')];
    if (tds.length < 3) return { vazio: tr.innerText.replace(/\s+/g, ' ').trim() };
    const o = {};
    tds.forEach((td, i) => { const k = cab[i] || (i === 0 ? 'Seleção' : 'col' + i); if (k !== 'Seleção' && k !== '' && k !== 'Ações') o[k] = td.innerText.replace(/\s+/g, ' ').trim(); });
    const chk = tds[0].querySelector('.p-checkbox');
    const inp = tds[0].querySelector('input');
    o._selecao = chk ? { habilitada: !(chk.classList.contains('p-checkbox-disabled') || (inp && inp.disabled) || tds[0].querySelector('.p-disabled')), marcada: !!tds[0].querySelector('.p-highlight, .p-checkbox-checked') || !!(inp && inp.checked) } : null;
    const link = tr.querySelector('a');
    if (link) o._link = link.getAttribute('href');
    const sit = tr.querySelector('[class*=situacao-], .status-label');
    if (sit) o._classeSituacao = sit.className;
    return o;
  }), cab);
  return { cabecalho: cab, linhas: linhas.filter((l) => !l.vazio), vazio: (linhas.find((l) => l.vazio) || {}).vazio || null };
}

// Contador "N Selecionados - R$ x", botão Aprovar selecionados e paginação
async function lerRodape(p) {
  const e = escopo(p);
  const txt = limpo(await e.innerText());
  const contador = (txt.match(/\d+\s+selecionados?\s*[-•–]\s*R\$\s*[\d.,]+/i) || [null])[0];
  const ap = e.getByRole('button', { name: /Aprovar selecionados/i }).first();
  const aprovar = (await ap.count()) ? { texto: limpo(await ap.innerText()), habilitado: await ap.isEnabled() } : null;
  const pag = e.locator('app-grid-paginator-footer, .p-paginator').first();
  const paginacao = (await pag.count()) ? limpo(await pag.innerText()) : null;
  const total = paginacao ? Number((paginacao.match(/de\s+(\d+)/) || [])[1]) : null;
  return { contador, aprovar, paginacao, total };
}

// Linha da grade pelo nosso número (texto da coluna "Nosso número"; aceita com ou sem zeros à esquerda)
async function linhaPorNossoNumero(p, nossoNumero) {
  const e = escopo(p);
  const alvo = String(nossoNumero).replace(/^0+/, '');
  const trs = e.locator('table tbody tr');
  const n = await trs.count();
  for (let i = 0; i < n; i++) {
    const tx = await trs.nth(i).innerText();
    if (tx.split(/\s+/).some((x) => x.replace(/^0+/, '') === alvo)) return trs.nth(i);
  }
  return null;
}

// Linha pelo nosso número, passando pelas páginas da grade se preciso
async function acharLinha(t, nossoNumero) {
  const { p, tela } = t;
  let l = await linhaPorNossoNumero(p, nossoNumero);
  const prim = escopo(p).locator('.p-paginator-first').first();
  if (!l && (await prim.count()) && !(await prim.getAttribute('class')).includes('p-disabled')) { await prim.click(); await tela.pronto(p, 400); l = await linhaPorNossoNumero(p, nossoNumero); }
  const prox = escopo(p).locator('.p-paginator-next').first();
  for (let i = 0; !l && i < 20 && (await prox.count()) && (await prox.isEnabled()) && !(await prox.getAttribute('class')).includes('p-disabled'); i++) {
    await prox.click(); await tela.pronto(p, 400);
    l = await linhaPorNossoNumero(p, nossoNumero);
  }
  if (!l) throw new Error(`nosso número ${nossoNumero} não aparece na grade (pesquisar antes com o período/situação certos)`);
  return l;
}

// Abre o ⋮ (mat-menu) da linha e devolve { itens: [textos], menu: locator dos itens }
async function abrirMenuLinha(t, linha) {
  const { p, tela } = t;
  await linha.locator('td').last().locator('button').first().click();
  await tela.pronto(p, 400);
  const itens = p.locator('.mat-menu-panel:visible button, .mat-mdc-menu-panel:visible button, [role=menu]:visible [role=menuitem]');
  await itens.first().waitFor({ timeout: 5000 }).catch(() => {});
  return { itens: (await itens.allInnerTexts()).map(limpo).filter(Boolean), menu: itens };
}

// Coleta toasts (eles somem) enquanto espera a tela acalmar depois de uma ação
async function observarToasts(t, acao, { minimo = 2500 } = {}) {
  const { p, tela } = t;
  const vistos = []; const ini = Date.now();
  const coleta = async () => { for (const x of await tela.toasts(p)) if (!vistos.includes(x)) vistos.push(x); };
  await acao();
  let fim = false;
  const espera = tela.pronto(p, 600).finally(() => { fim = true; });
  while (!fim || Date.now() - ini < minimo) { await coleta(); await p.waitForTimeout(300); }
  await espera; await coleta();
  const ev = await tela.evidencia(p, ini);
  return { toasts: vistos, errosApi: ev.errosApi || [] };
}

// Escolhe uma ação do ⋮ da linha que chama a API na hora (Consultar no banco / Reprocessar) e devolve o que a tela mostrou:
// { situacaoAntes, situacaoDepois, acoes, toasts, errosApi, api: [{ metodo, url, status, corpo }] }
async function acaoDoMenu(t, nossoNumero, rotulo, padraoApi) {
  const { p, tela } = t;
  const situacao = async () => { const l = await acharLinha(t, nossoNumero); return (await l.locator('.status-label, [class*=situacao-]').first().innerText().catch(() => '')).trim(); };
  const situacaoAntes = await situacao();
  const linha = await acharLinha(t, nossoNumero);
  const { itens, menu } = await abrirMenuLinha(t, linha);
  const i = itens.findIndex((x) => x === rotulo);
  if (i < 0) { await p.keyboard.press('Escape'); await tela.pronto(p, 300); return { situacaoAntes, acoes: itens, naoDisponivel: `"${rotulo}" não está no menu desta linha` }; }
  const api = [];
  const onResp = async (r) => {
    if (!/\/retorno-boleto\//.test(r.url())) return;
    const item = { metodo: r.request().method(), url: r.url().replace(/^https?:\/\/[^/]+/, ''), status: r.status() };
    if (padraoApi.test(r.url())) item.corpo = (await r.text().catch(() => '')).slice(0, 600);
    api.push(item);
  };
  p.on('response', onResp);
  let obs;
  try { obs = await observarToasts(t, () => menu.nth(i).click(), { minimo: 3500 }); } finally { p.off('response', onResp); }
  return { situacaoAntes, situacaoDepois: await situacao(), acoes: itens, toasts: obs.toasts, errosApi: obs.errosApi, api };
}

// Texto do diálogo visível pelo título
async function dialogoPorTitulo(p, titulo) {
  const d = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: titulo }) }).last();
  return (await d.count()) ? d : null;
}

async function botoesDoDialogo(d) {
  return d.locator('button').evaluateAll((bs) => bs.filter((b) => b.offsetParent).map((b) => ({ texto: b.innerText.replace(/\s+/g, ' ').trim() || b.getAttribute('aria-label') || b.className, habilitado: !b.disabled })));
}

module.exports = { ROTA, escopo, abrirAba, expandirFiltros,lerFiltros, lerObrigatorios, lerGrid, lerRodape, linhaPorNossoNumero, acharLinha, abrirMenuLinha, observarToasts, acaoDoMenu,dialogoPorTitulo, botoesDoDialogo };
