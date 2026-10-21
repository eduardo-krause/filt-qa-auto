// Tela: Processos › Vendas › Consulta Estoque/Movimentação (/vendas/consulta-estoque-movimentacao)
// Busca em input.busca-input (o 1º input da página é a busca do menu). Grade: Código, Nome, UN, Preço, Físico, A entregar,
// Saldo, Valor aquisição médio, Marca. Clicar na linha abre o detalhe (/form): cards "Custos e preços" e "Última compra"
// com valores atrás de olhos (ph-eye).

module.exports = {
  // args: { busca, codigo } → { cabecalho:[...], linha:{ coluna: valor }, detalhe: { 'Valor aquisição médio': 'R$ ..', ... }, ultimaCompra: '...' }
  async item(t, { busca, codigo }) {
    const { p, tela } = t;
    await tela.abrir(p, '/vendas/consulta-estoque-movimentacao');
    await p.locator('input.busca-input:visible').first().fill(String(busca));
    await tela.pronto(p, 2500);
    const cabecalho = (await p.locator('thead tr').first().locator('th').allInnerTexts()).map(tela.limpo);
    const linhas = p.locator('tbody tr');
    let alvo = null;
    for (let i = 0, n = await linhas.count(); i < n; i++) {
      const c = (await linhas.nth(i).locator('td').allInnerTexts()).map(tela.limpo);
      if (c[0] === String(codigo)) { alvo = { idx: i, celulas: c }; break; }
    }
    if (!alvo) throw new Error(`item de código ${codigo} não apareceu na busca "${busca}"`);
    const linha = Object.fromEntries(cabecalho.map((h, i) => [h, alvo.celulas[i]]).filter(([h]) => h));
    await linhas.nth(alvo.idx).click(); await tela.pronto(p, 2500);
    const olhos = p.locator('[class*=ph-eye]:visible');
    for (let k = 0, n = await olhos.count(); k < n; k++) { await olhos.nth(k).click().catch(() => {}); await tela.esperar(p, 300); }
    await tela.pronto(p, 600);
    const txt = (await p.locator('body').innerText()).split('\n').map(tela.limpo).filter(Boolean);
    const depois = (rotulo, de = 0) => { const i = txt.indexOf(rotulo, de); return i < 0 ? null : txt[i + 1]; };
    const iUlt = txt.indexOf('Última compra');
    const detalhe = { 'Valor aquisição médio': depois('Valor aquisição médio'), 'Atualizado em': depois('Atualizado em:') };
    const ultimaCompra = iUlt < 0 ? '' : txt.slice(iUlt, iUlt + 9).join(' | ');
    return { cabecalho, linha, detalhe, ultimaCompra };
  },
};
