// Tela: Processos › Financeiro › Remessa Bancária (/financeiro/gerar-remessa)
const { limpo, observar, dropdown } = require('../../_comum');
const { painelAberto } = require('./_apoio');

module.exports = {
  // Pesquisa os boletos de um portador. args: { portador: '12345', estabelecimento?, de: 'dd/mm/aaaa', ate }
  // devolve { linhas: [texto de cada linha], resposta: { status, total? } }
  // Filtros (vs-filtro, todos obrigatórios): Estabelecimento ("Adicionar Todos"), Data Emissão/até, Portador (input#portador),
  // Tipo de Ocorrência a Gerar (input#tipoOcorrencia, múltiplo) e Situação no Banco (p-dropdown#filtro-enviadoBanco).
  // args: { portador, de, ate, ocorrencia?: 'Inclus', situacao?: texto da opção }  devolve { linhas, filtro: {situacao, ocorrencias}, botao }
  async pesquisar(t, { portador, de, ate, ocorrencia = 'Inclus', situacao }) {
    const { p, tela } = t;
    await tela.abrir(p, '/financeiro/gerar-remessa');
    // o painel do vs-filtro é desenhado fora do próprio elemento: escopo = página (os ids do filtro são únicos)
    const sb = p;
    if (!(await painelAberto(p))) { await p.locator('[class*=funnel]:visible').first().click({ force: true }); await tela.pronto(p); }
    await tela.botao(p, 'Adicionar Todos', { escopo: sb });
    await tela.data(p, sb.locator('#dataEmissaoInicial input, input#dataEmissaoInicial').first(), de);
    await tela.data(p, sb.locator('#dataEmissaoFinal input, input#dataEmissaoFinal').first(), ate || de);
    await tela.autocomplete(p, sb.locator('input#portador'), portador);
    const oc = sb.locator('input#tipoOcorrencia');
    const ocorrencias = async () => (await sb.locator('p-autocomplete[name=tipoOcorrencia] .p-autocomplete-token, p-autocomplete[name=tipoOcorrencia] li.p-autocomplete-token').allInnerTexts()).map(limpo);
    // conta Manual: escolher o portador já carrega a grade e fecha o painel (aparece o botão "Filtros")
    await tela.pronto(p, 800);
    if (!(await painelAberto(p))) {
      if (!situacao) {
        const linhas = (await p.locator('vs-tabela-dinamica tbody tr:visible').allInnerTexts()).map(limpo).filter((x) => x && !/nenhum registro/i.test(x));
        return { linhas, filtro: { situacao: 'padrão (painel fechou ao escolher o portador)' }, botao: (await tela.temBotao(p, 'Gerar arquivo')) ? 'Gerar arquivo' : 'Transmitir' };
      }
      await p.getByRole('button', { name: 'Filtros', exact: true }).first().click(); await tela.pronto(p);
    }
    // as ocorrências costumam vir preenchidas depois de escolher o portador
    // (a lista de ocorrências depende do banco da conta: só escolhe quando a tela não trouxe nenhuma)
    const ocInp = sb.locator('p-autocomplete[name=tipoOcorrencia] input:visible').first();
    if (!(await ocorrencias()).length && (await ocInp.count())) await tela.autocomplete(p, ocInp, ocorrencia);
    if (situacao) await dropdown(t, sb, 'Situação no Banco', situacao);
    const filtro = { situacao: limpo(await sb.locator('#filtro-enviadoBanco .p-dropdown-label').innerText().catch(() => '')), ocorrencias: await ocorrencias() };
    // Filtrar fica desabilitado se faltar filtro obrigatório (ex.: ocorrência que a conta não oferece); a grade já
    // carregou ao escolher o portador — usa ela e registra
    const filtrar = sb.getByRole('button', { name: 'Filtrar', exact: true }).first();
    if (await filtrar.isEnabled()) await filtrar.click();
    else { filtro.filtrarDesabilitado = true; await p.keyboard.press('Escape'); }
    await tela.pronto(p, 1500);
    const linhas = (await p.locator('vs-tabela-dinamica tbody tr:visible').allInnerTexts()).map(limpo).filter((x) => x && !/nenhum registro/i.test(x));
    const botao = (await tela.temBotao(p, 'Gerar arquivo')) ? 'Gerar arquivo' : ((await tela.temBotao(p, 'Transmitir')) ? 'Transmitir' : null);
    return { linhas, filtro, botao };
  },
};
