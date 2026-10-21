// Tela: Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)

module.exports = {
  // Fórmula montada na tela de um cadastro existente (espera os termos carregarem). → [termos]
  async montada(t, { id }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/formula/form?id=' + id);
    const li = p.locator('app-montagem-de-formula #center li');
    await li.first().waitFor({ timeout: 15000 }).catch(() => {});
    return (await li.allInnerTexts()).map(tela.limpo);
  },
};
