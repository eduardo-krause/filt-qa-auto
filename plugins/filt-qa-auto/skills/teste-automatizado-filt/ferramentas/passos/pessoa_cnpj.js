// Cadastro de Pessoa por CNPJ (/fiscal/pessoa → Novo). Nome, fantasia e endereço vêm da Receita ao sair do CNPJ.
// args: {cnpj, atribuicao: "Cliente"|"Fornecedor"|..., regime?: "Lucro Real", ie, email, perfil?: "Revendas"}
// Obrigatórios observados: Regime Tributário, Perfil tributário, Inscrição estadual (validada pela UF — usar a IE
// real da empresa) e E-mail documento eletrônico (no "Complemento principal").
// A 1ª abertura pode mostrar o tutorial "Olá, seja bem-vindo!" por cima: o passo fecha.
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0, 3).join('/');
  await p.goto(base + '/fiscal/pessoa'); await lib.esperar(p, 3000); await p.reload(); await lib.esperar(p, 3500);
  await p.getByRole('button', { name: 'Novo' }).first().click(); await lib.esperar(p, 4000);
  const tut = p.locator('text=Olá, seja bem-vindo!');
  if (await tut.count()) { await tut.locator('xpath=ancestor::*[.//*[contains(@class,"close") or contains(text(),"×")]][1]').locator('[class*=close], button').first().click().catch(() => p.keyboard.press('Escape')); await lib.esperar(p, 800); }
  await lib.texto(p, 'CPF/CNPJ', a.cnpj); await lib.esperar(p, 8000);
  await lib.ac(p, 'Atribuição', '', a.atribuicao); await p.keyboard.press('Escape'); await lib.esperar(p, 800);
  await lib.dd(p, 'Regime Tributário', a.regime || 'Lucro Real').catch(() => {});
  const f = async (id, v) => { const i = p.locator('#' + id + ' input, input#' + id).first(); await i.scrollIntoViewIfNeeded(); await i.click(); await p.keyboard.press('Control+A'); await p.keyboard.type(v, { delay: 40 }); await p.keyboard.press('Tab'); await lib.esperar(p, 600); };
  if (a.ie) await f('inscricaoEstadual', a.ie);
  if (a.email) await f('emailDocumentoEletronico', a.email);
  const pt = p.locator('#perfilTributario').first(); await pt.scrollIntoViewIfNeeded();
  await pt.locator('button, .p-dropdown-trigger, .p-autocomplete-dropdown, .p-dropdown').first().click(); await lib.esperar(p, 1500);
  await p.locator('li[role=option]:visible, li.p-dropdown-item:visible').filter({ hasText: a.perfil || 'Revendas' }).first().click(); await lib.esperar(p, 800);
  const s = await lib.salvar(p);
  return { status: s.status, obrigatorios: s.obrigatorios, toasts: s.toasts };
};
