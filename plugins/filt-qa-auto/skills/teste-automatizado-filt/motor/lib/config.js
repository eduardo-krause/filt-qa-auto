// Configuração do motor.
// - Credenciais, banco e Playwright vêm do MESMO config.json do validador (~/.claude/filt-qa/config.json),
//   para a pessoa não configurar duas vezes. O motor só LÊ esse arquivo.
// - Sessões, perfil do navegador e porta são PRÓPRIOS (~/.claude/filt-qa-auto), para não conflitar com o validador.
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOME_VALIDADOR = process.env.FILT_QA_HOME || path.join(os.homedir(), '.claude', 'filt-qa');
const HOME = process.env.FILT_QA_AUTO_HOME || path.join(os.homedir(), '.claude', 'filt-qa-auto');
const CFG_FILE = path.join(HOME_VALIDADOR, 'config.json');
if (!fs.existsSync(CFG_FILE)) {
  throw new Error(`Falta ${CFG_FILE}. Ele é criado por ferramentas/configurar.py (ver referencias/primeira-vez.md) — prepare a máquina antes.`);
}
const cfg = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
fs.mkdirSync(path.join(HOME, 'sessoes'), { recursive: true });

cfg.home = HOME;
cfg.tarefa = (process.env.FILT_QA_TAREFA || 'padrao').toUpperCase();
const num = (cfg.tarefa.match(/(\d+)/) || [])[1];
// faixa de portas diferente da do validador (cdpPort + 1..400) para os dois rodarem juntos sem se atrapalhar
cfg.cdpPort = (cfg.playwright.cdpPort || 9333) + 500 + (num ? 1 + (Number(num) % 400) : 0);
cfg.perfilNavegador = path.join(HOME, '.perfil-chrome', cfg.tarefa);
cfg.arquivoSessao = path.join(HOME, 'sessoes', cfg.tarefa + '.json');
cfg.lerSessao = () => { try { return JSON.parse(fs.readFileSync(cfg.arquivoSessao, 'utf8')); } catch (e) { return {}; } };
cfg.gravarSessao = (s) => fs.writeFileSync(cfg.arquivoSessao, JSON.stringify({ ...cfg.lerSessao(), ...s }, null, 2));

// pasta de trabalho da tarefa (a mesma do validador): ~/.claude/historico-validacoes/<tarefa>
cfg.pastaTarefa = (t) => path.join((cfg.pastaTrabalho || '~/.claude/historico-validacoes').replace(/^~/, os.homedir()), t || cfg.tarefa);
cfg.pastaHistorico = () => (cfg.pastaTrabalho || '~/.claude/historico-validacoes').replace(/^~/, os.homedir());

// Playwright: o mesmo instalado para o validador
cfg.playwrightModulo = () => {
  try { return require(path.join(cfg.playwright.nodeModules, 'playwright')); } catch (e) { return require('playwright'); }
};

module.exports = cfg;
