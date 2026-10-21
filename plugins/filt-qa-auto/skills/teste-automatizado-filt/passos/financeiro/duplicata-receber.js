// Tela: Processos › Financeiro › Duplicatas a Receber (/financeiro/duplicata-receber/form?id=N)
const { limpo, observar } = require('../_comum');

module.exports = {
  // Opções do menu ⋮ do form da duplicata. args: { id }
  async opcoes(t, { id }) {
    await t.tela.abrir(t.p, '/financeiro/duplicata-receber/form?id=' + id);
    return t.tela.menuKebab(t.p);
  },

  // ⋮ → Gerar Boleto / Reimprimir Boleto → (conta) → desmarca e-mail → Emitir, juntando avisos e PDFs.
  // args: { id, acao: 'Gerar Boleto' | 'Reimprimir Boleto', conta?, pastaPdf?, prefixo? }
  // devolve { dialogo (texto antes de emitir), eventos, errosApi, pdfs }
  async boleto(t, { id, acao = 'Gerar Boleto', conta, pastaPdf, prefixo }) {
    const { p, tela } = t;
    await tela.abrir(p, '/financeiro/duplicata-receber/form?id=' + id);
    await tela.menuKebab(p, acao);
    const dlg = p.locator('.p-dialog:visible').last();
    await dlg.waitFor({ timeout: 20000 });
    const email = dlg.locator('.p-checkbox-box').first();
    if ((await email.count()) && (await email.getAttribute('aria-checked')) === 'true') { await email.click(); await tela.pronto(p); }
    if (conta) {
      const inp = dlg.locator('.p-autocomplete input, input[role=searchbox]').first();
      if ((await inp.count()) && (await inp.isEditable().catch(() => false))) await tela.autocomplete(p, inp, conta);
    }
    const dialogo = limpo(await dlg.innerText()).slice(0, 600);
    // o botão de confirmação é "Emitir" no Gerar Boleto e "Reimprimir" no Reimprimir Boleto
    const nome = (await tela.temBotao(p, 'Emitir', dlg)) ? 'Emitir' : 'Reimprimir';
    const r = await observar(t, dlg.getByRole('button', { name: nome, exact: true }).first(), { minimo: 8000, pastaPdf, prefixo: prefixo || `dup${id}` });
    return { dialogo, ...r };
  },
};
