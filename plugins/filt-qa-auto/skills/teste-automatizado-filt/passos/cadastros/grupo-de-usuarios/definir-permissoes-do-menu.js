// Tela: Cadastros › Grupo de Usuários (/master/grupo-usuario/form?id=<ID_GRUPO_USUARIO>)
// Seção Permissões → Adicionar → diálogo "Permissões": autocomplete Menu (#menu-complete, opções "Caminho > Menu") →
// accordion do menu pai (vem recolhido: clicar no cabeçalho) → toggles mat-slide-toggle com title = ação, dentro de
// [id^=item-geral-<idMenu>-] / [id^=item-especificas-<idMenu>-] → Salvar do diálogo (já grava; o diálogo continua aberto: Cancelar).
// Regras da tela: desligar Visualizar desliga todas as ações do menu; ligar Incluir/Alterar/... liga Visualizar junto.
// Banco: GRUPO_USUARIO_ACAO (ID_GRUPO_USUARIO, ID_MENU_ACAO); ações em VIASELL.MENU_ACAO (ID_MENU) + VIASELL.ACAO.
const { limpo } = require('../../_comum');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

async function lerToggles(d) {
  return d.locator('[id^=item-geral-] mat-slide-toggle, [id^=item-especificas-] mat-slide-toggle').evaluateAll((els) => els.map((el) => {
    const box = el.closest('[id^=item-]');
    const inp = el.querySelector('input');
    return {
      titulo: (el.getAttribute('title') || el.innerText || '').replace(/\s+/g, ' ').trim(),
      ligado: !!(inp && (inp.checked || inp.getAttribute('aria-checked') === 'true')) || /mat-(mdc-slide-toggle-)?checked/.test(el.className),
      habilitado: !(inp && inp.disabled),
      idMenu: Number(((box && box.id) || '').split('-')[2]) || null,
      tipo: /especificas/.test((box && box.id) || '') ? 'específica' : 'geral',
    };
  }));
}

