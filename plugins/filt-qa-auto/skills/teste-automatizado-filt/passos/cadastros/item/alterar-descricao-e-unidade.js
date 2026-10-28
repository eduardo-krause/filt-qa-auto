// Tela: Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

module.exports = {
  // Troca a Descrição (input#descricao) e/ou a Unidade de medida (autocomplete input#unidadeMedida; opção "<sigla> <descrição>")
  // e salva. A unidade fica bloqueada quando o item já tem movimento.
  // args: { id: ID_ITEM_FILIAL, descricao?, unidade?: 'GL' } → { status, toasts, dialogos, avisos (texto da Validação Descrição, se abriu) }
  async alterarDescricaoUnidade(t, { id, descricao, unidade }) {
    const { p, tela } = t;
    await require('./abrir-item').abrir(t, { id });
    const avisos = [];
    if (descricao) {
      await tela.digitar(p, p.locator('input#descricao').first(), descricao, { atraso: 20 }); await tela.pronto(p, 800);
      // descrição parecida com outro item abre "Validação Descrição" (lista + Cancelar/Utilizar): Cancelar segue com o cadastro
      const v = p.locator('.p-dialog:visible').filter({ hasText: /Valida[cç][aã]o Descri/ }).last();
      if (await v.count()) { avisos.push(tela.limpo(await v.innerText()).slice(0, 300)); await v.getByRole('button', { name: 'Cancelar', exact: true }).click(); await tela.pronto(p, 600); }
    }
    if (unidade) {
      const inp = p.locator('input#unidadeMedida').first();
      if (await inp.isDisabled()) throw new Error('Unidade de medida bloqueada no item ' + id + ' (item com vínculos)');
      await inp.click(); await inp.fill(''); await p.keyboard.type(unidade, { delay: 60 }); await tela.pronto(p, 800);
      // opção = <span.autocomplete-id>sigla</span><span>descrição</span>
      const ops = p.locator('.p-autocomplete-panel:visible li');
      const siglas = (await ops.locator('.autocomplete-id').allInnerTexts()).map(tela.limpo);
      const i = siglas.findIndex((x) => x === unidade);
      if (i < 0) throw new Error(`unidade ${unidade} não está na lista (${(await ops.allInnerTexts()).map(tela.limpo).slice(0, 8).join(' | ')})`);
      await ops.nth(i).click(); await tela.pronto(p, 600);
    }
    const r = await require('./salvar-item').salvar(t);
    return { ...r, avisos };
  },
};
