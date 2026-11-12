# Mapa das telas (gerado a partir dos passos)

Gerado em 12/11/2026, 17:50:39 por `node motor/mapa.js` — não editar à mão.
Só tem o que os passos usam e já funcionou. **Faltou campo, botão ou tabela → procurar no código-fonte (Z:)**, como antes; depois de criar/consertar o passo, gerar o mapa de novo.
Regras e fluxos de negócio continuam na skill `regras-sistema-filt`; este mapa é só "onde fica cada coisa".

## Cadastros › Empresas › Matriz/Filial (/fiscal/filial/form?id=<ID_FILIAL>)

Pasta: `passos/cadastros/matriz-filial/`
- **Rotas:** `/fiscal/filial/form`
- **Ids:** `formulaValorAquisicao`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-filial.js` | `abrir` | Abrir filial. |
| `ler-rotulos-de-precificacao.js` | `rotulosPrecificacao` | Texto do card Precificação (a partir do título), para conferir a ordem dos campos. |
| `salvar-filial.js` | `salvar` | Salvar filial. |

## Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)

Pasta: `passos/cadastros/conta-bancaria/`
- **Rotas:** `/fiscal/configuracao-portador/form`
- **Ids:** `banco`, `consultaDda`, `dataAbertura`, `descricaoConvenio`, `digitoAgencia`, `digitoConta`, `emiteBoleto`, `especieTituloCobrancaBanco`, `estabelecimentos`, `filial`, `form`, `moeda`, `nomeAgencia`, `numeroAgencia`, `numeroConta`, `numeroConvenio`, `pessoa`, `valorLimite`
- **Tabelas no banco:** `CONFIGURACAO_PORTADOR`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-conta-bancaria.js` | `abrir` | Abrir conta bancaria. |
| `alterar-campo-e-salvar.js` | `alterarCampo` | Alterar campo e salvar. |
| `configurar-conta-bancaria.js` | `configurar` | Abre a conta, ajusta provedor/tipo/credenciais e salva. Confirma o aviso de limpar credenciais quando sai do Híbrido. |
| `criar-conta.js` | `criarConta` | Criar conta. |
| `escolher-opcao-de-lista-do-formulario.js` | `escolher` | Escolhe a opção do dropdown e devolve os diálogos que abriram (ex.: aviso de limpar credenciais). args: { rotulo, opcao } |
| `ler-configuracao-dda.js` | `lerDda` | Ler configuracao dda. |
| `ler-credenciais-visiveis.js` | `credenciaisVisiveis` | Rótulos de credenciais visíveis (card de credenciais do híbrido). |
| `ler-opcoes-de-lista-do-formulario.js` | `dropdownEstado` | Ler opcoes de lista do formulario. |
| `marcar-consulta-dda.js` | `consultaDda` | Marcar consulta dda. |
| `preencher-configuracao-dda.js` | `preencherDda` | Preencher configuracao dda. |
| `salvar-conta-bancaria.js` | `salvar` | Salvar do form, juntando avisos. |

## Cadastros › Financeiro › Movimentação automática OFX (/financeiro/movimentacao-automatica-ofx)

Pasta: `passos/financeiro/movimentacao-automatica-ofx/`
- **Ids:** `condicao`, `descricao`, `dropdown-help`, `filtro-descricao`, `filtro-id`, `filtro-situacao`, `filtro-tipo`, `form`, `geraLancamentoConciliado`, `texto`
- **Tabelas no banco:** `MOVIMENTACAO_AUTOMATICA_OFX`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `criar-configuracao.js` | `criar` | Novo → preenche → Salvar. Não lança erro em validação. |
| `editar-configuracao.js` | `editar` | removerPadrao: índices na ordem da tela ANTES de remover (remove do maior para o menor). |
| `excluir-configuracao.js` | `excluir` | Excluir configuracao. |
| `inativar-configuracao.js` | `situacao` | Inativar configuracao. |
| `ler-configuracao.js` | `ler` | Ler configuracao. |
| `ler-formulario-novo.js` | `formNovo` | Ler formulario novo. |
| `ler-listagem.js` | `listagem` | Etapas na ordem: inicial → ordenar → linhasPorPagina → irPagina → filtros (abre painel, preenche, Filtrar) → limpar (Limpar do painel) → fecharPainel. |
| `ler-opcoes-dos-campos.js` | `opcoesCampos` | → { opcoes:{ <inputId>:{ <texto>:[opções] } }, troca, volta }  (troca/volta = o que aconteceu ao trocar a filial) |
| `sugerir-conta-contabil.js` | `sugerir` | → { inicial:{credito,debito}, passos:[{ tipo, marcado, credito, debito }] }  (não salva) |

## Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)

