// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — só lê, não clica
const c = require('./_complemento');

module.exports = {
  // Estado atual da validação, sem mexer no foco: { toasts (vistos desde o último Salvar), camposObrigatorios: [...],
  //   foco (id do elemento com foco), complementos: [{ complemento, cardExpandido, abaSelecionada, conteudoProdutorVisivel, indicador,
  //   tituloAbaProdutor: { cor, vermelho }, campoInscricao: { valor, ngInvalid, hasError, mensagem, vermelho } }], url, idUrl }
  async lerEstadoValidacaoProdutor(t) {
    const r = await c.lerEstado(t.p);
    return { toasts: await c.toastsVistos(t.p).catch(() => []), ...r };
  },
};
