// Tela: Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)
// Novo abre o modal "Selecione o Tipo" (radios, Cancelar/Confirmar). No form o dropdown Tipo (#tipoCalculo) fica desabilitado;
// a fórmula é montada clicando nas variáveis (li.formula-variavel, por rótulo) e nos operadores (li.formula-operador:
// dígitos, ( ) + - * /). O mesmo arquivo tem o ajudante do campo autocomplete de fórmula usado no Item, Grupo e Filial.

const opcoesVisiveis = (p) => p.locator('.p-autocomplete-panel:visible li, li[role=option]:visible');

async function abrirNovo(t, tipo) {
  const { p, tela } = t;
  await tela.abrir(p, '/fiscal/formula');
  await tela.botao(p, 'Novo', { noDialogo: false });
  const dlg = await tela.dialogo(p);
  if (!dlg || !/Selecione o Tipo/.test(await dlg.innerText())) throw new Error('Novo não abriu o modal "Selecione o Tipo"');
  const tipos = (await dlg.locator('p-radiobutton').allInnerTexts()).map(tela.limpo).filter(Boolean);
  if (tipo) {
    await dlg.locator('p-radiobutton').filter({ hasText: new RegExp(`^\\s*${tipo}\\s*$`) }).first().locator('.p-radiobutton-box').click();
    await tela.botao(p, 'Confirmar', { escopo: dlg });
    await tela.pronto(p, 800);
  }
  return tipos;
}

