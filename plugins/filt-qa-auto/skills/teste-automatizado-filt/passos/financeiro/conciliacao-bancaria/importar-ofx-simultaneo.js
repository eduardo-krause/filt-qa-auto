// Tela: Processos › Financeiro › Conciliação de Contas — o mesmo OFX importado em duas (ou mais) abas ao mesmo tempo (cenário de usuário com várias abas).
const path = require('path');
const { preparar, idsConciliacao } = require('./_apoio');

module.exports = {
  // args: { arquivo, abas:2 } → { abas:[{ status, resposta, toasts }], idsConciliacao (novas CONCILIACAO com o nome do arquivo) }
  async importarSimultaneo(t, { arquivo, abas = 2 }) {
    const { p } = t;
    const antes = Number(await t.banco.valor('SELECT COALESCE(MAX(ID_CONCILIACAO),0) FROM CONCILIACAO')) || 0;
    const paginas = [p];
    for (let i = 1; i < abas; i++) paginas.push(await p.context().newPage());
    try {
      const envios = [];
      for (const pg of paginas) envios.push(await preparar(t, pg, arquivo));
      const res = await Promise.all(envios.map((f) => f()));
      return { abas: res, idsConciliacao: await idsConciliacao(t, path.basename(arquivo), antes) };
    } finally {
      for (const pg of paginas.slice(1)) await pg.close().catch(() => {});
    }
  },
};
