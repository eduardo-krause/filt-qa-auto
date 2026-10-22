// args: {tarefa: "NMTZ-XXXX", url: "URL do AT informada pela pessoa", base: "empresa do login informada pela pessoa", usuario?: "principal" | "secundario"}
//   ou  {tarefa: "NMTZ-XXXX", ambiente: "producao", usuario?: ...}  → produção, base de config.producao.empresa
// REGRAS: no AT, só o AT da própria tarefa. Em produção, só a base configurada em config.producao.empresa.
// Se o AT der problema, o passo para com mensagem para o usuário corrigir o AT — nunca procura outro.
module.exports = async (p, args, lib, { cfg }) => {
  const m = String(args.tarefa || '').match(/NMTZ-(\d+)/i);
  if (!m) throw new Error('informe {"tarefa":"NMTZ-<numero>"}');
  if (args.empresa) throw new Error('BLOQUEADO: não é permitido escolher outra empresa/base.');
  const numero = m[1];
  if (cfg.tarefa !== 'PADRAO' && cfg.tarefa !== `NMTZ-${numero}`) throw new Error(`BLOQUEADO: FILT_QA_TAREFA=${cfg.tarefa}, mas o login é da NMTZ-${numero}. Use a mesma tarefa nos dois.`);
  const producao = args.ambiente === 'producao';
  let base, empresaAlvo;
  if (producao) {
    base = new URL(cfg.producao.url).origin;
    const lista = cfg.producao.basesTeste || [];
    if (args.base && !lista.some((b) => b.toLowerCase() === String(args.base).toLowerCase())) throw new Error(`BLOQUEADO: "${args.base}" não está em producao.basesTeste do config.json — só bases de teste da própria pessoa.`);
    empresaAlvo = args.base || cfg.producao.empresa;
  } else {
    if (args.numero && String(args.numero) !== numero) throw new Error('BLOQUEADO: só é permitido usar o AT da própria tarefa.');
    if (!args.url) throw new Error('informe a URL do AT que a pessoa passou: {"tarefa":"NMTZ-<n>","url":"https://..."}');
    const um = String(args.url).match(/nmtz-(\d+)/i);
    // epico: AT feito sobre o épico pai da tarefa — só com confirmação explícita da pessoa (e pai conferido no Jira)
    const epico = args.epico ? (String(args.epico).match(/(\d+)/) || [])[1] : null;
    if (um && um[1] !== numero && um[1] !== epico) throw new Error(`BLOQUEADO: a URL é do AT nmtz-${um[1]}, mas a tarefa é NMTZ-${numero}. Pedir a URL certa à pessoa.`);
    if (/filterp\.com\.br/i.test(args.url)) throw new Error('BLOQUEADO: essa URL é de produção. Para produção use {"ambiente":"producao"}.');
    base = new URL(args.url).origin;
    // base (empresa do login) informada pela pessoa; sem ela, cai no padrão "AT: nmtz-<N>" (compatibilidade)
    empresaAlvo = args.base ? String(args.base).trim() : `AT: nmtz-${numero}`;
  }
  const problema = (o) => new Error(producao
    ? `PROBLEMA NO ACESSO À PRODUÇÃO — ${o}. Avisar o usuário.`
    : `PROBLEMA NO AT DA TAREFA — ${o}. Reportar ao usuário para corrigir o AT (não usar outro AT).`);

  let cliente = null;
  p.on('request', (r) => { if (r.url().includes('/oauth/token')) { const mm = decodeURIComponent(r.postData() || '').match(/"cliente":"(\d+)"/); if (mm) cliente = mm[1]; } });
  const resp = await p.goto(base + '/login', { waitUntil: 'networkidle' }).catch((e) => { throw problema(`ambiente ${base} não abre (${e.message.split('\n')[0]})`); });
  if (resp && resp.status() >= 400) throw problema(`ambiente ${base} respondeu HTTP ${resp.status()}`);
  if (!/\/login/.test(p.url())) {
    await p.context().clearCookies(); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await p.goto(base + '/login', { waitUntil: 'networkidle' });
  }
  const quem = args.usuario || 'principal';
  const u = cfg.erp.usuarios[quem];
  if (!u) throw new Error(`usuário "${quem}" não existe no config.json (use principal ou secundario)`);
  await p.fill('#username', u.cpf); await p.fill('#password', u.senha); await p.keyboard.press('Enter');
  // o dropdown Empresa às vezes demora a aparecer: espera até 15 s antes de concluir que o login falhou
  await p.locator('.p-dropdown').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (!(await p.locator('.p-dropdown').count())) {
    if (!/\/login/.test(p.url())) throw problema('o sistema entrou direto, sem mostrar a escolha de empresa — não dá para garantir a base; confirmar com a pessoa se o usuário tem acesso à empresa do AT');
    throw problema('login não passou da senha (credencial ou ambiente)');
  }
  await p.click('.p-dropdown'); await lib.esperar(p, 500);

  let opt;
  if (producao) {
    // todas as palavras de config.producao.empresa, sem diferenciar maiúsculas; precisa dar exatamente 1 empresa
    const palavras = empresaAlvo.toLowerCase().split(/\s+/).filter(Boolean);
    const todas = await p.$$eval('li.p-dropdown-item', (a) => a.map((x) => x.innerText.trim()));
    const achadas = todas.filter((t) => palavras.every((w) => t.toLowerCase().includes(w)));
    if (achadas.length !== 1) throw problema(`base "${empresaAlvo}" ${achadas.length ? 'ambígua: ' + achadas.join(' | ') : 'não encontrada no login'} — confirmar com o usuário qual é a base`);
    opt = p.locator('li.p-dropdown-item').filter({ hasText: achadas[0] });
    empresaAlvo = achadas[0];
  } else {
    const f = await p.$('.p-dropdown-filter'); if (f) { await f.fill(args.base ? empresaAlvo : `nmtz-${numero}`); await lib.esperar(p, 500); }
    const esc = empresaAlvo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    opt = p.locator('li.p-dropdown-item').filter({ hasText: new RegExp(`^\\s*${esc}\\s*$`, 'i') });
    if (!(await opt.count())) throw problema(`a base "${empresaAlvo}" não aparece no login do AT (removida, não criada ou nome diferente — confirmar com a pessoa)`);
  }
  await opt.first().click();
  await p.click('button:has-text("Entrar")'); await lib.esperar(p, 6000);
  if (/\/login/.test(p.url())) throw problema('não entrou no sistema após escolher a empresa');

  if (producao) {
    cfg.gravarSessao({ ambiente: 'producao', dfe_producao: null, base, tarefa: `NMTZ-${numero}`, usuario: quem, producao: { base, empresa: empresaAlvo, cliente } });
    return { ok: true, ambiente: 'PRODUÇÃO (somente comparação)', usuario: quem, base, empresa: empresaAlvo, cliente };
  }
  cfg.gravarSessao({ ambiente: 'at', dfe_at: null, base, numero, tarefa: `NMTZ-${numero}`, empresa: empresaAlvo, usuario: quem, cliente, banco: cliente ? `CLIENTE_${cliente}` : null,
    at: { base, empresa: empresaAlvo, banco: cliente ? `CLIENTE_${cliente}` : null } });
  return { ok: true, ambiente: 'AT', usuario: quem, base, empresa: empresaAlvo, cliente, banco: cliente ? `CLIENTE_${cliente}` : '(não capturado)' };
};
