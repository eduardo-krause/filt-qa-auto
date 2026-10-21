// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
const { visiveis } = require('./_apoio');

module.exports = {
  // Rótulos de credenciais visíveis (card de credenciais do híbrido).
  async credenciaisVisiveis(t) { return visiveis(t.p, 'client id|client secret|c[oó]digo de acesso|aplication key|application key'); },

  // Troca um campo de texto do form pelo id e salva. args: { campo: 'limiteNossoNumero', valor }  devolve { antes, eventos },
};
