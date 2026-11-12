// Tela: Cadastros › Patrimônio › Bens (/patrimonio/bem → /patrimonio/bem/form?id=<ID_BEM>)

module.exports = {
  // Card "Ajuste e troca de contadores" › Adicionar › Tipo de troca, Novo contador (data/hora ficam as propostas = agora) › Confirmar › Salvar.
  // args: { id: ID_BEM, novoContador, tipo?: 'Ajuste' | 'Troca' (padrão Ajuste), numeroSerie?, data? (dd/mm/aaaa; padrão hoje) } — a hora fica a proposta pela tela (agora): o campo de hora não aceitou digitação
  // → { dialogos, toasts, historico (última linha de HISTORICO_CONTADOR_BEM do bem), contadorAtual (BEM) }
  async registrarAjuste(t, { id, novoContador, tipo = 'Ajuste', numeroSerie, data }) {
    const { p, tela } = t;
    await tela.abrir(p, '/patrimonio/bem/form?id=' + id);
    await tela.pronto(p, 1500);
    const tab = p.locator('p-accordiontab', { hasText: 'Ajuste e troca de contadores' }).last();
    await tab.locator('button:has-text("Adicionar")').first().waitFor({ timeout: 30000 });
    await tab.locator('button:has-text("Adicionar")').first().click(); await tela.pronto(p, 1000);
    const dlg = await tela.dialogo(p);
    if (!dlg) throw new Error('o diálogo de Ajuste e troca de contadores não abriu');
    await dlg.locator('.p-dropdown').first().click(); await tela.pronto(p, 600);
    await p.locator('li.p-dropdown-item:visible, li[role=option]:visible').filter({ hasText: new RegExp('^\\s*' + tipo + '\\s*$') }).first().click(); await tela.pronto(p, 600);
    if (numeroSerie) await tela.digitar(p, dlg.locator('input#numeroSerie'), numeroSerie);
    await tela.digitar(p, dlg.locator('input#contadorNovo'), String(novoContador));   // máscara sem casas: 1000 = "1000"
    if (data) await tela.data(p, dlg.locator('input[name=dataTroca]'), data);
    const lido = await dlg.locator('input#contadorNovo').inputValue();
    await tela.botao(p, 'Confirmar', { escopo: dlg });
    const dialogos = await tela.textoDialogos(p);
    let toasts = await tela.toasts(p);
    const s = await tela.salvar(p);
    toasts = [...toasts, ...s.toasts];
    const historico = await t.banco.linha('select ID_HISTORICO_CONTADOR_BEM, TIPO_AJUSTE, CONTADOR_INICIAL, CONTADOR_FINAL, DATA_FINAL, HORA_FINAL from HISTORICO_CONTADOR_BEM where ID_BEM = ? order by ID_HISTORICO_CONTADOR_BEM desc limit 1', [id]);
    const contadorAtual = await t.banco.valor('select CONTADOR_ATUAL from BEM where ID_BEM = ?', [id]);
    return { digitado: lido, dialogos: [...dialogos, ...s.dialogos], toasts, historico, contadorAtual: Number(contadorAtual) };
  },
};
