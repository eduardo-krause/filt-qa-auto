# Agro: receituário, SIAGRO, produtor rural e cereais

## Receituário Agronômico
- Receituário padrão, época e defensivo ficam no schema global `VIASOFT` (`REAG_RECEITUARIO_PADRAO`, `REAG_EPOCA_APLICACAO`, `REAG_AGROTOXICO`); item ↔ defensivo em `ITEM.ID_REAG_AGROTOXICO` (campo "Registro MA" com "Defensivo" marcado no item).
- Busca de Receituário Padrão: aceita "descrição @ cultura"; pela seta traz no máximo 100.
- Receituário avulso (`/reag/receituario-agronomico` → Novo): busca da nota pelo **número** + série (`#numeroNotaFiscal` + `#serieNotaFiscal`; versões antigas `#idNotaFiscal` "Código") → "Carregar". API `GET /api/fiscal/nota-fiscal/find-by-numero-documento-serie-saida-filial-logada?documento=&serie=`; nota inexistente volta vazio sem mensagem.
- Linhas de defensivo vêm vazias: o lápis (`a[data-title="Editar"]`) só fica clicável com o mouse sobre a linha → modal "Defensivo" (Busca de Receituário Padrão preenche Padrão, Cultura e Diagnóstico; Quantidade*, Equipamento*) → Salvar ("Defensivo editado com sucesso"). Salvar o receituário sem editar as linhas dá 400 NullPointerException sem aviso (igual em produção).
- Receituário salvo: a seção Nota Fiscal some; ⋮ › "Nota Fiscal de Origem" abre a nota em nova aba. Vínculo `REAG_RECEITUARIO_AGRONOMICO.ID_NOTA_FISCAL`.
- Filtro da listagem: funil à direita do Novo; "Código" = `#filtro-id` (`POST /api/reag/reag-receituario-agronomico/page`).
- Impressão: `GET /api/relatorio/receituario-agronomico/<id>` (PDF).

## SIAGRO (PR) (`/reag/geracao-siagro`, Processos › Receituário Agronômico)
- Filtro em `.p-sidebar` (abre sozinho): Empresa, Estabelecimento* (múltiplo), Data Inicial*/Final* (`name=dataInicial|dataFinal`), Responsável Técnico. O filtro guarda o último estabelecimento usado.
- Grid Nota/Série/UF/Data/CNPJ; "Download Arquivos" (só com resultado) baixa `receita.csv` (ISO-8859-1, CRLF, linhas R e P) e `venda.csv` (linhas V, 16 campos). Layout: manual Adapar 2024, tabela 3.
- Nota cancelada sai dos arquivos.
- Banco: `REAG_RECEITUARIO_AGRONOMICO` (NUMERO_RECEITUARIO) + `_DETALHE` (QUANTIDADE_AGROTOXICO); lote em `NOTA_FISCAL_ITEM_LOTE`; volume = `ITEM_EMBALAGEM → EMBALAGEM.FATOR_CONVERSAO`; material/lavável em `ITEM.TIPO_MATERIAL_EMBALAGEM/CARACTERISTICA_EMBALAGEM`.

## Produtor Rural
- **Registrar Atividades** (`/produtor-rural/registro-atividade/form`): cabeçalho `#configuracaoAtividade #controleSafra #planejamentoSafra #fazenda #reagCulturaPlantio #atividade` (há painel de filtro oculto com labels iguais — usar o id ou `label:visible`). Seções Áreas/Talhões, Insumos, Máquinas, Serviços (Adicionar no card).
  - Serviços: `#item`, `#quantidade`, `#valorUnitario` → `REGISTRO_ATIVIDADE_SERVICO.ID_ITEM_FILIAL`. Remover: lixeira → "Excluir".
  - Insumos: `#item` (sem imobilizado), `#localEstoque`, quantidade, valor.
  - Máquinas: `#patrimonio`, contador inicial/final, valor. Configuração de Patrimônio exige ao menos uma máquina ("Natureza de operação do tipo apontamento de patrimônio necessita de pelo menos uma máquina").
- **Planejamento de Safra** (`/produtor-rural/planejamento-safra/form?id=N`): lápis da atividade → "Nova atividade" (ÁREAS/INSUMOS/MÁQUINAS); INSUMOS → "Novo item" (`#descricao0` livre, `#unidadeMedida0`, `#quantidadeHa0`, `#valorUnitario0`) → Adicionar → Salvar → `PLAN_SAFRA_ATV_ITEM`. Gerar deu NPE sem configuração de atividade (AT e produção, 07/10/2026).
- **Recomendação Agronômica**: assistente Fazenda → Área → Cultivar → Itens; na etapa Cultivar são obrigatórios o cultivar e o percentual por talhão.

## Cereais
- Regra de Cobrança de Serviços (`/romaneio/regra-cobranca-servicos`): multiselects Cereais/Safras/Natureza (clicar no painel); Serviço pode ficar desabilitado; Vigência só por clique nos dias; Desconto de umidade obrigatório com Cobrar secagem = Sim (sem TIPO_DESCONTO na base, marcar "Não"); salvar pede "Sim".
