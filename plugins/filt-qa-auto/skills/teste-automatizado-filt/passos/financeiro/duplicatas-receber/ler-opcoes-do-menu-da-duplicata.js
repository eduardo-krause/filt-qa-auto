// Tela: Processos › Financeiro › Duplicatas a Receber (/financeiro/duplicata-receber/form?id=N)

module.exports = {
  // Opções do menu ⋮ do form da duplicata. args: { id }
  async opcoes(t, { id }) {
    await t.tela.abrir(t.p, '/financeiro/duplicata-receber/form?id=' + id);
    return t.tela.menuKebab(t.p);
  },
};
