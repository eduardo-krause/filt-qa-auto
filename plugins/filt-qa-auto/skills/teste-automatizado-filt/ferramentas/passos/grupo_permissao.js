// Grupo de Usuários aberto (/master/grupo-usuario/form?id=N): Permissões → Adicionar → Menu → liga/desliga ações.
// args: {menu: trecho que identifica o menu (ex.: "Estoque/Mov"), menuPick?: trecho da opção ("Estoque/Movimenta"),
//        ligar?: ["Visualizar", "Visualizar Custo de Aquisição"], desligar?: [...]}
// Cuidado com menus de nome parecido ("Consulta de Estoque" é o relatório). As ações aparecem depois de expandir o
// grupo do menu pai (ex.: "Vendas"); toggles mat-slide-toggle com title = nome da ação.
// O Salvar do diálogo já grava (toast "Salvo com sucesso"). Conferir em GRUPO_USUARIO_ACAO.
module.exports = async (p, lib, a) => {
  await p.getByRole('button', { name: 'Adicionar', exact: true }).last().click(); await lib.esperar(p, 2500);
  const d = p.locator('.p-dialog:visible').last();
  const r = await lib.ac(p, 'Menu', a.menu, a.menuPick || a.menu, d); await lib.esperar(p, 3000);
  if (!(await d.locator('mat-slide-toggle').count())) {
    const pai = d.locator('text=Conceder Permissão Total').first().locator('xpath=preceding-sibling::*[1] | ..').first();
    await pai.click().catch(() => {}); await lib.esperar(p, 1500);
  }
  const tg = d.locator('mat-slide-toggle'); const n = await tg.count(); const out = { menu: r.opcoes, toggles: [] };
  for (let i = 0; i < n; i++) {
    const t = tg.nth(i); const ti = ((await t.getAttribute('title')) || '').trim();
    const on = await t.evaluate((e) => e.className.includes('checked'));
    const quer = (a.ligar || []).includes(ti) ? true : (a.desligar || []).includes(ti) ? false : null;
    if (quer !== null && quer !== on) { await t.locator('label, button, .mat-slide-toggle-bar, .mdc-switch').first().click(); await lib.esperar(p, 600); }
    out.toggles.push(ti + ':' + on + (quer !== null && quer !== on ? '→' + quer : ''));
  }
  await d.getByRole('button', { name: 'Salvar' }).last().click(); await lib.esperar(p, 3000);
  out.toasts = await p.locator('.p-toast-message').allInnerTexts();
  await d.getByRole('button', { name: 'Cancelar' }).last().click().catch(() => {});
  return out;
};
