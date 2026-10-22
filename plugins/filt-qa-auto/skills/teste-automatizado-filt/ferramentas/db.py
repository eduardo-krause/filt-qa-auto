"""Consulta ao MySQL.
  Homologação — SOMENTE no banco do AT da tarefa (gravado pelo login):
     python db.py "<sql>"
     python db.py --escrever "<sql>"   (escrita, só se realmente necessário, ainda no banco do AT da tarefa)
  Produção — SOMENTE LEITURA e SOMENTE no banco da base de teste configurada (config producao.db.banco):
     python db.py --producao "<sql>"
Uso em scripts: from db import q; q('select ...')   (homologação, banco do AT)
"""
import json, os, re, sys
import pymysql

AQUI = os.path.dirname(os.path.abspath(__file__))
HOME = os.environ.get('FILT_QA_HOME') or os.path.join(os.path.expanduser('~'), '.claude', 'filt-qa')
CFG = json.load(open(os.path.join(HOME, 'config.json'), encoding='utf8'))
cfg = CFG['db']
TAREFA = (os.environ.get('FILT_QA_TAREFA') or 'padrao').upper()
ARQ_SESSAO = os.path.join(HOME, 'sessoes', TAREFA + '.json')   # uma sessão por tarefa (FILT_QA_TAREFA)
try:
    sess = json.load(open(ARQ_SESSAO, encoding='utf8'))
except Exception:
    sess = {}

LEITURA = re.compile(r'\s*(select|show|describe|desc|explain|with)\b', re.I)

def banco():
    b = sess.get('banco')
    if not b:
        raise SystemExit('BLOQUEADO: faça o login no AT da tarefa primeiro (steps/login) — o banco vem de lá.')
    return b

def conectar():
    b = banco()
    try:
        return pymysql.connect(host=cfg['host'], port=cfg['port'], user=cfg['user'], password=cfg['password'], database=b, charset='utf8mb4')
    except pymysql.err.OperationalError as e:
        if e.args and e.args[0] == 1049:
            raise SystemExit(f'PROBLEMA NO AT DA TAREFA — banco {b} não existe. Reportar ao usuário para corrigir o AT (não usar outro banco).')
        raise

def conectar_producao():
    p = CFG['producao']['db']
    # senha do banco de produção = mesma do banco de homologação (informado pelo usuário)
    return pymysql.connect(host=p['host'], port=p['port'], user=p['user'], password=cfg['password'], database=p['banco'], charset='utf8mb4')

def q(sql, _ignorado=None, args=None):
    c = conectar(); cur = c.cursor(); cur.execute(sql, args); r = cur.fetchall(); c.close(); return r

def main():
    producao = '--producao' in sys.argv
    escrever = '--escrever' in sys.argv
    a = [x for x in sys.argv[1:] if x not in ('--escrever', '--producao')]
    if len(a) != 1:
        raise SystemExit('uso: python db.py [--producao] "<sql>"')
    sql = a[0]
    if producao:
        alvo = CFG['producao']['db']['banco']
        if escrever or not LEITURA.match(sql):
            raise SystemExit('BLOQUEADO: produção é SOMENTE LEITURA.')
        if re.search(r'\b(CLIENTE_\d+|information_schema\.schemata)\b', sql, re.I) and alvo not in sql:
            raise SystemExit(f'BLOQUEADO: em produção só o banco da base de teste configurada ({alvo}).')
        c = conectar_producao()
    else:
        if re.search(r'\b(CLIENTE_\d+|information_schema\.schemata)\b', sql, re.I) and banco() not in sql:
            raise SystemExit('BLOQUEADO: a consulta cita outro banco. Só é permitido o banco do AT da tarefa.')
        if not escrever and not LEITURA.match(sql):
            raise SystemExit('BLOQUEADO: comando de escrita. Use --escrever só se for realmente necessário.')
        c = conectar()
    cur = c.cursor()
    try:
        cur.execute(sql)
    except Exception as e:
        print('ERRO', e); sys.exit(1)
    if cur.description:
        print('\t'.join(d[0] for d in cur.description))
        for r in cur.fetchall():
            print('\t'.join('' if x is None else str(x) for x in r))
    else:
        c.commit(); print('linhas afetadas:', cur.rowcount)
    c.close()

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
