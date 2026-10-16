#!/usr/bin/env node
// Roda uma suíte de testes automatizados no AT da tarefa.
//
//   node executar.js <caminho da suite.js> [opções]
//
//   --listar            só mostra os casos da suíte (não abre navegador)
//   --casos 1,2,R01     roda só esses casos (os casos de que eles dependem rodam junto)
//   --de 5              começa do caso 5 (na ordem da suíte)
//   --parar             para no primeiro caso que não der OK
//   --fechar            fecha o navegador do motor no fim
//
// Saída: uma linha por caso no terminal; o detalhe vai para <pasta da tarefa>/automacao/resultados/ (ultimo.md).
const path = require('path');
const fs = require('fs');

const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const tem = (n) => argv.includes(n);
const arqSuite = argv.find((a) => !a.startsWith('--') && /\.js$/.test(a));
if (!arqSuite) { console.log('uso: node executar.js <suite.js> [--listar] [--casos a,b] [--de id] [--parar] [--fechar]'); process.exit(2); }
const suite = require(path.resolve(arqSuite));
if (!suite.tarefa || !Array.isArray(suite.casos)) { console.log('ERRO: a suíte precisa exportar { tarefa, at, casos: [...] } (ver modelos/suite-modelo.js)'); process.exit(2); }

// a tarefa da suíte define sessão, porta e perfil do navegador (antes de carregar a configuração)
process.env.FILT_QA_TAREFA = suite.tarefa;
const cfg = require('./lib/config');
const navegador = require('./lib/navegador');
const login = require('./lib/login');
const banco = require('./lib/banco');
const rede = require('./lib/rede');
const contexto = require('./lib/contexto');
const resultado = require('./lib/resultado');

const ids = suite.casos.map((c) => String(c.id));
if (new Set(ids).size !== ids.length) { console.log('ERRO: há casos com id repetido na suíte'); process.exit(2); }

if (tem('--listar')) {
  for (const c of suite.casos) console.log(`${String(c.id).padEnd(6)} ${c.titulo}${c.depende ? `  (depende de ${[].concat(c.depende).join(', ')})` : ''}${c.telas ? `  [${c.telas.join(', ')}]` : ''}`);
  process.exit(0);
}

// seleção: --casos inclui as dependências; --de corta pela ordem
function selecionar() {
  let sel = suite.casos;
  if (opt('--de')) { const i = ids.indexOf(String(opt('--de'))); if (i < 0) throw new Error('caso --de não existe: ' + opt('--de')); sel = sel.slice(i); }
  if (opt('--casos')) {
    const quer = new Set(opt('--casos').split(',').map((s) => s.trim()));
    const add = (id) => { const c = suite.casos.find((x) => String(x.id) === id); if (!c) throw new Error('caso não existe: ' + id); [].concat(c.depende || []).forEach((d) => add(String(d))); quer.add(id); };
    [...quer].forEach(add);
    sel = suite.casos.filter((c) => quer.has(String(c.id)));
  }
  return sel;
}

// promessa rejeitada que ficou sem dono num passo (ex.: espera de aba nova) não pode derrubar a suíte inteira
process.on('unhandledRejection', (e) => { console.log('      (aviso: erro solto ignorado — ' + String(e && e.message || e).split('\n')[0] + ')'); });

const linhaCaso = (c) => `${resultado.ICONE[c.status] || ''} ${c.status.padEnd(9)} ${String(c.id).padEnd(6)} ${c.titulo} (${Math.round(c.ms / 1000)}s)`;

