"""Migra a máquina do plugin antigo filt-qa para o filt-qa-auto (roda uma vez; pode repetir sem problema).
uso: python migrar_filt_qa.py            -> faz a migração e imprime JSON {feito, mantido, avisos}
     python migrar_filt_qa.py --checar   -> só mostra o que seria feito (não muda nada)

O que faz:
 1. Desinstala o plugin filt-qa@filt-qa e remove o marketplace filt-qa (se existirem).
 2. Apaga as tarefas agendadas do plugin antigo ('filt-qa - atualizar plugin' e 'filt-qa - enviar regras'
    no Windows; linhas do crontab no Linux/WSL) e guarda os scripts delas em ~/.claude/filt-qa/_antigo-filt-qa/.
 3. Guarda em _antigo-filt-qa/ cópias locais antigas das skills (~/.claude/skills/validar-tarefa-filt etc.).
 4. Agenda a atualização semanal do filt-qa-auto (segunda 08:30 ou no próximo login).
 5. Grava ~/.claude/filt-qa/migracao-filt-qa-auto.json (o checar_config.py para de pedir a migração).
Mantém: config.json (mesmo formato e lugar), fluxos-novos.md, sessoes/ e ~/.claude/historico-validacoes/."""
import json, os, re, shutil, subprocess, sys, time
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

CHECAR = '--checar' in sys.argv
WIN = os.name == 'nt'
HOME = os.environ.get('FILT_QA_HOME') or os.path.join(os.path.expanduser('~'), '.claude', 'filt-qa')
ANTIGO = os.path.join(HOME, '_antigo-filt-qa')
MARCA = os.path.join(HOME, 'migracao-filt-qa-auto.json')
TAREFAS_ANTIGAS = ['filt-qa - atualizar plugin', 'filt-qa - enviar regras']
TAREFA_NOVA = 'filt-qa-auto - atualizar plugin'
SCRIPTS_ANTIGOS = ['atualizar-plugin.ps1', 'atualizar-plugin.sh', 'enviar-regras.ps1', 'enviar-regras.sh']
SKILLS_ANTIGAS = ['validar-tarefa-filt', 'regras-sistema-filt', 'compartilhar-regras', 'validar-tarefa']
feito, mantido, avisos = [], [], []


def run(cmd, shell=False):
    try:
        r = subprocess.run(cmd, shell=shell, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=180)
        return r.returncode, (r.stdout or '') + (r.stderr or '')
    except Exception as e:
        return 1, str(e)


def fazer(desc, func):
    if CHECAR:
        feito.append('(faria) ' + desc); return
    try:
        func(); feito.append(desc)
    except Exception as e:
        avisos.append(f'{desc}: {e}')


def guardar(origem):
    os.makedirs(ANTIGO, exist_ok=True)
    destino = os.path.join(ANTIGO, os.path.basename(origem))
    if os.path.exists(destino):
        destino += time.strftime('-%Y%m%d%H%M%S')
    shutil.move(origem, destino)


# 1. plugin e marketplace antigos
claude = shutil.which('claude')
if not claude:
    avisos.append('comando claude não encontrado no PATH: desinstalar à mão com /plugin (filt-qa@filt-qa e o marketplace filt-qa)')
else:
    _, lista = run([claude, 'plugin', 'list'])
    if re.search(r'filt-qa@filt-qa\b', lista):
        def desinstalar():
            c, s = run([claude, 'plugin', 'uninstall', 'filt-qa@filt-qa'])
            if c: raise RuntimeError(s.strip()[-300:])
        fazer('plugin filt-qa@filt-qa desinstalado', desinstalar)
    _, mkts = run([claude, 'plugin', 'marketplace', 'list'])
    if re.search(r'^\s*\S*\s*filt-qa\s*$', mkts, re.M):
        def remover_mkt():
            c, s = run([claude, 'plugin', 'marketplace', 'remove', 'filt-qa'])
            if c: raise RuntimeError(s.strip()[-300:])
        fazer('marketplace filt-qa removido', remover_mkt)
    if not re.search(r'filt-qa-auto@filt-qa-auto\b', lista):
        avisos.append('plugin filt-qa-auto não aparece instalado: rodar  claude plugin install filt-qa-auto@filt-qa-auto')

# 2. tarefas agendadas antigas
if WIN:
    for nome in TAREFAS_ANTIGAS:
        c, _ = run(['schtasks', '/Query', '/TN', nome])
        if c == 0:
            def apagar(n=nome):
                c2, s = run(['schtasks', '/Delete', '/TN', n, '/F'])
                if c2: raise RuntimeError(s.strip()[-300:])
            fazer(f'tarefa agendada "{nome}" apagada', apagar)
else:
    c, cron = run(['crontab', '-l'])
    if c == 0 and re.search(r'atualizar-plugin\.sh|enviar-regras|envio_automatico', cron):
        def limpar_cron():
            novas = [l for l in cron.splitlines() if not re.search(r'atualizar-plugin\.sh|enviar-regras|envio_automatico', l)]
            p = subprocess.run(['crontab', '-'], input='\n'.join(novas) + '\n', text=True, capture_output=True)
            if p.returncode: raise RuntimeError(p.stderr.strip())
        fazer('linhas do filt-qa antigo removidas do crontab', limpar_cron)

