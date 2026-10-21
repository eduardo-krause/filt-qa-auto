// Tela: Configurações › Receituário Agronômico (/reag/configuracao)
const { escolher } = require('./_apoio');

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
