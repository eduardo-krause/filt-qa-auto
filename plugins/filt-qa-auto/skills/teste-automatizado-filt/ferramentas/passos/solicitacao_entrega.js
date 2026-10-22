// Solicitação de entrega de um pedido de compra (e aprovação). Pré-requisito: o usuário precisa de
// "Perfil do Usuário de Compras" no cadastro (/master/usuario/form?id=N; ex.: Gestor) — senão a Gestão de Compras
// mostra "Não há permissão definida no cadastro do Usuário".
// args: {pedido: <ID_PEDIDO>, qtd: digitação crua da "Qtd a Entregar" (3 casas → "40000"), aprovar?: true}
// Efeito no saldo: solicitação AGUARDANDO_APROVACAO não muda o A Receber; APROVADO tira do A Receber (tipo 5)
// e põe em Em Trânsito - A Receber (tipo 3). Tabelas: PEDIDO_SOLICITACAO_ENTREGA(_ITEM).
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0, 3).join('/');
  const fundo = async () => { await p.goto(base + '/pedidos/pedido/form?id=' + a.pedido); await lib.esperar(p, 4500); await p.mouse.move(900, 600); for (let i = 0; i < 15; i++) await p.mouse.wheel(0, 500); await lib.esperar(p, 1500); };
  await fundo();
  await p.getByRole('button', { name: 'Adicionar', exact: true }).last().click(); await lib.esperar(p, 3500);
  let d = p.locator('.p-dialog:visible').last();
  const inp = d.locator('tbody input').first(); await inp.click(); await p.keyboard.press('Control+A'); await p.keyboard.type(String(a.qtd), { delay: 80 }); await p.keyboard.press('Tab'); await lib.esperar(p, 1000);
  const qtd = await inp.inputValue();
  await d.getByRole('button', { name: 'Solicitar', exact: true }).click(); await lib.esperar(p, 2500);
  const conf = p.locator('.p-dialog:visible', { hasText: 'Deseja realmente' }); if (await conf.count()) { await conf.getByRole('button', { name: 'Sim' }).click(); await lib.esperar(p, 4000); }
  const out = { qtd, toasts: await p.locator('.p-toast-message').allInnerTexts() };
  if (a.aprovar) {
    await fundo();
    const row = p.locator('tbody tr').filter({ hasText: /\d{2}\/\d{2}\/\d{4}/ }).last();
    await row.click(); await lib.esperar(p, 1200);
    await row.locator('i, [class*=magnifying], [class*=search]').last().click(); await lib.esperar(p, 3500);
    d = p.locator('.p-dialog:visible').last(); out.situacao = (await d.innerText()).split('\n')[0];
    await d.getByRole('button', { name: 'Aprovar' }).click(); await lib.esperar(p, 3500);
    out.toastsAprovar = await p.locator('.p-toast-message').allInnerTexts();
  }
  return out;
};
