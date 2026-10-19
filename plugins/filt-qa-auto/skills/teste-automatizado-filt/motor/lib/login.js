// Login no AT da própria tarefa. Regras:
//  - só o AT da tarefa da suíte (URL com nmtz-<número da tarefa>); produção é bloqueada;
//    exceção: AT do épico/tarefa-mãe, quando a pessoa indica (suíte declara at.demanda: "NMTZ-<número do AT>");
//  - a base (empresa do login) é a que a pessoa informou na suíte;
//  - se o AT der problema, para com a mensagem para a pessoa corrigir — nunca procura outro AT.
const cfg = require('./config');
const tela = require('./tela');

module.exports = async function login(p, { tarefa, url, base, demanda, usuario = 'principal' }) {
  const numero = (String(tarefa).match(/NMTZ-(\d+)/i) || [])[1];
  if (!numero) throw new Error('a suíte precisa de tarefa: "NMTZ-<número>"');
  if (cfg.tarefa !== `NMTZ-${numero}`) throw new Error(`BLOQUEADO: FILT_QA_TAREFA=${cfg.tarefa}, mas a suíte é da NMTZ-${numero}.`);
  if (!url || !base) throw new Error('a suíte precisa de at: { url, base } — a URL do AT e a base informadas pela pessoa');
  if (/filterp\.com\.br/i.test(url)) throw new Error('BLOQUEADO: URL de produção. A suíte só roda no AT da tarefa.');
  const nUrl = (String(url).match(/nmtz-(\d+)/i) || [])[1];
  const nDemanda = (String(demanda || '').match(/NMTZ-(\d+)/i) || [])[1];
  if (nUrl && nUrl !== numero && nUrl !== nDemanda) throw new Error(`BLOQUEADO: a URL é do AT nmtz-${nUrl}, mas a tarefa é NMTZ-${numero}. Pedir a URL certa à pessoa (se for o AT do épico indicado por ela, declarar at.demanda na suíte).`);
  const origem = new URL(url).origin;
  const problema = (o) => new Error(`PROBLEMA NO AT DA TAREFA — ${o}. Reportar à pessoa para corrigir o AT (não usar outro AT).`);

  let cliente = null;
  const ouvir = (r) => { if (r.url().includes('/oauth/token')) { const m = decodeURIComponent(r.postData() || '').match(/"cliente":"(\d+)"/); if (m) cliente = m[1]; } };
  p.on('request', ouvir);
  const resp = await p.goto(origem + '/login', { waitUntil: 'networkidle' }).catch((e) => { throw problema(`ambiente ${origem} não abre (${e.message.split('\n')[0]})`); });
  if (resp && resp.status() >= 400) throw problema(`ambiente ${origem} respondeu HTTP ${resp.status()}`);
  if (!/\/login/.test(p.url())) {
    await p.context().clearCookies(); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await p.goto(origem + '/login', { waitUntil: 'networkidle' });
  }
  const u = cfg.erp.usuarios[usuario];
  if (!u) throw new Error(`usuário "${usuario}" não existe no config.json`);
  await p.fill('#username', u.cpf); await p.fill('#password', u.senha); await p.keyboard.press('Enter');
  await p.locator('.p-dropdown').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (!(await p.locator('.p-dropdown').count())) throw problema(/\/login/.test(p.url()) ? 'login não passou da senha (credencial ou ambiente)' : 'o sistema entrou direto, sem escolher empresa — não dá para garantir a base');
  await p.click('.p-dropdown'); await tela.esperar(p, 500);
  const f = await p.$('.p-dropdown-filter'); if (f) { await f.fill(base); await tela.esperar(p, 500); }
  const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opt = p.locator('li.p-dropdown-item').filter({ hasText: new RegExp(`^\\s*${esc}\\s*$`, 'i') });
  if (!(await opt.count())) throw problema(`a base "${base}" não aparece no login do AT`);
  await opt.first().click();
  await p.click('button:has-text("Entrar")');
  await p.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 30000 }).catch(() => {});
  p.off('request', ouvir);
  if (/\/login/.test(p.url())) throw problema('não entrou no sistema após escolher a empresa');
  if (!cliente) throw problema('não consegui identificar o banco (CLIENTE_x) no login');
  const sessao = { tarefa: `NMTZ-${numero}`, base: origem, empresa: base, usuario, cliente, banco: `CLIENTE_${cliente}`, loginEm: new Date().toISOString() };
  cfg.gravarSessao(sessao);
  return sessao;
};
