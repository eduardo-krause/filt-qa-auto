// Acerto Financeiro já aberto (salvar devolveu acerto_financeiro): forma Duplicata com parcelas.
// args: {forma: "30/60/90" (texto exato da Forma Parcelamento), vencs?: ["10/11/2026", ...] (troca os vencimentos
//        gerados, na ordem), concluir?: true (Salvar da duplicata + Concluir), salvarNota?: true (Salvar da nota depois)}
// Formas existentes numa base: "30 DIAS", "30/60", "30/60/90"... (listar abrindo o campo).
module.exports = async (p, lib, a) => {
  let dlg = p.locator('.p-dialog:visible').last();
  if (!(await dlg.locator('label', { hasText: 'Forma Parcelamento' }).count())) {
    await dlg.locator('text=Duplicata').first().click(); await lib.esperar(p, 2500); dlg = p.locator('.p-dialog:visible').last();
  }
  const ops = p.locator('li.p-dropdown-item:visible, li[role=option]:visible');
  // o rótulo aponta (for=) para o componente do próprio campo; um container genérico pegaria o "Vencimento" ao lado
  const id = await dlg.locator('label', { hasText: 'Forma Parcelamento' }).first().getAttribute('for');
  // é um p-autocomplete: abre pela seta (botão) do próprio componente
  const dd = dlg.locator(`p-autocomplete#${id || 'formaParcelamento'} button, p-dropdown#${id || 'formaParcelamento'} .p-dropdown`).first();
  if (await ops.count()) { await dlg.locator('text=Formas de Pagamento').first().click().catch(() => {}); await lib.esperar(p, 800); }
  await dd.click(); await lib.esperar(p, 1500);
  const txt = (await ops.allInnerTexts()).map((x) => x.trim());
  const idx = txt.indexOf(a.forma); if (idx < 0) return { erro: 'forma de parcelamento não encontrada', opcoes: txt };
  await ops.nth(idx).click(); await lib.esperar(p, 1000);
  await dlg.locator('button:has-text("Gerar")').first().click(); await lib.esperar(p, 2500);
  const linhas = dlg.locator('tbody tr');
  for (let i = 0; i < (a.vencs || []).length; i++) {
    const inp = linhas.nth(i).locator('input').first();
    await inp.scrollIntoViewIfNeeded(); await inp.click({ clickCount: 3 }); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
    await p.keyboard.type(a.vencs[i].replace(/\//g, ''), { delay: 60 }); await p.keyboard.press('Tab'); await lib.esperar(p, 700);
  }
  const out = { parcelas: await dlg.locator('tbody tr input').evaluateAll((e) => e.map((x) => x.value)) };
  if (a.concluir !== false) {
    await dlg.locator('button:has-text("Salvar")').first().click(); await lib.esperar(p, 2500);
    out.resumo = ((await dlg.innerText()).match(/Total Pago[\s\S]{0,80}/) || [''])[0].replace(/\n/g, ' ');
    await dlg.locator('button:has-text("Concluir")').first().click(); await lib.esperar(p, 3000);
  }
  if (a.salvarNota) {
    const s = await lib.salvar(p); out.status = s.status; out.toasts = s.toasts;
    const sef = p.locator('.p-dialog:visible', { hasText: 'Confirmação da operação' });
    if (await sef.count()) { await sef.getByRole('button', { name: 'Fechar' }).first().click(); await lib.esperar(p, 2500); out.sefaz = 'fechado sem enviar'; }
  }
  return out;
};
