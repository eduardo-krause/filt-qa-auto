// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)
// Atalho de compatibilidade: as funções ficam nos arquivos por tela abaixo (suítes antigas usam t.passos.<área>.<este arquivo>).
module.exports = {
  ...require('./nota-entrada-compra'),
  ...require('./nota-venda'),
  ...require('./nota-referenciada'),
  ...require('./nota-salvar-aberta'),
  ...require('./nota-excluir'),
  ...require('./nota-consulta-banco'),
};
