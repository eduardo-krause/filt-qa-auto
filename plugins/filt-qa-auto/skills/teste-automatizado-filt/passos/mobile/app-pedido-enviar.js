// App Filt Pedido (Android, via adb) — FINALIZAR E ENVIAR o pedido: Carrinho › Continuar › FINALIZAR › abrir o pedido › ⋮ › Sincronizar.
// ("Atualizar dados" do Menu não envia pedido.) Devolve o número do pedido no ERP ("Venda N").
const a = require('../_adb');

module.exports = {
  // → { status, pedido } (pedido = ID_PEDIDO no ERP)
  async finalizarEEnviar(t) {
    const r = a.finalizarEnviar();
    t.confere('pedido sincronizado', /SINCRONIZADO/.test(r.status) && !!r.pedido, true);
    t.guardar('pedidoApp', r.pedido);
    return r;
  },
};
