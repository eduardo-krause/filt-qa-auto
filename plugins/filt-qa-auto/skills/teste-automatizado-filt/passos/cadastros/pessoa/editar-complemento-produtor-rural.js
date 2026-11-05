// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — complemento N, abas Geral e Produtor Rural. NÃO salva.
const c = require('./_complemento');

module.exports = {
  // Edita o complemento N (1 = primeiro): Indicador inscrição estadual (aba Geral) e/ou Inscrição produtor (aba Produtor Rural);
  // no fim deixa aberta a aba pedida e, se pedido, recolhe o card do complemento.
  // args: { id? (abre/recarrega a pessoa antes), complemento: 1, indicador?: 'Produtor Rural'|'Isento'|..., inscricaoProdutor?: '251040004' ('' = limpar),
  //         formaFunrural?: 'Comercialização' (Forma de recolhimento funrural — obrigatória quando há Inscrição produtor),
  //         abaFinal?: 'Geral'|'Endereços'|'Produtor Rural', recolher?: true }
  // devolve o estado da tela (lerEstado) depois da edição
  async editarComplementoProdutorRural(t, { id, complemento = 1, indicador, inscricaoProdutor, formaFunrural, abaFinal, recolher }) {
    const { p } = t;
    if (id) await c.abrirPessoa(t, id);
    if ((await c.quantos(p)) < complemento) throw new Error(`a pessoa não tem o complemento ${complemento} na tela`);
    await c.alternarCard(t, complemento, true);
    if (indicador) await c.escolherIndicador(t, complemento, indicador);
    if (inscricaoProdutor !== undefined && inscricaoProdutor !== null) await c.informarInscricaoProdutor(t, complemento, inscricaoProdutor);
    if (formaFunrural) await c.escolherFunrural(t, complemento, formaFunrural);
    if (abaFinal) await c.abrirAba(t, complemento, abaFinal);
    if (recolher) await c.alternarCard(t, complemento, false);
    return c.lerEstado(p);
  },
};
