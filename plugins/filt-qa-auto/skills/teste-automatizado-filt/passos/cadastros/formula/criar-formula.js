// Tela: Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)
const { abrirNovo } = require('./_apoio');

module.exports = {
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
      // variável de uma seção fechada (ex.: "Variáveis da Nota de Saída"): abre a seção pelo cabeçalho, como o usuário faz
      if (!(await op.count())) {
        // a seção fechada tem altura 0 mas o Playwright ainda vê o item: decide pelo cabeçalho (p-highlight = aberta)
        const exato = new RegExp(`^\\s*${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
        const cab = area.locator('p-accordiontab').filter({ has: p.locator('li.formula-variavel', { hasText: exato }) }).first().locator('.p-accordion-header').first();
        if (!/p-highlight/.test((await cab.getAttribute('class')) || '')) {
          await cab.click(); await tela.pronto(p, 600);
          if (!/p-highlight/.test((await cab.getAttribute('class')) || '')) throw new Error(`termo "${termo}": cliquei na seção "${tela.limpo(await cab.innerText())}" e ela não abriu`);
        }
      }
      await alvo.scrollIntoViewIfNeeded(); await alvo.click(); await tela.esperar(p, 150);
    }
    const montada = (await area.locator('#center li').allInnerTexts()).map(tela.limpo);
    const s = await tela.salvar(p);
    if (s.status !== 'salvo') throw new Error(`fórmula não salvou (${[...s.toasts, ...s.dialogos].join(' | ').slice(0, 300) || 'sem aviso'})`);
    const l = await t.banco.linha('select ID_FORMULA, FORMULA, TIPO_CALCULO from FORMULA where DESCRICAO = ? order by ID_FORMULA desc limit 1', [descricao]);
    return { id: l && l.ID_FORMULA, formula: l && l.FORMULA, tipo: l && l.TIPO_CALCULO, montada };
  },
};
