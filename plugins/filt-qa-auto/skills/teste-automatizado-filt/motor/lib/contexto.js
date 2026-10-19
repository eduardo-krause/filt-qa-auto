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
  if (esperado && typeof esperado === 'object') return obtido && typeof obtido === 'object' && Object.keys(esperado).every((k) => iguais(esperado[k], obtido[k]));
  return String(esperado ?? '').trim() === String(obtido ?? '').trim();
}

const mostrar = (v) => (v instanceof RegExp ? String(v) : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
const resumo = (a) => { if (a === undefined) return ''; const s = JSON.stringify(a); return s.length > 140 ? s.slice(0, 137) + '...' : s; };

// carrega passos/<area>/<arquivo>.js → t.passos.<area>.<arquivo>.<funcao>(args), registrando cada chamada como passo
function carregarPassos(t, pastas) {
  const arvore = {};
  for (const raiz of pastas) {
    if (!fs.existsSync(raiz)) continue;
    for (const area of fs.readdirSync(raiz)) {
      const dir = path.join(raiz, area);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const arq of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
        const nome = arq.replace(/\.js$/, '');
        const mod = require(path.join(dir, arq));
        arvore[area] = arvore[area] || {};
        arvore[area][nome] = arvore[area][nome] || {};
        for (const [fn, f] of Object.entries(mod)) {
          if (typeof f !== 'function') continue;
          arvore[area][nome][fn] = (args) => t.passo(`${area}.${nome}.${fn} ${resumo(args)}`, () => f(t, args || {}));
        }
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
