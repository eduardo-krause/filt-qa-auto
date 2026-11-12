// Tela: Cadastros › Usuários › Grupo de Usuários (/master/grupo-usuario/form?id=N) — só lê, fecha em Cancelar.
const { abrirMenu, mapa } = require('./_apoio');

module.exports = {
  // args: { grupo: 40, menu: 'Processos > Financeiro > Duplicatas a Pagar' } → { 'Alterar': false, 'Permitir editar data de vencimento': false, ... }
  async lerPermissoes(t, { grupo, menu }) {
    const { p, tela } = t;
    const { d, toggles } = await abrirMenu(p, { grupo, menu });
    const r = mapa(toggles);
    await tela.botao(p, 'Cancelar', { escopo: d, qual: 'last' });
    return r;
  },
};
