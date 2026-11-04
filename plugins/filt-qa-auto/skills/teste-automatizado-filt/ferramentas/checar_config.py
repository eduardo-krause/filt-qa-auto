"""Confere o config.json pessoal (~/.claude/filt-qa/config.json ou FILT_QA_HOME) e lista o que falta preencher.
uso: python checar_config.py            -> JSON {ok, arquivo, faltando:[campos], opcionais_faltando:[...]}
     python checar_config.py --criar    -> cria o arquivo a partir do config.example.json (se não existir)
Nunca imprime valores (senhas/CPF): só o nome dos campos."""
import json, os, sys, shutil
HOME = os.environ.get('FILT_QA_HOME') or os.path.join(os.path.expanduser('~'), '.claude', 'filt-qa')
ARQ = os.path.join(HOME, 'config.json')
EX = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'config.example.json')
OBRIG = ['erp.usuarios.principal.cpf', 'erp.usuarios.principal.senha', 'db.host', 'db.port', 'db.user', 'db.password',
         'playwright.nodeModules', 'playwright.chrome', 'saidaRelatorios']
OPC = ['jira.email', 'jira.token', 'jenkins.usuario', 'jenkins.token',
       'erp.usuarios.secundario.cpf', 'erp.usuarios.secundario.senha', 'figma.email', 'figma.senha',
       'producao.empresa', 'producao.basesTeste', 'producao.db.host', 'producao.db.user', 'producao.db.senha', 'producao.db.banco']
def pega(c, k):
    for p in k.split('.'):
        if not isinstance(c, dict) or p not in c: return None
        c = c[p]
    return c
def vazio(v):
    if v in (None, '', []): return True
    if isinstance(v, str) and '<' in v and '>' in v: return True
    if isinstance(v, list): return all(vazio(x) for x in v)
    return False
if '--criar' in sys.argv and not os.path.exists(ARQ):
    os.makedirs(HOME, exist_ok=True); shutil.copy(EX, ARQ)
if not os.path.exists(ARQ):
    print(json.dumps({'ok': False, 'arquivo': ARQ, 'motivo': 'não existe — rodar com --criar e preencher'}, ensure_ascii=False)); sys.exit(1)
c = json.load(open(ARQ, encoding='utf-8'))
falt = [k for k in OBRIG if vazio(pega(c, k))]
opc = [k for k in OPC if vazio(pega(c, k))]
print(json.dumps({'ok': not falt, 'arquivo': ARQ, 'faltando': falt, 'opcionais_faltando': opc}, ensure_ascii=False, indent=1))
sys.exit(0 if not falt else 1)
