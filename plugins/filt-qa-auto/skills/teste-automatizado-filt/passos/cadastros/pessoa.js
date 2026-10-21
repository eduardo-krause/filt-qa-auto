// Tela: Cadastros › Pessoa (/fiscal/pessoa/form?id=N), aba ENDEREÇOS
const { limpo } = require('../_comum');

module.exports = {
  // Troca o CEP do endereço Principal pelo lápis da aba Endereços e salva a pessoa.
  // CEP inexistente faz a busca limpar os campos de texto: os que ficarem vazios voltam ao valor de antes da troca.
  // args: { id, cep: '85503360' }  devolve o CEP gravado no banco
  async trocarCep(t, { id, cep }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/pessoa/form?id=' + id);
    // a aba mostra "ENDEREÇOS" só por CSS: procurar sem caixa
    await p.getByText(/^\s*endereços\s*$/i).first().click(); await tela.pronto(p);
    const linha = p.locator('tr:visible', { hasText: 'Principal' }).first();
    await linha.scrollIntoViewIfNeeded(); await linha.hover();
    await linha.locator('i, span[class*=pi], button').first().click(); await tela.pronto(p);
    const dlg = p.locator('.p-dialog:visible').last();
    const textos = () => dlg.locator('input[type=text]:visible, input:not([type]):visible').evaluateAll((es) => es.map((e) => ({ k: e.id || e.name, v: e.value, ro: e.readOnly || e.disabled })));
    const antes = await textos();
    await tela.digitar(p, dlg.locator('input[name=cep], input#cep').first(), cep); await tela.pronto(p, 1500);
    // Cidade é autocomplete (só vale escolhendo a opção; a UF vem dela); os demais são texto
    const cidade = antes.find((x) => /cidade/i.test(x.k));
    for (const c of await textos()) {
      const a = antes.find((x) => x.k === c.k);
      if (c.v || !a || !a.v || c.ro || !c.k || /cep|uf|cidade/i.test(c.k)) continue;
      await tela.digitar(p, dlg.locator(`input#${c.k}, input[name=${c.k}]`).first(), a.v, { tab: false });
    }
    const ci = dlg.locator('input#cidade, input[name=cidade]').first();
    if (cidade && cidade.v && !(await ci.inputValue())) await tela.autocomplete(p, ci, cidade.v.slice(0, 12), cidade.v.split(' - ')[0]);
    await dlg.getByRole('button', { name: 'Salvar', exact: true }).click(); await tela.pronto(p);
    await tela.confirmar(p, ['Sim']);
    if (await dlg.isVisible()) {
      const vazios = (await textos()).filter((c) => !c.v).map((c) => c.k);
      throw new Error(`diálogo de endereço não fechou no Salvar (campos vazios: ${vazios.join(', ') || 'nenhum'}; tela: ${limpo(await dlg.innerText()).slice(0, 200)})`);
    }
    await tela.botao(p, 'Salvar', { noDialogo: false }); await tela.pronto(p, 1500);
    return t.banco.valor(`select e.CEP from PESSOA_ENDERECO e join PESSOA_COMPLEMENTO c on c.ID_PESSOA_COMPLEMENTO = e.ID_PESSOA_COMPLEMENTO
      where c.ID_PESSOA = ? and e.TIPO_ENDERECO = 'P' order by e.ID_PESSOA_ENDERECO desc limit 1`, [id]);
  },
};
