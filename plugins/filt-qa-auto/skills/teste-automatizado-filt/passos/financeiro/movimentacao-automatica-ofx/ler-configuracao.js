// Tela: Cadastros › Financeiro › Movimentação automática OFX (/financeiro/movimentacao-automatica-ofx/form?id=N) — lê o cadastro. Não altera.
const { ROTA, lerForm } = require('./_apoio');

module.exports = {
  // args: { id } → { titulo, tituloCard, descricao, conta, credito, debito, centro, tipo, conciliado, padroes:[[condicao,texto]],
  //   campos:[{rotulo,x,y}], temClassificacaoFinanceira, secaoPadroes, secaoPadroesY, inativo }
  async ler(t, { id }) {
    const { p, tela } = t;
    await tela.abrir(p, `${ROTA}/form?id=${id}`);
    await p.locator('input#descricao').waitFor({ timeout: 20000 });
    await tela.pronto(p, 600);
    const f = await lerForm(p);
    f.inativo = (await p.locator('.card-inativo:visible').count()) > 0;
    return f;
  },
};
