// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)
const { limpo, observar } = require('../_comum');

// Duplicatas criadas depois de `desde` para a pessoa, com o último boleto de cada uma (se houver).
const duplicatasSql = `select d.ID_DOCUMENTO_FINANCEIRO as id, d.NUMERO_DOCUMENTO as numero, d.VALOR_DOCUMENTO_FINANCEIRO as valor,
    d.DATA_VENCIMENTO as vencimento, d.BOLETO_COBRANCA as boleto, d.ID_CONFIGURACAO_PORTADOR as portador,
    h.ID_HISTORICO_BOLETO as historico, h.TIPO_EMISSAO as tipo, h.SITUACAO_INTEGRACAO as situacao, h.NOSSO_NUMERO as nossoNumero,
    h.TXID as txid, h.EMV_PIX as emv, h.LINHA_DIGITAVEL as linha, h.CODIGO_BARRAS as barras
  from DOCUMENTO_FINANCEIRO d
  left join HISTORICO_BOLETO h on h.ID_HISTORICO_BOLETO = (select max(x.ID_HISTORICO_BOLETO) from HISTORICO_BOLETO x where x.ID_DOCUMENTO_FINANCEIRO = d.ID_DOCUMENTO_FINANCEIRO)
  where d.ID_DOCUMENTO_FINANCEIRO > ? and d.ID_PESSOA = ? order by d.ID_DOCUMENTO_FINANCEIRO`;

module.exports = {
  // Maior ID_DOCUMENTO_FINANCEIRO (para achar os títulos criados por uma ação).
  async ultimoTitulo(t) { return Number(await t.banco.valor('select coalesce(max(ID_DOCUMENTO_FINANCEIRO),0) from DOCUMENTO_FINANCEIRO')) || 0; },

  // Títulos da pessoa criados depois de `desde`, com o boleto mais recente de cada. args: { desde, pessoaId }
  async titulosDesde(t, { desde, pessoaId }) { return t.banco.consultar(duplicatasSql, [desde, pessoaId]); },

  // Novo lançamento com acerto em Duplicata numa conta bancária.
  // args: { natureza, pessoa, pessoaId, contaContabil, valor, conta, parcelamento, emitirBoletos?: false, pastaPdf? }
  // devolve { eventos (toasts/diálogos do Salvar), errosApi, titulos: [duplicatas + boleto], pdfs }
  async criarComDuplicata(t, a) {
    const { p, tela } = t;
    const desde = await module.exports.ultimoTitulo(t);
    await tela.abrir(p, '/financeiro/lancamento-financeiro');
    await tela.botao(p, 'Novo', { noDialogo: false });
    await tela.autocompleteRotulo(p, p, 'Natureza Operação', a.natureza.slice(0, 12), a.natureza);
    await tela.autocompleteRotulo(p, p, 'Pessoa', a.pessoa.slice(0, 12), a.pessoa);
    await tela.autocompleteRotulo(p, p, 'Conta Contábil', a.contaContabil.slice(0, 12), a.contaContabil);
    await tela.digitar(p, tela.campo(p, 'Valor Lançamento'), tela.moeda(a.valor));
    const s = await tela.salvar(p);
    if (s.status !== 'acerto_financeiro') throw new Error(`o Salvar não abriu o Acerto Financeiro (avisos: ${[...s.toasts, ...s.dialogos].join(' | ').slice(0, 300) || 'nenhum'})`);
    const acerto = await t.passos.financeiro.acerto.duplicata({ conta: a.conta, parcelamento: a.parcelamento });
    // salvarEm (epoch ms): segura o Salvar final até o horário (ex.: emitir perto do fim da validade do token)
    if (a.salvarEm && a.salvarEm > Date.now()) await p.waitForTimeout(a.salvarEm - Date.now());
    const obs = await observar(t, p.getByRole('button', { name: 'Salvar', exact: true }).last(), { minimo: 4000 });
    const fim = await module.exports.posSalvar(t, { emitirBoletos: a.emitirBoletos, pastaPdf: a.pastaPdf, prefixo: a.prefixo });
    const titulos = await module.exports.titulosDesde(t, { desde, pessoaId: a.pessoaId });
    return { acerto, eventos: [...obs.eventos, ...fim.eventos], errosApi: [...obs.errosApi, ...fim.errosApi], titulos, pdfs: fim.pdfs };
  },

  // Diálogo depois do Salvar ("Salvo com sucesso" com Emitir Boletos): emite (capturando o PDF) ou fecha.
  async posSalvar(t, { emitirBoletos = false, pastaPdf, prefixo } = {}) {
    const { p, tela } = t;
    const vazio = { eventos: [], errosApi: [], pdfs: [] };
    const dlg = await tela.dialogo(p);
    if (!dlg) return vazio;
    if (emitirBoletos && (await tela.temBotao(p, 'Emitir Boletos', dlg))) {
      const r = await observar(t, dlg.getByRole('button', { name: 'Emitir Boletos', exact: true }).first(), { minimo: 6000, pastaPdf, prefixo });
      // diálogo de emissão (Enviar por E-mail / Gerar PDF → Emitir)
      const d2 = await tela.dialogo(p);
      if (d2 && (await tela.temBotao(p, 'Emitir', d2))) {
        const email = d2.locator('.p-checkbox-box').first();
        if ((await email.getAttribute('aria-checked')) === 'true') { await email.click(); await tela.pronto(p); }
        const r2 = await observar(t, d2.getByRole('button', { name: 'Emitir', exact: true }).first(), { minimo: 8000, pastaPdf, prefixo });
        return { eventos: [...r.eventos, ...r2.eventos], errosApi: [...r.errosApi, ...r2.errosApi], pdfs: [...r.pdfs, ...r2.pdfs] };
      }
      return r;
    }
    for (const b of ['Fechar', 'Não', 'Ok', 'OK']) if (await tela.temBotao(p, b, dlg)) { await tela.botao(p, b, { escopo: dlg }); break; }
    return vazio;
  },

  // Texto da tela como evidência curta (ex.: conferir uma mensagem que ficou fixa).
  async textoTela(t) { return limpo(await t.p.locator('body').innerText()).slice(0, 2000); },
};
