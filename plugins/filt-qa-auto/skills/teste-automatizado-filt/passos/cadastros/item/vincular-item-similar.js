// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)
const { dropdown } = require('../../_comum');

module.exports = {
  // Dados Adicionais › aba "Itens Similares" › Adicionar → diálogo "Itens Similares": Item (input#itemSemelhante),
  // Tipo de Conversão (p-dropdown#tipoConversao: Multiplicação/Divisão), Fator de Conversão (input#fatorConversao, máscara com
  // as casas da unidade do item SIMILAR) → Adicionar. Em item já salvo o vínculo grava na hora (POST do item similar), sem Salvar.
  // args: { id: ID_ITEM_FILIAL do item, similar: descrição, tipo: 'Multiplicação'|'Divisão', fator: 5 }
  // → { toasts, dialogos, fatorDigitado, viaTipo, botao (texto do botão de confirmar), salvou (linha nova em ITEM_SIMILAR), similares: linhas do item no banco }
  async vincularSimilar(t, { id, similar, tipo = 'Multiplicação', fator }) {
    const { p, tela } = t;
    const idItem = await t.banco.valor('select ID_ITEM from ITEM_FILIAL where ID_ITEM_FILIAL = ?', [id]);
    const antes = Number(await t.banco.valor('select count(*) from ITEM_SIMILAR where ID_ITEM = ?', [idItem]));
    await require('./abrir-item').abrir(t, { id });
    const card = p.locator('p-accordiontab').filter({ hasText: 'Dados Adicionais' }).filter({ hasText: 'Itens Similares' }).last();
    const aba = card.locator('.p-tabview-nav li').filter({ hasText: 'Itens Similares' }).first();
    await aba.scrollIntoViewIfNeeded(); await aba.click(); await tela.pronto(p, 600);
    await card.locator('button.btn-add:visible').filter({ hasText: 'Adicionar' }).first().click(); await tela.pronto(p, 600);
    const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Itens Similares' }).last();
    await dlg.waitFor({ timeout: 15000 });
    await tela.autocomplete(p, dlg.locator('input#itemSemelhante'), similar, similar);
    const viaTipo = await dropdown(t, dlg, 'Tipo de Conversão', tipo).then(() => dropdown.ultimo.via);
    // a máscara usa as casas da unidade do item similar: digita 1 para descobrir as casas
    const f = dlg.locator('input#fatorConversao');
    await tela.digitar(p, f, '1');
    const casas = ((await f.inputValue()).split(',')[1] || '').length;
    await tela.digitar(p, f, tela.qtd(fator, casas));
    const fatorDigitado = await f.inputValue();
    // botão do rodapé: no código o texto é "Adicionar" com tradução @@salvar (pode aparecer como "Salvar")
    const ok = dlg.locator('.p-dialog-footer button, p-footer button').filter({ hasText: /^\s*(Adicionar|Salvar)\s*$/ }).first();
    if (!(await ok.count())) throw new Error('botão de confirmar do diálogo Itens Similares não achado (botões: ' + (await dlg.locator('button').allInnerTexts()).map(tela.limpo).join(' | ') + ')');
    const botao = tela.limpo(await ok.innerText());
    await ok.click(); await tela.pronto(p, 1200);
    const toasts = await tela.toasts(p); const dialogos = await tela.textoDialogos(p);
    const similares = await t.banco.consultar(`select s.ID_ITEM_SIMILAR, s.ID_ITEM, s.ID_ITEM_SEMELHANTE, i.DESCRICAO, s.TIPO_CONVERSAO, s.FATOR_CONVERSAO
      from ITEM_SIMILAR s join ITEM i on i.ID_ITEM = s.ID_ITEM_SEMELHANTE where s.ID_ITEM = ? order by s.ID_ITEM_SIMILAR`, [idItem]);
    return { toasts, dialogos, fatorDigitado, viaTipo, botao, salvou: similares.length > antes, similares };
  },
};
