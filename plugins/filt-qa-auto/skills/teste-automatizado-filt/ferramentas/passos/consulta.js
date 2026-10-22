// args: {busca:"<código ou descrição>", detalhe?:"<descrição exata>", print} — grade da Consulta Estoque/Movimentação (+ detalhe do item)
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0,3).join('/');
  await p.goto(base + '/vendas/consulta-estoque-movimentacao'); await lib.esperar(p, 3000);
  const inp = p.locator('input:visible').first();
  await inp.fill(a.busca); await p.keyboard.press('Enter'); await lib.esperar(p, 4000);
  const cab = (await p.locator('thead tr').first().innerText().catch(()=>'')).replace(/\s+/g,' ');
  const linhas = (await p.locator('tbody tr').allInnerTexts()).map(s => s.replace(/\s+/g,' ').trim());
  if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), a.print + '.png') });
  let det = null;
  if (a.detalhe) {
    await p.getByText(a.detalhe, { exact: true }).first().click(); await lib.esperar(p, 4000);
    const eyes = p.locator('i.ph-eye:visible, i.ph-eye-slash:visible, .pi-eye:visible, [class*=eye]:visible');
    for (let k = 0, n = await eyes.count(); k < n; k++) { await eyes.nth(k).click().catch(()=>{}); await lib.esperar(p, 400); }
    await lib.esperar(p, 800);
    const txt = await p.innerText('body');
    const i = txt.indexOf('Custos'); det = txt.slice(Math.max(0,i-50), i + 900).replace(/\n+/g,' | ');
    if (a.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), a.print + '-detalhe.png') });
  }
  return { cab, linhas, det };
};
