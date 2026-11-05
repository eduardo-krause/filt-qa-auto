
## Acesso / ambiente
- URL do AT de uma tarefa: `https://erp-homologacao-nmtz-<numero>.viasoftcloud.com.br`.
- Login: CPF + senha → Enter → aparece dropdown **Empresa** (tem filtro) → escolher `AT: nmtz-<numero>` → Entrar.
- A empresa "AT: nmtz-XXXX" corresponde a um id de cliente; o banco é `CLIENTE_<id>`. O id aparece no POST `/api/oauth/oauth/token` (`"cliente":"<id>"`) e na lista de `/api/oauth/cliente`.
- **Trocar filial logada**: clicar no nome da empresa/código no topo esquerdo (≈140,35) → diálogo "Alterar estabelecimento" (tabela Código/Fantasia/Razão) → clicar na linha.
- **Inativar/ativar cadastro** (Matriz/Filial `/fiscal/filial/form?id=N`, Grupo Empresarial `/fiscal/empresa/form?id=N`): botão ⋮ do cabeçalho (`btn-menu-header`) → "Inativar cadastro"/"Ativar cadastro" → confirmação **Sim/Não**. Grava `FILIAL.INATIVO` / `EMPRESA.INATIVO`.
- Rodapé de paginação "x - y de z" das listagens mostra o início errado da página 2 em diante (ex.: "15 - 30") — defeito geral, existe também em produção.
- Rotas do menu vêm de `GET /api/master/menu/menus-by-user` (campo `url`). Rotas usadas: `/nota/nota-fiscal`, `/fiscal/item`, `/fiscal/conhecimento-de-transporte`, `/vendas/consulta-estoque-movimentacao`, `/precificacao/formacao-preco`, `/relatorio-estoque/ficha-estoque`.

## Componentes de tela (valem para o sistema todo)
- **Campo de moeda**: digitação entra como centavos → para R$ 100,00 digitar `10000`. Desconto unitário tem 5 casas (R$ 2,00000 → digitar `200000`).
- **Autocomplete**: digitar parte do texto e escolher em `li[role=option]`; com campo vazio, clicar no botão de seta do próprio campo lista as opções.
- **Dropdown** (p-dropdown): clicar e escolher `li.p-dropdown-item`.
- **Painel vermelho "Campos obrigatórios"** (canto superior direito) lista o que falta e **fica por cima do botão Salvar** — fechar no X antes de clicar de novo.
- **SPA mantém o registro anterior**: abrir `/form` direto depois de ter aberto um registro pode carregar o form "sujo". Sempre ir pela lista, recarregar e clicar **Novo**.
- Valores mascarados (`********`) têm um ícone de olho para revelar.
- Menu **⋮** no topo do registro: Excluir, Cancelar Nota, Auditoria, etc.

## Cadastro de item (`/fiscal/item` → Novo)
Obrigatórios: Descrição, Tipo do item, Unidade de medida, Origem, NCM, ICMS, PIS/COFINS, aba IBS CBS (CST IBS CBS + Classificação tributária), GRUPO, Local de estoque padrão de entradas e de saídas. A unidade fica bloqueada depois que o item tem vínculos. Cria `ITEM` + `ITEM_FILIAL` (só na filial logada) + `ITEM_FILIAL_VALORES` zerado.

## Nota fiscal de entrada de terceiros (`/nota/nota-fiscal` → Novo)
1. Natureza (ex.: COMPRA DE MERCADORIA) → Entrada/Modelo 55 preenchem sozinhos.
2. **Chave de acesso** (44 dígitos) → série e número são preenchidos a partir da chave (posições de série/nNF). Não há validação da chave contra o emitente.
3. Pessoa → complemento preenche sozinho.
4. Item → **Adicionar**: item, Quantidade Unitária, Valor Unitário, Desconto Unitário, Local de estoque. O diálogo continua aberto após adicionar (fechar em Cancelar).
5. Frete, seguro, despesas: editar o item (lápis) → campos Seguro/Frete/Despesas Acessórias; **Frete Gerencial fica na seção "Custos"** do diálogo (recolhida — clicar em "Custos" antes; ids `valorSeguro`, `valorFrete`, `valorDespesaAcessoria`, `valorFreteGerencial`). Os campos de totais no rodapé da nota são desabilitados.
- Cadastro de item novo com descrição parecida abre o diálogo "Validação Descrição" (Cancelar para seguir); Tipo do item e Origem são autocomplete; após salvar abre "Adicionar item à tabela de preço" (Cancelar).
- **Outras Movimentações** (`/fiscal/lancamento-outra-natureza`) com AJUSTE ESTOQUE - SAÍDA grava como PENDENTE e **não baixa estoque** sozinho (só tem Excluir no ⋮) — não serve para simular venda.
6. **Tipo do Frete** é obrigatório (ex.: "Sem Ocorrência de Transporte").
7. Salvar → abre **Acerto Financeiro**: escolher forma (Dinheiro) → Salvar da forma → Concluir → clicar **Salvar da nota de novo** → "Salvo com sucesso".
- Excluir: ⋮ → Excluir → confirmar "Excluir".

