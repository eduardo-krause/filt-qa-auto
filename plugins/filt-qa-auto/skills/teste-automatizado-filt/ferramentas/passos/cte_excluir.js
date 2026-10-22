// args: {numero} — exclui o CT-e pela lixeira da listagem
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  await p.goto(base + '/fiscal/conhecimento-de-transporte'); await lib.esperar(p, 2500); await p.reload(); await lib.esperar(p, 4000);
  const row = p.locator('tbody tr', { hasText: String(a.numero) }).first();
  if (!(await row.count())) return { ok: false, motivo: 'não achei na lista' };
  await row.locator('.ph-trash, [class*=trash]').first().click(); await lib.esperar(p, 2000);
  const d = await lib.dialogos(p);
  const conf = p.locator('.p-dialog:visible button, .p-confirm-dialog button').filter({ hasText: /Excluir|Confirmar|Sim/ });
  await conf.last().click(); await lib.esperar(p, 5000);
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), `cte-${a.numero}-excluido.png`) });
  return { dialogo: d, toasts: await lib.toasts(p), linhas: (await p.locator('tbody tr').allInnerTexts()).slice(0, 3).map(s => s.replace(/\s+/g, ' ')) };
};
