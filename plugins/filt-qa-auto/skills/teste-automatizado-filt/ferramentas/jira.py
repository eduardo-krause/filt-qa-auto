"""Leitura do Jira pela API REST — SOMENTE LEITURA (só GET; regra 5: nada no Jira).
Gasta ~10x menos contexto que o getJiraIssue do conector MCP (texto limpo, só os campos da validação).

  python jira.py NMTZ-XXXX                      -> resumo, status, descrição, Casos de testes, Plano de Testes,
                                                   Motivo Reprovação, comentários, links, anexos, histórico de status
  python jira.py NMTZ-XXXX dev                  -> branches e PRs por repositório (diz se a tarefa mexeu no app e/ou backend)
  python jira.py NMTZ-XXXX campo customfield_N  -> um campo só, em texto
  python jira.py NMTZ-XXXX anexo <nome> <pasta> -> baixa um anexo para a pasta

Credenciais em config.json → jira: { email, token } (token: id.atlassian.com › Segurança › Tokens de API).
Sem token configurado: usar o conector MCP (getJiraIssue), como antes.
"""
import base64, json, os, sys, urllib.parse, urllib.request

HOME = os.environ.get('FILT_QA_HOME') or os.path.join(os.path.expanduser('~'), '.claude', 'filt-qa')
CFG = json.load(open(os.path.join(HOME, 'config.json'), encoding='utf8')).get('jira') or {}
BASE = (CFG.get('url') or 'https://nimitz.atlassian.net').rstrip('/')
CAMPOS = {'customfield_10050': 'CASOS DE TESTES', 'customfield_10049': 'PLANO DE TESTES'}


def auth():
    email, tok = CFG.get('email'), CFG.get('token')
    if not email or not tok or '<' in tok:
        raise SystemExit('SEM TOKEN: preencher jira.email e jira.token no config.json (ou usar o conector MCP).')
    return 'Basic ' + base64.b64encode(f'{email}:{tok}'.encode()).decode()


def get(path, cru=False):
    req = urllib.request.Request(BASE + path, headers={'Authorization': auth(), 'Accept': 'application/json'}, method='GET')
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read() if cru else json.load(r)


def adf(n):
    """Documento ADF do Jira -> texto (markdown leve)."""
    if n is None: return ''
    if isinstance(n, str): return n
    if isinstance(n, list): return ''.join(adf(x) for x in n)
    t = n.get('type'); c = ''.join(adf(x) for x in n.get('content', []) or [])
    if t == 'text':
        s = n.get('text', '')
        return f'**{s}**' if any(m.get('type') == 'strong' for m in n.get('marks', []) or []) else s
    if t == 'hardBreak': return '\n'
    if t == 'heading': return '\n' + '#' * n.get('attrs', {}).get('level', 2) + ' ' + c + '\n'
    if t == 'listItem': return '- ' + c.strip() + '\n'
    if t == 'paragraph': return c + '\n'
    if t in ('tableCell', 'tableHeader'): return c.strip() + ' | '
    if t == 'tableRow': return '| ' + c + '\n'
    if t in ('mention', 'emoji'): return n.get('attrs', {}).get('text', '')
    if t in ('inlineCard', 'blockCard'): return n.get('attrs', {}).get('url', '')
    if t in ('media', 'mediaSingle', 'mediaGroup'): return c or '[imagem]'
    if t == 'codeBlock': return '```\n' + c + '\n```\n'
    return c


def valor(v):
    if isinstance(v, dict) and v.get('type') == 'doc': return adf(v).strip()
    if isinstance(v, dict): return v.get('value') or v.get('name') or json.dumps(v, ensure_ascii=False)
    if isinstance(v, list): return ', '.join(valor(x) for x in v)
    return '' if v is None else str(v)


def dev(k):
    iid = get(f'/rest/api/3/issue/{k}?fields=summary')['id']
    d = get(f'/rest/dev-status/latest/issue/detail?issueId={iid}&applicationType=bitbucket&dataType=branch')
    repos = set()
    for det in d.get('detail', []):
        for b in det.get('branches', []):
            repos.add(b['repository']['name'].split('/')[-1]); print('BRANCH', b['repository']['name'], b['name'])
        for p in det.get('pullRequests', []): print('PR', p.get('repositoryName'), p.get('status'), p.get('name'))
    app = sorted(r for r in repos if r in ('nimitz_pedido_mobile', 'produtor_rural_mobile'))
    print('APP alterado:', ', '.join(app) or 'não', '| backend alterado:', 'sim' if repos - set(app) else 'não')
    return repos


def tarefa(k):
    nomes = {i['id']: i['name'] for i in get('/rest/api/3/field')}
    motivo = next((i for i, n in nomes.items() if n.strip().lower().startswith('motivo reprova')), None)
    fs = ['summary', 'status', 'description', *CAMPOS, 'comment', 'issuelinks', 'attachment'] + ([motivo] if motivo else [])
    d = get(f'/rest/api/3/issue/{k}?fields={",".join(fs)}&expand=changelog')
    f = d['fields']
    print('#', k, '-', f['summary']); print('Status:', f['status']['name'])
    print('\n===== DESCRIÇÃO =====\n' + adf(f.get('description')).strip())
    for c, nome in CAMPOS.items(): print(f'\n===== {nome} =====\n' + (valor(f.get(c)) or '(vazio)'))
    if motivo: print('\n===== MOTIVO REPROVAÇÃO =====\n' + (valor(f.get(motivo)) or '(vazio)'))
    print('\n===== COMENTÁRIOS =====')
    for c in f['comment']['comments']: print(f"[{c['created'][:16]}] {c['author']['displayName']}: {adf(c['body']).strip()}\n")
    print('===== LINKS =====')
    for l in f['issuelinks']:
        o = l.get('outwardIssue') or l.get('inwardIssue')
        print(l['type']['name'], o['key'], o['fields']['summary'], '-', o['fields']['status']['name'])
    print('\n===== ANEXOS =====')
    for a in f['attachment']: print(a['filename'], a['size'], 'bytes')
    print('\n===== HISTÓRICO (status / reprovação) =====')
    for h in d['changelog']['histories']:
        for i in h['items']:
            if i['field'].lower().startswith(('status', 'motivo')):
                print(h['created'][:16], i['field'], ':', (i.get('fromString') or '')[:200], '->', (i.get('toString') or '')[:500])


def anexo(k, nome, pasta):
    f = get(f'/rest/api/3/issue/{k}?fields=attachment')['fields']['attachment']
    a = next((x for x in f if x['filename'] == nome), None)
    if not a: raise SystemExit('anexo não encontrado: ' + nome)
    os.makedirs(pasta, exist_ok=True); destino = os.path.join(pasta, nome)
    open(destino, 'wb').write(get(urllib.parse.urlparse(a['content']).path, cru=True)); print(destino)


def main():
    if len(sys.argv) < 2: print(__doc__); return
    sys.stdout.reconfigure(encoding='utf-8')
    k, modo = sys.argv[1].upper(), (sys.argv[2] if len(sys.argv) > 2 else '')
    if modo == 'dev': dev(k)
    elif modo == 'campo': print(valor(get(f'/rest/api/3/issue/{k}?fields={sys.argv[3]}')['fields'].get(sys.argv[3])))
    elif modo == 'anexo': anexo(k, sys.argv[3], sys.argv[4])
    else: tarefa(k)


if __name__ == '__main__':
    main()
