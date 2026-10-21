// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)
const { limpo, observar } = require('../../_comum');

module.exports = {
  async criarComDuplicata(t, a) {
    const { p, tela } = t;
    const desde = await require('./consultar-ultimo-titulo').ultimoTitulo(t);
    await tela.abrir(p, '/financeiro/lancamento-financeiro');
    await tela.botao(p, 'Novo', { noDialogo: false });
    await tela.autocompleteRotulo(p, p, 'Natureza Operação', a.natureza.slice(0, 12), a.natureza);
    await tela.autocompleteRotulo(p, p, 'Pessoa', a.pessoa.slice(0, 12), a.pessoa);
    await tela.autocompleteRotulo(p, p, 'Conta Contábil', a.contaContabil.slice(0, 12), a.contaContabil);
    await tela.digitar(p, tela.campo(p, 'Valor Lançamento'), tela.moeda(a.valor));
    const s = await tela.salvar(p);
    if (s.status !== 'acerto_financeiro') throw new Error(`o Salvar não abriu o Acerto Financeiro (avisos: ${[...s.toasts, ...s.dialogos].join(' | ').slice(0, 300) || 'nenhum'})`);
    const acerto = await t.passos.financeiro.acertoFinanceiro.duplicata({ conta: a.conta, parcelamento: a.parcelamento });
    // salvarEm (epoch ms): segura o Salvar final até o horário (ex.: emitir perto do fim da validade do token)
    if (a.salvarEm && a.salvarEm > Date.now()) await p.waitForTimeout(a.salvarEm - Date.now());
    const obs = await observar(t, p.getByRole('button', { name: 'Salvar', exact: true }).last(), { minimo: 4000 });
    const fim = await require('./tratar-dialogo-depois-de-salvar').posSalvar(t, { emitirBoletos: a.emitirBoletos, pastaPdf: a.pastaPdf, prefixo: a.prefixo });
    const titulos = await require('./consultar-titulos-criados').titulosDesde(t, { desde, pessoaId: a.pessoaId });
    return { acerto, eventos: [...obs.eventos, ...fim.eventos], errosApi: [...obs.errosApi, ...fim.errosApi], titulos, pdfs: fim.pdfs };
  },
};
