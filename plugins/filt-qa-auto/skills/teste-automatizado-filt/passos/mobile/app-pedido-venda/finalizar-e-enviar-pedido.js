// App Filt Pedido (Android, via adb)
const a = require('../../_adb');

module.exports = {
  // → { status, pedido } (pedido = ID_PEDIDO no ERP)
  async finalizarEEnviar(t) {
    const r = a.finalizarEnviar();
    t.confere('pedido sincronizado', /SINCRONIZADO/.test(r.status) && !!r.pedido, true);
    t.guardar('pedidoApp', r.pedido);
    return r;
  },
};
