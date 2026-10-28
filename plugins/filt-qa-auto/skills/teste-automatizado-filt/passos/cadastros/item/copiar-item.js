// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

module.exports = {
  // ⋮ (#dropdown-help) › Copiar › confirmação: o sistema copia o item (com tributação, grupos, locais) e abre a cópia em outra aba.
  // args: { id: ID_ITEM_FILIAL do item de origem } → { idItemFilial, idItem, descricao, toasts } (lidos do banco; a aba da cópia é fechada)
  async copiar(t, { id }) {
    const { p, tela } = t;
    const antes = Number(await t.banco.valor('select coalesce(max(ID_ITEM),0) from ITEM')) || 0;
    await require('./abrir-item').abrir(t, { id });
    await p.locator('header-form button#dropdown-help:visible').first().click(); await tela.pronto(p, 500);
    const op = p.locator('.dropdown-menu.show a.dropdown-item').filter({ hasText: /^\s*Copiar\s*$/ }).first();
    if (!(await op.count())) throw new Error('opção "Copiar" não apareceu no menu ⋮ do item ' + id);
    const nova = p.context().waitForEvent('page', { timeout: 60000 }); nova.catch(() => {});
    await op.click(); await tela.pronto(p, 500);
    const conf = await tela.confirmar(p, ['Sim', 'Confirmar', 'Ok']);
    if (!conf) throw new Error('Copiar não pediu confirmação (diálogos: ' + (await tela.textoDialogos(p)).join(' | ') + ')');
    const q = await nova.catch(() => null);
    const toasts = await tela.toasts(p);
    if (q) await q.close().catch(() => {});
    await p.bringToFront();
    const l = await t.banco.linha(`select i.ID_ITEM, i.DESCRICAO, f.ID_ITEM_FILIAL from ITEM i join ITEM_FILIAL f on f.ID_ITEM = i.ID_ITEM
      where i.ID_ITEM > ? and f.ID_FILIAL = (select ID_FILIAL from ITEM_FILIAL where ID_ITEM_FILIAL = ?) order by i.ID_ITEM desc limit 1`, [antes, id]);
    if (!l) throw new Error(`a cópia do item não apareceu no banco (abriu aba: ${!!q}; avisos: ${toasts.join(' | ') || 'nenhum'})`);
    return { idItemFilial: l.ID_ITEM_FILIAL, idItem: l.ID_ITEM, descricao: l.DESCRICAO, abriuAba: !!q, toasts };
  },
};
