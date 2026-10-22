// Executa um passo na aba persistente.
// uso: node run.js <passo> '<json de argumentos>'
//   passo = nome em steps/ (ex.: login, snapshot) ou caminho de um .js próprio que exporte async (p, args, lib)
//   "_aba": N nos argumentos roda o passo na aba N (0 = a principal; ver o aviso ABA NOVA)
const cfg = require('./lib/cfg');
const path = require('path');
const fs = require('fs');
const { chromium } = require(require('path').join(cfg.playwright.nodeModules, 'playwright'));
const lib = require('./lib/helpers');

(async () => {
  const nome = process.argv[2];
  const args = process.argv[3] ? JSON.parse(process.argv[3]) : {};
  let arq = path.join(__dirname, 'steps', nome.endsWith('.js') ? nome : nome + '.js');
  if (!fs.existsSync(arq)) arq = path.resolve(nome);
  const b = await chromium.connectOverCDP(`http://127.0.0.1:${cfg.cdpPort}`);
  const ctx = b.contexts()[0];
  const p = ctx.pages()[args._aba || 0] || (await ctx.newPage());
  await p.setViewportSize({ width: 1600, height: 900 });
  // Ação que abre outra aba (nota, relatório, cadastro) não muda nada na aba atual: avisar sempre.
  const antes = new Set(ctx.pages());
  const avisarAbas = () => ctx.pages().forEach((x, i) => { if (!antes.has(x)) console.log(`ABA NOVA [${i}]: ${x.url()} (rodar o próximo passo nela com "_aba":${i})`); });
  const sessao = cfg.lerSessao();
  try {
    const r = await require(arq)(p, args, lib, { cfg, sessao, base: sessao.base });
    if (r !== undefined) console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
  } catch (e) {
    console.log('ERRO: ' + e.message.split('\n').slice(0, 6).join('\n'));
    process.exitCode = 1;
  }
  await p.waitForTimeout(1500).catch(() => {}); // a aba nova costuma abrir logo depois do clique
  avisarAbas();
  process.exit();
})();
