// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — cadastro novo já aberto (sem recarregar)
const ap = require('./_apoio');

module.exports = {
  // Troca o CPF/CNPJ do cadastro aberto (digita e sai do campo) e observa se a modal "Consulta CPF/CNPJ - Receita Federal" abre.
  // args: { documento, espera?: 15000 }  devolve { valorAntes, valorDepois, modalAbriu, msAteAbrir, filtros (se abriu), avisos }
  async trocarDocumentoDoCadastro(t, { documento, espera = 15000 }) {
    const { p, tela } = t;
    if (!documento) throw new Error('informe args.documento');
    const ident = p.locator('input#identificacao:visible').first();
    await ident.waitFor({ timeout: 30000 });
    const r = { valorAntes: await ident.inputValue() };
    const col = ap.coletor(p);
    await tela.digitar(p, ident, documento);
    const m = ap.modal(p); const ini = Date.now();
    while (Date.now() - ini < espera && !(await m.count())) { await col.coletar(); await p.waitForTimeout(250); }
    r.modalAbriu = (await m.count()) > 0;
    if (r.modalAbriu) { r.msAteAbrir = Date.now() - ini; await tela.pronto(p, 300); r.filtros = await ap.filtros(m); }
    r.valorDepois = await ident.inputValue();
    await col.coletar(); r.avisos = col.lista;
    return r;
  },
};
