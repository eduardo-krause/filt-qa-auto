// Tela: Cadastros › Empresas › Matriz/Filial (/fiscal/filial/form?id=<ID_FILIAL>)

module.exports = {
  async salvar(t) { const { p, tela } = t; return tela.salvar(p); },
};
