// Modelo de suíte — copie para ~/.claude/historico-validacoes/<NMTZ>/automacao/suite.js e preencha.
// Guia completo: referencias/escrever-suite.md
//
// Rodar:  node <skill>/motor/executar.js suite.js --listar
//         node <skill>/motor/executar.js suite.js --casos 1

const D = {
  // tudo que depende da base fica aqui (cliente, item, naturezas...), para a suíte ser fácil de adaptar
  cliente: 'NOME DO CLIENTE NA BASE',
  item: 'ITEM', casas: 0,
  natureza: 'PEDIDO DE VENDA - À VISTA',
};

module.exports = {
  tarefa: 'NMTZ-00000',
  titulo: 'Título da tarefa',
  at: { url: 'https://erp-homologacao-nmtz-00000.viasoftcloud.com.br', base: 'BASE INFORMADA PELA PESSOA' },
  dados: D,

  casos: [
    {
      id: '1',
      titulo: 'O que este caso prova',
      origem: 'Caso de Teste 01 / Critério X',
      telas: ['Pedido Venda'],
      esperado: 'Resultado esperado, com os números calculados.',
      async executar(t) {
        const { pedido } = await t.passos.vendas.pedido.criar({ natureza: D.natureza, cliente: D.cliente, forma: 'DINHEIRO', itens: [{ item: D.item, qtd: 1, casas: D.casas }] });
        await t.passos.vendas.pedido.confere({ pedido, STATUS_PEDIDO: 'APROVADO', quando: 'após concluir' });
      },
    },
    {
      id: '2',
      titulo: 'Conferência visual do layout',
      origem: 'Critério Y',
      telas: ['Pedido Venda'],
      esperado: 'Campo novo alinhado com os demais.',
      manual: 'conferência de layout é feita na validação manual',
    },
  ],
};
