// Tela: Processos › Financeiro › Duplicatas a Pagar (/financeiro/duplicata-pagar/form?id=N) — seção Dados para Pagamento.
const { abrirForm, dialogoJust } = require('./_apoio');

module.exports = {
  // Troca só a Linha Digitável (Dados para Pagamento) e salva. args: { id, linha: '123...' }
  // → { editavel, dialogoVencimento, salvar: { status, toasts, dialogos }, errosApi }
  async alterarLinhaDigitavel(t, { id, linha }) {
    const { p, tela } = t;
    const ini = Date.now();
    await abrirForm(p, id);
    const i = p.locator('input#linhaDigitavel');
    await i.scrollIntoViewIfNeeded();
    const editavel = await i.evaluate((e) => !e.disabled);
    if (!editavel) return { editavel };
    await tela.digitar(p, i, linha);
    await tela.fecharToasts(p);
    const salvar = await tela.salvar(p);
    const dialogoVencimento = (await dialogoJust(p).count()) > 0;
    return { editavel, dialogoVencimento, salvar, errosApi: require('../../../motor/lib/rede').errosDesde(p, ini).slice(-5) };
  },
};
