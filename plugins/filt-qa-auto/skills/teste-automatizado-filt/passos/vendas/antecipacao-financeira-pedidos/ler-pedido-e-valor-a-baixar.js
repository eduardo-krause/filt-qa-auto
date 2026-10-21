// Tela: Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido)
const { carregar, moedaTela } = require('./_apoio');

module.exports = {
  // Linha do pedido na tela + "Valor a baixar" oferecido. args: { pessoa, pedido }  → { linha, valorOferecido }
  async ler(t, a) {
    const linha = await carregar(t, a);
    const v = await linha.locator('input').last().inputValue().catch(() => '');
    return { linha: t.tela.limpo(await linha.innerText()), valorOferecido: moedaTela(v) };
  },
};
