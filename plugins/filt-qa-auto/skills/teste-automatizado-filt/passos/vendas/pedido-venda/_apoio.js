// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=) — ajudantes dos cenários desta tela (não é cenário)

// Acerto Financeiro com Cartão de crédito manual (o que vem proposto é trocado pelo cartão informado).
async function acertoCartao(t, dlg, { valor, parcelas = 1, operadora = 'ACCORD', bandeira = 'AMERICAN', contaContabil = 'CARTOES A RECEBER' }) {
  const { p, tela } = t;
  const lixo = dlg.locator('.pi-trash, [class*=trash]');
  if (await lixo.count()) { await lixo.first().click(); await tela.pronto(p); await tela.confirmar(p, ['Sim']); }
  if (!(await dlg.getByText('Cobrança').count())) await tela.clicarTexto(p, 'Cartão', dlg);
  for (const r of ['Manual', 'Crédito', parcelas > 1 ? 'Parcelado' : 'À Vista']) await tela.clicarTexto(p, r, dlg);
  await tela.digitar(p, tela.campo(dlg, 'Valor'), tela.moeda(valor));
  if (parcelas > 1) await tela.digitar(p, tela.campo(dlg, 'Número de Parcelas'), parcelas);
  await tela.autocompleteRotulo(p, dlg, 'Operadora', operadora);
  await tela.autocompleteRotulo(p, dlg, 'Bandeira', bandeira);
  await tela.digitar(p, tela.campo(dlg, 'NSU'), '12345');
  await tela.digitar(p, tela.campo(dlg, 'Código Autorização'), '12345');
  const cc = tela.campo(dlg, 'Conta Contábil');
  if ((await cc.count()) && !(await cc.inputValue())) await tela.autocomplete(p, cc, contaContabil.slice(0, 8), contaContabil);
  await tela.botao(p, 'Adicionar', { escopo: dlg });
  // o cartão vai para "Cartões Adicionados"; o Salvar da forma leva para o Resumo (Total Pago)
  await dlg.getByRole('button', { name: 'Salvar', exact: true }).first().click(); await tela.pronto(p, 800);
  const resumo = tela.limpo(((await dlg.innerText()).match(/Total Pago[\s\S]{0,60}/) || [''])[0]);
  if (!new RegExp('Total Pago R\$ ' + String(valor.toFixed(2)).replace('.', ',')).test(resumo.replace(/\./g, '').replace(/(\d),(\d{2})/, '$1,$2'))) {
    t.anotar('resumo do acerto com cartão: ' + resumo);
  }
}

async function escolherAutocomplete(t, escopo, rotulo, busca, contem) {
  const { p, tela } = t;
  const inp = escopo.locator(`label:visible:has-text("${rotulo}")`).first().locator('xpath=following::input[1]');
  const ops = p.locator('li.p-autocomplete-item:visible, li[role=option]:visible');
  // a lista às vezes volta vazia na primeira digitação: tenta de novo
  for (let k = 0; k < 3; k++) {
    await inp.click(); await inp.fill(''); await p.keyboard.type(busca, { delay: 60 }); await tela.pronto(p, 1500);
    if (await ops.count()) break;
  }
  const textos = await ops.allInnerTexts();
  const alvo = contem ? ops.filter({ hasText: contem }) : ops;
  if (!(await alvo.count())) throw new Error(`${rotulo}: nenhuma opção com "${contem || busca}". Opções: ${textos.slice(0, 8).join(' | ')}`);
  await alvo.first().click(); await tela.pronto(p, 800);
  return textos;
}

module.exports = { acertoCartao, escolherAutocomplete };
