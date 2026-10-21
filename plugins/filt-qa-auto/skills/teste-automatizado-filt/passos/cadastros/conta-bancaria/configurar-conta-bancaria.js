// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  // Abre a conta, ajusta provedor/tipo/credenciais e salva. Confirma o aviso de limpar credenciais quando sai do Híbrido.
  // NUNCA usar numa conta com credenciais reais sem backup (a troca de tipo apaga as credenciais).
  // args: { id, provedor?: 'Interno'|'Externo', tipo?: 'Manual'|'Online'|'Automática'|'Híbrido', credenciais?: { clientId, clientSecret, applicationKey } }
  // devolve { eventos, errosApi, dialogos }
  async configurar(t, { id, provedor, tipo, formato, credenciais }) {
    const { p, tela } = t;
    await require('./abrir-conta-bancaria').abrir(t, { id });
    const dialogos = [];
    const confirma = async () => { const d = await tela.textoDialogos(p); if (d.length) { dialogos.push(...d); await tela.confirmar(p, ['Sim', 'Confirmar', 'Continuar', 'Ok']); } };
    if (formato) { await dropdown(t, p, 'Formato de transmissão', formato); await confirma(); }
    // ordem: tipo antes do provedor quando sai do Híbrido (Externo com Híbrido selecionado é a Reprovação 01)
    if (tipo && !/h[ií]brido/i.test(tipo)) { await dropdown(t, p, 'Tipo de transmissão', tipo); await confirma(); }
    if (provedor) { await dropdown(t, p, 'Provedor do boleto', provedor); await confirma(); }
    if (tipo && /h[ií]brido/i.test(tipo)) { await dropdown(t, p, 'Tipo de transmissão', tipo); await confirma(); }
    for (const [k, v] of Object.entries(credenciais || {})) {
      const inp = p.locator(`input#${k}:visible, input[name=${k}]:visible`).first();
      if (!(await inp.count())) throw new Error(`campo de credencial ${k} não aparece`);
      await inp.click(); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
      if (v) await p.keyboard.type(String(v), { delay: 10 });
      await p.keyboard.press('Tab'); await tela.pronto(p, 200);
    }
    // Salvar fica desabilitado com o form de cobrança inválido (ex.: credencial obrigatória vazia): não clica
    const bt = p.getByRole('button', { name: 'Salvar', exact: true }).first();
    const salvarHabilitado = (await bt.isEnabled()) && !(await bt.evaluate((b) => b.disabled || b.classList.contains('p-disabled') || !!b.closest('[disabled]')));
    // campos que o Angular marca como inválidos (explica um Salvar que não grava)
    const invalidos = await p.locator('.ng-invalid:not(form):not(ng-form)').evaluateAll((es) => [...new Set(es.filter((e) => e.offsetParent).map((e) => e.id || e.getAttribute('name') || e.tagName.toLowerCase()))]);
    const valores = await p.locator('p-dropdown').evaluateAll((es) => es.filter((e) => e.offsetParent).map((e) => `${e.id}=${(e.querySelector('.p-dropdown-label') || {}).innerText || ''}`));
    if (!salvarHabilitado) return { salvarHabilitado, invalidos, valores, eventos: [], errosApi: [], dialogos };
    const r = await observar(t, bt, { minimo: 2500 });
    await confirma();
    return { salvarHabilitado, invalidos, valores, eventos: r.eventos, errosApi: r.errosApi, dialogos };
  },
};
