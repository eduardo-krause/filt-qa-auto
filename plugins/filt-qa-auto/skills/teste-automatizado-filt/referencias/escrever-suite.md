# Como escrever uma suíte e um passo

## Suíte (`<NMTZ>/automacao/suite.js`)
Um arquivo JS que exporta:

```js
module.exports = {
  tarefa: 'NMTZ-12345',
  titulo: 'Resumo da tarefa',
  at: { url: 'https://erp-homologacao-nmtz-12345.viasoftcloud.com.br', base: 'AT: nmtz-12345' },
  dados: { cliente: '...', item: '...' },     // tudo que é da base fica aqui, num lugar só
  casos: [
    {
      id: '1',                                 // único; use o número do caso da tarefa (R01 para reprovação, A1 para adicionado)
      titulo: 'O que o caso prova, em uma frase',
      origem: 'Caso de Teste 01 / Critério 4.1',
      telas: ['Pedido Venda', 'Faturamento'],  // nome do ITEM DO MENU — é o que monta o índice por tela
      esperado: 'Resultado esperado em texto, com os números',
      depende: '0',                             // opcional: usa dado de outro caso (t.de('0')); se ele não der OK, este fica PULADO
      async executar(t) { ... },
    },
  ],
};
```

### O que o caso recebe (`t`)
| Uso | Para quê |
|---|---|
| `await t.passos.vendas.pedido.criar({...})` | ações prontas (`passos/<área>/<tela>.js`). Cada chamada vira um passo no resultado |
| `t.confere('descrição', obtido, esperado)` | conferência. Diferente → caso FALHOU e para. `{ continuar: true }` registra e segue |
| `await t.confereBanco('descr.', sql, [params], { COLUNA: valor })` | confere a 1ª linha da consulta |
| `await t.banco.linha(sql, params)` / `consultar` / `valor` | leitura no banco do AT (só leitura) |
| `t.guardar('pedido', 123)` / `t.de('1').pedido` | passar dado criado de um caso para outro |
| `t.anotar('texto')` | observação que aparece no resultado (ex.: bug fora da tarefa percebido no caminho) |
| `t.hoje()` / `t.hoje(30)` | data dd/mm/aaaa (hoje / daqui a 30 dias) |
| `await t.passo('descrição', async () => {...})` | bloco próprio registrado como passo |
| `t.p`, `t.tela` | página do Playwright e ajudantes de tela, para algo bem específico |

### Casos de limite e negativos (obrigatórios)
Além dos casos da tarefa, toda suíte leva uma seção **"ADICIONADO — limites/negativos"** em volta de cada valor ou quantidade que a tarefa mexe. Bug achado aqui conta, mesmo fora do escopo (vai como "fora da tarefa"):
- **reduzir abaixo do que já foi lançado** (ex.: quantidade/valor do pedido abaixo da antecipação vinculada; cancelar abaixo do faturado);
- **passar do saldo** (antecipar mais que o saldo, entregar/devolver/cancelar mais que o disponível);
- **ordem inversa ou repetida** (vincular antes de faturar e depois; estornar e baixar de novo; concluir duas vezes);
- **editar depois** de faturar, antecipar, cancelar.

Para cada um, conferir no banco que a validação barra **antes de gravar**: ação que grava na hora (ex.: Remover item na edição) e só é barrada no Concluir deixa o registro inconsistente — isso é bug.

### Todo caso precisa de conferência
O motor só dá **OK** se o caso registrou **pelo menos uma** conferência (`t.confere` / `t.confereBanco`, na suíte ou dentro de um passo) e todas bateram. Caso que termina sem nenhuma vira **ERRO** ("nenhuma conferência registrada"): só navegar sem erro não comprova o esperado.

Bloqueio esperado (o sistema tem que barrar) se comprova pela **mensagem** e pelo **banco**, nunca só por "deu erro": um erro qualquer (timeout, campo não achado) não prova que a regra funcionou.
```js
let msg = '';
try { await t.passos.vendas.pedido.concluir({ pedido }); } catch (e) { msg = e.message; }
msg += ' ' + (await t.tela.toasts(t.p)).join(' ');
t.confere('mensagem de bloqueio', msg, /quantidade.*menor.*antecipad/i);
await t.confereBanco('pedido não gravou', 'SELECT QTDE FROM ... WHERE ID = ?', [pedido], { QTDE: qtdeAntes });
```

### Boas práticas
- **Cada caso cria o próprio dado** (pedido, nota, adiantamento). Só use `depende` quando o caso da tarefa é uma continuação (ex.: "editar o pedido do caso 1").
- **Conferir no banco a cada etapa** que o caso descreve (ex.: "A pagar com 1/2 quitada" e "Pago com 2/2"), não só no fim.
- **Ler o banco logo depois da ação, sem reabrir a tela**, quando o bug é "só atualiza ao reabrir" — abrir a tela pode recalcular e esconder o bug.
- Valores esperados **calculados** no `esperado` e nas conferências (ex.: 500 − 200 − 100 = 200).
- Nada de esperas fixas: os passos usam `t.tela.pronto()` (espera as chamadas de API terminarem).
- Caso que não dá para automatizar (layout, impressão física, conferência visual): deixe na suíte com `manual: 'motivo'` e sem `executar` — ele aparece no resultado como PULADO com o motivo, para não sumir da lista.

## Passo (`passos/<área>/<tela>.js`)
Um arquivo por **tela** (item de menu), com comentário no topo dizendo a tela e a rota. Cada função recebe `(t, args)`:

```js
// Tela: Processos › Vendas › Pedido Venda (/vendas/pedido)
module.exports = {
  // O que faz. args: { pedido, quantidades:[2], casas }  → devolve { ... }
  async ordemEntrega(t, { pedido, quantidades, casas = 0 }) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/carrinho?id=' + pedido);
    await tela.botao(p, 'Adicionar', { noDialogo: false });
    ...
  },
};
```

Regras do passo:
- **Genérico**: nada de nome de base, cliente, CPF ou número de tarefa (o plugin é compartilhado). Dado vem pelos `args`.
- Use os ajudantes de `motor/lib/tela.js` (`botao`, `autocomplete`, `digitar`, `qtd`, `moeda`, `data`, `menuKebab`, `confirmar`, `salvar`, `pronto`).
- **Rotas e ids de campo: conferir no código-fonte do Filt** (disco Z:, front em `nimitz\packages\nimitz\src\app\...`, ex.: `vendas\vendas.routing.module.ts`) em vez de tentar pela tela. Se o Z: não aparecer montado, o caminho de rede dele está em `net use`.
- Quando a ação cria algo, devolva o identificador lido **do banco** (número do pedido, nota, título), não só o que a tela mostrou.
- Erro claro: `throw new Error('pedido 123 não aparece no FATURAMENTO')` — a mensagem vai para o resultado.
- Ação que gera documento fiscal: chame `t.tela.exigirDfe()` antes.

## Primeira execução de um passo novo
Passo novo **sempre** roda primeiro com um caso só (`--casos X`), acompanhando o resultado. Se der ERRO por tela diferente do esperado, ver a evidência (texto) e, se ainda não bastar, abrir uma imagem da tela uma vez para entender — e corrigir o passo.
