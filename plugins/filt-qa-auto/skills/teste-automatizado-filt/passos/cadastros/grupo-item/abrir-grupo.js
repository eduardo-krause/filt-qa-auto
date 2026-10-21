// Tela: Cadastros › Itens › Grupos (/fiscal/grupo-item)

module.exports = {
  // args: { grupo: '3 - DEFENSIVO' }
  async abrir(t, { grupo }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/grupo-item');
    if (!(await tela.semLoader(p))) { t.anotar('ATENÇÃO: loader da tela travado ao abrir — automação recarregou a página'); await p.reload(); await tela.pronto(p, 1000); }
    const no = p.getByText(grupo, { exact: true }).filter({ visible: true }).first();
    await no.waitFor({ timeout: 30000 });
    await tela.pronto(p, 1500);
    await no.click();
    await tela.pronto(p, 1000);
    // o detalhe do grupo aparece ao lado da árvore (o campo de fórmula é o sinal de que abriu)
    await p.locator('input#formulaValorAquisicao').first().waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => { throw new Error(`detalhe do grupo "${grupo}" não abriu ao clicar na árvore`); });
  },
};
