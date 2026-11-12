// Tela: Processos › Financeiro › Consulta DDA — expande/recolhe um registro (seta da linha) ou usa "Expandir todos/Retrair todos".
// args: { area: 'DDA'|'Contas a Pagar', linha?: 0 (índice), todos?: true }  devolve { linkAntes, linkDepois, detalhes, qtdLinhas, qtdDetalhes, detalheLogoAbaixo }
const { limpo } = require('./_apoio');

module.exports = {
  async expandirDda(t, { area, linha = 0, todos = false }) {
    const { p, tela } = t;
    const a = p.locator('.area').filter({ has: p.locator('.area-titulo .titulo', { hasText: new RegExp(`^\\s*${area}\\s*$`) }) }).first();
    if (!(await a.count())) throw new Error(`área "${area}" não aparece na conciliação`);
    const link = a.locator('a.expandir-retrair').first();
    const linkAntes = limpo(await link.innerText().catch(() => ''));
    if (todos) await link.click();
    else {
      const ln = a.locator('tbody tr.linha').nth(linha);
      if (!(await ln.count())) throw new Error(`área "${area}" não tem a linha ${linha}`);
      await ln.locator('a.cursor-pointer').first().click();
    }
    await tela.pronto(p, 500);
    const r = await a.evaluate((el, i) => {
      const txt = (e) => (e.innerText || '').replace(/\s*\n\s*/g, ' | ').replace(/ /g, ' ').trim();
      const filhos = [...el.querySelectorAll('tbody tr')];
      const linhas = filhos.filter((x) => x.classList.contains('linha'));
      const alvo = linhas[i];
      const prox = alvo ? alvo.nextElementSibling : null;
      return {
        qtdLinhas: linhas.length, qtdDetalhes: filhos.filter((x) => x.classList.contains('linha-detalhe')).length,
        detalhes: filhos.filter((x) => x.classList.contains('linha-detalhe')).slice(0, 5).map(txt),
        detalheLogoAbaixo: !!(prox && prox.classList.contains('linha-detalhe')), detalheDaLinha: prox && prox.classList.contains('linha-detalhe') ? txt(prox) : null,
      };
    }, linha);
    return { linkAntes, linkDepois: limpo(await link.innerText().catch(() => '')), ...r };
  },
};
