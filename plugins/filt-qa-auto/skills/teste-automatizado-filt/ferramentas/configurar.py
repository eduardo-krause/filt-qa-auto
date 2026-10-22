"""Primeira execução: prepara a máquina da pessoa para o teste automatizado (filt-qa-auto) (Windows, Linux ou WSL), sem ela precisar digitar comando.
uso: python configurar.py   (no Linux: python3 configurar.py)  -> faz o que der automaticamente e imprime um JSON com o resultado
O que faz:
  1. confere Node.js (18+), npm e Git — se faltar, devolve o comando para instalar (winget no Windows; apt no Linux, que precisa de sudo)
  2. instala pymysql e pypdf no Python, se faltarem
  3. instala o Playwright + Chromium + ffmpeg na pasta pessoal (~/.claude/filt-qa) e descobre os caminhos
  4. cria ~/.claude/filt-qa/config.json a partir do modelo e preenche o que não é pessoal (caminhos, pastas)
  5. devolve os dados pessoais que ainda faltam (login do ERP, banco...) — esses a IA pede à pessoa
Comandos com sudo NÃO são executados aqui: vêm em "precisa_sudo" para a pessoa rodar (no Claude Code: ! sudo ...).
Nunca imprime senha/CPF.
"""
import glob, json, os, re, shutil, subprocess, sys

WIN = os.name == 'nt'
AQUI = os.path.dirname(os.path.abspath(__file__))
HOME = os.environ.get('FILT_QA_HOME') or os.path.join(os.path.expanduser('~'), '.claude', 'filt-qa')
ARQ = os.path.join(HOME, 'config.json')
EXEMPLO = os.path.normpath(os.path.join(AQUI, '..', '..', '..', 'config.example.json'))
os.makedirs(HOME, exist_ok=True)
def _sistema():
    if WIN: return 'Windows'
    try: return 'WSL' if 'microsoft' in open('/proc/version').read().lower() else 'Linux'
    except OSError: return 'Linux'
res = {'sistema': _sistema(),
       'feito': [], 'faltando_programas': [], 'precisa_sudo': [], 'avisos': []}

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, shell=isinstance(cmd, str), **kw)

# 1) programas
if WIN:
    for prog, wid in [('node', 'OpenJS.NodeJS.LTS'), ('npm', 'OpenJS.NodeJS.LTS'), ('git', 'Git.Git')]:
        if not shutil.which(prog):
            res['faltando_programas'].append({'programa': prog, 'instalar': f'winget install --id {wid} -e --accept-source-agreements --accept-package-agreements'})
else:
    if not shutil.which('git'):
        res['precisa_sudo'].append('sudo apt-get update && sudo apt-get install -y git')
    node_ok = False
    if shutil.which('node'):
        v = run('node --version').stdout.strip()
        m = re.match(r'v(\d+)', v); node_ok = bool(m and int(m.group(1)) >= 18)
        if not node_ok: res['avisos'].append(f'Node.js {v} é antigo (precisa 18 ou mais)')
    if not node_ok or not shutil.which('npm'):
        res['precisa_sudo'].append('curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs')
    if res['precisa_sudo']:
        res['faltando_programas'].append({'programa': 'node/git', 'instalar': 'ver precisa_sudo (a pessoa roda, pois pede a senha dela)'})

# 2) bibliotecas Python
falt_py = []
for mod in ['pymysql', 'pypdf']:
    try: __import__(mod)
    except ImportError: falt_py.append(mod)
if falt_py:
    r = run([sys.executable, '-m', 'pip', 'install', '-q', '--user', *falt_py])
    if r.returncode != 0 and 'externally-managed' in (r.stderr + r.stdout):   # Ubuntu/Debian novos (PEP 668)
        r = run([sys.executable, '-m', 'pip', 'install', '-q', '--user', '--break-system-packages', *falt_py])
    if r.returncode != 0 and not shutil.which('pip') and not WIN:
        res['precisa_sudo'].append('sudo apt-get install -y python3-pip')
    (res['feito'] if r.returncode == 0 else res['avisos']).append(f'pip install {" ".join(falt_py)}: ' + ('ok' if r.returncode == 0 else r.stderr[-300:]))

