// Tela: Cadastros › Financeiro › Movimentação automática OFX (form?id=N) — altera e salva.
const { observar } = require('../../_comum');
const { ROTA, ac, lerForm, obrigatorios } = require('./_apoio');

async function escolherCondicao(t, i, cond) {
  const { p, tela } = t;
  await p.locator(`#condicao${i} .p-dropdown`).click(); await tela.pronto(p, 300);
  await p.locator('li.p-dropdown-item:visible').filter({ hasText: cond }).first().click(); await tela.pronto(p, 300);
}

module.exports = {
  // args: { id, descricao, centro, debito, credito, editarPadrao:[[i,condicao,texto]], removerPadrao:[i], adicionarPadrao:[[condicao,texto]], conciliado:true|false }
  // removerPadrao: índices na ordem da tela ANTES de remover (remove do maior para o menor).
  // → { toasts, eventos, errosApi, obrigatorios, antes:{padroes,centro,conciliado}, depois:{idem, como ficou na tela antes do Salvar} }
  async editar(t, { id, descricao, centro, debito, credito, editarPadrao = [], removerPadrao = [], adicionarPadrao = [], conciliado }) {
    const { p, tela } = t;
    await tela.abrir(p, `${ROTA}/form?id=${id}`);
    await p.locator('input#descricao').waitFor({ timeout: 20000 }); await tela.pronto(p, 600);
    const antes = await lerForm(p);
    if (descricao != null) await p.locator('input#descricao').fill(descricao);
    if (centro) await ac(t, 'centroResultadoDetalhe', centro);
    if (debito) await ac(t, 'planoContaAnaliticaDebito', debito);
    if (credito) await ac(t, 'planoContaAnaliticaCredito', credito);
    for (const [i, cond, txt] of editarPadrao) {
      if (cond) await escolherCondicao(t, i, cond);
      if (txt != null) await p.locator(`input#texto${i}`).fill(txt);
    }
    for (const i of [...removerPadrao].sort((a, b) => b - a)) {
      await p.locator(`input#texto${i}`).locator('xpath=ancestor::div[contains(@class,"row")][1]').locator('app-remover').first().click();
      await tela.pronto(p, 400);
    }
    for (const [cond, txt] of adicionarPadrao) {
      const n = await p.locator('input[id^=texto]').count();
      await p.getByText('Adicionar', { exact: true }).first().click(); await tela.pronto(p, 300);
      if (cond) await escolherCondicao(t, n, cond);
      if (txt) await p.locator(`input#texto${n}`).fill(txt);
    }
    if (conciliado != null && antes.conciliado !== conciliado) { await p.locator('#geraLancamentoConciliado .p-checkbox-box').click(); await tela.pronto(p, 300); }
    const depois = await lerForm(p);
    const r = await observar(t, p.getByRole('button', { name: 'Salvar', exact: true }).first(), { minimo: 2500 });
    return {
      toasts: r.eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)), eventos: r.eventos, errosApi: r.errosApi,
      obrigatorios: await obrigatorios(p),
      antes: { padroes: antes.padroes, centro: antes.centro, conciliado: antes.conciliado },
      depois: { padroes: depois.padroes, centro: depois.centro, conciliado: depois.conciliado },
    };
  },
};
