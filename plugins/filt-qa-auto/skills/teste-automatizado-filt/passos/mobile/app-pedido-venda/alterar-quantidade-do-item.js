// App Filt Pedido (Android, via adb)
const i = require('../../_app-item');

module.exports = {
  async quantidade(t, { qtd }) { i.quantidade(qtd); return i.lerAplicacoes(); },
};
