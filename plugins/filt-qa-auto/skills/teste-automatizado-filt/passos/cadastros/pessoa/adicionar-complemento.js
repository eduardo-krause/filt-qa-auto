// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — botão "Novo complemento" do card Pessoa. NÃO salva.
const c = require('./_complemento');

module.exports = {
  // Adiciona um complemento e preenche a aba Geral dele (perfil tributário, e-mail principal e de documento eletrônico, indicador).
  // args: { perfil?: 'Consumidor Final', email?: 'x@y.com', indicador?: 'Isento' }  devolve { complemento: N (1 = primeiro), estado }
  async adicionarComplemento(t, { perfil, email, indicador }) {
    const { p, tela } = t;
    const antes = await c.quantos(p);
    await tela.botao(p, 'Novo complemento', { noDialogo: false });
    for (let i = 0; i < 20 && (await c.quantos(p)) === antes; i++) await p.waitForTimeout(250);
    const n = await c.quantos(p);
    if (n !== antes + 1) throw new Error(`"Novo complemento" não criou um complemento (antes ${antes}, depois ${n})`);
    await c.preencherGeral(t, n, { perfil, email, indicador });
    return { complemento: n, estado: (await c.lerEstado(p)).complementos[n - 1] };
  },
};
