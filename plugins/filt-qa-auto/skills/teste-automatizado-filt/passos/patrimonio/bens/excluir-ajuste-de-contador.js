// Tela: Cadastros › Patrimônio › Bens (/patrimonio/bem → /patrimonio/bem/form?id=<ID_BEM>)

module.exports = {
  // Card "Ajuste e troca de contadores": lixeira da linha (padrão: a última) › Excluir › Salvar. A tela barra quando existe registro posterior que atualizou o contador.
  // args: { id: ID_BEM, linha?: última } → { dialogos, toasts (inclui "Atenção ..." da tela), linhasAntes, linhasDepois }
  async excluirAjuste(t, { id, linha }) {
    const { p, tela } = t;
    await tela.abrir(p, '/patrimonio/bem/form?id=' + id);
    await tela.pronto(p, 1500);
    const aj = p.locator('p-accordiontab', { hasText: 'Ajuste e troca de contadores' }).last();
    await aj.locator('button:has-text("Adicionar")').first().waitFor({ timeout: 30000 });
    const linhas = aj.locator('tr.table-body-line');
    const antes = await linhas.count();
    if (!antes) throw new Error('o bem ' + id + ' não tem linha em Ajuste e troca de contadores');
    await linhas.nth(linha === undefined ? antes - 1 : linha).locator('i.ph-trash').first().click(); await tela.pronto(p, 800);
    const dialogos = await tela.textoDialogos(p);
    await tela.confirmar(p, ['Excluir', 'Sim', 'Confirmar']); await tela.pronto(p, 1000);
    let toasts = await tela.toasts(p);
    const s = await tela.salvar(p);
    return { dialogos, toasts: [...toasts, ...s.toasts], linhasAntes: antes, linhasDepois: await linhas.count() };
  },
};
