// Importação XML da NF-e (/nota/nota-fiscal-importacao-xml), do upload até salvar a nota gerada.
// É o único jeito de ligar nota de ENTRADA a pedido de compra (botão "Pedidos" no passo Item).
// args: {arquivo: caminho do .xml, natureza: trecho da opção (ex.: "RECEBIMENTO FUTURO"),
//        item?: item do sistema para o produto do XML (quando "Item ainda não cadastrado"), unidade?: "Unidade",
//        pedido?: ID_PEDIDO a vincular (lista as solicitações APROVADAS do fornecedor do XML), salvar?: true}
// Passos do assistente: Selecionar XML → Motivo da Compra → Fornecedor → Item → Impostos → Financeiro → Finalizar,
// que abre /nota/nota-fiscal/form?load-storage=true em NOVA ABA (o salvar é nessa aba).
// O upload consulta a chave na Sefaz: só XML real AUTORIZADO passa ("NF-e nao consta na base de dados da SEFAZ"
// para XML montado/alterado) e chave já importada dá "Nota Fiscal já cadastrada com essa Chave de Acesso".
// O fornecedor precisa existir como Pessoa com o CNPJ do emitente (passos/pessoa_cnpj.js).
// Observado: com pedido vinculado, a nota baixa a solicitação como recebimento físico (tipo 1 +, tipo 3 −),
// mesmo com natureza de compra futura. Natureza com "Utiliza pedido" torna o pedido obrigatório no passo Item.
module.exports = async (p, lib, a) => {
  const base = p.url().split('/').slice(0, 3).join('/'); const log = [];
  const proximo = async () => { await p.getByRole('button', { name: 'Próximo' }).first().click(); await lib.esperar(p, 5000); };
  await p.goto(base + '/nota/nota-fiscal-importacao-xml'); await lib.esperar(p, 4000);
  const resp = p.waitForResponse((r) => r.url().includes('importacao-xml/nfe-upload'), { timeout: 60000 }).catch(() => null);
  await p.locator('input[type=file]').first().setInputFiles(a.arquivo);
  const up = await resp; log.push(['upload', up ? up.status() : 'sem resposta em 60 s']);
  if (!up || up.status() >= 400) return { erro: 'upload do XML não concluiu', log, detalhe: up ? (await up.text()).slice(0, 300) : null, toasts: await p.locator('.p-toast-message').allInnerTexts() };
  await p.locator('text=Selecione uma Natureza de Operação').waitFor({ timeout: 30000 }).catch(() => {}); await lib.esperar(p, 1500);
  // Motivo da Compra: abrir pela seta do p-autocomplete (digitar e escolher não fixa o valor)
  const natId = await p.locator('label', { hasText: 'Natureza de Operação' }).first().getAttribute('for');
  await p.locator(`p-autocomplete#${natId} button, #${natId} ~ button`).first().click().catch(async () => { await p.mouse.click(1172, 549); });
  await lib.esperar(p, 2500);
  await p.locator('li[role=option]:visible').filter({ hasText: a.natureza }).first().click(); await lib.esperar(p, 2000);
  await proximo(); log.push('natureza');
  await proximo(); log.push('fornecedor');  // fornecedor é achado pelo CNPJ do XML (precisa existir como Pessoa)
  if (a.item) {
    await lib.ac(p, '=Item', a.item, a.item); await lib.esperar(p, 3000);
    const rel = p.locator('.p-dialog:visible', { hasText: 'Atualizar a Relação do Item' });
    if (await rel.count()) { await rel.getByRole('button', { name: 'Sim' }).click(); await lib.esperar(p, 2500); }
    const cond = p.locator('.p-dialog:visible', { hasText: 'Condição' });
    if (await cond.count()) {
      const un = cond.locator('label', { hasText: 'Unidade' }).first().locator('xpath=ancestor::*[.//*[contains(@class,"p-dropdown")]][1]');
      await un.locator('.p-dropdown').first().click(); await lib.esperar(p, 1200);
      const o = p.locator('li[role=option]:visible, li.p-dropdown-item:visible').filter({ hasText: a.unidade || 'Unidade' }).first();
      await o.scrollIntoViewIfNeeded(); await o.click(); await lib.esperar(p, 800);
      await cond.getByRole('button', { name: 'Alterar' }).click(); await lib.esperar(p, 3000); log.push('relação item × fornecedor');
    }
  }
  if (a.pedido) {
    await p.getByRole('button', { name: 'Pedidos' }).first().click(); await lib.esperar(p, 4000);
    const d = p.locator('.p-dialog:visible').last(); log.push(['pedidos', (await d.innerText()).replace(/\n+/g, ' | ').slice(0, 300)]);
    const cb = d.locator('tbody tr', { hasText: String(a.pedido) }).first().locator('.p-checkbox-box, .p-radiobutton-box').first();
    if (!(await cb.evaluate((e) => e.classList.contains('p-highlight')).catch(() => false))) { await cb.click(); await lib.esperar(p, 800); }
    await d.getByRole('button', { name: 'Confirmar' }).click(); await lib.esperar(p, 3000);
  }
  await proximo(); log.push('item');
  await proximo(); log.push('impostos');
  const [nova] = await Promise.all([p.context().waitForEvent('page', { timeout: 20000 }).catch(() => null), p.getByRole('button', { name: 'Finalizar' }).first().click()]);
  if (!nova) return { erro: 'Finalizar não abriu a nota', log, toasts: await p.locator('.p-toast-message').allInnerTexts() };
  await nova.waitForLoadState('networkidle').catch(() => {}); await lib.esperar(nova, 8000);
  if (a.salvar === false) return { log, aba: nova.url() };
  await nova.getByRole('button', { name: 'Salvar' }).first().click(); await lib.esperar(nova, 4000);
  const ac = nova.locator('.p-dialog:visible', { hasText: 'Acerto Financeiro' });
  if (await ac.count()) { await ac.getByRole('button', { name: 'Concluir' }).click(); await lib.esperar(nova, 2500); await nova.getByRole('button', { name: 'Salvar' }).first().click(); await lib.esperar(nova, 8000); }
  const sef = nova.locator('.p-dialog:visible', { hasText: 'Confirmação da operação' });
  if (await sef.count()) { await sef.getByRole('button', { name: 'Fechar' }).first().click(); await lib.esperar(nova, 3000); log.push('fechou confirmação Sefaz sem enviar'); }
  const fim = (await nova.locator('.p-dialog:visible').allInnerTexts()).map((x) => x.slice(0, 120));
  await nova.close();
  return { log, fim };
};
