const path = require('path');
const fs = require('fs');
// Dados pessoais (config, sessão, gravação, perfil do navegador) ficam FORA do plugin, em FILT_QA_HOME (padrão ~/.claude/filt-qa)
const HOME = process.env.FILT_QA_HOME || path.join(require('os').homedir(), '.claude', 'filt-qa');
fs.mkdirSync(HOME, { recursive: true });
const CFG_FILE = path.join(HOME, 'config.json');
if (!fs.existsSync(CFG_FILE)) throw new Error(`Falta ${CFG_FILE}. Copie config.example.json do plugin para lá e preencha com os seus dados.`);
const cfg = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
cfg.home = HOME;
module.paths.push(cfg.playwright.nodeModules);
// pasta de trabalho por tarefa (prints, vídeos, dados.json) — fora do skill; padrão ~/.claude/historico-validacoes
cfg.pastaTarefa = (t) => path.join((cfg.pastaTrabalho || '~/.claude/historico-validacoes').replace(/^~/, require('os').homedir()), t || 'geral');
cfg.base = (numero) => cfg.erp.urlPadrao.replace('{numero}', numero);
// Uma sessão por tarefa (validações em paralelo não se atrapalham): FILT_QA_TAREFA=NMTZ-<n> em todo comando.
// Sem a variável, usa a sessão "padrao". Cada tarefa tem sessão, porta do navegador e perfil próprios.
cfg.tarefa = (process.env.FILT_QA_TAREFA || 'padrao').toUpperCase();
const SESS_DIR = path.join(HOME, 'sessoes'); fs.mkdirSync(SESS_DIR, { recursive: true });
const STATE = path.join(SESS_DIR, cfg.tarefa + '.json');
cfg.arquivoSessao = STATE;
const num = (cfg.tarefa.match(/(\d+)/) || [])[1];
cfg.cdpPort = (cfg.playwright.cdpPort || 9333) + (num ? 1 + (Number(num) % 400) : 0);
cfg.perfilNavegador = path.join(HOME, '.perfil-chrome', cfg.tarefa);
cfg.arquivoGravacao = path.join(SESS_DIR, cfg.tarefa + '.gravacao.json');
cfg.lerSessao = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) { return {}; } };
cfg.gravarSessao = (s) => fs.writeFileSync(STATE, JSON.stringify({ ...cfg.lerSessao(), ...s }, null, 2));
module.exports = cfg;
