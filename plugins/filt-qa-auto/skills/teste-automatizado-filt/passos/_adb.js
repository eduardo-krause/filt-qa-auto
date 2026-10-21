// Apoio do app Android (adb): leitura da tela, toques, digitação tecla a tecla, sincronizar, novo pedido, enviar. Não é passo (fica fora das pastas de área).
// Uso direto na linha de comando: node passos/_adb.js tela | tocar "<texto>" | campo <n> "<texto>" | login [principal|secundario] ...
//   node adb.js tela                      → elementos visíveis (texto/descrição, tipo, centro)
//   node adb.js tocar "<texto>" [n]       → toca no n-ésimo elemento cujo texto/descrição contém <texto>
//   node adb.js tocarXY x y
//   node adb.js campo <n> "<texto>"       → toca no n-ésimo campo de texto (0 = primeiro), limpa e digita
//   node adb.js digitar "<texto>"         → digita no campo com foco
//   node adb.js login [principal]         → preenche CPF/senha do config.json e toca em Entrar
//   node adb.js voltar | rolar [cima|baixo] | print <arquivo.png>
// Também pode ser usado com require() pela suíte.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ADB = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const sh = (...a) => execFileSync(ADB, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const esperar = (ms) => execFileSync(ADB, ['shell', 'sleep', String(ms / 1000)]);

