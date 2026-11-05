// Tela: Cadastros › Pessoa (/fiscal/pessoa/form, cadastro novo) → modal "Consulta CPF/CNPJ - Receita Federal"
const { limpo } = require('../../_comum');
const ap = require('./_apoio');

module.exports = {
  // Abre um cadastro novo, digita o documento no CPF/CNPJ e sai do campo (Tab); a modal abre com 11 ou 14 dígitos.
  // args: { documento: '00000000000191', dataNascimento?: 'dd/mm/aaaa' (informada no cadastro antes do documento), espera?: ms }
  // devolve { abriu, titulo, filtros: { cpfCnpj, dataNascimento, uf, pesquisarDados, cancelar, retornarDados }, abas, grade, rodape, avisos }
  async abrirConsultaReceita(t, { documento, dataNascimento, espera = 15000 }) {
    const { p, tela } = t;
    if (!documento) throw new Error('informe args.documento');
    await tela.abrir(p, '/fiscal/pessoa/form');
    const col = ap.coletor(p); await col.coletar();
    const ident = p.locator('input#identificacao').first();
    await ident.waitFor({ timeout: 30000 });
    if (dataNascimento) await tela.data(p, p.locator('#dataNascimento input, input#dataNascimento').first(), dataNascimento);
    await tela.digitar(p, ident, documento);
    const m = ap.modal(p);
    const ini = Date.now();
    while (Date.now() - ini < espera && !(await m.count())) { await col.coletar(); await p.waitForTimeout(250); }
    await col.coletar();
    const abriu = (await m.count()) > 0;
    const r = { abriu, msAteAbrir: abriu ? Date.now() - ini : null, cpfCnpjCadastro: await ident.inputValue() };
    if (!abriu) return { ...r, avisos: col.lista };
    await tela.pronto(p, 300);
    r.titulo = limpo(await m.locator('.p-dialog-header').first().innerText());
    r.focoEm = await p.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName));
    r.filtros = await ap.filtros(m);
    r.abas = (await m.locator('.p-selectbutton .p-button').allInnerTexts()).map(limpo);
    r.abaAtiva = limpo(await m.locator('.p-selectbutton .p-button.p-highlight').first().innerText().catch(() => ''));
    r.grade = await ap.gradeIes(p, m, { dicas: false });
    r.rodape = (await m.locator('.texto-atencao p').allInnerTexts()).map(limpo);
    r.calendarioCadastroAberto = (await p.locator('.p-datepicker:visible').count()) > 0;
    r.avisos = col.lista;
    return r;
  },
};
