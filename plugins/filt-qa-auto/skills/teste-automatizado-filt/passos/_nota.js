// Consultas e utilitários das telas de Nota Fiscal (arquivo de apoio, não é passo: fica fora das pastas de área)

const notasSql = `select n.ID_NOTA_FISCAL, n.NUMERO_DOCUMENTO, n.ID_SITUACAO_DOCUMENTO
  from NOTA_FISCAL n where n.ID_NOTA_FISCAL > ? and exists (
    select 1 from NOTA_FISCAL_ITEM i join PEDIDO_ITEM pi on pi.ID_PEDIDO_ITEM = i.ID_PEDIDO_ITEM
    where i.ID_NOTA_FISCAL = n.ID_NOTA_FISCAL and pi.ID_PEDIDO = ?) order by n.ID_NOTA_FISCAL`;

const titulosSql = `select d.ID_DOCUMENTO_FINANCEIRO, d.NUMERO_DOCUMENTO, d.TIPO_DOCUMENTO_FINANCEIRO, d.STATUS, d.VALOR_DOCUMENTO_FINANCEIRO
  from NOTA_FISCAL n join NOTA_FISCAL_DOCUMENTO_FINANCEIRO x on x.ID_NOTA_FISCAL = n.ID_NOTA_FISCAL
  join DOCUMENTO_FINANCEIRO d on d.ID_DOCUMENTO_FINANCEIRO = x.ID_DOCUMENTO_FINANCEIRO
  where n.ID_NOTA_FISCAL = ? order by d.NUMERO_DOCUMENTO`;

// Chave de acesso fictícia (44 dígitos, DV válido) para nota de terceiros digitada — a Sefaz não conhece essa chave.
function chaveFicticia(serie, numero, cnpj = '12345678000195', aamm = '2610') {
  const b = '41' + aamm + cnpj + '55' + String(serie).padStart(3, '0') + String(numero).padStart(9, '0') + '1' + String(numero).slice(-8).padStart(8, '0');
  let s = 0, w = 2; for (let i = b.length - 1; i >= 0; i--) { s += Number(b[i]) * w; w = w === 9 ? 2 : w + 1; }
  const r = s % 11; return b + (r < 2 ? 0 : 11 - r);
}

module.exports = { notasSql, titulosSql, chaveFicticia };
