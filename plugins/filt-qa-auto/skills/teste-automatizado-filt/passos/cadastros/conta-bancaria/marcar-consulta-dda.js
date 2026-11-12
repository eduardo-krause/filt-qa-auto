// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
// Marca ou desmarca o checkbox "Consulta DDA" pelo clique na caixa. args: { marcar: true|false }  devolve o estado (lerDda) + dialogos
module.exports = {
  async consultaDda(t, { marcar = true } = {}) {
    const { p, tela } = t;
    const ler = require('./ler-configuracao-dda').lerDda;
    const antes = await ler(t);
    if (!antes.checkboxVisivel) throw new Error('checkbox Consulta DDA não aparece na conta');
    if (antes.marcado !== !!marcar) { await p.locator('p-checkbox#consultaDda .p-checkbox-box').click(); await tela.pronto(p, 500); }
    const r = await ler(t);
    if (r.marcado !== !!marcar) throw new Error(`clique no checkbox Consulta DDA não trocou o estado (continua ${r.marcado ? 'marcado' : 'desmarcado'})`);
    return { ...r, dialogos: await tela.textoDialogos(p) };
  },
};
