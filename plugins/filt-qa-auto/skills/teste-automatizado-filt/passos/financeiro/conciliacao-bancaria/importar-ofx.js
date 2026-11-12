// Tela: Processos › Financeiro › Conciliação de Contas (/financeiro/conciliacao-bancaria) — importa um arquivo OFX (botão OFX → SELECIONAR OFX).
const path = require('path');
const { preparar, idsConciliacao } = require('./_apoio');

module.exports = {
  // args: { arquivo (caminho do .ofx) } → { status (HTTP do upload), resposta (mensagem de erro, se houver), toasts, idConciliacao (banco: nova CONCILIACAO com o nome do arquivo, ou null), url }
  async importar(t, { arquivo }) {
    const { p } = t;
    const antes = Number(await t.banco.valor('SELECT COALESCE(MAX(ID_CONCILIACAO),0) FROM CONCILIACAO')) || 0;
    const enviar = await preparar(t, p, arquivo);
    const r = await enviar();
    const ids = await idsConciliacao(t, path.basename(arquivo), antes);
    const reaberta = ids.length ? null : await t.banco.valor('SELECT MAX(ID_CONCILIACAO) FROM CONCILIACAO WHERE NOME_ARQUIVO = ?', [path.basename(arquivo)]);
    return { ...r, idConciliacao: ids.length ? ids[ids.length - 1] : null, idConciliacaoExistente: reaberta ? Number(reaberta) : null, url: p.url() };
  },
};
