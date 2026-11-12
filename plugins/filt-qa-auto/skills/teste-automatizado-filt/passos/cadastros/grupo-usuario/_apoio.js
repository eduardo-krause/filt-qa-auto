// Apoio do Grupo de Usuários (/master/grupo-usuario/form?id=N): diálogo Permissões de um menu.
const tela = require('../../../motor/lib/tela');

// Abre o grupo, Adicionar → Menu (autocomplete) → escolhe a opção que contém `menu` ("Processos > Financeiro > Duplicatas a Pagar")
// e devolve { d (diálogo), toggles: [{titulo, ligado, el}] }.
async function abrirMenu(p, { grupo, menu }) {
  await tela.abrir(p, '/master/grupo-usuario/form?id=' + grupo);
  await tela.semLoader(p);
  await tela.botao(p, 'Adicionar', { noDialogo: false, qual: 'last' });
  const d = p.locator('.p-dialog:visible').filter({ hasText: 'Permissões' }).last();
  await d.waitFor({ timeout: 20000 });
  const inp = d.locator('label:has-text("Menu")').first().locator('xpath=following::input[1]');
  const nome = menu.split('>').pop().trim();
  await inp.click(); await p.keyboard.type(nome.slice(0, 18), { delay: 40 }); await tela.pronto(p, 1000);
  const op = p.locator('.p-autocomplete-panel:visible li').filter({ hasText: menu });
  await op.first().waitFor({ timeout: 15000 }).catch(() => {});
  if (!(await op.count())) throw new Error(`menu "${menu}" não aparece no autocomplete (tem: ${(await p.locator('.p-autocomplete-panel:visible li').allInnerTexts()).join(' | ')})`);
  await op.first().click(); await tela.pronto(p, 1500);
  // o menu pai (ex.: "Financeiro") vem recolhido (p-toggleable-content altura 0): os toggles existem mas não recebem clique.
  // Abre clicando no nome do menu pai, à esquerda do cabeçalho (o cabeçalho também tem os botões Conceder/Remover Permissão Total; a seta tem largura 0).
  const fechados = d.locator('a.p-accordion-header-link[aria-expanded="false"]');
  for (let k = 0; k < 5 && (await fechados.count()); k++) { await fechados.first().locator("p-header").click({ position: { x: 15, y: 20 } }); await tela.pronto(p, 800); }
  return { d, toggles: await lerToggles(d) };
}

async function lerToggles(d) {
  const tg = d.locator('mat-slide-toggle'); const n = await tg.count(); const out = [];
  for (let i = 0; i < n; i++) {
    const el = tg.nth(i);
    out.push({ titulo: ((await el.getAttribute('title')) || '').trim(), ligado: await el.evaluate((e) => e.className.includes('checked')), el });
  }
  return out;
}

const mapa = (toggles) => Object.fromEntries(toggles.map((x) => [x.titulo, x.ligado]));

module.exports = { abrirMenu, lerToggles, mapa };
