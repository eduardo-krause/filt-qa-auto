// Tela: Produtor Rural › Propriedades › Cadastro de Fazendas (/produtor-rural/fazenda/form)
// Proprietário = autocomplete input#Proprietario; "Adicionar Complemento" (button[title="Adicionar Complemento"]) abre o diálogo
// "Complemento" com as abas Geral e Produtor Rural do cadastro de Pessoa (indicador já vem Produtor Rural; o campo é
// input#inscricaoProdutor- sem índice); "Adicionar Endereço" abre o diálogo "Endereço" do cadastro de Pessoa.
// Obrigatórios da fazenda: Nome (#nome), Proprietário, Complemento, Endereço e Área total (#areaTotal).
const { limpo } = require('../../_comum');
const c = require('../../cadastros/pessoa/_complemento');

module.exports = {
  // Cria a fazenda com um complemento NOVO do proprietário (aba Produtor Rural preenchida) e um endereço, e salva.
  // args: { nome, proprietario: 'nome da pessoa', areaTotal: 10,
  //         complemento: { perfil, email, inscricaoProdutor, formaFunrural }, endereco: { tipo?: 'Principal', cep, logradouro, numero, bairro, cidade, uf, telefone } }
  // devolve { indicadorNoDialogo, avisosComplemento, dialogoComplementoFechou, salvar: { via, toasts, dialogos, errosApi, camposObrigatorios }, idFazenda }
  async criarFazendaComComplementoNovo(t, { nome, proprietario, areaTotal = 10, complemento = {}, endereco = {} }) {
    const { p, tela, banco } = t;
    if (!nome || !proprietario) throw new Error('informe args.nome e args.proprietario');
    await tela.abrir(p, '/produtor-rural/fazenda/form');
    await tela.autocomplete(p, p.locator('input#Proprietario').first(), proprietario, proprietario);
    const r = {};
    // complemento novo
    await c.observarToasts(p);
    const add = p.locator('button[title="Adicionar Complemento"]:visible').first();
    await add.waitFor({ timeout: 15000 });
    await add.click(); await tela.pronto(p, 400);
    const dlg = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: /^\s*Complemento\s*$/ }) }).last();
    await dlg.waitFor({ timeout: 10000 });
    const aba = async (nomeAba) => { await dlg.locator('.p-tabview-nav li a').filter({ hasText: new RegExp(`^\\s*${nomeAba}\\s*$`, 'i') }).first().click(); await tela.pronto(p, 300); };
    r.indicadorNoDialogo = limpo(await dlg.locator('p-dropdown#indicadorInscricaoEstadual .p-dropdown-label').first().innerText());
    if (complemento.perfil) {
      await dlg.locator('p-autocomplete#perfilTributario .p-autocomplete-dropdown').first().click();
      const ops = p.locator('.p-autocomplete-panel:visible li');
      await ops.first().waitFor({ timeout: 10000 }).catch(() => {});
      const textos = (await ops.allInnerTexts()).map(limpo);
      const i = textos.findIndex((o) => o === complemento.perfil || o.replace(/^\d+\s*/, '') === complemento.perfil);
      if (i < 0) throw new Error(`perfil "${complemento.perfil}" não está no Perfil tributário do diálogo (tem: ${textos.join(' | ')})`);
      await ops.nth(i).click(); await tela.pronto(p, 300);
    }
    if (complemento.email) for (const id of ['emailPrincipal', 'emailDocumentoEletronico']) await tela.digitar(p, dlg.locator(`input#${id}`).first(), complemento.email);
    await aba('Produtor Rural');
    if (complemento.inscricaoProdutor !== undefined) await tela.digitar(p, dlg.locator('input[id^="inscricaoProdutor"]').first(), complemento.inscricaoProdutor);
    if (complemento.formaFunrural) {
      const d = dlg.locator('p-dropdown#opcaoFunrural .p-dropdown').first();
      await d.click(); await tela.pronto(p, 300);
      const op = p.locator('li.p-dropdown-item:visible').filter({ hasText: new RegExp(`^\\s*${complemento.formaFunrural}\\s*$`, 'i') }).first();
      if (!(await op.count())) throw new Error(`opção "${complemento.formaFunrural}" não está em Forma de recolhimento funrural`);
      await op.click(); await tela.pronto(p, 300);
    }
    await dlg.getByRole('button', { name: 'Salvar', exact: true }).click(); await tela.pronto(p, 800);
    r.dialogoComplementoFechou = !(await dlg.isVisible());
    r.avisosComplemento = await c.toastsVistos(p);
    if (!r.dialogoComplementoFechou) {
      const est = await c.lerEstado(p);
      throw new Error(`diálogo Complemento não fechou no Salvar (quadro: ${est.camposObrigatorios.join(', ') || 'vazio'}; toasts: ${r.avisosComplemento.join(' | ') || 'nenhum'})`);
    }
    r.complementoEscolhido = await p.locator('input#autoCompleteComplemento').first().inputValue();
    // endereço
    await p.locator('button[title="Adicionar Endereço"]').first().click(); await tela.pronto(p, 400);
    const de = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: 'Endereço' }) }).last();
    await de.waitFor({ timeout: 10000 });
    await c.preencherEndereco(t, de, { tipo: 'Principal', ...endereco });
    await c.salvarDialogoEndereco(t, de);
    // dados da fazenda
    await tela.digitar(p, p.locator('input#nome').first(), nome);
    await tela.digitar(p, p.locator('input#areaTotal').first(), tela.moeda(areaTotal));
    r.salvar = await c.salvar(t, { espera: 3000 });
    delete r.salvar.complementos;
    r.idFazenda = await banco.valor('select ID_FAZENDA from FAZENDA where NOME = ? order by ID_FAZENDA desc limit 1', [nome]);
    return r;
  },
};
