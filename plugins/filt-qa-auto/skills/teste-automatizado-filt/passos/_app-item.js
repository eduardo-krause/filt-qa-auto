// Ações da tela "Adicionar ao Carrinho" / edição do item no app Filt Pedido (via adb.js)
const a = require('./_adb');

const ehQuantidadeTratar = (e) => !e.habilitado && e.tipo !== 'EditText' && /^(\d[\d.,]*|—)$/.test(e.rotulo);

function topo() { a.fecharTeclado(); for (let i = 0; i < 6; i++) { if (a.elementos().some(e => /Quantidade \| Saldo/.test(e.rotulo))) return; a.rolar('cima'); } }
function cardAplicacoes() {
  a.fecharTeclado();
  for (let i = 0; i < 6; i++) { const els = a.elementos(); if (els.some(ehQuantidadeTratar)) return els; a.rolar('baixo'); }
  throw new Error('card Aplicações não apareceu. Tela:\n' + a.tela());
}

// quantidade em número (10 → digita 1000 por causa da máscara de 2 casas)
function quantidade(q) { topo(); a.campo(1, String(Math.round(q * 100))); a.fecharTeclado(); return a.campos()[1].rotulo; }
function aplicacoes(n) {
  const els = cardAplicacoes(); const qt = els.find(ehQuantidadeTratar);
  const campo = els.filter(e => e.tipo === 'EditText' && Math.abs(e.y - qt.y) < 60)[0];
  a.tocarXY(campo.x, campo.y); a.limpar(); if (n !== '' && n !== undefined) a.digitar(String(n)); a.fecharTeclado();
  return lerAplicacoes();
}
function lerAplicacoes() {
  const els = cardAplicacoes(); const qt = els.find(ehQuantidadeTratar);
  const campo = els.filter(e => e.tipo === 'EditText' && Math.abs(e.y - qt.y) < 60)[0];
  const aviso = els.find(e => /obrigatório|Inválido/i.test(e.rotulo));
  return { numero: campo ? campo.rotulo : null, quantidadeTratar: qt.rotulo, aviso: aviso ? aviso.rotulo : null };
}
function quantidadeTratar() { return lerAplicacoes().quantidadeTratar; }

// abre o lápis do card e escolhe a linha que contém o texto (rola a lista)
function abrirCard(rotulo) {
  topo();
  for (let i = 0; i < 6; i++) {
    const c = a.elementos().find(e => e.rotulo.startsWith(rotulo));
    if (c) { a.tocarXY(948, Math.min(c.y, c.y1 + 110)); a.esperar(1500); if (a.elementos().some(e => e.rotulo === 'Adicionar ao Carrinho' || e.rotulo === 'Editar Item')) { a.tocarXY(540, c.y); a.esperar(1500); } return; }
    a.rolar('baixo');
  }
  throw new Error('card ' + rotulo + ' não achado');
}
function escolherNaLista(texto) {
  for (let i = 0; i < 25; i++) {
    const e = a.elementos().find(x => x.rotulo.includes(texto));
    if (e) { a.tocarXY(e.x, e.y); a.esperar(1500); return e.rotulo; }
    a.rolar('baixo');
  }
  throw new Error('"' + texto + '" não achado na lista');
}
// busca pela lupa (ao reabrir, a lista só aparece depois de digitar — ver relatório)
function receituario(texto, busca) {
  abrirCard('Receituário padrão');
  a.tocarXY(1016, 202); a.esperar(1000); a.digitar(busca || texto); a.esperar(1500); a.fecharTeclado();
  return escolherNaLista(texto);
}
function equipamento(texto) { abrirCard('Equipamento de aplicação'); return escolherNaLista(texto); }

// botão flutuante (carrinho / salvar) no canto inferior direito
function confirmar() { a.fecharTeclado(); const b = a.elementos().filter(e => e.x > 850 && e.y > 1900 && e.clicavel).pop(); a.tocarXY(b ? b.x : 964, b ? b.y : 2222); a.esperar(2500); return a.tela(); }

// na busca de itens do pedido: pesquisa, toca no carrinho do card, preenche e confirma. Devolve o que o card Aplicações mostrou.
function adicionarItem({ busca, item, receituario: rec, buscaRec, equipamento: eq, qtd, aplicacoes: n }) {
  const campoBusca = a.campos()[0]; a.tocarXY(campoBusca.x, campoBusca.y); a.limpar(); a.digitar(busca);
  a.sh('shell', 'input', 'keyevent', '66'); const card = a.esperarTexto(item);
  a.tocarXY(936, card.y2 - 90); a.esperarTexto('Adicionar ao Carrinho');
  if (rec) receituario(rec, buscaRec);
  if (eq) equipamento(eq);
  if (qtd !== undefined) quantidade(qtd);
  if (n !== undefined) aplicacoes(n);
  const lido = lerAplicacoes();
  const depois = confirmar();
  return { ...lido, confirmado: !/Adicionar ao Carrinho/.test(depois) };
}

module.exports = { adicionarItem, topo, cardAplicacoes, quantidade, aplicacoes, lerAplicacoes, quantidadeTratar, receituario, equipamento, confirmar, escolherNaLista };

if (require.main === module) {
  const [cmd, ...r] = process.argv.slice(2);
  const f = module.exports[cmd];
  if (!f) { console.log('comandos: ' + Object.keys(module.exports).join(', ')); process.exit(1); }
  try { const v = f(...r.map(x => (x !== '' && !isNaN(x) && cmd !== 'receituario' && cmd !== 'equipamento') ? Number(x) : x)); console.log(typeof v === 'string' ? v : JSON.stringify(v)); }
  catch (e) { console.log('ERRO: ' + e.message); process.exitCode = 1; }
}
