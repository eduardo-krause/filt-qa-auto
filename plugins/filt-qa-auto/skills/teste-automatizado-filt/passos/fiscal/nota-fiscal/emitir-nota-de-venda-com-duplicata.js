// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  // NF-e de venda própria com 1 item e acerto em Duplicata numa conta bancária.
  // args: { natureza, pessoa, pessoaId, item, qtd: 1, valorUnitario: 15, conta, parcelamento }
  // devolve { nota: { ID_NOTA_FISCAL, NUMERO_DOCUMENTO, SERIE }, eventos, errosApi, titulos }
  async vendaComDuplicata(t, a) {
    const { p, tela } = t;
    tela.exigirDfe();
    const desde = await t.passos.financeiro.lancamentosFinanceiros.ultimoTitulo();
    const nf0 = Number(await t.banco.valor('select coalesce(max(ID_NOTA_FISCAL),0) from NOTA_FISCAL')) || 0;
    await tela.abrir(p, '/nota/nota-fiscal');
    await tela.botao(p, 'Novo', { noDialogo: false, qual: 0 });
    await tela.autocompleteRotulo(p, p, 'Natureza de Operação', a.natureza.slice(0, 12), a.natureza);
    const lab = p.locator('label:visible').filter({ hasText: /^\s*Pessoa\s*\*?\s*$/ }).first();
    await tela.autocomplete(p, lab.locator('xpath=following::input[1]'), a.pessoa.slice(0, 12), a.pessoa);
    // item: Adicionar → diálogo (input#item, quantidade, valor unitário) → Adicionar → Cancelar (o diálogo fica aberto para o próximo)
    await tela.botao(p, 'Adicionar', { noDialogo: false });
    const dlg = p.locator('.p-dialog:visible').last();
    await tela.autocomplete(p, dlg.locator('input#item'), a.item.slice(0, 12), a.item);
    await tela.digitar(p, dlg.locator('input#quantidadeComercial'), String(a.qtd || 1), { atraso: 120 });
    await tela.digitar(p, dlg.locator('input#valorUnitarioComercial'), tela.moeda(a.valorUnitario), { atraso: 120 });
    await dlg.getByRole('button', { name: 'Adicionar', exact: true }).click(); await tela.pronto(p, 1000);
    if (await tela.temBotao(p, 'Cancelar', dlg)) await dlg.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await tela.pronto(p);
    await dropdown(t, p, 'Tipo do Frete', 'Sem Ocorr');
    const s = await tela.salvar(p);
    if (s.status !== 'acerto_financeiro') throw new Error(`o Salvar da nota não abriu o Acerto Financeiro (avisos: ${[...s.toasts, ...s.dialogos].join(' | ').slice(0, 300) || 'nenhum'})`);
    await t.passos.financeiro.acertoFinanceiro.duplicata({ conta: a.conta, parcelamento: a.parcelamento });
    const obs = await observar(t, p.locator('button:has-text("Salvar")').first(), { minimo: 8000, limite: 240000 });
    if (obs.eventos.some((e) => /Transmiss/i.test(e) && /Produ[cç][aã]o/i.test(e) && !/Homologa/i.test(e))) throw new Error('ALERTA: transmissão em ambiente de PRODUÇÃO na tela — parar e avisar a pessoa.');
    for (const b of ['Fechar', 'Ok', 'OK', 'Não']) { const d = await tela.dialogo(p); if (d && (await tela.temBotao(p, b, d))) await tela.botao(p, b, { escopo: d }); }
    const nota = await t.banco.linha('select ID_NOTA_FISCAL, NUMERO_DOCUMENTO, SERIE from NOTA_FISCAL where ID_NOTA_FISCAL > ? order by ID_NOTA_FISCAL desc limit 1', [nf0]);
    const titulos = await t.passos.financeiro.lancamentosFinanceiros.titulosDesde({ desde, pessoaId: a.pessoaId });
    return { nota, eventos: obs.eventos.map((e) => limpo(e).slice(0, 400)), errosApi: obs.errosApi, titulos };
  },
};
