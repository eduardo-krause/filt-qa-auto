# filt-qa-auto — testes automatizados do ERP Filt

Plugin do Claude Code com a skill **`/teste-tarefa`**: **valida uma tarefa NMTZ de ponta a ponta** — lê a tarefa, monta o plano (com casos de limite e negativos), executa os testes por uma **suíte que roda sozinha** no AT da tarefa (tudo pela tela, conferindo cada resultado no banco), analisa e gera o PDF com parecer. A suíte fica salva para os retestes.

**Para que serve:** retestar depois de um deploy ou de uma correção sem refazer tudo à mão. A suíte roda todos os casos e entrega a lista de quem passou e quem não passou; o julgamento (é bug? mudou a tela?) continua sendo de quem valida.

## Como funciona

```
suíte da tarefa (casos + esperado)  ──usa──▶  passos por tela (vendas/pedido.js, financeiro/baixa.js…)
            │                                              │
            └──────────── motor (executar.js) ◀────────────┘
                 login no AT · confere DF-e · roda os casos · confere no banco
                                      │
                         resultados/ultimo.md  +  índice por tela
```

| Peça | Onde | O que é |
|---|---|---|
| Motor | `skills/teste-automatizado-filt/motor/` | executa a suíte e grava o resultado |
| Passos | `skills/teste-automatizado-filt/passos/<área>/<tela>.js` | ações prontas por tela — reaproveitadas por todas as suítes |
| Suíte | `~/.claude/historico-validacoes/<NMTZ>/automacao/suite.js` | os casos de uma tarefa (fica na máquina de cada pessoa) |
| Resultado | `.../<NMTZ>/automacao/resultados/ultimo.md` | o que passou, o que falhou e a evidência |
| Regras do sistema | `skills/regras-sistema-filt/` | fluxos de tela e onde cada dado fica no banco (confirmados em teste) |
| Ferramentas | `skills/teste-automatizado-filt/ferramentas/` | tela para casos manuais e produção, consulta ao banco, DF-e, PDF, preparação da máquina |
| Índice | `~/.claude/historico-validacoes/indice-testes-automatizados.md` | todos os casos automatizados, agrupados por tela |

## Exemplo de resultado (ilustrativo — formato da saída, não é resultado real)

```
AT https://erp-homologacao-nmtz-00000… · base … · front 5018 · DF-e ok · 3 caso(s)
✅ OK        1-DUP  Duplicata 30/60: Pago só com todas as parcelas quitadas (412s)
✅ OK        5      Duas entregas de 1 un: Pago só com as 4 parcelas quitadas (538s)
❌ FALHOU    R01    Reprovação 01: Concluir da edição parcial recalcula a situação na hora (201s)
      ↳ pedido 999 ao concluir a remoção (sem reabrir): esperado {"PAGO":1,…}, obtido {"PAGO":0,…}
```

## Instalação

**Para a pessoa:** cole o link deste repositório no Claude Code e peça para instalar. O Claude faz o resto (inclusive tirar o plugin antigo `filt-qa`, se você tiver).

### Instruções para o Claude Code (quem recebeu este link)
Execute na ordem, sem pedir que a pessoa rode comando. Avise em uma linha o que vai fazer e siga.
1. **Adicionar o marketplace e instalar** (sempre pela URL HTTPS — o formato curto `eduardo-krause/filt-qa-auto` usa SSH e falha):
   ```
   claude plugin marketplace add https://github.com/eduardo-krause/filt-qa-auto.git
   claude plugin install filt-qa-auto@filt-qa-auto
   ```
   O repositório é **privado**: se der erro de autenticação ou "not found", a conta GitHub da pessoa precisa ter sido convidada como colaboradora (pedir ao mantenedor) e o Git precisa estar logado (`gh auth login` + `gh auth setup-git`, ou o login do Git Credential Manager na primeira vez). Se já existir o marketplace, só `claude plugin marketplace update filt-qa-auto`.
2. **Tirar o plugin antigo e agendar a atualização** — na pasta `ferramentas` do plugin instalado (`~/.claude/plugins/cache/filt-qa-auto/filt-qa-auto/<versão>/skills/teste-automatizado-filt/ferramentas`; no Linux/WSL use `python3`):
   ```
   python migrar_filt_qa.py
   ```
   Desinstala `filt-qa@filt-qa` e o marketplace `filt-qa`, apaga as tarefas agendadas antigas ("filt-qa - atualizar plugin", "filt-qa - enviar regras" / linhas do crontab), guarda os scripts delas e cópias locais antigas de skill em `~/.claude/filt-qa/_antigo-filt-qa/` e agenda **"filt-qa-auto - atualizar plugin"** (segunda 08:30). **Mantém** `~/.claude/filt-qa/config.json` (mesmo formato), `fluxos-novos.md` e `~/.claude/historico-validacoes/`. Sem o plugin antigo, só agenda a atualização.
3. **Preparar a máquina** — mesma pasta: `python configurar.py` e depois `python checar_config.py`, seguindo [`primeira-vez.md`](plugins/filt-qa-auto/skills/teste-automatizado-filt/referencias/primeira-vez.md) (instala Playwright/navegador/Node se faltar e pede **só** os dados pessoais que faltam — quem vinha do filt-qa já tem quase tudo). Depois `npm install` na pasta `motor/`.
4. **Encerrar:** pedir que a pessoa feche e abra o Claude Code (para sair a skill antiga `/validar-tarefa-filt` e entrar a nova) e dizer como usar: **`/teste-tarefa`** + chave da tarefa, URL do AT e base.

Nunca gravar CPF, senha ou dados de banco fora do `~/.claude/filt-qa/config.json` da própria pessoa.

## Segurança
- Só roda no **AT da própria tarefa**; produção e AT de outra demanda são bloqueados no login.
- **AT travado** (chamada sem resposta por mais de 60 s) → para tudo e avisa.
- **DF-e** conferido no início; com qualquer documento em produção, não roda.
- **Banco só leitura**; nada é gravado direto no banco. **Nada vai para o Jira.**

Detalhes de uso: [`SKILL.md`](plugins/filt-qa-auto/skills/teste-automatizado-filt/SKILL.md) · como escrever suíte e passo: [`escrever-suite.md`](plugins/filt-qa-auto/skills/teste-automatizado-filt/referencias/escrever-suite.md)
