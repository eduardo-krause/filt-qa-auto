// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
const { limpo, observar, dropdown } = require('../../_comum');

module.exports = {
  // Escolhe a opção do dropdown e devolve os diálogos que abriram (ex.: aviso de limpar credenciais). args: { rotulo, opcao }
  async escolher(t, { rotulo, opcao }) {
    const valor = await dropdown(t, t.p, rotulo, opcao);
    return { valor, via: dropdown.ultimo.via, cliques: dropdown.ultimo.cliques, dialogos: await t.tela.textoDialogos(t.p) };
  },
};
