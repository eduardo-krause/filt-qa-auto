// Tela: Cadastros › Itens › Grupos (/fiscal/grupo-item)

module.exports = {
  // Cria um grupo filho: botão direito no nó do pai → "Adicionar <nível>" → diálogo (#descricaoSelected2) → Salvar do diálogo →
  // Salvar da tela. args: { pai: '13 - ADUBO' (texto do nó), descricao: 'ADUBO FILHO', idPai: 13 }
  // → { id, pai, nivel, menu, toasts } lidos do banco
  async criarSubgrupo(t, { pai, descricao, idPai }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/grupo-item');
    if (!(await tela.semLoader(p))) throw new Error('loader da tela de Grupos não sumiu');
    const no = p.getByText(pai, { exact: true }).filter({ visible: true }).first();
    await no.waitFor({ timeout: 30000 }).catch(() => { throw new Error(`nó "${pai}" não aparece na árvore`); });
    await tela.pronto(p, 800);
    await no.click({ button: 'right' });
    await tela.esperar(p, 800);
    const itens = p.locator('.p-contextmenu:visible li');
    const menu = (await itens.allInnerTexts()).map(tela.limpo).filter(Boolean);
    const sub = menu.find((m) => /^Adicionar /.test(m) && m !== menu[0]);
    if (!sub) throw new Error(`menu do nó não tem opção de sub-nível (tem: ${menu.join(' | ')})`);
    await itens.filter({ hasText: sub }).first().click();
    await tela.pronto(p, 600);
    const d = p.locator('.p-dialog:visible').last();
    const inp = d.locator('input#descricaoSelected2');
    await inp.waitFor({ timeout: 15000 }).catch(() => { throw new Error('diálogo do sub-grupo não abriu'); });
    await inp.click(); await p.keyboard.type(descricao, { delay: 30 });
    await d.getByRole('button', { name: 'Salvar', exact: true }).click();
    await tela.pronto(p, 800);
    if (await p.locator('.p-dialog:visible input#descricaoSelected2').count()) throw new Error('diálogo do sub-grupo continuou aberto depois do Salvar');
    const s = await tela.salvar(p);
    const l = await t.banco.linha('select ID_GRUPO_ITEM_DETALHE, ID_GRUPO_ITEM_DETALHE_PAI, ID_CONFIGURACAO_GRUPO_ITEM_NIVEL from GRUPO_ITEM_DETALHE where DESCRICAO = ? order by 1 desc limit 1', [descricao]);
    if (!l) throw new Error(`"${descricao}" não gravou em GRUPO_ITEM_DETALHE (toasts: ${s.toasts.join(' | ') || 'nenhum'})`);
    if (idPai) t.confere('pai do sub-grupo', l.ID_GRUPO_ITEM_DETALHE_PAI, idPai);
    return { id: l.ID_GRUPO_ITEM_DETALHE, pai: l.ID_GRUPO_ITEM_DETALHE_PAI, nivel: l.ID_CONFIGURACAO_GRUPO_ITEM_NIVEL, menu, toasts: s.toasts, dialogos: s.dialogos };
  },
};
