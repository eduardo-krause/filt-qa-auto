#!/usr/bin/env node
// Gera o MAPA DAS TELAS a partir dos passos que já funcionam (passos/<área>/<tela>/*.js): rota, passos prontos,
// campos (rótulo e id), botões, opções do ⋮ e tabelas do banco que cada tela usa. Só entra o que está nos passos,
// então o mapa nunca afirma nada que não foi visto funcionando. Campo que não estiver aqui → código-fonte (Z:).
// Saída: referencias/mapa-telas.md (rodar de novo sempre que criar ou consertar um passo).
//
//   node mapa.js
const fs = require('fs');
const path = require('path');

const raizPassos = path.join(__dirname, '..', 'passos');
const saida = path.join(__dirname, '..', 'referencias', 'mapa-telas.md');

const todos = (txt, re, grupo = 1) => [...txt.matchAll(re)].map((m) => m[grupo]);
const junta = (lista) => [...new Set(lista)].sort((a, b) => a.localeCompare(b, 'pt'));
const crase = (lista) => lista.map((x) => '`' + x + '`').join(', ');

const telas = [];
for (const area of fs.readdirSync(raizPassos).filter((d) => !d.startsWith('_')).sort()) {
  const pastaArea = path.join(raizPassos, area);
  if (!fs.statSync(pastaArea).isDirectory()) continue;
  for (const nome of fs.readdirSync(pastaArea).sort()) {
    const pasta = path.join(pastaArea, nome);
    if (!fs.statSync(pasta).isDirectory()) continue;
    const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith('.js')).sort();
    const txt = {}; for (const f of arquivos) txt[f] = fs.readFileSync(path.join(pasta, f), 'utf8');
    const tudo = Object.values(txt).join('\n');

    const cabecalho = (todos(tudo, /^\/\/ Tela: (.+)$/gm)[0] || `${area} › ${nome}`).replace(/ — ajudantes.*$/, '');
    const rotas = junta([
      ...todos(tudo, /abrir\(\s*p\s*,\s*'([^'?]+)/g),
      ...todos(tudo, /goto\([^'`]*['`][^'`]*?(\/[a-z][\w\-/]+)/g),
    ]);
    const passos = [];
    for (const f of arquivos.filter((x) => !x.startsWith('_'))) {
      for (const m of txt[f].matchAll(/((?:^[ \t]*\/\/.*\n)*)[ \t]*async ([a-zA-Z]\w*)\(/gm)) {
        const desc = m[1].split('\n').map((l) => l.replace(/^\s*\/\/\s?/, '')).filter((l) => l && !/^args:|^devolve|^\s/.test(l))[0] || '';
        const oQueFaz = desc || f.replace(/\.js$/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) + '.';
        passos.push(`| \`${f}\` | \`${m[2]}\` | ${oQueFaz.replace(/\|/g, '/')} |`);
      }
    }
    const campos = junta(todos(tudo, /tela\.(?:autocompleteRotulo|campo|dropdown|digitar|data|moeda)\(\s*p\s*,\s*(?:[\w.]+\s*,\s*)?'([^']+)'/g));
    const ids = junta(todos(tudo, /(?:input|textarea|button|p-[\w-]+)?#([a-zA-Z][\w-]*)/g).filter((x) => !/^\d/.test(x)));
    const botoes = junta(todos(tudo, /tela\.(?:botao|temBotao|clicarTexto)\(\s*p\s*,\s*'([^']+)'/g)
      .concat(todos(tudo, /button:has-text\(\\?"([^"\\]+)/g)));
    const kebab = junta(todos(tudo, /tela\.menuKebab\(\s*p\s*,\s*'([^']+)'/g));
    const tabelas = junta(todos(tudo, /\b(?:from|join|update|into)\s+([A-Z][A-Z0-9_]{3,})\b/gi).filter((x) => x === x.toUpperCase()));
    const ajudantes = junta(todos(tudo, /require\('\.\.\/\.\.\/(_[\w-]+)'\)/g).map((x) => `passos/${x}.js`));

    telas.push({ cabecalho, pasta: `passos/${area}/${nome}/`, rotas, passos, campos, ids, botoes, kebab, tabelas, ajudantes });
  }
}

const l = ['# Mapa das telas (gerado a partir dos passos)', '',
  `Gerado em ${new Date().toLocaleString('pt-BR')} por \`node motor/mapa.js\` — não editar à mão.`,
  'Só tem o que os passos usam e já funcionou. **Faltou campo, botão ou tabela → procurar no código-fonte (Z:)**, como antes; depois de criar/consertar o passo, gerar o mapa de novo.',
  'Regras e fluxos de negócio continuam na skill `regras-sistema-filt`; este mapa é só "onde fica cada coisa".', ''];
for (const t of telas.sort((a, b) => a.cabecalho.localeCompare(b.cabecalho, 'pt'))) {
  l.push(`## ${t.cabecalho}`, '', `Pasta: \`${t.pasta}\``);
  if (t.rotas.length) l.push(`- **Rotas:** ${crase(t.rotas)}`);
  if (t.campos.length) l.push(`- **Campos (rótulo):** ${t.campos.join(' · ')}`);
  if (t.ids.length) l.push(`- **Ids:** ${crase(t.ids.map((x) => (x.endsWith('-') ? x + '<n> (prefixo)' : x)))}`);
  if (t.botoes.length) l.push(`- **Botões:** ${t.botoes.join(' · ')}`);
  if (t.kebab.length) l.push(`- **Menu ⋮:** ${t.kebab.join(' · ')}`);
  if (t.tabelas.length) l.push(`- **Tabelas no banco:** ${crase(t.tabelas)}`);
  if (t.ajudantes.length) l.push(`- **Ajudantes comuns:** ${crase(t.ajudantes)}`);
  if (t.passos.length) l.push('', '| Arquivo | Passo | O que faz |', '|---|---|---|', ...t.passos);
  l.push('');
}
fs.writeFileSync(saida, l.join('\n'));
console.log(`${telas.length} telas, ${telas.reduce((s, t) => s + t.passos.length, 0)} passos → ${saida}`);
