// Confere o ambiente do DF-e PELA TELA (/fiscal/configuracao-dfe, abas NF-e / NFC-e / CT-e / MDF-e) e libera ou bloqueia
// a emissão na sessão da tarefa. Usar em base sem acesso ao banco (ex.: base de teste em produção sem banco liberado).
// uso: node run.js checar_dfe_tela '{}'
// Só libera se TODAS as abas mostrarem "Homologação" (ou não emitir). Qualquer "Produção" → bloqueado. Nunca altera a configuração.
module.exports = async (p, args, lib, { cfg, sessao }) => {
  const base = sessao.base || p.url().split('/').slice(0, 3).join('/');
  await p.goto(base + '/fiscal/configuracao-dfe'); await lib.esperar(p, 6000);
  const abas = {};
  for (const aba of ['NF-e', 'NFC-e', 'CT-e', 'MDF-e']) {
    const t = p.getByText(aba, { exact: true }).first();
    if (!(await t.count())) { abas[aba] = 'aba não encontrada'; continue; }
    await t.click(); await lib.esperar(p, 1800);
    const amb = await p.$$eval('label', (a) => a.filter((x) => x.offsetParent && /^Ambiente/.test(x.innerText.trim())).map((l) => {
      let c = l.parentElement; for (let i = 0; i < 4 && c && !c.querySelector('.p-dropdown-label,input'); i++) c = c.parentElement;
      const d = c && c.querySelector('.p-dropdown-label'); const i = c && c.querySelector('input'); return d ? d.innerText.trim() : i ? i.value : '';
    }));
    abas[aba] = amb[0] || '(vazio)';
  }
  const prod = Object.entries(abas).filter(([, v]) => /produ[cç][aã]o/i.test(v)).map(([k]) => k);
  const duvida = Object.entries(abas).filter(([, v]) => !/homologa|n[aã]o emite|produ[cç][aã]o/i.test(v)).map(([k, v]) => `${k}: ${v}`);
  const ok = !prod.length && !duvida.length;
  const res = { ok, fonte: 'tela /fiscal/configuracao-dfe', empresa: sessao.producao && sessao.ambiente === 'producao' ? sessao.producao.empresa : sessao.empresa, abas, verificado_em: Math.floor(Date.now() / 1000) };
  if (prod.length) res.bloqueio = `DF-e em PRODUÇÃO (${prod.join(', ')}) — NÃO emitir; avisar a pessoa.`;
  else if (duvida.length) res.bloqueio = `Não deu para confirmar o ambiente (${duvida.join('; ')}) — não emitir sem conferir com a pessoa.`;
  cfg.gravarSessao({ [sessao.ambiente === 'producao' ? 'dfe_producao' : 'dfe_at']: res });
  if (args.print) await p.screenshot({ path: require('path').join(lib.pastaPrints(), 'dfe-tela.png') });
  return res;
};
