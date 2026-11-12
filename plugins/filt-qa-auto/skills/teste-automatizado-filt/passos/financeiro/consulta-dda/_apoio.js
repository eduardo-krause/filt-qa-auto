// Tela: Processos › Financeiro › Consulta DDA (/financeiro/consulta-dda) — ajudantes dos cenários (não é cenário)
const { limpo } = require('../../_comum');
const ROTA = '/financeiro/consulta-dda';
const painel = (p) => p.locator('.p-sidebar').first();
const grupo = (p, rotulo) => painel(p).locator('.form-group').filter({ has: p.locator(`label:text-is("${rotulo}")`) }).first();

// lê o estado do painel de filtros
async function estadoFiltros(p) {
  return p.evaluate(() => {
    const sb = [...document.querySelectorAll('.p-sidebar')].find((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    if (!sb) return { aberto: false };
    const rs = sb.getBoundingClientRect();
    const aberto = rs.x < window.innerWidth - 60 && rs.right > 0;
    const chips = (sel) => {
      const a = sb.querySelector(sel);
      if (!a) return null;
      const ts = [...a.querySelectorAll('.p-autocomplete-token-label, .p-multiselect-token-label')].map((x) => x.textContent.trim());
      return ts.length ? ts : [...a.querySelectorAll('.p-autocomplete-token, .p-multiselect-token')].map((x) => x.textContent.trim());
    };
    const val = (n) => { const e = sb.querySelector(`[name=${n}] input, input[name=${n}]`); return e ? e.value : null; };
    const ms = sb.querySelector('p-multiselect[name=situacaoDda]');
    const conta = sb.querySelector('[name=contaDda]');
    const chipsConta = chips('[name=contaDda]') || [];
    const textoConta = conta ? (chipsConta.join(', ') || (conta.querySelector('input') || {}).value || '') : null;
    const mensagens = [...sb.querySelectorAll('small, .p-error, .text-danger, .invalid-feedback, .mensagem, .aviso, .alert, span.erro')]
      .filter((e) => e.getClientRects().length).map((e) => e.textContent.trim()).filter(Boolean);
    const invalidos = [...sb.querySelectorAll('.ng-invalid.ng-dirty, .ng-invalid.ng-touched, .p-invalid')]
      .filter((e) => e.getClientRects().length).map((e) => e.id || e.getAttribute('name') || e.tagName.toLowerCase());
    // painel padrão "Campos obrigatórios" (fica fora do sidebar) e o "Obrigatório" embaixo de cada campo
    const tit = [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Campos obrigatórios' && e.getClientRects().length);
    let painelObrig = null;
    if (tit) { let b = tit; for (let i = 0; i < 4 && b.parentElement; i++) { b = b.parentElement; if (b.innerText.replace('Campos obrigatórios', '').trim()) break; } painelObrig = b.innerText.split(/\n/).map((x) => x.trim()).filter((x) => x && x !== 'Campos obrigatórios'); }
    const obrigatorioSob = [...sb.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Obrigatório' && e.getClientRects().length)
      .map((e) => { const g = e.closest('.form-group') || e.parentElement.parentElement; const l = g && g.querySelector('label'); return l ? l.textContent.replace('*', '').trim() : '?'; });
    return {
      aberto, painelObrigatorios: painelObrig, obrigatorioSob: [...new Set(obrigatorioSob)],
      empresa: chips('#empresa'), estabelecimento: chips('#filial'), pessoa: (() => { const c = chips('#pessoa') || []; if (c.length) return c; const i = sb.querySelector('#pessoa input, [name=pessoa] input'); return i && i.value ? [i.value.trim()] : []; })(), conta: textoConta,
      emissao: [val('dataEmissaoInicial'), val('dataEmissaoFinal')],
      vencimento: [val('dataVencimentoInicial'), val('dataVencimentoFinal')],
      situacao: ms ? [...ms.querySelectorAll('.p-multiselect-token-label')].map((x) => x.textContent.trim()) : null,
      situacaoTexto: ms ? ((ms.querySelector('.p-multiselect-label') || {}).textContent || '').trim() : null,
      mensagens: [...new Set(mensagens)], invalidos: [...new Set(invalidos)],
    };
  });
}

const lerSelecao = (p, area) => p.evaluate((nome) => {
  const a = [...document.querySelectorAll('.area')].find((x) => (x.querySelector('.area-titulo .titulo') || {}).textContent?.trim() === nome);
  if (!a) return null;
  const ls = [...a.querySelectorAll('tbody tr.linha')];
  const marcadas = []; const destacadas = []; const linhasMarcadas = [];
  ls.forEach((l, i) => {
    if ((l.querySelector('.p-checkbox-box') || {}).getAttribute?.('aria-checked') === 'true') { marcadas.push(i); linhasMarcadas.push(l.innerText.replace(/\s+/g, ' ').trim()); }
    if (/selecionad/.test(l.className)) destacadas.push(i);
  });
  const b = document.getElementById('confirmarDda');
  const desf = [...a.querySelectorAll('span, a, button')].some((e) => /Desfazer sele/i.test(e.textContent || '') && e.getClientRects().length);
  return { marcadas, destacadas, linhasMarcadas, total: ((a.querySelector('.rodape strong') || {}).textContent || '').replace(/\s/g, ' ').trim(), confirmarHabilitado: b ? !b.disabled : null, desfazerVisivel: desf };
}, area);


module.exports = { ROTA, painel, grupo, estadoFiltros, limpo, lerSelecao };
