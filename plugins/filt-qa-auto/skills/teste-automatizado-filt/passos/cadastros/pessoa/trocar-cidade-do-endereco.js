// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — aba Endereços do complemento, lápis da linha. NÃO salva a pessoa.
const { limpo } = require('../../_comum');
const c = require('./_complemento');

module.exports = {
  // Troca a cidade do endereço (Principal por padrão) do complemento N pelo lápis da linha e salva o diálogo.
  // args: { complemento: 1, tipo: 'Principal', cidade: 'Pato Branco', uf: 'PR' }  devolve { enderecos, avisos }
  async trocarCidadeDoEndereco(t, { complemento = 1, tipo = 'Principal', cidade, uf }) {
    const { p, tela } = t;
    if (!cidade) throw new Error('informe args.cidade');
    await c.alternarCard(t, complemento, true);
    await c.abrirAba(t, complemento, 'Endereços');
    await c.observarToasts(p);
    const linha = c.tv(p, complemento).locator('.p-tabview-panel:not([hidden]) tbody tr').filter({ hasText: tipo }).first();
    if (!(await linha.count())) throw new Error(`endereço "${tipo}" não está na aba Endereços do complemento ${complemento}`);
    await linha.scrollIntoViewIfNeeded(); await linha.hover();
    const lapis = linha.locator('i.ph-pencil-simple, i[class*=pencil], button[title*=Editar], span[class*=pencil]').first();
    if (!(await lapis.count())) throw new Error(`lápis de edição não encontrado na linha "${tipo}" (linha: ${limpo(await linha.innerText())})`);
    await lapis.click(); await tela.pronto(p, 400);
    const dlg = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: 'Endereço' }) }).last();
    await dlg.waitFor({ timeout: 10000 });
    await c.escolherCidade(t, dlg, cidade, uf);
    await c.salvarDialogoEndereco(t, dlg);
    return { enderecos: await c.lerEnderecos(t, complemento), avisos: (await c.toastsVistos(p)).map(limpo) };
  },
};
