// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)
// Atalho de compatibilidade: as funções ficam nos arquivos por tela abaixo (suítes antigas usam t.passos.<área>.<este arquivo>).
module.exports = {
  ...require('./pedido-criar'),
  ...require('./pedido-ordem-entrega'),
  ...require('./pedido-editar'),
  ...require('./pedido-cancelar'),
  ...require('./pedido-venda-futura'),
  ...require('./pedido-consulta-banco'),
};
