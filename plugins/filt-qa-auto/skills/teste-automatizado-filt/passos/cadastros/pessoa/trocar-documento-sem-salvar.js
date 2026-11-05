// Tela: Cadastros › Pessoa (/fiscal/pessoa/form?id=N, pessoa já cadastrada) — edição sem salvar
const ap = require('./_apoio');

module.exports = {
  // Abre a pessoa existente, troca o CPF/CNPJ e sai do campo (Tab); observa se a modal "Consulta CPF/CNPJ - Receita Federal"
  // abre. Depois recarrega a página SEM salvar (descarta a edição) e lê o documento de novo.
  // args: { id, documento, espera?: 8000 }
  // devolve { valorAntes, campoBloqueado (CPF/CNPJ disabled na edição → nada é digitado), valorDigitado, modalAbriu, msAteAbrir, avisos, valorAposRecarregar }
  async trocarDocumentoSemSalvar(t, { id, documento, espera = 8000 }) {
    const { p, tela } = t;
    if (!id || !documento) throw new Error('informe args.id e args.documento');
    await tela.abrir(p, '/fiscal/pessoa/form?id=' + id);
    const ident = p.locator('input#identificacao:visible').first();
    await ident.waitFor({ timeout: 30000 });
    // espera a pessoa carregar no formulário (o documento chega depois da tela)
    for (let i = 0; i < 60 && !(await ident.inputValue()); i++) await p.waitForTimeout(250);
    await tela.pronto(p, 300);
    const r = { valorAntes: await ident.inputValue(), campoBloqueado: await ident.isDisabled() };
    // campo bloqueado na edição: não dá para trocar o documento (devolve sem digitar)
    if (r.campoBloqueado) { r.valorDigitado = r.valorAntes; r.modalAbriu = (await ap.modal(p).count()) > 0; r.avisos = []; r.valorAposRecarregar = r.valorAntes; return r; }
    const col = ap.coletor(p);
    await tela.digitar(p, ident, documento);
    const m = ap.modal(p); const ini = Date.now();
    while (Date.now() - ini < espera && !(await m.count())) { await col.coletar(); await p.waitForTimeout(250); }
    r.modalAbriu = (await m.count()) > 0; if (r.modalAbriu) r.msAteAbrir = Date.now() - ini;
    r.valorDigitado = await ident.inputValue();
    await col.coletar(); r.avisos = col.lista;
    if (r.modalAbriu) await m.getByRole('button', { name: 'Cancelar', exact: true }).click().catch(() => {});
    // descarta a edição: recarrega sem salvar
    await p.reload({ waitUntil: 'domcontentloaded' }); await tela.pronto(p, 800);
    await ident.waitFor({ timeout: 30000 });
    r.valorAposRecarregar = await ident.inputValue();
    return r;
  },
};
