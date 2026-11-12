// Tela: Processos › Financeiro › Consulta DDA — troca a aba da conciliação (Não conciliados / Conciliados) e lê a tela.
// args: { aba: 'Conciliados'|'Não conciliados' }  devolve o mesmo de conciliacaoDda
module.exports = {
  async abaDda(t, { aba }) {
    const { p, tela } = t;
    const abas = p.locator('a.p-tabview-nav-link');
    const textos = (await abas.allInnerTexts()).map((x) => x.trim());
    const i = textos.findIndex((x) => x.toLowerCase() === aba.toLowerCase());
    if (i < 0) throw new Error(`aba "${aba}" não existe (tem: ${textos.join(' | ')})`);
    await abas.nth(i).click(); await tela.pronto(p, 800);
    return t.passos.financeiro.consultaDda.conciliacaoDda();
  },
};
