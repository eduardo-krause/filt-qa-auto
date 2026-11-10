# Primeira vez — preparar a máquina e os dados da pessoa

A pessoa só instalou o plugin; **todo o resto é feito aqui, sem pedir que ela rode comando**. Antes de qualquer validação:
0. Rodar `python migrar_filt_qa.py` (pasta `ferramentas`). Se a máquina tinha o plugin antigo **filt-qa** (skill `/validar-tarefa-filt`), ele é desinstalado junto com o marketplace e as tarefas agendadas dele ("filt-qa - atualizar plugin", "filt-qa - enviar regras"); o `config.json` antigo continua valendo (mesmo lugar e formato), então o passo 4 só pede o que faltar. Também agenda a atualização semanal do filt-qa-auto. Pode repetir sem problema.
1. Rodar `python configurar.py` (na pasta `ferramentas` desta skill; **no Linux/WSL use `python3`** em todos os comandos Python deste skill). Ele instala o que falta (bibliotecas Python, Playwright, navegador, ffmpeg), descobre os caminhos e cria `~/.claude/filt-qa/config.json`. Devolve um JSON com `feito`, `faltando_programas`, `avisos` e `config.faltando`.
2. Se vier `faltando_programas` (Node.js ou Git):
   - **Windows:** avisar em uma frase ("vou instalar o Node.js, que o teste automatizado usa") e instalar com o comando `winget` informado.
   - **Linux/WSL:** os comandos vêm em `precisa_sudo` e pedem a senha da pessoa, então **eu não rodo**: mostro o comando pronto e peço que ela cole no Claude Code com `!` na frente (ex.: `! sudo apt-get install -y git`). Uma linha por vez, explicando para que serve.
   Depois rodar `configurar.py` de novo. `precisa_sudo` também pode trazer o `install-deps` do navegador (bibliotecas de sistema que o Chromium precisa no Linux).
3. Se vier `avisos`: resolver (ex.: repetir a instalação do navegador). Se não conseguir, explicar em linguagem simples o que falhou.
4. **Pedir na conversa só os dados pessoais que faltam** (`config.faltando` e, se fizer sentido, `opcionais_faltando`), em uma mensagem só, dizendo para que serve cada um:
   - login do ERP: CPF e senha do usuário **principal** (e do **secundário**, se a pessoa for validar permissões);
   - banco de homologação: host, porta, usuário e senha;
   - **chaves de API (pedir sempre — poupam tokens da pessoa):**
     - **Jira** (`jira.email` + `jira.token`): e-mail da Viasoft e token criado em https://id.atlassian.com/manage-profile/security/api-tokens › *Criar token de API*. Com ele a tarefa é lida por `jira.py` (texto limpo, ~10x menos contexto que o conector MCP) e `jira.py <NMTZ> dev` mostra os repositórios alterados.
     - **Jenkins** (`jenkins.usuario` + `jenkins.token`): e-mail da Viasoft e token criado no Jarvis (https://jarvis.viasoftcloud.com.br) › nome da pessoa no canto superior direito › *Security* › *API Token* › *Add new Token*. Com ele `apk.py` gera, baixa e instala o APK do app da tarefa sozinho.
     Explicar o passo a passo de criação acima. A pessoa pode colar o token na conversa ou gravar ela mesma no `config.json`; se não quiser criar, deixar vazio (o Jira cai no conector MCP e o APK é gerado por ela).
   - opcionais: conta do Figma, **bases de teste dela** em produção (nomes exatos do login) e acesso somente leitura ao banco de produção.
5. Gravar as respostas **somente** em `~/.claude/filt-qa/config.json` e rodar `python checar_config.py` até `ok: true`. Confirmar para a pessoa, em linguagem simples, que está tudo pronto, sem repetir nenhuma senha.

**Regras dos dados pessoais:**
- Cada pessoa usa **as próprias** credenciais. Nunca reaproveitar dados de outra pessoa, nem pegar de outro config, memória ou histórico.
- **Nunca** escrever CPF, senha, host ou usuário de banco no plugin, no repositório, na memória, no relatório ou em mensagem de commit. Na resposta, não repetir a senha informada: confirmar só que foi salva.
- Se a pessoa não tiver algum acesso (ex.: banco de produção), deixar o campo vazio. A parte que depende dele fica NÃO TESTÁVEL, com o motivo.
