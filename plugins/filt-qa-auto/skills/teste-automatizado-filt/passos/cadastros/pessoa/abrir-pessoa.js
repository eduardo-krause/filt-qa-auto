// Tela: Cadastros › Pessoa (/fiscal/pessoa/form?id=N)
const c = require('./_complemento');

module.exports = {
  // Abre a pessoa cadastrada (recarrega a tela: descarta qualquer edição não salva) e devolve o estado dos complementos.
  // args: { id }  devolve { complementos: [{ complemento, indicador, abaSelecionada, cardExpandido, campoInscricao }], ... }
  async abrirPessoa(t, { id }) {
    if (!id) throw new Error('informe args.id');
    await c.abrirPessoa(t, id);
    return c.lerEstado(t.p);
  },
};
