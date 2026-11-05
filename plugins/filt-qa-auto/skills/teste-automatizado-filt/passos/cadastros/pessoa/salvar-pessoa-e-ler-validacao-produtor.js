// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — botão Salvar do topo
const c = require('./_complemento');

module.exports = {
  // Clica Salvar e lê o que a tela mostrou: toasts (capturados assim que aparecem), diálogos, quadro "Campos obrigatórios",
  // foco, estado de cada complemento (aba selecionada, card expandido, título da aba Produtor Rural, campo Inscrição produtor)
  // e erros de API. Se o quadro "Campos obrigatórios" estiver por cima do Salvar, fecha o quadro no X antes (via + ATENÇÃO).
  // Não decide se salvou — conferir no banco.
  // args: { espera?: 2500 }  devolve { via, toasts, dialogos, errosApi, camposObrigatorios, foco, complementos, url, idUrl }
  async salvarPessoaELerValidacaoProdutor(t, { espera = 2500 }) {
    return c.salvar(t, { espera });
  },
};
