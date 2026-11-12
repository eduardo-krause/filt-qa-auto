// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
const { limpo, dropdown } = require('../../_comum');
const { escopo, abrirAba, expandirFiltros, lerFiltros, lerObrigatorios, lerGrid, lerRodape, observarToasts } = require('./_apoio');

module.exports = {
  // Preenche os filtros da aba Boleto híbrido e clica em Filtrar.
  // args: { estabelecimento?, conta?: '123873' (número da conta; opção '| 123873-6'), dataIni?, dataFim?, situacao?: texto da opção,
  //         pessoa?, documento?, limparAntes?: true (botão Limpar antes), recarregar?: true }
  //   campo ausente = mantém o que a tela trouxe; '' = apaga o campo (para testar obrigatório).
  // devolve { filtros, obrigatorios, grid: {cabecalho, linhas, vazio}, rodape: {contador, aprovar, paginacao, total},
  //           toasts, errosApi, api: { status, registros, consultaBancoFalhou, corpoEnviado } }
  async pesquisarHibrido(t, { estabelecimento, conta, dataIni, dataFim, situacao, pessoa, documento, limparAntes = false, recarregar = false } = {}) {
    const { p, tela } = t;
    await abrirAba(t, { recarregar });
    const e = escopo(p);
    const expandiu = await expandirFiltros(t);
    if (limparAntes) { await e.getByRole('button', { name: 'Limpar', exact: true }).first().click(); await tela.pronto(p); }
    const apagar = async (sel) => { const i = e.locator(sel).first(); await i.click(); await i.fill(''); await p.keyboard.press('Tab'); await tela.pronto(p, 300); };
    if (estabelecimento === '') await apagar('input#estabelecimentoHibrido');
    else if (estabelecimento && !(await e.locator('input#estabelecimentoHibrido').inputValue()).includes(estabelecimento)) await tela.autocomplete(p, e.locator('input#estabelecimentoHibrido'), estabelecimento);
    if (conta === '') await apagar('input#contaBancariaHibrido');
    else if (conta && !(await e.locator('input#contaBancariaHibrido').inputValue()).includes(conta)) await tela.autocomplete(p, e.locator('input#contaBancariaHibrido'), conta);
    if (dataIni !== undefined) await tela.data(p, e.locator('input#dataInicioHibrido'), dataIni);
    if (dataFim !== undefined) await tela.data(p, e.locator('input#dataFimHibrido'), dataFim);
    if (situacao) await dropdown(t, e, 'Situação do retorno', situacao);
    if (pessoa === '') await apagar('input#pessoapessoaHibrido');
    else if (pessoa) await tela.autocomplete(p, e.locator('input#pessoapessoaHibrido'), pessoa);
    if (documento !== undefined) await e.locator('input#documentoHibrido').fill(String(documento));

    // resposta da pesquisa (POST /retorno-boleto/pesquisar)
    const api = {};
    const onResp = async (r) => {
      if (!/\/retorno-boleto\/pesquisar/.test(r.url())) return;
      api.status = r.status();
      try { api.corpoEnviado = JSON.parse(r.request().postData() || 'null'); } catch (x) { api.corpoEnviado = r.request().postData(); }
      try { const j = await r.json(); api.registros = (j.registros || []).length; api.consultaBancoFalhou = j.consultaBancoFalhou; if (r.status() >= 400) api.erro = j; } catch (x) { api.corpo = (await r.text().catch(() => '')).slice(0, 400); }
    };
    p.on('response', onResp);
    let obs;
    try {
      const filtrar = e.getByRole('button', { name: 'Filtrar', exact: true }).first();
      obs = await observarToasts(t, () => filtrar.click());
    } finally { p.off('response', onResp); }
    return {
      filtrosExpandidos: expandiu,
      filtros: await lerFiltros(p),
      obrigatorios: await lerObrigatorios(p),
      grid: await lerGrid(p),
      rodape: await lerRodape(p),
      toasts: obs.toasts,
      errosApi: obs.errosApi,
      api: Object.keys(api).length ? api : null,
      via: dropdown.ultimo && situacao ? dropdown.ultimo.via : undefined,
    };
  },
};
