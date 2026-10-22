"""Gera o relatório de validação (HTML + PDF) a partir de um JSON.
uso: python relatorio.py <dados.json> [saida.pdf]

Formato do JSON (campos marcados com ? são opcionais):
{
 "tarefa": "NMTZ-XXXX", "titulo": "...", "ambiente": "erp-homologacao-nmtz-XXXX", "base": "AT: nmtz-XXXX (CLIENTE_<id>)",
 "data": "dd/mm/aaaa",
 "parecer": {"aprovar": false, "texto": "resumo em linguagem simples: o que funcionou, o que reprovou e por quê"},
 "como_testado": ["...", "..."],
 "casos": [{
    "id": "1", "origem": "de onde vem a regra (ex.: Critério 3.1, Comentário PO 21/09, Reprovação 22/09)",
    "cenario": "o que foi testado, em linguagem simples",
    "esperado": "resultado esperado (com a conta, se houver)",
    "obtido": "resultado obtido",
    "status": "OK|FALHOU|BLOQUEADO|NÃO TESTÁVEL",
    "motivo?": "BLOQUEADO/NÃO TESTÁVEL: por que não foi executado",
    -- só para FALHOU (bloco "Por que reprovou"):
    "passos?": ["passo 1", "passo 2", ...],          # como reproduzir
    "impacto?": "o que isso causa para o usuário/cliente",
    "producao?": "Produção: igual/diferente/não conferido",
    "video?": "nome do vídeo (bug-da-tarefa-...)"
 }],
 "extras": [ mesmo formato — casos ADICIONADOS porque faltava validar (origem = motivo) ],
 "problemas": [{
    "titulo": "...", "gravidade": "Alta|Média|Baixa", "escopo": "da tarefa|fora da tarefa",
    "onde?": "rotina/tela", "passos?": [...], "esperado?": "...", "obtido?": "...", "impacto?": "...",
    "producao?": "...", "video?": "...", "descricao?": "texto livre (aceita HTML simples)"
 }],
 "pontos_po": ["..."]
}
Regra: parecer "aprovar" só é permitido com todos os casos da tarefa em OK. O PDF não leva prints.
"""
import html, json, os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
HOME = os.environ.get('FILT_QA_HOME') or os.path.join(os.path.expanduser('~'), '.claude', 'filt-qa')
_cfg = os.path.join(HOME, 'config.json')
if not os.path.exists(_cfg):  # compatibilidade com a instalação antiga (config dentro do skill)
    _cfg = os.path.join(AQUI, '..', 'config.json')
CFG = json.load(open(_cfg, encoding='utf8'))

# status técnico -> (rótulo para quem lê, cor, explicação da legenda)
STATUS = {
    'OK':           ('Passou',        '#2e8b3e', 'o sistema fez exatamente o esperado'),
    'FALHOU':       ('Reprovou',      '#c0392b', 'o sistema não fez o esperado — detalhes em "Por que reprovou"'),
    'BLOQUEADO':    ('Não executado', '#d68910', 'não deu para rodar (ambiente ou dependência fora); precisa reteste'),
    'NÃO TESTÁVEL': ('Não testável',  '#7f8c8d', 'não há como testar neste ambiente/dados; motivo informado'),
}

def esc(s):
    return html.escape(str(s or ''))

def badge(s):
    rot, cor, _ = STATUS.get(s, (s, '#555', ''))
    return f'<span class="bd" style="background:{cor}">{esc(rot)}</span>'

def tabela(casos):
    if not casos:
        return '<p class="vazio">Nenhum.</p>'
    linhas = []
    for c in casos:
        obtido = esc(c.get('obtido'))
        if c.get('status') in ('BLOQUEADO', 'NÃO TESTÁVEL') and c.get('motivo'):
            obtido += f'<div class="mot">Motivo: {esc(c.get("motivo"))}</div>'
        linhas.append(f"<tr class=\"st-{esc(c.get('status','')).replace(' ','_')}\"><td class=\"n\">{esc(c.get('id'))}</td><td class=\"org\">{esc(c.get('origem'))}</td>"
                      f"<td>{esc(c.get('cenario'))}</td><td>{esc(c.get('esperado'))}</td><td>{obtido}</td><td class=\"r\">{badge(c.get('status'))}</td></tr>")
    return ('<table><tr><th class="n">#</th><th class="org">Origem da regra</th><th>O que foi testado</th>'
            '<th>Resultado esperado</th><th>Resultado obtido</th><th class="r">Resultado</th></tr>' + ''.join(linhas) + '</table>')

