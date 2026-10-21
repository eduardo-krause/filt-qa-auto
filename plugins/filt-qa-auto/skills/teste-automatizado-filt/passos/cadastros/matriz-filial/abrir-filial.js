// Tela: Cadastros › Empresas › Matriz/Filial (/fiscal/filial/form?id=<ID_FILIAL>)

module.exports = {
  async abrir(t, { id }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/filial/form?id=' + id);
    if (!(await tela.semLoader(p))) { t.anotar('ATENÇÃO: loader da tela travado ao abrir — automação recarregou a página'); await p.reload(); await tela.pronto(p, 1000); }
    await tela.pronto(p, 1000);
  },
};
