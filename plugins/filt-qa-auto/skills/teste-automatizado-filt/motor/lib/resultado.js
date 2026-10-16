// Grava o resultado de uma execução: JSON completo, Markdown legível e os casos no formato do dados.json do validador.
const fs = require('fs');
const path = require('path');

const ICONE = { OK: '✅', FALHOU: '❌', ERRO: '⚠️', BLOQUEADO: '⛔', PULADO: '⏭️' };

function obtidoTexto(c) {
  if (c.status === 'PULADO') return c.motivo || 'Não executado.';
  const partes = c.conferencias.map((x) => `${x.descricao}: ${x.obtido}${x.ok ? '' : ` (esperado ${x.esperado})`}`);
  if (c.erro) partes.push(`Parou em "${c.parouEm || '?'}": ${c.erro}`);
  return partes.join('; ') || '(sem conferências)';
}

function markdown(r) {
  const l = [];
  l.push(`# ${r.tarefa} — execução automatizada`, '');
  l.push(`- **Suíte:** ${r.titulo || ''}`, `- **AT:** ${r.at.url} · base ${r.at.base} · banco ${r.banco || '?'}`);
  l.push(`- **Versão do front:** ${r.versaoFront || '?'}`, `- **Início:** ${r.inicio} · **Duração:** ${Math.round(r.ms / 60000)} min`);
  const cont = r.casos.reduce((a, c) => ((a[c.status] = (a[c.status] || 0) + 1), a), {});
  l.push(`- **Resumo:** ${Object.entries(cont).map(([k, v]) => `${ICONE[k] || ''} ${k} ${v}`).join(' · ')}`, '');
  if (r.interrompido) l.push(`> ⛔ **Execução interrompida:** ${r.interrompido}`, '');
  l.push('| Caso | Título | Telas | Status | Obtido |', '|---|---|---|---|---|');
  for (const c of r.casos) l.push(`| ${c.id} | ${c.titulo} | ${(c.telas || []).join(', ')} | ${ICONE[c.status] || ''} ${c.status} | ${obtidoTexto(c).replace(/\|/g, '/')} |`);
  for (const c of r.casos.filter((x) => x.status !== 'PULADO')) {
    l.push('', `## ${ICONE[c.status] || ''} Caso ${c.id} — ${c.titulo}`, '', `- **Origem:** ${c.origem || ''}`, `- **Esperado:** ${c.esperado || ''}`);
    if (Object.keys(c.guardados).length) l.push(`- **Dados criados:** ${Object.entries(c.guardados).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(' · ')}`);
    if (c.notas.length) l.push(`- **Notas:** ${c.notas.join(' · ')}`);
    l.push('', '| # | Passo | Tempo | Resultado |', '|---|---|---|---|');
    c.passos.forEach((s, i) => l.push(`| ${i + 1} | \`${s.passo.replace(/\|/g, '/')}\` | ${Math.round((s.ms || 0) / 1000)}s | ${s.erro ? '❌ ' + s.erro.replace(/\|/g, '/') : s.retorno ? s.retorno.replace(/\|/g, '/') : 'ok'} |`));
    if (c.conferencias.length) {
      l.push('', '| Conferência | Esperado | Obtido | |', '|---|---|---|---|');
      for (const x of c.conferencias) l.push(`| ${x.descricao} | ${x.esperado} | ${x.obtido} | ${x.ok ? '✅' : '❌'} |`);
    }
    if (c.evidencia) l.push('', '**Evidência no momento da falha:**', '```json', JSON.stringify(c.evidencia, null, 1), '```');
  }
  return l.join('\n') + '\n';
}

// casos no formato do dados.json do validador (o julgamento final continua sendo de quem valida)
function paraDadosJson(r) {
  const st = { OK: 'OK', FALHOU: 'FALHOU', ERRO: 'BLOQUEADO', BLOQUEADO: 'BLOQUEADO', PULADO: 'BLOQUEADO' };
  return r.casos.map((c) => ({ id: c.id, origem: c.origem || '', cenario: c.cenario || c.titulo, esperado: c.esperado || '', obtido: obtidoTexto(c), status: st[c.status] || c.status }));
}

function gravar(pasta, r) {
  const dir = path.join(pasta, 'resultados'); fs.mkdirSync(dir, { recursive: true });
  const d = new Date(r.inicio); const z = (n) => String(n).padStart(2, '0');
  const nome = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}h${z(d.getMinutes())}`;   // horário local
  fs.writeFileSync(path.join(dir, nome + '.json'), JSON.stringify(r, null, 1));
  fs.writeFileSync(path.join(dir, nome + '.md'), markdown(r));
  fs.writeFileSync(path.join(dir, 'ultimo.json'), JSON.stringify(r, null, 1));
  fs.writeFileSync(path.join(dir, 'ultimo.md'), markdown(r));
  fs.writeFileSync(path.join(dir, 'casos-para-dados-json.json'), JSON.stringify(paraDadosJson(r), null, 1));
  return { md: path.join(dir, nome + '.md'), json: path.join(dir, nome + '.json') };
}

module.exports = { gravar, markdown, paraDadosJson, obtidoTexto, ICONE };
