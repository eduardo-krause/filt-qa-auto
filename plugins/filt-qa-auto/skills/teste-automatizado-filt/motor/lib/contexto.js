// O "t" que cada caso recebe: dá acesso à tela, ao banco, aos passos prontos e registra tudo o que aconteceu.
const fs = require('fs');
const path = require('path');
const tela = require('./tela');
const banco = require('./banco');
const rede = require('./rede');

class FalhaConferencia extends Error {}

// compara esperado × obtido: números com tolerância de centavo; objeto = só as chaves do esperado
function iguais(esperado, obtido) {
  if (esperado instanceof RegExp) return esperado.test(String(obtido));
  if (typeof esperado === 'number' || (typeof obtido === 'number' && !isNaN(Number(esperado)) && esperado !== null && esperado !== '')) return Math.abs(Number(esperado) - Number(obtido)) < 0.005;
  // lista: mesmo tamanho e item a item (antes só conferia os índices do esperado — [] passava com qualquer lista)
  if (Array.isArray(esperado)) return Array.isArray(obtido) && obtido.length === esperado.length && esperado.every((v, i) => iguais(v, obtido[i]));
  if (esperado && typeof esperado === 'object') return obtido && typeof obtido === 'object' && Object.keys(esperado).every((k) => iguais(esperado[k], obtido[k]));
  return String(esperado ?? '').trim() === String(obtido ?? '').trim();
}

