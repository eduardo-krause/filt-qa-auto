// Nota PRÓPRIA aberta (emitida pela empresa): ⋮ → "Exportar XML" e salva o arquivo.
// Nota de terceiros não tem essa opção (o XML é do fornecedor). Para ter um XML de ENTRADA real numa base de teste:
// emitir (homologação) uma venda em outra base para uma pessoa com o CNPJ da base de teste e exportar o XML dela.
// args: {destino: caminho completo do arquivo} — nota autorizada baixa .xml; nota cancelada baixa .zip (XML + evento).
module.exports = async (p, lib, a) => {
  for (let i = 0; i < 3; i++) {
    const d = p.locator('.p-dialog:visible').last(); if (!(await d.count())) break;
    const f = d.getByRole('button', { name: /Fechar|Cancelar/ }).first(); if (await f.count()) await f.click(); else await p.keyboard.press('Escape');
    await lib.esperar(p, 1000);
  }
  // ⋮ do cabeçalho do registro = button#dropdown-help (ícone vs-navigation-menu-vertical); itens são <span> simples
  await p.locator('button#dropdown-help, button:has(i.vs-navigation-menu-vertical)').first().click().catch(() => p.mouse.click(1507, 126));
  await lib.esperar(p, 1500);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null), p.locator('text=Exportar XML').first().click()]);
  await lib.esperar(p, 3000);
  if (!dl) return { erro: 'sem download', dialogos: await p.locator('.p-dialog:visible').allInnerTexts(), toasts: await p.locator('.p-toast-message').allInnerTexts() };
  await dl.saveAs(a.destino); return { ok: a.destino, nome: dl.suggestedFilename() };
};
