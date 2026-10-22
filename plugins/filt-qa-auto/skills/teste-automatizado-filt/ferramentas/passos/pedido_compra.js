// Pedido de compra pela tela (/pedidos/pedido → Novo). Grava PEDIDO (TIPO_PEDIDO='COMPRA', status PENDENTE)
// e já soma o A Receber (ESTOQUE_MOVIMENTO tipo 5 via ESTOQUE_MOVIMENTO_PEDIDO_ITEM).
// args: {pessoa, pessoaPick?: trecho único da opção (ex.: CNPJ formatado da pessoa quando há homônimos),
//        item, itemPick?, qtd (cru: unidade com 3 casas → "100000"), vu, natureza?: "PEDIDO DE COMPRA"}
// Tipo do Frete Gerencial é obrigatório. Excluir: lixeira da linha na lista → "Excluir".
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0, 3).join('/');
  await p.goto(base + '/pedidos/pedido'); await lib.esperar(p, 2500); await p.reload(); await lib.esperar(p, 3500);
  await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4500);
  const nat = a.natureza || 'PEDIDO DE COMPRA';
  await lib.ac(p, 'Natureza de Operação', nat, nat); await lib.esperar(p, 1500);
  await lib.ac(p, '=Pessoa', a.pessoa, a.pessoaPick || a.pessoa); await lib.esperar(p, 2000);
  await p.getByRole('button', { name: 'Adicionar', exact: true }).first().click(); await lib.esperar(p, 3000);
  const d = p.locator('.p-dialog:visible').last();
  await lib.ac(p, '=Item', a.item, a.itemPick || a.item, d); await lib.esperar(p, 2500);
  await lib.texto(p, 'Quantidade', String(a.qtd), d); await lib.moeda(p, 'Valor Unitário', a.vu, 2, d); await lib.esperar(p, 1000);
  await d.getByRole('button', { name: 'Adicionar', exact: true }).last().click(); await lib.esperar(p, 2500);
  const c = p.locator('.p-dialog:visible').last(); if (await c.count()) { await c.getByRole('button', { name: 'Cancelar' }).last().click(); await lib.esperar(p, 1200); }
  await lib.dd(p, 'Tipo do Frete Gerencial', 'Sem Ocorr');
  const s = await lib.salvar(p); await lib.esperar(p, 2000);
  return { status: s.status, obrigatorios: s.obrigatorios, toasts: s.toasts };
};
