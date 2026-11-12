// Sessão: troca o usuário logado no meio de um caso (mesmo AT e mesma base da sessão da suíte).
const cfg = require('../../../motor/lib/config');
const login = require('../../../motor/lib/login');
const rede = require('../../../motor/lib/rede');

module.exports = {
  // args: { usuario: 'principal' | 'secundario' } → { usuario, empresa }
  // Permissão só vale depois de um login/recarga: usar este passo depois de mudar grupo de usuários.
  async entrar(t, { usuario = 'principal' }) {
    const s = cfg.lerSessao();
    if (!s.base || !s.empresa || !s.tarefa) throw new Error('sessão da suíte sem base/empresa (o motor não logou?)');
    const t0 = Date.now();
    const r = await login(t.p, { tarefa: s.tarefa, url: s.base, base: s.empresa, usuario });
    rede.esquecerAnteriores(t.p, t0);
    await t.tela.pronto(t.p, 800);
    return { usuario: r.usuario, empresa: r.empresa };
  },
};
