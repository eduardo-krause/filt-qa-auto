// Tela: Cadastros › Financeiro › Movimentação automática OFX (/financeiro/movimentacao-automatica-ofx) — listagem: ordena, pagina, filtra e lê.
const { ROTA, limpo } = require('./_apoio');

async function estado(p) {
  return p.evaluate(() => {
    const vis = (e) => !!(e && e.getClientRects().length);
    const g = document.querySelector('app-grid');
    const ths = [...g.querySelectorAll('thead th')].filter(vis);
    const colunas = ths.map((x) => x.innerText.trim()).filter(Boolean);
    const colunasOrdenaveis = ths.filter((x) => /p-sortable-column/.test(x.className)).map((x) => x.innerText.trim());
    const ordem = ths.filter((x) => /p-highlight/.test(x.className) || x.getAttribute('aria-sort') && x.getAttribute('aria-sort') !== 'none')
      .map((x) => ({ coluna: x.innerText.trim(), sentido: x.getAttribute('aria-sort') || ((x.querySelector('.pi-sort-amount-up-alt, .pi-sort-up') && 'ascending') || (x.querySelector('.pi-sort-amount-down, .pi-sort-down') && 'descending') || '?') }));
    const trs = [...g.querySelectorAll('tbody tr.table-body-line')].filter(vis);
    // linha inativa usa outra classe de célula: ler as 3 primeiras td de qualquer classe e tirar o selo "Inativo"
    const linhas = trs.map((r) => [...r.querySelectorAll('td')].slice(0, 3).map((td) => td.innerText.replace(/\bInativo\b/g, '').trim()));
    const inativas = trs.map((r) => /\bInativo\b/.test(r.innerText));
    const lixeiraPorLinha = trs.map((r) => !!r.querySelector('app-remover a'));
    const corpo = g.querySelector('tbody');
    const vazio = trs.length ? null : (corpo ? corpo.innerText.replace(/\s+/g, ' ').trim() : null);
    const m = g.innerText.replace(/\s+/g, ' ').match(/(\d+ - \d+ de \d+|0 de 0|Nenhum[^|]*?)(?= \d| Linhas|$)/);
    const rodape = m ? m[1].trim() : null;
    const linhasPorPagina = ((g.querySelector('p-dropdown .p-dropdown-label') || {}).textContent || '').trim();
    const sb = [...document.querySelectorAll('vs-filtro .p-sidebar')][0];
    const aberto = !!(sb && vis(sb) && getComputedStyle(sb).opacity !== '0' && sb.getBoundingClientRect().x < window.innerWidth - 50);
    const painel = sb ? {
      aberto,
      titulo: ((sb.querySelector('h2') || {}).textContent || '').trim(),
      campos: [...sb.querySelectorAll('label')].map((l) => l.textContent.trim()),
      valores: {
        codigo: (sb.querySelector('#filtro-id') || {}).value, descricao: (sb.querySelector('#filtro-descricao') || {}).value,
        tipo: ((sb.querySelector('#filtro-tipo .p-dropdown-label') || {}).textContent || '').trim(), situacao: ((sb.querySelector('#filtro-situacao .p-dropdown-label') || {}).textContent || '').trim(),
      },
    } : null;
    const tit = [...document.querySelectorAll('app-grid *')].find((e) => vis(e) && e.children.length === 0 && /Movimenta/i.test(e.textContent));
    const botoes = [...document.querySelectorAll('.breadcrumb-area button, app-grid button')].filter(vis).map((b) => b.innerText.trim()).filter(Boolean);
    return { titulo: tit ? tit.textContent.trim() : null, colunas, colunasOrdenaveis, ordem, linhas, inativas, lixeiraPorLinha, vazio, rodape, linhasPorPagina, botoes, painel };
  });
}

async function escolherDropdown(t, dd, opcao) {
  const { p, tela } = t;
  await dd.click(); await tela.pronto(p, 400);
  const ops = p.locator('li.p-dropdown-item:visible');
  const textos = (await ops.allInnerTexts()).map(limpo);
  const i = textos.findIndex((x) => x === String(opcao));
  if (i < 0) throw new Error(`opção "${opcao}" não existe (tem: ${textos.join(' | ')})`);
  await ops.nth(i).click(); await tela.pronto(p, 600);
  return textos;
}

