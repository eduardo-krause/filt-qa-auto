// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
// Preenche o card Configuração DDA (precisa do Consulta DDA marcado). Campo omitido = não mexe; '' = apaga.
// args: { clientId?, clientSecret?, applicationKey?, ambiente?: 'Homologação'|'Produção' }  devolve { viaAmbiente, valores }
const { dropdown } = require('../../_comum');
const ids = { clientId: 'ddaClientId', clientSecret: 'ddaClientSecret', applicationKey: 'ddaApplicationKey' };

module.exports = {
  async preencherDda(t, args = {}) {
    const { p, tela } = t;
    for (const [k, id] of Object.entries(ids)) {
      if (!(k in args)) continue;
      const inp = p.locator(`input#${id}:visible`).first();
      await p.locator(`input#${id}`).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      if (!(await inp.count())) throw new Error(`campo ${id} não aparece no card Configuração DDA`);
      await inp.click(); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
      if (args[k]) await p.keyboard.type(String(args[k]), { delay: 10 });
      await p.keyboard.press('Tab'); await tela.pronto(p, 200);
    }
    let viaAmbiente = null;
    if (args.ambiente) { await dropdown(t, p, 'Ambiente', args.ambiente); viaAmbiente = dropdown.ultimo.via; if (viaAmbiente !== 'mouse') t.anotar(`ATENÇÃO: dropdown Ambiente (Configuração DDA) só trocou via ${viaAmbiente}`); }
    const valores = await require('./ler-configuracao-dda').lerDda(t);
    return { viaAmbiente, valores: valores.campos };
  },
};