## Venda NF-e própria (natureza VENDA DE MERCADORIAS)
Série e número automáticos; vendedor preenche sozinho; Tipo do Frete obrigatório; acerto financeiro igual ao da entrada. Ao salvar gera e transmite a NF-e (homologação da Sefaz) → modal "Transmissão NF-e" com protocolo. Cancelar: ⋮ → **Cancelar Nota** → motivo → Salvar (`ID_SITUACAO_DOCUMENTO` vira 3).

## Venda futura
- **VENDA PARA ENTREGA FUTURA**: acerto financeiro só com Adiantamento/Duplicata/Cartão/Cheque (sem Dinheiro). Duplicata: escolher Forma Parcelamento → Gerar → Salvar → Concluir.
- **REMESSA DE MERCADORIA PARA ENTREGA FUTURA**, **DEVOLUÇÃO DE REMESSA PARA ENTREGA FUTURA** e **DEVOLUÇÃO DE VENDA FUTURA**: ao escolher a natureza abre o modal **Documentos Referenciados** (passos Filtros → Notas → Itens NF): Pessoa + Número → Pesquisar → marcar a nota → Próximo → marcar o checkbox do item → "Quantidade a Baixar" → Finalizar.
- Nessas notas, **Informação Complementar** (Dados Adicionais) é obrigatória.
- A busca de documentos só mostra notas com saldo (`NOTA_FISCAL_ITEM.QUANTIDADE_TOTAL_NAO_REFERENCIADA` > 0). A remessa referencia a venda (`NOTA_FISCAL_REFERENCIA`) e também a compra de origem com `EH_MOVIMENTACAO_PEPS = 1`.
- Movimentos em `ESTOQUE_MOVIMENTO` por `ID_TIPO_SALDO_ESTOQUE`: venda futura = tipo 2 saída + tipo 6 entrada; remessa = tipo 1 saída + tipo 6 saída; devolução de remessa = tipo 1 entrada; devolução de venda futura = tipo 2 entrada + tipo 6 saída (nada no tipo 1). Venda normal e compra = tipo 1.

## CT-e de entrada (`/fiscal/conhecimento-de-transporte` → Novo)
Natureza **CT-E ENTRADA** → Número CT-e, Série, Emitente → **Adicionar Documento** (filtra naturezas de compra; marcar a nota → Finalizar) → Remetente → Cidade Coleta / Cidade de Origem dos Serviços → Operação Fiscal (1353) → na grade de Componentes já existe a linha "Frete": só informar o valor → Salvar → acerto financeiro → Salvar. Grava `CONHECIMENTO_TRANSPORTE`, `_REFERENCIA` (`ID_NOTA_FISCAL_ORIGEM`) e `_COMPONENTE`. Exclusão pela lixeira na lista.
- Diálogo Adicionar Documento: Pessoa obrigatória → botão funil `button.btn-filtrar-default` → marcar **várias** notas (checkbox) → Finalizar. Notas com tipos de rateio diferentes → toast "Para múltiplas Notas Fiscais os tipos de rateio de frete devem ser iguais."
- **Remetente** (`#pessoaRemetente`): digitar e escolher deixa o campo vazio (também em produção) → abrir pela **seta** do campo e clicar a opção. CST/CSOSN ICMS também é obrigatório (00).
- Editar CT-e já salvo (tirar nota pela lixeira da grade, mudar valor): o Salvar dá "O valor total do acerto não pode ser diferente do valor total do CT-e" → seção **Acerto Financeiro** do form → Adicionar → lixeira da forma antiga → nova forma → Concluir → Salvar.
- Tipos de natureza de CT-e: só **CTe - Entrada** (10, terceiros, sem Cancelar — só Excluir no ⋮) e **CTe - Saída** (24, própria). Base sem série padrão de CT-e: a natureza CT-E SAÍDA é limpa ao ser escolhida, sem mensagem.
- Nota de entrada: excluir nota referenciada em CT-e é bloqueado ("possui vínculo com CONHECIMENTO_TRANSPORTE_REFERENCIA").

