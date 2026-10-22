# Layout, Figma e Design System

Ler quando a tarefa cria ou altera tela/componente.

## Critérios de layout (o que reprova)
- **Hyperlinks dos campos:** testar sempre **preenchido** (abre o cadastro do registro, `/rota/form?id=<id>`) e **vazio** (abre a listagem). Conferir o `href` e a nova aba.
- **Caixa de texto (Title/Sentence case) reprova mesmo igual ao protótipo:** título de página e menu em Title Case (palavras de ligação minúsculas); todo o resto em Sentence case. Conferir **todos** os textos da tela da tarefa (título, rótulos, placeholders, cabeçalhos de coluna, botões).
- **Campo que não se aplica tem que parecer desabilitado** (fundo cinza do DS), não basta a classe `p-disabled`. Comparar lado a lado registros com e sem o dado.
- **Layout só em resoluções reais de desktop:** 1200, 1440, 1600 e 1920 de largura. Nunca mobile/tablet. Rolagem lateral que permite chegar em tudo não é bug; só reprovar conteúdo inacessível ou quebrado. O `run.js` volta o viewport a cada chamada — redimensionar, recarregar e medir no mesmo passo.

## Validação de layout (telas da tarefa)
- Fonte da verdade: **protótipo do Figma** da tarefa (link na descrição/comentários do Jira ou informado pela pessoa) + **Design System do Figma** (regras em "Regras do Design System" abaixo).
- Para cada tela/componente alterado pela tarefa: comparar com o frame do protótipo pela saída em texto do `retrato` (print só se a pessoa pedir) — textos/rótulos, ordem e agrupamento dos campos, componentes usados, cores, tipografia, espaçamentos, estados (vazio, erro, carregando, desabilitado), responsividade quando o protótipo tiver.
- Sem protótipo para a tela da tarefa → validar só contra o Design System e registrar "sem protótipo".
- Protótipo inconsistente (contra o Design System, a regra de negócio ou outra tela) → registrar em "Pontos para confirmar com a PO", não como falha do dev.
- Cada divergência entra como caso no relatório (evidência: o que a tela mostra × o que o frame pede).

## Como abrir o Figma (somente leitura — nunca editar)
- Login: `config.json` → `figma` (conta da equipe Filt). A equipe está em modo **somente visualização**.
- O Figma **bloqueia navegador headless** (erro 403) — abrir no **Google Chrome instalado**, janela visível (Playwright `channel:'chrome'`, `headless:false`, perfil próprio). Avisar a pessoa que vai aparecer uma janela e para não mexer nela.
- Fechar modais iniciais ("Continuar", Esc) antes de clicar; trocar página pelo nome no painel "Páginas" (clique com `force`); `Shift+1` = ver tudo, `Shift+2` = zoom na seleção (selecionar a camada no painel "Camadas").
- Arquivos: **Design System - Filt v1.0.6** `https://www.figma.com/design/iZD8bri5DprcBQ4vAbdESM/`; protótipos por rotina (ex.: Consulta Estoque/Movimentação = `https://www.figma.com/design/NOf0Pv48EN5cCkgKx2ht2Y/`, páginas "Componentes"/"Telas"). O link do protótipo da tarefa costuma estar no Jira.
- Protótipos podem ter **várias versões da mesma tela** (frames antigos e novos lado a lado) — confirmar qual é a vigente (a mais recente / marcada "Ready for Dev") antes de apontar divergência.

## Regras do Design System (Figma "Design System - Filt v1.0.6")
**Escrita (Tipografia):**
- **Title Case** (Cada Palavra Maiúscula) **só nos nomes das rotinas** — no cabeçalho/título da página e no menu (nav bar). Ex.: "Consulta Estoque/Movimentação". **Palavras de ligação ficam minúsculas** (de, da, do, das, dos, e, em, para, com, a, o...): "Configuração de Etiquetas". O critério do Jira às vezes vem em sentence case — para título de página vale esta regra.
- **Hyperlinks dos campos** (ícone de link ao lado do rótulo / `app-cadastrorapido`): sempre testar **preenchido** → abre o **cadastro do registro selecionado** (`/rota/form?id=<id>`, padrão do sistema, ex.: Matriz/Filial › Grupo Empresarial) e **vazio** → abre a listagem (`/rota?`). Conferir o `href` e a nova aba — "abrir a rotina certa" não basta.
- **Permissões**: validar pela tela (botão/ícone/menu some; rota direta cai em `/401`). API aceitar chamada direta sem permissão não é reprovação — sem botão o usuário não aciona.
- **Sentence case** (só a 1ª letra maiúscula) em **todo o resto**: títulos de modais e cards, subtítulos, rótulos, parágrafos, legendas, botões.
- Fonte **Inter**. Escala: Header 1 Bold 36/44 · Header 2 Bold 24/29 · Header 3 Bold 20/24 · Header 4 Bold 16/19 · Header 5 Bold 14/17 · Header 6 Bold 12/15 · paragraph Regular 14/150% · subtitle Regular 11/120%.

