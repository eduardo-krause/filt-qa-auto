// Tela: Configurações › Receituário Agronômico (/reag/configuracao) — ajudantes dos cenários desta tela (não é cenário)

async function escolher(t, rotulo, opcao) {
  const { p, tela } = t;
  const lab = p.locator('label:visible').filter({ hasText: new RegExp('^\\s*' + rotulo + '\\s*\\*?\\s*$') }).first();
  const id = await lab.getAttribute('for');
  const dd = id ? p.locator(`p-dropdown#${id} .p-dropdown`).first() : lab.locator('xpath=following::*[contains(@class,"p-dropdown")][1]');
  await dd.scrollIntoViewIfNeeded(); await dd.click(); await tela.pronto(p, 600);
  await p.locator('li.p-dropdown-item:visible, li[role=option]:visible').filter({ hasText: opcao }).first().click(); await tela.pronto(p, 400);
}

module.exports = { escolher };