(async () => {
  const selecionados = selecionar();
  const pastaSuite = path.dirname(path.resolve(arqSuite));
  const pastaSaida = suite.pastaResultados || pastaSuite;
  const pastasPassos = [path.join(__dirname, '..', 'passos'), path.join(pastaSuite, 'passos')];
  const r = { tarefa: suite.tarefa, titulo: suite.titulo, at: suite.at, inicio: new Date().toISOString(), casos: [], ms: 0 };
  const t0 = Date.now();
  const salvar = () => { r.ms = Date.now() - t0; return resultado.gravar(pastaSaida, r); };

  const { p } = await navegador.conectar();
  rede.instalar(p);
  try {
    const s = await login(p, { tarefa: suite.tarefa, url: suite.at.url, base: suite.at.base, usuario: suite.at.usuario });
    r.banco = s.banco;
    r.versaoFront = await p.evaluate(() => (performance.getEntriesByType('resource').map((e) => e.name).find((n) => /main\.js\?version=/.test(n)) || '').replace(/.*version=/, '')).catch(() => null);
    const dfe = await banco.conferirDfe();
    if (!dfe.ok) throw new Error(dfe.bloqueio);
    // preparar(t): conferências antes dos casos (estoque, cadastros...). Erro aqui = nada roda, com o motivo.
    if (typeof suite.preparar === 'function') {
      const tp = contexto.criar({ p, suite, caso: { id: 'preparar' }, pastasPassos, guardadosDe: () => null });
      await suite.preparar(tp);
    }
    console.log(`AT ${suite.at.url} · base ${s.empresa} · ${s.banco} · front ${r.versaoFront || '?'} · DF-e ok · ${selecionados.length} caso(s)`);
  } catch (e) {
    r.interrompido = e.message; salvar();
    console.log('⛔ ' + e.message); await banco.fechar(); process.exit(1);
  }

  const resultados = new Map();
  for (const caso of selecionados) {
    const c = { id: String(caso.id), titulo: caso.titulo, origem: caso.origem, cenario: caso.cenario, esperado: caso.esperado, telas: caso.telas || [], status: 'OK', passos: [], conferencias: [], guardados: {}, notas: [], ms: 0 };
    r.casos.push(c);
    const ini = Date.now();
    if (r.interrompido) { c.status = 'PULADO'; c.motivo = 'execução interrompida antes'; continue; }
    if (caso.manual || typeof caso.executar !== 'function') { c.status = 'PULADO'; c.motivo = 'manual: ' + (caso.manual || 'caso sem executar()'); resultados.set(c.id, c); console.log(linhaCaso(c)); continue; }
    const dep = [].concat(caso.depende || []).map(String).find((d) => !resultados.has(d) || resultados.get(d).status !== 'OK');
    if (dep) { c.status = 'PULADO'; c.motivo = `depende do caso ${dep}, que não deu OK`; resultados.set(c.id, c); console.log(linhaCaso(c)); continue; }
    const t = contexto.criar({ p, suite, caso: c, pastasPassos, guardadosDe: (id) => (resultados.get(String(id)) || {}).guardados });
    const limiteCaso = (suite.limiteCasoMin || 10) * 60000;
    let relogio;
    try {
      // nenhum caso pode prender a suíte: passou do limite, vira ERRO e segue para o próximo
      await Promise.race([
        caso.executar(t),
        new Promise((_, rej) => { relogio = setTimeout(() => rej(new Error(`caso passou de ${limiteCaso / 60000} min (tela ou navegador sem responder)`)), limiteCaso); }),
      ]);
    } catch (e) {
      c.erro = e.message.split('\n').slice(0, 4).join(' ');
      const ultimo = t.registro.passos[t.registro.passos.length - 1]; c.parouEm = ultimo && ultimo.passo;
      if (e.evidencia) c.evidencia = e.evidencia;
      if (e instanceof contexto.FalhaConferencia) c.status = 'FALHOU';
      else if (e instanceof contexto.AtTravado || /PROBLEMA NO AT|BLOQUEADO|ALERTA/.test(e.message)) { c.status = 'BLOQUEADO'; r.interrompido = e.message; }
      else c.status = 'ERRO';
    }
    clearTimeout(relogio);
    // conferência registrada com { continuar: true } que deu errado também reprova o caso
    if (c.status === 'OK' && t.registro.conferencias.some((x) => !x.ok)) { c.status = 'FALHOU'; c.erro = 'conferência(s) com valor diferente: ' + t.registro.conferencias.filter((x) => !x.ok).map((x) => x.descricao).join('; '); }
    Object.assign(c, { passos: t.registro.passos, conferencias: t.registro.conferencias, guardados: t.registro.guardados, notas: t.registro.notas, ms: Date.now() - ini });
    resultados.set(c.id, c);
    console.log(linhaCaso(c) + (c.status !== 'OK' ? `\n      ↳ ${c.erro}${c.parouEm ? `  [passo: ${c.parouEm}]` : ''}` : ''));
    salvar();
    if (tem('--parar') && c.status !== 'OK') { r.interrompido = r.interrompido || `--parar: caso ${c.id} deu ${c.status}`; }
  }
  const arqs = salvar();
  await banco.fechar();
  if (r.interrompido) console.log('⛔ Interrompido: ' + r.interrompido);
  console.log('Detalhe: ' + arqs.md);
  if (tem('--fechar')) navegador.parar();
  process.exit(r.casos.every((c) => c.status === 'OK') ? 0 : 1);
})().catch(async (e) => { console.log('ERRO no motor: ' + e.stack); await banco.fechar(); process.exit(1); });
