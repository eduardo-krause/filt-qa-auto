// Ajudantes do Acerto Financeiro de um documento JÁ SALVO (Nota Fiscal, CT-e, Lançamento Financeiro) — não vira passo.
// Fluxo da tela: seção "Acerto Financeiro" do form › Adicionar (#fazAcertoFinanceiro / title="Acerto Financeiro") → diálogo
// "Acerto Financeiro" (Formas de Pagamento + Resumo) › lápis (app-editar) da forma "Duplicata" no Resumo → grade "Parcelas"
// com input[name="dataVencimento-<parcela>"] (ex.: dataVencimento-1/2) → Salvar (da forma) → Concluir → Salvar do form.
const tela = require('../motor/lib/tela');
const rede = require('../motor/lib/rede');
const { limpo, observar } = require('./_comum');

const dialogoAcerto = (p) => p.locator('.p-dialog:visible').filter({ hasText: 'Formas de Pagamento' }).last();

async function abrirForm(p, rota) {
  await tela.abrir(p, rota);
  await tela.semLoader(p);
  await tela.pronto(p, 1500);
}

// Abre o diálogo do acerto pela seção "Acerto Financeiro" do formulário.
async function abrirAcerto(p) {
  let b = p.locator('#fazAcertoFinanceiro:visible, button[title="Acerto Financeiro"]:visible').first();
  if (!(await b.count())) {
    const h = p.locator('.header-principal:visible, p-header:visible').filter({ hasText: 'Acerto Financeiro' }).first();
    b = h.getByRole('button', { name: 'Adicionar' }).first();
  }
  if (!(await b.count())) throw new Error('seção "Acerto Financeiro" sem o botão Adicionar no formulário');
  const desabilitado = await b.isDisabled();
  if (desabilitado) throw new Error('botão Adicionar da seção "Acerto Financeiro" desabilitado');
  await b.click(); await tela.pronto(p, 1200);
  const d = dialogoAcerto(p);
  await d.waitFor({ timeout: 30000 });
  return d;
}

// Lápis da forma "Duplicata" no Resumo do acerto → grade Parcelas.
async function editarDuplicata(p, d) {
  const cab = d.locator('.box-resumo p-header').filter({ hasText: /^\s*Duplicata\s*$/ }).first();
  if (!(await cab.count())) throw new Error(`Resumo do acerto sem a forma Duplicata (Resumo: ${limpo(await d.locator('.box-resumo').innerText().catch(() => ''))})`);
  const lapis = cab.locator('xpath=following-sibling::div[contains(@class,"content-resumo")][1]').locator('app-editar').first();
  if (!(await lapis.count())) throw new Error('forma Duplicata do Resumo sem o botão de editar (lápis)');
  const cls = (await lapis.getAttribute('class')) || '';
  if (cls.includes('disabled-button')) throw new Error('lápis da forma Duplicata desabilitado no Resumo do acerto');
  await lapis.click(); await tela.pronto(p, 1200);
  await d.locator('input[name^="dataVencimento-"]').first().waitFor({ timeout: 20000 });
}

// Linhas da grade Parcelas: [{ parcela: '1/2', duplicata, vencimento, editavel, linha }]
async function lerParcelas(d) {
  const ins = d.locator('input[name^="dataVencimento-"]'); const n = await ins.count(); const out = [];
  for (let i = 0; i < n; i++) {
    const el = ins.nth(i);
    const nome = await el.getAttribute('name');
    const linha = limpo(await el.locator('xpath=ancestor::tr[1]').innerText());
    out.push({ parcela: nome.replace('dataVencimento-', ''), vencimento: await el.inputValue(), editavel: await el.evaluate((e) => !e.disabled && !e.readOnly), linha });
  }
  return out;
}

// Abre o form, o acerto e a forma Duplicata; lê as parcelas e sai pelo Voltar (não grava). → [parcelas]
async function lerVencimentos(t, rota) {
  const { p } = t;
  await abrirForm(p, rota);
  const d = await abrirAcerto(p);
  await editarDuplicata(p, d);
  const parcelas = await lerParcelas(d);
  await d.getByRole('button', { name: 'Voltar' }).first().click(); await tela.pronto(p, 800);
  return parcelas;
}

