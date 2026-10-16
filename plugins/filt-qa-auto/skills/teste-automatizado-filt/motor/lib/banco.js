// Banco de homologação — SOMENTE LEITURA e SOMENTE no banco do AT da tarefa (CLIENTE_<id> capturado no login).
// O motor nunca escreve no banco: tudo que muda dado é feito pela tela.
const mysql = require('mysql2/promise');
const cfg = require('./config');

const LEITURA = /^\s*(select|show|describe|desc|explain|with)\b/i;
let conexao = null;

function banco() {
  const b = cfg.lerSessao().banco;
  if (!b) throw new Error('BLOQUEADO: faça o login no AT da tarefa primeiro — o banco vem de lá.');
  return b;
}

async function conectar() {
  if (conexao) return conexao;
  const b = banco();
  try {
    conexao = await mysql.createConnection({ host: cfg.db.host, port: cfg.db.port, user: cfg.db.user, password: cfg.db.password, database: b, charset: 'utf8mb4', dateStrings: true });
  } catch (e) {
    if (e.errno === 1049) throw new Error(`PROBLEMA NO AT DA TAREFA — banco ${b} não existe. Reportar à pessoa para corrigir o AT (não usar outro banco).`);
    throw e;
  }
  return conexao;
}

// bit(1) vem como Buffer: vira 0/1. Decimal vem como texto: vira número.
function normalizar(v) {
  if (Buffer.isBuffer(v)) return v.length === 1 ? v[0] : v.toString();
  if (typeof v === 'string' && /^-?\d+\.\d+$/.test(v)) return Number(v);
  return v;
}

async function consultar(sql, params = []) {
  if (!LEITURA.test(sql)) throw new Error('BLOQUEADO: o motor só faz leitura no banco. Mudança de dado é pela tela.');
  if (/\bCLIENTE_\d+\b/i.test(sql) && !sql.includes(banco())) throw new Error('BLOQUEADO: a consulta cita outro banco. Só o banco do AT da tarefa.');
  const c = await conectar();
  const [linhas] = await c.query(sql, params);
  return linhas.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, normalizar(v)])));
}

async function linha(sql, params = []) { return (await consultar(sql, params))[0] || null; }
async function valor(sql, params = []) { const l = await linha(sql, params); return l ? Object.values(l)[0] : null; }

// Antes de qualquer emissão: nenhum DF-e (NF-e, NFC-e, CT-e, MDF-e) pode estar em PRODUÇÃO.
async function conferirDfe() {
  const ls = await consultar('select ID_FILIAL, NFE_AMBIENTE, NFCE_AMBIENTE, CTE_AMBIENTE, MDFE_AMBIENTE from CONFIGURACAO_DOCUMENTO_FISCAL_ELETRONICO');
  const prod = [];
  for (const l of ls) for (const [doc, col] of [['NF-e', 'NFE_AMBIENTE'], ['NFC-e', 'NFCE_AMBIENTE'], ['CT-e', 'CTE_AMBIENTE'], ['MDF-e', 'MDFE_AMBIENTE']]) if (l[col] === 'PRODUCAO') prod.push(`filial ${l.ID_FILIAL} ${doc}`);
  const res = { ok: !prod.length, filiais: ls, bloqueio: prod.length ? 'DF-e em PRODUÇÃO: ' + prod.join(', ') + ' — NÃO emitir; avisar a pessoa.' : null };
  cfg.gravarSessao({ dfe: { ...res, verificadoEm: new Date().toISOString() } });
  return res;
}

async function fechar() { if (conexao) { await conexao.end().catch(() => {}); conexao = null; } }

module.exports = { banco, consultar, linha, valor, conferirDfe, fechar };
