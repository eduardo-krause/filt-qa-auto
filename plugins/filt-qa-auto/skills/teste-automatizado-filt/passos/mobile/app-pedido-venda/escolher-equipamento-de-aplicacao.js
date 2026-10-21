// App Filt Pedido (Android, via adb)
const i = require('../../_app-item');

module.exports = {
  async equipamento(t, { equipamento }) { i.equipamento(equipamento); return i.lerAplicacoes(); },
};
