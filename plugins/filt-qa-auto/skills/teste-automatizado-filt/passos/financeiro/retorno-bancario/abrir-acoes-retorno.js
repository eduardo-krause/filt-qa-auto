// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
const { acharLinha, abrirMenuLinha } = require('./_apoio');

module.exports = {
  // Abre o ⋮ (coluna Ações) da linha do nosso número e lê as ações disponíveis; fecha o menu sem escolher.
  // A grade precisa estar pesquisada (pesquisarHibrido antes). args: { nossoNumero }
  // devolve { nossoNumero, situacao, acoes: ['Visualizar detalhes', ...] }
  async abrirAcoesRetorno(t, { nossoNumero }) {
    const { p, tela } = t;
    const linha = await acharLinha(t, nossoNumero);
    const sit = await linha.locator('.status-label, [class*=situacao-]').first().innerText().catch(() => null);
    const { itens } = await abrirMenuLinha(t, linha);
    await p.keyboard.press('Escape'); await tela.pronto(p, 300);
    return { nossoNumero, situacao: sit && sit.trim(), acoes: itens };
  },
};
