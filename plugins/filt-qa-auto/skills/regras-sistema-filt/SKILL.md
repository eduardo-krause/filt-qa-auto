---
name: regras-sistema-filt
description: Regras e fluxos do ERP Filt/Nimitz já confirmados em teste — passos de tela (login, nota fiscal, venda futura, CT-e, item, consultas, permissões, etiquetas), componentes de tela e onde cada dado fica no banco (custo/valor médio do item, nota fiscal, cartão a receber, certificado digital). Use ao validar uma tarefa, montar cenário de teste ou conferir dado no banco do Filt.
---

# Regras do sistema Filt

Conhecimento **confirmado funcionando** no sistema (executado pela tela e conferido no banco). Nada de hipótese.

Carregue só a referência da rotina que precisa:

| Referência | Conteúdo |
|---|---|
| `referencias/fluxos-de-tela.md` | Acesso/AT, componentes de tela (moeda, autocomplete, dropdown, obrigatórios), cadastro de item, nota de entrada, venda NF-e, venda futura, CT-e, consultas, grupo de usuários/permissões, etiquetas, onde conferir no banco |
| `referencias/custo-e-valores-do-item.md` | Tabelas de custo/valor do item, fórmula do valor de aquisição, rateio de CT-e (uma e várias notas), regras do valor aquisição médio |
| `referencias/nota-fiscal.md` | Entrada/saída em `NOTA_FISCAL` |
| `referencias/cartao-a-receber.md` | Onde ficam os títulos de cartão a receber |
| `referencias/certificado-digital.md` | Onde fica a configuração real de certificado |
| `referencias/apontamento-producao.md` | Produção Interna: rotas e menu, relatório (filtros obrigatórios, listagem/matérias-primas, export PDF/CSV), form do processo, casas decimais por unidade e cálculo do custo total |

## Quem pode alterar
Estas referências são **só leitura** no plugin instalado (nunca editar em `~/.claude/plugins/...`). Fluxo novo confirmado numa validação: anotar em `~/.claude/filt-qa/fluxos-novos.md`; o mantenedor integra nestas referências no repositório `filt-qa-auto` e publica uma versão nova.
