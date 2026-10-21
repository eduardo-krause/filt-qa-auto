// App Filt Pedido (Android, via adb)
const i = require('../../_app-item');

module.exports = {
  async aplicacoes(t, { aplicacoes }) { return i.aplicacoes(aplicacoes); },
};
