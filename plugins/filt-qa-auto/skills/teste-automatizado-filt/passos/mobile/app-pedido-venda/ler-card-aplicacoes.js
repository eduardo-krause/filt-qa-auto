// App Filt Pedido (Android, via adb)
const a = require('../../_adb');
const i = require('../../_app-item');

module.exports = {
  async ler(t) { return i.lerAplicacoes(); },

  // Botão flutuante (confirmar / salvar a edição). → texto da tela seguinte,
};
