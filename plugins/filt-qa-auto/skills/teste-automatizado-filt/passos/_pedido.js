// Apoio das telas de Pedido Venda (não é passo: fica fora das pastas de área)
//
// Quantidades: informe `casas` = casas decimais da unidade do item (ex.: CORDA = 3), porque o campo tem máscara.

const situacaoSql = 'select ID_PEDIDO, STATUS_PEDIDO, PAGO, VALOR_TOTAL_CONTABIL from PEDIDO where ID_PEDIDO = ?';

// Sempre recarrega o carrinho: depois de outra aba (GERAR NOTA) ou de outra tela, a página aberta pode estar desatualizada.
async function abrirCarrinho(t, pedido) { await t.tela.abrir(t.p, '/vendas/carrinho?id=' + pedido); }

// Pesquisa o item na tela de busca, informa a quantidade e ADICIONAR (+ desconto unitário opcional) → volta ao Carrinho.
async function incluirItem(t, { item, qtd, casas = 0, desconto, valor }) {
  const { p, tela } = t;
  const busca = p.locator('input[placeholder="Pesquise o item"]');
  await busca.waitFor({ timeout: 60000 });
  await busca.click(); await busca.fill(''); await p.keyboard.type(item, { delay: 40 }); await p.keyboard.press('Enter');
  await tela.pronto(p, 800);
  // o card do resultado com o nome do item: logo depois do Enter a lista ainda pode mostrar o resultado da busca anterior
  // (com o 2º item do pedido, o campo do 1º card era o do item anterior e o pedido ganhava o item errado)
  const QTD = 'input.input-quantidade, input.input-quantidade-embalagem';   // item com embalagem usa a 2ª classe
  const card = p.locator(`div:has(${QTD})`).filter({ hasText: item }).last();
  await card.waitFor({ timeout: 30000 }).catch(() => {});
  const q = (await card.count()) ? card.locator(QTD).last() : p.locator(QTD).first();
  await q.waitFor({ timeout: 30000 });
  await tela.digitar(p, q, tela.qtd(qtd, casas));
  await card.getByText('ADICIONAR', { exact: true }).first().click();
  await tela.pronto(p, 800);
  // ADICIONAR abre o painel lateral "Adicionar Item ao carrinho" (desconto unitário + Confirmar).
  // Tudo DENTRO do painel: na página há outros "Confirmar" escondidos (diálogo de condições de venda).
  const painel = p.locator('.p-sidebar:visible').filter({ hasText: 'Adicionar Item ao carrinho' }).last();
  await painel.waitFor({ timeout: 15000 }).catch(() => {});
  if (await painel.count()) {
    // `valor` = Valor do Item (input#valorUnitario, R$ com 2 casas): troca o preço unitário proposto pelo sistema
    if (valor !== undefined) {
      await tela.digitar(p, painel.locator('input#valorUnitario'), tela.moeda(valor, 2));
      await tela.pronto(p, 500);
    }
    if (desconto) {
      // "Desconto Unitário" em R$ = input#valorDesconto2 (máscara com 5 casas)
      await tela.digitar(p, painel.locator('input#valorDesconto2'), tela.moeda(desconto, 5));
      await tela.pronto(p, 500);
    }
    await painel.getByRole('button', { name: /Confirmar/ }).click();
    await painel.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await tela.pronto(p);
  } else if (desconto || valor !== undefined) throw new Error('o painel "Adicionar Item ao carrinho" não abriu — não deu para informar o valor/desconto');
}

module.exports = { situacaoSql, abrirCarrinho, incluirItem };
