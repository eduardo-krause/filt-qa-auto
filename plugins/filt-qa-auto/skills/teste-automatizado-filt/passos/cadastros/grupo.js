// Tela: Cadastros › Itens › Grupos (/fiscal/grupo-item) — árvore "<id> - <DESCRIÇÃO>"; clicar abre o detalhe ao lado
// (Descrição, Fórmula e Cálculo do Custo, Margem Preço, Precificação...). Salvar no topo grava a árvore toda.

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

  // Rótulos do card Precificação na ordem.
  async rotulosPrecificacao(t) {
    const { p, tela } = t;
    // o menu lateral também tem "Precificação": pegar a última ocorrência (card do detalhe)
    const txt = tela.limpo(await p.locator('body').innerText());
    const i = txt.lastIndexOf('Precificação');
    return i < 0 ? [] : txt.slice(i, i + 400);
  },

  async salvar(t) { const { p, tela } = t; return tela.salvar(p); },
};
