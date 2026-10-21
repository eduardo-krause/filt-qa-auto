// App Filt Pedido (Android, via adb)
const i = require('../../_app-item');

module.exports = {
  // Na busca de itens: pesquisa, abre o carrinho do card, preenche e confirma.
  // args: { busca, item: '47 - TIOFANATO', receituario: 'texto da linha', buscaRec?, equipamento?, qtd, aplicacoes }
  // → { numero, quantidadeTratar, aviso, confirmado }
  async adicionar(t, args) { return i.adicionarItem(args); },

  // Na tela do item aberta: mudar só um campo e ler o card. → { numero, quantidadeTratar, aviso },
};
