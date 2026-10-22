Tabelas de custo/valor de item (bases `CLIENTE_<id>`):

- **ITEM_VALOR_MEDIO_AQUISICAO** (histórico): `ID_ITEM_VALOR_MEDIO_AQUISICAO`, `ID_ITEM_FILIAL`, `DATA`, `HORA`, `VALOR_UNITARIO_AQUISICAO_MEDIO`. **Não existe coluna `VALOR`** — o valor é `VALOR_UNITARIO_AQUISICAO_MEDIO`, mesmo nome do campo corrente em ITEM_FILIAL_VALORES.
- **ITEM_FILIAL**: PK é `ID_ITEM_FILIAL` (não `ID`); tem `ID_ITEM`, `ID_FILIAL`. Não tem `CODIGO`.
- **ITEM_FILIAL_VALORES**: PK `ID_ITEM_FILIAL_VALORES`, FK `ID_ITEM_FILIAL`; valores correntes em `VALOR_UNITARIO_AQUISICAO`, `VALOR_UNITARIO_AQUISICAO_MEDIO`, `VALOR_CUSTO_MEDIO`, `VALOR_CUSTO_AQUISICAO`, `VALOR_PRECO_VENDA`, `VALOR_CUSTO_PMZ`.
- **ITEM**: PK `ID_ITEM`.

Cuidado: IDs de `ITEM_FILIAL` e de `ITEM` são faixas diferentes — um "item 57" costuma ser `ID_ITEM_FILIAL = 57`, não `ID_ITEM = 57`.

Ver também `ref_database_connection.md`.

## Fórmulas de custo

- `FORMULA` (`ID_FORMULA`, `FORMULA` texto, `TIPO_CALCULO` enum incl. `CUSTO_AQUISICAO`). Quem aponta pra ela: `ITEM_FILIAL.ID_FORMULA_CUSTO_AQUISICAO`, `GRUPO_ITEM_DETALHE_FILIAL` e `CONFIGURACAO_FILIAL` (fallback por filial).
- **`NOTA_FISCAL_ITEM.FORMULA_CUSTO_UNITARIO_JSON`** guarda o snapshot da fórmula usada naquela nota + `VALOR_CUSTO_UNITARIO` com o resultado. É o jeito de validar fórmula empiricamente: recalcular a expressão sobre as colunas da linha e comparar com o gravado. O snapshot também revela edições feitas na fórmula depois da emissão.
- Armadilha: `valorUnitarioTributavel` já é **unitário**; `valorFrete`, `valorDespesaAcessoria`, `valorSeguro` são **totais da linha**. Dividir a soma dos dois por `quantidadeTributavel` divide o unitário pela quantidade de novo.
- **`NOTA_FISCAL_ITEM.VALOR_DESCONTO` é UNITÁRIO** (por unidade comercial): `VALOR_CONTABIL = VALOR_ITEM + frete + despesa + seguro - VALOR_DESCONTO × QUANTIDADE_COMERCIAL` (conferido em todas as linhas de uma base de teste). O valor de aquisição também desconta `× QUANTIDADE_COMERCIAL`.

## Valor de aquisição — fórmula oficial

Fórmula oficial do valor de aquisição:

```
VALOR_UNITARIO_AQUISICAO =
  (VALOR_ITEM + VALOR_FRETE + VALOR_FRETE_GERENCIAL + VALOR_DESPESA_ACESSORIA
   + VALOR_SEGURO - VALOR_DESCONTO + VALOR_COMPONENTE) / QUANTIDADE_TRIBUTAVEL
```

`VALOR_COMPONENTE` é o CT-e: `CONHECIMENTO_TRANSPORTE_COMPONENTE.VALOR_COMPONENTE` com `CONSIDERA_TOTAL_PRESTACAO = b'1'`, ligado à nota por `CONHECIMENTO_TRANSPORTE_REFERENCIA.ID_NOTA_FISCAL_ORIGEM`. **O CT-e não está em NOTA_FISCAL_ITEM** — só chega ao custo pela fórmula. Rateio do CT-e entre os itens segue `CONFIGURACAO_NATUREZA_OPERACAO_NOTA_FISCAL.TIPO_RATEIO_FRETE` (via NATUREZA_OPERACAO_FILIAL.ID_NATUREZA_OPERACAO): VALOR (VALOR_ITEM), QUANTIDADE (qtd trib.), PESO_LIQUIDO/PESO_BRUTO (qtd × ITEM.PESO_*).

