// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
const { limpo } = require('../../_comum');
const { acharLinha, abrirMenuLinha, botoesDoDialogo } = require('./_apoio');

module.exports = {
  // ⋮ da linha → "Visualizar detalhes": lê o modal inteiro (campos rótulo/valor, histórico, botões, campos editáveis) e fecha.
  // A grade precisa estar pesquisada. args: { nossoNumero, fechar?: true }
  // devolve { titulo, texto, campos: {rótulo: valor}, historico: { cabecalho, linhas }, editaveis: [...], botoes, toasts, errosApi, fechou }
  async verDetalhesRetorno(t, { nossoNumero, fechar = true }) {
    const { p, tela } = t;
    const ini = Date.now();
    const linha = await acharLinha(t, nossoNumero);
    const { itens, menu } = await abrirMenuLinha(t, linha);
    const i = itens.findIndex((x) => /Visualizar detalhes/i.test(x));
    if (i < 0) { await p.keyboard.press('Escape'); throw new Error(`"Visualizar detalhes" não está no menu (tem: ${itens.join(' | ')})`); }
    await menu.nth(i).click(); await tela.pronto(p, 800);
    const d = p.locator('.p-dialog:visible').last();
    await d.waitFor({ timeout: 15000 });
    const titulo = limpo(await d.locator('.p-dialog-header').first().innerText().catch(() => ''));
    const texto = (await d.innerText()).replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
    const campos = await d.evaluate((el) => {
      const o = {};
      el.querySelectorAll('.detalhe-label, .rotulo, label').forEach((lb) => {
        const k = lb.innerText.replace(/\s+/g, ' ').trim(); const v = lb.nextElementSibling;
        if (k) o[k] = v ? v.innerText.replace(/\s+/g, ' ').trim() : (lb.parentElement.innerText.replace(lb.innerText, '').replace(/\s+/g, ' ').trim());
      });
      return o;
    });
    const historico = await d.evaluate((el) => {
      const tb = [...el.querySelectorAll('table')].find((x) => /Data\/hora|Ação/i.test(x.innerText)) || el.querySelector('table');
      if (!tb) return null;
      return { cabecalho: [...tb.querySelectorAll('thead th')].map((x) => x.innerText.trim()), linhas: [...tb.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((x) => x.innerText.replace(/\s+/g, ' ').trim())) };
    });
    const editaveis = await d.evaluate((el) => [...el.querySelectorAll('input, textarea, select, [contenteditable=true], p-dropdown, p-autocomplete, p-calendar')]
      .filter((x) => x.offsetParent && !x.disabled && !x.readOnly && x.type !== 'hidden' && x.type !== 'checkbox')
      .map((x) => `${x.tagName.toLowerCase()}#${x.id || x.name || ''}`));
    const botoes = await botoesDoDialogo(d);
    const links = await d.locator('a').evaluateAll((as) => as.map((a) => `${a.innerText.trim()} → ${a.getAttribute('href')}`));
    const toasts = await tela.toasts(p);
    const errosApi = (await tela.evidencia(p, ini)).errosApi;
    let fechou = null; let fecharForaDaTela = null;
    if (fechar) {
      const b = d.getByRole('button', { name: 'Fechar', exact: true }).first();
      if (await b.count()) {
        // modal alto (histórico longo): o Fechar pode ficar abaixo da janela; rola com a roda do mouse sobre o modal, como a pessoa faria
        const fora = async () => b.evaluate((el) => { const r = el.getBoundingClientRect(); return r.bottom > innerHeight ? { botaoY: Math.round(r.y), janela: innerHeight } : null; });
        const antes = await fora();
        if (antes) {
          const cx = await d.boundingBox();
          await p.mouse.move(cx.x + cx.width / 2, cx.y + Math.min(cx.height, 600) / 2); await p.mouse.wheel(0, 3000); await tela.pronto(p, 400);
          fecharForaDaTela = { antes, depoisDaRolagem: await fora() };
        }
        try { await b.click({ timeout: 8000 }); } catch (e) { throw new Error(`o botão Fechar do modal não recebe o clique (fora da tela: ${JSON.stringify(fecharForaDaTela || await fora())}) — chamar com fechar:false para só ler`); }
        await tela.pronto(p, 400); fechou = !(await d.isVisible().catch(() => false));
      }
      else fechou = 'sem botão Fechar';
    }
    return { titulo, texto, campos, historico, editaveis, botoes, links, toasts, errosApi, fechou, fecharForaDaTela };
  },
};
