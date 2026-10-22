Ao consultar recebíveis de cartão na tabela `DOCUMENTO_FINANCEIRO` (schema `CLIENTE_<id>`), **não filtrar por `TIPO_DOCUMENTO_FINANCEIRO = 'CARTAO'`** — esse valor cobre só as baixas automáticas via TEF (conciliação de adquirente) e é um universo separado, geralmente pequeno.

O que as telas nativas de "Cartão a Receber" realmente mostram são documentos com:
- `TIPO_DOCUMENTO_FINANCEIRO = 'DUPLICATA'`
- `ID_CARTAO IS NOT NULL` (vendas parceladas registradas como duplicata, mas com o cartão vinculado só por esse campo)
- `PAGAR_RECEBER = 'RECEBER'`
- `SITUACAO_DOCUMENTO <> 'EXCLUIDO'` (para bater com o que a tela mostra, que exclui cancelados — mas pode haver uma diferença residual de 1 registro cancelado por caso de borda não identificado)

Validado comparando com as telas reais do cliente 101637 (filial 10: 699/700 bateu exato; filial 2 (código de negócio) = ID_FILIAL 3: 1372/1373, diferença de 1 registro cancelado não identificado).

**Também importante:** a tabela `FILIAL` tem `ID_FILIAL` (chave interna) e `FILIAL` (código de negócio exibido nas telas) como colunas **diferentes**. Ex.: FILIAL (código) 2 = ID_FILIAL 3. Sempre usar `f.FILIAL` para casar com o número que o usuário vê na tela, não `f.ID_FILIAL`.

Query de referência (ajustar `<id_cliente>` no nome do schema):
```sql
SELECT f.FILIAL AS COD_FILIAL, f.FANTASIA, COALESCE(c.DESCRICAO,'SEM CARTAO') AS CARTAO,
       COUNT(*) AS QTD, SUM(df.VALOR_DOCUMENTO_FINANCEIRO) AS VALOR
FROM DOCUMENTO_FINANCEIRO df
JOIN FILIAL f ON f.ID_FILIAL = df.ID_FILIAL
LEFT JOIN CARTAO c ON c.ID_CARTAO = df.ID_CARTAO
WHERE df.TIPO_DOCUMENTO_FINANCEIRO = 'DUPLICATA'
  AND df.PAGAR_RECEBER = 'RECEBER'
  AND df.ID_CARTAO IS NOT NULL
  AND df.SITUACAO_DOCUMENTO <> 'EXCLUIDO'
GROUP BY f.FILIAL, f.FANTASIA, c.ID_CARTAO, c.DESCRICAO
ORDER BY f.FILIAL, VALOR DESC;
```

Veja também: `certificado-digital.md` (outro caso de "a config real não está na tabela óbvia") e `ref_database_connection.md`.
