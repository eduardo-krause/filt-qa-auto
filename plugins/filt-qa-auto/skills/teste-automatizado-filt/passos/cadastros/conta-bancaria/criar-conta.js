// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form) — cria uma conta bancária nova pela tela
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  // Nova conta (tipo Banco) com "Emite boleto" e a configuração de cobrança. Campo que não vier nos args fica como a tela deixou.
  // args: { banco: 'Banco Inter', agencia, digitoAgencia?, nomeAgencia, conta, digitoConta, correntista, dataAbertura: 'dd/mm/aaaa',
  //         valorLimite, estabelecimentos: ['BASE KRAUSE'], emiteBoleto: true, salvar?: false (só preenche e devolve o estado),
  //         cobranca?: { tipoTransmissao: 'Manual', formato?, especie, carteira: '110', moeda: 'Real', filiais: ['BASE KRAUSE'],
  //                      numeroOperacao, descricaoConvenio, nossoNumeroInicial?, nossoNumeroLimite?, ultimoNossoNumero?, ultimaRemessa, diasLimitePagamento? } }
  // devolve { id (do banco), salvarHabilitado, invalidos, valores (dropdowns), campos (inputs da cobrança), eventos, errosApi }
  async criarConta(t, a) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/configuracao-portador/form');
    await tela.autocomplete(p, p.locator('input#banco'), a.banco.slice(0, 12), a.banco);
    await tela.digitar(p, p.locator('input#numeroAgencia'), a.agencia);
    if (a.digitoAgencia != null) await tela.digitar(p, p.locator('input#digitoAgencia'), a.digitoAgencia);
    await tela.digitar(p, p.locator('input#nomeAgencia'), a.nomeAgencia);
    await tela.digitar(p, p.locator('input#numeroConta'), a.conta);
    await tela.digitar(p, p.locator('input#digitoConta'), a.digitoConta);
    await tela.autocomplete(p, p.locator('input#pessoa'), a.correntista.slice(0, 12), a.correntista);
    if (a.dataAbertura) await tela.data(p, p.locator('#dataAbertura input, input#dataAbertura').first(), a.dataAbertura);
    if (a.valorLimite != null) await tela.digitar(p, p.locator('input#valorLimite'), tela.moeda(a.valorLimite));
    // Estabelecimentos (p-autoComplete múltiplo)
    for (const e of a.estabelecimentos || []) await tela.autocomplete(p, p.locator('input#estabelecimentos'), e.slice(0, 12), e);
    if (a.emiteBoleto) {
      const cb = p.locator('p-checkbox#emiteBoleto .p-checkbox-box, #emiteBoleto .p-checkbox-box').first();
      if ((await cb.getAttribute('aria-checked')) !== 'true') { await cb.click(); await tela.pronto(p, 800); }
    }
    const c = a.cobranca;
    if (c) {
      if (c.formato) await dropdown(t, p, 'Formato de transmissão', c.formato);
      if (c.tipoTransmissao) await dropdown(t, p, 'Tipo de transmissão', c.tipoTransmissao);
      if (c.especie) await tela.autocomplete(p, p.locator('input#especieTituloCobrancaBanco'), c.especie.slice(0, 12), c.especie);
      if (c.carteira) {
        // a busca do autocomplete é pela descrição: abre pela seta e escolhe o item "<carteira> - <descrição>"
        await p.locator('p-autocomplete[inputid=carteiraCobranca] button, p-autoComplete[inputId=carteiraCobranca] button').first().click(); await tela.pronto(p, 800);
        const ops = p.locator('.p-autocomplete-panel:visible li');
        const txt = (await ops.allInnerTexts()).map(limpo);
        const i = txt.findIndex((x) => x.startsWith(c.carteira + ' -'));
        if (i < 0) throw new Error(`carteira ${c.carteira} não está na lista (tem: ${txt.join(' | ')})`);
        await ops.nth(i).click(); await tela.pronto(p);
      }
      if (c.moeda) await tela.autocomplete(p, p.locator('input#moeda'), c.moeda, c.moeda);
      // Filiais que usam essa configuração: Adicionar → Filial → Salvar (o Número da operação/convênio só aparece depois)
      for (const f of c.filiais || []) {
        const card = p.locator('p-accordiontab').filter({ hasText: 'Filiais que usam essa configuração' }).first();
        await card.getByRole('button', { name: 'Adicionar' }).first().click(); await tela.pronto(p, 800);
        const dlg = p.locator('.p-dialog:visible').last();
        await tela.autocomplete(p, dlg.locator('input#filial'), f.slice(0, 12), f);
        await dlg.getByRole('button', { name: 'Salvar', exact: true }).last().click(); await tela.pronto(p, 800);
      }
      if (c.numeroOperacao != null) await tela.digitar(p, p.locator('input#numeroConvenio'), c.numeroOperacao);
      if (c.descricaoConvenio != null) await tela.digitar(p, p.locator('input#descricaoConvenio'), c.descricaoConvenio);
      const txt = { faixaInicialNossoNumero: c.nossoNumeroInicial, limiteNossoNumero: c.nossoNumeroLimite, ultimoNossoNumero: c.ultimoNossoNumero, numeroUltimaRemessa: c.ultimaRemessa, diasLimitePagamento: c.diasLimitePagamento };
      for (const [id, v] of Object.entries(txt)) {
        if (v == null) continue;
        const inp = p.locator(`form#form input#${id}:visible, app-configuracaocobranca-form input#${id}:visible, input#${id}:visible`).first();
        if (!(await inp.isEnabled())) throw new Error(`campo ${id} está desabilitado`);
        await tela.digitar(p, inp, v);
      }
    }
    // estado antes de salvar (evidência)
    const valores = await p.locator('p-dropdown').evaluateAll((es) => es.filter((e) => e.offsetParent).map((e) => `${e.id}=${(e.querySelector('.p-dropdown-label') || {}).innerText || ''}${e.querySelector('.p-disabled, .p-dropdown.p-disabled') || e.classList.contains('p-disabled') ? ' (desabilitado)' : ''}`));
    const campos = await p.locator('input:visible').evaluateAll((es) => es.filter((e) => e.id).map((e) => `${e.id}=${e.value}${e.disabled ? ' (desabilitado)' : ''}`));
    const invalidos = await p.locator('.ng-invalid:not(form):not(ng-form)').evaluateAll((es) => [...new Set(es.filter((e) => e.offsetParent).map((e) => e.id || e.getAttribute('name') || e.tagName.toLowerCase()))]);
    const bt = p.getByRole('button', { name: 'Salvar', exact: true }).first();
    const salvarHabilitado = (await bt.isEnabled()) && !(await bt.evaluate((b) => b.disabled || b.classList.contains('p-disabled') || !!b.closest('[disabled]')));
    if (!salvarHabilitado || a.salvar === false) return { id: null, salvarHabilitado, invalidos, valores, campos, eventos: [], errosApi: [] };
    const r = await observar(t, bt, { minimo: 2500 });
    const id = Number(new URL(p.url()).searchParams.get('id')) || null;
    const doBanco = await t.banco.valor('select max(ID_CONFIGURACAO_PORTADOR) from CONFIGURACAO_PORTADOR where NUMERO_CONTA = ?', [String(a.conta)]);
    return { id: Number(doBanco) || id, idUrl: id, salvarHabilitado, invalidos, valores, campos, eventos: r.eventos, errosApi: r.errosApi };
  },
};
