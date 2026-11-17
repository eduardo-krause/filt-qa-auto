# Sistema: login, filial, permissões, jobs, notificações e agendamento

## Login e filial
- Nome da base pode ter espaço duplo (ex.: "AGROGARRA  24-09"); comparar o texto exato (ou ler o aria-label do `li`). O id↔nome aparece em `GET /api/oauth/cliente`.
- Login com usuário sem acesso à base derruba a sessão do principal (logar de novo). Autocomplete devolvendo 401 = sessão expirou.
- O login cai na última filial acessada; a filial escolhida persiste no usuário e o filtro salvo dos relatórios é por filial. Na troca, a matriz aparece com o código 1000 (`FILIAL.FILIAL`), embora `ID_FILIAL=1` — escolher pelo nome.
- O botão da filial (`.toolbar-btn-empresa`) fica coberto pelo painel lateral dos relatórios: trocar a partir de uma tela sem painel e conferir a filial no fim. Tela aberta de outra filial cai em /401.
- Alguns painéis de filtro (ex.: Reenvio de XML) abrem fora da tela em 1600px.
- O sistema não tem troca de idioma pela tela (só o build /pt/).
- Na BARRACA 290826 os módulos Produtor Rural, Produção Interna e REAG não estão liberados (supervisor recebe /401).
- Logo do PDF dos relatórios vem de `FILIAL.URL_LOGO` (S3 público).

## Permissões (complemento de `fluxos-de-tela.md`)
- A permissão nova vale após novo login do usuário.
- Sem a permissão: rota cai em /401; API de listagem/ação devolve 403 `access_denied`.
- Grupo pela API (logado como supervisor): `GET /api/master/grupo-usuario/<id>` e `PUT /api/master/grupo-usuario` com `acoes:[{id?, acao:{id:<MENU_ACAO id>, temAcesso:true, idMenu}}]`; linha existente vai com o `id` dela, senão 400 "Registro duplicado".
- Usuário: `GET/PUT /api/master/usuario` (`grupoUsuarioFilialList[].grupoUsuario.id` por filial). Vincular Pessoa pela API dá 400 TransientPropertyValueException — usar a tela.
- Tela nova ou alterada pode depender da permissão de outros cadastros (ex.: painel de Metas × Cadastro de Metas, bug NMTZ-12565): testar o usuário com **só** a permissão da tela.

## Relatórios (geral)
- Filtros em painel lateral; sem data pede confirmação "Nenhuma data foi selecionada... Sim". NF Emitidas tem limite de 50.000 registros (400 pedindo para refinar).
- Agendar relatório (ex.: `/fiscal/relatorios/livro-de-entradas`): primeiro "Filtrar" para aparecer "Agendar Envio"; abas Parâmetros/Agendamento; checkbox por `.p-checkbox-box`; botão "Agendar". Tabelas `AGENDAMENTO_RELATORIO` (DATA_ULTIMO_ENVIO/DATA_PROXIMO_ENVIO) e `AGENDAMENTO_RELATORIO_USUARIO`. `ID_DIA_SEMANA` 5 = sexta.

## Jobs e notificações
- Disparar job: GET/POST em `https://erp-homologacao[-nmtz-N].viasoftcloud.com.br/api/job/<rota>`; no AT com cabeçalho `X-Namespace: nmtz-N`. HTTP 000 após 5–10 min é o gateway; o job segue — conferir no banco.
- `NOTIFICACAO.DATA` é UTC; `ID_USUARIO` é o id do master/OAuth (não o USUARIO local).
- Central de Notificações (`/master/configuracao-notificacao/form?id=N`): inscrever o usuário na rotina (4 aniversariantes, 5 dup. receber, 6 dup. pagar, 12 certificado, 15 nota pendente).
