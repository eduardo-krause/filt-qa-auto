// Tela: Processos › Financeiro › Duplicatas a Pagar (/financeiro/duplicata-pagar/form?id=N)
const { abrirForm, vencimento, digitarVencimento, dialogoJust, confirmarHabilitado, digitarJustificativa } = require('./_apoio');

module.exports = {
  // Digita a nova Data de Vencimento, preenche a Justificativa na janela "Alteração da Data de Vencimento", Confirmar e Salvar.
  // args: { id, data: 'dd/mm/aaaa', justificativa, salvar = true }
  // → { dialogo, confirmarHabilitado, vencimentoNaTela, camposObrigatorios, salvarCoberto?, salvar: { status, toasts, dialogos }, errosApi }
  // Se o botão Salvar estiver coberto (ex.: lista "Campos obrigatórios" por cima), NÃO clica: devolve salvarCoberto com o elemento de cima.
  async alterarVencimento(t, { id, data, justificativa, salvar = true }) {
    const { p, tela } = t;
    const ini = Date.now();
    if (id) await abrirForm(p, id);
    const v0 = await vencimento(p);
    if (!v0.editavel) throw new Error(`campo Data de Vencimento bloqueado na duplicata ${id}`);
    const r = await digitarVencimento(p, data);
    const out = { dialogo: r.dialogo };
    if (r.dialogo) {
      await digitarJustificativa(p, justificativa);
      out.confirmarHabilitado = await confirmarHabilitado(p);
      if (!out.confirmarHabilitado) throw new Error('botão Confirmar continua desabilitado com a justificativa preenchida');
      await dialogoJust(p).getByRole('button', { name: 'Confirmar' }).click(); await tela.pronto(p, 500);
    }
    out.vencimentoNaTela = (await vencimento(p)).valor;
    // lista "Campos obrigatórios" do formulário (aparece quando o campo fica inválido)
    const vl = p.locator('app-validation-list');
    out.camposObrigatorios = (await vl.count()) ? tela.limpo(await vl.innerText()) : '';
    // Salvar coberto por outro elemento: não contorna (sem force/teclado) — devolve o que está por cima
    const sb = p.locator('button:has-text("Salvar")').first();
    const porCima = await sb.evaluate((e) => { const b = e.getBoundingClientRect(); const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return e.contains(el) ? null : (el.tagName + ' "' + (el.innerText || '').trim().slice(0, 80) + '"'); });
    if (salvar && porCima) { out.salvarCoberto = porCima; return out; }
    if (salvar) {
      await tela.fecharToasts(p);
      out.salvar = await tela.salvar(p);
      out.errosApi = require('../../../motor/lib/rede').errosDesde(p, ini).slice(-5);
    }
    return out;
  },
};
