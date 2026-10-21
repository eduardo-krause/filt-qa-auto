// App Filt Pedido (Android, via adb)
const i = require('../../_app-item');

module.exports = {
  async receituario(t, { receituario, buscaRec }) { i.receituario(receituario, buscaRec); return i.lerAplicacoes(); },
};
