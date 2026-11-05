// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — botão "Adicionar endereço" no card do complemento → diálogo "Endereço"
const { limpo } = require('../../_comum');
const ap = require('./_apoio');

module.exports = {
  // Adiciona um endereço ao complemento de índice N: tipo (se o dropdown estiver livre), CEP (a busca do CEP preenche
  // o que souber) e completa só os campos que ficaram vazios. Clica o botão de confirmar do diálogo ("Salvar"/"Adicionar"). Não salva a pessoa.
  // Cidade vazia depois do CEP não é escolhida à mão: o passo para com erro (a busca do CEP é o que se quer ver).
  // args: { complemento: 0, tipo?: 'Principal', cep, logradouro, numero, bairro, telefone }
  // devolve { preenchidoPeloCep: {campo: valor}, digitados: [campos], final: [{rotulo, valor}], fechou }
  async adicionarEnderecoAoComplemento(t, { complemento = 0, tipo = 'Principal', cep, logradouro = 'RUA TESTE', numero = '100', bairro = 'CENTRO', telefone = '42999999999' }) {
    const { p, tela } = t;
    if (!cep) throw new Error('informe args.cep');
    const tv = p.locator('p-tabview[id^="dadosAdicionais-"]').nth(complemento);
    if (!(await tv.count())) throw new Error(`complemento ${complemento} não existe no cadastro`);
    const card = tv.locator('xpath=ancestor::p-accordiontab[1]');
    const bt = card.locator('button[title="Adicionar endereço"]').first();
    if (!(await bt.count())) throw new Error(`botão "Adicionar endereço" não encontrado no complemento ${complemento}`);
    await bt.scrollIntoViewIfNeeded(); await bt.click(); await tela.pronto(p, 500);
    const dlg = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: /^\s*Endereço\s*$/ }) }).last();
    await dlg.waitFor({ timeout: 10000 });
    const r = { digitados: [] };
    // tipo de endereço
    const dd = dlg.locator('p-dropdown#tipoEndereco .p-dropdown').first();
    const tipoAtual = limpo(await dd.locator('.p-dropdown-label').innerText().catch(() => ''));
    if (tipoAtual !== tipo && !(await dd.evaluate((e) => e.classList.contains('p-disabled')))) {
      await dd.click(); await tela.pronto(p, 400);
      await p.locator('li.p-dropdown-item:visible, li[role=option]:visible').filter({ hasText: tipo }).first().click(); await tela.pronto(p, 300);
    }
    r.tipo = limpo(await dd.locator('.p-dropdown-label').innerText().catch(() => ''));
    // CEP e busca
    await tela.digitar(p, dlg.locator('p-inputmask#cep input, input#cep').first(), String(cep).replace(/\D/g, '')); await tela.pronto(p, 1500);
    const ler = () => dlg.evaluate((d) => Object.fromEntries(['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'telefonePrincipal'].map((k) => [k, (((x) => (x && x.tagName !== 'INPUT' ? x.querySelector('input') : x))(d.querySelector('#' + k)) || {}).value || ''])));
    r.preenchidoPeloCep = await ler();
    const dar = { logradouro, numero, bairro, telefonePrincipal: telefone };
    for (const [k, v] of Object.entries(dar)) {
      if (r.preenchidoPeloCep[k]) continue;
      await tela.digitar(p, dlg.locator('#' + k).first(), v); r.digitados.push(k);
    }
    const agora = await ler();
    if (!agora.cidade) throw new Error(`a busca do CEP ${cep} não preencheu a Cidade (campos: ${JSON.stringify(agora)})`);
    r.final = (await ap.lerRotulos(dlg)).filter((x) => x.valor !== undefined);
    const col = ap.coletor(p);
    await dlg.getByRole('button', { name: /^(Adicionar|Salvar)$/ }).last().click(); await tela.pronto(p, 600); await col.coletar();
    r.fechou = !(await dlg.count());
    r.avisos = col.lista;
    if (!r.fechou) {
      const inval = await dlg.evaluate((d) => [...d.querySelectorAll('.ng-invalid:not(form)')].filter((e) => !e.querySelector('.ng-invalid')).map((e) => e.id || e.getAttribute('name') || e.tagName));
      throw new Error(`diálogo Endereço não fechou no Adicionar (inválidos: ${inval.join(', ') || 'nenhum'}; avisos: ${r.avisos.join(' | ') || 'nenhum'})`);
    }
    return r;
  },
};
