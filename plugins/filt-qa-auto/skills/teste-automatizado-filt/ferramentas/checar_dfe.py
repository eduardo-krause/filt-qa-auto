"""Confere o ambiente do DF-e antes de emitir documento fiscal.
uso: python checar_dfe.py              -> banco do AT da tarefa
     python checar_dfe.py --producao   -> base de teste de produção (config producao.db.banco, só leitura)
Emitir é permitido; o único impedimento é algum documento (NF-e, NFC-e, CT-e, MDF-e) configurado com ambiente PRODUCAO.
Grava o resultado na sessão da tarefa (FILT_QA_TAREFA) (chave dfe_at / dfe_producao), que o passo `acoes` exige antes de salvar em rotina fiscal.
"""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import db

SQL = "select ID_FILIAL, NFE_AMBIENTE, NFCE_AMBIENTE, CTE_AMBIENTE, MDFE_AMBIENTE from CONFIGURACAO_DOCUMENTO_FISCAL_ELETRONICO"

def main():
    prod = '--producao' in sys.argv
    c = db.conectar_producao() if prod else db.conectar()
    cur = c.cursor(); cur.execute(SQL); linhas = cur.fetchall(); c.close()
    em_producao = [(f, doc) for f, *amb in linhas for doc, a in zip(('NF-e', 'NFC-e', 'CT-e', 'MDF-e'), amb) if a == 'PRODUCAO']
    ok = not em_producao
    res = {'ok': ok, 'verificado_em': int(time.time()),
           'filiais': [{'filial': f, 'NF-e': a, 'NFC-e': b, 'CT-e': cte, 'MDF-e': m} for f, a, b, cte, m in linhas]}
    if not ok:
        res['bloqueio'] = 'DF-e em PRODUÇÃO: ' + ', '.join(f'filial {f} {d}' for f, d in em_producao) + ' — NÃO emitir; avisar o usuário.'
    sp = db.ARQ_SESSAO; os.makedirs(os.path.dirname(sp), exist_ok=True)
    s = {}
    try: s = json.load(open(sp, encoding='utf8'))
    except Exception: pass
    s['dfe_producao' if prod else 'dfe_at'] = res
    json.dump(s, open(sp, 'w', encoding='utf8'), indent=2, ensure_ascii=False)
    print(json.dumps(res, ensure_ascii=False, indent=1))
    sys.exit(0 if ok else 3)

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
