// Tela: Financeiro › Adiantamentos (/financeiro/adiantamentos/form)
// Cria adiantamento de cliente pago em Dinheiro.

module.exports = {
  // args: { pessoa, valor }  → { codigo: '50087' (o que aparece na Antecipação Financeira), id }
  async criar(t, { pessoa, valor }) {
    const { p, tela } = t;
    const antes = Number(await t.banco.valor('select coalesce(max(ID_DOCUMENTO_FINANCEIRO),0) from DOCUMENTO_FINANCEIRO')) || 0;
    await tela.abrir(p, '/financeiro/adiantamentos/form');
    await tela.autocompleteRotulo(p, p, 'Pessoa', pessoa);
    await tela.digitar(p, tela.campo(p, 'Valor'), tela.moeda(valor));
    let s = await tela.salvar(p);
    if (s.status === 'acerto_financeiro') {
      const d = await tela.dialogo(p);
      await d.locator('text=Dinheiro').first().click(); await tela.pronto(p);
      await d.locator('button:has-text("Salvar")').first().click().catch(() => {}); await tela.pronto(p);
      await d.locator('button:has-text("Concluir")').first().click(); await tela.pronto(p, 800);
      s = await tela.salvar(p);
    }
    await tela.confirmar(p, ['Não']);   // pergunta de impressão do recibo
    const doc = await t.banco.linha(
      `select ID_DOCUMENTO_FINANCEIRO, NUMERO_DOCUMENTO, VALOR_DOCUMENTO_FINANCEIRO from DOCUMENTO_FINANCEIRO
        where ID_DOCUMENTO_FINANCEIRO > ? and NUMERO_DOCUMENTO regexp '^[0-9]+$' order by ID_DOCUMENTO_FINANCEIRO desc limit 1`, [antes]);
    if (!doc) throw new Error('adiantamento não encontrado no banco depois de salvar (status da tela: ' + s.status + ')');
    t.confere(`adiantamento ${doc.NUMERO_DOCUMENTO} valor`, doc.VALOR_DOCUMENTO_FINANCEIRO, valor);
    return { codigo: String(doc.NUMERO_DOCUMENTO), id: doc.ID_DOCUMENTO_FINANCEIRO };
  },
};
