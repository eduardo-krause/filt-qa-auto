#!/usr/bin/env node
// Gera o ÍNDICE POR TELA de todos os testes automatizados da máquina:
// lê <pasta de trabalho>/<tarefa>/automacao/suite.js de cada tarefa e agrupa os casos pelas telas que eles usam,
// com o resultado da última execução. Saída: <pasta de trabalho>/indice-testes-automatizados.md
//
//   node indice.js
const fs = require('fs');
const path = require('path');
const cfg = require('./lib/config');
const { ICONE } = require('./lib/resultado');

const raiz = cfg.pastaHistorico();
const porTela = {}; const suites = [];
for (const tarefa of fs.readdirSync(raiz).filter((d) => /^NMTZ-\d+$/.test(d)).sort()) {
  const arq = path.join(raiz, tarefa, 'automacao', 'suite.js');
  if (!fs.existsSync(arq)) continue;
  let suite; try { suite = require(arq); } catch (e) { suites.push({ tarefa, erro: e.message.split('\n')[0] }); continue; }
  let ultimo = null; try { ultimo = JSON.parse(fs.readFileSync(path.join(raiz, tarefa, 'automacao', 'resultados', 'ultimo.json'), 'utf8')); } catch (e) {}
  const st = (id) => { const c = ultimo && ultimo.casos.find((x) => x.id === String(id)); return c ? `${ICONE[c.status] || ''} ${c.status}` : '— não rodou'; };
  suites.push({ tarefa, titulo: suite.titulo, casos: suite.casos.length, ultimo: ultimo ? `${ultimo.inicio.slice(0, 16).replace('T', ' ')} (front ${ultimo.versaoFront || '?'})` : 'nunca' });
  for (const c of suite.casos) for (const tela of c.telas && c.telas.length ? c.telas : ['(tela não informada)']) {
    (porTela[tela] = porTela[tela] || []).push(`| ${tarefa} | ${c.id} | ${c.titulo} | ${st(c.id)} |`);
  }
}
const l = ['# Testes automatizados — índice por tela', '', `Gerado em ${new Date().toLocaleString('pt-BR')} a partir de \`${raiz}\`.`, '', '## Suítes', '', '| Tarefa | Suíte | Casos | Última execução |', '|---|---|---|---|'];
for (const s of suites) l.push(s.erro ? `| ${s.tarefa} | ⚠️ erro ao ler: ${s.erro} | | |` : `| ${s.tarefa} | ${s.titulo} | ${s.casos} | ${s.ultimo} |`);
for (const tela of Object.keys(porTela).sort((a, b) => a.localeCompare(b, 'pt'))) {
  l.push('', `## ${tela}`, '', '| Tarefa | Caso | O que testa | Última execução |', '|---|---|---|---|', ...porTela[tela]);
}
const saida = path.join(raiz, 'indice-testes-automatizados.md');
fs.writeFileSync(saida, l.join('\n') + '\n');
console.log(`${suites.length} suíte(s), ${Object.keys(porTela).length} tela(s) → ${saida}`);
