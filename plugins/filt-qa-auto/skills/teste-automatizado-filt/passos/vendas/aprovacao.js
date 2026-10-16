// Tela: Processos › Vendas › Aprovação Pedido (/vendas/aprovacao-pedidos)
// Pedido que cai em ANALISE (regra de validação: desconto, valor...) é aprovado aqui com CPF/senha do usuário logado.
const cfg = require('../../motor/lib/config');

module.exports = {
  // args: { pedido, motivo? }  devolve os avisos (toasts)
  async aprovar(t, { pedido, motivo = 'TESTE AUTOMATIZADO' }) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/aprovacao-pedidos');
    const empresa = cfg.lerSessao().empresa || '';
    const linha = p.locator('tbody tr').filter({ hasText: new RegExp(`${empresa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+${pedido}\\s`) }).first();
    await linha.waitFor({ timeout: 30000 }).catch(() => {});   // a lista carrega depois da tela
    if (!(await linha.count())) throw new Error(`pedido ${pedido} não aparece na Aprovação Pedido`);
    await linha.getByText('APROVAR', { exact: true }).evaluate((e) => (e.closest('button') || e).click()); await tela.pronto(p);
    const dlg = await tela.dialogo(p);
    const u = cfg.erp.usuarios[cfg.lerSessao().usuario || 'principal'];
    const inps = dlg.locator('input:visible, textarea:visible');
    const vals = [u.cpf, u.senha, motivo];
    for (let i = 0; i < Math.min(await inps.count(), 3); i++) { await inps.nth(i).click(); await p.keyboard.type(String(vals[i]), { delay: 20 }); }
    for (const b of ['APROVAR', 'Aprovar', 'Confirmar']) if (await tela.temBotao(p, b, dlg)) { await tela.botao(p, b, { escopo: dlg }); break; }
    return tela.toasts(p);
  },
};
