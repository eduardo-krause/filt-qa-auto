// Navegador persistente (Chromium headless com CDP) para os passos reaproveitarem a mesma aba.
// uso: node browser.js start | stop | status
const cfg = require('./lib/cfg');
const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const port = cfg.cdpPort;

function status() {
  return new Promise((res) => {
    http.get(`http://127.0.0.1:${port}/json/version`, (r) => { r.resume(); res(true); }).on('error', () => res(false));
  });
}

(async () => {
  const cmd = process.argv[2] || 'status';
  const up = await status();
  if (cmd === 'status') return console.log(up ? 'rodando' : 'parado');
  if (cmd === 'start') {
    if (up) return console.log('já rodando na porta ' + port);
    const prof = cfg.perfilNavegador; require('fs').mkdirSync(prof, { recursive: true });
    const extra = process.platform === 'win32' ? [] : ['--no-sandbox', '--disable-dev-shm-usage'];  // Linux/WSL: sandbox e /dev/shm pequenos
    const ch = spawn(cfg.playwright.chrome, ['--headless=new', ...extra, `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
      '--window-size=1600,900', 'about:blank'], { detached: true, stdio: 'ignore', windowsHide: true });
    ch.unref();
    for (let i = 0; i < 30 && !(await status()); i++) await new Promise((r) => setTimeout(r, 300));
    return console.log((await status()) ? `iniciado na porta ${port} (tarefa ${cfg.tarefa})` : 'falhou ao iniciar');
  }
  if (cmd === 'stop') {
    try {
      if (process.platform === 'win32') execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Where-Object { $_.CommandLine -like '*remote-debugging-port=${port}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"`, { windowsHide: true, stdio: 'ignore' });
      else execSync(`pkill -f -- "--remote-debugging-port=${port}"`, { stdio: 'ignore' });
    } catch (e) {}
    return console.log('parado');
  }
})();
