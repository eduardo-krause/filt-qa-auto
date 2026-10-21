// Tela: Configurações › Receituário Agronômico (/reag/configuracao) — configuração do Reag da filial logada
// Tipo de Aplicação: "Aplicação Terrestre" | "Aplicação Aérea" | "Ambas". Nível de Dose / Nível de Calda: "Mínimo" | "Máximo" | "Nada"
// ("Padrão" está comentado no front). Grava CONFIGURACAO_REAG (TIPO_APLICACAO, VOLUME_DOSE, VOLUME_CALDA, OBRIGA_EQUIPAMENTO_APLICACAO).
// O app só vê a mudança depois de "Atualizar dados" (mobile/app-sincronizar).

// Dropdown pelo id do campo (label[for]); o tela.dropdown pega o 1º rótulo visível e a lista pode abrir fora da tela.
async function escolher(t, rotulo, opcao) {
  const { p, tela } = t;
  const lab = p.locator('label:visible').filter({ hasText: new RegExp('^\\s*' + rotulo + '\\s*\\*?\\s*$') }).first();
  const id = await lab.getAttribute('for');
  const dd = id ? p.locator(`p-dropdown#${id} .p-dropdown`).first() : lab.locator('xpath=following::*[contains(@class,"p-dropdown")][1]');
  await dd.scrollIntoViewIfNeeded(); await dd.click(); await tela.pronto(p, 600);
  await p.locator('li.p-dropdown-item:visible, li[role=option]:visible').filter({ hasText: opcao }).first().click(); await tela.pronto(p, 400);
}

module.exports = {
  // args: { tipo?, dose?, calda?, obrigaEquipamento?: true|false } → linhas de CONFIGURACAO_REAG (uma por filial) lidas do banco depois de salvar
  async alterar(t, { tipo, dose, calda, obrigaEquipamento }) {
    const { p, tela } = t;
    await tela.abrir(p, '/reag/configuracao');
    if (tipo) await escolher(t, 'Tipo de Aplicação', tipo);
    if (dose) await escolher(t, 'Nível de Dose', dose);
    if (calda) await escolher(t, 'Nível de Calda', calda);
    if (obrigaEquipamento !== undefined) {
      const box = p.locator('#obrigaEquipamentoAplicacao .p-checkbox-box').first();
      await box.scrollIntoViewIfNeeded();
      if ((await box.evaluate((e) => e.classList.contains('p-highlight'))) !== obrigaEquipamento) { await box.click(); await tela.pronto(p, 600); }
    }
    await tela.salvar(p);
    return t.banco.consultar('select ID_FILIAL, TIPO_APLICACAO, VOLUME_DOSE, VOLUME_CALDA, OBRIGA_EQUIPAMENTO_APLICACAO + 0 OBRIGA from CONFIGURACAO_REAG');
  },
};