module.exports = {
  // Liga/desliga as ações de UM menu num grupo de usuários pela tela e salva.
  // args: { grupo: 'DESCRIÇÃO DO GRUPO' (ou idGrupo), menu: 'Retorno Bancário' (nome do item do menu; caminho opcional p/ desempatar:
  //         'Financeiro > Retorno Bancário'), acoes: { 'Visualizar': true, '<title do toggle>': false, ... } (só as informadas mudam;
  //         {} = só lê e cancela), salvar?: true }
  // devolve { idGrupo, idMenu, opcaoMenu, antes: [{titulo, ligado, tipo}], depois: [...], mudou: [titulos clicados],
  //           toasts, banco: [{ID_MENU_ACAO, ACAO}] (ações do menu gravadas no grupo, lidas do banco depois de salvar) }
  async definirPermissoes(t, { grupo, idGrupo, menu, acoes = {}, salvar = true }) {
    const { p, tela } = t;
    if (!idGrupo) {
      const l = await t.banco.linha('select ID_GRUPO_USUARIO id from GRUPO_USUARIO where DESCRICAO = ?', [grupo]);
      if (!l) throw new Error(`grupo de usuários "${grupo}" não existe no banco`);
      idGrupo = l.id;
    }
    await tela.abrir(p, '/master/grupo-usuario/form?id=' + idGrupo);
    await tela.botao(p, 'Adicionar', { noDialogo: false });
    const d = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: /^\s*Permissões\s*$/ }) }).last();
    await d.waitFor({ timeout: 15000 });

    // menu pelo autocomplete (opção "Caminho > Menu")
    const nome = menu.split('>').pop().trim();
    const inp = d.locator('input#menu-complete');
    await inp.click(); await inp.fill('');
    await p.keyboard.type(nome.slice(0, 20), { delay: 40 });
    await tela.pronto(p, 600);
    const ops = p.locator('.p-autocomplete-panel:visible li');
    await ops.first().waitFor({ timeout: 10000 }).catch(() => {});
    const textos = (await ops.allInnerTexts()).map(limpo);
    const alvo = menu.includes('>') ? new RegExp(esc(menu.replace(/\s*>\s*/g, '>')).replace(/>/g, '\\s*>\\s*') + '\\s*$', 'i') : new RegExp('(^|>)\\s*' + esc(nome) + '\\s*$', 'i');
    const i = textos.findIndex((x) => alvo.test(x));
    if (i < 0) throw new Error(`menu "${menu}" não aparece no autocomplete (opções: ${textos.slice(0, 10).join(' | ') || 'nenhuma'})`);
    const opcaoMenu = textos[i];
    await ops.nth(i).click(); await tela.pronto(p, 800);

    // accordion do menu pai vem recolhido
    const toggles = d.locator('[id^=item-geral-] mat-slide-toggle, [id^=item-especificas-] mat-slide-toggle');
    // (os toggles ficam no DOM mesmo recolhido: decide pelo aria-expanded; clica no título, à esquerda dos botões "Conceder/Remover")
    const cab = d.locator('.p-accordion-header-link').first();
    await cab.waitFor({ timeout: 10000 });
    if ((await cab.getAttribute('aria-expanded')) !== 'true') {
      await cab.click({ position: { x: 25, y: 15 } }); await tela.pronto(p, 600);
      if ((await cab.getAttribute('aria-expanded')) !== 'true') throw new Error('o clique no título do menu pai não expandiu as ações');
    }
    await toggles.first().waitFor({ state: 'visible', timeout: 10000 });
    const antes = await lerToggles(d);
    const idsMenu = [...new Set(antes.map((x) => x.idMenu))];

    // desligar Visualizar desliga tudo: aplica Visualizar primeiro e depois o resto
    const ordem = Object.keys(acoes).sort((a, b) => (/^Visualizar$/i.test(b) ? 1 : 0) - (/^Visualizar$/i.test(a) ? 1 : 0));
    const mudou = [];
    for (const titulo of ordem) {
      const tg = d.locator(`mat-slide-toggle[title="${titulo}"]`);
      const n = await tg.count();
      if (n !== 1) throw new Error(`ação "${titulo}" ${n ? 'aparece ' + n + ' vezes' : 'não existe'} no menu ${opcaoMenu} (tem: ${antes.map((x) => x.titulo).join(' | ')})`);
      const atual = (await lerToggles(d)).find((x) => x.titulo === titulo);
      if (atual.ligado === !!acoes[titulo]) continue;
      const alvoClique = tg.locator('label, button').first();
      try { await alvoClique.click({ timeout: 8000 }); } catch (e) {
        const diag = await alvoClique.evaluate((el) => {
          const r = el.getBoundingClientRect(); const x = r.x + r.width / 2; const y = r.y + r.height / 2;
          const top = document.elementFromPoint(x, y);
          return { caixa: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], janela: [innerWidth, innerHeight], porCima: top ? `${top.tagName}.${top.className}`.slice(0, 120) : null };
        }).catch(() => null);
        if (process.env.FILT_QA_PRINT) await p.screenshot({ path: process.env.FILT_QA_PRINT }).catch(() => {});
        throw new Error(`o toggle "${titulo}" não recebeu o clique: ${JSON.stringify(diag)} — ${e.message.split('\n').filter((l) => /intercept|visible|stable|outside|enabled/i.test(l)).slice(-3).join(' / ')}`);
      }
      await tela.pronto(p, 300);
      mudou.push(titulo);
      const novo = (await lerToggles(d)).find((x) => x.titulo === titulo);
      if (novo.ligado !== !!acoes[titulo]) throw new Error(`o clique no toggle "${titulo}" não trocou o valor (continua ${novo.ligado ? 'ligado' : 'desligado'})`);
    }
    const depois = await lerToggles(d);
    const diverge = Object.entries(acoes).filter(([k, v]) => (depois.find((x) => x.titulo === k) || {}).ligado !== !!v);
    if (diverge.length) throw new Error('a tela não ficou como pedido (dependência entre ações?): ' + diverge.map(([k, v]) => `${k} pedido ${v ? 'ligado' : 'desligado'}`).join('; '));

    let toasts = [];
    if (salvar && Object.keys(acoes).length) {
      await tela.fecharToasts(p);
      await d.getByRole('button', { name: 'Salvar', exact: true }).click();
      await tela.pronto(p, 800);
      toasts = await tela.toasts(p);
      if (!toasts.some((x) => /sucesso/i.test(x))) throw new Error('Salvar das permissões sem "Salvo com sucesso" (toasts: ' + (toasts.join(' | ') || 'nenhum') + ')');
    }
    const cancelar = d.getByRole('button', { name: 'Cancelar', exact: true });
    if (await cancelar.isVisible().catch(() => false)) { await cancelar.click(); await tela.pronto(p, 300); }

    const banco = await t.banco.consultar(
      `select ga.ID_MENU_ACAO, a.ACAO from GRUPO_USUARIO_ACAO ga join VIASELL.MENU_ACAO ma on ma.ID_MENU_ACAO = ga.ID_MENU_ACAO
        join VIASELL.ACAO a on a.ID_ACAO = ma.ID_ACAO where ga.ID_GRUPO_USUARIO = ? and ma.ID_MENU in (${idsMenu.map(Number).join(',') || 0}) order by ga.ID_MENU_ACAO`, [idGrupo]);
    return { idGrupo, idMenu: idsMenu.length === 1 ? idsMenu[0] : idsMenu, opcaoMenu, antes, depois, mudou, toasts, banco };
  },
};