// Abre o form, troca o vencimento das parcelas no acerto (vencs = { '1/1': 'dd/mm/aaaa' }; vazio = salva o acerto sem mudar),
// opcionalmente troca um campo de texto do form (outro = { seletor: 'textarea#informacaoAdicional', valor }) e salva o form.
// → { antes, digitado, salvarForma: [msgs], concluir: [msgs], depoisConcluir: [parcelas lidas antes do Concluir], eventos, errosApi, url }
async function alterarVencimentos(t, rota, { vencs = {}, outro, acerto = true } = {}) {
  const { p } = t;
  const ini = Date.now();
  await abrirForm(p, rota);
  const out = { antes: null, digitado: {}, salvarForma: [], concluir: [] };
  if (outro) {
    const el = p.locator(outro.seletor).first();
    await el.scrollIntoViewIfNeeded(); await el.click(); await p.keyboard.press('Control+A');
    await p.keyboard.type(outro.valor, { delay: 15 }); await p.keyboard.press('Tab'); await tela.esperar(p, 300);
    out.outro = await el.inputValue();
  }
  if (acerto) {
    const d = await abrirAcerto(p);
    await editarDuplicata(p, d);
    out.antes = await lerParcelas(d);
    for (const [parc, data] of Object.entries(vencs)) {
      const inp = d.locator(`input[name="dataVencimento-${parc}"]`);
      if (!(await inp.count())) throw new Error(`parcela ${parc} não existe na grade (tem: ${out.antes.map((x) => x.parcela).join(', ')})`);
      if (!(await inp.evaluate((e) => !e.disabled && !e.readOnly))) throw new Error(`vencimento da parcela ${parc} bloqueado na grade do acerto`);
      await tela.data(p, inp, data);
      out.digitado[parc] = await inp.inputValue();
    }
    await tela.fecharToasts(p);
    // o Salvar da forma só habilita depois de "Gerar" (parcelas novas); editando a parcela existente a grade já é a do acerto → Concluir
    const sf = d.getByRole('button', { name: 'Salvar', exact: true }).first();
    out.salvarFormaHabilitado = await sf.isEnabled();
    if (out.salvarFormaHabilitado) {
      const s = await observar(t, sf, { minimo: 1500 });
      out.salvarForma = s.eventos.filter((e) => !/^DIALOGO: Acerto Financeiro/.test(e));
    }
    out.depoisSalvarForma = await d.locator('.box-resumo').innerText().then(limpo).catch(() => '');
    const c = await observar(t, d.getByRole('button', { name: 'Concluir', exact: true }).first(), { minimo: 1500 });
    out.concluir = c.eventos.filter((e) => !/^DIALOGO: Acerto Financeiro/.test(e));
    out.acertoFechou = !(await dialogoAcerto(p).count());
    if (!out.acertoFechou) throw new Error('o Concluir não fechou o acerto: ' + [...out.salvarForma, ...out.concluir].join(' | ').slice(0, 400));
  }
  await tela.fecharToasts(p);
  const r = await observar(t, p.locator('button:has-text("Salvar")').first(), { minimo: 5000 });
  out.eventos = r.eventos;
  out.errosApi = rede.errosDesde(p, ini).slice(-6);
  // diálogos de fim que só informam (recibo / confirmação) são fechados para a tela seguir
  for (const txt of ['Imprimir Recibo', 'Confirmação da operação']) {
    const dl = p.locator('.p-dialog:visible', { hasText: txt });
    if (await dl.count()) { await dl.getByRole('button', { name: 'Fechar' }).first().click().catch(() => {}); await tela.pronto(p); }
  }
  out.url = p.url();
  return out;
}

module.exports = { dialogoAcerto, abrirForm, abrirAcerto, editarDuplicata, lerParcelas, lerVencimentos, alterarVencimentos };
