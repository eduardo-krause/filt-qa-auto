// Tela: Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido)
// O adiantamento é identificado pelo CÓDIGO mostrado na janela "Gerar antecipações" (= DOCUMENTO_FINANCEIRO.NUMERO_DOCUMENTO).

async function carregar(t, { pessoa, pedido }) {
  const { p, tela } = t;
  await tela.abrir(p, '/vendas/antecipacao-financeira-pedido');
  await p.getByRole('button', { name: 'Carregar', exact: true }).waitFor({ timeout: 60000 });
  const campo = tela.campo(p, 'Pessoa');
  if (!(await campo.inputValue()).includes(pessoa)) await tela.autocomplete(p, campo, pessoa);
  await tela.botao(p, 'Carregar', { noDialogo: false });
  const linha = p.locator('tbody tr').filter({ hasText: new RegExp(`\\b${pedido}\\s+\\d{2}/\\d{2}/\\d{4}`) }).first();
  if (!(await linha.count())) throw new Error(`pedido ${pedido} não aparece na Antecipação Financeira de ${pessoa}`);
  return linha;
}

const moedaTela = (s) => Number(String(s || '').replace(/[^\d,]/g, '').replace(',', '.'));

module.exports = {
  // Linha do pedido na tela + "Valor a baixar" oferecido. args: { pessoa, pedido }  → { linha, valorOferecido }
  async ler(t, a) {
    const linha = await carregar(t, a);
    const v = await linha.locator('input').last().inputValue().catch(() => '');
    return { linha: t.tela.limpo(await linha.innerText()), valorOferecido: moedaTela(v) };
  },

  // Vincula adiantamentos ao pedido. args: { pessoa, pedido, adiantamentos:['50087'], valorBaixar? }
  // devolve { valorOferecido, marcados, toasts }
  async vincular(t, { pessoa, pedido, adiantamentos, valorBaixar }) {
    const { p, tela } = t;
    const linha = await carregar(t, { pessoa, pedido });
    const res = { valorOferecido: moedaTela(await linha.locator('input').last().inputValue().catch(() => '')) };
    if (valorBaixar !== undefined) await tela.digitar(p, linha.locator('input').last(), tela.moeda(valorBaixar));
    const btn = linha.locator('button[ptooltip="Gerar antecipações"]');
    if (await btn.isDisabled()) throw new Error('botão "Gerar antecipações" desabilitado para o pedido ' + pedido);
    await btn.click(); await tela.pronto(p, 800);
    const dlg = await tela.dialogo(p);
    res.marcados = [];
    for (const a of adiantamentos) {
      const alvo = dlg.locator('tr').filter({ hasText: new RegExp(`^\\s*${a}\\b`) }).first();
      if (!(await alvo.count())) throw new Error(`adiantamento ${a} não está na janela Gerar antecipações`);
      res.marcados.push(tela.limpo(await alvo.innerText()));
      await alvo.locator('.p-checkbox-box').first().click(); await tela.pronto(p);
    }
    const salvar = dlg.getByRole('button', { name: 'Salvar', exact: true });
    if (await salvar.isDisabled()) throw new Error('Salvar desabilitado na janela Gerar antecipações');
    await salvar.click(); await tela.pronto(p, 800);
    res.toasts = await tela.toasts(p);
    return res;
  },

  // Adiantamentos listados na janela "Gerar antecipações" do pedido (fecha sem salvar). → [ 'código ... saldo', ... ]
  async disponiveis(t, { pessoa, pedido }) {
    const { p, tela } = t;
    const linha = await carregar(t, { pessoa, pedido });
    await linha.locator('button[ptooltip="Gerar antecipações"]').click(); await tela.pronto(p, 800);
    await p.locator('.p-dialog:visible tbody tr').first().waitFor({ timeout: 20000 }).catch(() => {});
    const linhas = (await p.locator('.p-dialog:visible tbody tr').allInnerTexts()).map(tela.limpo).filter(Boolean);
    await tela.botao(p, 'Cancelar', { escopo: await tela.dialogo(p) }).catch(() => {});
    return linhas;
  },

  // Desvincula um adiantamento pelo Histórico do pedido. args: { pessoa, pedido, adiantamento: '50087' }
  async desvincular(t, { pessoa, pedido, adiantamento }) {
    const { p, tela } = t;
    const linha = await carregar(t, { pessoa, pedido });
    await linha.locator('button[ptooltip="Histórico"]').click(); await tela.pronto(p, 800);
    const dlg = await tela.dialogo(p);
    const l = dlg.locator('tr').filter({ hasText: adiantamento }).first();
    if (!(await l.count())) throw new Error(`adiantamento ${adiantamento} não está no Histórico do pedido ${pedido}`);
    await l.locator('button[ptooltip="Desvincular adiantamento"]').click(); await tela.pronto(p, 800);
    const conf = await tela.textoDialogos(p);
    await tela.confirmar(p, ['Sim', 'Confirmar', 'Desvincular', 'Continuar', 'Ok']);
    await tela.pronto(p, 800);
    // confere no banco: o vínculo tem que ficar cancelado
    const v = await t.banco.linha(`select x.VALOR_SELECIONADO, x.VALOR_CANCELADO from PEDIDO_FORMA_PAGAMENTO f
      join PEDIDO_FORMA_PAGAMENTO_DOCUMENTO_FINANCEIRO x on x.ID_PEDIDO_FORMA_PAGAMENTO = f.ID_PEDIDO_FORMA_PAGAMENTO
      join DOCUMENTO_FINANCEIRO d on d.ID_DOCUMENTO_FINANCEIRO = x.ID_DOCUMENTO_FINANCEIRO
      where f.ID_PEDIDO = ? and d.NUMERO_DOCUMENTO = ? order by x.ID_PEDIDO_FORMA_PAGAMENTO_DOCUMENTO_FINANCEIRO desc limit 1`, [pedido, adiantamento]);
    return { confirmacao: conf, toasts: await tela.toasts(p), vinculo: v };
  },
};
