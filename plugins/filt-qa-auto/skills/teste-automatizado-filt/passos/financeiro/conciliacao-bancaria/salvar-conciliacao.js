// Tela: Processos › Financeiro › Conciliação de Contas — Salvar do cabeçalho da conciliação aberta.
const { observar } = require('../../_comum');

module.exports = {
  // → { toasts, eventos, errosApi, url }
  async salvar(t) {
    const { p } = t;
    const b = p.getByRole('button', { name: 'Salvar', exact: true }).first();
    if (!(await b.isVisible())) throw new Error('botão Salvar não aparece (nenhuma conciliação aberta?)');
    const r = await observar(t, b, { minimo: 2500 });
    return { toasts: r.eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)), eventos: r.eventos, errosApi: r.errosApi, url: p.url() };
  },
};
