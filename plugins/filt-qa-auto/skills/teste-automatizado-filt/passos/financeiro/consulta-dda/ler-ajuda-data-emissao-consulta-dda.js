// Tela: Processos › Financeiro › Consulta DDA — passa o mouse no ícone de ajuda (?) de um campo do painel e lê o tooltip.
// args: { rotulo: 'Data de emissão' }  devolve { temIcone, texto }
module.exports = {
  async ajudaCampoDda(t, { rotulo = 'Data de emissão' } = {}) {
    const { p, tela } = t;
    const g = p.locator('.p-sidebar .form-group, .p-sidebar div').filter({ has: p.locator('label', { hasText: rotulo }) }).first();
    const ic = g.locator('em.ajuda, i.ajuda, .fa-question-circle').first();
    if (!(await ic.count())) return { temIcone: false, texto: '' };
    await ic.hover(); await tela.esperar(p, 800);
    const texto = ((await p.locator('.p-tooltip:visible').allInnerTexts()).join(' | ')).replace(/\s+/g, ' ').trim();
    await p.mouse.move(5, 5);
    return { temIcone: true, texto };
  },
};
