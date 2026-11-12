// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
// API: POST /retorno-boleto/{id}/reprocessar (corpo {}) → { sucesso, alterado, situacao, mensagem }; depois GET /retorno-boleto/{id}
// O menu só mostra "Reprocessar" para retorno Com divergência / Erro no processamento.
const { acaoDoMenu } = require('./_apoio');

module.exports = {
  // ⋮ da linha → "Reprocessar". A grade precisa estar pesquisada. args: { nossoNumero }
  // devolve { situacaoAntes, situacaoDepois, acoes, toasts, errosApi, api } — ou { naoDisponivel } se a linha não oferece a ação
  async reprocessarRetorno(t, { nossoNumero }) {
    return acaoDoMenu(t, nossoNumero, 'Reprocessar', /\/reprocessar/);
  },
};
