// Tela: Cadastros › Financeiro › Movimentação automática OFX (form?id=N) — Ativar/Inativar pelo menu ⋮ do cabeçalho.
const { observar, limpo } = require('../../_comum');
const { ROTA } = require('./_apoio');

module.exports = {
  // args: { id, ativar:false|true } → { toasts, eventos, errosApi, opcoesMenu, opcaoClicada, dialogo, confirmou, inativoBanco, cardInativo }
  async situacao(t, { id, ativar = false }) {
    const { p, tela } = t;
    await tela.abrir(p, `${ROTA}/form?id=${id}`);
    await p.locator('input#descricao').waitFor({ timeout: 20000 }); await tela.pronto(p, 600);
    await p.locator('#dropdown-help').first().click(); await tela.pronto(p, 500);
    const itens = p.locator('.dropdown-menu.show a.dropdown-item');
    const opcoesMenu = (await itens.allInnerTexts()).map(limpo).filter(Boolean);
    const re = ativar ? /^Ativar/i : /^Inativar/i;
    const i = opcoesMenu.findIndex((x) => re.test(x));
    if (i < 0) { await p.locator('#dropdown-help').first().click(); return { toasts: [], eventos: [], errosApi: [], opcoesMenu, opcaoClicada: null }; }
    const ini = Date.now();
    const r = await observar(t, itens.nth(i), { minimo: 2000 });
    let dialogo = null; let confirmou = null; let r2 = { eventos: [], errosApi: [] };
    const dlg = await tela.dialogo(p);
    if (dlg) {
      dialogo = limpo(await dlg.innerText());
      for (const n of ['Sim', 'Confirmar', ativar ? 'Ativar' : 'Inativar']) {
        const b = dlg.getByRole('button', { name: n, exact: true });
        if (await b.count()) { confirmou = n; r2 = await observar(t, b.first(), { minimo: 2000 }); break; }
      }
    }
    const eventos = [...r.eventos, ...r2.eventos];
    const ev = await tela.evidencia(p, ini);
    const inat = await t.banco.valor('SELECT INATIVO+0 FROM MOVIMENTACAO_AUTOMATICA_OFX WHERE ID_MOVIMENTACAO_AUTOMATICA_OFX=?', [id]);
    return {
      toasts: [...new Set(eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)))], eventos,
      errosApi: [...new Set([...r.errosApi, ...r2.errosApi, ...(ev.errosApi || [])])], opcoesMenu, opcaoClicada: opcoesMenu[i], dialogo, confirmou,
      inativoBanco: inat == null ? null : Number(inat) === 1, cardInativo: (await p.locator('.card-inativo:visible').count()) > 0,
    };
  },
};
