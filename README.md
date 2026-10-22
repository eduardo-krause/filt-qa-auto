# filt-qa-auto — testes automatizados do ERP Filt

Plugin do Claude Code com a skill **`/teste-automatizado-filt`**: **valida uma tarefa NMTZ de ponta a ponta** — lê a tarefa, monta o plano (com casos de limite e negativos), executa os testes por uma **suíte que roda sozinha** no AT da tarefa (tudo pela tela, conferindo cada resultado no banco), analisa e gera o PDF com parecer. A suíte fica salva para os retestes.

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
O plugin é **independente** (desde a v0.5.0 traz junto a skill `regras-sistema-filt`, os critérios de julgamento, as ferramentas de tela/banco e o gerador do PDF — o plugin `filt-qa` não é mais necessário).
1. No Claude Code: `/plugin marketplace add <URL deste repositório>` e `/plugin install filt-qa-auto@filt-qa-auto`.
2. Na primeira vez, a skill roda `ferramentas/configurar.py` (instala Playwright/navegador e cria `~/.claude/filt-qa/config.json`, pedindo só os dados pessoais) e `npm install` na pasta `motor/` (instala o `mysql2`).

## Segurança
- Só roda no **AT da própria tarefa**; produção e AT de outra demanda são bloqueados no login.
- **AT travado** (chamada sem resposta por mais de 60 s) → para tudo e avisa.
- **DF-e** conferido no início; com qualquer documento em produção, não roda.
- **Banco só leitura**; nada é gravado direto no banco. **Nada vai para o Jira.**

Detalhes de uso: [`SKILL.md`](plugins/filt-qa-auto/skills/teste-automatizado-filt/SKILL.md) · como escrever suíte e passo: [`escrever-suite.md`](plugins/filt-qa-auto/skills/teste-automatizado-filt/referencias/escrever-suite.md)