for arq in SCRIPTS_ANTIGOS:
    p = os.path.join(HOME, arq)
    if os.path.exists(p):
        fazer(f'{arq} guardado em _antigo-filt-qa/', lambda p=p: guardar(p))

# 3. cópias locais antigas das skills
pasta_skills = os.path.join(os.path.expanduser('~'), '.claude', 'skills')
for nome in SKILLS_ANTIGAS:
    p = os.path.join(pasta_skills, nome)
    if os.path.isdir(p):
        fazer(f'skill local antiga ~/.claude/skills/{nome} guardada em _antigo-filt-qa/', lambda p=p: guardar(p))

# 4. atualização semanal do filt-qa-auto
if WIN:
    c, _ = run(['schtasks', '/Query', '/TN', TAREFA_NOVA])
    if c != 0:
        def agendar_win():
            os.makedirs(HOME, exist_ok=True)
            runner = os.path.join(HOME, 'atualizar-filt-qa-auto.ps1')
            with open(runner, 'w', encoding='utf-8-sig') as f:
                f.write("$log = Join-Path $env:USERPROFILE '.claude\\filt-qa\\atualizacao.log'\n"
                        "function Log($m) { \"$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m\" | Out-File -FilePath $log -Append -Encoding utf8 }\n"
                        "try {\n"
                        "  $a = claude plugin marketplace update filt-qa-auto 2>&1 | Out-String\n"
                        "  $b = claude plugin update filt-qa-auto@filt-qa-auto 2>&1 | Out-String\n"
                        "  Log (\"ok: \" + ($a + ' ' + $b).Trim() -replace '\\s+', ' ')\n"
                        "} catch { Log \"ERRO: $($_.Exception.Message)\" }\n")
            ps = ("$acao = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \"" + runner + "\"';"
                  "$gat = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 8:30am;"
                  "$conf = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries;"
                  "Register-ScheduledTask -TaskName '" + TAREFA_NOVA + "' -Action $acao -Trigger $gat -Settings $conf "
                  "-Description 'Atualiza o plugin filt-qa-auto do Claude Code toda semana' -Force | Out-Null")
            c2, s = run(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps])
            if c2: raise RuntimeError(s.strip()[-300:])
        fazer(f'tarefa agendada "{TAREFA_NOVA}" criada (segunda 08:30 ou no próximo login)', agendar_win)
    else:
        mantido.append(f'tarefa "{TAREFA_NOVA}" já existia')
else:
    c, cron = run(['crontab', '-l'])
    cron = cron if c == 0 else ''
    if 'atualizar-filt-qa-auto.sh' not in cron:
        def agendar_cron():
            os.makedirs(HOME, exist_ok=True)
            runner = os.path.join(HOME, 'atualizar-filt-qa-auto.sh')
            dir_claude = os.path.dirname(claude) if claude else ''
            with open(runner, 'w', encoding='utf-8') as f:
                f.write('#!/usr/bin/env bash\n'
                        f'export PATH="{dir_claude}:$PATH"\n'
                        'echo "$(date \'+%F %T\')  $(claude plugin marketplace update filt-qa-auto 2>&1 | tr \'\\n\' \' \') '
                        '$(claude plugin update filt-qa-auto@filt-qa-auto 2>&1 | tr \'\\n\' \' \')" >> "$HOME/.claude/filt-qa/atualizacao.log"\n')
            os.chmod(runner, 0o755)
            linhas = [l for l in cron.splitlines() if l.strip()] + [f'30 8 * * 1 {runner}']
            p = subprocess.run(['crontab', '-'], input='\n'.join(linhas) + '\n', text=True, capture_output=True)
            if p.returncode: raise RuntimeError(p.stderr.strip())
            if run(['pgrep', '-x', 'cron'])[0] and run(['pgrep', '-x', 'crond'])[0]:
                avisos.append('serviço cron parado (comum no WSL): as atualizações chegam também ao abrir o Claude Code')
        fazer('atualização semanal do filt-qa-auto agendada no crontab (segunda 08:30)', agendar_cron)
    else:
        mantido.append('linha do filt-qa-auto no crontab já existia')

# 5. o que fica
for nome in ['config.json', 'fluxos-novos.md', 'sessoes']:
    if os.path.exists(os.path.join(HOME, nome)):
        mantido.append(f'~/.claude/filt-qa/{nome}')
if os.path.isdir(os.path.join(os.path.expanduser('~'), '.claude', 'historico-validacoes')):
    mantido.append('~/.claude/historico-validacoes/')

if not CHECAR and not [a for a in avisos if 'filt-qa-auto não aparece' not in a]:
    os.makedirs(HOME, exist_ok=True)
    with open(MARCA, 'w', encoding='utf-8') as f:
        json.dump({'data': time.strftime('%Y-%m-%d %H:%M'), 'feito': feito}, f, ensure_ascii=False, indent=1)

print(json.dumps({'ok': not avisos, 'checar': CHECAR, 'feito': feito, 'mantido': mantido, 'avisos': avisos,
                  'reiniciar_claude': bool([f for f in feito if 'plugin' in f and not f.startswith('(faria)')])},
                 ensure_ascii=False, indent=1))
