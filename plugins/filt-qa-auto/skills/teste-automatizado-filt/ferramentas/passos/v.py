import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import q
# uso: python passos/v.py <ID_ITEM_FILIAL> [...] → médio atual, último valor, saldo tipo 1 e últimas linhas do histórico
ids = sys.argv[1:]
for i in ids:
    r = q(f"""select f.ID_ITEM_FILIAL, i.DESCRICAO, v.VALOR_UNITARIO_AQUISICAO, v.VALOR_UNITARIO_AQUISICAO_MEDIO,
      (select sum(coalesce(QUANTIDADE_ENTRADA,0)-coalesce(QUANTIDADE_SAIDA,0)) from ESTOQUE_MOVIMENTO m where m.ID_ITEM_FILIAL=f.ID_ITEM_FILIAL and m.ID_TIPO_SALDO_ESTOQUE=1)
      from ITEM_FILIAL f join ITEM i using(ID_ITEM) left join ITEM_FILIAL_VALORES v using(ID_ITEM_FILIAL) where f.ID_ITEM_FILIAL={i}""")[0]
    h = q(f"select DATA,HORA,VALOR_UNITARIO_AQUISICAO_MEDIO from ITEM_VALOR_MEDIO_AQUISICAO where ID_ITEM_FILIAL={i} order by DATA desc,HORA desc,ID_ITEM_VALOR_MEDIO_AQUISICAO desc limit 3")
    print(f"IF {r[0]} {r[1]}: medio={r[3]} ultimo={r[2]} saldo={r[4]} hist={[(str(a),str(b),float(c)) for a,b,c in h]}")
