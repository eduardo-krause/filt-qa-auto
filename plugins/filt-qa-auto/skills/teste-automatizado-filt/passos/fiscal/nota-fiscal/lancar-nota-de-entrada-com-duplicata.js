// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)
const { chaveFicticia } = require('../../_nota');
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  // Nota de ENTRADA de terceiros pela tela (ex.: COMPRA DE MERCADORIA), com acerto em DUPLICATA (gera duplicata a pagar).
  // args: { natureza, pessoa, itens: [{ item, qtd, vu }], conta: '1019810', parcelamento: '30 DIAS', vencs: ['05/12/2026'] }
  // Mesmo fluxo de lancar-nota-de-entrada-compra.js; no Acerto Financeiro usa acertar-em-duplicata.js. → { id, numero, chave, titulos:[{ID_DOCUMENTO_FINANCEIRO, NUMERO_DOCUMENTO, DATA_VENCIMENTO}] }
  //   qtd em unidades (o passo descobre as casas da unidade pela máscara); desc = desconto UNITÁRIO; frete/seguro/despesa = total da linha.
  // Diálogo do item: input#item, #quantidadeComercial, #valorUnitarioComercial, #valorDesconto (5 casas), p-autocomplete#localEstoque;
  // Adicionar mantém o diálogo aberto. Frete/seguro/despesa/frete gerencial só na edição (lápis i.ph-pencil-simple da linha).
  // → { id, numero, chave } (ID_NOTA_FISCAL lido do banco)
  async entradaTerceirosComDuplicata(t, a) {
    const { p, tela } = t;
    tela.exigirDfe();
    const antes = Number(await t.banco.valor('select coalesce(max(ID_NOTA_FISCAL),0) from NOTA_FISCAL')) || 0;
    await tela.abrir(p, '/nota/nota-fiscal');
    await tela.botao(p, 'Novo', { noDialogo: false });
    await tela.semLoader(p);
    await tela.autocompleteRotulo(p, p, 'Natureza de Operação', a.natureza.slice(0, 12), a.natureza);
    const numero = Number(String(Date.now()).slice(-7));
    const chave = chaveFicticia(a.serie || 712, numero);
    const ch = p.locator('input#chaveDeAcesso:visible').first();
    if (await ch.count()) { await ch.fill(chave); await p.keyboard.press('Tab'); await tela.pronto(p, 800); }
    await tela.autocomplete(p, p.locator('input#pessoa:visible').first(), a.pessoa.slice(0, 12), a.pessoa);
    for (const it of a.itens) {
      if (!(await tela.dialogo(p))) await tela.botao(p, 'Adicionar', { noDialogo: false });
      const d = await tela.dialogo(p);
      await tela.autocomplete(p, d.locator('input#item'), it.item.slice(0, 12), it.item);
      await tela.pronto(p, 1500);
      const qtdInp = d.locator('input#quantidadeComercial');
      await tela.digitar(p, qtdInp, '1', { atraso: 120 });
      const casas = ((await qtdInp.inputValue()).split(',')[1] || '').length;
      await tela.digitar(p, qtdInp, tela.qtd(it.qtd, casas), { atraso: 120 });
      await tela.digitar(p, d.locator('input#valorUnitarioComercial'), tela.moeda(it.vu), { atraso: 120 });
      if (it.desc) await tela.digitar(p, d.locator('input#valorDesconto'), tela.moeda(it.desc, 5), { atraso: 120 });
      const box = d.locator('p-autocomplete#localEstoque');
      if ((await box.count()) && (await box.evaluate((e) => e.classList.contains('ng-invalid')))) {
        await box.locator('button').click(); await tela.pronto(p, 1000);
        const ops = p.locator('li[role=option]:visible'); const tx = (await ops.allInnerTexts()).map(tela.limpo);
        const i = tx.findIndex((x) => /PADR/.test(x)); await ops.nth(i < 0 ? 0 : i).click(); await tela.pronto(p, 800);
      }
      const add = d.getByRole('button', { name: 'Adicionar', exact: true });
      for (let k = 0; k < 20 && (await add.isDisabled()); k++) await tela.esperar(p, 1000);
      if (await add.isDisabled()) throw new Error(`botão Adicionar do item ${it.item} não habilitou`);
      await add.click(); await tela.pronto(p, 1500);
      const erro = (await tela.toasts(p)).join(' ');
      if (!(await p.locator('tbody tr', { hasText: it.item }).count())) throw new Error(`item ${it.item} não entrou na nota (${erro || 'sem aviso'})`);
    }
    if (await tela.dialogo(p)) await tela.botao(p, 'Cancelar');
    for (const it of a.itens) {
      const extras = { valorFrete: it.frete, valorSeguro: it.seguro, valorDespesaAcessoria: it.despesa, valorFreteGerencial: it.freteGerencial };
      if (!Object.values(extras).some((v) => v)) continue;
      await p.locator('tbody tr', { hasText: it.item }).first().locator('i.ph-pencil-simple').click(); await tela.pronto(p, 1200);
      const d = await tela.dialogo(p);
      for (const [id, v] of Object.entries(extras)) if (v) await tela.digitar(p, d.locator(`input#${id}`), tela.moeda(v), { atraso: 80 });
      await tela.botao(p, 'Salvar', { escopo: d }); await tela.pronto(p, 1200);
      if (await tela.dialogo(p)) await tela.botao(p, 'Cancelar').catch(() => {});
    }
    // Tipo do Frete vem do cadastro da pessoa (ex.: FOB) e é preenchido depois de escolher a pessoa: só escolhe se estiver vazio
    await tela.pronto(p, 800);
    const frete = tela.limpo(await p.locator('p-dropdown#tipoDoFrete .p-dropdown').first().innerText());
    // pelo id: o primeiro label "Tipo do Frete" visível pode ser de outra seção (lista sem "Sem Ocorrência")
    if (!frete || /Selecione/i.test(frete)) {
      const dd = p.locator('p-dropdown#tipoDoFrete .p-dropdown').first();
      await dd.scrollIntoViewIfNeeded(); await p.mouse.wheel(0, 250); await tela.pronto(p, 300); // lista abre para baixo: precisa de espaço
      await dd.click(); await tela.pronto(p, 600);
      await p.locator('li.p-dropdown-item:visible, li[role=option]:visible').filter({ hasText: 'Sem Ocorr' }).first().click(); await tela.pronto(p);
    }
    let s = await tela.salvar(p);
    if (s.status === 'acerto_financeiro') {
      await require('../../financeiro/acerto-financeiro/acertar-em-duplicata').duplicata(t, { conta: a.conta, parcelamento: a.parcelamento, vencs: a.vencs || [] });
      s = await tela.salvar(p);
    }
    // diálogos depois de salvar: confirmação Sefaz e "Salvo com sucesso / Imprimir Recibo / Fechar" (acerto com recibo)
    for (const txt of ['Confirmação da operação', 'Imprimir Recibo']) {
      const dl = p.locator('.p-dialog:visible', { hasText: txt });
      if (await dl.count()) { await dl.getByRole('button', { name: 'Fechar' }).first().click(); await tela.pronto(p); }
    }
    const l = await t.banco.linha('select ID_NOTA_FISCAL, NUMERO_DOCUMENTO from NOTA_FISCAL where ID_NOTA_FISCAL > ? order by ID_NOTA_FISCAL desc limit 1', [antes]);
    if (!l) {
      const corpo = tela.limpo(await p.locator('body').innerText()); const i = corpo.indexOf('Campos obrigatórios');
      throw new Error(`nota de entrada não foi gravada (status ${s.status}; ${[...s.toasts, ...s.dialogos].join(' | ').slice(0, 300)}${i >= 0 ? '; ' + corpo.slice(i, i + 250) : ''})`);
    }
    const titulos = await t.banco.consultar(`select d.ID_DOCUMENTO_FINANCEIRO, d.NUMERO_DOCUMENTO, d.DATA_VENCIMENTO, d.STATUS from NOTA_FISCAL_DOCUMENTO_FINANCEIRO x
      join DOCUMENTO_FINANCEIRO d on d.ID_DOCUMENTO_FINANCEIRO = x.ID_DOCUMENTO_FINANCEIRO where x.ID_NOTA_FISCAL = ? and d.TIPO_DOCUMENTO_FINANCEIRO = 'DUPLICATA' order by d.NUMERO_DOCUMENTO`, [l.ID_NOTA_FISCAL]);
    return { id: l.ID_NOTA_FISCAL, numero: l.NUMERO_DOCUMENTO, chave, status: s.status, titulos };
  },
};
