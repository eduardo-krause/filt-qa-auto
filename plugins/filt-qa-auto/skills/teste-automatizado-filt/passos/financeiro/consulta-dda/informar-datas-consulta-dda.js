// Tela: Processos › Financeiro › Consulta DDA — informa as datas do filtro. null/omitido = não mexe; '' = apaga.
// args: { emissao?: [ini, fim], vencimento?: [ini, fim] } (dd/mm/aaaa)  devolve o estado dos filtros
const { painel, estadoFiltros } = require('./_apoio');

module.exports = {
  async datasDda(t, { emissao, vencimento } = {}) {
    const { p, tela } = t;
    const por = {
      dataEmissaoInicial: emissao && emissao[0], dataEmissaoFinal: emissao && emissao[1],
      dataVencimentoInicial: vencimento && vencimento[0], dataVencimentoFinal: vencimento && vencimento[1],
    };
    for (const [n, v] of Object.entries(por)) {
      if (v === null || v === undefined) continue;
      const inp = painel(p).locator(`p-calendar[name=${n}] input, input[name=${n}]`).first();
      await inp.click(); await tela.esperar(p, 150);
      await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
      if (v) await p.keyboard.type(v, { delay: 30 });
      await p.keyboard.press('Escape'); await tela.pronto(p, 250);
    }
    await painel(p).locator('h2').first().click().catch(() => {});
    await tela.pronto(p, 250);
    return estadoFiltros(p);
  },
};