module.exports = {
  // Opções do modal "Selecione o Tipo" (na ordem) e do filtro Tipo da listagem. → { modal:[...], filtro:[...] }
  async tipos(t) {
    const { p, tela } = t;
    const modal = await abrirNovo(t);
    await tela.botao(p, 'Cancelar');
    await tela.abrir(p, '/fiscal/formula');
    // o filtro fica num painel lateral (p-sidebar) aberto pelo funil
    await p.locator('button[data-title="Filtrar"], button:has(.ph-funnel)').first().click(); await tela.pronto(p, 800);
    await p.locator('p-dropdown#filtro-tipo .p-dropdown').click(); await tela.esperar(p, 500);
    const filtro = (await p.locator('li.p-dropdown-item:visible').allInnerTexts()).map(tela.limpo);
    await p.keyboard.press('Escape');
    return { modal, filtro };
  },

  // Abre Novo no tipo pedido e devolve o que o form mostra. → { tipo, acordeoes: { 'Variáveis da Nota de Entrada': [...] } }
  async formNovo(t, { tipo }) {
    const { p, tela } = t;
    await abrirNovo(t, tipo);
    const acordeoes = {};
    for (const tab of await p.locator('app-montagem-de-formula p-accordiontab').all()) {
      if (!(await tab.isVisible())) continue;
      const titulo = tela.limpo(await tab.locator('.header-title').first().innerText().catch(() => ''));
      if (!titulo) continue;
      acordeoes[titulo] = (await tab.locator('li.formula-variavel').allInnerTexts()).map(tela.limpo);
    }
    const tipoTela = tela.limpo(await p.locator('p-dropdown#tipoCalculo').innerText());
    return { tipo: tipoTela, acordeoes };
  },

  // Cria a fórmula pela tela. termos: rótulos de variável ("Valor Total Item - NF Entrada") e operadores ("(", "+", "/", "1"...),
  // na ordem. → { id, formula } lidos do banco
  async criar(t, { tipo, descricao, termos }) {
    const { p, tela } = t;
    await abrirNovo(t, tipo);
    await tela.digitar(p, p.locator('input#descricao'), descricao);
    const area = p.locator('app-montagem-de-formula');
    for (const termo of termos) {
      const op = area.locator('li.formula-operador').filter({ hasText: new RegExp(`^\\s*${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) });
      const vr = area.locator('p-accordiontab li.formula-variavel').filter({ hasText: new RegExp(`^\\s*${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) });
      const alvo = (await op.count()) ? op.first() : (await vr.count()) ? vr.first() : null;
      if (!alvo) throw new Error(`termo "${termo}" não está nas variáveis nem nos operadores`);
      await alvo.scrollIntoViewIfNeeded(); await alvo.click(); await tela.esperar(p, 150);
    }
    const montada = (await area.locator('#center li').allInnerTexts()).map(tela.limpo);
    const s = await tela.salvar(p);
    if (s.status !== 'salvo') throw new Error(`fórmula não salvou (${[...s.toasts, ...s.dialogos].join(' | ').slice(0, 300) || 'sem aviso'})`);
    const l = await t.banco.linha('select ID_FORMULA, FORMULA, TIPO_CALCULO from FORMULA where DESCRICAO = ? order by ID_FORMULA desc limit 1', [descricao]);
    return { id: l && l.ID_FORMULA, formula: l && l.FORMULA, tipo: l && l.TIPO_CALCULO, montada };
  },

  // Fórmula montada na tela de um cadastro existente (espera os termos carregarem). → [termos]
  async montada(t, { id }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/formula/form?id=' + id);
    const li = p.locator('app-montagem-de-formula #center li');
    await li.first().waitFor({ timeout: 15000 }).catch(() => {});
    return (await li.allInnerTexts()).map(tela.limpo);
  },

  // Exclui pelo ⋮ › Excluir do form. Fórmula com vínculo: o sistema responde com o diálogo
  // "Não é possível excluir este cadastro, pois possui vínculos no sistema. Deseja inativar?" — o passo responde `inativar` (padrão Não).
  // → { confirmacao, resposta, toasts }
  async excluir(t, { id, inativar = false }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/formula/form?id=' + id);
    await tela.menuKebab(p, /Excluir|Remover/);
    const confirmacao = (await tela.textoDialogos(p)).join(' | ');
    await tela.confirmar(p, ['Excluir', 'Sim', 'Confirmar']);
    await tela.pronto(p, 800);
    const toasts = await tela.toasts(p);
    const resposta = (await tela.textoDialogos(p)).join(' | ');
    if (/Deseja inativar/i.test(resposta)) await tela.botao(p, inativar ? 'Sim' : 'Não');
    return { confirmacao, resposta, toasts };
  },

  // Campo autocomplete de fórmula na tela aberta (ex.: input#formulaValorAquisicao no Item/Grupo/Filial).
  // Lista as opções pela seta, lê o link de cadastro rápido, escolhe `escolher` (texto) ou limpa (`limpar: true`).
  // → { rotulo, obrigatorio, opcoes:[...], linkAntes, linkDepois, valor }
  async campo(t, { campo, escolher, limpar }) {
    const { p, tela } = t;
    const inp = p.locator(`input#${campo}`).first();
    await inp.waitFor({ state: 'visible', timeout: 30000 });
    await inp.scrollIntoViewIfNeeded();
    const grupo = inp.locator('xpath=ancestor::div[contains(@class,"form-group")][1]');
    const rotulo = tela.limpo(await grupo.locator('label').first().innerText());
    const obrigatorio = (await grupo.locator('.campo-obrigatorio').count()) > 0 || /\*/.test(rotulo);
    const link = grupo.locator('a.link-cadastroRapido');
    const linkAntes = (await link.count()) ? await link.getAttribute('href') : null;
    await grupo.locator('button.p-autocomplete-dropdown').click(); await tela.pronto(p, 800);
    const opcoes = (await opcoesVisiveis(p).allInnerTexts()).map(tela.limpo);
    await p.keyboard.press('Escape'); await tela.esperar(p, 300);
    if (limpar) { await inp.click(); await inp.fill(''); await p.keyboard.press('Tab'); await tela.pronto(p, 400); }
    else if (escolher) await tela.autocomplete(p, inp, escolher.slice(0, 12), escolher);
    const linkDepois = (await link.count()) ? await link.getAttribute('href') : null;
    return { rotulo, obrigatorio, opcoes, linkAntes, linkDepois, valor: await inp.inputValue() };
  },
};