const mostrar = (v) => (v instanceof RegExp ? String(v) : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
const resumo = (a) => { if (a === undefined) return ''; const s = JSON.stringify(a); return s.length > 140 ? s.slice(0, 137) + '...' : s; };

// Carrega passos/<área>/<tela>/<cenário>.js → t.passos.<área>.<tela>.<função>(args), registrando cada chamada como passo.
// Uma pasta por tela; um arquivo por cenário, com o nome da ação (criar-pedido.js, excluir-nota.js...). As funções de todos os
// cenários da tela respondem juntas no objeto da tela. Nome com hífen também responde em camelCase (pedido-venda → pedidoVenda).
// Arquivos que começam com "_" (passos/_comum.js, <tela>/_apoio.js...) são de apoio e não viram passo.
// passos/_atalhos.js mantém os nomes antigos (t.passos.vendas.pedido.criar...) apontando para a tela nova.
function carregarPassos(t, pastas) {
  const arvore = {};
  const camel = (n) => n.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const registrar = (area, tela, cenario, mod) => {
    arvore[area] = arvore[area] || {};
    const alvo = (arvore[area][tela] = arvore[area][tela] || {});
    if (camel(tela) !== tela) arvore[area][camel(tela)] = alvo;
    for (const [fn, f] of Object.entries(mod)) {
      if (typeof f !== 'function') continue;
      if (alvo[fn]) throw new Error(`passos: a função ${fn} aparece em dois cenários da tela ${area}/${tela} (${cenario})`);
      alvo[fn] = (args) => t.passo(`${area}.${tela}.${fn} ${resumo(args)}`, () => f(t, args || {}));
    }
  };
  const ehJs = (f) => f.endsWith('.js') && !f.startsWith('_');
  for (const raiz of pastas) {
    if (!fs.existsSync(raiz)) continue;
    for (const area of fs.readdirSync(raiz)) {
      const dirArea = path.join(raiz, area);
      if (area.startsWith('_') || !fs.statSync(dirArea).isDirectory()) continue;
      for (const item of fs.readdirSync(dirArea)) {
        const p2 = path.join(dirArea, item);
        if (fs.statSync(p2).isDirectory()) {
          for (const arq of fs.readdirSync(p2).filter(ehJs)) registrar(area, item, arq, require(path.join(p2, arq)));
        } else if (ehJs(item)) registrar(area, item.replace(/\.js$/, ''), item, require(p2));   // formato antigo (arquivo direto na área)
      }
    }
    const arqAtalhos = path.join(raiz, '_atalhos.js');
    if (fs.existsSync(arqAtalhos)) {
      for (const [antigo, novos] of Object.entries(require(arqAtalhos))) {
        const [a, n] = antigo.split('.');
        if (arvore[a] && arvore[a][n]) continue;
        const junto = {};
        for (const destino of novos) { const [a2, t2] = destino.split('.'); Object.assign(junto, (arvore[a2] || {})[t2] || {}); }
        if (Object.keys(junto).length) { arvore[a] = arvore[a] || {}; arvore[a][n] = junto; if (camel(n) !== n && !arvore[a][camel(n)]) arvore[a][camel(n)] = junto; }
      }
    }
  }
  return arvore;
}

function criar({ p, suite, caso, guardadosDe, pastasPassos }) {
  const reg = { passos: [], conferencias: [], guardados: {}, notas: [] };
  const t = {
    p, tela, banco, dados: suite.dados || {}, caso, registro: reg,

    // Executa um bloco como passo nomeado (aparece no resultado). Erro no passo → o caso para com evidência.
    async passo(descricao, fn) {
      const ini = Date.now(); const item = { passo: descricao, inicio: new Date(ini).toISOString() };
      reg.passos.push(item);
      try {
        const r = await fn();
        item.ms = Date.now() - ini;
        if (r !== undefined) item.retorno = resumo(r);
        return r;
      } catch (e) {
        item.ms = Date.now() - ini; item.erro = e.message.split('\n').slice(0, 4).join(' ');
        if (!e.evidencia && !(e instanceof FalhaConferencia)) e.evidencia = await tela.evidencia(p, ini);
        throw e;
      }
    },

    // Conferência esperado × obtido. Diferente → caso FALHOU (para, a menos que {continuar:true}).
    confere(descricao, obtido, esperado, { continuar = false } = {}) {
      const ok = iguais(esperado, obtido);
      reg.conferencias.push({ descricao, esperado: mostrar(esperado), obtido: mostrar(obtido), ok });
      if (!ok && !continuar) throw new FalhaConferencia(`${descricao}: esperado ${mostrar(esperado)}, obtido ${mostrar(obtido)}`);
      return ok;
    },

    // Confere a 1ª linha de uma consulta contra um objeto esperado (só as colunas informadas).
    async confereBanco(descricao, sql, params, esperado, opcoes) {
      const l = await banco.linha(sql, params);
      const obtido = l ? Object.fromEntries(Object.keys(esperado).map((k) => [k, l[k]])) : null;
      return t.confere(descricao, obtido, esperado, opcoes);
    },

    // Guarda um dado criado no caso (nº do pedido, nota...) — aparece no resultado e outros casos leem com t.de().
    guardar(chave, valor) { reg.guardados[chave] = valor; return valor; },
    de(idCaso) { const g = guardadosDe(idCaso); if (!g) throw new Error(`o caso ${idCaso} não guardou dados (rodou antes? passou?)`); return g; },
    anotar(texto) { reg.notas.push(texto); },

    // datas no formato da tela: t.hoje() = dd/mm/aaaa de hoje; t.hoje(30) = daqui a 30 dias
    hoje(dias = 0) { const d = new Date(Date.now() + dias * 86400000); return [d.getDate(), d.getMonth() + 1].map((x) => String(x).padStart(2, '0')).join('/') + '/' + d.getFullYear(); },
    esperar: (ms) => p.waitForTimeout(ms),
    pronto: (folga) => tela.pronto(p, folga),
  };
  t.passos = carregarPassos(t, pastasPassos);
  return t;
}

// Status final de um caso que terminou sem exceção: OK só com pelo menos uma conferência registrada e todas certas.
// Sem conferência = ERRO da automação (o caso não comprovou nada); conferência {continuar:true} errada = FALHOU.
function statusFinal(c, conferencias) {
  if (c.status !== 'OK') return;
  if (!conferencias.length) { c.status = 'ERRO'; c.erro = 'nenhuma conferência registrada — o caso terminou sem comprovar o esperado (falta t.confere na suíte)'; return; }
  const erradas = conferencias.filter((x) => !x.ok);
  if (erradas.length) { c.status = 'FALHOU'; c.erro = 'conferência(s) com valor diferente: ' + erradas.map((x) => x.descricao).join('; '); }
}

module.exports = { criar, iguais, statusFinal, FalhaConferencia, AtTravado: rede.AtTravado };
