// Tela: Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido)
const { carregar } = require('./_apoio');

module.exports = {
  // Adiantamentos listados na janela "Gerar antecipações" do pedido (fecha sem salvar). → [ 'código ... saldo', ... ]
  async disponiveis(t, { pessoa, pedido }) {
    const { p, tela } = t;
    const linha = await carregar(t, { pessoa, pedido });
    await linha.locator('button[ptooltip="Gerar antecipações"]').click(); await tela.pronto(p, 800);
    await p.locator('.p-dialog:visible tbody tr').first().waitFor({ timeout: 20000 }).catch(() => {});
    const linhas = (await p.locator('.p-dialog:visible tbody tr').allInnerTexts()).map(tela.limpo).filter(Boolean);
    await tela.botao(p, 'Cancelar', { escopo: await tela.dialogo(p) }).catch(() => {});
    return linhas;
  },
};
