// App Filt Pedido (Android, via adb) — Menu › ATUALIZAR DADOS (baixa cadastros, receituários, configuração do Reag).
// Não envia pedidos: o envio é por pedido (mobile/app-pedido-enviar). Falha "Erro inesperado!" → tenta mais uma vez e anota.
const a = require('../_adb');

module.exports = {
  // → texto do aviso de conclusão
  async atualizarDados(t) {
    try { return a.sincronizar(); } catch (e) {
      t.anotar('sincronização falhou na 1ª tentativa: ' + e.message.split('\n')[0]);
      const v = a.elementos().find((x) => x.rotulo === 'Voltar'); if (v) a.tocarXY(v.x, v.y);
      return a.sincronizar();
    }
  },
};