## Consultas
- **Consulta Estoque/Movimentação**: busca por código/descrição → grid com coluna "Valor aquisição médio"; clicar no item abre o detalhe (Custos e preços, Última compra, saldos por filial). API: `POST /api/vendas/consulta-estoque-movimentacao/find-itens` (paginação de 17) e `GET .../detalhe/<itemFilialId>?itemId=<id>`.
- **Formação de Preço**: assistente Seleção dos Itens → Simular → Aplicar; filtro "Por Produto"; grid com Valor Aquisição (= `VALOR_UNITARIO_AQUISICAO`), Custo Aquisição, % Markup, Valor PMZ, Preço Vigente.

## Grupo de Usuários / permissões (`/master/grupo-usuario`)
- Abrir o grupo pela lista → seção **Permissões** → **Adicionar** → campo Menu (autocomplete, digitar parte do nome) → escolher "Caminho > Menu" → abre accordion do menu pai (clicar para expandir) → toggles `mat-slide-toggle` com `title` = ação, dentro de `[id^=item-geral-<idMenu>-]`.
- O **Salvar do diálogo** já grava ("Salvo com sucesso") e o diálogo continua aberto (fechar em Cancelar). Grupo novo só mostra a seção Permissões depois de salvo; o botão "Permissões" do topo é **Importar Permissões**.
- Banco: `GRUPO_USUARIO_ACAO (ID_GRUPO_USUARIO, ID_MENU_ACAO)`; vínculo usuário×grupo×filial em `GRUPO_USUARIO_FILIAL`. Ids de menu/ação vêm de `menus-by-user` (campo `acoes[].id`). `USUARIO.TIPO_USUARIO='S'` (principal) enxerga tudo.
- Excluir grupo: lixeira `.ph-trash` na linha da lista → "Tem certeza que deseja excluir?" Excluir → `DELETE /api/master/grupo-usuario/{id}`.
- Sem permissão, a rota aberta direto cai em `/401` ("Uma autorização é necessária").
- **Administrador sempre pode:** usuário com `USUARIO.TIPO_USUARIO='S'` (Tipo de Usuário administrador/supervisor) executa a ação mesmo vinculado a um grupo que não a concede. Se for bloqueado, é bug.
- **Secundário fora do login do AT**: se a empresa `AT: nmtz-X` não aparece para o secundário, abrir Cadastros › Usuários (`/master/usuario`) → o usuário → **Salvar** sem mudar nada refaz o vínculo.

