// Tela: Cadastros › Financeiro › Movimentação automática OFX (/financeiro/movimentacao-automatica-ofx) — exclui pela lixeira da listagem.
const { observar, limpo } = require('../../_comum');
const { ROTA } = require('./_apoio');

module.exports = {
  // args: { id, confirmar = true (false = clica Cancelar/Não no diálogo) } → { dialogo, botoesDialogo, toasts, eventos, errosApi, existeNoBanco, linhaNaTela }
  async excluir(t, { id, confirmar = true }) {
    const { p, tela } = t;
    await tela.abrir(p, ROTA);
    await p.locator('app-grid tbody tr.table-body-line').first().waitFor({ timeout: 20000 }); await tela.pronto(p, 600);
    const linhaDe = () => p.locator('app-grid tbody tr.table-body-line').filter({ has: p.locator(`td.column-row-Data:first-child div[title="${id}"], td.column-row-Data div[title="${id}"]`) }).first();
    let linha = linhaDe();
    if (!(await linha.count())) {
      // fora da 1ª página: filtra pelo Código no painel lateral (como o usuário faria)
      await p.locator('app-grid button[data-title="Filtrar"]').first().click(); await tela.pronto(p, 600);
      const sb = p.locator('vs-filtro .p-sidebar');
      await sb.locator('#filtro-id').fill(String(id));
      await sb.getByRole('button', { name: 'Filtrar', exact: true }).click(); await tela.pronto(p, 800);
      linha = linhaDe();
    }
    if (!(await linha.count())) throw new Error(`configuração ${id} não aparece na primeira página da listagem`);
    // o <a> da lixeira tem display:contents (sem caixa própria): o clique vai no ícone
    await linha.locator('app-remover a i').first().click(); await tela.pronto(p, 600);
    const dlg = await tela.dialogo(p);
    const dialogo = dlg ? limpo(await dlg.innerText()) : null;
    const botoesDialogo = dlg ? (await dlg.getByRole('button').allInnerTexts()).map(limpo).filter(Boolean) : [];
    let r = { eventos: [], errosApi: [] };
    if (dlg) {
      const nomes = confirmar ? ['Sim', 'Excluir', 'Confirmar', 'Remover'] : ['Não', 'Cancelar'];
      const nome = nomes.find((n) => botoesDialogo.includes(n));
      if (!nome) throw new Error(`diálogo de exclusão sem botão esperado (tem: ${botoesDialogo.join(' | ')})`);
      r = await observar(t, dlg.getByRole('button', { name: nome, exact: true }).first(), { minimo: 2500 });
    }
    const existe = await t.banco.valor('SELECT COUNT(*) FROM MOVIMENTACAO_AUTOMATICA_OFX WHERE ID_MOVIMENTACAO_AUTOMATICA_OFX=?', [id]);
    return {
      dialogo, botoesDialogo, toasts: r.eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)), eventos: r.eventos, errosApi: r.errosApi,
      existeNoBanco: Number(existe) > 0, linhaNaTela: (await linhaDe().count()) > 0,
    };
  },
};
