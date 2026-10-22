// Clica num link/texto da tela e confere se abriu em NOVA ABA (hyperlinks de cadastro, ex.: código do fornecedor).
// args: {texto: texto exato do link, dentro?: texto de um título que delimita o bloco (ex.: "Última compra")}
// Devolve a URL da nova aba (ex.: /fiscal/pessoa/form?id=3), os primeiros campos dela e a URL da aba original.
module.exports = async (p, lib, a) => {
  const sc = a.dentro ? p.locator('h6, h5, h4', { hasText: a.dentro }).first().locator('xpath=..') : p;
  const alvo = sc.locator(`text="${a.texto}"`).first();
  const [nova] = await Promise.all([p.context().waitForEvent('page', { timeout: 15000 }).catch(() => null), alvo.click()]);
  await lib.esperar(p, 2000);
  const out = { abaOriginal: p.url(), novaAba: null };
  if (nova) {
    await nova.waitForLoadState('networkidle').catch(() => {}); await lib.esperar(nova, 4000);
    out.novaAba = { url: nova.url(), campos: await nova.locator('input:visible').evaluateAll((e) => e.slice(0, 8).map((x) => x.value)) };
    if (a.print) await nova.screenshot({ path: require('path').join(lib.pastaPrints(), a.print + '.png') });
    await nova.close();
  }
  return out;
};
