// Tela: Cadastros › Financeiro › Movimentação automática OFX (/financeiro/movimentacao-automatica-ofx) — cria uma configuração pelo Novo.
const { observar } = require('../../_comum');
const { ROTA, ac, clicarTipo, lerForm, obrigatorios } = require('./_apoio');

module.exports = {
  // Novo → preenche → Salvar. Não lança erro em validação.
  // args: { descricao, conta, tipo:'D'|'C', debito, credito, centro, conciliado, padroes:[[condicao,texto]], duploClique, naoPreencher:['descricao','conta','tipo','centro','condicao','texto'] }
  // debito/credito vazios = mantém o que a tela sugeriu.
  // → { id (banco, ou null), ids (todos os gravados com a descrição), toasts, eventos, obrigatorios, errosApi, valores:{credito,debito}, url }
  async criar(t, { descricao, conta, tipo, debito, credito, centro, conciliado = false, padroes = [], duploClique = false, naoPreencher = [] } = {}) {
    const { p, tela } = t;
    const pula = new Set(naoPreencher);
    await tela.abrir(p, ROTA);
    await p.getByText('Novo', { exact: true }).first().click();
    await tela.pronto(p, 800);
    await p.locator('input#descricao').waitFor({ timeout: 20000 });
    if (descricao && !pula.has('descricao')) await p.locator('input#descricao').fill(descricao);
    if (conta && !pula.has('conta')) await ac(t, 'configuracaoPortador', conta);
    if (tipo && !pula.has('tipo')) await clicarTipo(t, tipo);
    if (debito && !pula.has('debito')) await ac(t, 'planoContaAnaliticaDebito', debito);
    if (credito && !pula.has('credito')) await ac(t, 'planoContaAnaliticaCredito', credito);
    if (centro && !pula.has('centro')) await ac(t, 'centroResultadoDetalhe', centro);
    if (conciliado) { await p.locator('#geraLancamentoConciliado .p-checkbox-box').click(); await tela.pronto(p, 300); }
    for (let i = 0; i < padroes.length; i++) {
      await p.getByText('Adicionar', { exact: true }).first().click(); await tela.pronto(p, 300);
      const [cond, txt] = padroes[i];
      if (cond && !pula.has('condicao')) {
        await p.locator(`#condicao${i} .p-dropdown`).click(); await tela.pronto(p, 300);
        await p.locator('li.p-dropdown-item:visible').filter({ hasText: cond }).first().click(); await tela.pronto(p, 300);
      }
      if (txt && !pula.has('texto')) await p.locator(`input#texto${i}`).fill(txt);
    }
    const f = await lerForm(p);
    const valores = { credito: f.credito, debito: f.debito, tipo: f.tipo, padroes: f.padroes };
    const idAntes = Number(await t.banco.valor('SELECT COALESCE(MAX(ID_MOVIMENTACAO_AUTOMATICA_OFX),0) FROM MOVIMENTACAO_AUTOMATICA_OFX')) || 0;
    const btn = p.getByRole('button', { name: 'Salvar', exact: true }).first();
    const alvo = duploClique ? { click: () => btn.dblclick() } : btn;
    const r = await observar(t, alvo, { minimo: 2500 });
    const obrig = await obrigatorios(p);
    const linhas = descricao ? await t.banco.consultar('SELECT ID_MOVIMENTACAO_AUTOMATICA_OFX AS ID FROM MOVIMENTACAO_AUTOMATICA_OFX WHERE ID_MOVIMENTACAO_AUTOMATICA_OFX > ? AND DESCRICAO = ? ORDER BY 1', [idAntes, descricao]) : [];
    const ids = linhas.map((l) => Number(l.ID));
    return {
      id: ids.length ? ids[ids.length - 1] : null, ids,
      toasts: r.eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)),
      eventos: r.eventos, obrigatorios: obrig, errosApi: r.errosApi, valores, url: p.url(),
    };
  },
};
