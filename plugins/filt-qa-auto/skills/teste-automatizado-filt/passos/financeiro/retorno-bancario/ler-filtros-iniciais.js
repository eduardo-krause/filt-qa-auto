// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
const { limpo } = require('../../_comum');
const { escopo, abrirAba, lerFiltros, lerGrid, lerRodape } = require('./_apoio');

module.exports = {
  // Recarrega a tela, entra na aba Boleto híbrido sem filtrar e lê o que vem sugerido + as opções de Estabelecimento,
  // Conta bancária e Situação (abre cada lista pelo botão ▼ e fecha com Escape, sem escolher nada).
  // args: { recarregar?: true }  devolve { abas, aba, filtros, opcoes: { estabelecimento, conta, situacao }, grid, rodape }
  async lerFiltrosIniciais(t, { recarregar = true } = {}) {
    const { p, tela } = t;
    const { abas, aba } = await abrirAba(t, { recarregar });
    const e = escopo(p);
    const filtros = await lerFiltros(p);
    const lista = () => p.locator('.p-autocomplete-panel:visible li, .p-dropdown-panel:visible li');
    const abrirLista = async (gatilho) => {
      await gatilho.click(); await tela.pronto(p, 600);
      await lista().first().waitFor({ timeout: 5000 }).catch(() => {});
      const ops = (await lista().allInnerTexts()).map(limpo).filter(Boolean);
      await p.keyboard.press('Escape'); await tela.pronto(p, 300);
      return ops;
    };
    const ddDe = (id) => e.locator(`input#${id}`).locator('xpath=ancestor::p-autocomplete[1]').locator('button.p-autocomplete-dropdown').first();
    const opcoes = {
      estabelecimento: await abrirLista(ddDe('estabelecimentoHibrido')),
      conta: await abrirLista(ddDe('contaBancariaHibrido')),
      situacao: await abrirLista(e.locator('#situacaoHibrido').locator('xpath=ancestor-or-self::p-dropdown[1]').first()),
    };
    const depois = await lerFiltros(p);
    const mudou = Object.keys(filtros).filter((k) => typeof filtros[k] !== 'object' && filtros[k] !== depois[k]);
    return { abas, aba, filtros, opcoes, filtrosMudaramAoAbrirListas: mudou, grid: await lerGrid(p), rodape: await lerRodape(p) };
  },
};