## Etiquetas
- Configuração: `/vendas/etiquetas` (menu 1244); form: Descrição, Impressora (autocomplete `#impressora`), altura/largura, margens, margem folha, espaçamento e pelo menos uma "Variável de dados" (sem ela o Salvar Modelo não faz nada nem avisa). Tabela `ETIQUETA`; impressoras em `IMPRESSORA`.
- Listagem: título "Configuração de Etiqueta"; botão funil `button.vs-btn-symbol-stroke:has(.ph-funnel)` abre `.p-sidebar` (fecha sozinho após Filtrar). Campos `p-autocomplete#empresa` / `p-autocomplete#filiais` (chips, padrão = filial logada), `#filtro-id`, `#filtro-descricao`, "Adicionar Todos". API `POST /api/vendas/etiqueta/page?page&size&order=id|descricao&asc` corpo `{empresaId, filialIdList, id, descricao}`; filiais via `find-ativas-by-empresas`, empresa via `complete-by-all`. Lixeira: clicar `app-remover .ph-trash` (o `<a>` tem tamanho 0); confirmação Aviso Cancelar/Confirmar → `DELETE /api/vendas/etiqueta/{id}` (apaga ETIQUETA_VARIAVEL junto). Clicar na linha abre o form. Linhas por página: `.paginator-footer .p-dropdown` (15/30/50/100).
- Etiqueta exige impressora **da filial logada**; nova impressora em `/fiscal/impressora` (fechar aviso "Agora não"; Perfil Etiqueta, Forma de conexão "Fila de impressão" = SPOOLER, `#alturaFolhaMm`/`#larguraFolhaMm`).
- Impressão: `/vendas/impressao-etiquetas` (menu 1245, desde 25/09 o menu se chama **"Impressão de Etiquetas"** em Processos › Vendas; na busca de rotina aparece "Processos > ... > Impressão de Etiquetas"): pesquisar item → escolher "Configuração da Etiqueta" → Imprimir (`POST /api/vendas/impressao-etiqueta/imprimir` corpo `{etiquetaId, linhas:[{itemFilialId, quantidade, loteId?}]}` → devolve o id do job). **Impressora SPOOLER imprime de verdade na máquina do usuário (Integrador)** — não clicar Imprimir sem avisar. Job em `IMPRESSAO_JOB` (SITUACAO PUBLICADO→IMPRESSO); conteúdo ZPL não fica no banco.
- Tela de impressão: pesquisa `input#pesquisa` (código exato, descrição/marca parcial; item já na grade some do resultado), configuração `p-autocomplete[name=configuracao]`, grade `tbody tr.table-body-line` (qtd = `p-inputnumber`, lote = `p-dropdown`, lixeira `.ph-trash`), pré-visualização `app-etiqueta-preview .folha/.etiqueta`. Coluna Lote só aparece se a configuração tiver Data de validade. APIs: `GET .../impressao-etiqueta/etiquetas?query=`, `.../itens?query=` (saldoFisico, temControleLote, codigoBarras), `.../lotes/<itemFilialId>` (só lotes com saldo, ordem de validade). Cancelar com dados → confirmação Sim/Não.
- Configuração de etiqueta tem só 5 variáveis: `NOME_ITEM`, `CODIGO_ITEM`, `CODIGO_BARRAS`, `DATA_VALIDADE`, `TOTAL` (checkbox `#variavel-<VAR>`); sem lote e sem colunas/linhas (a grade da folha sai da mídia da impressora). Item sem código de barras + configuração com código de barras → aviso "Código de barras não cadastrado".
- Link do código na grade abre `/fiscal/item/form?id=<ID_ITEM_FILIAL>` — é o padrão do cadastro de item, não bug. Atalho ⧉ da configuração: vazio → `/vendas/etiquetas?`, preenchido → `/vendas/etiquetas/form?id=<id>`. No form de configuração o **Código de barras não tem barra de formatação** (só altura/fonte/tamanho) e sai em largura total na pré-visualização. Grupo de usuário: abrir direto `/master/grupo-usuario/form?id=40` (a listagem pagina e o nome pode não aparecer); salvar o grupo recria todas as linhas de `GRUPO_USUARIO_ACAO` (IDs novos) — comparar por `ID_MENU_ACAO`.
- Efeito das permissões da rotina 1244 na listagem: sem Incluir o botão Novo some; sem Excluir a lixeira some (coluna Ações fica vazia); sem Visualizar o menu some e a rota cai em `/401`. Logar principal e secundário no mesmo navegador (`login` com `"usuario"`) troca a sessão; se o usuário estiver logado com o secundário em outro navegador, a sessão do agente cai para `/login`.
- Inativar/ativar Empresa (`/fiscal/empresa/form?id=N`) ou Filial (`/fiscal/filial/form?id=N`): menu ⋮ → "Inativar cadastro"/"Ativar cadastro" → confirmação **Sim/Não** (não é p-dialog; clicar o botão "Sim" visível). Grava `EMPRESA.INATIVO`/`FILIAL.INATIVO` na hora.
- Form de etiqueta (build de 25/09 à tarde): **margem da folha individual** `#margemFolhaSuperior/Esquerda/Direita/Inferior` + margens internas `#margemSuperior/Inferior/Esquerda/Direita` + `#espacamentoEtiquetas`; botão "Salvar modelo". Configurações criadas antes dessa mudança abrem sem margem da folha → recriar do zero. Sem **Alterar** o "Salvar modelo" some ao abrir uma existente (campos continuam digitáveis); com só Incluir cria nova. O botão "Imprimir" do form não fez nada em 25/09; toast de erro do Salvar cobre o botão (fechar `.p-toast-icon-close` antes de clicar de novo).
- Form de configuração (build de 29/09): menu real Configurações › **Venda** › Etiquetas (no autocomplete de permissões aparece "Configurações > Vendas > Etiquetas"). Ids: `#descricao` (máx. 60), `#carregarComoPadrao` ("Carregar como padrão" → `ETIQUETA.CARREGAR_COMO_PADRAO`), `#impressora` (só da filial logada), `#altura`, `#largura`, margens da folha e internas, `#espacamentoEtiquetas`, `#variavel-<VAR>`; por variável, dropdown de fonte (`p-dropdown:has(#fonte-<VAR>)`, 7 fontes), `#tamanhoFonte-<VAR>`, botões `title` Negrito/Itálico/Sublinhado/Tachado/Alinhar à esquerda/Centralizar/Alinhar à direita e `input[type=color]`; código de barras `#alturaCodigoBarras-CODIGO_BARRAS`. Campos numéricos aceitam o inteiro direto ("30" = 30,00). Variáveis ficam em `ETIQUETA_VARIAVEL` (FONTE, TAMANHO_FONTE, ALINHAMENTO, ORDEM).
- Salvar modelo: POST `/api/vendas/etiqueta` (novo; toast "Salvo com sucesso", fica no form, aparece o badge do código e o botão Novo) e PUT ao salvar de novo. Mensagens: altura/largura 0 → "Informe a altura da etiqueta em milímetros."; sem variável → "Selecione pelo menos uma variável de dados para compor a etiqueta."; altura do código de barras 0 → "Informe a altura do código de barras em milímetros."; etiqueta maior que a mídia → aviso amarelo "A etiqueta não cabe na mídia da impressora..." (grava assim mesmo). Excluir na listagem → "Aviso — A configuração selecionada será excluída. Deseja continuar?" → toast "Registro removido com sucesso".
- Botão **Imprimir** do form abre nova aba `/vendas/impressao-etiquetas?etiquetaId=<id>` com o modelo selecionado. Pelo menu, a tela de impressão abre com o modelo marcado como padrão (sem padrão: "Selecione").
- Lote na impressão: aparecem todos os lotes **com saldo**, inclusive **vencidos**, e o padrão é o de validade mais próxima (pode ser um vencido). Regra confirmada: usar ou não lote vencido é decisão do cliente — não reprovar nem levar à PO.
- Tela de impressão: as opções do campo configuração vêm com o id na frente ("36PADRÃO") — escolher pelo texto exato. Botão "−" em 1 fica esmaecido com `pointer-events: none` (sem atributo `disabled`). Item sem lote mostra só "-" (sem dropdown). A folha segue a mídia da impressora do modelo (mudar a impressora muda a grade).
- Código de barras na etiqueta: tipo deduzido pela tela (8 dígitos → EAN-8, 13 → EAN-13, 14 → ITF-14; DV inválido ou alfanumérico → CODE 128). Na mesma linha do cadastro o GTIN vence o Diverso; entre linhas vale a marcada como **principal** no cadastro do item (mesmo que a outra linha seja GTIN) — regra confirmada, não é ponto para a PO. Dá para conferir o tipo pelo SVG (`svg.codigo-barras`): EAN-13 = 95 módulos, EAN-8 = 67, ITF-14 = 135 começando com `1010`, CODE 128 começa com `11010`.
- Item sem código de barras + modelo que exige → aviso "Código de barras não cadastrado" (Cancelar / Ir para cadastro do item, que abre o cadastro em nova aba e mantém a lista). Trocar para modelo que exige com itens sem código → aviso listando "<código> - <nome>" com Cancelar / Continuar (remove só esses).