function decodificar(s) {
  return s.replace(/&#10;/g, ' | ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

// Lê a árvore da tela (uiautomator). Flutter expõe os textos em content-desc.
function elementos() {
  sh('shell', 'uiautomator', 'dump', '/sdcard/u.xml');
  const xml = sh('shell', 'cat', '/sdcard/u.xml');
  const lista = [];
  for (const m of xml.matchAll(/<node ([^>]*?)\/?>/g)) {
    const at = {};
    for (const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) at[a[1]] = decodificar(a[2]);
    const b = (at.bounds || '').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!b) continue;
    const [x1, y1, x2, y2] = b.slice(1).map(Number);
    const rotulo = [at.text, at['content-desc'], at.hint].filter(Boolean).join(' / ');
    const tipo = (at.class || '').split('.').pop();
    lista.push({ rotulo, tipo, x: Math.round((x1 + x2) / 2), y: Math.round((y1 + y2) / 2), x1, y1, x2, y2,
      clicavel: at.clickable === 'true', habilitado: at.enabled !== 'false', focado: at.focused === 'true', marcado: at.checked === 'true', senha: at.password === 'true' });
  }
  return lista;
}

function tela() {
  return elementos().filter(e => e.rotulo || e.tipo === 'EditText').map(e =>
    `${e.tipo}${e.habilitado ? '' : ' [bloqueado]'}${e.focado ? ' [foco]'  : ''}${e.marcado ? ' [marcado]' : ''} "${e.rotulo}" @${e.x},${e.y}`).join('\n');
}

function achar(texto, n = 0) {
  const re = texto instanceof RegExp ? texto : new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const todos = elementos().filter(e => re.test(e.rotulo));
  // rótulo idêntico primeiro (ex.: botão "Continuar" antes do texto "clique em continuar")
  const exato = typeof texto === 'string' ? todos.filter(e => e.rotulo.trim().toLowerCase() === texto.toLowerCase()) : [];
  const achados = exato.length > n ? exato : todos;
  if (!achados[n]) throw new Error(`não achei "${texto}" na tela. Tela:\n${tela()}`);
  return achados[n];
}

function tocarXY(x, y) { sh('shell', 'input', 'tap', String(x), String(y)); esperar(800); }
function tocar(texto, n = 0) { const e = achar(texto, n); tocarXY(e.x, e.y); return e; }

// input text não aceita espaço nem alguns símbolos: escapar
// tecla por tecla: com "input text" de uma vez, campos com máscara do Flutter perdem dígitos repetidos ("10000" → 10,00)
function digitar(texto) {
  for (const ch of String(texto)) {
    const s = ch === ' ' ? '%s' : ch.replace(/([\\"'`$&|;<>()*?~!#])/g, '\\$1');
    sh('shell', 'input', 'text', s); esperar(250);
  }
  esperar(400);
}
function limpar() {
  sh('shell', 'input', 'keycombination', '113', '29'); // Ctrl+A
  sh('shell', 'input', 'keyevent', '67');              // apagar
}
function campos() { return elementos().filter(e => e.tipo === 'EditText'); }
function campo(n, texto) {
  const c = campos()[n];
  if (!c) throw new Error(`campo de texto ${n} não existe. Tela:\n${tela()}`);
  tocarXY(c.x, c.y); limpar();
  if (texto !== undefined && texto !== '') digitar(texto);
  return campos()[n];
}
// fecha o teclado só se ele estiver aberto (voltar com teclado fechado sairia da tela)
function fecharTeclado() {
  const s = sh('shell', 'dumpsys', 'input_method');
  if (/mInputShown=true|isInputViewShown=true/.test(s)) { sh('shell', 'input', 'keyevent', '4'); esperar(700); }
}
function voltar() { sh('shell', 'input', 'keyevent', '4'); esperar(800); }
function rolar(sentido = 'baixo') {
  if (sentido === 'baixo') sh('shell', 'input', 'swipe', '540', '1800', '540', '700', '400');
  else sh('shell', 'input', 'swipe', '540', '700', '540', '1800', '400');
  esperar(700);
}
function print(arq) { fs.writeFileSync(arq, execFileSync(ADB, ['exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 })); return arq; }

function login(usuario = 'principal') {
  const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude', 'filt-qa', 'config.json'), 'utf8'));
  const u = cfg.erp.usuarios[usuario];
  campo(0, u.cpf); campo(1, u.senha);
  sh('shell', 'input', 'keyevent', '111'); // fecha o teclado
  tocar('Entrar');
}

// espera até algum elemento casar com o texto/regex (devolve o elemento) — sem espera fixa
function esperarTexto(texto, ms = 60000) {
  const re = texto instanceof RegExp ? texto : new RegExp(texto, 'i');
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    const e = elementos().find(x => re.test(x.rotulo));
    if (e) return e;
    esperar(1000);
  }
  throw new Error(`"${texto}" não apareceu em ${ms / 1000}s. Tela:\n${tela()}`);
}

// Menu › Atualizar dados → espera "Importação concluída" → Continuar
function sincronizar() {
  tocar('Menu | Guia 4 de 4'); tocar('Atualizar dados');
  const e = esperarTexto(/Importação concluída|erro|falha/i, 300000);
  if (!/concluída/i.test(e.rotulo)) throw new Error('sincronização: ' + e.rotulo);
  tocar('Continuar'); esperarTexto('Pedidos | Guia 1 de 4');
  return e.rotulo;
}

// da busca de itens: carrinho → Continuar → FINALIZAR → abre o pedido → ⋮ Sincronizar. Devolve o número "Venda N" do ERP.
function finalizarEnviar() {
  tocarXY(964, 2222); esperarTexto('Carrinho');
  tocar('Continuar'); esperarTexto('Finalizar pedido'); tocar('FINALIZAR'); esperarTexto('PEDIDOS');
  const p = esperarTexto('NÃO SINCRONIZADO'); tocarXY(p.x, p.y); esperarTexto('Dados do Pedido');
  tocarXY(1016, 202); tocar('Sincronizar');
  const ok = esperarTexto(/\| SINCRONIZADO|ERRO|erro|falha/, 180000);
  const venda = elementos().find(e => /^Venda \d+$/.test(e.rotulo));
  voltar();
  return { status: ok.rotulo.slice(-40), pedido: venda ? Number(venda.rotulo.replace(/\D/g, '')) : null };
}

// Pedidos › NOVO → natureza e pessoa (campos do cabeçalho não aparecem no uiautomator: posição fixa)
const CABECALHO = { natureza: [480, 427], pessoa: [480, 653], parametro: [480, 878], forma: [480, 1104], data: [480, 1330] };
function novoPedido({ natureza = 'PEDIDO DE VENDA - À VISTA', cliente }) {
  tocar('Pedidos | Guia 1 de 4'); tocar('NOVO'); esperarTexto('Novo Pedido de Venda');
  tocarXY(...CABECALHO.natureza); tocar(natureza);
  tocarXY(...CABECALHO.pessoa); digitar(cliente); sh('shell', 'input', 'keyevent', '66');
  esperarTexto(cliente); tocar(cliente, elementos().filter(x => new RegExp(cliente, 'i').test(x.rotulo)).length > 1 ? 1 : 0);
  return tela();
}

module.exports = { finalizarEnviar, fecharTeclado, sh, esperar, elementos, tela, achar, tocar, tocarXY, digitar, limpar, campos, campo, voltar, rolar, print, login, esperarTexto, sincronizar, novoPedido, CABECALHO };

if (require.main === module) {
  const [cmd, a, b] = process.argv.slice(2);
  try {
    const r = {
      tela: () => tela(),
      tocar: () => (tocar(a, +(b || 0)), tela()),
      tocarXY: () => (tocarXY(+a, +b), tela()),
      campo: () => (campo(+a, b), tela()),
      digitar: () => (digitar(a), tela()),
      login: () => (login(a || 'principal'), esperar(4000), tela()),
      voltar: () => (voltar(), tela()),
      rolar: () => (rolar(a), tela()),
      print: () => print(a),
    }[cmd];
    if (!r) throw new Error('comando desconhecido: ' + cmd);
    console.log(r());
  } catch (e) { console.log('ERRO: ' + e.message); process.exitCode = 1; }
}
