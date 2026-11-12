# Relatório (Passo 6)

Montar `<pastaTrabalho>/<tarefa>/dados.json` (formato no topo de `relatorio.py`: parecer, como_testado, casos, extras, problemas, pontos_po) e gerar. **O PDF não leva prints**: não montar seção de evidências. A evidência de bug é o passo a passo, a mensagem exata e os valores; vídeo só existe se a pessoa pediu (aí vai no campo `video`).
```bash
python relatorio.py ~/.claude/historico-validacoes/NMTZ-XXXX/dados.json      # PDF em Downloads
```
Parecer **APROVAR** só com todos os casos da tarefa em OK (o script rebaixa se não estiver). Status possíveis: OK, FALHOU, BLOQUEADO, NÃO TESTÁVEL. No PDF eles aparecem como "Passou", "Reprovou", "Não executado" e "Não testável".

**Escrever para quem não acompanhou o teste**: linguagem simples, sem jargão de banco quando não for preciso.
- `parecer.texto`: em 2 ou 3 frases, o que funcionou, o que reprovou e o que falta.
- `casos` = **todos** os casos do campo "Casos de testes" do Jira, com o id igual ao número dele ("01", "02"…) e origem "Caso de Teste NN do Jira"; `extras` = os adicionados (A1, A2…). Antes de gerar o PDF, conferir que `casos` tem a mesma quantidade de casos do campo.
- Cada caso: `origem` (de onde vem a regra: critério, comentário da PO, reprovação anterior, ADICIONADO + motivo), `cenario` (o que foi feito), `esperado` (com a conta) e `obtido`.
- **Caso FALHOU** — toda reprovação vai em `problemas` com `casos: ["<id>"]` (o caso que ela reprova) e um passo a passo **bem detalhado para a pessoa simular sozinha**: `onde` (caminho do menu), `preparacao` (dados/cadastros necessários, com nome e código), `passos` (um clique/campo/valor por passo, incluindo o que reparar na tela), `esperado`, `obtido`, `conferir` (tela, chamada de rede, banco), `impacto`, `producao` e, só se a pessoa pediu vídeo, `video`. Caso FALHOU sem item em `problemas` ainda vira bloco (gerado dos campos do caso), mas com aviso — evitar.
- **BLOQUEADO / NÃO TESTÁVEL** — preencher `motivo`.
- **Reprovações da tarefa** — título do problema "Reprovação <nn> - <explicação curta> (caso X)", numeração seguida do "Motivo Reprovação" do Jira, em ordem (vídeo `reprovação <n>.webm` só se pedido).
- **Seções e numeração** — 1 Como foi testado · 2 Casos de teste da tarefa (tabela: caso + título, esperado, obtido, Passou?) · 3 Casos adicionados · 4 Reprovações e problemas (4.1, 4.2…: primeiro as da tarefa, depois as de fora) · 5 Pontos para a PO (5.1…). Ao discutir o relatório com a pessoa, citar sempre esse número (ex.: "item 4.2").
- **Totais do topo** — os quadros contam todos os casos (tarefa + adicionados) e a linha acima mostra a soma separada; o parecer continua dependendo só dos casos da tarefa.
- **Problemas** — `escopo` ("da tarefa" / "fora da tarefa"), `gravidade`, `onde`, `passos`, `esperado`, `obtido`, `impacto`, `producao`, `video` (só se pedido).
Responder ao usuário com o resumo: parecer, o que falhou (com número/nota e conta), **todos os bugs encontrados — inclusive os fora da tarefa** —, pontos para a PO e o caminho do PDF.
