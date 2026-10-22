// Grava em vídeo (.webm) a aba do navegador persistente enquanto os passos rodam.
// uso: node gravar.js start <nome-do-cenario> [NMTZ-xxxx]   (fica em segundo plano até o stop; usa a sessão de FILT_QA_TAREFA)
//      node gravar.js stop                       (finaliza e gera <pastaTrabalho>/<tarefa>/videos/<nome>.webm)
const cfg = require('./lib/cfg');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require(path.join(cfg.playwright.nodeModules, 'playwright'));

const RAIZ = path.join(__dirname, '..');
const CTRL = cfg.arquivoGravacao;
// ffmpeg do Playwright: caminho do config (preenchido pelo configurar.py) ou o primeiro ffmpeg-* ao lado do chromium
const FFMPEG = cfg.playwright.ffmpeg || (() => { const base = path.dirname(path.dirname(path.dirname(cfg.playwright.chrome)));
  const d = fs.readdirSync(base).filter((x) => /^ffmpeg-/.test(x)).sort().pop(); return d ? path.join(base, d, process.platform === 'win32' ? 'ffmpeg-win64.exe' : 'ffmpeg-linux') : 'ffmpeg'; })();
const FPS = 8;

async function gravar(nome, tarefaArg) {
  const t = (tarefaArg && /NMTZ-\d+/i.test(tarefaArg) ? tarefaArg.toUpperCase() : null) || (cfg.tarefa !== 'PADRAO' ? cfg.tarefa : null) || cfg.lerSessao().tarefa || 'geral';
  const dir = path.join(cfg.pastaTarefa(t), 'videos');
  fs.mkdirSync(dir, { recursive: true });
  const saida = path.join(dir, nome + '.webm');
  const b = await chromium.connectOverCDP(`http://127.0.0.1:${cfg.cdpPort}`);
  const page = b.contexts()[0].pages()[0];
  const frames = []; // {t, buf} — captura periódica (o screencast quase não emite quadros em headless)
  fs.writeFileSync(CTRL, JSON.stringify({ pid: process.pid, nome, saida, parar: false }));
  const inicio = Date.now();
  let ultimaLeitura = 0;
  while (true) {
    const t0 = Date.now();
    const buf = await page.screenshot({ type: 'jpeg', quality: 60, timeout: 3000 }).catch(() => null);
    if (buf) frames.push({ t: t0, buf });
    if (Date.now() - ultimaLeitura > 500) {
      ultimaLeitura = Date.now();
      let c = {}; try { c = JSON.parse(fs.readFileSync(CTRL, 'utf8')); } catch (e) {}
      if (c.parar || Date.now() - inicio > 60 * 60 * 1000) break;
    }
    const resto = 1000 / FPS - (Date.now() - t0);
    if (resto > 0) await new Promise((res) => setTimeout(res, resto));
  }
  const fim = Date.now();
  // monta vídeo com taxa fixa, repetindo o último quadro nos intervalos sem mudança de tela
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0',
    '-c:v', 'vp8', '-b:v', '1M', '-deadline', 'realtime', '-cpu-used', '8', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', saida], { windowsHide: true });
  let err = ''; ff.stderr.on('data', (d) => (err += d));
  if (frames.length) {
    let i = 0;
    for (let ts = frames[0].t; ts <= fim; ts += 1000 / FPS) {
      while (i + 1 < frames.length && frames[i + 1].t <= ts) i++;
      if (!ff.stdin.write(frames[i].buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  // cópia na pasta de vídeos do usuário: ~/Videos/<número da tarefa>/ (cria se não existir; nomes "caso-..." não colidem com os dele)
  let copia;
  try { const num = (String(t).match(/(\d+)/) || [])[1]; if (num && fs.existsSync(saida)) { const dv = path.join(require('os').homedir(), 'Videos', num); fs.mkdirSync(dv, { recursive: true }); copia = path.join(dv, path.basename(saida)); fs.copyFileSync(saida, copia); } } catch (e) { copia = 'falhou: ' + e.message; }
  fs.writeFileSync(CTRL, JSON.stringify({ nome, saida, copia, pronto: true, quadros: frames.length, segundos: Math.round((fim - inicio) / 1000), erro: err.trim() || undefined }));
  process.exit(0);
}

(async () => {
  const cmd = process.argv[2];
  if (cmd === 'start') {
    if (process.argv[3] === '--filho') return gravar(process.argv[4], process.argv[5]);
    const nome = (process.argv[3] || 'cenario').replace(/[^\w.-]+/g, '_');
    try { const c = JSON.parse(fs.readFileSync(CTRL, 'utf8')); if (c.pid && !c.pronto && !c.parar) return console.log('já existe gravação em andamento: ' + c.nome); } catch (e) {}
    const f = spawn(process.execPath, [__filename, 'start', '--filho', nome, process.argv[4] || ''], { detached: true, stdio: 'ignore', windowsHide: true });
    f.unref();
    for (let k = 0; k < 40; k++) { await new Promise((r) => setTimeout(r, 250)); try { const c = JSON.parse(fs.readFileSync(CTRL, 'utf8')); if (c.nome === nome && !c.pronto) return console.log('gravando: ' + nome); } catch (e) {} }
    return console.log('falhou ao iniciar gravação');
  }
  if (cmd === 'stop') {
    let c; try { c = JSON.parse(fs.readFileSync(CTRL, 'utf8')); } catch (e) { return console.log('nenhuma gravação'); }
    if (c.pronto) return console.log(JSON.stringify(c));
    c.parar = true; fs.writeFileSync(CTRL, JSON.stringify(c));
    for (let k = 0; k < 240; k++) { await new Promise((r) => setTimeout(r, 500)); try { const d = JSON.parse(fs.readFileSync(CTRL, 'utf8')); if (d.pronto) return console.log(JSON.stringify(d)); } catch (e) {} }
    return console.log('timeout esperando o vídeo');
  }
  console.log('uso: node gravar.js start <nome> | stop');
})();
