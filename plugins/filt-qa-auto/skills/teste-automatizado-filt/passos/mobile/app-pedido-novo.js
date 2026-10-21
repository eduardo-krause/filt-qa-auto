// App Filt Pedido (Android, via adb) — NOVO PEDIDO DE VENDA: cabeçalho (natureza, pessoa, parâmetro de preço, forma, data de pagamento).
// O cliente só aparece se estiver na carteira do vendedor do usuário (PESSOA_COMPLEMENTO.ID_PESSOA_VENDEDOR); o parâmetro, se o vendedor
// estiver em PARAMETRO_VENDA_PESSOA_VENDEDOR. Pedido agronômico exige cliente com atribuição Consulente.
const a = require('../_adb');

module.exports = {
  // args: { natureza?, cliente, parametro?: 'PARÂMETRO DE PREÇO MOBILE', forma?: 'DINHEIRO' } → fica na busca de itens
  async criar(t, { natureza = 'PEDIDO DE VENDA - À VISTA', cliente, parametro, forma = 'DINHEIRO' }) {
    a.novoPedido({ natureza, cliente });
    if (parametro) { a.tocarXY(...a.CABECALHO.parametro); a.tocar(parametro); }
    a.tocarXY(...a.CABECALHO.forma); a.tocar(forma);
    a.tocarXY(...a.CABECALHO.data); a.tocar('Hoje'); a.tocar('OK');
    a.tocar('FEITO');
    const ok = a.esperarTexto(/Pesquise para listar|cadastrado com sucesso/);
    t.confere('cabeçalho do pedido confirmado', !!ok, true);
    return a.tela();
  },
};