# 4a) config a partir do modelo
if not os.path.exists(ARQ):
    shutil.copy(EXEMPLO, ARQ); res['feito'].append('config.json criado a partir do modelo')
cfg = json.load(open(ARQ, encoding='utf-8'))
def vazio(v): return v in (None, '') or (isinstance(v, str) and '<' in v and '>' in v)

# 3) Playwright + navegador + ffmpeg
pw = cfg.setdefault('playwright', {})
nm = pw.get('nodeModules')
if vazio(nm) or not os.path.exists(os.path.join(str(nm), 'playwright')):
    nm = os.path.join(HOME, 'node_modules')
    if not os.path.exists(os.path.join(nm, 'playwright')) and shutil.which('npm'):
        r = run(f'npm install --prefix "{HOME}" playwright --no-fund --no-audit --loglevel=error')
        (res['feito'] if r.returncode == 0 else res['avisos']).append('npm install playwright: ' + ('ok' if r.returncode == 0 else r.stderr[-300:]))
    pw['nodeModules'] = nm.replace('\\', '/')
cli = os.path.join(nm, 'playwright', 'cli.js')
if os.environ.get('PLAYWRIGHT_BROWSERS_PATH'):
    base_pw = os.environ['PLAYWRIGHT_BROWSERS_PATH']
elif WIN:
    base_pw = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'ms-playwright')
else:
    base_pw = os.path.join(os.path.expanduser('~'), '.cache', 'ms-playwright')
def acha_chrome():
    pad = ('chrome-win*', 'chrome.exe') if WIN else ('chrome-linux*', 'chrome')
    return sorted(glob.glob(os.path.join(base_pw, 'chromium-*', *pad)))
def acha_ffmpeg():
    return sorted(glob.glob(os.path.join(base_pw, 'ffmpeg-*', 'ffmpeg-win*.exe' if WIN else 'ffmpeg-linux')))
if (not acha_chrome() or not acha_ffmpeg()) and os.path.exists(cli):
    r = run(['node', cli, 'install', 'chromium', 'ffmpeg'])
    (res['feito'] if r.returncode == 0 else res['avisos']).append('playwright install chromium ffmpeg: ' + ('ok' if r.returncode == 0 else r.stderr[-300:]))
if acha_chrome(): pw['chrome'] = acha_chrome()[-1].replace('\\', '/')
else: res['avisos'].append('Chromium do Playwright não encontrado')
if acha_ffmpeg(): pw['ffmpeg'] = acha_ffmpeg()[-1].replace('\\', '/')
pw.setdefault('cdpPort', 9333)
# Linux: o Chromium precisa de bibliotecas do sistema — testar e, se faltar, pedir o install-deps (sudo)
if not WIN and pw.get('chrome') and os.path.exists(cli):
    t = run([pw['chrome'], '--headless=new', '--no-sandbox', '--dump-dom', 'about:blank'], timeout=60)
    if t.returncode != 0 and ('error while loading shared libraries' in t.stderr or 'cannot open shared object' in t.stderr):
        res['precisa_sudo'].append(f'sudo "{shutil.which("node") or "node"}" "{cli}" install-deps chromium')

# 4b) pastas (não pessoais) com padrão
if vazio(cfg.get('saidaRelatorios')):
    cfg['saidaRelatorios'] = os.path.join(os.path.expanduser('~'), 'Downloads').replace('\\', '/')
os.makedirs(os.path.expanduser(cfg['saidaRelatorios']), exist_ok=True)
if vazio(cfg.get('pastaTrabalho')):
    cfg['pastaTrabalho'] = '~/.claude/historico-validacoes'
json.dump(cfg, open(ARQ, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
res['feito'].append('caminhos do navegador/ffmpeg e pastas gravados no config.json')

# 5) o que ainda falta (dados pessoais)
r = run([sys.executable, os.path.join(AQUI, 'checar_config.py')])
try: res['config'] = json.loads(r.stdout)
except Exception: res['config'] = {'erro': r.stdout[-300:]}
res['pronto'] = not res['faltando_programas'] and not res['precisa_sudo'] and res['config'].get('ok') is True
print(json.dumps(res, ensure_ascii=False, indent=1))
