// args: {id: ID_NOTA_FISCAL, acao?: "Excluir" | "Cancelar Nota", confirmar?: "Excluir", motivo?}
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  await p.goto(base + '/nota/nota-fiscal'); await lib.esperar(p, 2000);
  await p.goto(base + '/nota/nota-fiscal/form?id=' + a.id); await lib.esperar(p, 3000); await p.reload(); await lib.esperar(p, 6000);
  await p.mouse.click(1507, 126); await lib.esperar(p, 1500);
  const itens = await p.locator('.p-menu:visible, .p-tieredmenu:visible, [role=menu]:visible').allInnerTexts();
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), `nf-${a.id}-menu.png`) });
  if (!a.acao) { await p.keyboard.press('Escape'); return { itens }; }
  await p.getByText(a.acao, { exact: true }).last().click(); await lib.esperar(p, 2500);
  const d1 = await lib.dialogos(p);
  if (a.motivo) { const t = p.locator('.p-dialog:visible textarea, .p-dialog:visible input[type=text]').first(); await t.fill(a.motivo); }
  let tt = []; if (a.confirmar) { await p.locator('.p-dialog:visible button, .p-confirm-dialog button').filter({ hasText: a.confirmar }).last().click(); for (let i = 0; i < 16; i++) { await lib.esperar(p, 500); const x = await lib.toasts(p); if (x.length) { tt = x; break; } } await lib.esperar(p, 3000); }
  const t = tt.concat(await lib.toasts(p)); const d2 = await lib.dialogos(p);
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), `nf-${a.id}-${a.acao.replace(/\W+/g, '_')}.png`) });
  return { itens, d1: d1.map(x => x.slice(0, 300)), toasts: t, d2: d2.map(x => x.slice(0, 300)), url: p.url() };
};
