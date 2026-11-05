// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — botão "Adicionar endereço" do cabeçalho do complemento → diálogo "Endereço". NÃO salva a pessoa.
const { limpo } = require('../../_comum');
const c = require('./_complemento');

module.exports = {
  // Adiciona um endereço ao complemento N e salva o diálogo. Cidade pelo autocomplete (nome + UF).
  // args: { complemento: 1, tipo: 'Principal'|'Alternativo'|'Cobrança', cep?, logradouro, numero, bairro, cidade, uf, telefone }
  // devolve { enderecos: ['Principal | CEP | Logradouro | Nº | Bairro | Cidade | UF', ...], avisos }
  async adicionarEndereco(t, { complemento = 1, ...e }) {
    const { p, tela } = t;
    await c.alternarCard(t, complemento, true);
    await c.observarToasts(p);
    const b = c.card(p, complemento).locator('button[title="Adicionar endereço"]').first();
    if (!(await b.count())) throw new Error(`botão "Adicionar endereço" não encontrado no complemento ${complemento}`);
    await b.scrollIntoViewIfNeeded(); await b.click(); await tela.pronto(p, 400);
    const dlg = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: 'Endereço' }) }).last();
    await dlg.waitFor({ timeout: 10000 });
    await c.preencherEndereco(t, dlg, e);
    await c.salvarDialogoEndereco(t, dlg);
    return { enderecos: await c.lerEnderecos(t, complemento), avisos: (await c.toastsVistos(p)).map(limpo) };
  },
};