**Cores (tokens):**
- Marca (verde-limão): brand-100 `#C4F206` · brand-200 `#9DD600` · brand-300 `#8EC200` · brand-400 `#78A300`.
- Cinzas: gray-300 `#92A9B9` · 400 `#607C90` · 500 `#475C6B` · 600 `#3D4E5C` · 700 `#33414D` · 750 `#2D3943` · 800 `#29343D` · 850 `#252F37` · 900 `#1F272E` · 950 `#181E23` · 1000 `#121619`. Fundo claro das telas `#F4F8FB`.
- Cores de apoio/feedback por família (red, yellow, mint/verde-água, blue, purple, pink) com escalas 100–1000; feedback: sucesso (mint), erro (red), info (blue), alerta (yellow). Há tokens semânticos (fundo, texto, botão, borda, feedback, gráficos) e tema **claro e escuro**.
- Estilos globais: texto `heading`/`body`; cores `color-fade-brand`, `color-fade-ia` (roxo, exclusivo do Filt IA+); efeito `elevation`; grades `Filt - Large`/`Filt - Small`.

**Componentes (usar os do DS, com seus estados):**
- **Botões**: primário (verde marca, texto escuro), secundário (contorno), terciário/texto (sem borda) e perigo (vermelho); estados padrão / hover (tom mais escuro) / pressionado / **desabilitado (esmaecido)**; 3 tamanhos; botões só-ícone nos mesmos estilos.
- **Cabeçalho da tela (header)**: ícone da rotina + **nome da rotina** (Title Case) à esquerda; à direita botão primário "Novo", botão ícone de **filtro** e menu **⋮**. Na tela de cadastro: seta **←** voltar + nome + badge do código + botão "Salvar" + ⋮.
- **Accordion** para seções (título em negrito, seta › fechado / ⌄ aberto).
- **Campos/Inputs**: rótulo acima (com `*` se obrigatório), placeholder; estados padrão / **erro (borda vermelha + mensagem abaixo)** / foco (borda verde) / desabilitado (fundo cinza); tipos texto/número, text-area com contador, dropdown (simples, múltiplo com chips, com busca, com ícone), checkbox, radio, switch, calendário.
- **Tabelas**: cabeçalho cinza com títulos em negrito e ícone de ordenação ⇅; linhas zebradas; coluna **"Ações"** à direita com ⋮, editar ✎ e excluir 🗑; rodapé com "1 - 9 de 9", paginação ‹‹ ‹ 1 › ›› e "Linhas por página"; legenda de status opcional no rodapé.
- **Filtro**: painel lateral "Filtro" com ✕, campos empilhados, grupos com subtítulo (ex.: "Período de inclusão"), botões **Limpar** (secundário) e **Filtrar** (primário) no fim.
- **Feedback**: toast (sucesso verde-água, erro vermelho, info azul, alerta amarelo, com ✕); tooltip escuro; dialog (título + texto + Cancelar/Confirmar); dialog-status (legenda de status); status-fixed (faixa fixa com ícone, texto e "Detalhes"); modal (cabeçalho, corpo, rodapé com Cancelar + ação primária).
- **Badge**: pílula colorida com texto ("status") ou ponto colorido + texto, nas cores de apoio.
- **Empty state**: ilustração cinza-azulada + mensagem (ex.: "Realize uma pesquisa para visualizar os itens.").
- **Menus**: menu lateral só com ícones + top menu (empresa/filial à esquerda; sino de notificações, ajuda e usuário à direita); notificações em painel com "Marcar todas como lidas".
- Também existem páginas de Ícones, Abas, Etapas (stepper), Upload e Gráficos — consultar quando a tela da tarefa usar.
