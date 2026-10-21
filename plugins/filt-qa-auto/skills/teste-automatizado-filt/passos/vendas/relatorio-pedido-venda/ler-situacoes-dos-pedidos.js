// Tela: Relatórios › Pedido de Venda (/vendas/relatorios/pedido-venda)

module.exports = {
  // args: { data: 'dd/mm/aaaa' (emissão inicial e final), pessoa? }  → { '<pedido>': { situacao, status } }
  async situacoes(t, { data, pessoa }) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/relatorios/pedido-venda');
    for (const n of ['dataInicial', 'dataFinal']) await tela.data(p, p.locator(`input[name=${n}]`), data);
    if (pessoa) await tela.autocomplete(p, p.locator('label:text-is("Pessoa")').first().locator('xpath=following::input[1]'), pessoa);
    await tela.botao(p, 'Filtrar', { noDialogo: false });
    await tela.pronto(p, 2000, { limite: 180000 });
    const texto = tela.limpo(await p.locator('body').innerText());
    const re = /Pedido: (\d+) .*?Situação: (Pago|A pagar|A Pagar) .*?Status: ([A-Za-zÀ-ú\/ ]+?) (?=Pessoa)/g;
    const out = {}; let m;
    while ((m = re.exec(texto))) out[m[1]] = { situacao: m[2], status: m[3].trim() };
    return out;
  },
};