`VALOR_UNITARIO_AQUISICAO_MEDIO` (coluna que guarda o valor aquisição médio) = média móvel ponderada **tendo como fonte o VALOR_UNITARIO_AQUISICAO acima** — ou seja, **já com frete, seguro, despesa e CT-e embutidos**. Não é a média do valor "limpo" de nota. Entrada soma `qtd × valor`; saída baixa `qtd × médio_atual` (não muda o médio).

Cuidado: `VALOR_FRETE_GERENCIAL` costuma vir **NULL** e anula a soma inteira — use `coalesce(...,0)` em todos os termos.

Ao filtrar por item numa query que rateia o CT-e com window function, o filtro tem que ficar **fora** da subquery, senão a base do rateio encolhe para as linhas filtradas. Subquery correlacionada por `ID_NOTA_FISCAL` não tem esse problema.

`NOTA_FISCAL.ID_SITUACAO_DOCUMENTO` 1 (normal) e 7 (complementar) movimentam estoque (3, 6 e NULL = cancelada/inutilizada/não gerada, todas com zero movimento).

O sistema grava o médio arredondado em **6 casas** mesmo o campo sendo `decimal(20,8)` — valores terminam em `00` (45,818181818… vira `45.81818200`).

`ESTOQUE_MOVIMENTO` vem duplicado por `ID_TIPO_SALDO_ESTOQUE` (1–6); o médio de aquisição bate com o saldo do **tipo 1**. `ID_SITUACAO_DOCUMENTO = 7` = nota complementar (ex.: `TIPO_COMPLEMENTO='QUANTIDADE'`), que movimenta estoque e entra no médio. Script de simulação reaproveitável: pymysql (não há mysql no PATH; o `mysql.exe` fica na pasta do Workbench).

`ESTOQUE_MOVIMENTO` não tem valor, só quantidade; o custo de cada movimento vem por `ESTOQUE_MOVIMENTO_NOTA_FISCAL_ITEM` → `NOTA_FISCAL_ITEM`.

## Regras observadas do médio de aquisição

- Devolução de venda (OPERACAO_FISCAL.TIPO_DEVOLUCAO=1, entrada): entra pelo `VALOR_CUSTO_UNITARIO` da linha; se não muda o médio, não grava histórico.
- Devolução de compra (saída, TIPO_DEVOLUCAO=1): remove `qtd × VALOR_CUSTO_UNITARIO` e recalcula (desfaz a entrada) — grava histórico.
- Saldo negativo: se médio atual = 0, médio = valor da nota; se médio > 0, o sistema usa o saldo negativo direto na média. **Isso é bug** (confirmado pelo usuário em): o correto é saldo ≤ 0 → médio = valor da nota. **Corrigido** (reteste 28/09 em homolog geral: saldo −5 + compra 10×200 → 200,00).
- Várias linhas do mesmo item na mesma nota → uma linha de histórico por nota.
- O saldo-base vem da `ESTOQUE_SALDO`, não de somar `ESTOQUE_MOVIMENTO` — se ela estiver dessincronizada o médio sai errado (caso Chapéu IF 51: +5).
- Script de simulação completo: `%TEMP%/sim8.py sist` (pymysql) — reaproveitável para outras bases trocando o db.
- Exclusão de nota/CT-e e cancelamento de venda recalculam o médio certo; `VALOR_UNITARIO_AQUISICAO` (último) não volta na exclusão e não recebe o CT-e.
- Formação de Preço mostra "Valor Aquisição" = último (`VALOR_UNITARIO_AQUISICAO`), não o médio.
- **CT-e com várias notas**: o valor é rateado **uma vez entre todas as linhas de todas as notas** pelo tipo de rateio (todas precisam ter o mesmo; misturar é bloqueado). Bateu exato para valor, quantidade, peso líquido e peso bruto, edição de CT-e, exclusão e CT-e retroativo (recalcula a cadeia). Item sem peso recebe 0. `exemplos/sim_valor_medio.py` do skill já rateia assim (29/30 itens OK; CHAPÉU é dado antigo). Itens de teste QA11599 ITEM A–E (ID_ITEM 30–34 / IF 75–79) e suas notas foram excluídos a pedido do usuário em 28/09/2026.
- Devolução de venda futura **não** altera o médio (não há entrada física); devolução de venda entra pelo médio vigente na data da venda de origem; devolução de remessa entra pelo médio da época da remessa.
