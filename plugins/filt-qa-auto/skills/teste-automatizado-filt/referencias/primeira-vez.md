# Primeira vez — preparar a máquina e os dados da pessoa

A pessoa só instalou o plugin; **todo o resto é feito aqui, sem pedir que ela rode comando**. Antes de qualquer validação:
1. Rodar `python configurar.py` (na pasta `ferramentas` desta skill; **no Linux/WSL use `python3`** em todos os comandos Python deste skill). Ele instala o que falta (bibliotecas Python, Playwright, navegador, ffmpeg), descobre os caminhos e cria `~/.claude/filt-qa/config.json`. Devolve um JSON com `feito`, `faltando_programas`, `avisos` e `config.faltando`.
2. Se vier `faltando_programas` (Node.js ou Git):
   - **Windows:** avisar em uma frase ("vou instalar o Node.js, que o teste automatizado usa") e instalar com o comando `winget` informado.
   - **Linux/WSL:** os comandos vêm em `precisa_sudo` e pedem a senha da pessoa, então **eu não rodo**: mostro o comando pronto e peço que ela cole no Claude Code com `!` na frente (ex.: `! sudo apt-get install -y git`). Uma linha por vez, explicando para que serve.
   Depois rodar `configurar.py` de novo. `precisa_sudo` também pode trazer o `install-deps` do navegador (bibliotecas de sistema que o Chromium precisa no Linux).
3. Se vier `avisos`: resolver (ex.: repetir a instalação do navegador). Se não conseguir, explicar em linguagem simples o que falhou.
4. **Pedir na conversa só os dados pessoais que faltam** (`config.faltando` e, se fizer sentido, `opcionais_faltando`), em uma mensagem só, dizendo para que serve cada um:
   - login do ERP: CPF e senha do usuário **principal** (e do **secundário**, se a pessoa for validar permissões);
   - banco de homologação: host, porta, usuário e senha;
   - opcionais: conta do Figma, **bases de teste dela** em produção (nomes exatos do login) e acesso somente leitura ao banco de produção.
5. Gravar as respostas **somente** em `~/.claude/filt-qa/config.json` e rodar `python checar_config.py` até `ok: true`. Confirmar para a pessoa, em linguagem simples, que está tudo pronto, sem repetir nenhuma senha.

**Regras dos dados pessoais:**
- Cada pessoa usa **as próprias** credenciais. Nunca reaproveitar dados de outra pessoa, nem pegar de outro config, memória ou histórico.
- **Nunca** escrever CPF, senha, host ou usuário de banco no plugin, no repositório, na memória, no relatório ou em mensagem de commit. Na resposta, não repetir a senha informada: confirmar só que foi salva.
- Se a pessoa não tiver algum acesso (ex.: banco de produção), deixar o campo vazio. A parte que depende dele fica NÃO TESTÁVEL, com o motivo.
