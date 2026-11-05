// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — cadastro preenchido na tela
const ap = require('./_apoio');

module.exports = {
  // Só clica Salvar (não preenche nada) e devolve as mensagens exatas: avisos, quadro "Campos obrigatórios", campos inválidos.
  // args: { esperaAvisos?: 4000 }  devolve { avisos, quadroObrigatorios, invalidos, textosErro, url, idUrl, salvarBloqueado? }
  async salvarPessoa(t, { esperaAvisos = 4000 }) {
    return ap.salvarPessoa(t, { esperaAvisos });
  },
};
