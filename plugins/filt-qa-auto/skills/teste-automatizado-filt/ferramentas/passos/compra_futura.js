// Compra para recebimento futuro (nota de terceiros) com acerto em Duplicata.
// args: {natureza?: "43COMPRA PARA RECEBIMENTO FUTURO", numero, serie?, pessoa, item, qtd, vu, data?, forma?: "30 DIAS", vencs?}
// qtd é digitado cru: unidade com 3 casas (M, TON, LT) → 10 un = "10000".
// A compra futura soma Disponível (tipo 2) e A Receber (tipo 5) em ESTOQUE_MOVIMENTO; não entra no físico.
module.exports = async (p, lib, a) => {
  const r = await require('./nota_data.js')(p, lib, { natureza: a.natureza || '43COMPRA PARA RECEBIMENTO FUTURO', numero: a.numero, serie: a.serie || 1, pessoa: a.pessoa, itens: [{ item: a.item, qtd: a.qtd, vu: a.vu }], data: a.data, acerto: false });
  if (r.status !== 'acerto_financeiro') return { erro: 'esperava o acerto financeiro', r };
  const d = await require('./duplicata.js')(p, lib, { forma: a.forma || '30 DIAS', vencs: a.vencs, salvarNota: true });
  return { chave: r.chave, ...d };
};
