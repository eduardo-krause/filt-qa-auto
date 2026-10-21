// Tela: Processos › Financeiro › Remessa Bancária (/financeiro/gerar-remessa)
const fs = require('fs');
const path = require('path');
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  // Marca as linhas (índices ou textos contidos) e clica Gerar arquivo; salva o .REM em `pasta`.
  // args: { linhas: [0, 1] | ['21-1/1', ...], pasta, prefixo }  devolve { marcadas, arquivos, eventos, errosApi }
  async gerar(t, { linhas = [0], pasta, prefixo = 'remessa' }) {
    const { p, tela } = t;
    const rows = p.locator('vs-tabela-dinamica tbody tr:visible');
    const marcadas = [];
    for (const l of linhas) {
      const row = typeof l === 'number' ? rows.nth(l) : rows.filter({ hasText: l }).first();
      if (!(await row.count())) throw new Error(`linha ${l} não está na pesquisa da remessa`);
      marcadas.push(limpo(await row.innerText()).slice(0, 140));
      await row.locator('.p-checkbox-box').first().click(); await tela.pronto(p, 300);
    }
    const arquivos = [];
    const onD = async (d) => { fs.mkdirSync(pasta, { recursive: true }); const f = path.join(pasta, `${prefixo}_${d.suggestedFilename()}`); await d.saveAs(f); arquivos.push(f); };
    p.on('download', onD);
    let r;
    const nome = (await tela.temBotao(p, 'Gerar arquivo')) ? 'Gerar arquivo' : 'Transmitir';
    try { r = await observar(t, p.getByRole('button', { name: nome, exact: true }).first(), { minimo: 6000 }); }
    finally { p.off('download', onD); }
    // o confirm/diálogo de envio (se houver) fica registrado nos eventos
    return { marcadas, arquivos, eventos: r.eventos, errosApi: r.errosApi };
  },
};
