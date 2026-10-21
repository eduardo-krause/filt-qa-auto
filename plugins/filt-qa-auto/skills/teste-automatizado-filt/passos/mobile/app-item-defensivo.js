// App Filt Pedido (Android, via adb) — ADICIONAR AO CARRINHO / EDITAR ITEM de defensivo: cards Receituário padrão, Equipamento de
// aplicação e Aplicações (Número de aplicações + Quantidade a tratar bloqueada). Digitação tecla a tecla (máscara do Flutter perde dígitos);
// acentos não são digitáveis por adb (buscar por um trecho sem acento).
const i = require('../_app-item');

module.exports = {
  // Na busca de itens: pesquisa, abre o carrinho do card, preenche e confirma.
  // args: { busca, item: '47 - TIOFANATO', receituario: 'texto da linha', buscaRec?, equipamento?, qtd, aplicacoes }
  // → { numero, quantidadeTratar, aviso, confirmado }
  async adicionar(t, args) { return i.adicionarItem(args); },

  // Na tela do item aberta: mudar só um campo e ler o card. → { numero, quantidadeTratar, aviso }
  async quantidade(t, { qtd }) { i.quantidade(qtd); return i.lerAplicacoes(); },
  async aplicacoes(t, { aplicacoes }) { return i.aplicacoes(aplicacoes); },
  async receituario(t, { receituario, buscaRec }) { i.receituario(receituario, buscaRec); return i.lerAplicacoes(); },
  async equipamento(t, { equipamento }) { i.equipamento(equipamento); return i.lerAplicacoes(); },
  async ler(t) { return i.lerAplicacoes(); },

  // Botão flutuante (confirmar / salvar a edição). → texto da tela seguinte
  async confirmar(t) { return i.confirmar(); },
};
