// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro) — ajudantes dos cenários desta tela (não é cenário)

// Duplicatas criadas depois de `desde` para a pessoa, com o último boleto de cada uma (se houver).
const duplicatasSql = `select d.ID_DOCUMENTO_FINANCEIRO as id, d.NUMERO_DOCUMENTO as numero, d.VALOR_DOCUMENTO_FINANCEIRO as valor,
    d.DATA_VENCIMENTO as vencimento, d.BOLETO_COBRANCA as boleto, d.ID_CONFIGURACAO_PORTADOR as portador,
    h.ID_HISTORICO_BOLETO as historico, h.TIPO_EMISSAO as tipo, h.SITUACAO_INTEGRACAO as situacao, h.NOSSO_NUMERO as nossoNumero,
    h.TXID as txid, h.EMV_PIX as emv, h.LINHA_DIGITAVEL as linha, h.CODIGO_BARRAS as barras
  from DOCUMENTO_FINANCEIRO d
  left join HISTORICO_BOLETO h on h.ID_HISTORICO_BOLETO = (select max(x.ID_HISTORICO_BOLETO) from HISTORICO_BOLETO x where x.ID_DOCUMENTO_FINANCEIRO = d.ID_DOCUMENTO_FINANCEIRO)
  where d.ID_DOCUMENTO_FINANCEIRO > ? and d.ID_PESSOA = ? order by d.ID_DOCUMENTO_FINANCEIRO`;

module.exports = { duplicatasSql };