def campo(rotulo, valor):
    if not valor:
        return ''
    if isinstance(valor, list):
        itens = ''.join(f'<li>{esc(v)}</li>' for v in valor)
        return f'<div class="cp"><b>{rotulo}</b><ol>{itens}</ol></div>'
    return f'<div class="cp"><b>{rotulo}</b> {esc(valor)}</div>'

def reprovados(casos):
    blocos = []
    for c in casos:
        if c.get('status') != 'FALHOU':
            continue
        n = len(blocos) + 1  # numeração 4.1, 4.2… para a pessoa apontar o item
        blocos.append(f"""<div class="rep"><h3>4.{n} · Caso {esc(c.get('id'))} — {esc(c.get('cenario'))}</h3>
{campo('Regra (origem):', c.get('origem'))}
{campo('O que era esperado:', c.get('esperado'))}
{campo('O que aconteceu:', c.get('obtido'))}
{campo('Como reproduzir:', c.get('passos'))}
{campo('Impacto:', c.get('impacto'))}
{campo('Produção:', c.get('producao'))}
{campo('Vídeo:', c.get('video'))}</div>""")
    return ''.join(blocos) or '<p class="vazio">Nenhum caso reprovado.</p>'

def nao_executados(casos):
    itens = [f"<li><b>Caso {esc(c.get('id'))}</b> ({STATUS[c['status']][0]}): {esc(c.get('cenario'))} — <i>{esc(c.get('motivo') or c.get('obtido'))}</i></li>"
             for c in casos if c.get('status') in ('BLOQUEADO', 'NÃO TESTÁVEL')]
    return f'<ul>{"".join(itens)}</ul>' if itens else ''

def problema(p, n=None):
    esc_ = (p.get('escopo') or 'da tarefa').lower()
    tag = '<span class="bd" style="background:#c0392b">Da tarefa</span>' if 'fora' not in esc_ else '<span class="bd" style="background:#607C90">Fora da tarefa</span>'
    grav = f' <span class="grav">Gravidade: {esc(p.get("gravidade"))}</span>' if p.get('gravidade') else ''
    corpo = (campo('Onde:', p.get('onde')) + campo('Como reproduzir:', p.get('passos')) + campo('Esperado:', p.get('esperado'))
             + campo('Obtido:', p.get('obtido')) + campo('Impacto:', p.get('impacto')) + campo('Produção:', p.get('producao'))
             + campo('Vídeo:', p.get('video')))
    desc = f'<div class="desc">{p.get("descricao")}</div>' if p.get('descricao') else ''
    num = f'5.{n} · ' if n else ''
    return f'<div class="bug"><h3>{num}{tag} {esc(p.get("titulo"))}{grav}</h3>{corpo}{desc}</div>'

CSS = """
@page{size:A4;margin:14mm 12mm}
body{font-family:Segoe UI,Arial,sans-serif;font-size:10.5pt;color:#1d2433;line-height:1.45}
h1{font-size:19pt;margin:0 0 2px} h2{font-size:13.5pt;border-bottom:2px solid #8cbf26;padding-bottom:3px;margin-top:22px}
h3{font-size:11pt;margin:2px 0 6px} .sub{color:#555;margin-bottom:10px}
.ver{padding:12px 16px;margin:12px 0 8px;font-size:11.5pt;border-left:7px solid;border-radius:4px}
.ver.nao{border-color:#c0392b;background:#fdecea} .ver.sim{border-color:#2e8b3e;background:#eaf7ec}
.ver .tit{font-size:14pt;font-weight:700;display:block;margin-bottom:4px}
.nums{display:flex;gap:8px;margin:8px 0 4px} .num{flex:1;border-radius:6px;padding:8px;text-align:center;color:#fff}
.num b{display:block;font-size:18pt;line-height:1.1} .num span{font-size:9pt}
.leg{font-size:8.8pt;color:#444;margin:6px 0 2px} .leg li{margin:1px 0}
table{border-collapse:collapse;width:100%;font-size:9pt;margin:6px 0} th,td{border:1px solid #ccd;padding:5px 6px;vertical-align:top}
th{background:#eef2e6;text-align:left} tr{page-break-inside:avoid}
td.n,th.n{width:26px;text-align:center} td.org,th.org{width:17%;color:#475C6B} td.r,th.r{width:78px;text-align:center}
tr.st-FALHOU td{background:#fff3f1} tr.st-BLOQUEADO td,tr.st-NÃO_TESTÁVEL td{background:#fbf8ef}
.bd{color:#fff;padding:2px 7px;border-radius:10px;font-weight:600;font-size:8.2pt;white-space:nowrap}
.mot{margin-top:3px;font-size:8.5pt;color:#7a5a00}
.rep{border:1px solid #e3b4ae;border-left:6px solid #c0392b;background:#fff8f7;padding:9px 13px;margin:9px 0;border-radius:4px;page-break-inside:avoid}
.bug{border:1px solid #d8dde3;background:#fafbfc;padding:9px 13px;margin:9px 0;border-radius:4px;page-break-inside:avoid}
.cp{margin:3px 0} .cp b{color:#33414D} .cp ol{margin:2px 0 2px 18px;padding:0}
.grav{font-size:9pt;color:#555;font-weight:400;margin-left:6px}
.obs{border:1px solid #e8d9a8;background:#fffbea;padding:8px 12px;margin:8px 0;border-radius:4px;page-break-inside:avoid}
.vazio{color:#777;font-style:italic} .res{font-size:10pt;margin:4px 0 8px}
"""

