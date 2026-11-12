// Tela: Processos › Financeiro › Consulta DDA — abre o filtro de colunas de uma área (botão funil) e digita num campo.
// args: { area: 'DDA'|'Contas a Pagar', coluna: 'Pessoa' (cabeçalho), texto }  devolve { campos, linhasAntes, linhasDepois, linhas, chamadas }
const { limpo } = require('./_apoio');

module.exports = {
  async filtroColunasDda(t, { area, coluna, texto }) {
    const { p, tela } = t;
    const a = p.locator('.area').filter({ has: p.locator('.area-titulo .titulo', { hasText: new RegExp(`^\\s*${area}\\s*$`) }) }).first();
    const chamadas = [];
    const ouvir = (r) => { if (/consulta-dda/.test(r.url())) chamadas.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')} ${(r.request().postData() || '').slice(0, 300)}`); };
    const linhasAntes = await a.locator('tbody tr.linha').count();
    const bt = a.locator('button.btn-filtro-coluna');
    if (!(await a.locator('button.btn-filtro-coluna.ativo').count())) { await bt.click(); await tela.pronto(p, 400); }
    const campos = await a.evaluate((el) => { const tr = el.querySelectorAll('thead tr'); return tr[1] ? [...tr[1].querySelectorAll('th')].map((th) => (th.querySelector('input') ? 'input' : '-')) : []; });
    let linhas = [];
    if (coluna) {
      const ths = (await a.locator('thead tr').first().locator('th').allInnerTexts()).map(limpo);
      const i = ths.findIndex((x) => x === coluna);
      if (i < 0) throw new Error(`coluna "${coluna}" não existe na área ${area} (tem: ${ths.join(' | ')})`);
      p.on('response', ouvir);
      try {
        const inp = a.locator('thead tr').nth(1).locator('th').nth(i).locator('input');
        await inp.click(); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
        if (texto) await p.keyboard.type(String(texto), { delay: 40 });
        await tela.pronto(p, 900);
      } finally { p.off('response', ouvir); }
      linhas = (await a.locator('tbody tr.linha').allInnerTexts()).map((x) => limpo(x.replace(/\s*\n\s*/g, ' | ')));
    }
    return { campos, linhasAntes, linhasDepois: await a.locator('tbody tr.linha').count(), linhas: linhas.slice(0, 40), chamadas };
  },
};
