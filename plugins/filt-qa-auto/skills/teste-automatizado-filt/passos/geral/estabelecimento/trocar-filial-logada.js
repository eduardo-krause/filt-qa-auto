// Topo da tela: botão da filial logada (.toolbar-btn-empresa) › diálogo "Alterar estabelecimento"

module.exports = {
  // args: { codigo: 1001 } → { filial } (texto do botão depois da troca)
  async trocar(t, { codigo }) {
    const { p, tela } = t;
    if (!/\/(home|fiscal|vendas|nota|precificacao)/.test(p.url())) await tela.abrir(p, '/home');
    await p.locator('.toolbar-btn-empresa').first().click(); await tela.pronto(p, 1000);
    const dlg = await tela.dialogo(p);
    if (!dlg) throw new Error('diálogo "Alterar estabelecimento" não abriu');
    const busca = dlg.locator('input.search-input');
    if (await busca.count()) { await busca.fill(String(codigo)); await tela.pronto(p, 800); }
    const linha = dlg.locator('tr', { hasText: String(codigo) }).first();
    if (!(await linha.count())) throw new Error(`estabelecimento ${codigo} não aparece no diálogo`);
    await linha.click(); await tela.pronto(p, 2000);
    await tela.semLoader(p);
    const atual = tela.limpo(await p.locator('.toolbar-btn-empresa').first().innerText());
    if (!atual.includes(String(codigo))) throw new Error(`filial logada não mudou para ${codigo} (topo mostra "${atual}")`);
    return { filial: atual };
  },
};