Pasta: `passos/cadastros/formula/`
- **Rotas:** `/fiscal/formula`, `/fiscal/formula/form`
- **Ids:** `center`, `descricao`, `filtro-tipo`, `formulaValorAquisicao`, `tipoCalculo`
- **Botões:** Cancelar · Confirmar · Novo
- **Tabelas no banco:** `FORMULA`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-nova-formula.js` | `formNovo` | Abre Novo no tipo pedido e devolve o que o form mostra. → { tipo, acordeoes: { 'Variáveis da Nota de Entrada': [...] } } |
| `criar-formula.js` | `criar` | Cria a fórmula pela tela. termos: rótulos de variável ("Valor Total Item - NF Entrada") e operadores ("(", "+", "/", "1"...), |
| `excluir-formula.js` | `excluir` | Exclui pelo ⋮ › Excluir do form. Fórmula com vínculo: o sistema responde com o diálogo |
| `ler-campo-de-formula-no-cadastro.js` | `campo` | Campo autocomplete de fórmula na tela aberta (ex.: input#formulaValorAquisicao no Item/Grupo/Filial). |
| `ler-formula-montada.js` | `montada` | Fórmula montada na tela de um cadastro existente (espera os termos carregarem). → [termos] |
| `ler-tipos-de-formula.js` | `tipos` | Opções do modal "Selecione o Tipo" (na ordem) e do filtro Tipo da listagem. → { modal:[...], filtro:[...] } |

## Cadastros › Grupo de Usuários (/master/grupo-usuario/form?id=<ID_GRUPO_USUARIO>)

Pasta: `passos/cadastros/grupo-de-usuarios/`
- **Rotas:** `/master/grupo-usuario/form`
- **Ids:** `menu-complete`
- **Botões:** Adicionar
- **Tabelas no banco:** `GRUPO_USUARIO`, `GRUPO_USUARIO_ACAO`, `VIASELL`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `definir-permissoes-do-menu.js` | `definirPermissoes` | Liga/desliga as ações de UM menu num grupo de usuários pela tela e salva. |

## Cadastros › Itens › Grupos (/fiscal/grupo-item)

Pasta: `passos/cadastros/grupo-item/`
- **Rotas:** `/fiscal/grupo-item`
- **Ids:** `descricaoSelected2`, `formulaValorAquisicao`
- **Tabelas no banco:** `GRUPO_ITEM_DETALHE`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-grupo.js` | `abrir` | Abrir grupo. |
| `criar-subgrupo.js` | `criarSubgrupo` | Cria um grupo filho: botão direito no nó do pai → "Adicionar <nível>" → diálogo (#descricaoSelected2) → Salvar do diálogo → |
| `ler-rotulos-de-precificacao.js` | `rotulosPrecificacao` | Rótulos do card Precificação na ordem. |
| `salvar-grupo.js` | `salvar` | Salvar grupo. |

## Cadastros › Itens › Item (/fiscal/item, form /fiscal/item/form?id=<ID_ITEM_FILIAL>)

Pasta: `passos/cadastros/item/`
- **Rotas:** `/fiscal/item`, `/fiscal/item/form`
- **Campos (rótulo):** 1
- **Ids:** `descricao`, `dropdown-help`, `fatorConversao`, `formulaCustoPresente`, `itemSemelhante`, `tipoConversao`, `unidadeMedida`, `valorPrecoVenda`, `valorUnitarioAquisicao`
- **Botões:** Novo
- **Tabelas no banco:** `ITEM`, `ITEM_FILIAL`, `ITEM_FILIAL_VALORES`, `ITEM_SIMILAR`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-item.js` | `abrir` | Abre o item (form?id=ID_ITEM_FILIAL) ou um item novo (novo: true). |
| `alterar-descricao-e-unidade.js` | `alterarDescricaoUnidade` | Alterar descricao e unidade. |
| `alterar-preco-de-venda.js` | `alterarPrecoVenda` | Alterar preco de venda. |
| `copiar-item.js` | `copiar` | ⋮ (#dropdown-help) › Copiar › confirmação: o sistema copia o item (com tributação, grupos, locais) e abre a cópia em outra aba. |
| `ler-campos-de-preco-e-custo.js` | `precoCusto` | Rótulos do card "Preço e custo variáveis" na ordem e estado de campos pedidos pelo id. |
| `ler-rotulos-de-estoque.js` | `rotulosEstoque` | Rótulos do card Estoque (ordem), para conferir a posição de campos. |
| `salvar-item.js` | `salvar` | Salvar item. |
| `vincular-item-similar.js` | `vincularSimilar` | Vincular item similar. |

## Cadastros › Patrimônio › Bens (/patrimonio/bem → /patrimonio/bem/form?id=<ID_BEM>)

Pasta: `passos/patrimonio/bens/`
- **Rotas:** `/patrimonio/bem/form`
- **Ids:** `contadorAtual`, `contadorNovo`, `numeroSerie`
- **Botões:** Adicionar · Cancelar · Confirmar
- **Tabelas no banco:** `HISTORICO_CONTADOR_BEM`

| Arquivo | Passo | O que faz |
|---|---|---|
| `excluir-ajuste-de-contador.js` | `excluirAjuste` | Card "Ajuste e troca de contadores": lixeira da linha (padrão: a última) › Excluir › Salvar. A tela barra quando existe registro posterior que atualizou o contador. |
| `ler-contadores-do-bem.js` | `lerContadores` | Ler contadores do bem. |
| `registrar-ajuste-de-contador.js` | `registrarAjuste` | Registrar ajuste de contador. |

## Cadastros › Pessoa (/fiscal/pessoa/form, cadastro novo) → modal "Consulta CPF/CNPJ - Receita Federal"

Pasta: `passos/cadastros/pessoa/`
- **Rotas:** `/fiscal/pessoa/form`
- **Ids:** `cep`, `cidade`, `consultaDataNascimento`, `consultaIdentificacao`, `consultaUf`, `dadosAdicionais-<n> (prefixo)`, `dadosAdicionais-N`, `dataNascimento`, `emailDocumentoEletronico`, `emailPrincipal`, `identificacao`, `indicadorInscricaoEstadual`, `inscricaoProdutor-<n> (prefixo)`, `nome-cpf`, `opcaoFunrural`, `perfilTributario`, `regimeTributario`, `tipoEndereco`
- **Botões:** Novo complemento · Salvar
- **Tabelas no banco:** `PESSOA`, `PESSOA_COMPLEMENTO`, `PESSOA_ENDERECO`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-consulta-receita.js` | `abrirConsultaReceita` | Abre um cadastro novo, digita o documento no CPF/CNPJ e sai do campo (Tab); a modal abre com 11 ou 14 dígitos. |
| `abrir-pessoa.js` | `abrirPessoa` | Abre a pessoa cadastrada (recarrega a tela: descarta qualquer edição não salva) e devolve o estado dos complementos. |
| `adicionar-complemento.js` | `adicionarComplemento` | Adiciona um complemento e preenche a aba Geral dele (perfil tributário, e-mail principal e de documento eletrônico, indicador). |
| `adicionar-endereco-ao-complemento.js` | `adicionarEnderecoAoComplemento` | Adicionar endereco ao complemento. |
| `adicionar-endereco.js` | `adicionarEndereco` | Adiciona um endereço ao complemento N e salva o diálogo. Cidade pelo autocomplete (nome + UF). |
| `cancelar-consulta-receita.js` | `cancelarConsultaReceita` | Clica "Cancelar" da modal e devolve se ela fechou, os avisos e o estado do cadastro (pessoa + aba visível de cada complemento). |
| `editar-complemento-produtor-rural.js` | `editarComplementoProdutorRural` | Editar complemento produtor rural. |
| `escolher-regime-tributario.js` | `escolherRegimeTributario` | Abre o dropdown "Regime Tributário" pelo clique e escolhe a opção pedida (ou a primeira depois de "Selecione"). |
| `incluir-pessoa-fisica.js` | `incluirPessoaFisica` | Incluir pessoa fisica. |
| `informar-fantasia-do-complemento.js` | `informarFantasiaDoComplemento` | Digita (ou limpa, com fantasia '') o campo "Fantasia" do complemento de índice N (0 = primeiro card). |
| `ler-estado-validacao-produtor.js` | `lerEstadoValidacaoProdutor` | Estado atual da validação, sem mexer no foco: { toasts (vistos desde o último Salvar), camposObrigatorios: [...], |
| `ler-opcoes-uf-receita.js` | `lerOpcoesUfReceita` | Abre a lista do campo UF da modal pelo botão de seta (sem digitar) e lê cada linha; opcionalmente escolhe uma. |
| `ler-pessoa-cadastrada.js` | `lerPessoaCadastrada` | Abre a pessoa gravada e lê a seção Pessoa e cada complemento (Geral, Endereços com o detalhe pelo lápis, Produtor Rural). |
| `pesquisar-dados-receita.js` | `pesquisarDadosReceita` | Na modal aberta: troca (opcional) documento, data de nascimento e UF (sigla), clica "Pesquisar dados" e espera o fim. |
| `preencher-obrigatorios-dos-complementos.js` | `preencherObrigatoriosDosComplementos` | Em cada complemento, preenche SÓ o que estiver vazio entre os obrigatórios que o Salvar pede: |
| `retornar-dados-receita.js` | `retornarDadosReceita` | Retornar dados receita. |
| `salvar-pessoa-com-perfil-tributario.js` | `salvarPessoaComPerfilTributario` | Salvar pessoa com perfil tributario. |
| `salvar-pessoa-e-ler-validacao-produtor.js` | `salvarPessoaELerValidacaoProdutor` | Clica Salvar e lê o que a tela mostrou: toasts (capturados assim que aparecem), diálogos, quadro "Campos obrigatórios", |
| `salvar-pessoa.js` | `salvarPessoa` | Só clica Salvar (não preenche nada) e devolve as mensagens exatas: avisos, quadro "Campos obrigatórios", campos inválidos. |
| `trocar-cep-do-endereco.js` | `trocarCep` | Troca o CEP do endereço Principal pelo lápis da aba Endereços e salva a pessoa. |
| `trocar-cidade-do-endereco.js` | `trocarCidadeDoEndereco` | Troca a cidade do endereço (Principal por padrão) do complemento N pelo lápis da linha e salva o diálogo. |
| `trocar-documento-do-cadastro.js` | `trocarDocumentoDoCadastro` | Troca o CPF/CNPJ do cadastro aberto (digita e sai do campo) e observa se a modal "Consulta CPF/CNPJ - Receita Federal" abre. |
| `trocar-documento-sem-salvar.js` | `trocarDocumentoSemSalvar` | Trocar documento sem salvar. |

## Cadastros › Precificação › Parâmetro de Preço (/precificacao/parametro-preco/form?id=<ID_PARAMETRO_VENDA>)

Pasta: `passos/precificacao/parametro-preco/`
- **Rotas:** `/precificacao/parametro-preco/form`
- **Ids:** `acrescimo`, `pessoaVendedor`, `tabelasPreco`
- **Tabelas no banco:** `PARAMETRO_VENDA_PESSOA_VENDEDOR`, `PARAMETRO_VENDA_REGRA`, `PARAMETRO_VENDA_TABELA_PRECO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-acrescimo-da-regra.js` | `alterarAcrescimo` | Troca o "% Acréscimo" da regra de variação do parâmetro (input#acrescimo) e Salva. |
| `vincular-tabela-no-parametro.js` | `vincularTabelaNoParametro` | Inclui a tabela no campo "Tabelas de Preço" (multi) do parâmetro e Salva. Se já estiver vinculada, não mexe. |
| `vincular-vendedor-no-parametro.js` | `vincularVendedorNoParametro` | Inclui o vendedor no campo "Vendedor" (multi) do parâmetro e Salva. Se já estiver vinculado, não mexe. |

## Cadastros › Precificação › Tabela de Preço (/precificacao/tabela-preco/form?id=<ID_TABELA_PRECO>)

Pasta: `passos/precificacao/tabela-preco/`
- **Rotas:** `/precificacao/tabela-preco/form`
- **Ids:** `percentualDescontoComercial`, `precoSugerido-<n> (prefixo)`
- **Tabelas no banco:** `TABELA_PRECO`, `TABELA_PRECO_ITEM_FILIAL`

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-desconto-maximo-da-tabela.js` | `alterarDescontoMaximo` | Troca o "% Desconto máximo" da tabela (input#percentualDescontoComercial) e Salva (não replica para outras filiais). |
| `alterar-preco-do-item-na-tabela.js` | `alterarPrecoDoItem` | Alterar preco do item na tabela. |

## Cadastros › Usuário (/master/usuario/form?id=<ID_USUARIO>), seção "Grupos" (app-grupoUsuarioFilial)

Pasta: `passos/cadastros/usuario/`
- **Rotas:** `/master/usuario/form`
- **Ids:** `filial`
- **Tabelas no banco:** `FILIAL`, `GRUPO_USUARIO`, `GRUPO_USUARIO_FILIAL`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `definir-filiais-do-grupo.js` | `definirFiliaisDoGrupo` | Definir filiais do grupo. |

## Cadastros › Usuários › Grupo de Usuários (/master/grupo-usuario/form?id=N) › Adicionar › Menu → liga/desliga ações → Salvar do diálogo.

Pasta: `passos/cadastros/grupo-usuario/`
- **Rotas:** `/master/grupo-usuario/form`
- **Botões:** Adicionar · Cancelar · Salvar

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-permissoes-do-menu.js` | `alterarPermissoes` | → { antes, depois (lido no diálogo antes de salvar), toasts }. O clique é no próprio toggle (mouse); se não trocar, para com erro (não contorna). |
| `ler-permissoes-do-menu.js` | `lerPermissoes` | Ler permissoes do menu. |

## Configurações › Receituário Agronômico (/reag/configuracao)

Pasta: `passos/reag/configuracao-receituario/`
- **Rotas:** `/reag/configuracao`
- **Ids:** `obrigaEquipamentoAplicacao`
- **Tabelas no banco:** `CONFIGURACAO_REAG`

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-configuracao-do-reag.js` | `alterar` | Alterar configuracao do reag. |

## Configurações › Vendas › Regras Comissão (/vendas/regras-comissao/form?id=<ID_REGRA_COMISSAO>)

Pasta: `passos/vendas/regras-comissao/`
- **Rotas:** `/vendas/regras-comissao/form`
- **Ids:** `pessoaVendedor`
- **Tabelas no banco:** `REGRA_COMISSAO_PESSOA_VENDEDOR`

| Arquivo | Passo | O que faz |
|---|---|---|
| `vincular-vendedor-na-regra.js` | `vincularVendedor` | Inclui o vendedor no campo "Vendedor" (multi) da regra e Salva. Se já estiver vinculado, não mexe. |

## ERP › Cadastros › Metas › Meta (/fiscal/meta, form /fiscal/meta/form)

Pasta: `passos/cadastros/meta/`
- **Rotas:** `/fiscal/meta/form`
- **Ids:** `dataFinal`, `dataFinalMetrica`, `dataInicial`, `dataInicialMetrica`, `descricao`, `estabelecimentoMeta`, `formula`, `grupoUsuario`, `grupoUsuarioVisualizador`, `id`, `marcaItem`, `naturezaDeOperacao`, `nivelGrupo`, `produto`, `statusPedido`, `tipoCampoData`, `tipoMetaItem`, `tipoMetaOperacaoDeduzir`, `tipoMetaOperacaoMetrificar`, `tipoNaturezaOperacao`, `tipoPeriodo`, `tipoResponsavelAtingirMeta`, `tipoResponsavelMeta`, `tipoVisualizador`, `usuario`, `usuarioVisualizador`, `valorMetrica`
- **Tabelas no banco:** `META`

| Arquivo | Passo | O que faz |
|---|---|---|
| `criar-meta.js` | `criar` | Cria uma meta pela tela. args: |

## ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard)

Pasta: `passos/paineis/meta/`
- **Rotas:** `/fiscal/meta-dashboard`
- **Ids:** `card-baixo`, `cards-lateral`, `filtro-descricao`, `meta-atingida`, `meta-geral`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-filtro.js` | `abrirFiltro` | Clica no funil. → { botao: { tooltip, posição em relação às abas e à tela }, filtro: lerFiltro } |
| `abrir-link-do-campo.js` | `abrirLink` | Clica no hyperlink do rótulo do campo. args: { campo: 'responsavel'/'nivel'/'grupo'/'marca'/'item' } |
| `abrir-painel-meta.js` | `abrirPainel` | Abre o painel (aba Abertas é a padrão). → { aba, metas[], selecionada, semRegistros, gráficos..., erros[], toasts[] } |
| `aplicar-filtro.js` | `filtrar` | Clica em Filtrar. → { painel, corpo (JSON enviado a find-metas-dashboard), status, filtroAberto, toasts } |
| `fechar-filtro.js` | `fecharFiltro` | Fecha o filtro lateral pelo X, se estiver aberto. |
| `ler-filtro.js` | `lerFiltro` | Só lê o filtro lateral aberto (campos visíveis, valores, desabilitados, obrigatórios, links, Filtrar/Limpar). |
| `limpar-filtro.js` | `limpar` | Clica em Limpar. → { painel, filtro, corpo da busca refeita } |
| `listar-opcoes-do-campo.js` | `listarOpcoes` | Abre a lista do campo (botão de seta do autocomplete ou o dropdown) e devolve as opções. args: { campo } → [textos] |
| `preencher-filtro.js` | `preencherFiltro` | args (todos opcionais): { descricao, responsaveis:[], meta:'Selecione'/'Grupo'/'Marca'/'Item', nivel, grupos:[], marcas:[], itens:[], |
| `remover-selecao-do-campo.js` | `removerSelecao` | Remove pelo X todas as opções escolhidas num campo de multisseleção. args: { campo } → lerFiltro |
| `trocar-aba.js` | `trocarAba` | Trocar aba. |

## Financeiro › Acerto Financeiro/Baixa (/financeiro/acerto-financeiro-baixa) — Duplicatas a Pagar.

Pasta: `passos/financeiro/acerto-financeiro-baixa/`
- **Rotas:** `/financeiro/acerto-financeiro-baixa`
- **Campos (rótulo):** Pessoa
- **Ids:** `numeroDuplicata`, `valorAcertar`
- **Botões:** Baixar · Concluir · Filtrar · Não · Salvar
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `baixar-duplicata-a-pagar-parcialmente.js` | `baixarPagarParcial` | Baixa parcial em Dinheiro de UMA duplicata a pagar. args: { titulo: '06542654345-5/5', valor: 50 } |
| `baixar-titulo-parcial.js` | `baixarParcial` | Baixar titulo parcial. |
| `quitar-titulos-em-dinheiro.js` | `quitar` | Baixa (quitação) em Dinheiro de títulos a receber. args: { pessoa, titulos:['01000000482-1/2', ...] } |

## financeiro › acerto-financeiro

Pasta: `passos/financeiro/acerto-financeiro/`
- **Campos (rótulo):** Conta Bancária/Caixa
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `acertar-em-duplicata.js` | `duplicata` | Acerto aberto: forma Duplicata numa conta bancária, com a forma de parcelamento (texto exato: "30 DIAS", "30/60/90"). |

## Financeiro › Adiantamentos (/financeiro/adiantamentos/form)

Pasta: `passos/financeiro/adiantamento/`
- **Rotas:** `/financeiro/adiantamentos/form`
- **Ids:** `pessoa`, `valor`
- **Botões:** Concluir · Salvar
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `criar-adiantamento.js` | `criar` | Criar adiantamento. |

## Financeiro › Estorno (/financeiro/estorno) — Duplicatas a Pagar.

Pasta: `passos/financeiro/estorno/`
- **Rotas:** `/financeiro/estorno`
- **Campos (rótulo):** Número Duplicata · Pessoa
- **Ids:** `filtro-numeroDocumento`
- **Botões:** Estornar · Filtrar · Sim
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `estornar-baixa-de-duplicata-a-pagar.js` | `estornarPagar` | Estorna a(s) baixa(s) de uma duplicata a pagar feitas na data. args: { titulo: '06542654345-5/5', dataBaixa: 'dd/mm/aaaa' } |
| `estornar-baixa-de-titulo.js` | `estornar` | Estorno da baixa de um título. args: { pessoa, titulo: '01000000482-2/2', dataBaixa: 'dd/mm/aaaa' } |

## geral › estabelecimento

Pasta: `passos/geral/estabelecimento/`
- **Rotas:** `/home`

| Arquivo | Passo | O que faz |
|---|---|---|
| `trocar-filial-logada.js` | `trocar` | Trocar filial logada. |

## geral › sessao

Pasta: `passos/geral/sessao/`

| Arquivo | Passo | O que faz |
|---|---|---|
| `entrar-com-usuario.js` | `entrar` | Permissão só vale depois de um login/recarga: usar este passo depois de mudar grupo de usuários. |

## mobile › app-pedido-venda

Pasta: `passos/mobile/app-pedido-venda/`
- **Ajudantes comuns:** `passos/_adb.js`, `passos/_app-item.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `adicionar-item-defensivo.js` | `adicionar` | Na busca de itens: pesquisa, abre o carrinho do card, preenche e confirma. |
| `alterar-quantidade-do-item.js` | `quantidade` | Alterar quantidade do item. |
| `atualizar-dados-do-app.js` | `atualizarDados` | → texto do aviso de conclusão |
| `confirmar-ou-salvar-item.js` | `confirmar` | Confirmar ou salvar item. |
| `criar-cabecalho-do-pedido.js` | `criar` | Criar cabecalho do pedido. |
| `escolher-equipamento-de-aplicacao.js` | `equipamento` | Escolher equipamento de aplicacao. |
| `fazer-login-no-app.js` | `entrar` | Fazer login no app. |
| `finalizar-e-enviar-pedido.js` | `finalizarEEnviar` | → { status, pedido } (pedido = ID_PEDIDO no ERP) |
| `informar-numero-de-aplicacoes.js` | `aplicacoes` | Informar numero de aplicacoes. |
| `ler-card-aplicacoes.js` | `ler` | Ler card aplicacoes. |
| `trocar-receituario-padrao.js` | `receituario` | Trocar receituario padrao. |

## Movimentações Fiscais › Conhecimento de Transportes (/fiscal/conhecimento-de-transporte)

Pasta: `passos/fiscal/conhecimento-transporte/`
- **Rotas:** `/fiscal/conhecimento-de-transporte`, `/fiscal/conhecimento-de-transporte/form`
- **Campos (rótulo):** Natureza de Operação · Pessoa
- **Ids:** `cstIcms`, `numeroCte`, `operacaoFiscal`, `pessoaEmitente`, `pessoaRemetente`, `serie`
- **Botões:** Adicionar Documento · Concluir · Finalizar · Novo · Salvar
- **Menu ⋮:** Excluir
- **Tabelas no banco:** `CONHECIMENTO_TRANSPORTE`, `CONHECIMENTO_TRANSPORTE_COMPONENTE`
- **Ajudantes comuns:** `passos/_acerto.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-valor-do-cte.js` | `alterarValor` | Muda o valor do componente Frete de um CT-e salvo e refaz o acerto em Dinheiro. |
| `alterar-vencimento-no-acerto.js` | `alterarVencimentoNoAcerto` | Documento já salvo: seção "Acerto Financeiro" › Adicionar › lápis da forma Duplicata no Resumo › troca o vencimento da(s) parcela(s) |
| `excluir-cte.js` | `excluirCte` | Exclui o CT-e pelo ⋮ › Excluir do formulário (CT-e de entrada não tem Cancelar). args: { id } → { existe, avisos } |
| `lancar-cte-de-entrada.js` | `entrada` | → { id } (ID_CONHECIMENTO_TRANSPORTE lido do banco) |
| `ler-vencimentos-no-acerto.js` | `lerVencimentosNoAcerto` | Lê, sem gravar, as parcelas da forma Duplicata no acerto do documento (sai pelo Voltar). |

## Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)

Pasta: `passos/fiscal/nota-fiscal/`
- **Rotas:** `/nota/nota-fiscal`, `/nota/nota-fiscal/form`
- **Campos (rótulo):** 1 · Natureza de Operação · Pessoa · Tipo do Frete
- **Ids:** `chaveDeAcesso`, `dropdown-help`, `item`, `localEstoque`, `pessoa`, `quantidadeComercial`, `tipoDoFrete`, `valorDesconto`, `valorUnitarioComercial`
- **Botões:** Adicionar · Adicionar Documento · Cancelar · Concluir · Fechar · Finalizar · Novo · Pesquisar · Próximo · Salvar
- **Menu ⋮:** Excluir
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`, `NOTA_FISCAL`, `NOTA_FISCAL_DOCUMENTO_FINANCEIRO`, `NOTA_FISCAL_ELETRONICA`
- **Ajudantes comuns:** `passos/_acerto.js`, `passos/_comum.js`, `passos/_nota.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-vencimento-no-acerto.js` | `alterarVencimentoNoAcerto` | Documento já salvo: seção "Acerto Financeiro" › Adicionar › lápis da forma Duplicata no Resumo › troca o vencimento da(s) parcela(s) |
| `cancelar-nota.js` | `cancelar` | Cancelar nota. |
| `consultar-nfe-autorizadas.js` | `autorizadas` | Consultar nfe autorizadas. |
| `consultar-notas-do-pedido.js` | `doPedido` | Notas do pedido criadas depois de `desdeId`: [{ ID_NOTA_FISCAL, NUMERO_DOCUMENTO }] |
| `consultar-titulos-da-nota.js` | `titulos` | Consultar titulos da nota. |
| `consultar-ultima-nota.js` | `ultimoId` | Maior ID_NOTA_FISCAL atual (para achar as notas criadas depois de uma ação). |
| `emitir-nota-com-documento-referenciado.js` | `comReferencia` | Emitir nota com documento referenciado. |
| `emitir-nota-de-venda-com-duplicata.js` | `vendaComDuplicata` | NF-e de venda própria com 1 item e acerto em Duplicata numa conta bancária. |
| `excluir-nota.js` | `excluir` | Exclui a nota pelo ⋮ › Excluir (confirmação "Excluir"). → { toasts, dialogos } |
| `inutilizar-nota.js` | `inutilizar` | NF-e própria salva e NÃO autorizada (rejeitada): ⋮ › Inutilizar Documento → justificativa → confirmar. |
| `lancar-nota-de-entrada-com-duplicata.js` | `entradaTerceirosComDuplicata` | Lancar nota de entrada com duplicata. |
| `lancar-nota-de-entrada-compra.js` | `entradaTerceiros` | Nota de ENTRADA de terceiros pela tela (ex.: COMPRA DE MERCADORIA), com acerto em Dinheiro. |
| `ler-auditoria-da-nota.js` | `lerAuditoriaDaNota` | Ler auditoria da nota. |
| `ler-vencimentos-no-acerto.js` | `lerVencimentosNoAcerto` | Lê, sem gravar, as parcelas da forma Duplicata no acerto do documento (sai pelo Voltar). |
| `salvar-nota-aberta-por-outra-rotina.js` | `salvarAberta` | Salvar nota aberta por outra rotina. |

## Processos › Contábil › Fechamento do Período (/contabil/fechamento-periodo)

Pasta: `passos/contabil/fechamento-periodo/`
- **Ids:** `motivo`
- **Tabelas no banco:** `PERIODO_MOVIMENTACAO`, `PERIODO_MOVIMENTACAO_PROCESSO`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-periodo.js` | `abrir` | Abrir periodo. |
| `fechar-periodo.js` | `fechar` | Fechar periodo. |

## Processos › Financeiro › Conciliação de Contas (/financeiro/conciliacao-bancaria)

Pasta: `passos/financeiro/conciliacao-bancaria/`
- **Ids:** `documento`
- **Tabelas no banco:** `CONCILIACAO`, `CONCILIACAO_EXTRATO`, `LANCAMENTO`
- **Ajudantes comuns:** `passos/_comum.js`, `passos/_movimentacao-bancaria.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-link-do-lancamento.js` | `abrirLink` | Abrir link do lancamento. |
| `conciliar-manual.js` | `conciliar` | → { ofx:{linha,candidatas}, sistema:{linha,candidatas}, confirmarHabilitado, toastsConfirmar, salvar:{toasts,errosApi} / null, conciliadoBanco (DATA_CONCILIACAO do extrato pelo FITID, se houver) } |
| `criar-movimentacao-pela-linha.js` | `novaMov` | → { menu, dialogo:{antes, preenchido, naoAchados, toasts, errosApi, obrigatorios, dialogoAberto}, idLancamento (banco), idsNovos, |
| `importar-ofx-simultaneo.js` | `importarSimultaneo` | Importar ofx simultaneo. |
| `importar-ofx.js` | `importar` | Importar ofx. |
| `ler-linhas-conciliacao.js` | `linhas` | Com filtroTexto a tela é expandida (o histórico/MEMO só aparece no detalhe "Histórico:"). |
| `reabrir-conciliacao.js` | `reabrir` | → { opcoes:[textos da lista], clicada, toasts, abas:[cabeçalhos das abas depois de abrir] } |
| `salvar-conciliacao.js` | `salvar` | → { toasts, eventos, errosApi, url } |

## Processos › Financeiro › Consulta DDA (/financeiro/consulta-dda)

Pasta: `passos/financeiro/consulta-dda/`
- **Rotas:** `/`
- **Ids:** `empresa`, `filial`, `pessoa`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-consulta-dda.js` | `abrirConsultaDda` | Abrir consulta dda. |
| `alternar-painel-filtros-consulta-dda.js` | `painelFiltrosDda` | Alternar painel filtros consulta dda. |
| `desfazer-selecao-conciliacao-dda.js` | `desfazerSelecaoDda` | Desfazer selecao conciliacao dda. |
| `escolher-filtro-consulta-dda.js` | `escolherFiltroDda` | Escolher filtro consulta dda. |
| `expandir-registro-conciliacao-dda.js` | `expandirDda` | Expandir registro conciliacao dda. |
| `filtrar-colunas-conciliacao-dda.js` | `filtroColunasDda` | Filtrar colunas conciliacao dda. |
| `filtrar-consulta-dda.js` | `filtrarDda` | Filtrar consulta dda. |
| `informar-datas-consulta-dda.js` | `datasDda` | Informar datas consulta dda. |
| `ler-ajuda-data-emissao-consulta-dda.js` | `ajudaCampoDda` | Ler ajuda data emissao consulta dda. |
| `ler-conciliacao-dda.js` | `conciliacaoDda` | Ler conciliacao dda. |
| `ler-filtros-consulta-dda.js` | `filtrosDda` | Ler filtros consulta dda. |
| `ler-opcoes-filtro-consulta-dda.js` | `opcoesFiltroDda` | Ler opcoes filtro consulta dda. |
| `rolar-area-conciliacao-dda.js` | `rolarAreaDda` | Rolar area conciliacao dda. |
| `selecionar-registro-conciliacao-dda.js` | `selecionarDda` | Selecionar registro conciliacao dda. |
| `trocar-aba-conciliacao-dda.js` | `abaDda` | Trocar aba conciliacao dda. |

## Processos › Financeiro › Duplicatas a Pagar (/financeiro/duplicata-pagar/form?id=N)

Pasta: `passos/financeiro/duplicatas-pagar/`
- **Rotas:** `/financeiro/duplicata-pagar/form`
- **Ids:** `dataVencimento`, `dropdown-help`, `justificativaVencimento`, `linhaDigitavel`
- **Botões:** Fechar · Salvar

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-duplicata.js` | `abrir` | Abre a duplicata e lê o campo Data de Vencimento. args: { id } → { editavel, vencimento, campos: {Pessoa, 'Data de Emissão', ...} } |
| `alterar-data-de-vencimento.js` | `alterarVencimento` | Alterar data de vencimento. |
| `alterar-linha-digitavel.js` | `alterarLinhaDigitavel` | Troca só a Linha Digitável (Dados para Pagamento) e salva. args: { id, linha: '123...' } |
| `cancelar-alteracao-de-vencimento.js` | `cancelarAlteracaoVencimento` | Digita a nova data, lê o Confirmar com a Justificativa vazia e só com espaços, e clica Cancelar da janela. |
| `ler-auditoria-da-duplicata.js` | `lerAuditoria` | Ler auditoria da duplicata. |

## Processos › Financeiro › Duplicatas a Receber (/financeiro/duplicata-receber/form?id=N)

Pasta: `passos/financeiro/duplicatas-receber/`
- **Rotas:** `/financeiro/duplicata-receber/form`
- **Ids:** `dataVencimento`, `justificativaVencimento`
- **Botões:** Emitir
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-duplicata.js` | `abrirReceber` | Abre a duplicata a receber e lê o campo Data de Vencimento. args: { id } → { editavel, vencimento } |
| `alterar-data-de-vencimento.js` | `alterarVencimentoReceber` | Digita a nova Data de Vencimento; na janela "Alteração da Data de Vencimento" lê o Confirmar com a Justificativa vazia, |
| `emitir-boleto.js` | `boleto` | ⋮ → Gerar Boleto / Reimprimir Boleto → (conta) → desmarca e-mail → Emitir, juntando avisos e PDFs. |
| `ler-opcoes-do-menu-da-duplicata.js` | `opcoes` | Opções do menu ⋮ do form da duplicata. args: { id } |

## Processos › Financeiro › Gestão Caixa e Bancos (/financeiro/caixas-contas)

Pasta: `passos/financeiro/gestao-caixa-bancos/`
- **Ids:** `centroResultadoDetalheDestino`, `centroResultadoDetalheOrigem`, `contaBancariaCaixa`, `dataFinal`, `dataInicial`, `dataLancamento`, `estornos`, `historicoDestino`, `historicoOrigem`, `movBancaria`, `numeroDocumento`, `valor`
- **Tabelas no banco:** `LANCAMENTO`
- **Ajudantes comuns:** `passos/_comum.js`, `passos/_movimentacao-bancaria.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `criar-movimentacao-bancaria.js` | `novaMov` | → { dialogo:{antes, preenchido, naoAchados, toasts, errosApi, obrigatorios, dialogoAberto}, toasts, errosApi, idLancamento (banco), idsNovos } |
| `criar-transferencia-bancaria.js` | `novaTransferencia` | → { antes, preenchido, naoAchados, toasts, eventos, errosApi, obrigatorios, dialogoAberto, idLancamento (banco), idsNovos } |
| `excluir-movimentacao.js` | `excluir` | → { linha, temLixeira, dialogo, toasts, eventos, errosApi, aindaNoExtrato } |
| `ler-extrato.js` | `extrato` | Ler extrato. |

## Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)

Pasta: `passos/financeiro/lancamentos-financeiros/`
- **Rotas:** `/financeiro/lancamento-financeiro`
- **Campos (rótulo):** Conta Contábil · Natureza Operação · Pessoa · Valor Lançamento
- **Ids:** `dataLancamento`, `observacao`
- **Botões:** Emitir · Emitir Boletos · Novo
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`, `HISTORICO_BOLETO`
- **Ajudantes comuns:** `passos/_acerto.js`, `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `alterar-vencimento-no-acerto.js` | `alterarVencimentoNoAcerto` | Documento já salvo: seção "Acerto Financeiro" › Adicionar › lápis da forma Duplicata no Resumo › troca o vencimento da(s) parcela(s) |
| `consultar-titulos-criados.js` | `titulosDesde` | Consultar titulos criados. |
| `consultar-ultimo-titulo.js` | `ultimoTitulo` | Maior ID_DOCUMENTO_FINANCEIRO (para achar os títulos criados por uma ação). |
| `criar-lancamento-com-duplicata.js` | `criarComDuplicata` | Criar lancamento com duplicata. |
| `ler-texto-da-tela.js` | `textoTela` | Texto da tela como evidência curta (ex.: conferir uma mensagem que ficou fixa). |
| `ler-vencimentos-no-acerto.js` | `lerVencimentosNoAcerto` | Lê, sem gravar, as parcelas da forma Duplicata no acerto do documento (sai pelo Voltar). |
| `tratar-dialogo-depois-de-salvar.js` | `posSalvar` | Diálogo depois do Salvar ("Salvo com sucesso" com Emitir Boletos): emite (capturando o PDF) ou fecha. |

## Processos › Financeiro › Remessa Bancária (/financeiro/gerar-remessa)

Pasta: `passos/financeiro/remessa-bancaria/`
- **Rotas:** `/financeiro/gerar-remessa`
- **Ids:** `dataEmissaoFinal`, `dataEmissaoInicial`, `filtro-enviadoBanco`, `portador`, `tipoOcorrencia`
- **Botões:** Adicionar Todos · Gerar arquivo · Transmitir
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `gerar-arquivo-de-remessa.js` | `gerar` | Marca as linhas (índices ou textos contidos) e clica Gerar arquivo; salva o .REM em `pasta`. |
| `pesquisar-titulos-para-remessa.js` | `pesquisar` | Pesquisa os boletos de um portador. args: { portador: '12345', estabelecimento?, de: 'dd/mm/aaaa', ate } |

## Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"

Pasta: `passos/financeiro/retorno-bancario/`
- **Ids:** `contaBancariaCaixa`, `contaBancariaHibrido`, `dataFimHibrido`, `dataInicioHibrido`, `documentoHibrido`, `estabelecimentoHibrido`, `pessoapessoaHibrido`, `situacaoHibrido`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `abrir-acoes-retorno.js` | `abrirAcoesRetorno` | Abre o ⋮ (coluna Ações) da linha do nosso número e lê as ações disponíveis; fecha o menu sem escolher. |
| `aprovar-retornos.js` | `aprovarRetornos` | Seleciona e abre a confirmação de aprovação; lê o modal; executa a ação; lê o resultado (se confirmou). |
| `consultar-banco-retorno.js` | `consultarBancoRetorno` | ⋮ da linha → "Consultar no banco" (consulta o retorno no banco na hora). A grade precisa estar pesquisada. |
| `ler-filtros-iniciais.js` | `lerFiltrosIniciais` | Recarrega a tela, entra na aba Boleto híbrido sem filtrar e lê o que vem sugerido + as opções de Estabelecimento, |
| `ordenar-coluna.js` | `ordenarColuna` | Clica no cabeçalho da coluna `vezes` vezes (grade já pesquisada) e, a cada clique, lê a ordem da coluna (página atual), |
| `pesquisar-boleto-hibrido.js` | `pesquisarHibrido` | Preenche os filtros da aba Boleto híbrido e clica em Filtrar. |
| `processar-arquivo-de-retorno.js` | `processarArquivoRetorno` | Processar arquivo de retorno. |
| `reprocessar-retorno.js` | `reprocessarRetorno` | ⋮ da linha → "Reprocessar". A grade precisa estar pesquisada. args: { nossoNumero } |
| `ver-detalhes-retorno.js` | `verDetalhesRetorno` | Ver detalhes retorno. |

## Processos › Precificação › Formação de Preço (/precificacao/formacao-preco)

Pasta: `passos/precificacao/formacao-preco/`
- **Rotas:** `/precificacao/formacao-preco`

| Arquivo | Passo | O que faz |
|---|---|---|
| `ler-selecao-da-formacao-de-preco.js` | `selecao` | → { cabecalho:[...], linha:{ coluna: valor } / null, todas:[...] } |

## Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido)

Pasta: `passos/vendas/antecipacao-financeira-pedidos/`
- **Rotas:** `/vendas/antecipacao-financeira-pedido`
- **Campos (rótulo):** Pessoa
- **Botões:** Cancelar · Carregar
- **Tabelas no banco:** `DOCUMENTO_FINANCEIRO`, `PEDIDO_FORMA_PAGAMENTO`, `PEDIDO_FORMA_PAGAMENTO_DOCUMENTO_FINANCEIRO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `desvincular-adiantamento.js` | `desvincular` | Desvincula um adiantamento pelo Histórico do pedido. args: { pessoa, pedido, adiantamento: '50087' } |
| `ler-pedido-e-valor-a-baixar.js` | `ler` | Linha do pedido na tela + "Valor a baixar" oferecido. args: { pessoa, pedido }  → { linha, valorOferecido } |
| `listar-adiantamentos-disponiveis.js` | `disponiveis` | Adiantamentos listados na janela "Gerar antecipações" do pedido (fecha sem salvar). → [ 'código ... saldo', ... ] |
| `vincular-adiantamento.js` | `vincular` | Vincula adiantamentos ao pedido. args: { pessoa, pedido, adiantamentos:['50087'], valorBaixar? } |

## Processos › Vendas › Aprovação Pedido (/vendas/aprovacao-pedidos)

Pasta: `passos/vendas/aprovacao-pedido/`
- **Rotas:** `/vendas/aprovacao-pedidos`

| Arquivo | Passo | O que faz |
|---|---|---|
| `aprovar-pedido.js` | `aprovar` | Aprovar pedido. |

## Processos › Vendas › Comissões (/vendas/gerar-comissoes/form)

Pasta: `passos/vendas/comissoes/`
- **Rotas:** `/vendas/gerar-comissoes/form`
- **Ids:** `dataFinal`, `dataInicial`, `dataVencimento`, `filtro`, `gerarComissoes`, `vendedor`
- **Botões:** Salvar
- **Tabelas no banco:** `COMISSAO`

| Arquivo | Passo | O que faz |
|---|---|---|
| `gerar-comissoes.js` | `gerarComissoes` | Filtro (funil): Data inicial/final + Vendedor → Filtrar; marca o vendedor, informa a Data de Vencimento, Gerar e Salvar. |

## Processos › Vendas › Consulta Estoque/Movimentação (/vendas/consulta-estoque-movimentacao)

Pasta: `passos/vendas/consulta-estoque-movimentacao/`
- **Rotas:** `/vendas/consulta-estoque-movimentacao`

| Arquivo | Passo | O que faz |
|---|---|---|
| `ler-detalhe-do-item.js` | `item` | Ler detalhe do item. |

## Processos › Vendas › Pedido Venda (/vendas/pedido → /vendas/busca → /vendas/carrinho?id=)

Pasta: `passos/vendas/pedido-venda/`
- **Rotas:** `/vendas/carrinho`, `/vendas/pedido`
- **Campos (rótulo):** Bandeira · Cliente · Forma de pagamento · Forma Parcelamento · Natureza de operação · Operadora · Parâmetro de preço · Vendedor
- **Ids:** `dataPagamento`, `formaParcelamento`, `formEntrega`, `observacoesPedido`, `quantidadeEntrega-<n> (prefixo)`
- **Botões:** Adicionar · Cancelar · Carrinho · Cartão · Concluir Pedido · Confirmar · Editar · Gerar Nota · GERAR NOTA · Item · Novo · Processar · Próximo
- **Menu ⋮:** Cancelar · Condições de Venda
- **Tabelas no banco:** `ITEM`, `NOTA_FISCAL`, `NOTA_FISCAL_ELETRONICA`, `PEDIDO_SOLICITACAO_ENTREGA`, `VIASOFT`
- **Ajudantes comuns:** `passos/_nota.js`, `passos/_pedido.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `adicionar-item-defensivo.js` | `adicionar` | Adicionar item defensivo. |
| `adicionar-item-na-edicao.js` | `adicionarItem` | Em edição: inclui mais um item (botão Item → busca → ADICIONAR → Carrinho). args: { item, qtd, casas, desconto? } |
| `alterar-data-de-pagamento.js` | `alterarDataPagamento` | Pedido JÁ em edição (Editar → Sim): menu ⋮ › Condições de Venda › troca a Data pagamento › Confirmar. Não salva o pedido. |
| `alterar-validade.js` | `alterarValidade` | Menu ⋮ → Alterar Validade do Pedido → data → Confirmar. Devolve se o diálogo continuou aberto depois do Confirmar. |
| `cancelar-pedido.js` | `cancelar` | Menu ⋮ → Cancelar: cancela quantidades por linha ou "Cancelar Todos". args: { pedido, qtds?:[1], casas, todos?:false, motivo? } |
| `concluir-pedido.js` | `concluir` | Concluir Pedido no carrinho aberto (novo ou em edição). Devolve os avisos (toasts). |
| `conferir-situacao-do-pedido.js` | `confere` | Conferir situacao do pedido. |
| `consultar-situacao-do-pedido.js` | `situacao` | Situação no banco: { ID_PEDIDO, STATUS_PEDIDO, PAGO (0/1), VALOR_TOTAL_CONTABIL } |
| `criar-pedido.js` | `criar` | Novo pedido completo: condições de venda → itens → (cartão) → Concluir Pedido. |
| `entrar-em-edicao.js` | `editar` | Entra na edição do pedido (Editar → Sim). Pedido parcialmente entregue abre a "edição parcial". |
| `escolher-cartao-de-credito.js` | `cartaoCredito` | Carrinho com forma Cartão: marca Crédito e escolhe a Forma Parcelamento. args: { parcelamento: '3X' } |
| `escrever-observacao.js` | `observacao` | Em edição: escreve a observação do pedido (textarea#observacoesPedido). |
| `excluir-ordem-de-entrega.js` | `excluirOrdem` | Seção Ordem de Entrega do carrinho: ícone "Menu" (ph-dots-three-outline-vertical) da linha › Excluir → confirmação "Excluir". |
| `faturar-ordem-de-entrega.js` | `faturar` | Faturar ordem de entrega. |
| `gerar-nota-de-venda-futura.js` | `gerarNotaVendaFutura` | Gerar nota de venda futura. |
| `gerar-ordem-de-entrega-com-item-similar.js` | `ordemSimilar` | Ordem de entrega trocando o item do pedido por um item SIMILAR: carrinho › Adicionar (seção Ordem de Entrega) → no diálogo |
| `gerar-ordem-de-entrega-linha-a-linha.js` | `porLinha` | Ordem de entrega digitando linha a linha e esperando o recálculo de cada uma: a tela redesenha a tabela a cada quantidade |
| `gerar-ordem-de-entrega.js` | `ordemEntrega` | Ordem de entrega: quantidades por linha do carrinho (ex.: [2] = 2 un na 1ª linha). args: { pedido, quantidades:[2], casas } (casas pode ser um array, uma por linha) |
| `informar-aplicacoes-no-modal-defensivo.js` | `aplicacoes` | Devolve os campos que o modal mostrou (antes e depois). |
| `remover-item-na-edicao.js` | `removerItem` | Em edição: remove a ÚLTIMA linha do carrinho que contém `texto` (ex.: "CORDA 1,000") e confirma Excluir. |
| `salvar-pedido.js` | `salvarPedido` | Botão Salvar do carrinho (grava sem concluir). Com `pedido` abre o carrinho antes; sem, usa o carrinho aberto. Devolve os avisos (toasts). |

## Produtor Rural › Propriedades › Cadastro de Fazendas (/produtor-rural/fazenda/form)

Pasta: `passos/produtor-rural/cadastro-de-fazendas/`
- **Rotas:** `/produtor-rural/fazenda/form`
- **Ids:** `areaTotal`, `autoCompleteComplemento`, `indicadorInscricaoEstadual`, `inscricaoProdutor-<n> (prefixo)`, `nome`, `opcaoFunrural`, `perfilTributario`, `Proprietario`
- **Tabelas no banco:** `FAZENDA`
- **Ajudantes comuns:** `passos/_comum.js`

| Arquivo | Passo | O que faz |
|---|---|---|
| `criar-fazenda-com-complemento-novo.js` | `criarFazendaComComplementoNovo` | Criar fazenda com complemento novo. |

## Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)

Pasta: `passos/produtor-rural/registrar-atividades/`
- **Rotas:** `/home`
- **Ids:** `atividade`, `configuracaoAtividade`, `contadorFinal`, `contadorInicial`, `contadorTotal`, `controleSafra`, `item`, `patrimonio`
- **Botões:** Adicionar · Cancelar · Editar · Finalizar Aplicação
- **Tabelas no banco:** `REGISTRO_ATIVIDADE`, `REGISTRO_ATIVIDADE_BEM`

| Arquivo | Passo | O que faz |
|---|---|---|
| `adicionar-bem-registro.js` | `adicionarBem` | Adicionar bem registro. |
| `alterar-cabecalho-do-registro.js` | `alterarCabecalho` | Registro CADASTRADO (depois do Editar): troca Atividade e/ou Data inicial/final (dd/mm/aaaa) e Salva. |
| `alterar-contador-final-do-registro.js` | `alterarContadorFinal` | Alterar contador final do registro. |
| `criar-registro-patrimonio.js` | `criar` | Criar registro patrimonio. |
| `editar-registro.js` | `editar` | Abre o registro CONCLUÍDO e clica "Editar" (volta para Cadastrado desfazendo as movimentações). Não responde diálogo sozinho. |
| `excluir-registro.js` | `excluir` | Excluir registro. |
| `finalizar-registro.js` | `finalizar` | Finalizar registro. |
| `ler-bens-do-registro.js` | `lerBens` | Abre o registro (qualquer status) e lê a tabela de Máquinas da tela e os mesmos dados no banco. Devolve também diálogos/toasts ao abrir (ex.: aviso de bloqueio). |
| `trocar-bem-do-registro.js` | `trocarBem` | Registro CADASTRADO: lixeira da linha da máquina (confirma se pedir) › Adicionar outro bem (com Contador final) › Salvar. |

## Relatórios › Pedido de Venda (/vendas/relatorios/pedido-venda)

Pasta: `passos/vendas/relatorio-pedido-venda/`
- **Rotas:** `/vendas/relatorios/pedido-venda`
- **Botões:** Filtrar

| Arquivo | Passo | O que faz |
|---|---|---|
| `ler-situacoes-dos-pedidos.js` | `situacoes` | Ler situacoes dos pedidos. |

## Relatórios › Vendas › Comissões (/vendas/relatorios/comissoes-geradas) — "Comissões Geradas"

Pasta: `passos/vendas/comissoes-geradas/`
- **Rotas:** `/vendas/relatorios/comissoes-geradas`
- **Ids:** `dataFinal`, `dataInicial`, `formFiltro`, `vendedor`

| Arquivo | Passo | O que faz |
|---|---|---|
| `baixar-relatorio-de-comissoes.js` | `baixarComissoes` | Com o relatório JÁ filtrado na tela (ver lerItensComissoes): menu ⋮ › "Download Analítico PDF" / "Download Analítico CSV"... |
| `ler-itens-das-comissoes-geradas.js` | `lerItensComissoes` | Ler itens das comissoes geradas. |
