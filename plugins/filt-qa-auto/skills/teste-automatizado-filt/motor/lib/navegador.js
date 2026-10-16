// Navegador próprio do motor (Chromium headless com CDP), separado do navegador do validador.
const cfg = require('./config');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');

const port = cfg.cdpPort;
const ativo = () => new Promise((res) => { http.get(`http://127.0.0.1:${port}/json/version`, (r) => { r.resume(); res(true); }).on('error', () => res(false)); });

async function iniciar() {
  if (await ativo()) return port;
  fs.mkdirSync(cfg.perfilNavegador, { recursive: true });
  const extra = process.platform === 'win32' ? [] : ['--no-sandbox', '--disable-dev-shm-usage'];
  const ch = spawn(cfg.playwright.chrome, ['--headless=new', ...extra, `--remote-debugging-port=${port}`, `--user-data-dir=${cfg.perfilNavegador}`, '--window-size=1600,900', 'about:blank'], { detached: true, stdio: 'ignore', windowsHide: true });
  ch.unref();
  for (let i = 0; i < 40 && !(await ativo()); i++) await new Promise((r) => setTimeout(r, 300));
  if (!(await ativo())) throw new Error('não consegui abrir o navegador (confira playwright.chrome no config.json)');
  return port;
}

function parar() {
  try {
    if (process.platform === 'win32') execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Where-Object { $_.CommandLine -like '*remote-debugging-port=${port}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"`, { windowsHide: true, stdio: 'ignore' });
    else execSync(`pkill -f -- "--remote-debugging-port=${port}"`, { stdio: 'ignore' });
  } catch (e) {}
}

async function conectar() {
  const { chromium } = cfg.playwrightModulo();
  await iniciar();
  const b = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const ctx = b.contexts()[0];
  // fecha abas que sobraram de uma execução anterior
  const abas = ctx.pages(); for (let i = 1; i < abas.length; i++) await abas[i].close().catch(() => {});
  const p = abas[0] || (await ctx.newPage());
  await p.setViewportSize({ width: 1600, height: 900 });
  return { navegador: b, contexto: ctx, p };
}

module.exports = { iniciar, parar, conectar, ativo, port };
