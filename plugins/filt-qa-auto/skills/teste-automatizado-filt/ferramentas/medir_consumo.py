"""Consumo de tokens das validações (só leitura das conversas salvas em ~/.claude/projects).

Uso: python medir_consumo.py [NMTZ-XXXX]
Uma linha por sessão da skill: chamadas ao modelo, contexto médio/máximo, tokens relidos e
custo relativo (preço de entrada = 1; cache lido 0,1; cache gravado 2; saída 5). Subagentes contam junto.
"""
import glob
import json
import os
import re
import sys
from collections import Counter

filtro = sys.argv[1].upper() if len(sys.argv) > 1 else None
raiz = os.path.expanduser("~/.claude/projects")


def usos(caminho, vistos):
    for linha in open(caminho, encoding="utf-8", errors="replace"):
        try:
            m = json.loads(linha).get("message") or {}
        except ValueError:
            continue
        u = m.get("usage")
        if u and m.get("id") not in vistos:
            vistos.add(m.get("id"))
            yield u


for arq in sorted(glob.glob(os.path.join(raiz, "*", "*.jsonl")), key=os.path.getmtime):
    texto = open(arq, encoding="utf-8", errors="replace").read()
    if "teste-automatizado-filt" not in texto and "teste-tarefa" not in texto:
        continue
    tarefas = Counter(re.findall(r"NMTZ-\d{4,5}", texto))
    tarefa = tarefas.most_common(1)[0][0] if tarefas else "?"
    if filtro and tarefa != filtro:
        continue
    vistos = set()
    sub = glob.glob(os.path.join(os.path.splitext(arq)[0], "subagents", "*.jsonl"))
    n = maximo = relido = gravado = saida = 0
    for caminho in [arq] + sub:
        for u in usos(caminho, vistos):
            ctx = u.get("cache_read_input_tokens", 0) + u.get("cache_creation_input_tokens", 0) + u.get("input_tokens", 0)
            n += 1
            maximo = max(maximo, ctx)
            relido += u.get("cache_read_input_tokens", 0)
            gravado += u.get("cache_creation_input_tokens", 0)
            saida += u.get("output_tokens", 0)
    custo = relido * 0.1 + gravado * 2 + saida * 5
    media = (relido + gravado) / max(n, 1)
    print(f"{os.path.basename(arq)[:8]} {tarefa:11} chamadas {n:4}  ctx médio {media/1e3:4.0f}K  "
          f"máx {maximo/1e3:4.0f}K  subagentes {len(sub):2}  custo relativo {custo/1e6:6.1f}M")
