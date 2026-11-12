// Tela: Processos › Financeiro › Conciliação de Contas — abre o link "Lançamento:" do detalhe da linha (lançamento contábil gerado pelo OFX).
// Com usuario (ex.: 'secundario'): abre o mesmo endereço num navegador separado logado com esse usuário do config (a sessão principal fica intacta).
const path = require('path');
const { limpo } = require('./_apoio');

const motorLib = path.join(__dirname, '..', '..', '..', 'motor', 'lib');

async function ler(pg, respostas) {
  await pg.waitForLoadState('domcontentloaded').catch(() => {});
  await pg.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await pg.waitForTimeout(1500);
  const info = await pg.evaluate(() => {
    const vis = (e) => !!(e && e.getClientRects().length);
    const tit = [...document.querySelectorAll('.breadcrumb-label, header-form .breadcrumb-label, h1, h2')].find(vis);
    const corpo = document.body ? document.body.innerText : '';
    const main = document.querySelector('.header-outside, router-outlet + *, main') || document.body;
    return { texto: (main.innerText || '').replace(/\s+/g, ' ').slice(0, 300), titulo: tit ? tit.textContent.trim() : null, aviso: (corpo.match(/[^\n]*(sem permiss|não autorizad|acesso negado|não possui|401|403)[^\n]*/i) || [null])[0] };
  }).catch(() => ({ titulo: null, aviso: null }));
  const negadas = respostas.filter((r) => r.status === 401 || r.status === 403);
  const url = pg.url();
  return { url, titulo: info.titulo, texto: info.texto, aviso: info.aviso ? limpo(info.aviso) : null, respostasNegadas: negadas.slice(0, 5), bloqueado: /\/(401|403|login)\b/.test(url) || negadas.length > 0 || !!info.aviso };
}

const ouvir = (pg, arr) => pg.on('response', (r) => { if (/\/api\//.test(r.url()) && r.status() >= 400) arr.push({ status: r.status(), url: r.url().replace(/access_token=[^&]+/, 'access_token=…') }); });

module.exports = {
  // args: { link (href do detalhe, ex.: '/contabil/contabil-lancamento/form?id=2091&access_token=…'), usuario: 'secundario' (opcional) }
  // → { url, titulo, aviso, bloqueado (401/403, /401, /login ou aviso de acesso), respostasNegadas, abaNova (o clique abriu outra aba), via:'clique'|'endereco', usuario }
  async abrirLink(t, { link, usuario }) {
    const { p } = t;
    const ctx = p.context();
    if (!usuario || usuario === 'principal') {
      const id = (String(link).match(/id=(\d+)/) || [])[1];
      const a = p.locator(`.detalhe-geracao-automatica a[href*="id=${id}"]`).first();
      const respostas = [];
      if (id && (await a.count())) {
        const popup = ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null);
        const urlAntes = p.url();
        await a.scrollIntoViewIfNeeded(); await a.click();
        const nova = await popup;
        if (nova) { ouvir(nova, respostas); const r = await ler(nova, respostas); await nova.close().catch(() => {}); return { ...r, abaNova: true, via: 'clique', usuario: 'principal' }; }
        const r = await ler(p, respostas);
        return { ...r, abaNova: false, via: 'clique', mesmaAbaSaiuDe: urlAntes, usuario: 'principal' };
      }
      const pg = await ctx.newPage(); ouvir(pg, respostas);
      const base = new URL(p.url()).origin;
      await pg.goto(new URL(link, base).href, { waitUntil: 'domcontentloaded' });
      const r = await ler(pg, respostas); await pg.close().catch(() => {});
      return { ...r, abaNova: null, via: 'endereco', usuario: 'principal' };
    }
    // outro usuário: navegador (contexto) separado, login pelo motor, abre o endereço sem o access_token do principal
    const cfg = require(path.join(motorLib, 'config'));
    const login = require(path.join(motorLib, 'login'));
    const sess = cfg.lerSessao();
    const ctx2 = await ctx.browser().newContext({ viewport: { width: 1600, height: 900 } });
    const pg = await ctx2.newPage();
    const respostas = [];
    try {
      await login(pg, { tarefa: sess.tarefa, url: sess.base, base: sess.empresa, usuario });
      ouvir(pg, respostas);
      const semToken = String(link).replace(/[?&]access_token=[^&]+/, '');
      await pg.goto(new URL(semToken, sess.base).href, { waitUntil: 'domcontentloaded' });
      const r = await ler(pg, respostas);
      return { ...r, abaNova: null, via: 'endereco', usuario };
    } catch (e) {
      return { url: pg.url(), titulo: null, bloqueado: null, erroLogin: e.message.split('\n')[0], usuario };
    } finally {
      cfg.gravarSessao(sess); // login() grava a sessão do outro usuário: volta a do principal
      await ctx2.close().catch(() => {});
    }
  },
};
