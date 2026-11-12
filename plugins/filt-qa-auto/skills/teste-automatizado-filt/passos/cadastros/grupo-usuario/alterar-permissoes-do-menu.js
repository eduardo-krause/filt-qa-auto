// Tela: Cadastros › Usuários › Grupo de Usuários (/master/grupo-usuario/form?id=N) › Adicionar › Menu → liga/desliga ações → Salvar do diálogo.
const { abrirMenu, lerToggles, mapa } = require('./_apoio');

module.exports = {
  // args: { grupo, menu: 'Processos > Financeiro > Duplicatas a Pagar', ligar: ['Permitir editar data de vencimento'], desligar: [] }
  // → { antes, depois (lido no diálogo antes de salvar), toasts }. O clique é no próprio toggle (mouse); se não trocar, para com erro (não contorna).
  async alterarPermissoes(t, { grupo, menu, ligar = [], desligar = [] }) {
    const { p, tela } = t;
    const { d, toggles } = await abrirMenu(p, { grupo, menu });
    const antes = mapa(toggles);
    for (const x of toggles) {
      const quer = ligar.includes(x.titulo) ? true : desligar.includes(x.titulo) ? false : null;
      // lê de novo: ligar uma ação pode ligar outra junto (ex.: Alterar liga Visualizar)
      const atual = await x.el.evaluate((e) => e.className.includes('checked'));
      if (quer === null || quer === atual) continue;
      await x.el.locator('label, button, .mdc-switch, .mat-slide-toggle-bar').first().click(); await tela.esperar(p, 500);
      const agora = await x.el.evaluate((e) => e.className.includes('checked'));
      if (agora !== quer) throw new Error(`toggle "${x.titulo}" não trocou com o clique do mouse (continua ${agora})`);
    }
    for (const n of [...ligar, ...desligar]) if (!(n in antes)) throw new Error(`ação "${n}" não existe no menu ${menu} (tem: ${Object.keys(antes).join(' | ')})`);
    const depois = mapa(await lerToggles(d));
    await tela.botao(p, 'Salvar', { escopo: d, qual: 'last' });
    await tela.pronto(p, 1500);
    const toasts = await tela.toasts(p);
    if (await d.isVisible()) await tela.botao(p, 'Cancelar', { escopo: d, qual: 'last' }).catch(() => {});
    return { antes, depois, toasts };
  },
};