## Cadastro de item — código de barras e lote
- Accordion **Código de Barras** → Adicionar → diálogo "Adicionar Código de Barras" (Código de Barras GTIN, Código de Barras Diverso, Conversão de Quantidade) → Adicionar (o diálogo continua aberto: fechar em Cancelar) → Salvar o item. Grava `ITEM_CODIGO_BARRAS` (CODIGO_BARRAS_GTIN, CODIGO_BARRAS_DIVERSO, CODIGO_BARRAS_PADRAO). O GTIN recusa DV inválido; o Diverso aceita qualquer texto.
- "Tipo lote" (Nenhum/Geral) grava `ITEM_FILIAL.TIPO_LOTE`. "Preço venda" é bloqueado no cadastro (vem da formação/tabela de preço).
- No primeiro acesso de um usuário a algumas telas abre o tutorial "Olá, seja bem-vindo!" por cima — fechar antes de agir.

## Onde conferir no banco
- Custo/valores do item: `ITEM_FILIAL_VALORES` (e histórico em `ITEM_VALOR_MEDIO_AQUISICAO` / `ITEM_CUSTO_MEDIO`). Detalhes em `custo-e-valores-do-item.md`.
- Nota: `NOTA_FISCAL` (situação 1 = normal, 3 = cancelada) + `NOTA_FISCAL_ITEM` (`VALOR_DESCONTO` é unitário) + movimento por `ESTOQUE_MOVIMENTO_NOTA_FISCAL_ITEM`.
- Conexão: `ref_database_connection.md`. Automação: `ref_playwright_local.md`.
