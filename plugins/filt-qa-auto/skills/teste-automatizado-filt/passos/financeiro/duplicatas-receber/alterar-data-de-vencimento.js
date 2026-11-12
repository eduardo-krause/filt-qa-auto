// Tela: Processos › Financeiro › Duplicatas a Receber (/financeiro/duplicata-receber/form?id=N)
const { abrirForm, vencimento, digitarVencimento, dialogoJust, confirmarHabilitado, digitarJustificativa } = require('./_apoio');

module.exports = {
  // Digita a nova Data de Vencimento; na janela "Alteração da Data de Vencimento" lê o Confirmar com a Justificativa vazia,
  // preenche, Confirmar e Salvar. args: { id, data: 'dd/mm/aaaa', justificativa }
  // → { dialogo, textoDialogo, confirmarVazio, confirmarHabilitado, vencimentoNaTela, salvar: { status, toasts, dialogos }, errosApi }
  async alterarVencimentoReceber(t, { id, data, justificativa }) {
    const { p, tela } = t;
    const ini = Date.now();
    if (id) await abrirForm(p, id);
    const v0 = await vencimento(p);
    if (!v0.editavel) throw new Error(`campo Data de Vencimento bloqueado na duplicata a receber ${id}`);
    const r = await digitarVencimento(p, data);
    const out = { dialogo: r.dialogo };
    if (r.dialogo) {
      out.textoDialogo = tela.limpo(await dialogoJust(p).innerText());
      await digitarJustificativa(p, '');
      out.confirmarVazio = await confirmarHabilitado(p);
      await digitarJustificativa(p, justificativa);
      out.confirmarHabilitado = await confirmarHabilitado(p);
      if (!out.confirmarHabilitado) throw new Error('botão Confirmar continua desabilitado com a justificativa preenchida');
      await dialogoJust(p).getByRole('button', { name: 'Confirmar' }).click(); await tela.pronto(p, 500);
    }
    out.vencimentoNaTela = (await vencimento(p)).valor;
    await tela.fecharToasts(p);
    out.salvar = await tela.salvar(p);
    out.errosApi = require('../../../motor/lib/rede').errosDesde(p, ini).slice(-5);
    return out;
  },
};