def main():
    dados = json.load(open(sys.argv[1], encoding='utf8'))
    casos = dados.get('casos', [])
    extras = dados.get('extras', [])
    todos = casos + extras
    cont = {s: sum(1 for c in casos if c.get('status') == s) for s in STATUS}
    todos_ok = bool(casos) and cont['OK'] == len(casos)
    par = dados.get('parecer', {})
    aprovar = bool(par.get('aprovar')) and todos_ok
    if par.get('aprovar') and not todos_ok:
        print('AVISO: parecer "aprovar" rebaixado — há casos da tarefa que não estão OK.')
    nums = ''.join(f'<div class="num" style="background:{STATUS[s][1]}"><b>{cont[s]}</b><span>{STATUS[s][0]}</span></div>' for s in STATUS)
    legenda = ''.join(f'<li>{badge(s)} {esc(STATUS[s][2])}</li>' for s in STATUS)
    probs = dados.get('problemas', [])
    da_tarefa = [p for p in probs if 'fora' not in (p.get('escopo') or '').lower()]
    fora = [p for p in probs if 'fora' in (p.get('escopo') or '').lower()]
    probs_html = ''.join(problema(p, i) for i, p in enumerate(da_tarefa + fora, 1)) or '<p class="vazio">Nenhum problema encontrado.</p>'
    po = ''.join(f'<div class="obs"><b>6.{i}</b> · {x}</div>' for i, x in enumerate(dados.get('pontos_po', []), 1)) or '<p class="vazio">Nenhum.</p>'
    ne = nao_executados(todos)
    H = f"""<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>{esc(dados['tarefa'])} - Relatório de Testes</title><style>{CSS}</style></head><body>
<h1>{esc(dados['tarefa'])} — Relatório de Testes</h1>
<div class="sub">{esc(dados.get('titulo'))}<br>Ambiente: {esc(dados.get('ambiente'))} · Base: {esc(dados.get('base'))} · Testado em {esc(dados.get('data'))}</div>
<div class="ver {'sim' if aprovar else 'nao'}"><span class="tit">{'✔ Pode aprovar' if aprovar else '✘ Não aprovar ainda'}</span>{esc(par.get('texto'))}</div>
<div class="res"><b>{len(casos)} {'caso' if len(casos) == 1 else 'casos'} de teste da tarefa</b>{(f' + {len(extras)} ' + ('caso adicionado' if len(extras) == 1 else 'casos adicionados')) if extras else ''}:</div>
<div class="nums">{nums}</div>
<ul class="leg">{legenda}</ul>
<h2>1. Como foi testado</h2><ul>{''.join(f'<li>{esc(x)}</li>' for x in dados.get('como_testado', []))}</ul>
<h2>2. Resultado de cada caso de teste</h2>{tabela(casos)}
<h2>3. Casos adicionados (faltavam na tarefa)</h2>{tabela(extras)}
<h2>4. Por que reprovou</h2>{reprovados(todos)}
{f'<h3>Casos que não puderam ser executados</h3>{ne}' if ne else ''}
<h2>5. Problemas encontrados</h2>
<p class="leg"><span class="bd" style="background:#c0392b">Da tarefa</span> precisa de correção nesta tarefa · <span class="bd" style="background:#607C90">Fora da tarefa</span> defeito de outra parte do sistema, só informativo</p>
{probs_html}
<h2>6. Pontos para confirmar com a PO</h2>{po}
</body></html>"""
    pasta = os.path.dirname(os.path.abspath(sys.argv[1]))
    arq_html = os.path.join(pasta, 'relatorio.html')
    open(arq_html, 'w', encoding='utf8').write(H)
    saida = sys.argv[2] if len(sys.argv) > 2 else os.path.join(CFG['saidaRelatorios'], f"{dados['tarefa']} - Relatorio de Testes.pdf")
    env = dict(os.environ, NODE_PATH=CFG['playwright']['nodeModules'])
    subprocess.run(['node', os.path.join(AQUI, 'topdf.js'), arq_html, saida], check=True, env=env)
    print('PDF:', saida)

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
