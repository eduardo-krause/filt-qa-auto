// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
// Configuração de cobrança no mesmo form: Formato (formaTransmissao), Tipo de transmissão (tipoTransmissao),
// credenciais (clientId, clientSecret, applicationKey), nosso número (faixaInicialNossoNumero, limiteNossoNumero, ultimoNossoNumero).
// ATENÇÃO: trocar o Tipo de transmissão de Híbrido para outro APAGA as credenciais (confirmação da tela).
const { limpo, observar, dropdown } = require('../_comum');

const visiveis = (p, re) => p.locator('label:visible').evaluateAll((ls, src) => ls.map((l) => l.textContent.replace(/\*/g, '').trim()).filter((x) => new RegExp(src, 'i').test(x)), re);

module.exports = {
  async abrir(t, { id }) { await t.tela.abrir(t.p, '/fiscal/configuracao-portador/form?id=' + id); return limpo(await t.p.locator('h1, h2, .titulo').first().innerText().catch(() => '')); },

  // Estado de um dropdown do form (abre, lê as opções e fecha). args: { rotulo }  devolve { valor, opcoes }
  async dropdownEstado(t, { rotulo }) {
    const { p, tela } = t;
    const lab = p.locator('label:visible').filter({ hasText: new RegExp(`^\\s*${rotulo}\\s*\\*?\\s*$`, 'i') }).first();
    if (!(await lab.count())) return { valor: null, opcoes: [], visivel: false };
    const d = lab.locator('xpath=ancestor::*[.//p-dropdown][1]').locator('.p-dropdown').first();
    const valor = limpo(await d.locator('.p-dropdown-label').innerText());
    let opcoes = [];
    for (let i = 0; i < 3 && !opcoes.length; i++) { await d.click(); await tela.pronto(p, 600); opcoes = (await p.locator('.p-dropdown-panel:visible li[role=option]').allInnerTexts()).map(limpo); }
    await p.keyboard.press('Escape'); await tela.pronto(p, 300);
    return { valor, opcoes, visivel: true };
  },

  // Escolhe a opção do dropdown e devolve os diálogos que abriram (ex.: aviso de limpar credenciais). args: { rotulo, opcao }
  async escolher(t, { rotulo, opcao }) {
    const valor = await dropdown(t, t.p, rotulo, opcao);
    return { valor, via: dropdown.ultimo.via, cliques: dropdown.ultimo.cliques, dialogos: await t.tela.textoDialogos(t.p) };
  },

  // Rótulos de credenciais visíveis (card de credenciais do híbrido).
  async credenciaisVisiveis(t) { return visiveis(t.p, 'client id|client secret|c[oó]digo de acesso|aplication key|application key'); },

  // Troca um campo de texto do form pelo id e salva. args: { campo: 'limiteNossoNumero', valor }  devolve { antes, eventos }
  async alterarCampo(t, { campo, valor }) {
    const { p, tela } = t;
    const inp = p.locator(`input#${campo}:visible, input[name=${campo}]:visible`).first();
    const antes = await inp.inputValue();
    await tela.digitar(p, inp, String(valor), { tab: true });
    const r = await observar(t, p.getByRole('button', { name: 'Salvar', exact: true }).first(), { minimo: 2500 });
    return { antes, eventos: r.eventos, errosApi: r.errosApi };
  },

  // Abre a conta, ajusta provedor/tipo/credenciais e salva. Confirma o aviso de limpar credenciais quando sai do Híbrido.
  // NUNCA usar numa conta com credenciais reais sem backup (a troca de tipo apaga as credenciais).
  // args: { id, provedor?: 'Interno'|'Externo', tipo?: 'Manual'|'Online'|'Automática'|'Híbrido', credenciais?: { clientId, clientSecret, applicationKey } }
  // devolve { eventos, errosApi, dialogos }
  async configurar(t, { id, provedor, tipo, formato, credenciais }) {
    const { p, tela } = t;
    await module.exports.abrir(t, { id });
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

  // Salvar do form, juntando avisos.
  async salvar(t) { const r = await observar(t, t.p.getByRole('button', { name: 'Salvar', exact: true }).first(), { minimo: 2500 }); return r; },
};
