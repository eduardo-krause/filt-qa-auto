// Tela: Cadastros › Pessoa (/fiscal/pessoa/form, cadastro novo)
const c = require('./_complemento');

module.exports = {
  // Abre um cadastro novo, informa CPF (se a modal "Consulta CPF/CNPJ - Receita Federal" abrir, Cancelar) e Nome, preenche o
  // complemento principal (perfil, e-mails, indicador) e, se informado, o endereço principal. salvar: false deixa na tela sem salvar.
  // args: { cpf, nome, perfil: 'Consumidor Final', email, indicador?: 'Isento', endereco?: { logradouro, numero, bairro, cidade, uf, telefone, cep? }, salvar?: true }
  // devolve { id (do banco, pelo CPF; null se não gravou), salvar: { toasts, camposObrigatorios, ... } | null, modalReceita }
  async incluirPessoaFisica(t, { cpf, nome, perfil, email, indicador, endereco, salvar = true }) {
    const { p, tela, banco } = t;
    if (!cpf || !nome) throw new Error('informe args.cpf e args.nome');
    await tela.abrir(p, '/fiscal/pessoa/form');
    const ident = p.locator('input#identificacao').first();
    await ident.waitFor({ timeout: 30000 });
    await tela.digitar(p, ident, cpf);
    // o card do complemento só aparece depois do CPF (a tela decide PF/PJ pelo documento)
    await c.tv(p, 1).waitFor({ state: 'attached', timeout: 30000 });
    // a consulta à Receita pode abrir sozinha ao sair do CPF
    const modal = p.locator('.p-dialog.consulta-receita-federal:visible').first();
    await modal.waitFor({ timeout: 4000 }).catch(() => {});
    const modalReceita = (await modal.count()) > 0;
    if (modalReceita) { await modal.getByRole('button', { name: 'Cancelar', exact: true }).click(); await tela.pronto(p, 400); }
    await tela.digitar(p, p.locator('input#nome-cpf').first(), nome);
    await c.preencherGeral(t, 1, { perfil, email, indicador });
    if (endereco) {
      const b = c.card(p, 1).locator('button[title="Adicionar endereço"]').first();
      await b.scrollIntoViewIfNeeded(); await b.click(); await tela.pronto(p, 400);
      const dlg = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: 'Endereço' }) }).last();
      await dlg.waitFor({ timeout: 10000 });
      await c.preencherEndereco(t, dlg, { tipo: 'Principal', ...endereco });
      await c.salvarDialogoEndereco(t, dlg);
    }
    if (!salvar) return { id: null, salvar: null, modalReceita };
    const s = await c.salvar(t, { espera: 3000 });
    const id = await banco.valor('select ID_PESSOA from PESSOA where IDENTIFICACAO = ? order by ID_PESSOA desc limit 1', [String(cpf).replace(/\D/g, '')]);
    return { id, salvar: s, modalReceita };
  },
};
