// Tela: Cadastros › Itens › Grupos (/fiscal/grupo-item)

module.exports = {
  // Rótulos do card Precificação na ordem.
  async rotulosPrecificacao(t) {
    const { p, tela } = t;
    // o menu lateral também tem "Precificação": pegar a última ocorrência (card do detalhe)
    const txt = tela.limpo(await p.locator('body').innerText());
    const i = txt.lastIndexOf('Precificação');
    return i < 0 ? [] : txt.slice(i, i + 400);
  },
};