module.exports = {
  // args: { ordenar:[{coluna, vezes}], linhasPorPagina, irPagina, filtros:{codigo,descricao,tipo,situacao}, limpar, fecharPainel }
  // Etapas na ordem: inicial → ordenar → linhasPorPagina → irPagina → filtros (abre painel, preenche, Filtrar) → limpar (Limpar do painel) → fecharPainel.
  // → { ...estado final, opcoesTipo, opcoesSituacao, opcoesLinhas, etapas:[{ etapa, ...estado }] }
  // estado = { titulo, colunas, colunasOrdenaveis, ordem, linhas:[[código,descrição,tipo]], lixeiraPorLinha, vazio, rodape, linhasPorPagina, botoes, painel:{aberto,titulo,campos,valores} }
  async listagem(t, { ordenar = [], linhasPorPagina, irPagina, filtros, limpar = false, fecharPainel = false } = {}) {
    const { p, tela } = t;
    const etapas = [];
    const reg = async (etapa) => { const e = await estado(p); etapas.push({ etapa, ...e }); return e; };
    await tela.abrir(p, ROTA);
    await p.locator('app-grid thead th').first().waitFor({ timeout: 20000 }); await tela.pronto(p, 600);
    let fim = await reg('inicial');
    for (const { coluna, vezes = 1 } of ordenar) {
      for (let i = 0; i < vezes; i++) {
        await p.locator('app-grid thead th.p-sortable-column').filter({ hasText: coluna }).first().click(); await tela.pronto(p, 600);
        fim = await reg(`ordenar ${coluna} #${i + 1}`);
      }
    }
    let opcoesLinhas = null; let opcoesTipo = null; let opcoesSituacao = null;
    if (linhasPorPagina) { opcoesLinhas = await escolherDropdown(t, p.locator('app-grid p-dropdown .p-dropdown').first(), linhasPorPagina); fim = await reg(`linhasPorPagina ${linhasPorPagina}`); }
    if (irPagina) { await p.locator('app-grid .p-paginator-pages button').filter({ hasText: new RegExp(`^${irPagina}$`) }).first().click(); await tela.pronto(p, 600); fim = await reg(`irPagina ${irPagina}`); }
    const sb = p.locator('vs-filtro .p-sidebar');
    if (filtros) {
      await p.locator('app-grid button[data-title="Filtrar"]').first().click(); await tela.pronto(p, 600);
      fim = await reg('painel aberto');
      if (filtros.codigo != null) await sb.locator('#filtro-id').fill(String(filtros.codigo));
      if (filtros.descricao != null) await sb.locator('#filtro-descricao').fill(String(filtros.descricao));
      opcoesTipo = filtros.tipo ? await escolherDropdown(t, sb.locator('#filtro-tipo .p-dropdown'), filtros.tipo) : null;
      opcoesSituacao = filtros.situacao ? await escolherDropdown(t, sb.locator('#filtro-situacao .p-dropdown'), filtros.situacao) : null;
      await sb.getByRole('button', { name: 'Filtrar', exact: true }).click(); await tela.pronto(p, 800);
      fim = await reg('filtrado');
    }
    if (limpar) {
      if (!(fim.painel && fim.painel.aberto)) { await p.locator('app-grid button[data-title="Filtrar"]').first().click(); await tela.pronto(p, 600); }
      await sb.getByRole('button', { name: 'Limpar', exact: true }).click(); await tela.pronto(p, 800);
      fim = await reg('limpo');
    }
    if (fecharPainel && fim.painel && fim.painel.aberto) { await sb.locator('.p-sidebar-close').click(); await tela.pronto(p, 600); fim = await reg('painel fechado'); }
    return { ...fim, opcoesTipo, opcoesSituacao, opcoesLinhas, etapas };
  },
};
