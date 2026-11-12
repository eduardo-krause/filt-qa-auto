// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
// API: POST /retorno-boleto/{id}/consultar-banco (corpo {}) → { sucesso, alterado, situacao, mensagem }; depois GET /retorno-boleto/{id}
const { acaoDoMenu } = require('./_apoio');

module.exports = {
  // ⋮ da linha → "Consultar no banco" (consulta o retorno no banco na hora). A grade precisa estar pesquisada.
  // args: { nossoNumero }  devolve { situacaoAntes, situacaoDepois, acoes, toasts, errosApi, api: [{metodo,url,status,corpo}] }
  async consultarBancoRetorno(t, { nossoNumero }) {
    return acaoDoMenu(t, nossoNumero, 'Consultar no banco', /\/consultar-banco/);
  },
};
