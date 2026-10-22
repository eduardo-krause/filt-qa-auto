No banco de cada cliente (schema `CLIENTE_<codigo>`), a tabela **`NOTA_FISCAL`** tem a coluna **`ENTRADA_SAIDA`** (`varchar(1)`) que identifica se a nota é de entrada (`'E'`) ou saída (`'S'`), de acordo com a natureza de operação (`ID_NATUREZA_OPERACAO_FILIAL` → `NATUREZA_OPERACAO_FILIAL`). Colunas relacionadas na mesma tabela: `DATA_ENTRADA_SAIDA` e `HORA_ENTRADA_SAIDA`. Confirmado em `CLIENTE_<id>`: valores existentes só `'E'` e `'S'`.

Ver `ref_database_connection.md` para acesso ao MySQL de homologação.
