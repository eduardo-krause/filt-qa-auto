// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — cadastro já preenchido na tela (ex.: depois do Retornar dados)
const { limpo } = require('../../_comum');
const ap = require('./_apoio');

module.exports = {
  // Preenche o "Perfil tributário" do complemento principal (opção pedida ou a primeira da lista aberta pela seta) e clica Salvar.
  // Não preenche mais nada: se faltar campo obrigatório, devolve as mensagens exatas.
  // args: { perfil?: 'texto da opção', esperaAvisos?: 4000 }
  // devolve { perfil: { opcoes, escolhida, valor }, avisos, quadroObrigatorios: { texto, classe }, invalidos (rótulos dos campos inválidos visíveis), textosErro, url, idUrl }
  async salvarPessoaComPerfilTributario(t, { perfil, esperaAvisos = 4000 }) {
    const { p, tela } = t;
    const inp = p.locator('input#perfilTributario:visible').first();
    if (!(await inp.count())) throw new Error('campo "Perfil tributário" não encontrado no complemento');
    const r = { perfil: { valorAntes: await inp.inputValue() } };
    const seta = p.locator('p-autocomplete#perfilTributario .p-autocomplete-dropdown:visible').first();
    await seta.click();
    const ops = p.locator('.p-autocomplete-panel:visible li');
    await ops.first().waitFor({ timeout: 10000 }).catch(() => {});
    r.perfil.opcoes = (await ops.allInnerTexts()).map(limpo);
    if (!r.perfil.opcoes.length) throw new Error('lista do "Perfil tributário" abriu vazia');
    const i = perfil ? r.perfil.opcoes.findIndex((o) => o === perfil || o.includes(perfil)) : 0;
    if (i < 0) throw new Error(`opção "${perfil}" não está no Perfil tributário (tem: ${r.perfil.opcoes.join(' | ')})`);
    await ops.nth(i).click(); await tela.pronto(p, 400);
    r.perfil.escolhida = r.perfil.opcoes[i]; r.perfil.valor = await inp.inputValue();
    if (!r.perfil.valor) t.anotar(`ATENÇÃO: o clique na opção "${r.perfil.escolhida}" não preencheu o Perfil tributário`);
    Object.assign(r, await ap.salvarPessoa(t, { esperaAvisos }));
    return r;
  },
};
