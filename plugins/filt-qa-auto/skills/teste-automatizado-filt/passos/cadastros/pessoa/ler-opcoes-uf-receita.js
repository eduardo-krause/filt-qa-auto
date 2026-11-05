// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) → modal "Consulta CPF/CNPJ - Receita Federal" já aberta
const { limpo } = require('../../_comum');
const ap = require('./_apoio');

module.exports = {
  // Abre a lista do campo UF da modal pelo botão de seta (sem digitar) e lê cada linha; opcionalmente escolhe uma.
  // Atenção: escolher UF limpa o resultado de uma pesquisa já feita (o passo devolve se havia resultado antes e depois).
  // args: { escolher?: 'PR' (sigla ou nome) }  devolve { valorAntes, opcoes: [texto], total, escolha: { escolhida, valor, via }, resultadoAntes, resultadoDepois, avisos }
  async lerOpcoesUfReceita(t, { escolher }) {
    const { p } = t;
    const m = ap.modal(p);
    if (!(await m.count())) throw new Error(`modal "${ap.TITULO}" não está aberta`);
    const inp = m.locator('#consultaUf');
    const r = { valorAntes: await inp.inputValue(), resultadoAntes: (await ap.estadoBotao(m, 'Retornar dados')).habilitado };
    const seta = m.locator('p-autocomplete:has(#consultaUf) .p-autocomplete-dropdown').first();
    if (!(await seta.count())) throw new Error('botão de seta do campo UF não encontrado');
    await seta.click();
    await ap.painelUf(p).first().waitFor({ timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(500);
    const ops = await ap.opcoesUf(p);
    r.opcoes = ops.map((o) => o.texto); r.total = ops.length;
    r.siglaSeparada = ops.every((o) => !!o.sigla);
    if (escolher) {
      r.escolha = await ap.escolherUf(p, m, escolher, { digitar: false });
      if (r.escolha.via !== 'mouse') t.anotar(`ATENÇÃO: UF "${escolher}" não ficou no campo pelo clique (${JSON.stringify(r.escolha)})`);
    } else { await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
    r.valorDepois = await inp.inputValue();
    r.painelAbertoDepois = (await ap.painelUf(p).count()) > 0;
    r.resultadoDepois = (await ap.estadoBotao(m, 'Retornar dados')).habilitado;
    r.numeroRetornadoDepois = limpo(await m.locator('.card-dados-retornados input').first().inputValue().catch(() => ''));
    r.avisos = (await ap.avisos(p));
    return r;
  },
};
