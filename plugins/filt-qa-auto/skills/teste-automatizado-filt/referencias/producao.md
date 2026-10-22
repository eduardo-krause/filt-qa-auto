# Comparar com produção (quando houver dúvida se é regressão)
Produção: `config.json` → `producao.url`. **Só as bases de teste da própria pessoa**, listadas em `producao.basesTeste` (a principal também em `producao.empresa`, usada pelo `login`), mesmos usuários.
```bash
node run.js login '{"tarefa":"NMTZ-XXXX","ambiente":"producao"}'
node run.js abrir '{"rota":"/..."}'  /  node run.js retrato '{}'
node run.js login '{"tarefa":"NMTZ-XXXX","url":"<URL do AT>","base":"<base informada>"}'   # voltar para o AT
```
- Uso: ver se o comportamento estranho do AT **já acontece em produção** (então "já era assim", não regressão da tarefa) ou não (regressão). Registrar no relatório em cada bug: "Produção: igual/diferente".
- **Bases de teste liberadas em produção** (`producao.basesTeste`): nelas pode tudo **pela tela** (cadastrar, lançar, emitir, cancelar, excluir) sem pedir; **nunca escrita direta no banco de produção**; nunca base de cliente nem base fora da lista.
- Antes de emitir: DF-e não pode estar em `PRODUCAO` — base com banco liberado (`producao.db.banco`): `python checar_dfe.py --producao`; demais bases: `node run.js checar_dfe_tela '{}'`. Sem isso o `salvar` bloqueia.
- Login em produção: `node run.js login '{"tarefa":"NMTZ-XXXX","ambiente":"producao"}'` entra na base de `producao.empresa`; para outra base da lista, passar `"base":"<nome exato de producao.basesTeste>"`. Base fora da lista é recusada.
- Banco de produção somente leitura e só do banco em `producao.db.banco`: `python db.py --producao "select ..."`. O script bloqueia escrita e outros bancos.
- Na tela de nota em produção, digitar quantidade e valor devagar (Ctrl+A e teclas com intervalo) e escolher o local de estoque **antes** da quantidade — senão o botão Adicionar do item fica desabilitado.
- Conferir antes se a tarefa já está publicada em produção; se não estiver, produção mostra o comportamento anterior à tarefa.
