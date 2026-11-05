// Tela: Cadastros › Pessoa (/fiscal/pessoa/form?id=N) — pessoa já gravada
const ap = require('./_apoio');

module.exports = {
  // Abre a pessoa gravada e lê a seção Pessoa e cada complemento (Geral, Endereços com o detalhe pelo lápis, Produtor Rural).
  // args: { id }  devolve { url, pessoa: [{rotulo, valor}], complementos: [{ cabecalho, principal, geral, enderecos, produtorRural }] }
  async lerPessoaCadastrada(t, { id }) {
    const { p, tela } = t;
    if (!id) throw new Error('informe args.id');
    await tela.abrir(p, '/fiscal/pessoa/form?id=' + id);
    const ident = p.locator('input#identificacao:visible').first();
    await ident.waitFor({ timeout: 30000 });
    for (let i = 0; i < 60 && !(await ident.inputValue()); i++) await p.waitForTimeout(250);
    await tela.pronto(p, 500);
    return { url: p.url().replace(/^https?:\/\/[^/]+/, ''), ...(await ap.lerCadastro(p)) };
  },
};
