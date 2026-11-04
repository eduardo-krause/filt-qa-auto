"""Gera o APK do app (Jenkins Flutter_Android), baixa e instala no emulador/celular.
  python apk.py NMTZ-XXXX [nimitz_pedido_mobile|produtor_rural_mobile] [--sem-instalar]

Parâmetros do build (manual "Utilizando o build do app"), decididos pelos repositórios da tarefa (jira.py dev):
  BRANCH  = NMTZ-XXXX se a tarefa alterou o app, senão master
  FLAVOR  = NMTZ-XXXX se a tarefa alterou backend, senão homolog
  DESTINO = apk SEMPRE (play_store_* publica na loja: proibido)
O build manda status sozinho para o painel "Desenvolvimento" da tarefa no Jira (é do pipeline; não é comentário).
Credenciais em config.json → jenkins: { url, usuario, token } (token: Jenkins › seu nome › Security › API Token).
"""
import base64, json, os, subprocess, sys, time, urllib.parse, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
HOME = os.environ.get('FILT_QA_HOME') or os.path.join(os.path.expanduser('~'), '.claude', 'filt-qa')
CFG = json.load(open(os.path.join(HOME, 'config.json'), encoding='utf8')).get('jenkins') or {}
JOB = (CFG.get('url') or 'https://jarvis.viasoftcloud.com.br').rstrip('/') + '/job/Nimitz/job/Mobile/job/Flutter_Android'
APPS = ('nimitz_pedido_mobile', 'produtor_rural_mobile')
ADB = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Android', 'Sdk', 'platform-tools', 'adb.exe')


def req(url, dados=None, cru=False):
    if not CFG.get('usuario') or not CFG.get('token') or '<' in CFG['token']:
        raise SystemExit('SEM TOKEN: preencher jenkins.usuario e jenkins.token no config.json.')
    h = {'Authorization': 'Basic ' + base64.b64encode(f"{CFG['usuario']}:{CFG['token']}".encode()).decode()}
    r = urllib.request.urlopen(urllib.request.Request(url, data=dados, headers=h, method='POST' if dados else 'GET'), timeout=120)
    return r if cru else json.load(r)


def main():
    if len(sys.argv) < 2: print(__doc__); return
    sys.stdout.reconfigure(encoding='utf-8')
    k = sys.argv[1].upper()
    app = next((a for a in sys.argv[2:] if a in APPS), 'nimitz_pedido_mobile')
    sys.path.insert(0, AQUI); import jira
    repos = jira.dev(k)
    p = {'REPOSITORIO': app, 'BRANCH': k if app in repos else 'master',
         'FLAVOR': k if repos - set(APPS) else 'homolog', 'DESTINO': 'apk'}
    print('parâmetros:', p)
    fila = req(JOB + '/buildWithParameters', urllib.parse.urlencode(p).encode(), cru=True).headers['Location']
    while True:
        b = (req(fila + 'api/json').get('executable') or {}).get('url')
        if b: break
        time.sleep(6)
    print('build:', b)
    while True:
        d = req(b + 'api/json?tree=building,result,artifacts%5BrelativePath%5D')
        if not d['building']: break
        time.sleep(30)
    if d['result'] != 'SUCCESS' or not d['artifacts']:
        log = req(b + 'consoleText', cru=True).read().decode('utf8', 'replace').splitlines()
        print('FALHOU:', d['result']); print('\n'.join(l for l in log if 'ERROR' in l)[:2000]); sys.exit(1)
    pasta = os.path.join(os.path.expanduser('~'), 'Downloads', 'apk-' + k); os.makedirs(pasta, exist_ok=True)
    arq = os.path.join(pasta, f"{app}-{b.rstrip('/').split('/')[-1]}.apk")
    open(arq, 'wb').write(req(b + 'artifact/' + d['artifacts'][0]['relativePath'], cru=True).read())
    print('apk:', arq)
    if '--sem-instalar' not in sys.argv:
        print(subprocess.run([ADB, 'install', '-r', arq], capture_output=True, text=True).stdout.strip())


if __name__ == '__main__':
    main()
